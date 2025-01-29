# High level summary of this page:
# This is one giant class called user_session
#   1. creates a constant variable LOG for the logging session
#   2. Starts defining the class and all the functions within
#       a. __init__ to get the admin role id
#       b. other functions to control user sessions, such as 
#               getting permissions, access levels, and IDs

import logging

from sqlalchemy.sql.expression import false, true

LOG = logging.getLogger(__name__)   # this is how you declare a constant variable


#- This is a class to handle all things users, an instance of it is fed to flask-login to handle session management

class user_session(object):
        # define the default permission values for an table (if the sql permission query fails)
    def __init__(self): # __init__ function is first called whenever the class is instantiated
                        # the self argument referres to the object we are manipulating when calling the class
        from sql_getter_app.collection import adminRoleId  # gets adminRoleId from sql_getter_app.collection.py
        self.adminRoleId = adminRoleId      # assigns adminRoleId of the object we're manipulating to adminRoleId from sql_getter_app.collection.py
        
        pass    # passes by without executing any code

        # called by self.setFromString and self.setFromToken
        #   it defines selfroleId self.tableId and self.roleText
        #   from the sql server based on self.byuId and sets them to default
        #   values if the byuId is not in the 'User' table
    def getData(self):
        from sql_getter_app.collection import db
        # get from engine
        try:
            # get the User's roleId and hierarchy number from the database
            self.userId = int(db.engine.execute(f"SELECT [userId] FROM [User] WHERE userName='{self.byuId}';").fetchall()[0][0])
            self.roleId = int(db.engine.execute(f"SELECT [roleId] FROM [UserRole] WHERE userId='{self.userId}';").fetchall()[0][0])

            #### note: the userRoleId column does not refer to the role table's hierarchy column
            self.tableId = int(db.engine.execute(f"SELECT [userId] FROM [User] WHERE userName='{self.byuId}';").fetchall()[0][0])
            self.roleText = str(db.engine.execute(f"SELECT [role] FROM [Role] WHERE roleId='{self.roleId}';").fetchall()[0][0])
            print(self.roleText)

            # determine if the user is an admin (or higher)
            self.isAdmin = (self.roleId == self.adminRoleId)

            # define that we are part of the shop
            self.isShopUser = True
        # if there is trouble getting that data from the engine it assigns default values to the user
        #   When adding a level of access you MUST come and change this variable
        #   self.roleId controls what permissions a non shop byu person would have
        ################################### HERE WE DEFINE WHAT TO DO WITH BYU USERS WHO AREN'T IN THE USER TABLE #######################################
        except Exception as e:
            # if they are not in our User table then set them to a isShopUser to false (denies them access to any part of the site)
            print(e)
            self.tableId = 'None'
            self.roleText = 'Non-Shop-User'
            self.isAdmin = False
            self.roleId = None
            self.isShopUser = False

    # Function to parse and understand the result from a can**** cell in the tablePermissions table
    # arguments:
    #   1. string - the result from sql
    # returns a bool
    def parseTablePermissionsResult(self, result):
        import json

        # parse the json
        result = json.loads(result)
        # check of the current user role is in the list of roles that have permission
        return str(self.roleId) in result


    # function that is used to acertain if a user has permission to do something on a certain table
    # it's arguments are...
    #   string - the column in the TablePermissions table desired ('viewingLevel', 'editingLevel', etc.)
    #   string - the name for the table you want to know the permissions for
    #   int - the default level (if something goes wrong)
    def accessTableAccessLevel(self, column, tableName):
        from sql_getter_app.collection import db
        from sqlalchemy import text
        from flask import abort

        # enable admins to gain access to everything regardless of anything sql says
        # we do not use self.isAdmin here because if an admin is pretending to be another role
        # we want it to work as if he were that role; even when pretending self.isAdmin reflects reality
        if (self.roleId == self.adminRoleId): return True
        # otherwise test it out
        else: 
            try:
                # get the hierarchy for the role specified in the tablePermissions table in the 'column' column
                # INNER JOIN means we find where the 'column' value matches the roleId in the role table
                permissionData = db.engine.execute(text(f"""
                    SELECT [{column}] as RESULT
                    FROM [TablePermissions] 
                    WHERE tableName=:table AND active = 1;
                """), {'table':tableName}).fetchall()

                # if there is only one row that matches that table (as there should be)...
                if (len(permissionData) == 1):
                        # process the data
                    return self.parseTablePermissionsResult(permissionData[0]['RESULT'])

                # if there is no row for this table, time to find the default config
                elif (len(permissionData) == 0):
                    print('There seems to be an error finding the persisions level for this table, we have reverted to the default value')
                        # first we fetch the default data from the server
                    defaultPermissionData = db.engine.execute(text(f"""
                        SELECT [{column}] as RESULT
                        FROM [TablePermissions] 
                        WHERE tableName='DEFAULT';
                        """)).fetchall()[0]['RESULT']
                    # then we will process the data and return it
                    return self.parseTablePermissionsResult(defaultPermissionData)

                # very bad, this means we have bad data in the tablePermissions table
                else:
                    print(' THERE ARE MORE THAN ONE ROWS FOR A TABLE IN TABLE PERMISSIONS ')
                    abort(500)
            
            except Exception as e:
                # print an error message
                print('There seems to be an error finding the persisions level for this table, THIS IS VERY BAD')
                print(f'ERROR: {e}')
                # if something goes wrong with the sql request default to only admins have permission
                return False

    # these functions are used in the table to verify if a user has permission to do something
    
    def canView(self, tableName):
        return self.accessTableAccessLevel('viewingLevel', tableName)

    def canEdit(self, tableName):
        return self.accessTableAccessLevel('editingLevel', tableName)


    def canAdd(self, tableName):
        return self.accessTableAccessLevel('addingLevel', tableName)


    def canDelete(self, tableName):
        return self.accessTableAccessLevel('deletingLevel', tableName)

    def canUnDelete(self, tableName):
        return self.accessTableAccessLevel('undeletingLevel', tableName)

    def canAudit(self, tableName):
        return self.accessTableAccessLevel('auditingLevel', tableName)

        # get the permissions object for a table
        #   a permissions object is an object passed to the javascript that tells us what a
        #   user can and cannot do to a table. We could generate this through a bunch of self.canEdit()
        #   self.canView() etc. functions but executing so many queries is very inefficient so here we do
        #   it all in one
    def getPermissionsObject(self, table):
        
        from sql_getter_app.collection import db
        from sqlalchemy import text
        from flask import abort
            # first check to see if the user is an admin, if they are give them full access
            # we do not use self.isAdmin here because if an admin is pretending to be another role
            # we want it to work as if he were that role; even when pretending self.isAdmin reflects reality
        if (self.roleId == self.adminRoleId):
                # construct a permissions dictionary fully enabled
            output = dict()
            output['canView'] = True
            output['canEdit'] = True
            output['canAdd'] = True
            output['canDelete'] = True
            output['canAudit'] = True
            output['canUndelete'] = True
            return output
            # execute the following code in a try catch statement because if there is no entry for our table in the
            # TablePermissions then the sql server will throw an error, we want to catch that and use the default levels
        #try: 
            # This query looks for the row in the TablePermissions database that corresponds to the table we need
            # and selects it's viewing, editing, adding, etc. columns. however these columns are references to the Role
            # and don't tell us anything about permissions of any kind. So we need to return their respective hierarchy
            # column from the Role table. That's what all the INNER JOIN statements do.
        permissionResponse = db.engine.execute(text(f"""
                
            SELECT viewingLevel AS viewing
                ,editingLevel AS editing
                ,addingLevel AS adding
                ,deletingLevel AS deleting
                ,undeletingLevel AS undeleting
                ,auditingLevel AS auditing
            FROM [dbo].[TablePermissions]
            WHERE active = 1 AND tableName = :table;
            """), {'table':table}).fetchall()
        
        # if there was only one row in tablePermissions that matched the table then parse the data
        if (len(permissionResponse) == 1):
            
            output = dict()
            output['canView'] = self.parseTablePermissionsResult(permissionResponse[0]['viewing'])
            output['canEdit'] = self.parseTablePermissionsResult(permissionResponse[0]['editing'])
            output['canAdd'] = self.parseTablePermissionsResult(permissionResponse[0]['adding'])
            output['canDelete'] = self.parseTablePermissionsResult(permissionResponse[0]['deleting'])
            output['canAudit'] = self.parseTablePermissionsResult(permissionResponse[0]['auditing'])
            output['canUndelete'] = self.parseTablePermissionsResult(permissionResponse[0]['undeleting'])
            return output

        # else if there are no results, no biggie we just need to go get the defaults
        elif (len(permissionResponse) == 0):
            print('RESORTING TO DEFAULTS - getPermissionsObject()')
                # GET THE DEFAULTS
            defaultResponse = db.engine.execute(text(f"""
                SELECT viewingLevel AS viewing
                    ,editingLevel AS editing
                    ,addingLevel AS adding
                    ,deletingLevel AS deleting
                    ,undeletingLevel AS undeleting
                    ,auditingLevel AS auditing
                FROM [dbo].[TablePermissions]
                WHERE active = 1 AND tableName = 'DEFAULT';
                """)).fetchall()[0]
                # parse the data
            output = dict()
            output['canView'] = self.parseTablePermissionsResult(defaultResponse['viewing'])
            output['canEdit'] = self.parseTablePermissionsResult(defaultResponse['editing'])
            output['canAdd'] = self.parseTablePermissionsResult(defaultResponse['adding'])
            output['canDelete'] = self.parseTablePermissionsResult(defaultResponse['deleting'])
            output['canAudit'] = self.parseTablePermissionsResult(defaultResponse['auditing'])
            output['canUndelete'] = self.parseTablePermissionsResult(defaultResponse['undeleting'])
            return output

        # lastly if we get more than one response that means someone doubled up on tables in the tablePermissions
        else:
            print(' THERE ARE MORE THEN ONE ROWS FOR A TABLE IN TABLE PERMISSIONS ')
            abort(500)

        '''except Exception as e:
            print('error retrieveing permissions: Denying all access')
            print(f'ERROR: {e}')
            # there was an error getting the permission for this role so only admins should have access
            # and since we have already checked for them return a fully disabled permission object
            output = dict()
            output['canView'] = False
            output['canEdit'] = False
            output['canAdd'] = False
            output['canDelete'] = False
            output['canAudit'] = False
            output['canUndelete'] = False
            return output'''

        # When a user makes a new request after having logged in we don't want to send them back to CAS,
        #   so the Flask User library encrypts their byu Id and stores it as a cookie. This function
        #   is used to restore the user from that decripted cookie.
        # if takes a string (the cookie data), and an integer (the timeout time in seconds)
    def setFromString(self, rawCookie, timeoutTime):
            # parse cookie into id and time created
        import json, time
        userCookie = json.loads(rawCookie)
            # the time from when the user first logged in
        timeFromLogin = (time.time_ns() - userCookie['created'])/1000000000
            # if the user hasn't timed out...
        if timeFromLogin < timeoutTime:
            # restore all the data stored in the session cookie
            self.logged_in = True
            self.byuId = userCookie['id']
            self.tableId = userCookie['tableId']
            self.roleId = userCookie['roleId']
            self.roleText = userCookie['role']
            self.fullName = userCookie['name']
            self.isShopUser = userCookie['isShopUser']
                # this one is a bit weird, we want to be able to test different users access levels on the table
                # so we enable admins to temporarily change their roleId
                # this boolean lets them change it back
            self.isAdmin = userCookie['adminImposter']  
            return True

        else:
            # the user is timed out, log them out
            self.logged_in = False
            return False

        # member to process raw api.byu.edu/token response and log a user in based on that data
    def processOauthResponse(self, raw):
        import jwt, json
        # process the response
        data = json.loads(raw)
        userData = jwt.decode(data['id_token'], options={"verify_signature": False})
        # set logged in variables
        self.logged_in = True
        self.byuId = userData["net_id"]
        self.fullName = userData["sort_name"]
        self.getData()


        #When a user is not logged in they are redirected to CAS, which redirects them back with a token
        #   this function sends a request to a byu api with that token to get their byu Id
    def setFromTolken(self, token):
 
        import certifi, requests
        from sql_getter_app.collection import oauthKey, oauthSecret, oauthRedirect
        from flask import abort
            # sets the arguments for the request to the token api
        data = {'grant_type': 'authorization_code', 'code': token, 'redirect_uri': oauthRedirect} # callback URL
            # start a request instance with secure HTTPS enabled
        response = requests.post(
            'https://api.byu.edu/token',
            verify=certifi.where(), # gets the location of the server's certificates
            data=data, 
            auth=(oauthKey, oauthSecret) #(consumer key, consumer secret)
            )
        # if the byu api went through correctly...
        if int(response.status_code) == int(requests.codes['ok']):
            self.processOauthResponse(response.text)
        # if something went wrong (usually a bad token or someone is trying to hack us)...
        else:
            self.logged_in = False
            LOG.error('The byu oauth api returned the following error code: '+str(response.status_code))
            abort(403)
            
    
    # more members required by the flask_login library
    @property
    def is_active(self):
        return True

    @property
    def is_authenticated(self):
        return self.logged_in
        
    @property
    def is_anonymous(self):
        return False

        # THIS FUNCTION IS REQUIRED BY THE FLASK LOGIN LIBRARY DO NOT CHANGE ITS NAME
        #   It is called to create the session cookie and returns an identifier
        #   in our case their byu ID inside a dictionary with the time created (in nanoseconds from 1970)
        #   and other user identification
    def get_id(self):
        import six, json, time
        from flask import abort
        try:
            # constructs the userCookie object (be careful, if someone were to get ahold of the session cookie they could see all this stuff)
            # so don't put anything secure here (don't worry, an attacker can't modify anything without the secret key)
            userCookie = dict()
            userCookie['id'] = self.byuId
            userCookie['created'] = time.time_ns()
            userCookie['roleId'] = self.roleId
            userCookie['tableId'] = self.tableId
            userCookie['role'] = self.roleText
            userCookie['name'] = self.fullName
            userCookie['isShopUser'] = self.isShopUser
                # see setFromString
            userCookie['adminImposter'] = self.isAdmin
        except:
            abort(403)
        try:
            return six.text_type(json.dumps(userCookie)) # save the data to the cookie
        except AttributeError:
            raise NotImplementedError('No `id` attribute - override `get_id`')

    # required by the flask_login library
    def __ne__(self, other):
        '''
        Checks the inequality of two `UserMixin` objects using `get_id`.
        '''
        equal = self.__eq__(other)
        if equal is NotImplemented:
            return NotImplemented
        return not equal

    def returnUserName(self):
        from sql_getter_app.collection import db
        return self.byuId

    def returnFullName(self):
        print(self.fullName)
        return self.fullName

    # MASON: Checking if a user is a technician, for the service request functionality
    def checkIfUserIsTechnician(self):
        from sql_getter_app.collection import db, userTechId
        self.techId = db.engine.execute(f"SELECT [technician] FROM [User] WHERE userName='{self.byuId}';").fetchone()

        if (str(self.techId) == userTechId):
            return True
        else:
            return False

    # tells us if the user is the requestor of a service request or not
    def checkIfUserIsRequestor(self, row, PK):
        from sql_getter_app.collection import db
        self.requestorId = db.engine.execute(f"SELECT [userIdRequestor] FROM [serviceRequest] WHERE serviceRequestId='{str(row[PK])}';").fetchone()
        self.userId = db.engine.execute(f"SELECT [userId] FROM [User] WHERE userName='{self.byuId}';").fetchone()
        if (self.requestorId == self.userId):
            return True
        else:
            return False
            
    # tells us if the user is the Assigned To technician for a service request or not
    def checkIfUserIsAssignedTo(self, row, PK):
        from sql_getter_app.collection import db
        self.assignedId = db.engine.execute(f"SELECT [userIdTechnician] FROM [serviceRequest] WHERE serviceRequestId='{str(row[PK])}';").fetchone()
        self.userId = db.engine.execute(f"SELECT [userId] FROM [User] WHERE userName='{self.byuId}';").fetchone()

        if (self.assignedId == self.userId):
            return True
        else:
            return False