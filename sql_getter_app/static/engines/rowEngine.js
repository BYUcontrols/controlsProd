
/* a class to represent a row and perform all the necessary functions on that row
 * references to the class are stored in a global array and the 'edit', etc. buttons
 * 
 * The reason this exists is simple, there are more then a few different types of data that a
 * row can contain (text, linked, integer, date, etc.) and a lot of different parts of the site
 * need to be able to access the rows with their many data types. This class makes it so that we
 * don't have to worry about datatypes when accessing the row because this class acts as an
 * intermediary between the row and the rest of the site that figures everything out.
 */
class rowEngine {
    /* constructor for the class - it sets up the format of the table being loaded using the inputs
     *
     * Inputs: 
     *  1. columnsObject - object - generated by the generateColumnsObject() function
     *  2. table - string - the table name
     *  3. permissions - object - an object containing the permissions of the user for this table
     *  4. hasLinkedChildren - boolean - true if we want the row to have a 'linked' button
     *  5. isNativeRow - boolean - true if this row is part of the original table ( not an audit or quickLook, etc.)
     * 
     * return null
     */ 
    constructor(columnsObject, table, permissions, hasLinkedChildren, isNativeRow=false) {
            // set the airplaneMode variable (don't send any data to the server) 
            // It's used in service requests (and wherever else) to not save data that depends on rows that are not created yet
        this.airplaneMode = false;
            // used in conjunction with airplaneMode so that we can delete things that never existed then not spawn them into existence
        this.isDeleted = false;
            // used when saving a row that was in airplaneMode set to true If the table was modified
        this.wasModified = false;
            // used when un-deleting a row to indicate in airplane mode that we have been undeleted
        this.wasUnDeleted = false;
            // create a place for engines in airplaneMode can be placed to be saved when their parents are saved
        this.enginesToSave = new Array();
            // create the showDeleted boolean
        this.showDeleted = false;
            // save the passed values to the class
        this.tableName = table;
        this.columnsObject = columnsObject;
        this.isNativeRow = isNativeRow;
        this.permissions = permissions;
        this.hasLinkedChildren = hasLinkedChildren;
            // create a place to store all the cellEngines
        this.fields = new Array();
            // for every column...
        for (let column in this.columnsObject) {
                // put a new cellEngine representing that column in the fields array
            this.fields[column] = new cellEngine(this.columnsObject[column], column);
        } // the this.fields array should match the columnsObject
    }

    /* generate the Input New page for a table
     *
     * Input: HTML div element - the place to put the fields into
     * returns null
     */
    generateInputFields(location) {
        if (this.permissions.canAdd) {
            this.id = 'new';
            this.editing = true;
                // check to see if there is a saved set of data for the new row
            if (isStorageItem('newProgress')) var editingObject = JSON.parse(getStorageItem('newProgress'));            
                // create a place to store the created fields
            let inputDivCollection = new Array();
            for (let column in this.columnsObject) {
                if (!this.fields[column].uneditable) {
                    let innerArray = new Array();
                    
                        // get the current values from the storage
                    let current = (editingObject ? editingObject[this.fields[column].colName] : null);
                        // Creates the input field
                    this.fields[column]['htmlRef'] = document.createElement('div');
                    this.fields[column].htmlRef.classList = "inputDiv";
                    this.fields[column]['id'] = this.id; // because the helper functions were declared before the id was we need to pass it to them
                    this.fields[column].edit(current);
                        // Creates a label for that input field
                    let label = document.createElement("label");
                    label.appendChild(document.createTextNode(this.columnsObject[column].readableName + ": "));
                    // sets tooltips for label
                    let currentColumn = this.columnsObject[column];
                    if (currentColumn.type != 'linked') setTooltip(label, `${this.tableName}.${currentColumn.name}\nType: ${currentColumn.type}\nMaxCharacters: ${currentColumn.maxChar}\nNullable: ${currentColumn.nullable}`);
                    else setTooltip(label, `${currentColumn.linkTable}.${currentColumn.name}\nType:linked\nNullable:${currentColumn.nullable}`);
                    // Append the label and field to the div and the div to it's spot
                    innerArray[0] = label;
                    innerArray[1] = this.fields[column].htmlRef;
                    inputDivCollection.push(innerArray);
                }
            }
            placeInBeautifulRows(inputDivCollection, location);
                // generate save button
            let button = generateByuButton('Save',
                function() { // function that runs on click of save button
                    this.saveRow(null, null, 
                        function() { // on request return successful function
                            this.editing=false; 
                                // remove saved values in localStorage
                            removeStorageItem('newProgress');
                            window.location.reload() // reload the page so that the new row can take it's place
                        }.bind(this)
                    ); 
                }.bind(this)
            );
                // the save button style
            setTooltip(button, 'Save this new row to the database')
            button.style.columnSpan = 'all';
            button.style.display = 'grid';
            button.style.marginTop = '15px';
            button.style.marginBottom = '30px';
            location.appendChild(button);
        }
    }
    
