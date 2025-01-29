# High level summary of this page:
#   1. imports the modules we need
#   2. sets up the tables blueprint
#   3. defines siteTest function for the page for javascript testing, It has a dummy table and user but otherwise should return something in the same format as the crud.py/pull() function
#   4. defines a million functions for pulling a bunch of stuff
#   5. defines tablePermissions function
#   6. defines operationsManual, JsManual, PyManual functions: here admins only can access the operation manuals for the site
#   7. defines sendEmailsTest and checkEmailsTest functions

from re import M
import sys
# for production
#sys.path.append('C:\\control-app\\appEnv\\sql_getter_app')

import flask_login
from flask import Flask, redirect, render_template, request, session, url_for, Blueprint
from markupsafe import escape
from sqlalchemy import false
import json
# below are local module imports
from sql_getter_app.crud import pull
from sql_getter_app.auth import login_required
from sql_getter_app.createTableHtml import tableHtml
from sql_getter_app.collection import production, versionString
from sql_getter_app.menuCreation import getMenuForRole


bp = Blueprint("tables", __name__)  # sets up the blueprint with name tables defined at __name__

# the page for javascript testing, It has a dummy table and user but otherwise 
#   should return something in the same format as the crud.py/pull() function
@bp.route('/test')
@login_required
def siteTest():

    # run the python tests as well
    from test_runAllTests import runAllTests
    runAllTests()

    # create a fake user (not saved to any cookies or valid at all beyond the test) 

    from sql_getter_app.user_class import user_session
    import json, time

    userCookie = dict()
    userCookie['id'] = 'test'
    userCookie['created'] = 64063959331000
    userCookie['level'] = 1
    userCookie['tableId'] = 1
    userCookie['role'] = 'Admin'
    userCookie['fullName'] = 'For testing purposes ONLY'
    userCookie['isAdmin'] = False

    fakeUser = user_session()
    fakeUser.setFromString(json.dumps(userCookie), 123456789)
    
    # adding those attributes that the compiler is whining about
    setattr(fakeUser, 'isAdmin', False)
    setattr(fakeUser, 'roleId', 1)

    # create the fake table 
    table = tableHtml(fakeUser, 'food', 'foodId')
    table.newHeader([('foodId',), ('Food',), ('foodTypeId',), ('Edible',), ('Calories',), ('ExpirationDate',)])
    table.content([{'foodId':'1', 0:'icecream', 1:'3', 2:'True', 3:'850', 4:'2021-12-30 00:38:54.840'}, {'foodId':'2', 0:'bolo', 1:'4', 2:'False', 3:'985000', 4:'2017-09-25 05:38:12.000'}])
    
    # spoof all the inputs - hopefully we don't change anything else and have to come back and change this too
    columnTypes = {
        'foodId': {"COLUMN_NAME": "foodId", "DATA_TYPE": "int", "CHARACTER_MAXIMUM_LENGTH": None, "IS_NULLABLE": "NO"},
        'Food': {'COLUMN_NAME': "Food", 'DATA_TYPE': "varchar", 'CHARACTER_MAXIMUM_LENGTH': 20, 'IS_NULLABLE': "NO"},
        'foodTypeId': {"COLUMN_NAME": "foodTypeId", "DATA_TYPE": "int", "CHARACTER_MAXIMUM_LENGTH": None, "IS_NULLABLE": "NO"},
        'Edible': {'COLUMN_NAME': "Edible", 'DATA_TYPE': "bit", 'CHARACTER_MAXIMUM_LENGTH': None, 'IS_NULLABLE': "NO"},
        'Calories': {"COLUMN_NAME": "Calories", "DATA_TYPE": "int", "CHARACTER_MAXIMUM_LENGTH": None, "IS_NULLABLE": "NO"},
        'ExpirationDate': {"COLUMN_NAME": "ExpirationDate", "DATA_TYPE": "datetime", "CHARACTER_MAXIMUM_LENGTH": None, "IS_NULLABLE": "NO"}
        }

    linkedThings = {'foodTypeId':{'0':'Breakfast', '1':'Lunch', '2':'Dinner', '3':'Snack', '4':'person', "info": {"table": "food", "replacement": "Type"}}}
    permissions = {"canView": True, "canEdit": True, "canAdd": True, "canDelete": True, "canAudit": True}
    keys = ['Food', 'foodTypeId', 'Edible', 'Calories', 'ExpirationDate']
    
    return render_template('table.html',
        body=table.html, 
        userN='John', 
        linkedColData=linkedThings,
        testing='true', # so the html template processor (JINJA) knows to include the javascript testing files
        columns=keys,
        uneditableColumns=['Calories'],
        permissionsObject=permissions,
        tableName='food',
        role='nada',
        columnTypes=columnTypes,
        linkedChildrenExist=True,
        mask='Test food table (not in database)',
        title='Controls JS testbed',
        pageOnLoadFunction='testStartup()', # the javscript function to run onload of the page
        isAdmin=fakeUser.isAdmin,
        production=production,
        menuObject=getMenuForRole(fakeUser),
        versionString=versionString,
        userId='test',
        primaryKey=''
    )

