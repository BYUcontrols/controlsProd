/* This class is meant to represent a cell in the rowEngine
 * It assigns a sortVal(), getVal(), edit(), and restoreCell() based on the data type
 * for the column. It's inputs are...
 *  1. columnsDataObject - object generated by initialize.js/generateColumnsObject
 *  2. colNum - int - an integer representing the column number
 * 
 */
class cellEngine {
    constructor(columnsDataObject, colNum) {
            // save the columnsDataObject so we can access it everywhere
        this.columnsDataObject = columnsDataObject;
            // save the values from the columnsDataObject to this class
        this.type = this.columnsDataObject.type;
        this.nullable = this.columnsDataObject.nullable;
        this.colName = this.columnsDataObject.name;
        this.colNum = colNum;
        this.editing = false;
        this.maxChar = this.columnsDataObject.maxChar;
        this.uneditable = this.columnsDataObject.uneditable;
            // assign the sortVal, getVal, edit and restoreCell functions based on the type of column
        this.assignMembersForType(this.columnsDataObject);
    }
        // assigns the appropriate edit, getVal, etc. functions for the type of the cell
    assignMembersForType(columnDataObject) {
        // for the data type of the column assign an appropriate sortVal, getVal, edit, etc. function
        if (columnDataObject.type == 'linked') {

            this.sortVal = this.sortVal_linked;
            this.getVal = this.getVal_linked;
            this.edit = this.edit_linked;
            this.restoreCell = this.restoreCell_linked;
            this.linkTable = columnDataObject.linkTable;
            this.linkObject = columnDataObject.linkObject;
            this.linkColumnReplacement = columnDataObject.columnReplacement;

        } else if (columnDataObject.type == 'bit') {

            this.sortVal = this.getVal_bit;
            this.getVal = this.getVal_bit;
            this.edit = this.edit_bit;
            this.restoreCell = this.restoreCell_bit;

        } else if (columnDataObject.type == 'int') {

            this.sortVal = this.getVal_int;
            this.getVal = this.getVal_int;
            this.edit = this.edit_int;
            this.restoreCell = this.restoreCell_int;

        } else if (columnDataObject.type == 'datetime') {

            this.sortVal = this.sortVal_datetime;
            this.getVal = this.getVal_datetime;
            this.edit = this.edit_datetime;
            this.restoreCell = this.restoreCell_datetime;

        } else if (columnDataObject.type == 'date') {

            this.sortVal = this.sortVal_date;
            this.getVal = this.getVal_date;
            this.edit = this.edit_date;
            this.restoreCell = this.restoreCell_date;

        } else if (columnDataObject.type == 'decimal') {

            this.sortVal = this.sortVal_decimal;
            this.getVal = this.getVal_decimal;
            this.edit = this.edit_decimal;
            this.restoreCell = this.restoreCell_decimal;

        } else if (columnDataObject.type == 'linkedHybrid') {

            this.sortVal = this.sortVal_linkedHybrid;
            this.getVal = this.getVal_linkedHybrid;
            this.edit = this.edit_linkedHybrid;
            this.restoreCell = this.restoreCell_linkedHybrid;
            this.linkTable = columnDataObject.linkTable;
            this.linkObject = columnDataObject.linkObject;
            this.linkColumnReplacement = columnDataObject.columnReplacement;

        } else { // assuming the default 'varchar'

            this.sortVal = this.getVal_varchar;
            this.getVal = this.getVal_varchar;
            this.edit = this.edit_varchar;
            this.restoreCell = this.restoreCell_varchar;

        }
    }

    /************************* Follows are getVal, edit, restoreCell, and sortVal functions for each data type ***********************/

    /**** Function group that gets the value of a cell 
     * given:
     * * cell - an object from the this.field array representing the cell to be acted upon
     * * pair - a boolean that requests the data as a tuple eg 'columnName':'colValue ****/

     getVal_varchar(pair=false) {
        if (this.editing) var val = this.inputRef.value;
        // else set it as the text content of htmlref (or null if there is no htmlref)
        else var val = this.htmlRef ? (this.htmlRef.textContent) : ('None');

        if (pair) {
            let data = new Object();
            data[this.colName] = cleanOutput(val);
            return data;
        } else return cleanOutput(val); 
    }

