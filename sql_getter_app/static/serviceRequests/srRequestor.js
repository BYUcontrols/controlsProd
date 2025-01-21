// a function called when opening a service request window that summons and creates the Requestor table
function loadRequestors(reqTable, requestId, serviceRequestWindowEngine) {
    
    // Get request setup
    let request = post(null, 'GET', `/serviceRequestRequestor/${requestId}`, finishLoadRequestors);
    // attach data to the request object
    request.table = reqTable;
    request.id = requestId;
    request.reqEngine = serviceRequestWindowEngine;
}


// Called on return of the request form loadItems()
function finishLoadRequestors() {
        // place the return table where it goes
    this.table.innerHTML = this.response;
        // load the rows and save the list of rowEngines returned in the rowEngine for the service request window
        // we do this so that when the service request window is closed we have a list of items and notes and people 
        // to save. As a note the type of foreign row loaded is AIRPLANE_MODE which means that the Notes will not 
        // actually send any requests to the server when saved or edited
    let listOfEngines = loadForeignRow(this.table, foreignType.AIRPLANE_MODE).engineList;
        // add the request engine to the one that already exists
    this.reqEngine.enginesToSave = this.reqEngine.enginesToSave.concat(listOfEngines)

    // store the context (this) as a variable that way we can access it inside the createInputNewNoteRow
    let requestContext = this
    // create the new input new row (passing the context)
    createInputNewRequestorRow(requestContext)
    
}


function createInputNewRequestorRow(requestContext) {
    // get a fresh empty rowEngine to create the input new fields off of
    let inputEngine = loadForeignRow(requestContext.table, foreignType.EMPTY_ENGINE_ONLY).emptyEngine;
        // set airplaneMode to true (tells the rowEngine not to send anything to the server)
    inputEngine.airplaneMode = true;
        // append this new row to the requestWindow.enginesToSave (they will not be saved until the input new button is pressed)
    requestContext.reqEngine.enginesToSave.push(inputEngine);

        // create the input new row
    inputEngine.rowRef = document.createElement('tr');
    requestContext.table.childNodes[1].append(inputEngine.rowRef);
    inputEngine.rowRef.classList.add('srItemsNewRow');
        // set edit to true for the inputEngine
    inputEngine.editing = true;
        // set the 'new' id for the input engine
    inputEngine.id = 'new';
        // load columns for the input new item
    let startColumn = function(index, defaultVal=undefined, secondArg=undefined) {
        let cell = inputEngine.fields[index]
            // create the cell for the input field
        cell.htmlRef = document.createElement('td');
            // call the .edit() member on that cell to create the input field
        cell.edit(defaultVal, secondArg)
            // put the cell in it's place in the table
        inputEngine.rowRef.append(cell.htmlRef);
    }
        // start the firstName column
    startColumn(0);
        // start the lastName column
    startColumn(1);
        // start the email column
    startColumn(2); 
        // start the phone Number column
    startColumn(3);
        // start the netId column
    startColumn(4);
        // create the optionsButtons for the inputEngine (but don't put them anywhere yet)
    let inputEngineOptions = inputEngine.createOptionsButtons();
    // create a place to put the add and options button
    let inputButtons = document.createElement('td');
    inputEngine.rowRef.append(inputButtons);

        // create a custom onSaveReturn for the inputEngine that makes the input row look like a normal row

    let customSaveFunction = function() {

            // remove the css class of the row so that makes it look different from the other rows
        inputEngine.rowRef.classList.remove('srItemsNewRow'); 
            // remove the + item button
        inputButtons.innerHTML = '';
        inputButtons.append(inputEngineOptions);
        inputButtons.classList.remove('srItemsNewSaveBtnCell');
        inputButtons.classList.add('noPrint');
            // disable the undo button (can't undo a creation)
        inputEngine.undoBtn.disabled = true;
        
            // do button things
        inputEngine.saveBtn.disabled = true;
        inputEngine.undoBtn.disabled = false;
        inputEngine.editBtn.disabled = false;
            // remove the editing style and attribute
        inputEngine.editing = false;
        inputEngine.rowRef.classList.remove('editable'); 
            // remove the edit cookie
        removeStorageItem(inputEngine.id + 'RowProgress');
            // restore the cells to their unedited state
        for (let cell of inputEngine.fields) {
                // if an object was provided then restore with those values
            cell.restoreCell();
        }
            // call this whole function again to create another input new row
        createInputNewItemRow(requestContext);
            // It's not an infinite loop I swear. This part of the code is run when the user clicks a button
    }

    // create an add button for the new item
    let button = generateByuButton('+Item',
        function() {
            // call the saveRow() method 
            inputEngine.saveRow(null, null, customSaveFunction);
            console.log(inputEngine);
        }
    );

    // place that button in its place
    inputButtons.append(button);
    inputButtons.classList.add('srItemsNewSaveBtnCell');
}