@bp.route('/Building')
@login_required
def building():
    return pull("table.html","Building")

@bp.route('/TabOrder')
@login_required
def tabOrder():
    return pull("table.html","TabOrder", "Tab Order")

@bp.route('/BBMD')                      # @bp.route from flask associates the URL /BBMD with the BBMD view function. This is why the url ends in /BBMD even though there is no BBMD.html file. When Flask receives a request to /auth/BBMD, it will call the BBMD view and use the return value as the response.
@login_required                         # @login_required from django a shortcut: If the user isn’t logged in, redirect to settings.LOGIN_URL, passing the current absolute path in the query string. Example: /accounts/login/?next=/polls/3/. If the user is logged in, execute the view normally. The view code is free to assume the user is logged in.
def bbmd():                             # define the bbmd function
    return pull("table.html","BBMD")    # this function returns the pull() function from crud.py with the parameter BBMD

"""
This is just to show how to create a duplicate page.
Also see the menuCreation.py page for more code to add it to the menu.
@bp.route('/BBMDDUPLICATE')                      # @bp.route from flask associates the URL /BBMD with the BBMD view function. This is why the url ends in /BBMD even though there is no BBMD.html file. When Flask receives a request to /auth/BBMD, it will call the BBMD view and use the return value as the response.
@login_required                         # @login_required from django a shortcut: If the user isn’t logged in, redirect to settings.LOGIN_URL, passing the current absolute path in the query string. Example: /accounts/login/?next=/polls/3/. If the user is logged in, execute the view normally. The view code is free to assume the user is logged in.
def bbmdduplicate():                             # define the bbmd function
    return pull("table.html","BBMDDUPLICATE")    # this function returns the pull() function from crud.py with the parameter BBMD
"""

@bp.route('/Country')
@login_required
def country():
    return pull("table.html","Country")

@bp.route('/Device')
@login_required
def device():
    message = "This is a big table, filtering is recommended. Also if you want a really good look at the Jaces in a building go to the building table and click 'Linked' on that building."
    return pull("table.html","Device", message=message)

@bp.route('/DeviceLicense')
@login_required
def deviceLicense():
    return pull("table.html","DeviceLicense", "Device License")

@bp.route('/DeviceSubType')
@login_required
def deviceSubType():
    return pull("table.html","DeviceSubType", "Device SubType")

@bp.route('/DeviceType')
@login_required
def deviceType():
    return pull("table.html","DeviceType", "Device Type")

@bp.route('/DNS')
@login_required
def dns():
    return pull("table.html","DNS")

@bp.route('/Failure')
@login_required
def failure():
    return pull("table.html","Failure")

@bp.route('/FailureType')
@login_required
def failureType():
    return pull("table.html","FailureType", "Failure Type")

@bp.route('/Inventory')
@login_required
def inventory():
    return pull("table.html","Inventory")

@bp.route('/IP')
@login_required
def ip():
    return pull("table.html","IP")

@bp.route('/Item')
@login_required
def item():
    return pull("table.html","Item")

