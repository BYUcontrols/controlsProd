/*  
    Service request specific functions

           Written by: 
      Isaac Cutler 12/1/2020
           Updated by:
      Mason Hunter 4/18/2022
    Property of the BYU A/C Shop
*/

// A custom init function for the service request table
function serviceRequestInit() {
    displayTechnicianFunctionalities(userIsTech);
    showOpenButtonTransformation(urlPath);
    showAllButtonTransformation(urlPath);

    urlParams = new URLSearchParams(window.location.search);
        // check if this page is a child of another and act accordingly
    checkForParentWindows();
        // set the page to automatically run data passed to history.pushState as a function when
        // the user hits the back button.
    window.historyStateActionArray = new Array();
    history.replaceState('data', 'windowOpened', '');
    window.onpopstate = function(event) { 
        let functionToExecute = window.historyStateActionArray[event.state.arrayPos];
        if (functionToExecute) functionToExecute();  
    };
        // create a place to store the containers for the open service request windows
    window.srContainerObject = new Object()
    
        // if we were redirected from another page create an alert box that tells the user about it
    if (this.urlParams.has('redirectChain')) {
        let path = JSON.parse(urlParams.get('redirectChain'))
        let fromTable = path[path.length-1]['table'];
        unobtrusiveAlert("Redirected from "+fromTable+". Click a 'Select' button or create new element to return with that element selected");
    }
    // generate the columns object
    window.columnsInfo = generateColumnsObject(document.getElementById('tableHead'));
    // console.log(window.columnsInfo);
        // initialize the rows of the table
    window.rowCollection = serviceReqInitializeRows(document.getElementById('tableBody'), window.columnsInfo);
    // console.log(window.rowCollection);

    // Create an instance of the sortMenu.
    let sorter = new sortMenu(window.columnsInfo, document.getElementById('srtable'), window.rowCollection);
    // console.log("Sorter object:", sorter); // You already have this, good.

    let tableFunctionsContainer = document.getElementById('srTableFunctions');
    // console.log("Container (srTableFunctions):", tableFunctionsContainer);

    if (tableFunctionsContainer) {
        let menuElement = sorter.createMenu('Sort SR by: ', 'Options to sort service requests');
        // console.log("Menu element from createMenu:", menuElement);

        if (menuElement instanceof Node) { // Check if it's a valid DOM node
            tableFunctionsContainer.appendChild(menuElement);
            // console.log("innerHTML of srTableFunctions after append:", tableFunctionsContainer.innerHTML);
            // At this point, if no errors, it should be in the DOM.
        } else {
            // console.error("sorter.createMenu() did NOT return a valid DOM element. It returned:", menuElement);
        }
    } else {
        // console.error("Element with ID 'srTableFunctions' NOT FOUND!");
    }
    generateDisplaySelect({"0":true,"1":true,"2":true,"3":true,"4":true,"5":true,"6":true,"7":true,"8":true,"9":true,"10":true,"11":true,"12":true,"13":true});
    generatePrintButton(document.getElementById('srTableFunctions'));
    generateFilterButton();
    
    
    //     // execute various functions
    // // MASON: UNCOMMENT BELOW FOR SORT SELECT    
    // generateSortSelect();
    //     // custom initial displayed columns if you want to easily change this:
    //     //  use 'Displayed Columns' and then go to the devConsole for chrome, 
    //     //  Application, Local Storage, https://whateverTheServerIs, /serviceRequest, and copy the text for 'display'
    

    // start the pagination engine
    // document.getElementsByClassName('tableFunctions')[0].appendChild(new paginationEngine(rowCollection));

        // restore scroll position
    if (isStorageItem('scroll')) {
        yPosition = num(getStorageItem('scroll'));
        window.scrollTo(0, yPosition);
    }

    // generate the input new page
    generateNewServiceRequest();

        // define a function to run when the page is closed
    window.addEventListener('unload', updateSaveCookies);
}

/* function that initializes all the rows with the rowEngine() class
 * but custom built for the service request table
 * 
 * Inputs:
 *  1. HTML <table> element - the table
 *  2. object - an object generated by generateColumnsObject()
 * 
 * returns an object containing all the rowEngines initialized
 */

