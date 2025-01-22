
import sys
# for production
#sys.path.append('C:\\control-app\\appEnv\\sql_getter_app')


import json
import datetime
from flask.globals import current_app

import flask_login
import logging
import pdfkit # this is a wraper for the wkhtmltopdf tool https://wkhtmltopdf.org/downloads.html
from flask import Blueprint, render_template, request, make_response, abort
from markupsafe import Markup
from sqlalchemy import text
from sqlalchemy import bindparam
from sqlalchemy.exc import InvalidRequestError, StatementError
from urllib import parse # to decode the base 64 encoded filter string on a url

from .collection import db, production, versionString
from .menuCreation import getMenuForRole
from .createTableHtml import tableHtml
from .auth import login_required
from .sqlCommandClass import sqlCommands


bp = Blueprint("crud", __name__)
LOG = logging.getLogger(__name__)

def a():
    return getKeys('User')

# returns a dict of column names for the specified table given the table name
def getKeys(dName = 'User'):
    
    # run the sql command with the 'name' parameter equal to dName
    keys = db.engine.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = :name"), {'name':dName}).fetchall()
    # check to see if it returned anything and raise an error if so
    if len(keys) == 0:
        print(keys)
        raise Exception(f'getKeys was passed an invalid table name: {dName}')
    return keys

# helper function for getOrderedKeys, swaps items in a list
def swapPositions(array, pos1, pos2):
    try: # we put this in a try just in case there is an out of range error with the columns for some reason
        if pos1 != pos2:
            # popping both the elements from list 
            first_ele = array.pop(pos1)    
            second_ele = array.pop(pos2-1) 
            # inserting in each others positions 
            array.insert(pos1, second_ele)   
            array.insert(pos2, first_ele)   
        return array
    except:
        pass

# same as getKeys except that it also orders the keys as layed out in the TabOrder table
def getOrderedKeys(dName):
    # get a list of the keys for that table
    keys = getKeys(dName)
    # run a command that searches the TabOrder table for the order of the dName columns and returns the column names in order
    keyOrder = db.engine.execute(text("SELECT columnName FROM TabOrder WHERE tableName = :name ORDER BY tabOrder"), {'name':dName}).fetchall()
    # we can't just return the keyOrder array: if someone accidentally deleted a row in tabOrder then that corresponding row would
    #   never appear in the table.
    #   instead we loop through the keys object and use the keyOrder object to sort it.
    # for each key in keyorder...
    for pos, posKey in enumerate(keyOrder):
        for index, key in enumerate(keys):
            # if the column name in both tables are the same move the column in keys to the position in keyOrder
            if key[0] == posKey[0]:
                swapPositions(keys, pos, index)
    # here we will remove the 'userIdModified' column. It's used to tell the audit tables who edited a row, 
    # but there is no reason to see it in the final table
    keys.remove(('userIdModified',))
    ############################################ Active Mod #########################################################################
    try:
        keys.remove(('active',))
    except Exception as err:
        print('could not remove active column, doesn\'t exist?')

    return keys

# get the types of columns given the the tablename ( can be an unsafe string )
def getColumnTypes(dName):
    # execute the command
    result = db.engine.execute(text("""select COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE 
        from INFORMATION_SCHEMA.COLUMNS 
        where TABLE_NAME=:tableName;"""), {'tableName':dName}).fetchall()
    # check to see if it returned anything and raise an error if nothing
    if len(result) == 0: raise Exception(f'getColumnTypes was passed an invalid table name: {dName}')
    # store the sql result in a json friendly format
    types = dict()
    for row in result: 
        types[row['COLUMN_NAME']] = {column: value for column, value in row.items()}

    return types

# get the id columns name of a table given the table name as a string (can be an unsafe string)
def getIdColumn(dName):
    # sql command that looks through the INFORMATION_SCHEMA.KEY_COLUMN_USAGE table for the primary key
    command = text("""SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME LIKE :name AND CONSTRAINT_NAME LIKE 'PK%'""")
    # execute the command with the 'name' parameter
    result = db.engine.execute(command, {'name':dName}).fetchall()
    # check to see if the tableName was valid and raise an error if not
    if len(result) == 0:
        raise Exception(f'getIdColumn was passed an invalid table name: {dName}. Or the table does not have a ')

    return str(result[0][0])

# verifies if a column name is in a table
#   call this before putting a column name in a SQL
#   text to help prevent sql injection attacks
def verifyColumn(keys, unsafe):
    for key in keys:
        keyText = key[0]
        if keyText == unsafe:
            return True
    return False