@bp.route('/Manufacturer')
@login_required
def manufacturer():
    return pull("table.html","Manufacturer")

@bp.route('/NCRSNode')
@login_required
def ncrsNode():
    return pull("table.html","NCRSNode", "NCRS Node")

@bp.route('/OITJack')
@login_required
def oitJack():
    return pull("table.html","OITJack", "OIT Jack")

@bp.route('/PatchPanel')
@login_required
def patchPanel():
    return pull("table.html","PatchPanel", "Patch Panel")

@bp.route('/PatchPanelType')
@login_required
def patchPanelType():
    return pull("table.html",'PatchPanelType', 'Patch Panel Type')

@bp.route('/PhoneNumber')
@login_required
def phoneNumber():
    return pull("table.html","PhoneNumber", "Phone Number")

@bp.route('/PhoneNumberType')
@login_required
def phoneNumberType():
    return pull("table.html","PhoneNumberType", "Phone Number Type")

@bp.route('/Priority')
@login_required
def priority():
    return pull("table.html","Priority")

@bp.route('/Role')
@login_required
def role():
    return pull("table.html","Role")

@bp.route('/ServiceType')
@login_required
def serviceType():
    return pull("table.html","ServiceType", "Service Type")

@bp.route('/State')
@login_required
def state():
    return pull("table.html","State")

@bp.route('/Status')
@login_required
def status():
    return pull("table.html","Status")

@bp.route('/User')
@login_required
def user():
    return pull("table.html","User")

@bp.route('/UserRole')
@login_required
def userRole():
    return pull("table.html","UserRole", "User Role")

@bp.route('/Vendor')
@login_required
def vendor():
    return pull("table.html","Vendor")

@bp.route('/VMCloudDirector')
@login_required
def vmCloudDirector():
    return pull("table.html","VMCloudDirector", "VM Cloud Director")

@bp.route('/VersionControl')
@login_required
def VersionControl():
    text = "Add a row here for every new Build of the application or every time you change the production site"
    return pull("table.html","VersionControl", "Version Control", message=text)

@bp.route('/TablePermissions')
@login_required
def tablePermissions():
    customTypes = {
        'tablePermissionsId': {
            'COLUMN_NAME': 'tablePermissionsId', 
            'DATA_TYPE': 'int', 
            'CHARACTER_MAXIMUM_LENGTH': None, 
            'IS_NULLABLE': 'NO'}, 
        'tableName': {
            'COLUMN_NAME': 'tableName', 
            'DATA_TYPE': 'varchar', 
            'CHARACTER_MAXIMUM_LENGTH': 50, 
            'IS_NULLABLE': 'NO'}, 
        'viewingLevel': {
            'COLUMN_NAME': 'viewingLevel', 
            'DATA_TYPE': 'linkedObjectHybrid', 
            'CHARACTER_MAXIMUM_LENGTH': None, 
            'IS_NULLABLE': 'NO'}, 
        'editingLevel': {
            'COLUMN_NAME': 'editingLevel', 
            'DATA_TYPE': 'linkedObjectHybrid', 
            'CHARACTER_MAXIMUM_LENGTH': None, 
            'IS_NULLABLE': 'NO'}, 
        'addingLevel': {
            'COLUMN_NAME': 'addingLevel', 
            'DATA_TYPE': 'linkedObjectHybrid', 
            'CHARACTER_MAXIMUM_LENGTH': None, 
            'IS_NULLABLE': 'NO'}, 
        'deletingLevel': {
            'COLUMN_NAME': 'deletingLevel', 
            'DATA_TYPE': 'linkedObjectHybrid', 
            'CHARACTER_MAXIMUM_LENGTH': None, 
            'IS_NULLABLE': 'NO'}, 
        'userIdModified': {
            'COLUMN_NAME': 'userIdModified', 
            'DATA_TYPE': 'int', 
            'CHARACTER_MAXIMUM_LENGTH': None, 
            'IS_NULLABLE': 'YES'}, 
        'undeletingLevel': {
            'COLUMN_NAME': 'undeletingLevel', 
            'DATA_TYPE': 'linkedObjectHybrid', 
            'CHARACTER_MAXIMUM_LENGTH': None, 
            'IS_NULLABLE': 'NO'}, 
        'auditingLevel': {
            'COLUMN_NAME': 'auditingLevel', 
            'DATA_TYPE': 'linkedObjectHybrid', 
            'CHARACTER_MAXIMUM_LENGTH': None, 
            'IS_NULLABLE': 'NO'}, 
        'active': {
            'COLUMN_NAME': 'active', 
            'DATA_TYPE': 'bit', 
            'CHARACTER_MAXIMUM_LENGTH': None, 
            'IS_NULLABLE': 'NO'}
    }

    instructions = "Control who gets access to what tables by adding a row here for each table and checking which roles get which permissions. The 'Table Name' row must be the exact sql name for the table (you can find it by hovering over a table in the dropdown menu). Tables with no row here will have the DEFAULT permissions. There MUST be a row in this table with the table name 'DEFAULT'."

    return pull("table.html","TablePermissions", "Table Permissions", columnTypes=customTypes, message=instructions)

