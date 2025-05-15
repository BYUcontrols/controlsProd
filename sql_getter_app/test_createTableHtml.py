# High level summary of this page:
# Contains the unit tests for the tableHtml class
#   1. Defines the functions that we use to setup these tests
#   2. Defines the functions for the actual tests

# here lie the unit tests for the tableHtml class
from flask_login import login_manager
from sql_getter_app.createTableHtml import tableHtml
# Here lie the functions that we use to settup these tests
class fakeUserForTest:
    def __init__(self, state):
        self.state = state
        return None

    def canView(self, table):
        self.passedData = table
        return self.state

class fakeRowProxy:
    def __init__(self, first, second):
        self.first = first
        self.second = second
        setattr(self, 'testPK', 'INDEX')  # so that we can access the primary key like row['testPK'])

    def __getpart__(self, part):
        return getattr(self, part)

    def parts(self):
        return [('first', self.first), ('second', self.second)]

def stubGetPermissionsObject(user, tableName):
    return [user, tableName]

def stubGetLinkedChildrenNOCHILDREN(tableName):
    return []

def stubGetLinkedChildrenYESCHILDREN(tableName):
    return ['something', 'something']

def stubLinkedElements(noLink):
    return noLink

def stubGetLinkedColumn(column):
    return {'passed':column}

def startEngine(User):

    testClass = tableHtml(User, 'testTable', 'testPK')
    testClass.testing = True

    return testClass

# And here lie the actual tests

def test__init__():
    # get a fresh tableHtml class
    htmlClass = startEngine("User")
    # check to make sure __init__ did it's job
    assert htmlClass.html == ""
    assert htmlClass.dName == "testTable"
    assert htmlClass.PK == "testPK"
    assert htmlClass.user == "User"

def test_newHeader():
    # test with the linkedDataTag as false (don't pass anything in the header)
    htmlClass = startEngine("a textual representation of the user class")
    keys = [('first',), ('second',)]
    htmlClass.newHeader(keys)
    print(htmlClass.html)
    assert htmlClass.html == '<thead><tr id="tableHead"><th>first</th><th>second</th></tr></thead>'
    assert htmlClass.keys == keys

    # test with the linkedDataTag as true (pass things in the header)
    htmlClass = startEngine("a textual representation of the user class")
    # stub out a few functions that will be called  
    keys = [('first',), ('second',)]
    htmlClass.getPermissionsObject = stubGetPermissionsObject
    htmlClass.getLinkedChildren = stubGetLinkedChildrenNOCHILDREN
    htmlClass.linkedElements = stubLinkedElements
    # run the test
    htmlClass.newHeader(keys, linkedDataTag=True, columnTypes='thereBeMonsters', dontLink='dontlinkthis')
    print(htmlClass.html)
    assert '''data-linked=\'"dontlinkthis"\'''' in htmlClass.html
    assert '''data-tableName='testTable\'''' in htmlClass.html
    assert '''data-columnTypes='"thereBeMonsters"\'''' in htmlClass.html
    assert '''data-columns='["first", "second"]\'''' in htmlClass.html
    assert '''data-permissions='["a textual representation of the user class", "testTable"]\'''' in htmlClass.html
    assert '''data-linkedChildrenExist='false\'''' in htmlClass.html 

    # test with the linkedDataTag as true (pass things in the header) But with many linked children
    htmlClass = startEngine("a textual representation of the user class")
    # stub out a few functions that will be called  
    keys = [('first',), ('second',)]
    htmlClass.getPermissionsObject = stubGetPermissionsObject
    htmlClass.getLinkedChildren = stubGetLinkedChildrenYESCHILDREN
    htmlClass.linkedElements = stubLinkedElements
    # run the test
    htmlClass.newHeader(keys, linkedDataTag=True, columnTypes='thereBeMonsters', dontLink='dontlinkthis')
    print(htmlClass.html)
    assert '''data-linked=\'"dontlinkthis"\'''' in htmlClass.html
    assert '''data-tableName='testTable\'''' in htmlClass.html
    assert '''data-columnTypes='"thereBeMonsters"\'''' in htmlClass.html
    assert '''data-columns='["first", "second"]\'''' in htmlClass.html
    assert '''data-permissions='["a textual representation of the user class", "testTable"]\'''' in htmlClass.html
    assert '''data-linkedChildrenExist='true\'''' in htmlClass.html

def test_content():

    # get an instance of the tableHtml class
    htmlClass = startEngine("a textual representation of the user class")
    #construct a fake response from the database
    tableData = [fakeRowProxy('uno', 'dos'), fakeRowProxy('eins', 'zwei')]
    # run the function
    htmlClass.content(tableData)
    # assert that it did the right thing
    print(htmlClass.html)
    assert '''<tbody id='tableBody'><tr data-id='INDEX'><td>uno</td><td>dos</td><td class='noPrint'></td></tr><tr data-id='INDEX'><td>eins</td><td>zwei</td><td class='noPrint'></td></tr></tbody>''' in htmlClass.html

