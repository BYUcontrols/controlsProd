# High level summary of this page:
#   1. import modules
#   2. defines functions for the unit tests on the functions from userClass.py

# here lie the unit tests for the user session class

import pytest
from unittest.mock import MagicMock, patch
import sql_getter_app
from requests import status_codes

from collection import db
from crud import pull
from user_class import user_session

# basic init function that returns a fresh user_session
def userSession_testInit():
    return user_session()

# class with members that are called by members we will test in the user class
# this class will be used to fake, 
# or stub members of the user_session class that we don't want to test in that use case
class userSessionTestStubClass():

    def getDataStub(self):
 
        self.accessLevel = 5
        self.tableId = 'None'
        self.roleText = 'testing'
    
    def accessTableAccessLevelStub(self, column, tableName, default):
        self.columnPassed = column
        self.tablePassed = tableName
        if (tableName == 'goodName'): return True
        else: return False

    def processOauthResponse(self, raw):
        self.TESTdata = raw
        self.logged_in = True
        self.byuId = 'testBYUid'
        self.fullName = 'Humpty Dumpty'

    def somethingWasCalled(self):
        try: # check to see if the self.wasCalled is defined
            self.wasCalled += 1
        except:
            self.wasCalled = 1
        return True

# we will simply test every member one at a time, top to bottom

def test_userSession_getData(test_app_context):
     
    # create a test user to experiment on in the database
    db.engine.execute("DELETE FROM [dbo].[User] WHERE userName = 'johndoe'")
    db.engine.execute("""INSERT INTO [dbo].[User] (userName, firstName, lastName, technician, phone, eMail, vendorId, userIdModified, userRoleId, fullName) 
                VALUES ('johndoe', 'John', 'Doe', 0, 1234567890, 'john@doe.com', 1, 1, 1, 'John Doe');""")
    
    # TEST WHEN THE USER EXISTS IN THE USER TABLE
    # create a user to do tests on
    user = userSession_testInit()
    # settup the variables needed by the test
    user.byuId = 'johndoe'
    # run the function with a user that exists
    user.getData()
    assert user.accessLevel is 1
    assert user.tableId is db.engine.execute(f"SELECT [userId] FROM [User] WHERE userName='{user.byuId}';").fetchall()[0][0]
    
    # create a user to do tests on
    user = userSession_testInit()
    # settup the variables needed by the test
    user.byuId = 'nonExistentUser'
    # run the function with a user that exists
    user.getData()
    
    assert user.tableId is 'None'

    # clean up the table
    db.engine.execute("DELETE FROM [dbo].[User] WHERE userName = 'johndoe'")
    
def test_userSession_accessTableAccessLevel(test_app_context):
    
    # create a test table entry in tablePermissions to experiment on in the database
    db.engine.execute("DELETE FROM [dbo].[TablePermissions] WHERE tableName = 'aTableForTesting'")
    db.engine.execute("""INSERT INTO [dbo].[TablePermissions] (tableName, viewingLevel, editingLevel, addingLevel, deletingLevel, userIdModified) 
                VALUES ('aTableForTesting', 100, 101, 102, 103, 1);""")

def test_userSession_canView():
    import types # to stub out the memebrs
    user = userSession_testInit()
    # stub the accessTableAccessLevelStub
    user.accessTableAccessLevel = types.MethodType(userSessionTestStubClass.accessTableAccessLevelStub, user)
    # test if the function can recognize a good table and a bad table
    assert user.canView('goodName') is True
    assert user.canView('badName') is False
    # check to make sure it was looking for the correct column
    assert user.columnPassed is 'viewingLevel'

def test_userSession_canEdit():
    import types # to stub out the memebrs
    user = userSession_testInit()
    # stub the accessTableAccessLevelStub
    user.accessTableAccessLevel = types.MethodType(userSessionTestStubClass.accessTableAccessLevelStub, user)
    # test if the function can recognize a good table and a bad table
    assert user.canEdit('goodName') is True
    assert user.canEdit('badName') is False
    # check to make sure it was looking for the correct column
    assert user.columnPassed is 'editingLevel'

