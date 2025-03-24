//  written Feb 2025 to build modals for each table to add items
// this function is called from the table.html file to dynamically add a modal to each table

// Define modal configurations for each table
// dropdown is the information to query the DB for the datalist elements
const modalConfig = {
    // FORMAT OF THIS CONFIG OBJECT (first one is documented)
    // name: the display name needs to be in format so dbColumName = name.split(" ").join("") then dbColumnName[0].toLowerCase()
        //(remove spaces and first letter to lower case) unless there is a dropdown then we will use fk
    // type: type of the input element (for styling and clean data entry)
    // required: defaults to true (if the value is required for form submission)
    // dropdown: if this value is a foreign key relation to another table this will be a object with the information to create a dropdown element
        // table: the related table to query
        // display: the column name within the related table that will be displayed in the dropdown and correspond with the fk
        // fk: the value in each select that is submitted in the form submission (so we dont have to submit to multiple tables on the backend)
        // the backend takes this info and return all the data display names and their associated id (fk)
    "Item": { // table name
        "fields": [
         // each field required to submit a new item
            {"name": "Description", "type": "text", "columnName": "description", "maxchar": "255", "required": true},
            {"name": "Model Number", "type": "text", "columnName": "modelNumber", "maxchar": "100"},
            {"name": "Vendor", "type": "text", "dropdown": {"table":"Vendor", "display":"name", "fk":"vendorId"}, "columnName": "vendorId"},
            {"name": "Minimum To Stock", "type": "number", "columnName": "minimumToStock", "required": true},
            // {"name": "Active", "type": "checkbox", "columnName": "active"}, not sure this is neccessary
            {"name": "Manufacturer", "type": "text", "dropdown": {"table": "Manufacturer", "display":"name", "fk":"manufacturerId"}, "columnName": "manufacturerId"},
            {"name": "Device Type", "type": "text", "dropdown": {"table": "DeviceType", "display":"deviceType", "fk":"deviceTypeId"}, "columnName": "deviceTypeId"},
            {"name": "Device Sub Type", "type": "text", "dropdown": {"table": "DeviceSubType", "display":"deviceSubType", "fk":"deviceSubTypeId"}, "columnName": "deviceSubTypeId"},
        ],
        "pk" : "itemId"
    },
    "Inventory": {
        "fields": [
            { "name": "Item", "type": "text", "dropdown": {"table": "Item", "display": "description", "fk": "itemId"}, "columnName": "itemId", "required": true},
            { "name": "In Stock", "type": "number", "columnName": "inStock", "required": true},
            { "name": "Location", "type": "text", "columnName": "location", "maxchar": "100"},
            // could add an active column here but it defaults to 1 in the db
        ],
        "pk" : "inventoryId"
    },
    "User": {
        // columns "userId", "userName", "firstName", "lastName", "technician", "phone", "eMail", "vendorId", "userIdModified", "fullName", "userRoleId", "active"
        "fields": [
            {"name": "User Name", "type": "text", "columnName": "userName", "maxchar": "100", "required": true},
            {"name": "First Name", "type": "text", "columnName": "firstName", "maxchar": "100", "required": true},
            {"name": "Last Name", "type": "text", "columnName": "lastName", "maxchar": "100", "required": true},
            {"name": "Technician", "type": "checkbox", "columnName": "technician", "required": true},
            {"name": "Phone", "type": "tel", "columnName": "phone", "maxchar": "25", "format": `pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"`},
            {"name": "E Mail", "type": "email", "columnName": "eMail", "maxchar": "100"},
            {"name": "Vendor", "type": "text", "dropdown": {"table":"Vendor", "display":"name", "fk":"vendorId"}, "columnName": "vendorId"},
            // {"name": "Full Name", "type": "text", "columnName": "fullName"},
            {"name": "Role", "type": "text", "dropdown": {"table": "Role", "display":"role", "fk":"roleId"}, "columnName": "userRoleId"},
        ],
        "pk" : "userId"
    },
    "TabOrder": {
        // columns {"tabOrderId", "tableName", "columnName", "tabOrder", "userIdModified", "active"},
        "fields": [
            {"name": "Table Name", "type": "text", "columnName": "tableName", "maxchar": "50", "required": true},
            {"name": "Column Name", "type": "text", "columnName": "columnName", "maxchar": "50", "required": true},
            {"name": "Tab Order", "type": "number", "columnName": "tabOrder", "required": true},
            // could add an active column here but it defaults to 1 in the db
        ],
        "pk" : "tabOrderId"
    },
    "Role": {
        "fields": [
            {"name": "Role", "type": "text", "columnName": "role", "maxchar": "50"},
            // could add an active column here but it defaults to 1 in the db
        ],
        "pk" : "roleId"
    },
    "TablePermissions": {
        "fields": [
            {"name": "Table Permissions", "type": "text", "columnName": "tablePermissionsId", "required": true},
            // could add an active column here but it defaults to 1 in the db
        ],
        "pk" : "tablePermissionsId"
    },
    "VersionControl": {
        "fields": [
            {"name": "Version Control", "type": "text", "columnName": "versionControl", "required": true},
            // could add an active column here but it defaults to 1 in the db
        ],
        "pk" : "versionId"
    },
    "Building": {
        "fields": [
            { "name": "Building Name", "type": "text", "columnName": "buildingName", "maxchar": "255", "required": true},
            { "name": "Building Abbreviation", "type": "text", "columnName": "buildingAbbreviation", "maxchar": "20", "required": true},
            { "name": "Torn Down", "type": "checkbox", "columnName": "tornDown", "required": true},
            { "name": "Bacnet Network Number", "type":"number", "columnName": "bacnetNetworkNumber"},
            { "name": "Notes", "type":"text", "columnName": "notes", "maxchar": "255"},
        ],
        "pk" : "buildingId"
    },
    "BBMD": {
        "fields": [
            {"name": "Device", "type": "text", "dropdown": {"table": "Device", "display":"deviceName", "fk":"deviceId"}, "columnName": "deviceId"},
            {"name": "IP", "type": "text", "dropdown": {"table": "IP", "display":"ipAddress", "fk":"ipId"}, "columnName": "ipId"},
            {"name": "Building", "type": "text", "dropdown": {"table": "Building", "display":"buildingName", "fk":"buildingId"}, "columnName": "buildingId"},   
            {"name": "Old Site Name", "type": "text", "required": false, "columnName": "oldSiteName", "maxchar": "50"},
            {"name": "Device Number", "type": "number", "required": false, "columnName": "deviceNumber"},
            {"name": "Site Name", "type": "text", "columnName": "siteName", "maxchar": "50"},
            {"name": "Site Device Number", "type": "number", "columnName": "siteDeviceNumber"},
            {"name": "Bbmd Udp Port", "type": "number", "columnName": "bbmdUdpPort"}  // Assuming this is a numeric port number
        ],
        "pk" : "bbmdId"
    },
    "Device": {
        "fields": [
            {"name": "Device Name", "type": "text", "columnName": "deviceName", "maxchar": "100"},
            {"name": "Device Type", "type": "text", "required": false, "dropdown": {"table": "DeviceType", "display":"deviceType", "fk":"deviceTypeId"}, "columnName": "deviceTypeId"},
            {"name": "Device Sub Type", "type": "text", "required": false, "dropdown": {"table": "DeviceSubType", "display":"deviceSubType", "fk":"deviceSubTypeId"}, "columnName": "deviceSubTypeId"},
            {"name": "Model Number", "type": "text", "required": false, "columnName": "modelNumber", "maxchar": "100"},
            {"name": "Serial Number", "type": "text", "required": false, "columnName": "serialNumber", "maxchar": "100"},
            {"name": "Cna Id", "type": "text", "required": false, "columnName": "cnaId", "maxchar": "100"},
            {"name": "Byu Id", "type": "text", "required": false, "columnName": "byuId", "maxchar": "255"},
            {"name": "Status", "type": "text", "required": false, "dropdown": {"table": "Status", "display":"status", "fk":"statusId"}, "columnName": "statusId"},
            {"name": "Building", "type": "text", "required": false, "dropdown": {"table": "Building", "display":"buildingName", "fk":"buildingId"}, "columnName": "buildingId"},
            {"name": "Location", "type": "text", "required": false, "columnName": "location", "maxchar": "100"},
            {"name": "Devices Managed", "type": "number", "required": false, "columnName": "devicesManaged", "maxchar": "2000"},
            {"name": "Old Jace Name", "type": "text", "required": false, "columnName": "oldJaceName", "maxchar": "64"},
            {"name": "Old Alias", "type": "text", "required": false, "columnName": "oldAlias", "maxchar": "64"},
            {"name": "Notes", "type": "text", "required": false, "columnName": "notes", "maxchar": "255"},
            {"name": "Manufacturer", "type": "text", "required": false, "dropdown": {"table": "Manufacturer", "display":"name", "fk":"manufacturerId"}, "columnName": "manufacturerId"},
            {"name": "Mac Address", "type": "text", "required": false, "columnName": "macAddress", "maxchar": "30"},
        ],
        "pk" : "deviceId"
    },
    "DNS": {
        "fields": [
            {"name": "Dns1", "type": "text", "columnName": "dns1", "maxchar": "23"},
            {"name": "Dns2", "type": "text", "columnName": "dns2", "maxchar": "23"},
            {"name": "Domain", "type": "text", "columnName": "domain", "maxchar": "50"},
        ],
        "pk" : "dnsId"
    },
    "Failure": {
        "fields": [
            {"name": "Failure Type", "type": "text", "dropdown": {"table": "FailureType", "display":"failureType", "fk":"failureTypeId"}, "columnName": "failureTypeId"},
            {"name": "Failure Date", "type": "date", "columnName": "failureDate"}, 
            {"name": "Device", "type": "text", "dropdown": {"table": "Device", "display":"deviceName", "fk":"deviceId"}, "columnName": "deviceId"},
            {"name": "Notes", "type": "text", "required": false, "columnName": "notes", "maxchar": "500"},
        ],
        "pk" : "failureId"
    },
    "NCRSNode": {
        "fields": [
            {"name": "Device", "type": "text", "dropdown": {"table": "Device", "display":"deviceName", "fk":"deviceId"}, "columnName": "deviceId"},
            {"name": "Ln", "type": "number", "columnName": "ln"},
            {"name": "Pn", "type": "checkbox", "columnName": "pn"},
            {"name": "Dln", "type": "checkbox", "columnName": "dln"},
            {"name": "Ip connection", "type": "checkbox", "columnName": "ipConnection"}
        ],
        "pk" : "ncrsNodeId"
    },
    "OITJack": {
        "fields": [
            {"name": "Jack Number", "type": "text", "required": false, "columnName": "jackNumber", "maxchar": "50"},
            {"name": "Building", "type": "text", "required": false, "dropdown": {"table": "Building", "display":"buildingName", "fk":"buildingId"}, "columnName": "buildingId"},
            {"name": "Room", "type": "text", "required": false, "columnName": "room", "maxchar": "50"},
            {"name": "Jack Location", "type": "text", "required": false, "columnName": "jackLocation", "maxchar": "255"},
            {"name": "Device", "type": "text", "required": false, "dropdown": {"table": "Device", "display":"deviceName", "fk":"deviceId"}, "columnName": "deviceId"},
            {"name": "Notes", "type": "text", "required": false, "columnName": "notes", "maxchar": "255"},
            {"name": "Is Dhcp", "type": "checkbox", "columnName": "isDHCP"}
        ],
        "pk" : "oitJackId"
    },
    "PatchPanel": {
        "fields": [
            {"name": "OIT Jack Source", "type": "text", "dropdown": {"table": "OITJack", "display":"jackNumber", "fk":"oitJackId"}, "columnName": "oitJackIdSource"},
            {"name": "OIT Jack Destination", "type": "text", "required": false, "dropdown": {"table": "OITJack", "display":"jackNumber", "fk":"oitJackId"}, "columnName": "oitJackIdDestination"},
            {"name": "Panel Type", "type": "text", "dropdown": {"table": "PatchPanelType", "display":"patchPanelType", "fk":"patchPanelTypeId"}, "columnName": "patchPanelTypeId"},
            {"name": "Device", "type": "text", "required": false, "dropdown": {"table": "Device", "display":"deviceName", "fk":"deviceId"}, "columnName": "deviceId"},
            {"name": "Effective Date", "type": "date", "columnName": "effectiveDate"}
        ],
        "pk" : "patchPanelId"
    },
    "PhoneNumber": {
        "fields": [
            {"name": "Phone Number", "type": "text", "columnName": "phoneNumber", "maxchar": "30"},
            {"name": "OIT Jack", "type": "text", "required": false, "dropdown": {"table": "OITJack", "display":"jackNumber", "fk":"oitJackId"}, "columnName": "oitJackId"},
            {"name": "Description", "type": "text", "columnName": "description", "maxchar": "100"},
            {"name": "Building", "type": "text", "required": false, "dropdown": {"table": "Building", "display":"buildingName", "fk":"buildingId"}, "columnName": "buildingId"},
            {"name": "Phone Number Type Id", "type": "number", "dropdown": {"table": "PhoneNumberType", "display":"phoneNumberType", "fk":"phoneNumberTypeId"}, "columnName": "phoneNumberTypeId"}
        ],
        "pk" : "phoneNumberId"
    },
    "Vendor": {
        "fields": [
            {"name": "Name", "type": "text", "columnName": "name", "maxchar": "100"},
            {"name": "Address1", "type": "text", "required": false, "columnName": "address1", "maxchar": "150"},
            {"name": "Address2", "type": "text", "required": false, "columnName": "address2", "maxchar": "150"},
            {"name": "City", "type": "text", "required": false, "columnName": "city", "maxchar": "100"},
            {"name": "State", "type": "text", "required": false, "dropdown": {"table": "State", "display":"state", "fk":"stateId"}, "columnName": "stateId"},
            {"name": "Zip", "type": "number", "required": false, "columnName": "zip", "maxchar": "25"},
            {"name": "Phone", "type": "text", "required": false, "columnName": "phone", "maxchar": "25", "format": `pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"`},
            {"name": "Contact", "type": "text", "required": false, "columnName": "contact", "maxchar": "25"},
        ],
        "pk" : "vendorId"
    },
    "VMCloudDirector": {
        "fields": [
            {"name": "Web Address", "type": "text", "columnName": "webAddress", "maxchar": "255"},
        ],
        "pk" : "vmCloudDirectorId"
    },
    "IP": {
        "fields": [
            {"name": "Ip Address", "type": "text", "columnName": "ipAddress", "maxchar": "23"},
            {"name": "Gateway", "type": "text", "columnName": "gateway", "maxchar": "23"},
            {"name": "Subnet Mask", "type": "text", "columnName": "subnetMask", "maxchar": "23"},
            {"name": "OIT Jack", "type": "text", "required": false, "dropdown": {"table": "OITJack", "display":"jackNumber", "fk":"oitJackId"}, "columnName": "oitJackId"},
            {"name": "Device", "type": "text", "required": false, "dropdown": {"table": "Device", "display":"deviceName", "fk":"deviceId"}, "columnName": "deviceId"},
            {"name": "Oit Monitored", "type": "checkbox", "columnName": "oitMonitored"},
            {"name": "Notes", "type": "text", "required": false, "columnName": "notes", "maxchar": "255"},
            {"name": "Building", "type": "text", "dropdown": {"table": "Building", "display":"buildingName", "fk":"buildingId"}, "columnName": "buildingId"},
            {"name": "Effective Date", "type": "date", "columnName": "effectiveDate"},
            {"name": "Status", "type": "text", "dropdown": {"table": "Status", "display":"status", "fk":"statusId"}, "columnName": "statusId"}
        ],
        "pk" : "ipId"
    },
    "DeviceLicense": {
        "fields": [
            {"name": "Device", "type": "text", "dropdown": {"table": "Device", "display":"deviceName", "fk":"deviceId"}, "columnName": "deviceId"},
            {"name": "License", "type": "text", "columnName": "license", "maxchar": "6000"},
            {"name": "Host Id", "type": "text", "required": false, "columnName": "hostId", "maxchar": "100"},
            {"name": "Serial Number", "type": "number", "required": false, "columnName": "serialNumber", "maxchar": "100"},
            {"name": "Model Number", "type": "text", "required": false, "columnName": "modelNumber", "maxchar": "100"},
            {"name": "Class", "type": "text", "required": false, "columnName": "class", "maxchar": "100"},
            {"name": "Notes", "type": "text", "required": false, "columnName": "notes", "maxchar": "255"},
            {"name": "Effective Date", "type": "date", "columnName": "effectiveDate"},
            {"name": "Manufacturer", "type": "text", "required": false, "dropdown": {"table": "Manufacturer", "display":"name", "fk":"manufacturerId"}, "columnName": "manufacturerId"}
        ],
        "pk" : "deviceLicenseId"
    },
    "Country": {
        "fields": [
            {"name": "Country", "type": "text", "columnName": "country", "maxchar": "100"},
            {"name": "Code", "type": "text", "required": false, "columnName": "code", "maxchar": "3"}
        ],
        "pk" : "countryId"
    },
    "DeviceType": {
        "fields": [
            {"name": "Device Type", "type": "text", "columnName": "deviceType", "maxchar": "100"},
        ],
        "pk": "deviceTypeId"
    },
    "DeviceSubType": {
        "fields": [
            {"name": "Device SubType", "type": "text", "columnName": "deviceSubType", "maxchar": "100"},
        ],
        "pk" : "deviceSubTypeId"
    },
    "FailureType": {
        "fields": [
            {"name": "Failure Type", "type": "text", "required": false, "columnName": "failureType", "maxchar": "50"}
        ],
        "pk" : "failureTypeId"
    },
    "Manufacturer": {
        "fields": [
            {"name": "Name", "type": "text", "columnName": "name", "maxchar": "100"},
        ],
        "pk" : "manufacturerId"
    },
    "PatchPanelType": {
        "fields": [
            {"name": "Patch Panel Type", "type": "text", "columnName": "patchPanelType", "maxchar": "100"}
        ],
        "pk": "patchPanelTypeId"
    },
    "PhoneNumberType": {
        "fields": [
            {"name": "Phone Number Type", "type": "text", "columnName": "phoneNumberType", "maxchar": "100"}
        ],
        "pk" : "phoneNumberTypeId"
    },
    "Priority": {
        "fields": [
            {"name": "Priority", "type": "text", "columnName": "priority", "maxchar": "100"},
            {"name": "Sla", "type": "text", "columnName": "sla", "maxchar": "500"},
            {"name": "Sla Hours", "type": "number", "columnName": "slaHours", "maxchar": "500"}
        ],
        "pk" : "priorityId"
    },
    "State": {
        "fields": [
            {"name": "State", "type": "text", "columnName": "state", "maxchar": "100"},
            {"name": "Code", "type": "text", "required": false, "columnName": "code", "maxchar": "2"},
            {"name": "Country", "type": "text", "dropdown": {"table": "Country", "display":"country", "fk":"countryId"}, "columnName": "countryId"}
        ],
        "pk" : "stateId"
    },
    "Status": {
        "fields": [
            {"name": "Status", "type": "text", "columnName": "status", "maxchar": "255"},
            {"name": "For Service Request", "type": "checkbox", "columnName": "forServiceRequest"},
            {"name": "For Devices", "type": "checkbox", "columnName": "forDevices"},
            {"name": "For Items", "type": "checkbox", "columnName": "forItems"}
        ],
        "pk" : "statusId"
    }
};