    /* load the row from a html <tr> element
     * 
     * Inputs:
     *  1. HTML row element - for the row being represented
     *  2. boolean -  true if the row is a clone
     *  3. rowEngine - the row being cloned
     *  4. boolean - true if the edit/save/audit buttons are to be included
     * 
     *  returns null
     */
    
    loadRow(rowElement, clone=false, cloneRowEngine=null, dynamic=true) {
            // save important things to the rowEngine
        this.rowRef = rowElement;
            // row id should come through under the 'data-id' attribute of the row
        this.id = this.rowRef.getAttribute('data-id');
            // get the cells of the row
        let cells = this.rowRef.cells;
        this.editing = false;

            // check to see if this row has a saved progress value and save that data in the editingObject
            // and checks to see if this is part of the main table (not in an audit table etc) by checking if 
            // this.urlParams exists (check the constructor for more info)
        if (this.isNativeRow && isStorageItem(this.id+'RowProgress')) {
            var editingObject = JSON.parse(getStorageItem(this.id+'RowProgress'));
            removeStorageItem(this.id+'RowProgress');
        }
            // loop through the columns
        for (let column in this.columnsObject) {
                // this.fields is an array with data for each cell
            this.fields[column]['htmlRef'] = cells[column];

            this.fields[column]['id'] = this.id; // because the helper functions were declared before the id was so we need to pass it to them here

            if (!clone) this.fields[column].restoreCell(this.fields[column].htmlRef.textContent); // restores from text if not a clone
            else this.fields[column].restoreCell(cloneRowEngine.fields[column].getVal()); // restores text from original if clone
        }

        // fill this.buttonCell with an HTML element for the cell where the buttons go

        if (dynamic) { // for when we want to do things with the row
            // if we are redirected from another page create a 'Select' button
            if (window.displaySelectButton == true && this.isNativeRow) {
                let tempId = this.id;
                this.selectBtn = createButton('Select', function() { nextPage(tempId, false) }, 'Click here to select this row and be redirected back to the table you were at before');
                this.buttonCell.appendChild(this.selectBtn);
                this.selectBtn.classList.add('selectButton');
            }
                // create the options
            // this.buttonCell.append(this.createOptionsButtons())
                // if the row was being edited then start editing it (with the saved values)
            if (editingObject) this.editRow(null, editingObject);
        }

        this.updateDeletedVisibility()
    }

