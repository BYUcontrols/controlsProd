#   A Module I created for functions that help with getting information from forms
#   and submitting them to the database because the serviceRequests module was getting
#   crowded.

from sqlalchemy.sql import null
import flask_login
# below are local module imports
from sql_getter_app.collection import db, devUserName
from sql_getter_app.user_class import user_session

# takes the info submitted by the user to create a new requestor and sumbits it to the database to save it
def newReqHelper(userName, firstName, lastName, technician, phone, email, vendorId, userIdModified, fullName, userRoleId):
    active = True
    noneVal = None

    # print('userName: ' + str(userName) + '\n','firstName: ' + str(firstName) + '\n','lastName: ' + str(lastName) + '\n','technician: ' + str(technician) + '\n','phone: ' + str(phone) + '\n','email: ' + str(email) + '\n','vendorId: ' + str(vendorId) + '\n','userIdModified: ' + str(userIdModified) + '\n','fullName: ' + str(fullName) + '\n','userRoleId: ' + str(userRoleId) + '\n','active: ' + str(active) + '\n',)

    # format the data correctly
    if (vendorId == 'None'):
        vendorId = noneVal
    else:
        vendorVal = vendorId
        vendorId = int(db.engine.execute(f"SELECT [vendorId] FROM [Vendor] WHERE name='{vendorVal}';").fetchall()[0][0])
    
    if (userIdModified == devUserName):
        # this is the id number of the System user in the User table of the database
        userIdModified = 2
    else:
        userModVal = userIdModified
        userIdModified = int(db.engine.execute(f"SELECT [userId] FROM [User] WHERE userName='{userModVal}';").fetchall()[0][0])
    
    if (technician == 'false'):
        technician = False
    else:
        technician = True
    
    if (phone == ''):
        phone = noneVal
    if (email == ''):
        email = noneVal

    db.engine.execute(f"""INSERT INTO [User]\nVALUES (?,?,?,?,?,?,?,?,?,?,?);""", (userName, firstName, lastName, technician, vendorId, 
    userIdModified, fullName, noneVal, active, phone, email,))
    
    # make a new user/role pair in the UserRole table
    roleId = int(db.engine.execute(f"SELECT [roleId] FROM [Role] WHERE role='{userRoleId}';").fetchall()[0][0])
    userId = int(db.engine.execute(f"SELECT [userId] FROM [User] WHERE userName='{userName}';").fetchall()[0][0])
    db.engine.execute(f"""INSERT INTO [UserRole]\nVALUES ('{userId}', '{roleId}', '{userIdModified}', '{active}');""")

    # update the userRoleId column for the user we just created with the UserRole pair we just created
    userRoleId = int(db.engine.execute(f"SELECT [userRoleId] FROM [UserRole] WHERE userId='{userId}' AND roleId='{roleId}';").fetchall()[0][0])
    db.engine.execute(f"""UPDATE [User]\nSET [userRoleId] = '{userRoleId}'\nWHERE userName='{userName}';""")


