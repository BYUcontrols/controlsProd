# See pythonDocs.html under Creating Table HTML for more information about the fuctionality of this page.

# High level summary of this page:
# This is truly one giant class called tableHtml
#   1. uses __init__ function to define some variables/values
#   2. creates the table header and an array with the columns
#   3. takes an array of sqlalchemy rowProxy objects and adds the data to the table html string
#   4. puts a no data text message in the table
#   5. takes a string for a column not to link, returns a dictionary containing the linked column data for the table (as obtained by self.getLinkedColumn())
#   6. fetches linked data in the form of a dictionary from the server for a given colName string

# a class to create the html for a table from a list of columns and sqlAlchemy resultProxys
from flask.globals import request
# below this is local module imports
from collection import camel_to_title
class tableHtml(object):

    def __init__(self, User, dbName, primaryKey, html=None):
        self.html = str()
        self.dName = dbName
        self.PK = primaryKey
        self.user = User
        self.testing = False
        self.requests = dict()
        # Use an if statement here to make it so that only when we create a service request does it execute this code.
        #if primaryKey == 'serviceRequestId':
            #self.non_persisted_column = kwargs['non_persisted_column']
            #willBeMerged = False # This boolean represents the Checkbox marker that we will use to merge the service requests(see serviceRequests.py line 285).
            #kwargs.pop('non_peristed_column')
            #super().__init__(kwargs)

    # create the table head and create an array with the column names
    #   linkedDataTag -> for creating tables that aren't the primary table and passes the linked
    #       and header data in the <tr> tag of the table
    #   columnTypes -> to put in the linkedDataTag
    #   dontLink -> column not to link
    #   uneditableList -> A list of the columns that aren't to be editable

    # This function creates the header of the table
    def newHeader(self, keys, linkedDataTag=False, columnTypes=None, dontLink=None, uneditableList=None):
        # Store the keys provided to the function in an instance variable
        self.keys = keys
        # Initialize an array to store column names and an empty string for headers
        self.columnArray = list()
        headersText = str()

        # Add the primary key (PK) column as the first header column
        headersText += f"<th>{self.PK}</th>"

        # Loop through each row in the keys array
        for row in keys:
            for cell in row:
                # Filter columns if necessary, ignoring the primary key and 'active' column
                if (self.PK != str(cell) and str(cell) != 'active'):
                    # Special case for 'estimatedDueDate' column
                    if str(cell) == 'estimatedDueDate':
                        headersText += "<th>Estimate</th>"
                        self.columnArray.append('Estimate')
                    else:
                        # Convert cell name to title case and add it to headers
                        headersText += "<th>" + camel_to_title(str(cell)) + "</th>"
                        # Add the column name to columnArray for tracking purposes
                        self.columnArray.append(str(cell))

        # Add an extra empty column for buttons in the table
        headersText += "<th class='noPrint'></th>"

        # Determine whether to add a linked data tag in the header row
        if not linkedDataTag:
            # Standard <tr> header row if linkedDataTag is not set
            self.html += '<thead><tr id="tableHead">'
        else:
            # Imports required for handling linked data and testing
            import json
            # Check if testing is disabled, in which case import getLinkedChildren function
            if self.testing is False:
                from crud import getLinkedChildren
            else:
                # Use a stub function for testing
                getLinkedChildren = self.getLinkedChildren

            # Append a <tr> with custom data attributes for the table if linkedDataTag is set
            # Data attributes are populated with JSON strings for use in JavaScript
            self.html += f'''<thead><tr id="tableHead" 
                data-linked=\'{json.dumps(self.linkedElements(dontLink))}\'
                data-tableName=\'{self.dName}\'
                data-columnTypes=\'{json.dumps(columnTypes)}\'
                data-columns=\'{json.dumps(self.columnArray)}\'
                data-permissions=\'{json.dumps(self.user.getPermissionsObject(self.dName))}\'
                data-linkedChildrenExist=\'{json.dumps(len(getLinkedChildren(self.dName)) > 0)}\'
                data-uneditable=\'{json.dumps(uneditableList)}\'>'''

        # Append the accumulated header HTML to the instance's html attribute and close the header row
        self.html += headersText + '</tr></thead>' # The <thead> stands for the Table Head Element.

    # takes an array of sqlalchemy rowProxy objects and adds the data to the table html string
    # turns a sqlalchemy query into a table
    def content(self, table, html=None, showDeleted=False):
        from createTableHtmlSupport import makeRow, checkIfStatusIsOpen
        import flask
        # the table body tag
        self.html += "<tbody id='tableBody'>"

        # PROBABLY DELETE LATER (maybe save code for print functionality) (Nov 2024)
        # THIS KILLS THE LOAD TIME. Each check for permissions queries the db several times
        # Create the view all / filtered service request table
        # urlPath = flask.request.path
        # if (self.PK == 'serviceRequestId'): # MASON: All this only runs if we are on the Service Request table
        #     # necessary import for the requestor and assigned to functions about 10 lines below
        #     from user_class import user_session  
        #     from formFuncs import getServReqData  
        #     import flask_login
        #     User = flask_login.current_user
        #     # MASON: This checks if the user is a technician or not. Useful for displaying the right rows later on.
        #     userIsTech = user_session.checkIfUserIsTechnician(User)

        #     for row in table:   # looping through each row in the tables
        #         # MASON: These two check if the user is the requestor or assigned to technician of the service request for a particular row
        #         userIsRequestor = user_session.checkIfUserIsRequestor(User, row, self.PK)
        #         userIsAssignedTo = user_session.checkIfUserIsAssignedTo(User, row, self.PK)
        #         # request is open if statusID is not closed, void, or resolved
        #         requestIsOpen = checkIfStatusIsOpen(User, row, self.PK)

        #         # MASON: Only displays the row under these conditions
        #         # Show all open requests filter, for technicians
        #         if (userIsTech and str(urlPath) == '/ServiceRequestShowAllOpenRequests'):
        #             # show all open requests
        #             print("userIsTech and str(urlPath) == '/ServiceRequestShowAllOpenRequests'")
        #             if (requestIsOpen): 
        #                 print("Open request")
        #                 makeRow(self, row, showDeleted)
        #                 # saving the SR data for the print functionality
        #                 self.requests[row[0]] = getServReqData(row[0])

        #         # Show all requests filter, for technicians. Shows all requests
        #         elif (userIsTech and str(urlPath) == '/ServiceRequestShowAllRequests'): 
        #             print("userIsTech and str(urlPath) == '/ServiceRequestShowAllRequests'")
        #             makeRow(self, row, showDeleted)
        #             # saving the SR data for the print functionality
        #             self.requests[row[0]] = getServReqData(row[0])
                
        #         # Technician starting point
        #         elif (userIsTech):
        #             # Shows technicians SRs that they are requestor or assigned to that are open
        #             if ((userIsRequestor or userIsAssignedTo) and requestIsOpen): 
        #                 makeRow(self, row, showDeleted)
        #                 # saving the SR data for the print functionality
        #                 self.requests[row[0]] = getServReqData(row[0])
                
        #         # Non-Technician starting point
        #         else:
        #             # Shows non-techs the SRs that they are requestor for (even closed ones)
        #             # if (userIsRequestor):
        #             makeRow(self, row, showDeleted)
        #             # saving the SR data for the print functionality
        #             self.requests[row[0]] = getServReqData(row[0])

        # else:   # This runs if we are on any table besides the Service Request table
        for row in table: makeRow(self, row, showDeleted)
        # close the body
        self.html += "</tbody>"

    # puts a no data text message in the table
    def noRows(self, message="No data to display."):
        self.html += f"<tbody>{message}</tbody>" # <tbody> stands for the Table Body Element.

    # takes a string for a column not to link
    #   returns a dictionary containing the linked column data for the table (as obtained by self.getLinkedColumn())
    def linkedElements(self, dontLink=None):
        if self.testing is False: # if we're not testing
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
                # if it returned successfully then append the data to the links Dictionary
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
        from collection import db

        # extract the requisite data from linkedColumns
        table = linkedColumns[colName][0]
        displayColumn = linkedColumns[colName][1]
        idColumn = linkedColumns[colName][2]
        replacementName = linkedColumns[colName][3]

        # verify that the user has permission to view the table
        if self.user.canView(table):
            # get the where parameters (or lack thereof)
            if len(linkedColumns[colName]) > 4: 
                if self.dName in linkedColumns[colName][4]: whereText = linkedColumns[colName][4][self.dName]
                else: whereText = None
            else: whereText = None

            # condition where text
            if (not whereText): whereText = '' 
            # Ask the database for the idColumn and displayColumn
            if(whereText == ''):
                result = db.engine.execute(f"SELECT [{idColumn}] as id, [{displayColumn}] as val FROM [{table}]").fetchall()
            else:
                result = db.engine.execute(f"SELECT [{idColumn}] as id, [{displayColumn}] as val FROM [{table}] WHERE active = 1 OR active = 0 {whereText}").fetchall()
            # the object to return
            converted = dict()
                # loop through the rows and turn them into dictionaries with the format {'idNum':'value'}
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

            # another dictionary with {column Name To replace : converted}
            wrapper = dict()
            wrapper[colName] = converted
            return wrapper