    /* This function creates the html for the edit, save, undo, delete, audit, and linked buttons and returns them in an html container */
    createOptionsButtons(emptyOption=false) {

        // create a div to store our options menu
        let optionDiv = document.createElement('div');
        optionDiv.classList.add('optionDiv');
        
        // MASON: makes sure the options button doesn't show up on SR table
        if (primaryKey != 'serviceRequestId') {
                // create an options button
            let optionsBtn = createButton('Options', null);
            optionsBtn.classList.add('optionsBtn');
            optionDiv.append(optionsBtn);
        } /*else { // ELI: This is to allow us to create a row of checkboxes for the merge functionality.
            let checkBox = createCheckbox('checkBox' , false); // This doesn't work unless you have p5.js
            checkBox.classList.add('checkBox');
            optionDiv.append(checkBox);
        }*/

            // create a div to put all the buttons in
        let optionContainer = document.createElement('div');
        optionContainer.classList.add('optionContainer');
        optionDiv.append(optionContainer);

         if (!emptyOption) {
                // create the buttons
            this.editBtn = createButton('Edit', this.editRow.bind(this), 'Edit this row');
            this.saveBtn = createButton('Save', this.saveRow.bind(this), 'Save the edited values to the database');
            this.undoBtn = createButton('Undo', this.undoRow.bind(this), 'Undo a save, or stop editing and restore to what it was before');
            this.deleteBtn = createButton('Delete', this.deleteRow.bind(this), 'Delete a row');
            this.auditBtn = createButton('Audit', auditTable.bind(this), 'View a list of changes made to this row');
            this.viewLinkedBtn = createButton('Linked', viewLinked.bind(this), 'Find all the places this row is referenced');

                // place the buttons if the permissions objects says it's allowed
            if (this.permissions.canEdit) optionContainer.appendChild(this.editBtn);
            if (this.permissions.canEdit) optionContainer.appendChild(this.saveBtn);
            if (this.permissions.canEdit) optionContainer.appendChild(this.undoBtn);
            if (this.permissions.canDelete || this.permissions.canUndelete) optionContainer.appendChild(this.deleteBtn);
                // audit is a bit different, if the row is in airplane mode and it's id is new then it hasn't been created yet and
                // so does not have an audit table. so if both this.airplaneMode is true and this.id is not a number then we don't
                // want to create an audit button.
            if (this.permissions.canAudit && (!this.airplaneMode || !isNaN(this.id))) optionContainer.appendChild(this.auditBtn);
                // ditto with the lined button
            if (this.hasLinkedChildren && (!this.airplaneMode || !isNaN(this.id))) optionContainer.appendChild(this.viewLinkedBtn);
            
                // greys out buttons (you can't save until first clicking 'Edit')
            this.saveBtn.disabled = true;
            this.undoBtn.disabled = true;

                // return the container div for the options
            return optionDiv;
        } else {
                // If we don't want to put any buttons in, just return an empty container and parent div
            return {container:optionContainer, parent:optionDiv}
        }
    }

    /* 
     * Edit a row
     * Inputs:
     *  1. nothing - because it is called by a button and the browser passes some unwanted data as the first argument
     *  2. Object - an optional object to fill the cells with (generated by this.getValues())
     * 
     * return null
     */ 
    editRow(nada=null, object = undefined) {
        // get the y coordinate from the top of the viewport of the row.
        // so that if the view jumps around the user doesn't get lost
        let currentRowYPosition = this.rowRef.getBoundingClientRect().y;

        this.rowRef.classList.add('editable'); // visual change
            // grey out appropriate buttons
        this.saveBtn.disabled = false;
        this.undoBtn.disabled = false;
        this.editBtn.disabled = true;
            // create a place to store the current values
        this.backupObj = new Object()
            // loops through the columns
        for (let field in this.fields) {
                // get the values for that field
            let cell = this.fields[field];
            let current = cell.getVal(true);

            // only edit editable columns
            if (!cell.uneditable) {
                    // save the values in this.backupObj
                Object.assign(this.backupObj, current);
                    // save the value of the cell in the cell
                cell['backupVal'] = current[cell.colName];
                // make the cell editable (and filling the input field with the provided object data if an object is provided)
                //object[cell.colName] is the value that you are editing to

                cell.edit((object ? object[cell.colName] : undefined));
            }
        }
        this.editing = true;
            // make the row scroll to where it was before (so we don't loose it if thing resize)
        window.scrollBy(0, this.rowRef.getBoundingClientRect().y - currentRowYPosition);
    }

    /* 
     * return an Object full of the data in the row: {column:value, column:value}
     */ 
    getValues() {
            // create an object to store the data in
        let dataObj = new Object();
            // loop through the fields
        for (let field of this.fields) {
                // if the field is editable
            if (!field.uneditable) {
                Object.assign(dataObj, field.getVal(true));
            }
        }
        return dataObj;
    }