# does the same thing as verifyColumn but is for when there is no list of keys
# handy. It checks for only the column (so we don't have to find all the columns)
# as an added bonus we can also verify the table name with it
def verifyColumnAndTableName(tableName, unsafe):
    # search the database system's columns table for our tableName and column
    sqlCommand = text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = :name AND COLUMN_NAME = :unsafe")
    result = db.engine.execute(sqlCommand, {'name':tableName, 'unsafe':unsafe}).fetchall()
    # return true if there is as least matching column
    return (len(result) > 0)



# verifies if a tableName is really a table Name given the name
#   we have to do this to prevent sql injection attacks, but if we would like to
#   reduce the amount of sql requests needed then this could be changed to check it agains a list in
#   python.
def verifyTableName(unsafe):
    command = text("""SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = :unsafeName;""")
    result = db.engine.execute(command, {'unsafeName':unsafe}).fetchall()
    
    return (len(result) > 0)


# This is the big one, it gets the table from the database and returns the html for that table
#@param dName = the name of the table
#       mask = the display name of the table
#       columnTypes = an optional columnTypes object that can be used in place of the one generated by crud.py/getColumnTypes()
#       message = an optional message to be displayed at the top of the table
def pull(dName = "BBMD", mask=None, columnTypes=None, message=None):
    # if a mask is not provided have it be the dName
    if mask is None: mask = dName

    User = flask_login.current_user
        # fetch the permissions object for this table
    tablePermissions = User.getPermissionsObject(dName)

    # uncomment these 2 lines if you want to track how long each process takes
    #from .collection import profiled
    #with profiled():
        # check to see if the user has view permissions for the table
    if tablePermissions['canView']:
            # retrieve the keys for the table
        keys = getOrderedKeys(dName)
            # start an instance of our tableHtml class (it generates table html and fetches linked elements)
        code = tableHtml(User, dName, getIdColumn(dName))
        code.newHeader(keys)

            #construct a string with the columns seperated by commas
        columns = str()
        for key in keys:
            columns += str(key[0]) + ','
        columns = columns[:-1] # get rid of the last comma

            # start an instance of our sqlCommands class and use it to take the 'filter' url string from the javascript
            #   (if there is one) and turn it into an sql where clause
        filter = sqlCommands(dName)
            # decode the data
        whereDataRaw = request.args.get('filter', default=False)
            # feed the data to the sqlCommands class, parse.unquote undoes the base 64 bit encoding done on url strings to sanitize them (no slashes)
        if (whereDataRaw is not False): filter.where(parse.unquote(whereDataRaw))
        else: filter.where("")
            # check to see if we are showing the deleted rows
        if (whereDataRaw is not False and filter.showDeleted): showDeletedRows = True
        else: showDeletedRows = False
    
            # if we are showing deleted rows fetch the activa column as well
        if (showDeletedRows): command = f"SELECT {columns}, active FROM [{dName}] WHERE (active = 1 or active = 0) {filter.text}"
        else: command = f"SELECT {columns} FROM [{dName}] WHERE active = 1 {filter.text}"
        print(filter.text)
        
            # execute the string with the where parameters
        result = db.engine.execute(text(command), filter.insertDict).fetchall()
            # feed the result to the tableHtml class so it can do it's thing (tellin git wether we are showing deleted rows)
        code.content(result, showDeletedRows)

        # picks which columns are uneditable in our case the userIdModified and the primark key column
        uneditableList = ['userIdModified', code.PK]

        # fetch the column types if they are not already supplied
        if (columnTypes is None): columnTypes = getColumnTypes(dName) 
    
        # return the html generated by the table.html template (it's a file in the folder templates)
        return render_template('table.html',
                body=code.html, # string - the html for the table
                userN=User.fullName, # string - the users name
                userId=User.tableId, # string - the users Id number
                linkedColData=code.linkedElements(), # object - from the linked data file
                testing='false', # string - testing (should be false here)
                columns=code.columnArray, # list - of the columns
                uneditableColumns=uneditableList, # list - columns that shouldn't be edited
                permissionsObject=tablePermissions, # object - the permissions of the user
                tableName=dName, # string - the name of the table (must be the sql name)
                role=User.roleText, # string - the role for the user, 'Admin', 'Mechanic', etc
                columnTypes=columnTypes, # object - the columns with their types
                linkedChildrenExist=(len(getLinkedChildren(dName)) > 0), # boolean - if 'linked' buttons should be added
                mask=mask, # string - the title for the table
                title=f'Controls: {mask} Table', # string - the title for the page (the name that appears on the tab)
                pageOnLoadFunction='init()', # here we set the javascript function to run on startup
                isAdmin=User.isAdmin, # if the user is an admin or not
                production=production, # a boolean that tells us to run the site in production mode or not
                menuObject=getMenuForRole(User), # the menu to be displayed
                versionString=versionString, # the version of the app we are using
                message=message # an optional message to be displayed above the table
            )
    else:
        # if the user can't view the table return the unauthorized error page
        abort(403)