    getVal_linked(pair=false) {
        if (this.editing) var val = this.inputRef.value;
        else var val = this.linkedIndex ? this.linkedIndex : 'None';

        if (!val) var val = null;
    
        if (pair) {
            let data = new Object();
            data[this.colName] = cleanOutput(val);
            return data;
        } else return cleanOutput(val);
    }

    getVal_bit(pair=false) {
        if (this.editing) var val = this.inputRef.value;
        else var val = this.boolValue ? this.boolValue : 'None';

        if (pair) {
            let data = new Object();
            data[this.colName] = cleanOutput(val);
            return data;
        } else return cleanOutput(val);
    }

    getVal_int(pair=false) {
        if (this.editing) var val = this.inputRef.value;
        else var val = this.htmlRef ? this.htmlRef.textContent : 'None';

        if (pair) {
            let data = new Object();
            data[this.colName] = cleanOutput(val);
            return data;
        } else return cleanOutput(val);
    }

    getVal_decimal(pair=false) {
        if (this.editing) var val = this.inputRef.value;
        else var val = this.htmlRef ? this.htmlRef.textContent : 'None';

        if (pair) {
            let data = new Object();
            data[this.colName] = cleanOutput(val);
            return data;
        } else return cleanOutput(val);
    }

    getVal_datetime(pair=false) {
        if (this.editing) var val = this.inputRef.value;
        else var val = this.htmlRef ? this.htmlRef.textContent : 'None';
            // clean the string
            
        let dateEngine = new dateTimeVoodoo(val);
        if (pair) {
            let data = new Object();
            data[this.colName] = cleanOutput(dateEngine.forComputers());
            return data;
        } else return cleanOutput(dateEngine.forComputers());
    }

    getVal_date(pair=false) {
        if (this.editing) var val = this.inputRef.value;
        else var val = this.htmlRef ? this.htmlRef.textContent : 'None';
            // clean the string
            
        let dateEngine = new dateTimeVoodoo(val);
        if (pair) {
            let data = new Object();
            data[this.colName] = cleanOutput(dateEngine.dateOnly());
            return data;
        } else return cleanOutput(dateEngine.dateOnly());
    }

    getVal_linkedHybrid(pair=false) {
            // create a place to store the data
        let outArray = null;
            // if we are editing the cell...
        if (this.editing) {
            // create an array to store the data
            outArray = new Array()
            // loop through the inputArray and add the checked boxes to the array 
            for (checkbox of this.inputArray) {
                if (checkbox.checked){
                    outArray.push(checkbox.idNumber);
                }
            }
        }

        // else if there is already a this.currentCheckedOptions
        else if (this.currentCheckedOptions) outArray = this.currentCheckedOptions;
        // else if there is no this.currentCheckedOptions (we are loading it for the first time)
        else outArray = JSON.parse(this.htmlRef.textContent);

        // jasonify the outArray so that it can be sent back to the server
        let val = JSON.stringify(outArray);

        if (pair) {
            let data = new Object();
            data[this.colName] = val;
            return data;
        } else return val;
    }

    /**** Function group that takes a cell and makes it editable
     * with an optional value argument ****/
    
    edit_varchar(val=this.getVal()) {
        if (!this.editing && !this.uneditable) {
            this.editing = true;
            this.htmlRef.innerHTML = '';

            let input = createTextArea(val, this.maxChar, this.nullable);

            this.inputRef = input;
            this.htmlRef.appendChild(input);     
        }
    }

