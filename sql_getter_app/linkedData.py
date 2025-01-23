# High level summary of this page:
# This file holds the object that contains the linked columns and what we replace them with
# 
# We would normally use the database to get this data but,
#   1. We want to minimize the number of requests made to the database
#   2. There is no way to determine the preferred column of the table being linked to display
#
# convention:
#   'column Name To Link':('linked Table', 'linked column to replace it with', 'linked Id column', 'Human readable column name', {sql where object})
#
#   sql where object - sometimes you may not want to link all of a table (eg for the technician field in the service request table; we don't want to
#       display all the users, just the technicians). So this object is in the format {'tableName':'sql where string', 'othertableName':'different where clause'}
#       with the keys for that object refering to specific tables you want to apply the filters to.

linkedColumns = {
    # linked columns in the SR table
    'userIdRequestor':('User', 'fullName', 'userId', 'Requestor'),
    'userIdTechnician':('User', 'fullName', 'userId', 'Assigned To'),
    'priorityId':('Priority', 'priority', 'priorityId', 'Priority'),
    ################################
    'buildingId':('Building', 'buildingAbbreviation', 'buildingId', 'Building'),
    'deviceId':('Device', 'deviceName', 'deviceId', 'Device'), 
    'deviceTypeId':('DeviceType', 'deviceType', 'deviceTypeId', 'Device Type'),
    'ipId':('IP', 'ipAddress', 'ipId', 'IP'),
    'vendorId':('Vendor', 'name', 'vendorId', 'Vendor'),
    'stateId':('State', 'state', 'stateId', 'State'),
    'countryId':('Country', 'code', 'countryId', 'Country'),
    'viewingLevel':('Role', 'role', 'roleId', 'Viewing'), # sort the roles by hierarchy when in tablePermissions table
    'editingLevel':('Role', 'role', 'roleId', 'Editing'),
    'addingLevel':('Role', 'role', 'roleId', 'Adding'),
    'deletingLevel':('Role', 'role', 'roleId', 'Deleting'),
    'undeletingLevel':('Role', 'role', 'roleId', 'Undo Deletes'),
    'auditingLevel':('Role', 'role', 'roleId', 'Auditing'),
    'userRoleId':('Role', 'role', 'roleId', 'Role'),
    'deviceSubTypeId':('DeviceSubType', 'deviceSubType', 'deviceSubTypeId', 'Device Sub Type'),
    'statusId':('Status', 'status', 'statusId', 'Status', 
        # This must be a SQL where object
        {
            'Device':'AND forDevices = \'true\'', 
            'ServiceRequest':'AND forServiceRequest = \'true\'', 
            'RequestItem':'AND forItems = \'true\''
        }
        ),
    'manufacturerId':('Manufacturer', 'name', 'manufacturerId', 'Manufacturer'),
    'oitJackId':('OITJack', 'jackNumber', 'oitJackId', 'OIT Jack'),
    'userIdRequestor':('User', 'fullName', 'userId', 'Requestor'),
    'serviceTypeId':('ServiceType', 'serviceType', 'serviceTypeId', 'Type'),
    'priorityId':('Priority', 'priority', 'priorityId', 'Priority'),
    'userIdTechnician':('User', 'fullName', 'userId', 'Assigned To', {'ServiceRequest':'AND technician = \'true\''}),
    'oitJackIdSource':('OITJack', 'jackNumber', 'oitJackId', 'OIT Jack Source'),
    'oitJackIdDestination':('OITJack', 'jackNumber', 'oitJackId', 'OIT Jack Destination'),
    'patchPanelTypeId':('PatchPanelType', 'patchPanelType', 'patchPanelTypeId', 'Panel Type'),
    'failureTypeId':('FailureType', 'failureType', 'failureTypeId', 'Failure Type'),
    'userIdModified':('User', 'fullName', 'userId', 'Modified by'),
    'userId':('User', 'fullName', 'userId', 'User'),
    'itemId':('Item', 'description', 'itemId', 'Item'),
    'userIdCreator':('User', 'fullName', 'userId', 'User')
}