let cachedDropdownData = {}

let phoneNumberTypeData = null

async function getDropdownValues(dropdowns) {
    try {
        const response = await fetch('/GetModalDropdownData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "tableInfo": dropdowns })  // Send as JSON
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return data;  // Return the data after the function resolves
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// get the history of a row in a table
function openHistoryTabForRow(itemId, tableName, pk_column) {
    let historyTableName = tableName + "Audit"
    window.open(`/history?audit_table_name=${historyTableName}&pk_column=${pk_column}&item_id=${itemId}`, "_blank");
}

// gets the phone number type data from the database so the dropdown can be populated with the correct values
async function getPhoneNumberTypeData() {
    try {
        const response = await fetch('/GetPhoneNumberTypeData')
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const phoneNumberTypeData = await response.json();
        return phoneNumberTypeData;

    } catch (error) {
        console.error('Error:', error);
        return null
    }
}

// (cached data for the table, dropdown table, column name, fk column, option name)
function getDropdownOptionId(cachedDataForTable, dropdownTable, dropdownName, dropdownId, option) {
    let dropdownOptionsForTable = cachedDataForTable[dropdownTable]
    for (let i = 0; i < dropdownOptionsForTable.length; i++) {
        if (dropdownOptionsForTable[i][dropdownName] === option) {
            return dropdownOptionsForTable[i][dropdownId]
        }
    }
}

    
export async function createTableModal(tableName, userID, rowId = null, edit=false) {
    // Check if the table has a defined modal structure
    if (!(tableName in modalConfig)) {
        console.error(`No modal configuration found for table: ${tableName}`);
        return false;
    }

    // Get configuration for the selected table
    const { fields } = modalConfig[tableName];

    // Create modal container
    const modal = document.createElement("div");
    modal.id = `modal-${tableName}`;
    modal.classList.add("modal");
    modal.style = "display:none;"
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeTableModal();
        }
    };

    // for each field in the table (defined in modalConfig object). if the field has a dropdown key then add 
    // it to an object to be sent to the backend via the getDropdownValues funtion which calls the (/GetModalDropdownData) route
    //  which will query the db and return dropdown values
    const dropdowns = [];
    fields.forEach(field => {
        if (field.dropdown){
            dropdowns.push(field.dropdown)
        }
    })

    // caching system for the dropdown values
    let dropdownValues = null
    if (cachedDropdownData[tableName]){
        dropdownValues =  cachedDropdownData[tableName]
    }else{
        dropdownValues = await getDropdownValues(dropdowns);
        cachedDropdownData[tableName] = dropdownValues;
    }

    for (let field of fields) {
        if (field.dropdown && field.dropdown.table === "PhoneNumberType") {
            if (!phoneNumberTypeData) {
                phoneNumberTypeData = await getPhoneNumberTypeData();
            }
        }
    }

    // Generate input fields dynamically
    // example field {"name": "Vendor", "type": "text", "dropdown": {"table":"Vendor", "display":"name", "fk":"vendorId"}},
    let formFields = fields.map(field => {
        // If the field has a dropdown, generate a dropdown select element
        let editValue = '';
        let dropdownOptionId = '';
        if (edit) {
            // edit value = existing value in the row (get row id then column value. You might have to change the table creation to include a class name with the column title)
            if (field.dropdown) {
                editValue = document.getElementById(`${rowId}-${field.columnName}`).innerText
                // gives building abbreviation a dropdown value of its associated building id
                if (field.dropdown.table === "Building" || field.dropdown.table === "Country") {
                    let buildingTitle = document.getElementById(`${rowId}-${field.columnName}`).getAttribute('title');
                    let buildingId = buildingTitle.match(/ID Number:\s*(\d+)/);
                    dropdownOptionId = buildingId[1];
                } else if (field.dropdown.table === "PhoneNumberType") {
                    dropdownOptionId = editValue
                    editValue = phoneNumberTypeData[editValue]
                } else {
                    // (cached data for the table, dropdown table, column name, fk column, option name)
                    dropdownOptionId = getDropdownOptionId(cachedDropdownData[tableName], field.dropdown.table, field.dropdown.display, field.dropdown.fk, editValue)
                }            
            } else if (field.type === 'date') {
                editValue = document.getElementById(`${rowId}-${field.columnName}`).innerText;
                editValue = new Date(editValue).toISOString().split('T')[0];
                editValue = `value="${editValue}"`;
            } else if (field.type === 'checkbox') {
                editValue = document.getElementById(`${rowId}-${field.columnName}`).innerText;
                if (editValue === 'True') {
                    editValue = 'checked';
                } else if (editValue === 'False') {
                    editValue = '';
                }
            } else {
                editValue = `value="${document.getElementById(`${rowId}-${field.columnName}`).innerText}"`
            };

        }
        if (field.dropdown) {
            const dropdownOptions = dropdownValues[field.dropdown.table] || []; // Fetch dropdown data dynamically
            const options = dropdownOptions.map(option => `
                <option value="${option[field.dropdown.fk]}">${option[field.dropdown.display]}</option>
            `).join('');
    
            return `
            <label style="font-size: 1rem;">${field.name}:</label>
            <select id="${tableName}-${field.name.replace(/\s/g, '')}" 
                    class="${field.type}Input" 
                    ${field.required ? "required" : ""}>
                <option value=${edit ? dropdownOptionId : ""}>${edit ? editValue : `Select ${field.name}`}</option>
                ${options}
            </select>
        `;
        }
    
        // If the field does not have a dropdown, create a regular input field
        return `
            <label style="font-size: 1rem;">${field.name}:</label>
            <input type="${field.type}" id="${tableName}-${field.name.replace(/\s/g, '')}" 
                placeholder="Enter ${field.name}${field.format ? " as 123-456-7890" : ""}" class="${field.type}Input" ${field.required ? "required" : ""} ${edit ? `${editValue}`: ""} 
                ${field.format ? field.format : ""} ${field.maxchar ? `maxlength="${field.maxchar}"` : ""}>
        `;
    }).join("<br>");


    // Set modal content
    modal.innerHTML = `
        <div class="modal-content">
            ${ edit ?
            `<svg id="historyButton" xmlns="http://www.w3.org/2000/svg" style="position: absolute; top: 15px; left: 15px; width: 30px; height: 30px;" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16">
                <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z"/>
                <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z"/>
                <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5"/>
            </svg>`
            : ''}
            <h2>${edit ? "Edit": "Add"} ${tableName}</h2>
            <svg id="xButton" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="ionicon" style="position: absolute; top: 10px; right: 10px; width: 30px; height: 30px;">
                <path d="M400 145.49L366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49z"></path>
            </svg>
            <form id="form-${tableName}">
                ${formFields}
                <input type="hidden" name="userIdModified" id="userIdModified" value="${userID}">
                <br>
                <button type="submit">Save</button>
                <button type="button" ${edit ? 'id="edit-del-btn"' : null} class="closeTableModal">${edit ? "Delete" : "Cancel"}</button>
            </form>
        </div>
    `;

    // Append modal to body (but keep hidden initially)
    document.body.appendChild(modal);
    
    // Close modal event
    const closeTableModal = () => {
        modal.style.display = "none";
        document.body.style.overflow = "auto";  // Re-enable body scrolling
    }

    const deleteItem = (itemId, pk_column) => {
        fetch("/DeleteTableRow", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({"table": tableName, "pk": pk_column, "pk_value": itemId})
        })  
        .then(response => response.json())
        .then(data => {
            console.log("Success:", data);
        })
        .catch(error => console.error("Error:", error));
        form.reset()
        closeTableModal()
        // window.location.reload(); // reload the page to show the changes.
    }

    // Add event listener to close modal when x button is clicked
    let xButton = modal.querySelector("#xButton")
    xButton.addEventListener("click", () => {closeTableModal()});
    
    //  if edit mode change the cancel to a delete button and add history button
    if(edit){
        const pk_column = modalConfig[tableName]["pk"]
        modal.querySelector(".closeTableModal").addEventListener("click", () => {deleteItem(rowId, pk_column)})
        const historyButton = document.getElementById("historyButton")
        historyButton.addEventListener("click", () => {
            openHistoryTabForRow(rowId, tableName, pk_column)
        })
    }else{
        modal.querySelector(".closeTableModal").addEventListener("click", () => {closeTableModal()})
    }

    // Handle form submission
    const form = document.getElementById(`form-${tableName}`)
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        // Collect form data
        const formData = {};
        formData['Table'] = tableName
        fields.forEach(field => {
            const inputId = `${tableName}-${field.name.replace(/\s/g, '')}`;
            const inputElement = document.getElementById(inputId);
            if (field.dropdown) {
                formData[field.columnName] = inputElement.value;
            } else if (field.type === 'checkbox') {
                if (inputElement.checked) {
                    formData[field.columnName] = 1;
                } else {
                    formData[field.columnName] = 0;
                }
            } else {
                formData[field.columnName] = inputElement.value;
            };
        });
        if (edit) {
            const pk = modalConfig[tableName]["pk"]
            formData["pk"] = pk
            formData[pk] = rowId
        }   

        console.log(`Submitting data for ${tableName}:`, JSON.stringify(formData));

        // Send data via Fetch API
        fetch(`${edit ? "/EditTableRow" : "/AddTableRow"}`, {
            method: `${edit ? "PUT" : "POST"}`,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        })  
        .then(response => response.json())
        .then(data => {
            console.log("Success:", data);
        })
        .catch(error => console.error("Error:", error));
        form.reset()
        closeTableModal()
        // window.location.reload(); // reload the page to show the changes.
    });
        // Function to show the modal
    const showModal = () => {
        modal.style.display = "block";
        document.body.style.overflow = "hidden";  // Disable body scrolling
    }
    return showModal
}