def test_linkedElements():

    # get an instance of the tableHtml class
    htmlClass = startEngine("a textual representation of the user class")
    # stub things
    htmlClass.linkedColumnsStub = {
        'first':('stuff'),
        'second':('moreStuff'),
        'third':('this should not be seen')
    }
    htmlClass.keys = [('first',), ('second',)]
    htmlClass.getLinkedColumn = stubGetLinkedColumn
    # run the function (not linking the 'second' column)
    result = htmlClass.linkedElements('second')
    print(result)
    assert result == {'passed': 'first'}

def test_getLinkedColumn():
    # get an instance of the tableHtml class
    htmlClass = startEngine("a textual representation of the user class")
    # stub the linkedColumns 
    htmlClass.linkedColumnsStub = {
        'test1':('User', 'fullName', 'userId', 'ToReplace', {'testTable':'WHERE technician = \'true\'', 'TEST':'WHERE forServiceRequests = \'true\''}),
        'test2':('User', 'fullName', 'userId', 'ToReplace', {'Device':'WHERE forDevices = \'true\'', 'ServiceRequest':'WHERE forServiceRequests = \'true\''}),
        'test3':('User', 'fullName', 'userId', 'ToReplace')
    }
    from sql_getter_app.collection import db
    # insert two rows into the User table (deleting them first just in case)
    db.engine.execute("DELETE FROM [dbo].[User] WHERE userName = 'johndoe1'")
    db.engine.execute("""INSERT INTO [dbo].[User] (userName, firstName, lastName, technician, phone, eMail, vendorId, userIdModified, userRoleId, fullName) 
                VALUES ('johndoe1', 'John1', 'Doe1', 1, 1234567890, 'john1@doe.com', 1, 1, 1, 'John Doe1');""")
                # second row (not a technician)
    db.engine.execute("DELETE FROM [dbo].[User] WHERE userName = 'johndoe2'")
    db.engine.execute("""INSERT INTO [dbo].[User] (userName, firstName, lastName, technician, phone, eMail, vendorId, userIdModified, userRoleId, fullName) 
                VALUES ('johndoe2', 'John2', 'Doe2', 0, 1234567890, 'john2@doe.com', 1, 1, 1, 'John Doe2');""")

    # run the first test (user view table permission denied)
    # stub the user.canView member
    htmlClass.user = fakeUserForTest(False)
    # run test
    resTest1 = htmlClass.getLinkedColumn('test1')
    # make sure getLinkedColumn passed user.canView the correct table name
    assert htmlClass.user.passedData is 'User'
    # make sure that getLinkedColumn didn't give any data if it wasn't allowed to
    assert resTest1 is None

    # run the first test (one applicable where clause)
    # stub the user.canView member
    htmlClass.user = fakeUserForTest(True)
    # run test
    resTest1 = htmlClass.getLinkedColumn('test1')
    print(resTest1) # make sure the 'info' output was created correctly
    assert resTest1['test1']['info']['table'] is 'User'
    assert resTest1['test1']['info']['replacement'] is 'ToReplace'
    assert resTest1['test1']['info']['column'] is 'fullName'
    # make sure the correct data made it into the list
    assert 'John Doe1' in resTest1['test1'].values()
    assert not 'John Doe2' in resTest1['test1'].values()

    # run the second test (no applicable where clause)
    # stub the user.canView member
    htmlClass.user = fakeUserForTest(True)
    # run test
    resTest2 = htmlClass.getLinkedColumn('test2')
    print(resTest2) # make sure the 'info' output was created correctly
    assert resTest2['test2']['info']['table'] is 'User'
    assert resTest2['test2']['info']['replacement'] is 'ToReplace'
    assert resTest2['test2']['info']['column'] is 'fullName'
    # make sure the correct data made it into the list
    assert 'John Doe1' in resTest2['test2'].values()
    assert 'John Doe2' in resTest2['test2'].values()

    # run the third test (no where clause)
    # stub the user.canView member
    htmlClass.user = fakeUserForTest(True)
    # run test
    resTest3 = htmlClass.getLinkedColumn('test3')
    print(resTest3) # make sure the 'info' output was created correctly
    assert resTest3['test3']['info']['table'] is 'User'
    assert resTest3['test3']['info']['replacement'] is 'ToReplace'
    assert resTest3['test3']['info']['column'] is 'fullName'
    # make sure the correct data made it into the list
    assert 'John Doe1' in resTest3['test3'].values()
    assert 'John Doe2' in resTest3['test3'].values()