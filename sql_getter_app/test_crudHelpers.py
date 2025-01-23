# High level summary of this page:
#   1. import modules
#   2. defines functions for the unit tests on things like the following:
#       a. getKeys
#       b. verifyColumn
#       c. etc

from unittest.mock import patch, MagicMock
import sql_getter_app

from .collection import db
from .crud import getKeys, swapPositions, getOrderedKeys, getColumnTypes, getIdColumn, verifyColumn, verifyTableName, a

### unit tests

def test_getKeys(test_app_context):
    # test with the user Table
    keys = getKeys('User')
    print(keys)
    assert ('userId',) in keys
    assert ('userName',) in keys
    assert ('userIdModified',) in keys
    assert ('fullName',) in keys

    # test with an invalid table name, should throw an exception

    try:
        keys = getKeys('InvalidTableName')
        # should not make it this far
        assert False
    except Exception as err:
        assert True

def test_swapPositions():
    testList = ['zero', 'one', 'two', 'three', 'four', 'five']
    swapPositions(testList, 3, 5)
    print(testList)
    assert ['zero', 'one', 'two', 'five', 'four', 'three'] == testList
    swapPositions(testList, 7, 0) # with range error (should do nothing)
    assert ['zero', 'one', 'two', 'five', 'four', 'three'] == testList

# THIS TEST ASSUMES THAT swapPositions() WORKS CORRECTLY
#   there was no good way to stub it
def test_getOrderedKeys(test_app_context):
    # stub the getKeys() function
    with patch('crud.getKeys', return_value=[('one',), ('two',), ('three',)]) as getKeysMock:
        # add three columns to the tabOrder table
        db.engine.execute("""DELETE FROM [dbo].[TabOrder] WHERE tableName = 'testFood' AND columnName = 'one';""")
        db.engine.execute("""INSERT INTO [dbo].[TabOrder] (tableName, columnName, tabOrder, userIdModified) VALUES ('testFood', 'one', '3', '1');""")

        db.engine.execute("""DELETE FROM [dbo].[TabOrder] WHERE tableName = 'testFood' AND columnName = 'two';""")
        db.engine.execute("""INSERT INTO [dbo].[TabOrder] (tableName, columnName, tabOrder, userIdModified) VALUES ('testFood', 'two', '2', '1');""")

        db.engine.execute("""DELETE FROM [dbo].[TabOrder] WHERE tableName = 'testFood' AND columnName = 'three';""")
        db.engine.execute("""INSERT INTO [dbo].[TabOrder] (tableName, columnName, tabOrder, userIdModified) VALUES ('testFood', 'three', '1', '1');""")

        # run the test
        result = getOrderedKeys('testFood')
        # assert the results
        assert result == [('three',), ('two',), ('one',)]
        getKeysMock.assert_called_once_with('testFood')

def test_getColumnTypes(test_app_context):
    # run the function with a valid tableName
    assert getColumnTypes('User') == {'userId': {'COLUMN_NAME': 'userId', 'DATA_TYPE': 'int', 'CHARACTER_MAXIMUM_LENGTH': None, 'IS_NULLABLE': 'NO'}, 
        'userName': {'COLUMN_NAME': 'userName', 'DATA_TYPE': 'varchar', 'CHARACTER_MAXIMUM_LENGTH': 100, 'IS_NULLABLE': 'NO'}, 
        'firstName': {'COLUMN_NAME': 'firstName', 'DATA_TYPE': 'varchar', 'CHARACTER_MAXIMUM_LENGTH': 100, 'IS_NULLABLE': 'NO'}, 
        'lastName': {'COLUMN_NAME': 'lastName', 'DATA_TYPE': 'varchar', 'CHARACTER_MAXIMUM_LENGTH': 100, 'IS_NULLABLE': 'NO'}, 
        'technician': {'COLUMN_NAME': 'technician', 'DATA_TYPE': 'bit', 'CHARACTER_MAXIMUM_LENGTH': None, 'IS_NULLABLE': 'NO'}, 
        'phone': {'COLUMN_NAME': 'phone', 'DATA_TYPE': 'varchar', 'CHARACTER_MAXIMUM_LENGTH': 25, 'IS_NULLABLE': 'NO'}, 
        'eMail': {'COLUMN_NAME': 'eMail', 'DATA_TYPE': 'varchar', 'CHARACTER_MAXIMUM_LENGTH': 100, 'IS_NULLABLE': 'NO'}, 
        'vendorId': {'COLUMN_NAME': 'vendorId', 'DATA_TYPE': 'int', 'CHARACTER_MAXIMUM_LENGTH': None, 'IS_NULLABLE': 'YES'}, 
        'userIdModified': {'COLUMN_NAME': 'userIdModified', 'DATA_TYPE': 'int', 'CHARACTER_MAXIMUM_LENGTH': None, 'IS_NULLABLE': 'NO'}, 
        'userRoleId': {'COLUMN_NAME': 'userRoleId', 'DATA_TYPE': 'int', 'CHARACTER_MAXIMUM_LENGTH': None, 'IS_NULLABLE': 'YES'}, 
        'fullName': {'COLUMN_NAME': 'fullName', 'DATA_TYPE': 'varchar', 'CHARACTER_MAXIMUM_LENGTH': 50, 'IS_NULLABLE': 'NO'}}
    # run the function with an invalid table name
    try:
        res = getColumnTypes('invalidTableName')
        # we shouldn't make it this far
        assert False
    except Exception as e:
        assert True

def test_getIdColumn(test_app_context):
    # run the function with a valid table name
    assert getIdColumn('User') == 'userId'
    # run the function with an invalid table name
    try:
        res = getIdColumn('InvalidTableName')
        # we shouldnt get to here
        assert False
    except Exception as e:
        assert True

def test_verifyColumn():
    # define a fake table
    fakeCols = [('one',), ('two',), ('three',)]
    # run some tests
    assert verifyColumn(fakeCols, 'two') is True
    assert verifyColumn(fakeCols, 'three') is True
    assert verifyColumn(fakeCols, 'one') is True
    assert verifyColumn(fakeCols, 'BAD NAME') is False
    assert verifyColumn(fakeCols, '') is False

def test_verifyTableName(test_app_context):
    # test various names
    assert verifyTableName('User') is True
    assert verifyTableName('RubberDuckies') is False