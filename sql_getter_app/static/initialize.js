/*  
    Functions pertaining to the general startup housekeeping
    things

           Written by: 
      Isaac Cutler 12/1/2020
           Updated by:
      Mason Hunter 4/18/2022
    Property of the BYU A/C Shop
*/
function init() {
    urlParams = new URLSearchParams(window.location.search);
        // check if this page is a child of another and act accordingly
    checkForParentWindows();
        // set the page to automatically run data passed to history.pushState as a function when
        // the user hits the back button.
    window.historyStateActionArray = new Array();
    history.replaceState('data', 'windowOpened', '');
    window.onpopstate = function(event) { 
        console.log(event);
        let functionToExecute = window.historyStateActionArray[event.state.arrayPos];
        if (functionToExecute) functionToExecute();  
    };
        // generate the columns object
    window.columnsInfo = generateColumnsObject(document.getElementById('tableHead'));
        // initialize the rows of the table
    window.rowCollection = initializeRows(document.getElementById('tableBody'), window.columnsInfo);

        // execute various functions
        
        // generate the sort Menu
    let sorter = new sortMenu(window.columnsInfo, document.getElementById("table"), window.rowCollection);
    // console.log(sorter);
    document.getElementById('tableFunctions').appendChild(sorter.createMenu('Sort by: ', 'STUFF TO SORT'));

    generateDisplaySelect();
    generatePrintButton();
    generateFilterButton();
        // start the pagination engine
    document.getElementById('tableFunctions').appendChild(new paginationEngine(rowCollection));

        // restore scroll position
    if (isStorageItem('scroll')) {
        yPosition = num(getStorageItem('scroll'));
        window.scrollTo(0, yPosition);
    }
    
        // generate the input new page
    // generateInput();
    
        // define a function to run when the page is closed
    window.addEventListener('unload', updateSaveCookies);

}
/* create an object that contains column numbers with their values being objects with data about those columns
*
* Inputs: 
*   1. HTML <th> element - the header for the table
*   2. array - an array containing the columns in the table: ["deviceName", "deviceTypeId", etc]
*   3. object - column type data from the server: {"deviceId": {"COLUMN_NAME": "deviceId", "DATA_TYPE": "int", "CHARACTER_MAXIMUM_LENGTH": null, "IS_NULLABLE": "NO"}}
*   4. object - the linked columns with their corresponding data from the server: {"deviceId": {"130": "acaxr2.byu.edu", "142": "air-aspen-1", "144": "air-b34-1", etc}, etc}
*   5. string - the name of the table
* returns null
*/
function generateColumnsObject(headerRef, columnArray=tableColumnArray, columnTypesObject=columnTypes, linkedColumns=links, nameOfTable=tableName, uneditableList=uneditableColumns) {
    headers = headerRef.cells;  // get a collection of html ref's to the header cells
    columnsObj = new Array();
    // add the Id column
    let idObj = new Object();
    idObj['name'] = headers[0].textContent;
    idObj['readableName'] = 'ID';
    idObj['htmlRef'] = headers[0];
    idObj['type'] = 'int';
    idObj['nullable'] = false;
    idObj['maxChar'] = null;
    idObj['uneditable'] = true;
    columnsObj.push(idObj);
    // replace the header name with the human readable name
    headers[0].textContent = idObj['readableName'];
    // looping through the array of column names from the server
    for (column in columnArray) {
        let inner = new Object();
        inner['name'] = columnArray[column];
        var text = columnArray[column];
        // CamelCase -> Normal Case
        var result = text.replace( /([A-Z])/g, " $1" );
        var finalResult = result.charAt(0).toUpperCase() + result.slice(1);
        inner['readableName'] = finalResult;
        inner['htmlRef'] = headers[parseInt(column) + 1]; // to ignore the ID column

        if (columnTypesObject.hasOwnProperty(columnArray[column])) { // if the column has an entry in the columnTypes array
            var type = columnTypesObject[columnArray[column]];

            inner['type'] = type['DATA_TYPE'];
            inner['nullable'] = ((type['IS_NULLABLE'] == 'YES') ? true : false);
            inner['maxChar'] = JSON.parse(type['CHARACTER_MAXIMUM_LENGTH']);
                // set tooltips
            setTooltip(headers[parseInt(column) + 1], `${nameOfTable}.${type.COLUMN_NAME}\nType: ${type.DATA_TYPE}\nMaxCharacters: ${type.CHARACTER_MAXIMUM_LENGTH}\nNullable: ${type['IS_NULLABLE']}`);
        } else { // each column should be in columnTypes but in case it doesn't this is the default
            inner['nullable'] = false;
            inner['type'] = 'varchar'; 
        } 
        
        if (linkedColumns.hasOwnProperty(columnArray[column])) { // if column has an entry in the links object from the server
            let link = linkedColumns[columnArray[column]]

            headers[parseInt(column) + 1].textContent = link['info']['replacement']; // replace the linked name with it's readable name

            setTooltip(headers[parseInt(column) + 1], `Column: ${nameOfTable}.${type.COLUMN_NAME}\nLinking column: ${link['info']['table']}.${link['info']['column']}\nType: linked\nNullable: ${type['IS_NULLABLE']}`); // replace tooltips
                // check which type of linked it is (normal or the custom one for table permissions)
            if (type.DATA_TYPE == 'linkedObjectHybrid') inner['type'] = 'linkedHybrid';
            else inner['type'] = 'linked';
                // set the rest of the parameters from the linked object to the inner object
            inner['linkTable'] = link['info']['table'];
            inner['readableName'] = link['info']['replacement'];
            inner['columnReplacement'] = link['info']['column'];
            inner['linkObject'] = link;
        } 
        // check if the column is on the uneditable list and set that flag in the row object (uneditable = (true or false))
        if (uneditableList) inner['uneditable'] = uneditableList.includes(columnArray[column])
        
        columnsObj[parseInt(column) + 1] = inner; // plus 1 to accommodate the Id column
    }
    return columnsObj;
}