def test_userSession_canAdd():
    import types # to stub out the memebrs
    user = userSession_testInit()
    # stub the accessTableAccessLevelStub
    user.accessTableAccessLevel = types.MethodType(userSessionTestStubClass.accessTableAccessLevelStub, user)
    # test if the function can recognize a good table and a bad table
    assert user.canAdd('goodName') is True
    assert user.canAdd('badName') is False
    # check to make sure it was looking for the correct column
    assert user.columnPassed is 'addingLevel'

def test_userSession_canDelete():
    import types # to stub out the memebrs
    user = userSession_testInit()
    # stub the accessTableAccessLevelStub
    user.accessTableAccessLevel = types.MethodType(userSessionTestStubClass.accessTableAccessLevelStub, user)
    # test if the function can recognize a good table and a bad table
    assert user.canDelete('goodName') is True
    assert user.canDelete('badName') is False
    # check to make sure it was looking for the correct column
    assert user.columnPassed is 'deletingLevel'

def test_userSession_setFromString():
    import json, time
    # get a fresh instance of the class
    user = userSession_testInit()

    # get the time right now (simpulating that the user has not been timmed out yet)
    timeLoggedIn = time.time_ns()
    # construct a string (in real life this is the decoded session cookie)
    sessionString = '{"id": "test", "created": '+str(timeLoggedIn)+', "level": 1, "tableId": 1, "role": "Admin", "name": "testing"}'
    # execute the command with one second timeout time
    assert user.setFromString(sessionString, 1) == True
    assert user.logged_in == True
    assert user.byuId == 'test'
    assert user.accessLevel == 1
    assert user.tableId == 1
    assert user.roleText == 'Admin'
    assert user.fullName == 'testing'

    # Do it all over again but now make the user timed out (barely)
    timeLoggedIn = time.time_ns() - 1000000001
    # construct a string (in real life this is the decoded session cookie)
    sessionString = '{"id": "test", "created": '+str(timeLoggedIn)+', "level": 1, "tableId": 1, "role": "Admin", "name": "testing"}'
    # execute the command with one second timeout time
    assert user.setFromString(sessionString, 1) == False
    assert user.logged_in == False

    # Do it all over again but now make the user not timed out (barely)
    timeLoggedIn = time.time_ns() - 999999900
    # construct a string (in real life this is the decoded session cookie)
    sessionString = '{"id": "test", "created": '+str(timeLoggedIn)+', "level": 1, "tableId": 1, "role": "Admin", "name": "testing"}'
    # execute the command with one second timeout time
    assert user.setFromString(sessionString, 1) == True
    assert user.logged_in == True

