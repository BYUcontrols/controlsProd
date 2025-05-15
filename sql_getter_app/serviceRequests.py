# High level summary of this page:
#   1. imports modules
#   2. sets up the serviceRequests blueprint
#   3. defines functions for the service request feature:
#       a. pulling service request table
#       b. service request (SR) parts
#       c. SR notes
#       d. SR requestors
#       e. print the SR html

# imports modules we need
import json
from sys import version
import flask_login
from flask import (redirect, render_template, request, Blueprint, abort, make_response, current_app)
from sqlalchemy.sql.expression import true
from sqlalchemy import text
# below are local module imports
from sql_getter_app.crud import getColumnTypes
from sql_getter_app.auth import login_required
from sql_getter_app.createTableHtml import tableHtml
from sql_getter_app.collection import db, production, versionString
from sql_getter_app.formFuncs import newSRHelper, getServReqData, submitEdits, submitNewPart, addPart, addNote, saveReqPartEdits, saveReqNoteEdits
from sql_getter_app.user_class import user_session


primaryKey = 'serviceRequestId'

bp = Blueprint("serviceRequests", __name__) # sets up the blueprint with name serviceRequests defined at __name__

################ These pages are for the filtering functionality on the SR page ################
@bp.route('/ServiceRequestShowAllOpenRequests') # MASON: page for the Show Open filter button
@login_required
def serviceRequestShowAllRequests():
    return serviceRequestPull('Service Requests', 'requestHome.html')

@bp.route('/ServiceRequestShowAllRequests') # MASON: page for the Show All filter button
@login_required
def serviceRequestShowAllOpenRequests():
    return serviceRequestPull('Service Requests', 'requestHome.html')
################################################################################################