/* function that initializes all the rows with the rowEngine() class
 * 
 * Inputs:
 *  1. HTML <table> element - the table
 *  2. object - an object generated by generateColumnsObject()
 * 
 * returns an object containing all the rowEngines initialized
 */

function initializeRows(tableBodyRef, columnsInfo) {
    // determine if the showDeleted filter is needed
    let filterArgs = JSON.parse(decodeURIComponent(new URLSearchParams(window.location.search).get('filter')));


    let rows = tableBodyRef.rows;
    let rowsObject = new Object();
        // for each row...
    for (row of rows) {
            // create a row engine and call .loadrow on it
        let placeholder = new rowEngine(columnsInfo, tableName, permissionsObject, linkedChildrenExist, true);
        placeholder.loadRow(row);
            // set the showDeleted (comes form if there is a showDeleted filter option)
        placeholder.showDeleted = (filterArgs && filterArgs.showDeleted ? true:false);
            // set the is Deleted boolean based no if there is the data-deleted argument
        if (placeholder.rowRef.getAttribute('data-deleted') == 'true') {
            placeholder.isDeleted = true;
            placeholder.updateDeletedVisibility();
        }
        
            // place that rowEngine in the rowsObject
        rowsObject[placeholder.id] = placeholder;
    }
    return rowsObject;
}

// function that runs as the page closes
//      It runs through and saves the rows being edited as cookies
function updateSaveCookies() {
    for (index in rowCollection) {
        row = rowCollection[index];
        if (row.editing) setStorageItem(row.id+'RowProgress', JSON.stringify(row.getValues()));
    }

    if (inputEngine.editing) setStorageItem('newProgress', JSON.stringify(inputEngine.getValues()));

    // save the scroll position
    setStorageItem('scroll', window.scrollY);
}

// for when a javascript request comes back with an error
function createErrorBox() {
    box = document.createElement('h2');
    box.textContent = 'There has been a server error, contact the ac shop for help';
    return box;
}

function createLoadingGraphic() {
    let loader = document.createElement('div');
    loader.style.zIndex = 100000;
    loader.style.position = 'absolute';
    loader.innerHTML = '<div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>';
    document.body.style.cursor = "wait";
    
    // puts the graphic in the page
    document.getElementById('loaders').appendChild(loader);

    return loader;
}

/* for input new, places input in beautiful rows given an html node to place it in and an object containing the inputs as html nodes
 *
 * collection = [['column Name', htmRef for cell], ...]
 * container = htmlRef
 */
function placeInBeautifulRows(collection, container) {
        // format the grid container
    let grid = document.createElement('div');
    container.appendChild(grid);
    grid.classList.add('inputDaddyDiv');
        // go over each part in the collection array
    for (let inputNum in collection) {
        // format the things
        let daddyDiv = document.createElement('div');
        daddyDiv.classList = 'inputNewParent';
        let hijaDiv = document.createElement('div');
        hijaDiv.classList = 'inputNewTitle';
        daddyDiv.appendChild(hijaDiv);
        hijaDiv.appendChild(collection[inputNum][0]);
        daddyDiv.appendChild(collection[inputNum][1]);
        grid.appendChild(daddyDiv);
    }
}

// sets the tooltip for a DOM node
function setTooltip(node, text) {
    node.title = text;
}

// set mobile checkboxes in menu to only select one at a time:

function mobileMenuClick(clicked) {
    // loop through all the checkboxes with class dropdown-checkbox (all the dropdown checkboxes)
    for (checkbox of document.getElementsByClassName('dropdown-checkbox')) {
        if (checkbox.id != clicked.id) checkbox.checked = false; // if the checkbox is not the selected checkbox then uncheck it
    }
}