function serviceReqInitializeRows(tableBodyRef, columnsInfo) {
    // FIXME
    // This is where the a UI bug is happening. The tableBodyRef is a table with just the numeric FK values in it
    // The user sees the numbers displayed for a split second while this function runs and changes to actual values
    if (!tableBodyRef.rows) throw 'Invalid table htmlElement passed';

    let rows = tableBodyRef.rows;
    let rowsObject = new Object();
    // Define the SVG for the edit button once
    const editButtonSVG = '<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><path d="M384 224v184a40 40 0 01-40 40H104a40 40 0 01-40-40V168a40 40 0 0140-40h167.48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path d="M459.94 53.25a16.06 16.06 0 00-23.22-.56L424.35 65a8 8 0 000 11.31l11.34 11.32a8 8 0 0011.34 0l12.06-12c6.1-6.09 6.67-16.01.85-22.38zM399.34 90L218.82 270.2a9 9 0 00-2.31 3.93L208.16 299a3.91 3.91 0 004.86 4.86l24.85-8.35a9 9 0 003.93-2.31L422 112.66a9 9 0 000-12.66l-9.95-10a9 9 0 00-12.71 0z"/></svg>';

        // for each row...
    for (const row of rows) { // Changed to const as 'row' is not reassigned in the loop
            // create a row engine and call .loadRow on it
        let placeholder = new rowEngine(columnsInfo, tableName, permissionsObject, linkedChildrenExist, true);
            // load the row up but skip the buttons (the fourth argument)
        placeholder.loadRow(row, false, null, false);
            // create the options button
        // let optionsData = placeholder.createOptionsButtons(true); // just return the empty options container
        //     // place the option menu in it's place
        // placeholder.buttonCell.append(optionsData.parent)
        //     // make the 'Expand' request button
        // optionsData.container.append(createButton('Edit', servReqWindow.bind(placeholder), 'Click here to expand and edit this service request'));
        //     // make the audit button if the user has audit permissions
        // if (placeholder.permissions.canAudit) optionsData.container.append(createButton('Audit', auditTable.bind(placeholder), 'View a list of changes made to this row'));
        
        // Make the description field (fields[0]) clickable to expand/edit, without the SVG icon.
        if (placeholder.fields[0] && placeholder.fields[0].htmlRef) {
            placeholder.fields[0].htmlRef.onclick = servReqWindow.bind(placeholder); //
            placeholder.fields[0].htmlRef.style.cursor = 'pointer'; //
            // Ensure the SVG is not placed here if it was there before
            if (placeholder.fields[0].htmlRef.innerHTML.includes('ionicon')) {
                 placeholder.fields[0].htmlRef.innerHTML = ''; // Or restore original text if known
            }
        }

        // Find the target cell with id 'editCell' within the current row
        let targetEditCell = null;
        for (const cell of row.cells) { // 'row.cells' is a collection of TD elements for the current TR
            if (cell.id === 'editCell') { //
                targetEditCell = cell;
                break;
            }
        }

        // If the 'editCell' is found, place the SVG icon and its click handler there
        if (targetEditCell) {
            targetEditCell.innerHTML = editButtonSVG;
            targetEditCell.onclick = servReqWindow.bind(placeholder); //
            targetEditCell.style.cursor = 'pointer';
        } else {
            console.warn(`In srMain.js: No cell with id='editCell' found in row with index ${row.rowIndex}. Edit icon (SVG) will not be placed.`);
        }
        
            // place that rowEngine in the rowsObject
        rowsObject[placeholder.id] = placeholder;
    }

    return rowsObject;
}

// called when a user clicks on a service request row.
function servReqWindow() {
    // MASON: edited so that clicking the ID field auto populates the NewServiceRequest page with the right information
    // this gets the id of the row that was clicked
    var servReqId = parseInt(this.id);
    
    // the only way I know how to talk to python from js is with a form, therefore I made an invisible form with which I send the ID to python
    let form = document.createElement('form');
    form.id = 'servReqIdForm';
    form.classList = 'invisible';
    form.method = 'post';
    form.action = $SCRIPT_ROOT + '/NewServiceRequest';
    document.body.appendChild(form);

    let input = document.createElement('input');
    input.name = 'servReqId';
    input.id = 'servReqId';
    input.value = servReqId;
    form.appendChild(input);

    form.submit();
}

// this one is a bit of a monster, sorry it's probably bad practice to have a 300+ line function (but at least 200 lines of that are comments)
// Here we create a service request window from the rowEngine for it's counterpart in the table and a boolean to tell us if it a new part or not

let modals = [];

