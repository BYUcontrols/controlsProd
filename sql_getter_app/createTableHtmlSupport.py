# MASON: functions I created while modifying the tableHtml class found in the createTableHtml module

# function used in the createTableHtml module, tableHtml class in order to make a row in the table
def makeRow(self, row, showDeleted):
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
        # and if a column is not the serviceTypeId column in the SR page (We don't want that showing up, but we want it to appear in the filter)
        #  or pair[0] != 'serviceTypeId'
        if ((pair[0] != self.PK and pair[0] != 'active')):
            # put the value into the table
            self.html += f"<td>{str(pair[1])}</td>"
    # create a cell where we can put the buttons and close the row
    self.html += "<td class='noPrint'></td></tr>"
    
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