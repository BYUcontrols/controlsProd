/*  
    Functions for creating input fields and saving them

           Written by: 
      Isaac Cutler 12/1/2020
    Property of the BYU A/C Shop
*/

/* generate the input fields and + item button
 * 
 */
function generateInput() {
    if (permissionsObject.canAdd) {
        showTable();
            // create a new rowEngine for the input new
        window.inputEngine = new rowEngine(columnsInfo, tableName, permissionsObject, linkedChildrenExist, true);
            // create the input fields
        window.inputEngine.generateInputFields(document.getElementById('inputNew'));
    }
}

// Delete later
// Function that hides the table div, reveals the inputNew div and calls the new item function
function hideTable() {
    //     // Hide table
    // table = document.getElementById("displayTable");
    // table.hidden = true
    //     // Show input new
    // input = document.getElementById("inputNew");
    // input.hidden = false
    //     // switch the + Item button to a Table button
    // let newBtn = document.getElementById("viewSwitchButton")
    // setTooltip(newBtn, 'Go back to the table');
    // newBtn.innerHTML = "Table";
    // newBtn.setAttribute("onClick", "showTable()");
}

// Delete later
// The sister function to hideTable, does the reverse.
function showTable() {
        // Show Table
    // table = document.getElementById("displayTable");
    // table.hidden = false;
    //     // Hide input new
    // input = document.getElementById("inputNew");
    // input.hidden = true;
    //     // switch the + Item button to a Table button
    // let newBtn = document.getElementById("viewSwitchButton")
    // setTooltip(newBtn, 'Create a new row');
    // newBtn.innerHTML = "+ Item";
    // newBtn.setAttribute("onClick", "hideTable()");
}


// Check for empty fields, prompts the user, and fills the empty fields with 'None'
function checkEmptyValues(save, columnsObject) {
    console.log(save);
    console.log(columnsObject);
    let promptText = "The following fields cannot be left blank: "
    let promptUser = false;
        // loops through the values of the save object passed 
    for (field in save.data) {
            // if the value for the column is blank
        if (save.data[field] == "" || save.data[field] == null) {
            console.log(field)
                // find the columnData number given the field (columnName). It searches through the passed columnsObject
            let columnData = null;
            for (column of columnsObject) {
                if (column.name == field) {
                    columnData = column;
                }
            }
                // if the column exists and the column cannot be null then...
            if (columnData && !columnData.nullable) {
                    // add the column name to the propmt text
                promptText += "'" + field + "' ";
                promptUser = true;
            }
            
        }
    }

    if (promptUser) {
        alert(promptText);
        return false;
    } else {
        return true;
    }
}

/* The function that interfaces the javascript with the server - it is called every time a server request is made
 * 
 * Arguments:
 *  1. object - the data to be sent to the server
 *  2. string - the request type, POST, PUT, GET, etc.
 *  3. string - the url to send the request to. eg '/thing'
 *  4. function - a function to be run if everything is successful
 *  5. any - something passed to the finishFunction's first argument
 * 
 */
function post(data, type, url, finishFunction=null, dataToPass=null) {
    let engine = new XMLHttpRequest();

    // creates a loading graphic
    engine.loader = createLoadingGraphic();

    // setup the request
    engine.open(type, url, true);
    engine.setRequestHeader('Content-Type', 'application/json');
    engine.timeout = 30000; // timeout 30 seconds
    engine.onload = function() {// run when the request loads
        if(engine.status == 200) {
            // remove loading graphic
            engine.loader.innerHTML = '';
            document.body.style.cursor = 'unset';
            // NEXT PAGE handling -> if the response is a number (e.g. a new element was created)...
            // don't use this function if you will return just a number and don't want to call nextPage()
            if (isNum(engine.responseText)) nextPage(num(engine.responseText)); // call the nextPage function
            // run the finish function
            if (finishFunction) finishFunction.bind(this)(dataToPass);

        } else if (engine.status == 472) { // sql error
            // remove loading graphic
            engine.loader.innerHTML = '';
            document.body.style.cursor = 'unset';
            alert("The database spit out the following error when trying to save your changes:\n*\n" + engine.responseText + "\n*\nThis probably has something to do with invalid data, or there being duplicate data ('Violation of UNIQUE KEY constraint' error). Make sure to check deleted rows when looking for duplicates.");
        } else if (engine.status == 500) { // server error
            // remove loading graphic
            engine.loader.innerHTML = '';
            document.body.style.cursor = 'unset';
            alert("There was a server error. This has been recorded and we will look into it, but if you need help immediately come talk to us in the AC controls office. Ask for good looking underpaid students.");
        } else if (engine.status == 403) { // unauthorized
            alert("Your session has timed out! This page is about to be reloaded. Good luck, and hope you're having a great day! (edits to this tables rows will be saved)");
            location.reload();
        } else {
            // remove loading graphic
            engine.loader.innerHTML = '';
            document.body.style.cursor = 'unset';
            alert("Something unexpected has happened. If this is getting in your way come talk to us at the ac controls shop. Or just come and talk anyway! Oh and bring this error code:\n"+JSON.stringify(engine.status));
        }
    }
    engine.ontimeout = function() { 
        // remove loading graphic
        engine.loader.innerHTML = '';
        document.body.style.cursor = 'unset';
        alert("The request has timed out, check your internet connection and come talk to us if the issue persists");
    }
    engine.onerror = function() { 
        // remove loading graphic
        engine.loader.innerHTML = '';
        document.body.style.cursor = 'unset';
        alert("There has been a network error connecting with our server, check your connection. If you can successfully reload this page but are still getting this error come and talk to us in the Ac Controls Shop.");
    }
    // send the request
    engine.send(JSON.stringify(data));

    return engine;
}