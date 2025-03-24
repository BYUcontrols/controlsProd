/*  
    Functions that implement the table functions (sort, display, etc.)

           Written by: 
      Isaac Cutler 12/1/2020
    Property of the BYU A/C Shop
*/

// Generates sort select
function generateSortSelect() {
    // Looks for a cookie
    if (isStorageItem('sortBy')) window.sortBy = getStorageItem('sortBy');
    else window.sortBy = 1; // default sort by the column after the ID column
    // create a dropdown container and place it in the page

    let div = document.createElement('div');
    div.classList = 'tableFunction';
    document.getElementsByClassName('tableFunctions')[0].appendChild(div);
    let divContainer = document.createElement('div');

    divContainer.classList = 'tableFunctionContainer';
    divContainer.style.paddingRight = '20px';
    div.appendChild(divContainer);

        // set the tooltip
    setTooltip(divContainer, 'Select a column to sort the table by (alphabetically); Arrow controls sort direction');
        // create a new dropdown
    let sortDropdown = new dropdown();
    sortDropdown.create(sortTable);
    divContainer.appendChild(document.createTextNode("Sort by:"))
    divContainer.appendChild(sortDropdown.select)
    sortDropdown.select.id = 'sortSelect';
        // options using the columns object
    for (let col in columnsInfo) {
        sortDropdown.option(columnsInfo[col].readableName, col, col == sortBy);
    }
        // Create backward/reverse button cookie retrieval
    if (isStorageItem('sortUp')) sortUp = getStorageItem('sortUp'); 
    else sortUp = 'true';
        // Create a button to change if we sort accending or descending
    let accendingButton = document.createElement('button');
    divContainer.appendChild(accendingButton);
    accendingButton.classList = 'accendingButton';
        // defines a function that runs on click
    accendingButton.onclick = sortCall.bind(accendingButton);
        // defines a global variable to store the state of the button
    window.reverse = false
        // set that state based on the cookie
    if (sortUp == 'true') {
        reverse = true;
    } else {
        reverse = false;
    }
    
        // run the onclick function associated with the button to initialize everything 
    sortCall.bind(accendingButton)();
}


// function that runs onclick of the accending button
function sortCall() {
        // depending on a global state variable...
    if (!reverse) {
            // change symbol, state variable, and cookie for the button
        this.innerHTML = '&UpTeeArrow;';
        reverse = true;
        setStorageItem('sortUp', 'false');
    } else {
            // change symbol, state variable, and cookie for the button
        this.innerHTML = '&DownTeeArrow;';
        reverse = false;
        setStorageItem('sortUp', 'true');
    }
        // run the function that sorts the table
    sortTable();
    
}

// Sorts rows called by the sort selector
function sortTable() {
        // Find the sort selector
    select = document.getElementById("sortSelect");
        // Get the selected column index 
    let sortCol = select.value;
        // set the global variable sort by to be used by the pagination code
    sortBy = sortCol;
        // Set cookie
    setStorageItem("sortBy", sortCol);
        // variables
    let table;
        // Get the table
    table = document.getElementById("table");
        
        // Actually sort the table
    let tb = table.tBodies[0],
        tr = sortRowsArray(Object.values(rowCollection), sortCol, reverse)
    
        // append each row in order
    tb.innerHTML = '';
    for (row of tr) tb.appendChild(row.rowRef);
    // run the paginate command when the row updates if the paginate select has been created
    if (window.updatePagination) window.updatePagination();
}

// sorts a given array of rowEngine objects by the sortCol
function sortRowsArray(tr, sortCol, isReversed) { 

    // sets reverse as a positive or negative 1, respectively
    reversed = -((+isReversed) || -1);
    // sort array of rows with custom compare function
    tr = tr.sort(function (aRaw, bRaw) {
            // THE ULTIMATE COMPARE FUNCTION TO ALPHABETIZE THAT CAN DO IP ADDRESSES
            // it does it all, don't judge: it's a complected process
            // size doesn't matter anyway, only quality

            // a place to store the result of the compare
        let verdict = 0;
        let sortLevel = 0;
            // Loop through all the columns until we run out of sort columns
        while (verdict == 0 && sortLevel < sortCol.length) {
                // Extract the desired sting to compare from the row
            let aStr = aRaw.fields[sortCol[sortLevel]].sortVal();
            let bStr = bRaw.fields[sortCol[sortLevel]].sortVal();

            if (aStr == null && bStr == null) verdict = 0
            else if (aStr == null && bStr != null) verdict = 1
            else if (aStr != null && bStr == null) verdict = -1
            else {
                verdict = ultimateStringComparer(String(aStr), String(bStr))
                    // return a positive or negative number based on position of b relative to a
                verdict = verdict * reversed;
            }
        }

        return verdict;
    });

    return tr;
}