#updates and creates new entries in the table
#
#data is found in request.data which contains a json of format:
#{
#    info:{
#        id:## id number of row or 'new' if its a new entry ##,
#        table:## table name ##
#   },
#    data:{
#        key1:value1,
#        key2:value2,
#        ...
#    }
#}
#   
@bp.route('/update', methods=['POST', 'PUT'])
def updateTable():
    User = flask_login.current_user
    # catch a user who is not logged in
    if (not User.is_authenticated):
        return 'unauthorized', 403
        # We execute this code in a try statement so that errors in SQL data entry can be redirected to the client as text
    try:
        # extract the parts of the data we want
        outer_shell = json.loads(request.data)
        print(request.data)
        id_shell = outer_shell['info']
        data_shell = outer_shell['data']
        
            # we verify columns and table name to make sure we aren't being SQL injection attacked
        if verifyTableName(id_shell['table']):
            # define the tableName and it's id column
            dName = id_shell['table']
            idName = getIdColumn(dName)
            
            # fill the 'userId' column with the users ID
            data_shell['userIdModified'] = User.tableId
            # starts an instance of our sql command class
            com = sqlCommands(dName) 
            # feed com the data from the table
            com.values(data_shell)
            # put an entry for row id in the sql parameters object, we will put a ':id' in the sql command text
            # and sql will replace it with the 'id' in the parameters object
            com.insertDict['id'] = id_shell['id']
            # if the user is creating a new row...
            if (id_shell['id'] == 'new') and User.canAdd(dName):
                # set the command text
                sqlCommand = text("INSERT INTO [" + dName + "] (" + com.columnsList + ") VALUES (" + com.valueList + ");")
                    # execute command with references (for injection attacks)
                db.engine.execute(sqlCommand, com.insertDict) 
                    # get the identity of the item created
                    # this is passed back to the page so that it knows the id number for the created item
                index = db.engine.execute("SELECT IDENT_CURRENT('"+ dName +"')").fetchall()[0][0]

            # if the id is a number and the user can edit the table
            elif id_shell['id'].isnumeric() and User.canEdit(dName):
                # set the command text using strings generated by the sql Commands class
                command = text("UPDATE [" + dName + "] SET "+ com.pairs +" WHERE " + idName + "=:id;")
                db.engine.execute(command, com.insertDict)
                
                index = id_shell['id']
                

            # if the user is not allowed to edit/add return a 403 error
            else: return 'unauthorised', 403 

    # handle sql errors
    except Exception as error:
        print(error)
        # send the error to the error logger
        LOG.error(error, exc_info=True)
        return str(error), 472 # the response code 472 means a SQL error, 72 are the last two cylinders to fire on a chevy; matt's favorite number
    
    # when everything went well...
    else:
        # 200 means success and we return the index of the modified or created element
        return str(index), 200


# deletes rows in tables given the table given a response object in form:
#{
#   id:## id number of row or 'new' if its a new entry ##,
#   table:## table name ##
#}
@bp.route('/delete', methods=['DELETE'])
def delete():
    User = flask_login.current_user

    # catch a user who is not logged in
    if (not User.is_authenticated):
        return 'unauthorised, ', 403
    
    try:
        id_shell = json.loads(request.data)
        
            # we verify the table name to make sure we aren't being SQL injection attacked
        if verifyTableName(id_shell['table']):

            dName = id_shell['table']
            idName = getIdColumn(dName)
                # verify the user has permission
            if User.canDelete(dName):
        
                try:
                    sqlCommand = text(f"UPDATE [dbo].[{dName}] SET active = 0 WHERE {idName}=:id;")
                    db.engine.execute(sqlCommand, {'id':id_shell['id']})
                except:
                    print("Active Mod failed")

            else: return 'permission denied', 403

    except Exception as error:
        print(error)
        return str(error), 472 # 472 means a SQL error, 72 are the last two cylinders to fire on a chevy; matt's favorite number
    else:
        return 'Success', 200