@bp.route('/NewServiceRequest', methods=['GET', 'POST']) # MASON: page for making a new SR
@login_required
def newServiceRequest():
        if request.method == 'POST':
            # For a new service request
            if request.content_type == 'application/json': # json data submitted
                print(request.get_json())
                try:
                    # Parse JSON data
                    data = request.get_json()
                    date = data.get('date')
                    requestor = data.get('requestor')
                    priority = data.get('priority')
                    description = data.get('description')
                    location = data.get('location')
                    department = data.get('department')
                    assignedTo = data.get('assignedTo')
                    building = data.get('building')
                    estimate = data.get('estimate')
                    status = data.get('status')
                    completed = data.get('completed')
                    cc = data.get('cc')
                    contactedDate = data.get('contactedDate')
                    externalId = data.get('externalId')
                    notes = data.get('newSRNotes', [])  # Default to an empty list if notes is not provided
                    parts = data.get('newSRParts', [])  # Default to an empty list if parts is not provided
                    # submit the new service request!
                    newSRHelper(date, requestor, priority, description, location, department, assignedTo, building, estimate, status, completed, contactedDate, externalId, cc, notes, parts)
                    message = "Service Request has been saved."
                    return newSrRenderTemplate(None, None, message)
                except Exception as e:
                    print("error", e)
                    return str(e)
            
            else: # content_type = application/x-www-form-urlencoded (form data)
                print("request.form", request.form)
                # this is how I distinguish between forms. Each form has different inputs so the name of the first input is different for each form.
                formDict = request.form
                keysList = list(formDict)
                firstInput = keysList[0]


                # if the user clicked the link from the id of a SR row    
                if(str(firstInput) == 'servReqId'):
                    servReqId = int(request.form['servReqId'])
                    servReq = getServReqData(servReqId)
                    userIsTech = user_session.checkIfUserIsTechnician(flask_login.current_user)
                    return newSrRenderTemplate(None, servReq, None, userIsTech)

                # if the user submitted an edit to an already existing SR
                elif (str(firstInput) == 'currId'):
                    # collect the information from the form
                    currId = request.form['currId']
                    date = request.form['date']
                    requestor = request.form['requestor']
                    priority = request.form['priority']
                    description = request.form['description']
                    department = request.form['department']
                    location = request.form['location']
                    assignedTo = request.form['assignedTo']
                    building = request.form['building']
                    estimate = request.form['estimate']
                    status = request.form['status']
                    completed = request.form['completed']
                    cc = request.form['cc']
                    contactedDate = request.form['contactedDate']
                    externalId = request.form['externalId']
                    # submit the edits
                    submitEdits(currId, date, requestor, priority, description, department, location, assignedTo, building, estimate, status, completed, contactedDate, externalId, cc)
                    servReq = getServReqData(currId)
                    message = "Changes have been saved. Redirecting to Service Request."
                    return newSrRenderTemplate(None, servReq, message)

                # when a user clicks the Delete button
                elif (str(firstInput) == 'idinput'):
                    idinput = request.form['idinput']
                    if (idinput != 'NO-ID'):
                        db.engine.execute(f"""UPDATE [ServiceRequest]\nSET [active] = '{False}'\nWHERE serviceRequestId='{idinput}';""")
                    return redirect('/ServiceRequest')
                
                # check if the user is creating a new part
                elif (str(firstInput) == 'newpartdescription'):
                    print("new part", request.form)
                    description = request.form['newpartdescription']
                    modelNum = request.form['newpartmodelNumber']
                    vendor = request.form['newpartVendor']
                    minStock = request.form['newpartMinStock']
                    manufacturer = request.form['newpartManu']
                    deviceType = request.form['newpartdeviceType']
                    deviceSubType = request.form['newpartdeviceSubType']
                    servReqId = request.form['servReqId']
                    try: # if created from an existing SR
                        servReq = getServReqData(servReqId)
                    except: # if it is created from a new SR
                        servReq = None
                    submitNewPart(description, modelNum, vendor, minStock, manufacturer, deviceType, deviceSubType)
                    return newSrRenderTemplate(None, servReqId, None, None, description)

                # check if they are adding an part
                elif (str(firstInput) == 'parts'):
                    parts = request.form['parts']
                    partquantity = request.form['partquantity']
                    partvoid = request.form.getlist('partvoid')
                    servReqId = request.form['servReqId']
                    addPart(parts, partquantity, partvoid, servReqId)
                    servReq = getServReqData(servReqId)
                    userIsTech = user_session.checkIfUserIsTechnician(flask_login.current_user)
                    return newSrRenderTemplate(None, servReq, None, userIsTech)
                
                # add a new note
                elif (str(firstInput) == 'note'):
                    print("adding note")
                    note = request.form['note']
                    public = request.form.getlist('public')
                    modDate = request.form['modDate']
                    inputBy = request.form['noteinputBy']
                    servReqId = request.form['servReqId']
                    addNote(note, public, modDate, inputBy, servReqId)
                    servReq = getServReqData(servReqId)
                    userIsTech = user_session.checkIfUserIsTechnician(flask_login.current_user)
                    return newSrRenderTemplate(None, servReq, None, userIsTech)

                # delete the part
                elif (str(firstInput) == 'deletePart'):
                    deletePart = request.form['deletePart']
                    servReqId = request.form['servReqId']
                    db.engine.execute(f"""UPDATE [RequestPart]\nSET [active] = '{False}'\nWHERE requestPartId='{deletePart}';""")
                    servReq = getServReqData(servReqId)
                    userIsTech = user_session.checkIfUserIsTechnician(flask_login.current_user)
                    return newSrRenderTemplate(None, servReq, None, userIsTech)

                # edit the part
                elif (str(firstInput) == 'requestPartId'):
                    requestPartId = request.form['requestPartId']
                    # getlist used to get multiple values (checkboxes)
                    editpartvoid = request.form.getlist('editpartvoid')
                    partStat = request.form['partStat']
                    partQuan = request.form['partQuan']
                    saveReqPartEdits(requestPartId, editpartvoid, partStat, partQuan)
                    servReqId = request.form['servReqId']
                    servReq = getServReqData(servReqId)
                    userIsTech = user_session.checkIfUserIsTechnician(flask_login.current_user)
                    return newSrRenderTemplate(None, servReq, None, userIsTech)

                # delete the note
                elif (str(firstInput) == 'deleteNote'):
                    deleteNote = request.form['deleteNote']
                    servReqId = request.form['servReqId']
                    db.engine.execute(f"""UPDATE [RequestNote]\nSET [active] = '{False}'\nWHERE requestNoteId='{deleteNote}';""")
                    servReq = getServReqData(servReqId)
                    userIsTech = user_session.checkIfUserIsTechnician(flask_login.current_user)
                    return newSrRenderTemplate(None, servReq, None, userIsTech)

                # save the edits to the note
                elif (str(firstInput) == 'requestNoteId'):
                    requestNoteId = request.form['requestNoteId']
                    servReqId = request.form['servReqId']
                    note = request.form['editnote']
                    # editnotetoday = request.form['editnotetoday']
                    public = request.form.getlist('editpublic')
                    saveReqNoteEdits(requestNoteId, note, public)               
                    servReq = getServReqData(servReqId)
                    userIsTech = user_session.checkIfUserIsTechnician(flask_login.current_user)
                    return newSrRenderTemplate(None, servReq, None, userIsTech)
        
        # runs if no form was submitted
        else:
            return newSrRenderTemplate()