function createServReqWindow(originEngine, newPart=false) {
    // create a rowEngine instance as a clone to represent the row but with new fields
    // we do something similar in audit.js/createCloneOfRow 
    let windowEngine = new rowEngine(originEngine.columnsObject, originEngine.tableName, originEngine.permissions, originEngine.hasLinkedChildren);
    // set the id for the windowEngine
    if (newPart) windowEngine.id = 'new';
    else windowEngine.id = originEngine.id;
    // store the clone windowEngine in the original engine
    originEngine.servReqClone = windowEngine;   
    // log the windowEngine

    // create the display container and save it in the clone
    // if the window is a new part then the id of the window will be 'newWindow' otherwise '[id]reqWindow'
    let container = createDisplayContainer(null, false, 'serviceRequestWindow');
    // save the container in it's new home
    window.srContainerObject[(newPart ? 'new' : originEngine.id)] = container;
    // reveal the window
    if (!newPart) container.openModal();

    // **** Title for the table ****
    let title = document.createElement('h1');
    // assign it's  spot
    container.appendChild(title)
    // fill the title
    title.textContent = newPart ? 'New Service Request' : 'Edit Service Request';

    // create 2 columns and rows within the window (using a css grid to keep things tidy)
    let grid = document.createElement('div');
    container.append(grid);
    grid.classList.add('serviceRequestGrid');

    // now we will place the fields exactly where we want them

    // this is a fairly long process but I prefer to do this in javascript 
    // instead of html as then we can utilize the rowEngine to do a lot of the brunt work
    // involved in saving fields and worrying about data types and modifications to the database.
    // This is a daunting amount of code, but basically for each field in the service request window we have to...
    /*   Create a title for that field and place it in the grid
     *   Create an html Input element and place it in the grid
     *   Load the value for the originEngine for that field into the field
     *   Assign windowEngine the input element so that it knows where to look to save the value
     */
    // when I say the grid, it's a css grid (google it). basically we define a grid then place elements within the grid
    // **** id ****
    if (!newPart) {
        grid.append(createServiceRequestWindowText('Id:', 'srN1'));
    }
    // **** id field ****
    if (!newPart) {
        // create element
        let Title = document.createElement('p');
        // set location
        Title.classList.add('srF1');
        // set text and right align
        Title.classList.add('srFieldText')
        Title.textContent = originEngine.id;
        grid.append(Title);
    }
    // **** date created ****
    grid.append(createServiceRequestWindowText('Date Created:', 'srN2'));
    // **** date created field ****
    let createdDate = null;
    let dateCreatedColumnNum = findInArrayOfObjects(originEngine.fields, 'colName', 'requestDate');
    let originalDateCreatedColumn = originEngine.fields[dateCreatedColumnNum];
    // get the column for the date in the windowEngine
    let windowDateCreatedColumn = windowEngine.fields[dateCreatedColumnNum];
    windowDateCreatedColumn.htmlRef = document.createElement('p');
    if (!newPart) {
        let voodoo = new dateTimeVoodoo(originalDateCreatedColumn.getVal());
        createdDate = voodoo.dateOnly();
        // put the date into the windowEngine so that when we press save it will save it
        windowDateCreatedColumn.htmlRef.textContent = originalDateCreatedColumn.getVal();
    } else {
        let voodoo = new dateTimeVoodoo()
        windowDateCreatedColumn.htmlRef.textContent = voodoo.forComputers();
        createdDate = voodoo.dateOnly();
    }
    if (true) {
        let dateCreated = document.createElement('p');
        dateCreated.classList.add('srF2');
        dateCreated.classList.add('srFieldText')
        dateCreated.textContent = createdDate;
        grid.append(dateCreated);
    }
    
    // **** requestor ****
    grid.append(createServiceRequestWindowText('Requestor:', 'srN3'));
    // **** requestor field ****
    grid.append(createServiceRequestWindowField(originEngine, windowEngine, 1, 'srF3', newPart, (newPart ? '3' : null)));
    // **** priority ****
    grid.append(createServiceRequestWindowText('Priority:', 'srN4'));
    // **** priority field ****
    grid.append(createServiceRequestWindowField(originEngine, windowEngine, 3, 'srF4', newPart, (newPart ? '3' : null)));
    // **** description ****
    grid.append(createServiceRequestWindowText('Description:', 'srN5'));
    // **** description field ****
    grid.append(createServiceRequestWindowField(originEngine, windowEngine, 0, 'srF5', newPart, (newPart ? ' ' : null)));
    // **** location ****
    grid.append(createServiceRequestWindowText('Location:', 'srN6'));
    // **** location field ****
    grid.append(createServiceRequestWindowField(originEngine, windowEngine, 7, 'srF6', newPart, (newPart ? '3' : null)));
    // **** assigned to ****
    grid.append(createServiceRequestWindowText('Assigned To:', 'srN8'));
    // **** assigned to field ****
    grid.append(createServiceRequestWindowField(originEngine, windowEngine, 13, 'srF7', newPart, (newPart ? '3' : null)));
    // **** department ****
    grid.append(createServiceRequestWindowText('Department:', 'srN9'));
    // **** department field ****
    grid.append(createServiceRequestWindowField(originEngine, windowEngine, 16, 'srF8', newPart, (newPart ? '3' : null)));
    // **** building ****
    grid.append(createServiceRequestWindowText('Building:', 'srN10'));
    // **** building field ****
    grid.append(createServiceRequestWindowField(originEngine, windowEngine, 6, 'srF9', newPart, (newPart ? '3' : null)));
    // **** estimate ****
    grid.append(createServiceRequestWindowText('Estimate:', 'srN11'));
    // **** estimate field ****
    grid.append(createServiceRequestWindowField(originEngine, windowEngine, 5, 'srF10', newPart, (newPart ? '09/25/2000' : null)));
    // **** status ****
    grid.append(createServiceRequestWindowText('Status:', 'srN12'));
    // **** status field ****
    grid.append(createServiceRequestWindowField(originEngine, windowEngine, 4, 'srF11', newPart, (newPart ? '3' : null)));
    // **** completed ****
    grid.append(createServiceRequestWindowText('Completed:', 'srN13'));
    // **** completed field ****
    // save the div created for the 'Created Date' field so that we can append a 'Today' button
    let completedDateField = createServiceRequestWindowField(originEngine, windowEngine, 12, 'srF12', newPart, (newPart ? ' ' : null), 'srCompletedDateField');
    grid.append(completedDateField);
    // 'Today' button: create a button that sets the value of the input to today
    let todayButton = createButton('Today', function() {
        let voodoo = new dateTimeVoodoo();
        windowEngine.fields[12].inputRef.value = voodoo.forComputers();
    }, 'Set the date to today\'s date')
    todayButton.classList.add('srTodayButton')
    completedDateField.appendChild(todayButton);
    // **** CC ****
    grid.append(createServiceRequestWindowText('CC:', 'srN13'));
    // **** CC field ****
    // **** add part ****
    // **** part fields ****
    // **** add note ****
    // **** note fields ****
    // **** functions ****

    // Now we will create the buttons at the bottom of the code to save cancel and print the request
    let btnDiv = document.createElement('div');
    grid.append(btnDiv);
    btnDiv.classList.add('srBtnDiv');

    let cancelBtn = generateByuButton('Cancel', 
        function() {
            container.closeModal();
            delete originEngine.servReqClone;
        }
    );
    btnDiv.append(cancelBtn);
    cancelBtn.classList.add('srBtn');

    let printBtn = generateByuButton('Print', function() {
        printSingleSr(grid)
    });
    btnDiv.append(printBtn);
    printBtn.classList.add('srBtn');

    // create the save button with its attached save functionality.
    // generateByuButton: (text, onClick)
    let saveBtn = generateByuButton('Save', 
        function() {
            // we save the service request by calling the save function on the original row's rowEngine using the data from the window
            // that way the row reflects the changes
            originEngine.saveRow.bind(originEngine)('nada', windowEngine.getValues(), 
                function() {
                        // this function is run on successful return of the saveRow request to the server
                        // now we need to save all the parts/notes/people attached to the request
                        // To start off we need to loop through all the parts in the windowEngine.enginesToSave array
                    for (let engineToSave of windowEngine.enginesToSave) {
                            // take the engineToSave off airplane mode so it will send requests to the server
                        engineToSave.airplaneMode = false;
                            // if the engineToSave has been edited and if the response from the server was a number (the server processed the new
                            // service request properly) and the row was not deleted.
                        if (engineToSave.wasModified && !isNaN(this.responseText) && !engineToSave.isDeleted) {
                                // save the row, first adding the 'serviceRequestId' field to the fields we will save
                            let returnObj = engineToSave.getValues()
                            Object.assign(returnObj, {'serviceRequestId':this.responseText})
                            engineToSave.saveRow(null, returnObj);
                        }  
                            // if the engineToSave has been deleted and if the engine already has an Id (actually exists in the table) delete it
                        if (engineToSave.isDeleted && !isNaN(engineToSave.id) && engineToSave.wasModified) engineToSave.deleteRow();
                            // if the row was unDeleted and already had an Id (was actually in the table)...
                        if (engineToSave.wasUnDeleted && !isNaN(engineToSave.id) && engineToSave.wasModified) engineToSave.unDeleteRow();
                        
                    }
                        // close the service request modal 
                    container.closeModal();
                        // reload the page
                    restoreEngine(originEngine, windowEngine, null, false);
                }
            );
        }
    );
        // place the save button where it goes
    btnDiv.append(saveBtn);
    saveBtn.classList.add('srBtn');


    /************ now we create the parts and notes fields **********************/
    // create a table to store the parts in
    let partsTable = document.createElement('table')
    partsTable.classList.add('srPartsTable');
    grid.append(partsTable);
    // load the parts table
    loadItems(partsTable, originEngine.id, windowEngine)
    console.log(windowEngine);

    // create a table to store the Notes in in
    let notesTable = document.createElement('table')
    notesTable.classList.add('srNotesTable');
    grid.append(notesTable);
    // load the notes table
    loadNotes(notesTable, originEngine.id, windowEngine)
    console.log(windowEngine);

    // create a table to store the Requestors in in
    let requestorTable = document.createElement('table')
    requestorTable.classList.add('srRequestorsTable');
    grid.append(requestorTable);
    // load the requestor table
    loadRequestors(requestorTable, originEngine.id, windowEngine)
    console.log(windowEngine);
}

