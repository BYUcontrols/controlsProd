# a class to create the html for a table from a list of columns and sqlAlchemy resultProxys
from .collection import camel_to_title
class tableHtml(object):

    def __init__(self, User, dbName, primaryKey):
        self.html = str()
        self.dName = dbName
        self.PK = primaryKey
        self.user = User
        self.testing = False

    # create the table head and create an array with the column names
    #   linkedDataTag -> for creating tables that aren't the primary table and passes the linked
    #       and header data in the <tr> tag of the table
    #   columnTypes -> to put in the linkedDataTag
    #   dontLink -> column not to link
    #   uneditableList -> A list of the columns that aren't to be editable
    def newHeader(self, keys, linkedDataTag=False, columnTypes=None, dontLink=None, uneditableList=None):
        self.keys = keys
        # so we can pass self.columnArray in the <tr> element
        self.columnArray = list()
        headersText = str()
        # Add the Id Column
        headersText += f"<th>{self.PK}</th>"
        # loop through all the rows
        for row in keys:
            for cell in row:
                if (self.PK != str(cell) and str(cell) != 'active'): # ignore the primary key column
                    # insert the header cell
                    headersText += "<th>" + camel_to_title(str(cell)) + "</th>"
                    # add an element to the self.columnArray
                    self.columnArray.append(str(cell))
        # add an extra empty column for the buttons
        headersText += "<th class='noPrint'></th>"
        # if we don't want to pass all the info in the header
        if (not linkedDataTag): 
            self.html += '<thead><tr id="tableHead">'
        # The linkedDataTag option passes all the data needed to load the table in the <tr> tag.
        else: 
            import json
            # so that we can stub out functions for testing
            if self.testing is False:
                from .crud import getLinkedChildren
            else:
                getLinkedChildren = self.getLinkedChildren
            # pass the data required for a table to run, if you have questions look at crud.py/pull() where we pass this data and explain it
            # to sanitize the data and make sure it will make it safe back to the javascript we send it as a JSON string (look it up)
            self.html += f'''<thead><tr id="tableHead" 
                data-linked=\'{json.dumps(self.linkedElements(dontLink))}\'
                data-tableName=\'{self.dName}\'
                data-columnTypes=\'{json.dumps(columnTypes)}\'
                data-columns=\'{json.dumps(self.columnArray)}\'
                data-permissions=\'{json.dumps(self.user.getPermissionsObject(self.dName))}\'
                data-linkedChildrenExist=\'{json.dumps(len(getLinkedChildren(self.dName)) > 0)}\'
                data-uneditable=\'{json.dumps(uneditableList)}\'>'''

        # append the headers html text
        self.html += headersText + '</tr></thead>'

    # takes an array of sqlalchemy rowProxy objects and adds the data to the table html string
    def content(self, table, showDeleted=False):
        # the table body tag
        self.html += "<tbody id='tableBody'>"
        
        for row in table:
    
            # create a class string variable if we are showing deleted rows that indicates that the row is deleted (if it's deleted)
            if (showDeleted and (row['active'] == False)): classString = 'class=\'deletedRow\' data-deleted=\'true\''
            else: classString = ''
            # the row tag (with the rowId)
            self.html += f"<tr data-id='{str(row[self.PK])}' {classString}>"
            # Add the Id column field
            self.html += f"<td>{str(row[self.PK])}</td>"
            # cast the row (rowProxy) as a dictionary
            rowDictionary = row.items()
            # iterate through the row
            for pair in rowDictionary:
                # if a row is not the primary key
                if (pair[0] != self.PK and pair[0] != 'active'):
                    # put the value into the table
                    self.html += f"<td>{str(pair[1])}</td>"
     
            # create a cell where we can put the buttons and close the row
            self.html += "<td class='noPrint'></td></tr>"
        # close the body
        self.html += "</tbody>"

    # puts a no data text message in the table
    def noRows(self, message):
        self.html += f"<tbody></tbody>"

    # takes a string for a column not to link
    #   returns a dictionary containing the linked column data for the table (as obtained by self.getLinkedColumn())
    def linkedElements(self, dontLink=None):
        if self.testing is False:
            # fetch the list of which columns to link (it's refering to linkedData.py)
            from linkedData import linkedColumns
        else: # a place where we can test different data
            linkedColumns = self.linkedColumnsStub
        

        links = dict()
        # loop through all the columns
        for key in self.keys:
            # if the column is linked and not the dontLink column...
            if str(key[0]) in linkedColumns and not key[0] == dontLink:
                # get the data for that column
                linkedColumn = self.getLinkedColumn(str(key[0]))
                # if it returned sucessful then append the data to the links Dictionary
                if (linkedColumn): links.update(linkedColumn)

        return links

    # fetches linked data in the form of a dictionary from the server for a given colName string
    # in the form 
    #{
    #  'colName':{
    #     1:'val1', 
    #     2:'val2', 
    #     ... , 
    #     'info':{
    #       'table':tablename, 
    #       'replacement':pretty human readable name,
    #       'column': the actual sql column name
    #      }
    #   }
    #}

    def getLinkedColumn(self, colName):
        
        # import the list of columns to link
        if self.testing is False:
            from linkedData import linkedColumns
        else:
            linkedColumns = self.linkedColumnsStub
        # fetch the initialized database
        from .collection import db

        # extract the requisite data from linkedColumns
        table = linkedColumns[colName][0]
        displayColumn = linkedColumns[colName][1]
        replacementName = linkedColumns[colName][3]
        idColumn = linkedColumns[colName][2]
        
        # verify that the user has permission to view the table
        if self.user.canView(table):
            # get the were parameters (or lack thereof)
            if len(linkedColumns[colName]) > 4: 
                if self.dName in linkedColumns[colName][4]: whereText = linkedColumns[colName][4][self.dName]
                else: whereText = None
            else: whereText = None
            # condition where text
            if (not whereText): whereText = '' 
            # Ask the database for the idColumn and displyColumn
            result = db.engine.execute(f"SELECT [{idColumn}] as id, [{displayColumn}] as val FROM [{table}] WHERE active = 1 {whereText}").fetchall()
            # the object to return
            converted = dict()
                # loop thorugh the rows and turn them into dicts with the format {'idNum':'value'}
            for row in result:
                raw = dict(row.items())
                data = dict()
                data[str(raw['id'])] = str(raw['val'])
                converted.update(data)

                # place info about the link into another dict
            info = dict()
            info['table'] = table
            info['replacement'] = replacementName
            info['column'] = displayColumn
            infoWrapper = dict()
            infoWrapper['info'] = info
            # put the info entry into the converted dictionary
            converted.update(infoWrapper)

            # another dictionary with { column Name To replace : converted}
            wrapper = dict()
            wrapper[colName] = converted
            return wrapper

        