# returns the correct NewServiceRequest page
def newSrRenderTemplate(newRequestor=None, servReq=None, message=None, userIsTech=None, partDesc=None):
    from sql_getter_app.menuCreation import getMenuForRole

    departmentIdsAndNames = db.engine.execute("SELECT [departmentId], [departmentName] FROM [Department] WHERE active = 1").fetchall()
    userIdsAndNames = db.engine.execute("SELECT [departmentId], [fullName] FROM [User] WHERE active = 1").fetchall()

    departmentDict = {}
    userDict = {}

    for row in departmentIdsAndNames:
        departmentDict[str(row[1])] = row[0]
    for row in userIdsAndNames:
        if row[0] in userDict:
            userDict[row[0]].append(row[1])
        else:
            userDict[row[0]] = [row[1]]

    return render_template('newServiceRequest.html',
                            menuObject=getMenuForRole(flask_login.current_user),
                            requestors=ListOfNames(None, None, 'New Requestor'),
                            pageOnLoadFunction='EditSrInnit()',
                            priorities=ListOfValues('priorityId', 'priority', 'Priority'),
                            assignedTo=ListOfNames('technician', 1),
                            building=ListOfValues('buildingId', 'buildingAbbreviation', 'Building'),
                            departments=ListOfValues('departmentId', 'departmentName', 'Department'),
                            status=ListOfValues('statusId', 'status', 'Status', None, "forServiceRequest = 1"),
                            nextId=nextIdNumber(),
                            userNextId=nextIdNumber('userId', 'userId', 'User'),
                            userName=user_session.returnUserName(flask_login.current_user),
                            userFullName=user_session.returnFullName(flask_login.current_user),
                            vendors=ListOfValues('vendorId', 'name', 'Vendor', 'None'),
                            roles=ListOfValues('roleId', 'role', 'Role'),
                            parts=ListOfValues('partId','description','Part','New Part'),
                            partStatus=ListOfValues('statusId', 'status', 'Status', None, "forItems = 1"),
                            partvendors=ListOfValues('vendorId', 'name', 'Vendor'),
                            manufacturers=ListOfValues('manufacturerId', 'name', 'Manufacturer'),
                            deviceTypes=ListOfValues('deviceTypeId', 'deviceType', 'DeviceType'),
                            deviceSubTypes=ListOfValues('deviceSubTypeId', 'deviceSubType', 'DeviceSubType'),
                            newRequestor=newRequestor,
                            servReq=servReq,
                            message=message,
                            userIsTech=userIsTech,
                            partDesc=partDesc,
                            userN=True,
                            role=flask_login.current_user.roleText,
                            production=production,
                            departmentDict=departmentDict,
                            userDict=userDict
                            )

@bp.route('/ServiceRequest')
@login_required
def serviceRequest():
    return serviceRequestPull('Service Requests', 'requestHome.html')