// takes an array and two strings and searches through the array to find the first object
// in the array to have the correct key/value pair. Returns that object.
function findInArrayOfObjects(array, key, value) {
    for (obj in array) {
        if (array[obj][key]) {
            if (array[obj][key] == value) return obj;
        }
    }
}

// a function that creates the text for a service request field 
function createServiceRequestWindowText(text, locClass, tooltip=null) {
    // create element
    let Title = document.createElement('p');
    // set class for styling
	Title.classList.add('srNameField');
	Title.classList.add(locClass);
	// set text
    Title.textContent = text;
	// set the tooltip
	Title.title = tooltip;
    // return the title
    return Title
}

// A function that creates a service request window field
function createServiceRequestWindowField(originObj, windowObj, colNum, className, newPartBool, defaultValue=null, styleClass='srDataField') {
    // get the field objects for the origin and window
    originFieldObj = originObj.fields[colNum];
    windowFieldObj = windowObj.fields[colNum];
    // create field
    windowFieldObj.htmlRef = document.createElement('div');
    // create the input field using the .edit member of the rowEngine
    // if a default value is provided put that value in the input, else get the value from the originEngine
    if (!newPartBool) console.log(originFieldObj)
    windowFieldObj.edit((newPartBool ? defaultValue : originFieldObj.getVal()), false);
    // style fields
    windowFieldObj.inputRef.classList.add(styleClass);
	windowFieldObj.htmlRef.classList.add(className);


    // return the div created
    return windowFieldObj.htmlRef;
}

