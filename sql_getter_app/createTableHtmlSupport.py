# MASON: functions I created while modifying the tableHtml class found in the createTableHtml module
from sql_getter_app.collection import db

# function used in the createTableHtml module, tableHtml class in order to make a row in the table
def makeRow(self, row, showDeleted, dName):
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
        if ((pair[0] != self.PK and pair[0] != 'active')):
            # put the value into the table
            self.html += f"<td id='{str(row[self.PK])}-{pair[0]}'>{str(pair[1])}</td>"

    if dName == "ServiceRequest":
        column, userIdRequestor = row.items()[0]
        requestorPhone = db.engine.execute(f"SELECT [phone] FROM [User] WHERE userId='{str(userIdRequestor)}' AND active=1").fetchone()
        if requestorPhone:
            requestorPhone = requestorPhone[0]
        # if the table is the ServiceRequest table, add a cell for the requestor's phone number
        self.html += f"<td id='requestorPhone'>{requestorPhone}</td>"
        
        column, serviceRequestId = row.items()[1]
        lastNote = db.engine.execute(f"SELECT TOP 1 [note] FROM [RequestNote] WHERE serviceRequestId='{str(serviceRequestId)}' AND active=1 ORDER BY [requestNoteId] DESC;").fetchone()
        if lastNote:
            lastNote = lastNote[0]
        # if the table is the ServiceRequest table, add a cell for the last note added to that service request
        self.html += f"<td id='lastNote'>{lastNote}</td>"

        
    # create a cell where we can put the buttons and close the row
    if "Audit" not in dName:
        # if the table is not the Audit or ServiceRequest table, add a cell for the edit button
        self.html += "<td id='editCell'></td></tr>"
    
# tells us if the row has an open status or not
def checkIfStatusIsOpen(self, row, PK):
    from sql_getter_app.collection import db
    self.rowStatus = db.engine.execute(f"SELECT [statusId] FROM [serviceRequest] WHERE serviceRequestId='{str(row[PK])}';").fetchone()

    closedId = db.engine.execute(f"SELECT [statusId] FROM [Status] WHERE status='Closed';").fetchone()
    voidId = db.engine.execute(f"SELECT [statusId] FROM [Status] WHERE status='Void';").fetchone()
    resolvedId = db.engine.execute(f"SELECT [statusId] FROM [Status] WHERE status='Resolved';").fetchone()

    if (self.rowStatus != closedId and self.rowStatus != voidId and self.rowStatus != resolvedId):
        return True
    else:
        return False