# takes the info submitted by the user to create a new service request and sumbits it to the database to save it
def newSRHelper(date, requestor, priority, description, location, serviceType, assignedTo, building, estimate, status, completed, contactedDate, externalId, cc,  notes, items):
    user = user_session.returnUserName(flask_login.current_user)
    # values we need to submit to the database
    if (user == 'test'):
        userIdModified = 2
    else:
        userIdModified = int(db.engine.execute(f"SELECT [userId] FROM [User] WHERE userName='{user}';").fetchall()[0][0])

    if (contactedDate == ''):
        contactedDate = None
    else:
        contactedDate = convertStringToDatetime(contactedDate)

    if (externalId == ''):
        externalId = None

    if (completed == ''):
        completedDate = None
    else:
        completedDate = convertStringToDatetime(completed)

    active = True
    parentServiceRequestId = None

    query = f"""
    SELECT 
        u1.userId AS userIdRequestor,
        p.priorityId,
        st.serviceTypeId,
        b.buildingId,
        u2.userId AS userIdTechnician,
        s.statusId
    FROM 
        [User] u1
        JOIN [Priority] p ON p.priority = '{priority}'
        JOIN [ServiceType] st ON st.serviceType = '{serviceType}'
        JOIN [Building] b ON b.buildingAbbreviation = '{building}'
        JOIN [User] u2 ON u2.fullName = '{assignedTo}'
        JOIN [Status] s ON s.status = '{status}'
    WHERE 
        u1.fullName = '{requestor}';
    """
    
    result = db.engine.execute(query).fetchall()[0]
    userIdRequestor, priorityId, serviceTypeId, buildingId, userIdTechnician, statusId = result

    if estimate != '':
        estimatedDueDate = convertStringToDatetime(estimate)
    else:
        estimatedDueDate = None
    requestDate = convertStringToDatetime(date)
    
    #print('userIdRequestor: ' + str(userIdRequestor) + '\n','requestDate: ' + str(requestDate) + '\n','description: ' + str(description) + '\n','location: ' + str(location) + '\n','priorityId: ' + str(priorityId) + '\n','serviceTypeId: ' + str(serviceTypeId) + '\n','buildingId: ' + str(buildingId) + '\n','userIdTechnician: ' + str(userIdTechnician) + '\n','estimatedDueDate: ' + str(estimatedDueDate) + '\n','statusId: ' + str(statusId) + '\n','completedDate: ' + str(completedDate) + '\n','userIdModified: ' + str(userIdModified) + '\n','parentServiceRequestId: ' + str(parentServiceRequestId) + '\n','contactedDate: ' + str(contactedDate) + '\n','externalId: ' + str(externalId) + '\n','active: ' + str(active) + '\n')

    # INSERT NEW SERVICE REQUEST, NOTES, AND ITEMS INTO DATABASE -----------------------------------------------------
    # insert new service request
    db.engine.execute(f"""
        INSERT INTO [ServiceRequest]([userIdRequestor], [requestDate], [description], [location], [priorityId], 
                                    [serviceTypeId], [buildingId], [userIdTechnician], [estimatedDueDate], 
                                    [statusId], [completedDate], [userIdModified], [parentServiceRequestId], 
                                    [contactedDate], [externalId], [active], [eMailCC])
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (userIdRequestor, requestDate, description, location, priorityId, serviceTypeId, buildingId, 
        userIdTechnician, estimatedDueDate, statusId, completedDate, userIdModified, parentServiceRequestId, 
        contactedDate, externalId, active, cc))
    # get the serviceRequestId of the service request we just inserted
    serviceRequestId = db.engine.execute("""SELECT MAX(serviceRequestId) FROM [ServiceRequest];""").fetchone()[0]
    # FIXME: everything before this works. After this NO
    # Insert notes if any
    if len(notes) > 0:
        # Prepare list of tuples for batch insert
        try:
            for note in notes:
                print(f'note: {note}')
                note_values = [(serviceRequestId, note['note'], note['modDate'], userIdModified, note['modDate'],
                                userIdModified, note['public'], userIdModified, 1) 
                            for note in notes]
                print(f'note_values: {note_values}')
            # FIXME: for some reason the other routes take the public key and insert it into the private column
            # naming conventions should be the same
            # Batch insert into RequestNote
            db.engine.execute(f"""INSERT INTO [RequestNote]([serviceRequestId], [note], [inputDate], [userIdInput], 
                                [modifiedDate], [userIdModified], [private], [userIdCreator], [active])
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""", note_values)
        except Exception as e:
            print(f'error: {e}')
            return str(e)
    # Insert items if any
    if len(items) > 0:
        try:
            for item in items:
                itemId = int(db.engine.execute(f"SELECT [itemId] FROM [item] WHERE description='{item['items']}';").fetchone()[0])
                if 'void' in item:
                    private = 1
                else:
                    private = 0
            # Prepare list of tuples for batch insert
            ## FIXME?: using status of 1 (good) for all items right now you can edit status after item is added
            item_values = [(serviceRequestId, itemId, private, 1, userIdModified, item['itemquantity'], active)
                        for item in items]
        
            # Batch insert into RequestItem
            db.engine.execute(f"""INSERT INTO [RequestItem]([serviceRequestId], [itemId], [voided], [status], 
                                [userIdModified], [quantity], [active])
                                VALUES (?, ?, ?, ?, ?, ?, ?)""", item_values)
        except Exception as e:
            print(f'error: {e}')
            return str(e)

# takes a string that is a data and converts it to the datetime data type
def convertStringToDatetime(dateStr):
    from datetime import datetime
    size = len(dateStr)

    yearStr = dateStr[0:4]
    monthStr = dateStr[5:7]
    dayStr = dateStr[8:10]
    hourStr = dateStr[11:13]
    minStr = dateStr[14:16]
    secStr = dateStr[17:19]
    year = int(yearStr)
    month = int(monthStr)
    day = int(dayStr)
    hour = int(hourStr)
    min = int(minStr)
    sec = int(secStr)

    date = datetime(year, month, day, hour, min, sec)

    return date


# gets all the data of a given service request from the database
def getServReqData(servReqId):
    # query to get data for individual service request
    queryResult = db.engine.execute(
        f"""
        SELECT 
            sr.[requestDate], 
            sr.[description], 
            sr.[location], 
            sr.[estimatedDueDate], 
            sr.[completedDate], 
            sr.[contactedDate], 
            sr.[externalId], 
            sr.[statusId], 
            sr.[eMailCC], 
            u.[fullName], 
            u.[phone], 
            p.[priority], 
            st.[serviceType], 
            b.[buildingAbbreviation], 
            s.[status]
        FROM 
            [ServiceRequest] AS sr
        JOIN 
            [User] as u ON u.userId = sr.userIdRequestor
        JOIN 
            [Priority] as p ON p.priorityId = sr.priorityId
        JOIN 
            [ServiceType] as st ON st.serviceTypeId = sr.serviceTypeId
        JOIN 
            [Building] as b ON b.buildingId = sr.buildingId
        JOIN 
            [Status] as s ON s.statusId = sr.statusId
        WHERE 
            serviceRequestId='{servReqId}';
        """
    ).fetchone()
    # assign the values to variables
    date, description, location, estimate, completed, contactedDate, externalId, statusId, cc, requestor, requestorPhone, priority, serviceType, building, status = queryResult
    assignedTo = requestor
    # create a dict for the items
    items = dict()

    servReqItems =  db.engine.execute(f"SELECT [requestItemId] FROM [RequestItem] WHERE serviceRequestId='{servReqId}' AND active = 1;").fetchall()
    for id in servReqItems:
        idStr = str(id)
        idStr = idStr[1:len(idStr)-2]
        reqItemId = int(idStr)

        # query the db to get the items on the SR
        result = db.engine.execute(f"""
            SELECT ri.itemId, i.description, ri.userIdModified, u.fullName, ri.quantity, ri.voided, s.status
            FROM [RequestItem] ri
            JOIN [Item] i ON ri.itemId = i.itemId
            JOIN [User] u ON ri.userIdModified = u.userId
            JOIN [Status] s ON ri.status = s.statusId
            WHERE ri.requestItemId = '{reqItemId}';
        """).fetchone()

        try:
            itemId, name, userId, inputBy, quantity, void, status = result
            quantity = int(quantity)  # Convert quantity to int if necessary
        except Exception as e:
            print(e)
            


        reqItem = dict()
        reqItem['reqItemId'] = reqItemId
        reqItem['name'] = name
        reqItem['inputBy'] = inputBy
        reqItem['quantity'] = quantity
        reqItem['void'] = void
        reqItem['itemId'] = itemId
        reqItem['status'] = status

        items[reqItemId] = reqItem

    # create a dict for the items
    notes = dict()

    servReqNotes =  db.engine.execute(f"SELECT [requestNoteId] FROM [RequestNote] WHERE serviceRequestId='{servReqId}' AND active = 1;").fetchall()
    for id in servReqNotes:
        idStr = str(id)
        idStr = idStr[1:len(idStr)-2]
        reqNoteId = int(idStr)

        # query the db to get the notes on the SR
        result = db.engine.execute(f"""
            SELECT rn.note, rn.inputDate, rn.private, rn.userIdInput, u1.fullName, u2.userName 
            FROM [RequestNote] rn
            JOIN [User] u1 ON rn.userIdInput = u1.userId
            JOIN [User] u2 ON rn.userIdCreator = u2.userId
            WHERE rn.requestNoteId = '{reqNoteId}';
        """).fetchone()

        note, inputDate, private, inputById, inputBy, userCreator = result
        inputById = int(inputById)  # Convert userIdInput to int if necessary
    
        reqNote = dict()
        reqNote['reqNoteId'] = reqNoteId
        reqNote['note'] = note
        reqNote['inputDate'] = inputDate
        reqNote['inputBy'] = inputBy
        reqNote['userInput'] = inputBy
        reqNote['date'] = date
        reqNote['private'] = private
        reqNote['userCreator'] = userCreator


        notes[reqNoteId] = reqNote

    # create a dict with the right info
    servReq = dict()
    servReq['servReqId'] = servReqId
    servReq['date'] = date
    servReq['description'] = description
    servReq['location'] = location
    servReq['estimate'] = estimate
    servReq['completed'] = completed
    servReq['contactedDate'] = contactedDate
    servReq['requestor'] = requestor
    servReq['requestorPhone'] = requestorPhone
    servReq['priority'] = priority
    servReq['serviceType'] = serviceType
    servReq['assignedTo'] = assignedTo
    servReq['building'] = building
    servReq['status'] = status
    servReq['externalId'] = externalId
    servReq['items'] = items
    servReq['notes'] = notes
    servReq['cc'] = cc

    # testing prints
    #print('\n' + 'servReq: ' + str(servReq) + '\n')
    
    # return a dict with the info
    return servReq


# takes the info submitted by the user to edit a service request and sumbits it to the database to save it
def submitEdits(currId, date, requestor, priority, description, location, serviceType, assignedTo, building, estimate, status, completed, contactedDate, externalId, cc):

    # format the data correctly
    requestDate = convertStringToDatetime(date)
    userIdRequestor = int(db.engine.execute(f"SELECT [userId] FROM [User] WHERE fullName='{requestor}';").fetchall()[0][0])
    priorityId = int(db.engine.execute(f"SELECT [priorityId] FROM [Priority] WHERE priority='{priority}';").fetchall()[0][0])
    serviceTypeId = int(db.engine.execute(f"SELECT [serviceTypeId] FROM [ServiceType] WHERE serviceType='{serviceType}';").fetchall()[0][0])
    userIdTechnician = int(db.engine.execute(f"SELECT [userId] FROM [User] WHERE fullName='{assignedTo}';").fetchall()[0][0])
    buildingId = int(db.engine.execute(f"SELECT [buildingId] FROM [Building] WHERE buildingAbbreviation='{building}';").fetchall()[0][0])
    if estimate != '':
        estimatedDueDate = convertStringToDatetime(estimate)
    else:
        estimatedDueDate = None
    requestDate = convertStringToDatetime(date)
    statusId = int(db.engine.execute(f"SELECT [statusId] FROM [Status] WHERE status='{status}';").fetchall()[0][0])

    user = user_session.returnUserName(flask_login.current_user)

    if (user == 'test'):
        userIdModified = 2
    else:
        userIdModified = int(db.engine.execute(f"SELECT [userId] FROM [User] WHERE userName='{user}';").fetchall()[0][0])

    if (contactedDate == ''):
        contactedDate = null()
        db.engine.execute(f"""UPDATE [ServiceRequest]\nSET [contactedDate] = {contactedDate}\nWHERE serviceRequestId='{currId}';""")
    else:
        contactedDate = convertStringToDatetime(contactedDate)
        db.engine.execute(f"""UPDATE [ServiceRequest]\nSET [contactedDate] = '{contactedDate}'\nWHERE serviceRequestId='{currId}';""")

    if (externalId == ''):
        externalId = null()
        db.engine.execute(f"""UPDATE [ServiceRequest]\nSET [externalId] = {externalId}\nWHERE serviceRequestId='{currId}';""")
    else:
        db.engine.execute(f"""UPDATE [ServiceRequest]\nSET [externalId] = '{externalId}'\nWHERE serviceRequestId='{currId}';""")

    if (completed == ''):
        completedDate =  null()
        db.engine.execute(f"""UPDATE [ServiceRequest]\nSET [completedDate] = {completedDate}\nWHERE serviceRequestId='{currId}';""")
    else:
        completedDate = convertStringToDatetime(completed)
        db.engine.execute(f"""UPDATE [ServiceRequest]\nSET [completedDate] = '{completedDate}'\nWHERE serviceRequestId='{currId}';""")

    # Submit the edits to the database using a single query
    db.engine.execute(f"""
        UPDATE [ServiceRequest]
        SET 
            [userIdRequestor] = ?,
            [requestDate] = ?,
            [description] = ?,
            [location] = ?,
            [priorityId] = ?,
            [serviceTypeId] = ?,
            [buildingId] = ?,
            [userIdTechnician] = ?,
            [estimatedDueDate] = ?,
            [statusId] = ?,
            [userIdModified] = ?,
            [eMailCC] = ?
        WHERE 
            serviceRequestId = ?;
    """, (userIdRequestor, requestDate, description, location, priorityId, serviceTypeId, buildingId, userIdTechnician, estimatedDueDate, statusId, userIdModified, cc, currId))


# takes the info submitted by the user to create a new item and sumbits it to the database to save it
def submitNewItem(description, modelNum, vendor, minStock, manufacturer, deviceType, deviceSubType):
    
    user = user_session.returnUserName(flask_login.current_user)
    if (vendor == 'None'):
        vendorId = None
    else:
        vendorId = int(db.engine.execute(f"SELECT [vendorId] FROM [Vendor] WHERE name='{vendor}';").fetchall()[0][0])
    manufacturerId = int(db.engine.execute(f"SELECT [manufacturerId] FROM [Manufacturer] WHERE name='{manufacturer}';").fetchall()[0][0])
    deviceTypeId = int(db.engine.execute(f"SELECT [deviceTypeId] FROM [DeviceType] WHERE deviceType='{deviceType}';").fetchall()[0][0])
    deviceSubTypeId = int(db.engine.execute(f"SELECT [deviceSubTypeId] FROM [DeviceSubType] WHERE deviceSubType='{deviceSubType}';").fetchall()[0][0])
    userIdModified = int(db.engine.execute(f"SELECT [userId] FROM [User] WHERE userName='{user}';").fetchall()[0][0])

    db.engine.execute(f"""INSERT INTO [Item]\nVALUES (?,?,?,?,?,?,?,?,?);""", (description, modelNum, vendorId, minStock, 1, manufacturerId, 
    deviceTypeId, deviceSubTypeId, userIdModified))


# adds an item to a service request in the database
def addItem(items, itemquantity, itemvoid, servReqId):
    user = user_session.returnUserName(flask_login.current_user)
    userIdModified = int(db.engine.execute(f"SELECT [userId] FROM [User] WHERE userName='{user}';").fetchall()[0][0])

    itemId = int(db.engine.execute(f"SELECT [itemId] FROM [item] WHERE description='{items}';").fetchall()[0][0])
    if (len(itemvoid) == 1):
        voided = 1
    else:
        voided = 0

    ## FIXME?: using status of 1 (good) for all items right now you can edit status after item is added
    db.engine.execute(f"""INSERT INTO [RequestItem]\nVALUES (?,?,?,?,?,?,?);""", (servReqId, itemId, voided, 1, userIdModified, itemquantity, 1))


# adds a note to a service request in the database
def addNote(note, public, modDate, inputBy, servReqId):
    user = user_session.returnUserName(flask_login.current_user)
    print(f'user: {user}')
    userIdModified = int(db.engine.execute(f"SELECT [userId] FROM [User] WHERE userName='{user}';").fetchall()[0][0])
    print(f'userIdModified: {userIdModified}')

    if (len(public) == 1):
        private = 0
    else:
        private = 1

    db.engine.execute(f"""INSERT INTO [RequestNote]\nVALUES (?,?,?,?,?,?,?,?,?);""",
     (servReqId, note, modDate, userIdModified, modDate, userIdModified, private, userIdModified, 1))


# saves the edits to a specific item connected to a sepcific service request to the database
def saveReqItemEdits(requestItemId, edititemvoid, itemStat, itemQuan):
    user = user_session.returnUserName(flask_login.current_user)
    userIdModified = int(db.engine.execute(f"SELECT [userId] FROM [User] WHERE userName='{user}';").fetchall()[0][0])

    if(len(edititemvoid) == 1):
        void = 1
    else:
        void = 0

    statusId = int(db.engine.execute(f"SELECT [statusId] FROM [Status] WHERE status='{itemStat}';").fetchall()[0][0])

    db.engine.execute(f"""UPDATE [RequestItem]\nSET [userIdModified] = '{userIdModified}'\nWHERE requestItemId='{requestItemId}';""")
    db.engine.execute(f"""UPDATE [RequestItem]\nSET [quantity] = '{itemQuan}'\nWHERE requestItemId='{requestItemId}';""")
    db.engine.execute(f"""UPDATE [RequestItem]\nSET [status] = '{statusId}'\nWHERE requestItemId='{requestItemId}';""")
    db.engine.execute(f"""UPDATE [RequestItem]\nSET [voided] = '{void}'\nWHERE requestItemId='{requestItemId}';""")


# saves the edits to a specific note connected to a sepcific service request to the database
def saveReqNoteEdits(requestNoteId, note, public, editnotetoday):
    user = user_session.returnUserName(flask_login.current_user)
    userIdModified = int(db.engine.execute(f"SELECT [userId] FROM [User] WHERE userName='{user}';").fetchall()[0][0])

    modifiedDate = convertStringToDatetime(editnotetoday)

    if(len(public) == 1):
        private = 0
    else:
        private = 1

    db.engine.execute(f"""UPDATE [RequestNote]\nSET [userIdModified] = '{userIdModified}'\nWHERE requestNoteId='{requestNoteId}';""")
    db.engine.execute(f"""UPDATE [RequestNote]\nSET [note] = '{note}'\nWHERE requestNoteId='{requestNoteId}';""")
    db.engine.execute(f"""UPDATE [RequestNote]\nSET [private] = '{private}'\nWHERE requestNoteId='{requestNoteId}';""")
    db.engine.execute(f"""UPDATE [RequestNote]\nSET [modifiedDate] = '{modifiedDate}'\nWHERE requestNoteId='{requestNoteId}';""")