#gets the table from the database
#@param dName = the name of the table
#       mask = the display name of the table
def serviceRequestPull(mask, html):

    from sql_getter_app.menuCreation import getMenuForRole

    User = flask_login.current_user
    # db table name
    dName = 'ServiceRequest'
    from sql_getter_app.sqlCommandClass import sqlCommands

    # get the permissions object for the table
    tablePermissions = User.getPermissionsObject(dName)
    # uncomment these 2 lines if you want to track how long each process takes
    #from collection import profiled
    #with profiled():

    if tablePermissions['canView']:
        # This is where to edit visible service request table columns
        # these have to be column names in the database (they are being queried)
        keys = [
            ('userIdTechnician',),
            ('serviceRequestId',), # This is the primary key.
            ('requestDate',),
            ('buildingId',), 
            ('location',),        # MASON: commented out so that the table in the SR home page has the right columns
            ('description',),
            # ('departmentId',),
            ('userIdRequestor',),
            # Phone number from User table
            ('statusId',),
            # notes from RequestNote table
            ('priorityId',), 
            # ('estimatedDueDate',),
            #('contactedDate',),
            #('externalId',),
            #('completedDate',),
            ]

        # start an instance of our tableHtml class (it generates table html and fetches linked elements)
        code = tableHtml(User, dName, primaryKey, html)
        code.newHeader(keys)

        from urllib import parse # to decode the base 64 encoded filter string on a url
        # construct a string with the columns seperated by commas
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
    
        # if we are showing deleted rows fetch the active column as well
        # ORDER BY serviceRequestId DESC to show the newest requests first
        if (showDeletedRows): command = f"SELECT {columns}, active FROM [{dName}] WHERE (active = 1 or active = 0) {filter.text} ORDER BY serviceRequestId DESC"
        else: command = f"SELECT {columns} FROM [{dName}] WHERE active = 1 {filter.text} ORDER BY serviceRequestId DESC"
        
        
            # execute the string with the where parameters
        result = db.engine.execute(text(command), filter.insertDict).fetchall()
            # feed the result to the tableHtml class so it can do it's thing (telling git whether we are showing deleted rows)
        code.content(result, showDeletedRows)

        # picks which columns are uneditable in our case the userIdModified and the primary key column
        uneditableList = ['userIdModified', code.PK]

        # we need to know if the user is a technician to control some of the JS
        import flask
        userIsTech = user_session.checkIfUserIsTechnician(User)
        urlPath = flask.request.path

        # return the html generated by the requestHome.html template (it's a file in the folder templates)
        return render_template(html,
            body=code.html,                             # string - the html for the table
            userN=User.fullName,                        # string - the users name
            userId=User.tableId,                        # string - the users Id number
            linkedColData=code.linkedElements(),        # object - from the linked data file
            testing='false',                            # string - testing (should be false here)
            columns=code.columnArray,                   # list - of the columns
            uneditableColumns=uneditableList,           # list - columns that shouldn't be edited
            permissionsObject=tablePermissions,         # object - the permissions of the user
            tableName=dName,                            # string - the name of the table (must be the sql name)
            role=User.roleText,                         # string - the role for the user, 'Admin', 'Mechanic', etc
            columnTypes=getColumnTypes(dName),          # object - the columns with their types
            linkedChildrenExist=True,                   # boolean - if 'linked' buttons should be added
            mask=mask,                                  # string - the title for the table
            title=f'Controls: {mask}',                  # string - the title for the page (the name that appears on the tab)
            pageOnLoadFunction='serviceRequestInit()',  # the javscript function to run onload of the page
            isAdmin=User.isAdmin,
            production=production,
            menuObject=getMenuForRole(User),
            versionString=versionString,
            primaryKey=primaryKey,
            userIsTech=userIsTech,
            urlPath=urlPath,
            requests=code.requests
            )
    else:
        # if the user can't view the table return the unauthorized error page
        abort(403)

# link called when a service request is opened and the parts are loaded
@bp.route('/serviceRequestParts/<requestId>')
@login_required
def serviceRequestParts(requestId):
    # put the showDeleted in a state we can use (not a string)
    User = flask_login.current_user
    # catch a user who is not logged in
    if (not User.is_authenticated):
        return 'unauthorized, ', 403

    dName = 'RequestPart'
    partkeys = (('partId',),('quantity',),('statusId',)) # changes here should also be made to the sql command about 20 lines down
    primaryKey = 'requestPartId'

    #check to see if the user can view the contents of this table
    if User.canView(dName):

        # start an instance of our tablehtml class
        code = tableHtml(User, dName, primaryKey)
        # create the header for the table and include the linked data in the header
        code.newHeader(partkeys, linkedDataTag=True, columnTypes=getColumnTypes(dName))
        # check to see if we have a valid requestId (if not this is probably blank)
        if requestId.isdigit():
            # sql command
            command = text(f'SELECT {primaryKey}, {partkeys[0][0]}, {partkeys[1][0]}, {partkeys[2][0]}, active FROM [{dName}] WHERE serviceRequestId=:srId;')
            result = db.engine.execute(command, {'srId':str(requestId)}).fetchall()
            # if the result has any rows fill in the table
            if (len(result)>0): code.content(result, true)
            # else display the no rows message
            else: code.noRows('No Parts yet')
        
        else:
            # add a no parts text
            code.noRows('No Parts yet')
        return code.html
    else:
        return 'unauthorized', 403