// functions used by sortTable() to take a string and check if it can be made into a number and converts it if it can
function num(str) {
    if (!isNaN(str) && !isNaN(parseFloat(str))) return +str;
    else return false;
}

function isNum(str) {
    if (!isNaN(str) && !isNaN(parseFloat(str))) return true;
    else return false;
}

// function used by sortTable to compare 2 strings REALLY well
    // returns a positive or negative number or zero
    // zero: same string
    // positive: b is before a
    // negative: a is before b
function ultimateStringComparer(aStr, bStr) {
        // trim down the strings (REMOVE WHITESPACE FROM BOTH ENDS)
    aStr = aStr.trim();
    bStr = bStr.trim();
        // declare a bunch of variables
    let posA = 0, // the index iterator for the a string
        posB = 0, // the index iterator for the b string
        verdictChar = 0, // the place we save the result (keeps the while loop going)
        tempPosA = 0, // the iterator for a number being converted to an integer
        tempPosB = 0; // the iterator for a number being converted to an integer

        // runs through all the characters until a verdict is reached
        // or there are no more characters in both strings
    while (verdictChar == 0 && (aStr[posA] || bStr[posB])) { 
            // get the characters we will work on
        let a = aStr[posA];
        let b = bStr[posB]; 
            // if one of the strings ends before the other
            // set a verdict
        if (a == undefined) verdictChar = -1; 
        else if (b == undefined) verdictChar = 1;
            // if both characters aren't numbers
        else if (!isNum(a) && !isNum(b)) verdictChar = a.localeCompare(b, undefined, {sensitivity: 'base'}); // compare based on unicode order (case insensitive)
            // when both characters are numbers
        else {
                // iterate until you have found the end of that number and number-ize it
            tempPosA = posA;
            while (isNum(aStr[tempPosA])) { tempPosA ++; }
            let numberA = num(aStr.substring(posA, tempPosA));
                // place the new pointer variable at the end of the number (right before it)
            posA = tempPosA - 1;


                // ditto but for string b
            tempPosB = posB;
            while (isNum(bStr[tempPosB])) { tempPosB ++; }
            let numberB = num(bStr.substring(posB, tempPosB));
            posB = tempPosB - 1; 
                // compare those numbers
            verdictChar = numberA - numberB;

        }
            // advance a character
        posA ++;
        posB ++;
    }

    return verdictChar;
}