# restoress deleted rows in tables given the table given a response object in form:
#{
#   id:## id number of row or 'new' if its a new entry ##,
#   table:## table name ##
#}
@bp.route('/restoreDelete', methods=['DELETE'])
def restoreDelete():
    User = flask_login.current_user

    # catch a user who is not logged in
    if (not User.is_authenticated):
        return 'unauthorised, ', 403

    try:
        id_shell = json.loads(request.data)
        print(request.data)

            # we verify the table name to make sure we arn't being SQL injection attacked
        if verifyTableName(id_shell['table']):

            dName = id_shell['table']
            idName = getIdColumn(dName)
                # verify the user has permission
            if User.canUnDelete(dName):
    
                sqlCommand = text(f"UPDATE [dbo].[{dName}] SET active = 1 WHERE {idName}=:id;")
                db.engine.execute(sqlCommand, {'id':id_shell['id']})

            else: return 'permission denied', 403

    except Exception as error:
        print(error)
        return str(error), 472 # 472 means a SQL error, 72 are the last two cylinders to fire on a chevy; matt's favorite number
    else:
        return 'Success', 200


# returns an audit table as an html string given the tablename and rowId
@bp.route('/getAudit/<dName>/<rowId>', methods=['GET'])
def newGetAuditTable(dName='Country', rowId='1'):
    User = flask_login.current_user
    # catch a user who is not logged in
    if (not User.is_authenticated):
        return 'unauthorised, ', 403

    dAudit = dName + 'Audit'

    #get the table from the database
    if verifyTableName(dName) and  User.canAudit(dName):

        primaryKey = getIdColumn(dName)
        # start an instance of our tablehtml class
        code = tableHtml(User, dAudit, primaryKey)
        # create the header for the table and include the linked data in the header
        code.newHeader(getKeys(dAudit), linkedDataTag=True, columnTypes=getColumnTypes(dAudit))
        # sql command
        command = text('SELECT * FROM [' + dAudit + '] WHERE ' + primaryKey + '=:rowId;')
        result = db.engine.execute(command, {'rowId':str(rowId)})
        # fill in the table
        code.content(result.fetchall())
    
        return code.html
    else:
        return 'unauthorized', 403



# returns a table of all the places a table is linked given a tablename and a rowId
@bp.route('/viewLinked/<dName>/<rowId>', methods=['GET'])
def viewLinked(dName='Country', rowId='1'):
    User = flask_login.current_user

    # catch a user who is not logged in
    if (not User.is_authenticated):
        return 'unauthorised, ', 403

    # get the linked tables with defence column
    linkedTableNames = getLinkedChildren(dName)

    response = str()

    # if the user can view the table...
    if User.canView(dName):
        # loop through all tables
        for linkedTable in linkedTableNames:
            # pull out the table name and reference column
            dependentTable = linkedTable['table']
            idColumn = linkedTable['fkCol']
            # run the sql command that gets the table
            command = text('SELECT * FROM [' + dependentTable + '] WHERE ' + idColumn + '=:rowId;')
            result = db.engine.execute(command, {'rowId':str(rowId)}).fetchall()
            # if there are entries in that table and the user can view that table
            if ((len(result) > 0) and User.canView(dependentTable)):
                # start an instance of the tableHTML class
                code = tableHtml(User, dependentTable, getIdColumn(dependentTable))
                # add the table name to the html
                code.html += f'<h2>{dependentTable}</h2><div class=\'scrollTable\'><table>'
                # create a header for the table that has all the linked elements in the header
                code.newHeader(getKeys(dependentTable), linkedDataTag=True, columnTypes=getColumnTypes(dependentTable), uneditableList=['userIdModified'])
                # add the rest of the table
                code.content(result, True)
                
                # add the closing html for the table
                code.html += '</table></div>'
                # append this tables html to the response string
                response += code.html
        # if this table was not linked anywhere
        if (len(response) == 0):
            response += '<h2>This row is not referenced in any tables that you have permission to view</h2>'
    
        return response
    else:
        return 'error', 500

# runs a sql command that gets a table with a list of all the places the dName table is referenced with the row name in which it is referenced
# and the name of the column under which it is referenced under. For instance if you ran getLinkedChildren('User')
#  you would get a table that looks like ({'table':'Country', 'fkCol','userIdModified'}, ...ditto for all the other tables...)
def getLinkedChildren(dName):

    return db.engine.execute(text("""SELECT tab1.name AS [table], col1.name AS [fkCol] 
            FROM sys.foreign_key_columns fkc
            INNER JOIN sys.objects obj
                ON obj.object_id = fkc.constraint_object_id
            INNER JOIN sys.tables tab1
                ON tab1.object_id = fkc.parent_object_id
            INNER JOIN sys.columns col1
                ON col1.column_id = parent_column_id AND col1.object_id = tab1.object_id
            INNER JOIN sys.tables tab2
                ON tab2.object_id = fkc.referenced_object_id
            WHERE tab2.name=:tableName"""), {'tableName':dName}).fetchall()




