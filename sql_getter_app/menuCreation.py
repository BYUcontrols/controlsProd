# High level summary of this page:
#   1. creates a rawMenu dictionary holding all the options for a menu
#   2. gets the default viewing levels
#   3. finds the list of roles that can view each table
#   4. creates a menu based on a users role and viewing level

# here is all the stuff that goes into deciding what the menu looks like for different users (depending on role)

# this object tells us our menu options it is a dictionary of lists of dictionaries (yay!)
# the first level is for the different menus
# second is a list with all the options for that menu
# third each option has...
#   displayName - the name displayed on the menu
#   func - the python function that creates the menu (format fileName.functionName)
#   sqlName - the name for the table in the sql database (if this is not a sql table return null)

#rawMenu is an object full of dictionaries that help create the menu
rawMenu = [
    {
        'name':'Home',
        'options':[
            { 'displayName':'Home', 'func': 'navigationPages.home', 'sqlName': None }
        ]
    },
    {
        'name':'Service Requests',
        'options':[
          { 'displayName':'Create Request', 'func': 'serviceRequests.newServiceRequest', 'sqlName': None },
          { 'displayName':'View Requests', 'func': 'serviceRequests.serviceRequest', 'sqlName': 'ServiceRequest' }
        ]
    },
    
    {######### I WILL OUTLINE THE TABLES MENU IN COMMENTS. THE SAME PRINCIPLES APPLY TO THE REST OF THE DICTIONARY ##########
        'name':'Tables',    # this connects the key (name) to its value (Tables) for the Tables menu
        'options':[         # this connects the key (options) to its value, which is another dictionary full of the options that a person can click on in the menu
            { 'displayName':'Buildings', 'func': 'tables.building', 'sqlName': 'Building' },# there are 3 key:value pairs here. They're outlined above, around lines 7-9
            { 'displayName':'BBMD', 'func': 'tables.bbmd', 'sqlName': 'BBMD' },
            # { 'displayName':'BBMDDUPLICATE', 'func': 'tables.bbmdduplicate', 'sqlName': 'BBMDDUPLICATE' }, This adds the page to the menu table
            { 'displayName':'Devices', 'func': 'tables.device', 'sqlName': 'Device' },
            { 'displayName':'DNS', 'func': 'tables.dns', 'sqlName': 'DNS' },
            { 'displayName':'Failure', 'func': 'tables.failure', 'sqlName': 'Failure' },
            { 'displayName':'NCRS Node', 'func': 'tables.ncrsNode', 'sqlName': 'NCRSNode' },
            { 'displayName':'OIT Jack', 'func': 'tables.oitJack', 'sqlName': 'OITJack' },
            { 'displayName':'Patch Panel', 'func': 'tables.patchPanel', 'sqlName': 'PatchPanel' },
            { 'displayName':'Phone Number', 'func': 'tables.phoneNumber', 'sqlName': 'PhoneNumber' },
            { 'displayName':'Vendor', 'func': 'tables.vendor', 'sqlName': 'Vendor' },
            { 'displayName':'VM Cloud Director', 'func': 'tables.vmCloudDirector', 'sqlName': 'VmCloudDirector' },
            { 'displayName':'IP', 'func': 'tables.ip', 'sqlName': 'IP' },
            { 'displayName':'Device Licenses', 'func': 'tables.deviceLicense', 'sqlName': 'DeviceLicense' }
        ]
    },
    {##### LOOK AT THE TABLES DICTIONARY FOR A BREAKDOWN OF WHAT IS HAPPENING HERE ########
        'name':'References',
        'options':[
            { 'displayName':'Country', 'func': 'tables.country', 'sqlName': 'Country' },
            { 'displayName':'Device Type', 'func': 'tables.deviceType', 'sqlName': 'DeviceType' },
            { 'displayName':'Device SubType', 'func': 'tables.deviceSubType', 'sqlName': 'DeviceSubType' },
            { 'displayName':'Failure Type', 'func': 'tables.failureType', 'sqlName': 'FailureType' },
            { 'displayName':'Manufacurer', 'func': 'tables.manufacturer', 'sqlName': 'Manufacturer' },
            { 'displayName':'Patch Panel Type', 'func': 'tables.patchPanelType', 'sqlName': 'PatchPanelType' },
            { 'displayName':'Phone Number Type', 'func': 'tables.phoneNumberType', 'sqlName': 'PhoneNumberType' },
            { 'displayName':'Priority', 'func': 'tables.priority', 'sqlName': 'Priority' },
            { 'displayName':'State', 'func': 'tables.state', 'sqlName': 'State' },
            { 'displayName':'Status', 'func': 'tables.status', 'sqlName': 'Status' }
        ]
    },
    {
        'name':'Inventory',
        'options':[
            { 'displayName':'Items', 'func': 'tables.item', 'sqlName': 'Item' },
            { 'displayName':'Inventory', 'func': 'tables.inventory', 'sqlName': 'Inventory' }
        ]
    },
    {
        'name':'Admin',
        'options':[
            { 'displayName':'Users', 'func': 'tables.user', 'sqlName': 'User' },
            { 'displayName':'Tab Order', 'func': 'tables.tabOrder', 'sqlName': 'TabOrder' },
            { 'displayName':'Roles', 'func': 'tables.role', 'sqlName': 'Role' },
            { 'displayName':'Table Permissions', 'func': 'tables.tablePermissions', 'sqlName': 'TablePermissions' },
            { 'displayName':'Role test tool', 'func': 'auth.userTester', 'sqlName': None },
            { 'displayName':'Version Control', 'func': 'tables.VersionControl', 'sqlName': 'VersionControl' }
        ]
    },
    {
        'name':'Documentation',
        'options':[
            { 'displayName':'Operations', 'func': 'tables.operationsManual', 'sqlName': None },
            { 'displayName':'JavaScript', 'func': 'tables.JsManual', 'sqlName': None },
            { 'displayName':'Python', 'func': 'tables.PyManual', 'sqlName': None },
            { 'displayName':'New Guy', 'func': 'tables.newGuy', 'sqlName': None }
        ]
    }
]