// Generates display select
function generateDisplaySelect(suppliedColumns = null) {
    // define the window.displayedColumns list (the columns that should and should not be displayed)
    if (suppliedColumns) { // if it was supplied then set it to the supplied variable 
        window.displayedColumns = suppliedColumns;
    } else if (isStorageItem('display')) { // else we check the localstorage for a previous displayedColumns list
        window.displayedColumns = JSON.parse(getStorageItem('display'));
    } else { // if all else fails create a new one
        window.displayedColumns = new Object();
        for (iterator in window.columnsInfo) {
            console.log(iterator);
            if (iterator == 0) displayedColumns[iterator] = false;
            else displayedColumns[iterator] = true;
        }
    }
        // create new select dropdown html container
    let div = document.createElement("div");
    setTooltip(div, 'Choose which columns to display');
    div.classList = 'tableFunction';
    let dropdown = document.createElement("div");
    dropdown.classList = 'displayDropdown';
    dropdown.id = 'displaySelect';
        // assign that select with its attributes
    let dropdownBtn = document.createElement("p");
    dropdownBtn.setAttribute("class", "displayDropbtn");
    let text = document.createTextNode("Displayed Columns:");
    dropdownBtn.appendChild(text);

    let dropdownContent = document.createElement("div");
    dropdownContent.setAttribute("id", "displaySelect");
    dropdownContent.setAttribute("class", "displayDropdown-content");

    // Put the select where it needs to go on the page
    dropdown.appendChild(dropdownBtn);
    dropdown.appendChild(dropdownContent);
    div.appendChild(dropdown);
    if (!document.getElementById('srtable')) {
    document.getElementById('tableFunctions').appendChild(div);
    };
    
    // Creates a Select all option
        // set option text as the column names
    let optionSelect = document.createElement("div");
    optionSelect.classList.add('selectAllOption');
    window.displaySelectAllCheckbox = document.createElement("input");
    window.displaySelectAllCheckbox.setAttribute("type", "checkbox");
    window.displaySelectAllCheckbox.setAttribute("onchange", "handleSelectAllChange(this)") // passing 'this' tells the browser to pass the html ref of the text
    window.displaySelectAllCheckbox.classList.add("displayDropdown-option");
    window.displaySelectAllCheckbox.setAttribute("name", 'selectAllCheckbox');
        // Create the label for the checkbox
    colName = document.createElement("label");
    colName.setAttribute("for", 'selectAllCheckbox');
    colName.appendChild(document.createTextNode('Select All'));
        // Append the text and the option to the select
    optionSelect.appendChild(window.displaySelectAllCheckbox);  
    optionSelect.appendChild(colName);
    optionSelect.style.position = 'relative';
    optionSelect.style.color = 'white';
    dropdownContent.appendChild(optionSelect);

    // create a spot to store all the checkboxes
    window.displaySelectCheckboxes = new Array();
    // creates the selector using the columns object

    for (let iterator in window.columnsInfo) {

            // set option text as the column names
        let option = document.createElement("div");
        let text = document.createElement("input"); 
        if (displayedColumns[iterator] == true) { // if the displayed columns object is true for a column check it
            text.setAttribute("checked", true);
        }
        text.setAttribute("value", iterator); // set the value as the index number of the column that way we can access it on check change
        text.setAttribute("type", "checkbox");
        text.setAttribute("onchange", "handleCheckboxChange(this)") // passing 'this' tells te browser to pass the html ref of the text
        text.setAttribute("class", "displayDropdown-option");
        text.setAttribute("id", iterator);
        text.setAttribute("name", columnsInfo[iterator].readableName);

        // Create the label for the checkbox
        colName = document.createElement("label");
        colName.setAttribute("for", columnsInfo[iterator].readableName);
        colName.appendChild(document.createTextNode(columnsInfo[iterator].readableName));
            // Append the text and the option to the select
        option.appendChild(text);  
        option.appendChild(colName);
        option.style.position = 'relative';
        option.style.color = 'white';
        dropdownContent.appendChild(option);
            // append the checkbox in the checkbox array
        window.displaySelectCheckboxes.push(text);
    }
    handleColumnVisibility();
    handleDisplaySelectAll();
}

// sets column visibility based on contents of displayedColumns array
function handleColumnVisibility() {
    // find the table
    table = document.getElementById("table");
    // loop through the global window.displayedColumns 
    for (column in window.displayedColumns) {
        // if the row is meant to be displayed (displayedColumns[column] == True)
        if (window.displayedColumns[column] && window.columnsInfo[column]) {
            columnsInfo[column].htmlRef.style.display = 'table-cell'; // display the header
        }
        else if (columnsInfo[column]) columnsInfo[column].htmlRef.style.display = 'none'; // don't display it
        // loop through all the rowEngines for all the rows
        for (row in rowCollection) {
            // if the column is o be displayed display it
            if (window.displayedColumns[column] && rowCollection[row].fields[column]) rowCollection[row].fields[column].htmlRef.style.display = 'table-cell';
            // else don't
            else if (rowCollection[row].fields[column]) rowCollection[row].fields[column].htmlRef.style.display = 'none';
        }    
    }
    // update the localstorage displayedColumns to match the current one
    setStorageItem('display', JSON.stringify(displayedColumns));
}

// handles the displayed columns checkboxes
function handleCheckboxChange(checkbox) {
    if (checkbox.checked == true) displayedColumns[checkbox.id] = true;
    else displayedColumns[checkbox.id] = false;
    
    handleColumnVisibility();
    handleDisplaySelectAll();
}
// runs when the Select All checkbox is clicked. deselects or selects all the checkboxes
// according to the state of the Select All checkbox
function handleSelectAllChange(selectAllCheckbox) {
    let checkedState = selectAllCheckbox.checked
    for (checkbox of window.displaySelectCheckboxes) {
        checkbox.checked = checkedState;
        handleCheckboxChange(checkbox);
    }
}
// function that checks all the display select checkboxes and if they are all selected then select the select all
/// checkbox and it not then it doesn't
function handleDisplaySelectAll() {
    let uncheckedFlag = false;

    for (checkbox of window.displaySelectCheckboxes) {
        if (!checkbox.checked) uncheckedFlag = true;
    }
    
    window.displaySelectAllCheckbox.checked = !uncheckedFlag;
}