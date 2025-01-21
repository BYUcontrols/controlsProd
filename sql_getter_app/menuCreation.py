# here all the stuff that goes into deciding the menu looks like for different users (depending on role)

# this object tells us our menu options it is a dictionary of lists of dictionaries (yay!)
# the first level is for the different menus
# second is a list with all the options for that menu
# third each option has...
#   displayName - the name displayed on the menu
#   func - the python function that creates the menu (format fileName.functionName)
#   sqlName - the name for the table in the sql database (if this is not a sql table return null)

rawMenu = [
    #{
    #    'name':'Service Requests',
    #    'options':[
    #        { 'displayName':'View Completed', 'func': 'serviceRequests.serviceRequest', 'sqlName': '' }
    #    ]
    #},
    {
        'name':'Tables',
        'options':[
            { 'displayName':'Buildings', 'func': 'tables.building', 'sqlName': 'Building' },
            { 'displayName':'BBMD', 'func': 'tables.bbmd', 'sqlName': 'BBMD' },
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
    {
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
            { 'displayName':'Python', 'func': 'tables.PyManual', 'sqlName': None }
        ]
    }
]

# this is called when the application starts and fills the viewLevel parameter for each table
def createMenus(app):
    from collection import db
    import json
        # first fetch the default configuration from tablePermissions 'DEFAULT'
        # we will use this for all tables that do not have an entry in the tablePermissions table
    try:
        with app.app_context(): # we must use the application context because the app hasn't technically been started yet
            defaultViewingLevels = json.loads(db.engine.execute(f'''
                SELECT viewingLevel as RESULT
                FROM TablePermissions
                WHERE tableName = 'DEFAULT';''').fetchall()[0]['RESULT'])
            print('Default viewing Levels')
            print(defaultViewingLevels)
    except Exception as e:
        print('ERROR, NO DEFAULT CONFIGURATION FOR TABLEPERMISSIONS - Please add one right now. Only admins will be able to access tables not in TablePermissions')
        print('This was the error ' + str(e))
        defaultViewingLevels = list()

        # loop thorugh all the tables to find their list of roles that can view the table
    for menu in rawMenu:
        for option in menu['options']:
            if option['sqlName'] is not None: # so that we don't have any errors associated with a missing table name
                with app.app_context(): # we must use the application context because the app hasn't technically been started yet
                    try:
                        # select the viewingLevel json list of roles that can view the table from the TablePermissions table
                        sqlResult = json.loads(db.engine.execute(f'''
            SELECT viewingLevel as RESULT
            FROM TablePermissions
            WHERE tableName = '{option['sqlName']}' AND active = 1;''').fetchall()[0]['RESULT'])

                        option['viewingLevel'] = sqlResult
                        print(f'success in the {option["sqlName"]} table')
                        print(option['viewingLevel'])
                    except:
                        print(f'error finding viewing permission levels for the {option["sqlName"]} table, using default level')
                        option['viewingLevel'] = defaultViewingLevels

# This one is passed the current user class and returns the menu object for that user's level
def getMenuForRole(user):
    from menuCreation import rawMenu
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

    return newMenuList