def test_userSession_processOauthResponse():
    import types # to stub out the memebrs
    # here is a response form the byu oauth api when I login. Use wisely. Please.
    sampleResponse = """{"scope":"openid","token_type":"bearer","expires_in":3600,"refresh_token":"294528d667ae98e4e24299c6b7d8f","id_token":"eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJieXVcL2lqYzI0QGNhcmJvbi5zdXBlciIsImF6cCI6IkVrakNyM0dTODVGcTBXNElSbFFHX01rbFQyUWEiLCJwZXJzb25faWQiOiIzMDgyOTA3NTIiLCJhdF9oYXNoIjoiTVRGbFl6YzFaR1V5T0RSallUSTJZelZpTURWaE0yUmpZemc1TnpOaU9BPT0iLCJpc3MiOiJodHRwczpcL1wvd3NvMi1pcy5ieXUuZWR1XC9vYXV0aDJlbmRwb2ludHNcL3Rva2VuIiwic3VybmFtZSI6IkN1dGxlciIsInByZWZlcnJlZF9maXJzdF9uYW1lIjoiSXNhYWMiLCJyZXN0X29mX25hbWUiOiJJc2FhYyBKYW1lcyIsIm5ldF9pZCI6ImlqYzI0IiwiaWF0IjoxNjE3MjI1NDUyNDgxLCJzdWZmaXgiOiIgIiwic29ydF9uYW1lIjoiQ3V0bGVyLCBJc2FhYyBKYW1lcyIsImF1dGhfdGltZSI6MTYxNzIyNTQ1MjQ3MSwiZXhwIjoxNjE3MjI5MDUyNDgxLCJwcmVmaXgiOiIgIiwic3VybmFtZV9wb3NpdGlvbiI6IkwiLCJhdWQiOlsiRWtqQ3IzR1M4NUZxMFc0SVJsUUdfTWtsVDJRYSJdLCJieXVfaWQiOiIwNDQ4NDExMzQifQ.ZZKX0zSHsrI56XY4yymdLYcaHZbkU9SxAxSbCdouFvSvGsiS8IgjqnLRj5AyWbyUZyGid4suKHKgeEQ6HmVw7c2vq7GmBQhadsO1eBdrKLJCdYM4vMV0_vSdzzNkJFKvi-sCfQ-BkmRyo6nVii3oVN5rY58atSOW6suNLYaeXy0U0seIyKGi8acYT7N9L993Cs-BocT76cs1kOLvTdRBHl9KYDFPIFsS2KT-bl-eMjiJtYqCLRglIrKutowRnsPcPgSrwOnHPuiBwa9zDGZN3Sergp5ZaRfpZWWPOTHy8ZGq2mfLvIo5L5RLGr3CytYtiCrqMHg9VFzIBvfjYUbAQw","access_token":"11ec75de284ca26c5b05a3dcc8973b8"}"""

    # spin up another user to experiment on
    user = userSession_testInit()
    
    # stub the getData() method
    user.getData = types.MethodType(userSessionTestStubClass.somethingWasCalled, user)

    # run the test
    user.processOauthResponse(sampleResponse)

    assert user.wasCalled == 1
    assert user.logged_in == True
    assert user.byuId == 'ijc24'
    assert user.fullName == 'Cutler, Isaac James'

def test_userSession_setFromTolken():
    import requests
    import requests_mock
    import types # to stub out the memebrs
    # settup a system that stubs out the requests library so that when the .setFromTolken() sends a request to api.byu.edu
    with requests_mock.Mocker() as m:
        m.post('https://api.byu.edu/token', text='hereIsSomeData')
        user = userSession_testInit()
        # stub the process Oauth response member
        user.processOauthResponse = types.MethodType(userSessionTestStubClass.processOauthResponse, user)
        user.setFromTolken('whatever')
    # assert that all the correct values have been set
        assert user.TESTdata == 'hereIsSomeData'
        assert user.logged_in == True
        assert user.byuId == 'testBYUid'
        assert user.fullName == 'Humpty Dumpty'

    # fake a request where somenting goes wrong with the server and returns a bad code
    with requests_mock.Mocker() as m:
        m.post('https://api.byu.edu/token', text='hereIsSomeData', status_code='404')
        user = userSession_testInit()
        # stub the process Oauth response member
        user.processOauthResponse = types.MethodType(userSessionTestStubClass.processOauthResponse, user)
        threwAnError = False
        try: # we will run this inside a try loop because it is meant to throw errors 
            # (it should throw a 403 error, but pytest can't handle flask's error handling system and freaks out)
            user.setFromTolken('whatever')
        except:
            threwAnError = True
    # assert that all the correct values have been set
        assert user.logged_in == False
        assert threwAnError == True

def test_getPermissionsObject(): ################################################################# This has been moved to the User class, move it when you have time
    # patch the user_session class
    with patch('auth.user_session', autospec=True, return_value=True) as userMock:
        # run the rest
        res = user_session.getPermissionsObject(userMock, 'testTable')
        # assert results
        userMock.canView.assert_called_once_with('testTable')
        userMock.canEdit.assert_called_once_with('testTable')
        userMock.canAdd.assert_called_once_with('testTable')
        userMock.canDelete.assert_called_once_with('testTable')