    // this one's a little special:
    //  when editing a linked cell we want the ability to
    //  click on a button that takes us to the linked table
    //  and let's us select a row there and be taken back
    //  to this cell with row we selected selected. We go 
    //  in depth into this process in the js documentation.
    edit_linked(val=this.getVal(), tableButton=true) {
        if (!this.uneditable) {
            this.editing = true;
            if (this.htmlRef) this.htmlRef.innerHTML = '';

            this.inputRef = createDropdown(this.linkObject, val);
            this.htmlRef.appendChild(this.inputRef);
            // create the ***** Table button next to the input field when tableButton is true
            if (tableButton) {
                    // define the this context as a variable that we ay we can access it many levels deep into
                    // the following little rabbit hole of nested functions
                let cellContext = this 
                    // create a button to redirect to another table. See the JS-documentation file
                let link = createButton(`${cellContext.linkTable} Table`, 
                        // this function will be called when the '****** Table' button is pressed
                    function() { 
                            // calling the redirect handler takes us to a new page with the linked table
                        redirectHandler(cellContext.linkTable, 
                                // this function is passed to the redirect handler and will be called 
                                // when the 'Selected' button on the new page is pressed
                            function(id) {
                                    // try to set the new id as the value of the dropdown
                                    // if the id doesn't exist in the dropdown (ie we created a new row in the child table)
                                    // then the statement will totally check out and run fine but...
                                console.log(cellContext);
                                cellContext.inputRef.value = id;
                                    // if it didn't exist then the page will rewrite this.inputRef.value to a blank string.
                                    // that tells us that we don't have the new value in this page and we need to 
                                    // ask the server for the updated value for the id
                                if (cellContext.inputRef.value !== id) {
                                    // send the request to the server
                                    post(null, 'GET', `/updateLinkedObject/${cellContext.linkColumnReplacement}/${cellContext.linkTable}/${id}`,
                                        function() {
                                            // this runs on a successful return of the request from the server
                                            // create a new option with the id received from the child page and the text from the server
                                            let newOption = document.createElement('option');
                                            newOption.value = id;
                                            newOption.textContent = this.responseText;
                                            // add the option to the select
                                            cellContext.inputRef.add(newOption);
                                            // set the select's id as the new id
                                            cellContext.inputRef.value = id;
                                            // add the new value to the linked object for the cell
                                            // javascript is nice and editing this will automatically update this object everywhere else
                                            cellContext.linkObject[id] = this.responseText;
                                            // next we need to reset the new item menu (it's dropdown menus will not contain the new data)
                                            // by looping through the cells in the row and calling the edit() method on them
                                            for (let cell of window.inputEngine.fields) {
                                                cell.edit(); // re running the edit function will update the select to reflect the new added linked
                                                // element
                                            }
                                        }
                                    );
                                } 
                            }, 
                            cellContext.id);
                    }, `Go to the ${cellContext.linkTable} table to 'Select' a row and be redirected right back here`);
                this.htmlRef.appendChild(link);
                link.classList.add('linkedTableBtn');
            }
        }
    }

    edit_bit(val=this.getVal()) {
        if (!this.editing && !this.uneditable) {
            this.editing = true;
            this.htmlRef.innerHTML = '';

            this.inputRef = createBool(val);
            this.htmlRef.appendChild(this.inputRef);
        }
    }

    edit_int(val=this.getVal()) {
        if (!this.editing && !this.uneditable) {
            this.editing = true;
            this.htmlRef.innerHTML = '';

            let input = createIntegerInput(val)
        
            this.inputRef = input;
            this.htmlRef.appendChild(input);     
        }
    }

    edit_decimal(val=this.getVal()) {
        if (!this.editing && !this.uneditable) {
            this.editing = true;
            this.htmlRef.innerHTML = '';

            let input = createDecimalInput(val)
        
            this.inputRef = input;
            this.htmlRef.appendChild(input);     
        }
    }

    edit_datetime(val=this.getVal()) {
        if (!this.editing && !this.uneditable) {
            this.editing = true;
            this.htmlRef.innerHTML = '';
            let input = createDatetimeInput(val);

            this.inputRef = input;
            this.htmlRef.appendChild(input);     
        }
    }

    edit_date(val=this.getVal()) {
        if (!this.editing && !this.uneditable) {
            this.editing = true;
            this.htmlRef.innerHTML = '';
            let input = createDateInput(val);

            this.inputRef = input;
            this.htmlRef.appendChild(input);     
        }
    }

    edit_linkedHybrid(val=this.getVal()) {
        if (!this.editing && !this.uneditable) {
            this.editing = true;
            this.htmlRef.innerHTML = '';

            let input = createCheckboxInput(this.linkObject, JSON.parse(val))
        
            this.inputRef = input.node;
            this.htmlRef.appendChild(input.node);
            this.inputArray = input.array;     
        }
    }

    /**** Function group that restores cell of multiple types to 
     * an non-editing state, i.e. plain text; with an optional value field ****/

    restoreCell_varchar(val=this.getVal()) {
        this.htmlRef.innerHTML = '';
        if (val) this.htmlRef.textContent = val;
        else this.htmlRef.textContent = 'None';
        this.editing = false;
    }