    /* Save a row
     * Inputs:
     *  1. nothing - because it is called by a button and the browser passes some unwanted data as the first argument
     *  2. Object - an optional object to fill the cells with (generated by this.getValues())
     *  3. function - a function to run on a successful message form the server
     * 
     * return the object sent to the server
     */ 
    saveRow(nada='nada', object = undefined, next = this.onSaveReturn.bind(this)) { // the browser passes the buttons html ref object as the first parameter, so anything passed to it must be second arg

        let dataObj = new Object();
            // get the data for the row, from the provided object, or using this.getValues
        if (object) Object.assign(dataObj, object);
        else Object.assign(dataObj, this.getValues());
            // put info about the row (id, table) in the dataObj
        let saveObj = new Object();
        let idObj = Object();
        idObj['id'] = this.id;
        idObj['table'] = this.tableName;
        saveObj['info'] = idObj;
        saveObj['data'] = dataObj;

        console.log(saveObj);
        if (!this.airplaneMode) {
            // check for empty values that the database won't like before proceeding
            //  and if there are no erroneously empty columns then send the request using the post() function
            if (checkEmptyValues(saveObj, this.columnsObject)) {
                let request = post(saveObj, 'POST', '/update', next)
            }
            return object;
        }
        else {
            if (checkEmptyValues(saveObj, this.columnsObject)) {
                next(); // execute the onSaveReturn function
                console.log('A row has been saved in airplaneMode');
                this.wasModified = true; // indicates that the row has been edited in airplane mode (needs saving)
            }
        }
    }

    /* Finish the save - default function that runs after this.saveRow executes successfully
     * Input: Object - an optional object to fill the cells with (generated by this.getValues())
     * 
     * return null
     */ 
    onSaveReturn(object = undefined) {
            // do button things
        if (this.saveBtn) this.saveBtn.disabled = true;
        if (this.undoBtn) this.undoBtn.disabled = false;
        if (this.editBtn) this.editBtn.disabled = false;
            // remove the editing style and attribute
        this.editing = false;
        if (this.rowRef) this.rowRef.classList.remove('editable'); 
            // remove the edit cookie
        removeStorageItem(this.id + 'RowProgress');
            // restore the cells to their unedited state
        for (let cell of this.fields) {
                // if an object was provided then restore with those values
            if (object) cell.restoreCell(object[cell.colName]);
            else cell.restoreCell();
        }
    }

    /* Undo a row. There are two states we can undo from:
     *     - row is being edited: just use the this.backupObj to get the pre editing values
     *     - done being edited: still use the this.backupObj but send those values to the server as well. 
     * 
     * return null
     */ 
    undoRow() {
        if (!this.editing && !this.airplaneMode) { // if we aren't editing and not in airplaneMode
            if (confirm("Are you sure you want to undo the changes previously made to this row? (This action cannot be undone)")) { 
                    // save the row using the backup object (turning back time) and pass onSaveReturn the backup object as well
                this.saveRow('nada', this.backupObj, function () { this.onSaveReturn(this.backupObj) }.bind(this));
            }
        }
        else this.onSaveReturn(this.backupObj);
        // disable the undo button
        this.undoBtn.disabled = true;
    }

    /* Delete a row
     * 
     * return null
     */ 
    deleteRow() {
        // MASON: I added this if / confirm combo to get the test case in rowEngineTesting.js to pass
        if (confirm('Are you sure you want to delete this row?')){
            if (!this.airplaneMode) { // don't send anything to the server if we are in airplaneMode
                // construct an object with the data to be sent to the server
                let delObj = new Object();
                delObj['table'] = this.tableName;
                delObj['id'] = this.id;
                
                console.log('DELETING');
                console.log(delObj);
                    // send the request and run this.finishDelete() when the request comes back successful
                post(delObj, 'DELETE', '/delete', this.finishDelete.bind(this));  
            } 
            else {
                this.isDeleted = true; // isDeleted is checked by this.saveRow() and if true it doesn't save it (treats )
                this.wasModified = true; // indicates that the row has been edited in airplane mode (needs saving)
                this.finishDelete(); // to clear the row out
            }
        }
    }