# this is called when the application starts and fills the viewLevel parameter for each table
# FIXME: This was throwing a ton of errors, so I commented it out for now. (Nov 2024)
def createMenus(app):
    pass
#     from .collection import db   # pulls in db object from the collection module
#     import json                 # imports the json (JavaScript Object Notation) module... json is a lightweight data interchange format inspired by JavaScript object literal syntax
#         # first fetch the default configuration from tablePermissions 'DEFAULT' (from the tables module)
#         # we will use this for all tables that do not have an entry in the tablePermissions table
#     try:
#         with app.app_context(): # we must use the application context because the app hasn't technically been started yet
#             # json.loads() method can be used to parse a valid JSON string and convert it into a Python Dictionary. It is mainly used for deserializing native string, byte, or byte array which consists of JSON data into Python Dictionary.
#             # this (below) lets you use raw SQL code (SELECT, FROM, etc)
#             defaultViewingLevels = json.loads(db.engine.execute(f'''  
#                 SELECT viewingLevel as RESULT
#                 FROM TablePermissions
#                 WHERE tableName = 'DEFAULT';''').fetchall()[0]['RESULT'])
#             print('Default viewing Levels') # show the default viewing levels
#             print(defaultViewingLevels)
#     except Exception as e:  # if it doesn't work, print this message and the error
#         print('ERROR, NO DEFAULT CONFIGURATION FOR TABLEPERMISSIONS - Please add one right now. Only admins will be able to access tables not in TablePermissions')
#         print('This was the error ' + str(e))
#         defaultViewingLevels = list()   # if it doesn't work, the defaultViewingLevels will just be an empty list

#         # loop thorugh all the tables to find their list of roles that can view the table
#     for menu in rawMenu:
#         for option in menu['options']:
#             if option['sqlName'] is not None: # so that we don't have any errors associated with a missing table name
#                 with app.app_context(): # we must use the application context because the app hasn't technically been started yet
#                     try:
#                         # select the viewingLevel json list of roles that can view the table from the TablePermissions table
#                         sqlResult = json.loads(db.engine.execute(f'''
#             SELECT viewingLevel as RESULT
#             FROM TablePermissions
#             WHERE tableName = '{option['sqlName']}' AND active = 1;''').fetchall()[0]['RESULT'])

#                         option['viewingLevel'] = sqlResult  # i don't know where the viewingLevel is stored
#                         print(f'success in the {option["sqlName"]} table')
#                         print(option['viewingLevel'])
#                     except:
#                         print(f'error finding viewing permission levels for the {option["sqlName"]} table, using default level')
#                         option['viewingLevel'] = defaultViewingLevels

# This one is passed the current user class and returns the menu object for that user's level
def getMenuForRole(user):
    from .menuCreation import rawMenu    # this must have been copied from another module because we are in the menuCreation module: not sure why they are importing from it here
    import copy # the copy module lets us make shallow copies of objects

    newMenuList = list()

    for menu in rawMenu:
        # get a copy of the menu to edit (shallow copy so that modifications made to newMenu don't also change the rawMenu)
        newMenu = copy.copy(menu)
        # create the menu options list for the the newMenu
        newMenuOptions = list()
        # loop through the options in the raw menu
        for option in menu['options']:
            # only include the ones that the user can access and that have a viewing level
            if 'viewingLevel' in option:
                    # if the user's role is in the list of roles with viewing permissions
                    # OR if the user is an admin...
                
                if ((str(user.roleId) in option['viewingLevel']) or (user.roleId == user.adminRoleId)):
                    # put the option in the new menu
                    newMenuOptions.append(option)
            # else if there isn't a viewingLevel we only want admins to access it
            elif user.isAdmin:
                # put the option in the new menu
                newMenuOptions.append(option)

        # if the newMenu has length greater then 0 (at least one option) we want to add it to the newMenuObject
        # this way we avoid adding empty tabs to the menu the user will see
        if len(newMenuOptions) > 0:
            newMenu['options'] = newMenuOptions # put the permission specific menu options in the newMenu dictionary
            newMenuList.append(newMenu) # put the newMenu in the newMenuList

    return newMenuList  # returns the fully finished newMenuList object