    restoreCell_linked(val=this.getVal()) {
        this.htmlRef.innerHTML = '';
        if (val && val != 'None') {
            this.htmlRef.appendChild(createInspectIcon(val, this.linkTable));
            this.linkedIndex = val;
            this.linkedText = this.linkObject[val]
            this.htmlRef.appendChild(document.createTextNode(this.linkObject[val]));
            this.htmlRef.title = `ID Number: ${this.linkedIndex}`;
        } else {
            this.htmlRef.appendChild(document.createTextNode('None'));
            this.linkedIndex = null;
            this.linkedText = null;
        }
        this.editing = false;
    }

    restoreCell_bit(val=this.getVal()) {
        this.htmlRef.innerHTML = '';
        this.boolValue = val;
        this.htmlRef.textContent = val;
        this.editing = false;
    }

    restoreCell_int(val=this.getVal()) {
        this.htmlRef.innerHTML = '';
        this.htmlRef.textContent = val;
        this.editing = false;
    }

    restoreCell_decimal(val=this.getVal()) {
        this.htmlRef.innerHTML = '';
        this.htmlRef.textContent = val;
        this.editing = false;
    }

    restoreCell_datetime(val=this.getVal()) {
        this.htmlRef.innerHTML = '';
        
        // if the val was a valid date string...
        if (!isNaN(Date.parse(val))) { 
            let dateEngine = new dateTimeVoodoo(val);
            this.htmlRef.textContent = dateEngine.forHumans();
        } 
        else this.htmlRef.textContent = val;

        this.editing = false;
    }

    restoreCell_date(val=this.getVal()) {
        this.htmlRef.innerHTML = '';
        // if the val was a valid date string...
        if (!isNaN(Date.parse(val))) { 
            let dateEngine = new dateTimeVoodoo(val);
            this.htmlRef.textContent = dateEngine.dateOnly();
        }
        else this.htmlRef.textContent = val;
        this.editing = false;
    }

    restoreCell_linkedHybrid(val=this.getVal()) {
        this.htmlRef.innerHTML = '';
        // parse the val
        val = JSON.parse(val);

        // save the val so that we can retrieve it without parsing the text we are about to generate
        this.currentCheckedOptions = val;

        // loop through the val array and find the associated names and append them
        for (let role of val) {
            this.htmlRef.textContent += `${this.linkObject[role]}, `;
        }

        // remove the last comma from the textContent
        this.htmlRef.textContent = this.htmlRef.textContent.slice(0, -2);

        this.editing = false;
    }

    /**** Function group that returns a string to be sorted by 
     * for the data types where it's getVal is not the text we should sort by ( linked ) 
     * Importantly it sorts fields being edited by their previous, unedited values,
     * NOT their current text values; that way rows don't jump around while being edited****/

    sortVal_linked(cell) {
        if (this.editing) var val = this.linkObject[this.backupVal];
        else var val = this.linkedText;
    
        return cleanOutput(val);
    }

    sortVal_datetime(pair=false) {
        if (this.editing) var val = this.backupVal;
        else var val = this.htmlRef.textContent;

        if (cleanOutput(val)) {
            let voodoo = new dateTimeVoodoo(val);
            return voodoo.engine.getTime();
        }
        else return '0';
    }

    sortVal_varchar(cell) {
        if (this.editing) var val = this.backupVal;
        else var val = this.htmlRef.textContent;

        return cleanOutput(val); 
    }

    sortVal_bit(cell) {
        if (this.editing) var val = !this.backupVal;
        else var val = !this.boolValue;

        return cleanOutput(val);
    }

    sortVal_int(cell) {
        if (this.editing) var val = this.backupVal;
        else var val = this.htmlRef.textContent;

        return cleanOutput(val);
    }

    sortVal_decimal(cell) {
        if (this.editing) var val = this.backupVal;
        else var val = this.htmlRef.textContent;

        return cleanOutput(val);
    }

    sortVal_date(cell) {
        if (this.editing) var val = this.backupVal;
        else var val = this.htmlRef.textContent;

        if (cleanOutput(val)) {
            let voodoo = new dateTimeVoodoo(val);
            return voodoo.engine.getTime();
        }
        else return 0;
    }

    sortVal_linkedHybrid(cell) {
        if (this.editing) var val = this.backupVal;
        else var val = this.htmlRef.textContent;

        return cleanOutput(val); 
    }
}