    /* When the delete request comes back successful - erase the row
     * Input: null - post() passes the request data to the on return function it calls so we need a place for that to go
     * 
     * return null
     */ 
    finishDelete(nada = undefined) {
        console.log('Deleted row');
        console.log(this);
            // remove the html row
        this.rowRef.classList.add('deletedRow')
        // MASON: the line below is what I added in order to get the test case in rowEngineTesting.js to work
        this.rowRef.innerHTML = '';
            // update the deleted status
        this.isDeleted = true;
        this.wasUnDeleted = false;
        this.updateDeletedVisibility();
            // clear any saved data associated with this row
        removeStorageItem(this.id + 'RowProgress'); // remove the edit cookie (if it exists)
    }

    /* Un Delete a row
     * 
     * return null
     */ 
    unDeleteRow() {
        if (!this.airplaneMode) { // don't send any requests to the server if we don't want to 
        // (there is currently no reason or way to unDelete a deleted row in airplane mode but just in case)

                // construct an object with the data to be sent to the server
            console.log('WE MADE IT TO THE ENGINE')
            let delObj = new Object();
            delObj['table'] = this.tableName;
            delObj['id'] = this.id;
            
            console.log('UN DELETING');
            console.log(delObj);
                // send the request and reload the page when (if) the request comes back successful
            post(delObj, 'DELETE', '/restoreDelete', this.onUnDelete.bind(this));  
        } else {
            // just in case y'all decide to use this use case 
            this.onUnDelete()
        }
    }

    /* A function that runs on successful completion of an unDeleteRow request */
    onUnDelete() {
        this.wasModified = true; // indicates that the row has been edited in airplane mode (needs saving)
        this.isDeleted = false; // indicate to unDelete the row
        this.wasUnDeleted = true;

        this.rowRef.classList.remove('deletedRow');
        this.updateDeletedVisibility();
    }

    /* This member is called when we want to update the deleted visibility for the row 
    */
    updateDeletedVisibility() {
            // check if the column is deleted and we are not showing deleted
        if (this.isDeleted && this.showDeleted) {
            this.rowRef.style.display = 'revert';
        } else if (this.isDeleted && !this.showDeleted) {
            this.rowRef.style.display = 'none';
        } else if (!this.isDeleted) {
            this.rowRef.style.display = 'revert';
        }
            // set the functionality of the delete button (undelete or not)
        if (this.isDeleted && this.deleteBtn) {
            
            this.deleteBtn.textContent = 'Undo Delete'; // change the text
            this.deleteBtn.title = 'UnDelete this deleted row' 
            this.deleteBtn.onclick = this.unDeleteRow.bind(this); // define a function for the button
                // if the user can undelete the row...
            if (this.permissions.canUndelete) {
                this.deleteBtn.disabled = false; // un hide the button
            } else {
                this.deleteBtn.disabled = true; // else hide the button
            }
        }
        else if (!this.isDeleted && this.deleteBtn) {
            this.deleteBtn.textContent = 'Delete';
            this.deleteBtn.title = 'Delete a row'
            this.deleteBtn.onclick = this.deleteRow.bind(this);
                // if the user has permission to delete the row...
            if (this.permissions.canDelete) {
                this.deleteBtn.disabled = false; // un hide the button
            } else {
                this.deleteBtn.disabled = true; // else hide the button
            }
        }
    }

    // This member is similar to undoRow() and prepares a row for printing
    // It restores all variables to their saved state
    // it returns true if the row is ready and false if the row has unsaved changes
    prepareForPrint(force=false) {
        if (this.editing && !force) { // if the row is being edited and we don't want to force it then see if it has been changed
            let wasEdited = false // set up an indicator boolean
            console.log(this.fields)
            for (let cell of this.fields) { // loop through the cells in the row
                if (cell.getVal() != cell.backupVal) wasEdited = true; // if the current value dose not equal the backup value then flag wasEdited
            }
            
            if (wasEdited) return false
            else { // if we were not edited then restore the cell from being edited and return true
                this.onSaveReturn(this.backupObj);
                return true;
            }
        }
        else if (this.editing && force) { // if we are editing and we do want to force it then restore the row to its backup and return true
            this.onSaveReturn(this.backupObj);
            return true
        }
         
        else return true // if we are not editing ten the row is ready to print and we just return true
    }
}