# here admins only can access the operation manual for the site
@bp.route('/manual')
@login_required
def operationsManual():
    
    User = flask_login.current_user
    # if the user level is above or equal to 2 then...
    if (User.isAdmin):
        return render_template('documentation/OPERATION_MANUAL.html',
            userN=User.fullName,
            role=User.roleText,
            loggedIn=True,
            isAdmin=User.isAdmin,
            production=production,
            menuObject=getMenuForRole(User),
            versionString=versionString
            )
    # if they aren't part of the shop then serve them the 401 (foreign user) error
    else:
        from flask import abort
        abort(401)

# here admins only can access the js manual for the site
@bp.route('/JsManual')
@login_required
def JsManual():
    
    User = flask_login.current_user
    # if the user level is above or equal to 2 then...
    if (User.isAdmin):
        return render_template('documentation/JS-documentation.html',
            userN=User.fullName,
            role=User.roleText,
            loggedIn=True,
            isAdmin=User.isAdmin,
            production=production,
            menuObject=getMenuForRole(User),
            versionString=versionString)
    # if they aren't part of the shop then serve them the 401 (foreign user) error
    else:
        from flask import abort
        abort(401)

# here admins only can access the js manual for the site
@bp.route('/PyManual')
@login_required
def PyManual():
    
    User = flask_login.current_user
    # if the user level is above or equal to 2 then...
    if (User.isAdmin):
        return render_template('documentation/pythonDocs.html',
            userN=User.fullName,
            role=User.roleText,
            loggedIn=True,
            isAdmin=User.isAdmin,
            production=production,
            menuObject=getMenuForRole(User),
            versionString=versionString)
    # if they aren't part of the shop then serve them the 401 (foreign user) error
    else:
        from flask import abort
        abort(401)

@bp.route('/newGuy')
@login_required
def newGuy():
    
    User = flask_login.current_user
    # if the user level is above or equal to 2 then...
    if (User.isAdmin):
        return render_template('documentation/newGuy.html',
            userN=User.fullName,
            role=User.roleText,
            loggedIn=True,
            isAdmin=User.isAdmin,
            production=production,
            menuObject=getMenuForRole(User),
            versionString=versionString
            )
    # if they aren't part of the shop then serve them the 401 (foreign user) error
    else:
        from flask import abort
        abort(401)

@bp.route('/sendEmail')
@login_required
def sendEmailTest():
    from collection import sendEmails

    sender_email = "ijc24@byu.edu"
    receiver_email = "isaac.the.cool@gmail.com"
    message = """\
    Subject: Hi there

    This message is sent from Python."""

    sendEmails.sendmail(sender_email, receiver_email, message)

    return 'Message sent'

@bp.route('/checkEmails')
@login_required
def checkEmailsTest():
    from collection import receiveEmails

    msg = 'Here are your emails: \n'

    tmp, data = receiveEmails.search(None, 'ALL')
    for num in data[0].split():
        tmp, data = receiveEmails.fetch(num, '(RFC822)')
        msg += 'Message: {0}\n'.format(num)
        msg += data[0][1] + '\n'
        break

    return msg