# link called when a service request is opened and the notes are loaded
@bp.route('/serviceRequestNotes/<requestId>')
@login_required
def serviceRequestNotes(requestId):
    User = flask_login.current_user
    # catch a user who is not logged in
    if (not User.is_authenticated):
        return 'unauthorized, ', 403

    dName = 'RequestNote'
    # CHANGING THE ORDER OF THESE COLUMNS REQUIRES CHANGES TO THE JAVASCRIPT static/serviceRequest/srNotes.js/createInputNewNoteRow()
    sqlKeys = (('note',),('private',)) # changes here should also be made to the sql command about 20 lines down
    primaryKey = 'requestNoteId'

    #check to see if the user can view the contents of this table
    if User.canView(dName):

        # start an instance of our tablehtml class
        code = tableHtml(User, dName, primaryKey)
        # create the header for the table and include the linked data in the header
        code.newHeader(sqlKeys, linkedDataTag=True, columnTypes=getColumnTypes(dName), uneditableList=['userIdModified'])
        # check to see if we have a valid requestId (if not this is probably blank)
        if requestId.isdigit():
            # sql command
            command = text(f'SELECT {primaryKey}, {sqlKeys[0][0]}, {sqlKeys[1][0]}, {sqlKeys[2][0]}, active FROM [{dName}] WHERE serviceRequestId=:srId;')
            result = db.engine.execute(command, {'srId':str(requestId)}).fetchall()
            # if the result has any rows fill in the table
            if (len(result)>0): code.content(result, true)
            # else display the no rows message
            else: code.noRows('No Notes yet')
        
        else:
            # add a no parts text
            code.noRows('No Notes yet')
        return code.html
    else:
        return 'unauthorized', 403

# link called when a service request is opened and the parts are loaded
@bp.route('/serviceRequestRequestor/<requestId>')
@login_required
def serviceRequestRequestors(requestId):
    # put the showDeleted in a state we can use (not a string)
    User = flask_login.current_user
    # catch a user who is not logged in
    if (not User.is_authenticated):
        return 'unauthorized, ', 403

    dName = 'Requestor'
    partkeys = (('firstName',),('lastName',),('email',),('phoneNumber',),('netId',)) # changes here should also be made to the sql command about 20 lines down
    primaryKey = 'requestorId'

    #check to see if the user can view the contents of this table
    if User.canView(dName):

        # start an instance of our tablehtml class
        code = tableHtml(User, dName, primaryKey)
        # create the header for the table and include the linked data in the header
        code.newHeader(partkeys, linkedDataTag=True, columnTypes=getColumnTypes(dName))
        # check to see if we have a valid requestId (if not this is probably blank)
        if requestId.isdigit():
            # sql command
            command = text(f'''SELECT {primaryKey}, 
                {partkeys[0][0]}, 
                {partkeys[1][0]}, 
                {partkeys[2][0]}, 
                {partkeys[3][0]}, 
                {partkeys[4][0]}, 
                active 
                FROM [{dName}] WHERE serviceRequestId=:srId;
            ''')
            result = db.engine.execute(command, {'srId':str(requestId)}).fetchall()
            # if the result has any rows fill in the table
            if (len(result)>0): code.content(result, true)
            # else display the no rows message
            else: code.noRows('No Requestors yet')
        
        else:
            # add a no parts text
            code.noRows('No Parts yet')
        return code.html
    else:
        return 'unauthorized', 403

