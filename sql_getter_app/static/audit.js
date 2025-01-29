/*  
    functions to display the audits to a row in a popup window

           Written by: 
      Isaac Cutler 12/1/2020
    Property of the BYU A/C Shop
*/


function auditTable() {
        // create a big popup box
    let container = createDisplayContainer()
    container.addPrintButton(`Audits_For_${this.tableName}_Row_${this.id}`);
        // Get request setup
    let request = post(null, 'GET', `/getAudit/${this.tableName}/${this.id}`, displayAuditData);
        // pass the request object data about where everything goes and what the id is
        // so that we can access it in displayAuditData()
    request.container = container;
    request.id = this.id;
    request.rowEngine = this;
    
}

// creates a big window over the page where we can display stuff
// id - string - the id attribute for the container
// dynamic - boolean - if the modal should stick around when the close button is pressed (can be summoned again using the ID)
// additionalClass - string - a class that can be added to the content (if)

function createDisplayContainer(id='displayContainer', dynamic=true, additionalClass=null) {
    // create the window
    let modal = document.createElement('DIV');
    document.getElementById('body').appendChild(modal);
    modal.classList = 'modal';
    if (dynamic) {// if we are dynamic display the modal, if not: don't
        modal.style.display = 'block';
    } else {
        modal.style.display = 'none';
    }
    modal.id = id;
        // create a place to stick stuff
    let content = document.createElement('DIV');
    content.classList = 'modal-content';
        // if there is an additional class argument provided use it.
    if (additionalClass) content.classList.add(additionalClass);
    

    modal.appendChild(content);
        // create a div to store the close and print icons
    let iconDiv = document.createElement('div')
    iconDiv.classList.add('modalIconContainer')
    content.append(iconDiv);
        // create an x that closes the modal
    let closeBox = document.createElement('span');
    closeBox.classList.add('close');
    closeBox.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512" width="24" height="24" fill="currentColor">
            <path d="M400 145.49L366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49z"/>
        </svg>
    `;
    closeBox.divToClose = modal;
    iconDiv.appendChild(closeBox)
    let closeFunction = function() {
        if (dynamic) {
            closeBox.divToClose.remove();
        }
        closeBox.divToClose.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    let openFunction = function() {
        closeBox.divToClose.style.display = 'block';
            // enter an event in the window.history that way people can close the displayContainer by hitting the back button
            // to do this we first need to store the closeFunction in a global variable
        let newIndex = window.historyStateActionArray.push(closeFunction);
        console.log('NEWINDEX ', newIndex-1);
        history.replaceState({arrayPos:newIndex-1}, 'modalClosed', '#');
        history.pushState('data', '',`#modal${newIndex}Active`)
    }

    closeBox.onclick = function() {history.back();}; // when we open the modal (openFunction) we set an entry in the history
        // of the page that saves the state of the pre open state, so to close the modal we simply hit the back button.
    
        // creates a div to put the table into and returns it
    let container = document.createElement('DIV');
    container.style.marginTop = '10px';
    content.appendChild(container);
    // save the close function under container that way we can close the modal using code later on
    container.closeModal = function() {history.back();};
    container.openModal = openFunction;

    // open the modal (so that the back button can clear it) ONLY if we are dynamic
    if (dynamic) openFunction();

    // implement a print functionality option for the modal
    container.addPrintButton = function (fileName='someone_forgot_to_specify_a_file_name') {
            // create the print button 
            let printBtn = document.createElement('SPAN');
            printBtn.classList.add('printIcon');  // Add the class without overwriting
            // print icon svg
            printBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512">
              <path d="M400 96V56a8 8 0 00-8-8H120a8 8 0 00-8 8v40"/>
              <rect x="152" y="264" width="208" height="160" rx="4" ry="4" fill="none"/>
              <rect x="152" y="264" width="208" height="160" rx="4" ry="4" fill="none"/>
              <path d="M408 112H104a56 56 0 00-56 56v208a8 8 0 008 8h56v72a8 8 0 008 8h272a8 8 0 008-8v-72h56a8 8 0 008-8V168a56 56 0 00-56-56zm-48 308a4 4 0 01-4 4H156a4 4 0 01-4-4V268a4 4 0 014-4h200a4 4 0 014 4zm34-212.08a24 24 0 1122-22 24 24 0 01-22 22z"/>
            </svg>
            `;            
        iconDiv.append(printBtn);
            // set the print button to send data to the server when clicked
        printBtn.onclick = function () {
                // send the data
            console.log({ data: container.innerHTML, title: fileName })
            redirectPost( { data: container.innerHTML, title: fileName } , '/printModal');
        }
        return printBtn;

    }
    

    return container;
}

// function that runs on return of audit data requests
function displayAuditData() {

        // a little title
    let auditTitleHeader = document.createElement('h1')
    auditTitleHeader.textContent = this.rowEngine.tableName+" row:";
    this.container.appendChild(auditTitleHeader);
    let clonedRow = createCloneOfRow(this.rowEngine)
    this.container.appendChild(clonedRow.htmlRef);
        // a little title
    let auditTitleChanges = document.createElement('h1')
    auditTitleChanges.textContent = 'Changes made to this row:'
    this.container.appendChild(auditTitleChanges);
        // creates a box that scrolls horizontally
    let auditTable = document.createElement('div');
    auditTable.classList += 'modalTableContainer';
    this.container.appendChild(auditTable);
        // place the actual table into the box previous
    table = document.createElement('TABLE');
    table.innerHTML = this.response;
    auditTable.appendChild(table);
        // link audit table
    loadForeignRow(table, foreignType.AUDIT, clonedRow.engine);

}

function createCloneOfRow(originalRow) {
    // create a box that contains a copy of the table head and row being audited
    let exampleDiv = document.createElement('div');
    exampleDiv.style.overflowX = 'initial';
    exampleDiv.style.overflowY = 'auto';
    exampleDiv.style.whiteSpace = 'initial';
    let example = document.createElement('table');
    exampleDiv.appendChild(example);
        // create the header
    let tHead = document.createElement('thead');
    let headerRow = document.createElement('tr');
    example.appendChild(tHead);
    tHead.appendChild(headerRow);
    for (let cell of originalRow.columnsObject) headerRow.appendChild(cell.htmlRef.cloneNode(true));
        // place the copied row in a table
    let tBody = document.createElement('tbody');
    example.appendChild(tBody);
    let copyRowRef = originalRow.rowRef.cloneNode(true);
        // start the engine for the clone
    let copyRow = new rowEngine(originalRow.columnsObject, originalRow.tableName, originalRow.permissions, originalRow.hasLinkedChildren);
        // copy the html for the original row into the new container
    tBody.appendChild(copyRowRef);
        // a custom save function for the copy row that saves both the original and the copy
    copyRow.saveRow = function(nada=null, dataObj = copyRow.getValues()) {
        console.log(dataObj);
        copyRow.onSaveReturn(dataObj);
        originalRow.backupObj = copyRow.backupObj; 
        originalRow.saveRow.bind(originalRow)('nada', dataObj, function() { originalRow.onSaveReturn(dataObj) }.bind(originalRow));
    }.bind(copyRow);
        // a custom delete function that deletes the original and blanks out the copy
    copyRow.deleteRow = function() {
        originalRow.deleteRow.bind(originalRow)();
        copyRow.rowRef.innerHTML = '';
    }
        // finish initializing the copy row
    copyRow.loadRow(copyRowRef, clone=true, cloneRowEngine=originalRow);
        // returns the html ref and the engine of the row
    return {'htmlRef':exampleDiv, 'engine':copyRow};
}



// function to handle a restore button (or just to restore one to another) that takes an example parent (e.g. a table row)
//  and and the child (e.g. the audit row that you want to restore) as RowEngine objects and then loops through
//  the parent rows columns and looks for a matching column in the child row and saves the values of the child row
//  that have a matching column in the parent object. Then takes those values and simulates saving them using the
//  parent's .saveRow member.
function restoreEngine(parent, child, btn, save=true) {
    let saveFunc = function() {
        let saveObject = new Object();
        for (let parentCol in parent.columnsObject) {
            for (let childCol in child.columnsObject) {
                if (parent.columnsObject[parentCol].name == child.columnsObject[childCol].name) { // if the columns match...
                    saveObject[parent.columnsObject[parentCol].name] = child.fields[childCol].getVal();
                    parent.fields[parentCol].restoreCell(child.fields[childCol].getVal());
                    console.log(parent.fields[parentCol])
                    console.log(child.fields[childCol].getVal())
                }
            }
        }
        if (save) parent.saveRow.bind(parent)(null, saveObject, undefined); // save the row to the server and does nothing on return
    }
    if (save) btn.onclick = saveFunc;
    else saveFunc();
}