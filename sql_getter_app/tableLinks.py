import sys
# for production
#sys.path.append('C:\\control-app\\appEnv\\sql_getter_app')

import flask_login
import json
from flask import request, Blueprint
from sqlalchemy.sql.expression import true
from collection import db
from sqlalchemy import text

from createTableHtml import tableHtml
from crud import getKeys, getIdColumn, verifyTableName, getColumnTypes, verifyColumnAndTableName
from auth import login_required


bp = Blueprint("tableLinks", __name__)

# for quick view of a linked element, returns the HTML for a single column and it's header
# this request should have the following url args ( the stuff after the ? ):
#   name: the name of the linked table
#   id: the id of the row desired
@bp.route('/linkedElement', methods=['GET'])
@login_required
def NEWlinkedElement():
        # Get the data from the arguments
    User = flask_login.current_user
    table = request.args.get('name', '')
    idNum = request.args.get('id', '')

        # if everything is legit...
    if User.canView(table) and verifyTableName(table):
        idName = getIdColumn(table)
        keys = getKeys(table)

        code = tableHtml(User, table, idName) # table html class
        code.newHeader(keys, linkedDataTag=True, columnTypes=getColumnTypes(table)) # create header with linked data
        #get the table from the database with protection from SQL injection
        command = text("SELECT * FROM ["+ table +"] WHERE ["+idName+"]=:idNum;")
        result = db.engine.execute(command, {'idNum':idNum}).fetchall()
        # feed the result to the tableHTML class for processing into an HTML table
        code.content(result)
        return code.html
    else:
        # if they don't have permission return 'unauthorized'
        return 'error', 403


# When we are editing an row and click on the '***** Table' button, go to the linked table and create a row
# then we get redirected back to the old table with the new id, but the old table doesn't have the new updated id's data
# this url supplies that data
# the arguments are passed through the url and are... 
#   the name of the column desired
#   the name of the table desired
#   the id you want
#
@bp.route('/updateLinkedObject/<columnToGet>/<linkedTableName>/<newId>', methods=['GET'])
@login_required
def updateLinkedObject(linkedTableName, columnToGet, newId):
    User = flask_login.current_user
    # check to make sure the user can edit the table and that the table and column name are safe
    if User.canView(linkedTableName) and verifyColumnAndTableName(linkedTableName, columnToGet):
        # we put it in a try catch loop that way we can catch an error and send it back to the user
        try:
            # get the PK column for the table requested
            idColumn = getIdColumn(linkedTableName)
            # compose a sql command that gets the requested data
            sqlCommand = text(f'SELECT {columnToGet} AS COL FROM [{linkedTableName}] WHERE {idColumn}=:id')
            # execute the command on the database and extract the result
            result = db.engine.execute(sqlCommand, {'id':newId}).fetchall()[0]['COL']
            # return the result
            return result
        # handle an error
        except Exception as error:
            print(error)
            return str(error), 472
    # if the verify if statement failed
    else:
        return 'unauthorized', 403


# a url to test new functions
@bp.route('/mo', methods=['GET', 'POST'])
def aMessAroundFunction():
    return 'sucess', 200


