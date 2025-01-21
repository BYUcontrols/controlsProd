import pytest
import sql_getter_app

from collection import db
from sqlCommandClass import sqlCommands

# stub functions

def getKeysStubFunction(input):
    assert input is 'testTableInput'
    return [('noelle',), ('dieter',)]

def startSqlComTestObj():
    return sqlCommands('testTableInput', testing=True, getKeysStub=getKeysStubFunction)

def verifyColumnFALSE(one, two):
    return False

def verifyColumnTRUE(one, two):
    return True

 


def test_initSqlCom():
    sqlCom = startSqlComTestObj()
    assert sqlCom.keys == [('noelle',), ('dieter',)]
    assert hasattr(sqlCom, 'insertDict') 

def test_values():
    sqlCom = startSqlComTestObj()

    # stub the verify column function WHEN THE COLUMNS ARE OK
    sqlCom.verifyColumn = verifyColumnTRUE
    # run the test
    values = {'noelle':'girl', 'dieter':'boy'}
    sqlCom.values(values)
    # assert that the function did it all right
    assert sqlCom.columnsList == 'noelle,dieter'
    assert sqlCom.valueList == ':1,:2'
    assert sqlCom.insertDict == {'1': 'girl', '2': 'boy'}
    assert sqlCom.pairs == 'noelle=:1,dieter=:2'


    sqlCom = startSqlComTestObj()
    # stub the verify column function WHEN THE COLUMNS ARE NOT OK
    sqlCom.verifyColumn = verifyColumnFALSE
    # run the test
    values = {'noelle':'girl', 'dieter':'boy'}
    sqlCom.values(values)
    # assert that the function did it all right
    assert sqlCom.columnsList == ''
    assert sqlCom.valueList == ''
    assert sqlCom.insertDict == {}
    assert sqlCom.pairs == ''

def test_where():

    # test the 'is' operator
    sqlCom = startSqlComTestObj()
    sqlCom.verifyColumn = verifyColumnTRUE
    rawData = '{"noelle":{"op":"is","list":["a"]}}'
    sqlCom.where(rawData)
    assert sqlCom.text == ' AND noelle IN (:1)'
    assert sqlCom.insertDict == {'1': 'a'}

    # test the 'containsOr' operator
    sqlCom = startSqlComTestObj()
    sqlCom.verifyColumn = verifyColumnTRUE
    rawData = '{"noelle":{"op":"containsOr","list":["a","b"]}}'
    sqlCom.where(rawData)
    assert sqlCom.text == ' AND (noelle LIKE :1 OR noelle LIKE :2)'
    assert sqlCom.insertDict == {'1': '%a%', '2': '%b%'}

    # test the 'containsAnd' operator
    sqlCom = startSqlComTestObj()
    sqlCom.verifyColumn = verifyColumnTRUE
    rawData = '{"noelle":{"op":"containsAnd","list":["a","b"]}}'
    sqlCom.where(rawData)
    assert str(sqlCom.text) == str(" AND noelle LIKE :1 AND noelle LIKE :2 ")
    assert sqlCom.insertDict == {'1': '%a%', '2': '%b%'}

    # test the 'isNot' operator
    sqlCom = startSqlComTestObj()
    sqlCom.verifyColumn = verifyColumnTRUE
    rawData = '{"noelle":{"op":"isNot","list":["a"]}}'
    sqlCom.where(rawData)
    assert sqlCom.text == ' AND noelle <> :1'
    assert sqlCom.insertDict == {'1': 'a'}

    # test the 'range' operator
    sqlCom = startSqlComTestObj()
    sqlCom.verifyColumn = verifyColumnTRUE
    rawData = '{"noelle":{"op":"range","list":["a","b"]}}'
    sqlCom.where(rawData)
    assert sqlCom.text == ' AND noelle BETWEEN :1 AND :2'
    assert sqlCom.insertDict == {'1': 'a', '2': 'b'}

    # test the 'bool' operator
    sqlCom = startSqlComTestObj()
    sqlCom.verifyColumn = verifyColumnTRUE
    rawData = '{"noelle":{"op":"bool","list":["True"]}}'
    sqlCom.where(rawData)
    assert sqlCom.text == ' AND noelle = :1'
    assert sqlCom.insertDict == {'1': 'True'}