# takes a json object and turns it into a pdf and then returns that pdf
#   We are using the pdfkit module which is a wrapper for the wkhtmltopdf 
#   command line program. So we have to install wkhtmltopdf if we move the 
#   server.
#   
#   The json from the website is formated like...
# {
#   params : String - some text describing the filter parameters,
#   sort : String - the filter column,
#   tableName : String - the table's name,
#   html : String - the html for the thing to be printed
# }
@bp.route('/print', methods=['POST'])
@login_required
def printFromHtml():
        # get the data, the javascript had to pass it as a form so it could open in a new page
    data = json.loads(request.form['html'])
        # our path to the wkhtmltopdf executable
    path_wkhtmltopdf = r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe'
        # configure the pdfkit module
    config = pdfkit.configuration(wkhtmltopdf=path_wkhtmltopdf)
        # get the current time
    currentTime = datetime.datetime.now()
        # construct a string to be used as the footer for each page in the report (pulling data from the page)
    if len(data['params']) > 0: filtersText = data['params']
    else: filtersText = 'No filters'
        # construct a file name
    fileNameString = f"{data['tableName']}_Report_{currentTime.date()}"

    footer = f"{str(currentTime.date())}  Sort By: {data['sort']}  Filter(s): {filtersText}"
        # pdf options are found here https://wkhtmltopdf.org/usage/wkhtmltopdf.txt\ these command line flags are 
        # inserted here as a dictionary with initial dashes removed
    options = {
        'grayscale':'',
        'quiet':'',
        'header-right':'[page]/[toPage]',
        'orientation':'Landscape',
        'header-center':data['tableName'],
        'header-left':'BYU A/C SHOP: CONTROLS',
        'footer-left':footer,
        'footer-font-size':10,
        'footer-font-name':'Ariel',
        'title':fileNameString
    }
    # CSS to be used on the printout, mostly hiding elements we don't want to see
    # and table formating
    style = """
    <link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet' type='text/css'>
    <style>
    body {
        font-family: 'Roboto', Times;
    }
    span {
        display:none;}
    button {
        display:none;}
    table, td, th {
        border: 1px solid;
        border-collapse: collapse;
        text-align: left;
        padding: 2px;}
    .noPrint {
        display: none;
    }
    </style>"""
        # create the actual file and store it as a variable
    pdfFile = pdfkit.from_string(data['html'] + style, False, configuration=config, options=options) 
        # tell the browser to display it as a pdf and set the filename
    response = make_response(pdfFile)
    response.headers['Content-Type'] = 'application/pdf'
    
    response.headers['Content-Disposition'] = f'inline; filename={fileNameString}.pdf'
    return response


@bp.route('/printModal', methods=['POST'])
@login_required
def printModalFromHtml():
        # get the data, the javascript had to pass it as a form so it could open in a new page
    data = json.loads(request.form['html'])
        # our path to the wkhtmltopdf executable
    path_wkhtmltopdf = r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe'
        # configure the pdfkit module
    config = pdfkit.configuration(wkhtmltopdf=path_wkhtmltopdf)
        # get the current time
    currentTime = datetime.datetime.now()

    footer = str(currentTime.date())
        # pdf options are found here https://wkhtmltopdf.org/usage/wkhtmltopdf.txt these command line flags are 
        # inserted here as a dictionary with initial dashes removed
    options = {
        'grayscale':'',
        'quiet':'',
        'header-right':'[page]/[toPage]',
        'orientation':'Landscape',
        'header-left':'BYU A/C SHOP: CONTROLS',
        'footer-left':footer,
        'footer-font-size':10,
        'footer-font-name':'Ariel',
        'title':data['title']
    }
    # CSS to be used on the printout, mostly hiding elements we don't want to see
    # and table formating
    style = """
    <link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet' type='text/css'>
    <style>
    body {
        font-family: 'Roboto', Times;
    }
    span {
        display:none;}
    button {
        display:none;}
    table, td, th {
        border: 1px solid;
        border-collapse: collapse;
        text-align: left;
        padding: 2px;}
    .noPrint {
        display: none;
    }
    </style>"""
        # create the actual file and store it as a variable
    pdfFile = pdfkit.from_string(data['data'] + style, False, configuration=config, options=options) 
        # tell the browser to display it as a pdf and set the filename
    
    response = make_response(pdfFile)
    response.headers['Content-Type'] = 'application/pdf'
    fileNameString = f"{data['title']}_{currentTime.date()}"
    response.headers['Content-Disposition'] = f'inline; filename={fileNameString}.pdf'
    return response