// a function called in the service request init that sets up the new service request button
function generateNewServiceRequest() {

    let reference = new rowEngine(columnsInfo, tableName, permissionsObject, linkedChildrenExist);
    reference.id = 'new';
    createServReqWindow(reference, true);

    let button = generateByuButton('+ Request', function() {
        window.srContainerObject.new.openModal();
    });
    document.getElementById("title").appendChild(button);
}

// add an event listener so if the user clicks outside any modal it will close (only when outside is both clicked and released)

function closeModalByClickingOutside() {
    const modals = document.getElementsByClassName('modal');

    for (let modal of modals) {
        let mouseDownInsideModal = false;

        modal.addEventListener('mousedown', function(event) {
            // If the user pressed directly on the modal background (not the content), don't mark as inside
            mouseDownInsideModal = event.target !== modal;
        });

        // Check where the mouse is released
        modal.addEventListener('mouseup', function(event) {
            const mouseUpInsideModal = event.target !== modal;

            // Only close if both mousedown and mouseup were outside the modal content
            if (!mouseDownInsideModal && !mouseUpInsideModal) {
                editPartCancel();
                editNoteCancel();
                notePopCancel();
                newPartCancel(); 
                partCancel();
                // cancelCloser();
            }

            // Reset for next interaction
            mouseDownInsideModal = false;
        });
    }
}
