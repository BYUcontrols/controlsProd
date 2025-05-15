# High level summary of this page:
# This is essentially one big class called sqlCommands
#   1. defines the __init__ function which uses getKeys if testing but if not uses getKeysStub
#   2. defines the values function which takes data from the client and turn it into segments of sql command strings
#   3. defines the where function which takes a dictionary, from the javascript on the site, of what to filter by and creates the where statement

import sys

from sqlalchemy.sql.expression import false
# for production
#sys.path.append('C:\\control-app\\appEnv\\sql_getter_app')

# creates sql where strings, and assembles objects of data into sql command string segments
#
# To use you start an instance and feed the constructor the tableName as a string 
# 
# Then if you are creating for instance an UPDATE sql command you would feed the self.values()
#   member the dictionary received from the javascript on the clients computer ( {'column':'value', 'column2':'value2', ...} )
#   and then when you are creating the string the self.pairs will contain a string with the values
#   in a sql friendly format ( 'column = value, column2 = value2, ...' ) and the self.insertDict
#   will contain a dictionary that will contain the parameters ( to prevent sql injection attacks, feed this
#   dictionary into the second argument of the sqlAlchemy db.execute() command )
#
# self.values() also generates self.columnsList and self.valueList for the SQL INSERT command
#
# self.where() takes data from the client and turns it into a sql where clause
# if testing you need to pass a getKeysStub
class sqlCommands:
    def __init__(self, tableName, testing=False, getKeysStub=None):
        self.testing = testing
        # stub getKeys if testing, else import it from crud
        if self.testing is False: from sql_getter_app.crud import getKeys
        else: getKeys = getKeysStub

        self.keys = getKeys(tableName)
        self.insertDict = dict()
        
    # takes data from the client and turn it into segments of sql command strings
    def values(self, valuesDict):

        if self.testing is False: from sql_getter_app.crud import verifyColumn
        else: verifyColumn = self.verifyColumn
        # create variables to populate
        sqlInsertCol = str() # store columns as a comma list
        sqlInsertVal = str() # store value references ':ref' as a comma list
        sqlValDict = dict() # place to define the value references
        sqlPairs = str() # stores the values as pairs, col=val
        counter = 1 # to create unique value references
        for column in valuesDict:
                # Verify if the columns are real (for SQL injection attacks)
            if verifyColumn(self.keys, column):
                sqlInsertCol += column + ','
                sqlInsertVal += ':'+str(counter)+','
                sqlPairs += column + '=:' + str(counter) + ','
                sqlValDict[str(counter)] = valuesDict.get(column)
                counter += 1
        
        sqlInsertCol = sqlInsertCol[:-1] # remove the last comma
        sqlInsertVal = sqlInsertVal[:-1]
        sqlPairs = sqlPairs[:-1]

        self.columnsList = sqlInsertCol
        self.valueList = sqlInsertVal
        self.insertDict = self.insertDict|sqlValDict
        self.pairs = sqlPairs

    # member takes a dictionary of what to filter by and creates the where statement
    # this dictionary comes from the javascript on the site and is formated like...
    #{
    #    "column name":{"op":"the operation","list":["value1","value2", ...]},
    #    ...
    #}
    # the options for operation are: containsOr, containsAnd, isNot, range, is, and bool
    def where(self, rawWhereDict):
        if self.testing is False: from sql_getter_app.crud import verifyColumn
        else: verifyColumn = self.verifyColumn
        import json
        if (rawWhereDict):
            whereDict = json.loads(rawWhereDict)
            text = str()
            #text += 'WHERE ' # to store where statement
            ############################################ Active Mod #########################################################################
            text += ' AND ' # to store where statement
            insertDict = dict() # to store corresponding values
            counter = 1 # to create placeholders

            self.showDeleted = False # set a default value for the self.showDeleted boolean

            for column in whereDict: # iterates through all the columns
                if (whereDict[column]['op'] == 'showDeleted'):
                    self.showDeleted = True
                elif verifyColumn(self.keys, column): # verifies if the column exists ( to make it safe to send to sql )
                        # Checks the operation and creates the appropriate command string
                    # if the value is not blank...
                    if (whereDict[column]['list']):

                        operation = whereDict[column]['op']

                        if (operation == 'containsOr'): # contains x or y or z, for varchars.
                            text += '('
                            for part in whereDict[column]['list']:
                                text += column +' LIKE :'+str(counter) + ' OR '
                                insertDict[str(counter)] = '%'+part+'%'
                                counter += 1
                            text = text[:-4] # remove 
                            text += ') AND '

                        elif (operation == 'containsAnd'):  # contains x and y and z
                            for part in whereDict[column]['list']:
                                text += column +' LIKE :'+str(counter) + ' AND '
                                insertDict[str(counter)] = '%'+part+'%'
                                counter += 1
                            text = text[:-4]
                            text += ' AND '

                        elif (operation == 'isNot'): # is not x and is not y and is not z
                            for part in whereDict[column]['list']:
                                text += column +' <> :'+str(counter) + ' AND '
                                insertDict[str(counter)] = part
                                counter += 1

                        elif (operation == 'range'): # is between x and y, for varchars and numbers
                            text += column +' BETWEEN :'+str(counter) + ' AND :' +str(counter + 1) + ' AND '
                            insertDict[str(counter)] = whereDict[column]['list'][0]
                            insertDict[str(counter + 1)] = whereDict[column]['list'][1]
                            counter += 2

                        elif (operation == 'is'): # is x or y or z
                            text += column + ' IN ('
                            for part in whereDict[column]['list']:
                                text += ':' + str(counter) + ','
                                insertDict[str(counter)] = part
                                counter += 1
                            text = text[:-1]
                            text += ') AND '

                        elif (operation == 'bool'): # is true or false
                            for part in whereDict[column]['list']:
                                text += column +' = :'+str(counter) + ' AND '
                                insertDict[str(counter)] = part
                                counter += 1

                        elif (operation == 'noneType'):
                            if (whereDict[column]['list'][0] == 'isNone'):
                                text += column +' IS NULL AND '
                            elif (whereDict[column]['list'][0] == 'isNotNone'):
                                text += column +' IS NOT NULL AND '

                        else:
                            print(f'UNRECOGNIZED FILTER KEY: {operation}')

                



            text = text[:-5] # remove last AND
        else: # for if there is no WHERE arguments
            text = ' '
            insertDict = {}

        self.text = text
        self.insertDict = insertDict|self.insertDict