########################### This function prints the Service Request, and it formats it as a PDF ##################################
@bp.route('/printSingleServiceRequest', methods=['POST'])
@login_required
def printFromHtml():
    import pdfkit
    import datetime
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
        #'header-right':'[page]/[toPage]',
        'orientation':'Landscape',
        #'header-center':data['tableName'],
        #'header-left':'Service Request Form',
        #'header-html': '<img src=\"/static/images/BYU.png\">',
        #'footer-left':footer,
        #'footer-font-size':10,
        #'footer-font-name':'Ariel',
        'title':fileNameString,
        'enable-local-file-access':''
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
        display:none;
    }
    button {
        display:none;
    }
    table, td, th {
        border: 1px solid;
        border-collapse: collapse;
        text-align: left;
        padding: 2px;
    }
    h1{
        font-size: 400%;
    }
    img{
        width: 65%;
        height: auto;
        margin: auto;
        display: block;
    }
    .logo{
        position: absolute;
        right: 0%;
        top: 0%;
        width: 50%;
        text-align: center;
    }
    .noPrint {
        display: none;
    }
    #partsTable,#descTable,#notesTable{
        width: 100%;
    }
    #table{
        width: 50%;
    }
    .noBorders{
       border: 0px solid transparent;
    }
    .title{
        font-size: 200%
    }
    .keyContents{
        white-space: nowrap;
        text-align: left;
    }
    .valueContents{
        width: 100%;
        text-align: right;
    }
    </style>"""
        # create the actual file and store it as a variable
    pdfFile = pdfkit.from_string(data['html'] + style, False, configuration=config, options=options) 
        # tell the browser to display it as a pdf and set the filename
    response = make_response(pdfFile)
    response.headers['Content-Type'] = 'application/pdf'
    
    response.headers['Content-Disposition'] = f'inline; filename={fileNameString}.pdf'
    return response

# function used to get a list of all the values for a particular edit/new SR page dropdown
def ListOfValues(idCol, valCol, table, specialVal=None, where=None):
    from sql_getter_app.collection import db
    if(not where):
        # Ask the database for the idColumn and displayColumn
        result = db.engine.execute(f"SELECT [{idCol}] as id, [{valCol}] as val FROM [{table}] WHERE active = 1").fetchall()
    else:
       # Ask the database for the idColumn and displayColumn
        result = db.engine.execute(f"SELECT [{idCol}] as id, [{valCol}] as val FROM [{table}] WHERE active = 1 AND {where}").fetchall() 
    # the object to hold the ids
    converted = dict()

    if (specialVal != None):
        sv = dict()
        sv['0'] = str(specialVal)
        converted.update(sv)

    first = True
    # loop through the rows and turn them into dictionaries with the format {'idNum':'value'}
    for row in result:
        raw = dict(row.items())
        data = dict()
        data[str(raw['id'])] = str(raw['val'])
        id = str(row.id)

        # the value is unique if it is the first time through the loop (duh)
        if(first):
            unique = True
        # if its not the first time, we need to compare the value to past values to see if it is unique
        else:
            # loops through all the past values
            for key in converted:
                # comparing the current value with the past values
                if(data[id] == converted[key]):
                    unique = False
                    # if we find one match, we leave the loop
                    break
                else: unique = True

        # if the value is unique, put it in the dictionary: only put in unique values (so there are no repeats)
        if(unique):
            converted.update(data)
        
        first = False
        
    return converted

# function used to get a list of all the names for a particular edit/new SR page dropdown
def ListOfNames(column=None, value=None, specialVal=None):
    from sql_getter_app.collection import db
    # Ask the database for the idColumn and displayColumn
    if (column != None and value != None):
        result = db.engine.execute(f"SELECT [userId] as id, [fullName] as val FROM [User] WHERE active = 1 AND {column} = {value}").fetchall()
    else:
        result = db.engine.execute(f"SELECT [userId] as id, [fullName] as val FROM [User] WHERE active = 1").fetchall()
    # the object to hold the ids
    converted = dict()

    if (specialVal != None):
        sv = dict()
        sv['0'] = str(specialVal)
        converted.update(sv)

    first = True
    # loop through the rows and turn them into dictionaries with the format {'idNum':'value'}
    for row in result:
        raw = dict(row.items())
        data = dict()
        data[str(raw['id'])] = str(raw['val'])
        id = str(row.id)

        # the value is unique if it is the first time through the loop (duh)
        if(first):
            unique = True
        # if its not the first time, we need to compare the value to past values to see if it is unique
        else:
            # loops through all the past values
            for key in converted:
                # comparing the current value with the past values
                if(data[id] == converted[key]):
                    unique = False
                    # if we find one match, we leave the loop
                    break
                else: unique = True
        # if the value is unique, put it in the dictionary: only put in unique values (so there are no repeats)
        if(unique):
            converted.update(data)        
        first = False
    return converted

def nextIdNumber(idCol = 'serviceRequestId', valCol = 'serviceRequestId', table = 'ServiceRequest'):

    listOfIds = ListOfValues(idCol, valCol, table)
    if len(listOfIds) == 0:
        highest = 0
    else:
        highest = int(list(listOfIds.values())[0])

    for id in listOfIds:
        num = int(listOfIds[id])
        if(num > highest):
            highest = num

    return highest + 1
