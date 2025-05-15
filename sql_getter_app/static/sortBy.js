/*  
    Functions and classes for the table sort functionality
           Written by: 
      Isaac Cutler 7/21/2021
    Property of the BYU A/C Shop
*/

// a class that creates and represents a sort select and calls the appropriate functions on changes
class sortSelect {
        // save various essential variables
        // columns - the columnsInfo object generated in initialization
        // idNUmber - A unique number/string to identify this one in the localstorage
        // onChange - a function to be run onChange of anything
    constructor(columns, idNumber, onChange) {

        this.columnsInfo = columns;
        this.id = idNumber;
        this.onChange = onChange;
    }

        // create the actual sort select menu thingy
    generateSortSelect(optionalTextBefore=null) {
            // Looks for a cookie
        if (isStorageItem(`sortBy${this.id}`)) {
            this.sortBy = getStorageItem(`sortBy${this.id}`);
            this.isSet = true; // set a flag so that we know to display it in the sort dropdown
        }
        else {
            this.sortBy = 1; // default sort by the column after the ID column
            this.isSet = false;
        }
            // create a container to put everything in
        let div = document.createElement('div');
        div.classList.add('sortSelectOption');
        div.textContent = optionalTextBefore;
            // create a new dropdown
        this.sortDropdown = new dropdown();
        this.sortDropdown.create(this.sortSelectChange.bind(this));
        div.append(this.sortDropdown.select);
            // add options using the columns object
        for (let col in this.columnsInfo) {
            this.sortDropdown.option(this.columnsInfo[col].readableName, col, col == this.sortBy);  
        }
            // Create backward/reverse button cookie retrieval
        let sortUp;
        if (isStorageItem(`sortUp${this.id}`)) {sortUp = getStorageItem(`sortUp${this.id}`); 
        // console.log(sortUp)
        }
        else sortUp = 'false';
            // Create a button to change if we sort accending or descending
        this.ascendingButton = document.createElement('button');
        div.appendChild(this.ascendingButton);
        this.ascendingButton.classList = 'ascendingButton';
        this.ascendingButton.onclick = this.accendingButtonChange.bind(this)
            // defines a global variable to store the state of the button
        window.reverse = false
            // set that state based on the cookie
        if (sortUp == 'true') {
            this.reverse = true;
        } else {
            this.reverse = false;
        }
            // run the onclick function associated with the button to initialize everything (without actually running anything)
        this.accendingButtonChange(false);
        this.sortSelectChange(false);

        return div; // return the html element for the sort select
    }

        // A function to handle the functionality of the accending button (runs on click and switches the arrow up or down)
    accendingButtonChange(execute = true) {
        if (!execute) {
            if (this.reverse) {
                    // change symbol, state variable, and cookie for the button
                this.ascendingButton.innerHTML = '&UpTeeArrow;';
            } else {
                    // change symbol, state variable, and cookie for the button
                this.ascendingButton.innerHTML = '&DownTeeArrow;';
            }
        } else {
            if (!this.reverse) {
                    // change symbol, state variable, and cookie for the button
                this.ascendingButton.innerHTML = '&UpTeeArrow;';
                this.reverse = true;
                if (execute){ setStorageItem(`sortUp${this.id}`, 'true'); console.log(46)}
            } else {
                    // change symbol, state variable, and cookie for the button
                this.ascendingButton.innerHTML = '&DownTeeArrow;';
                this.reverse = false;
                if (execute) setStorageItem(`sortUp${this.id}`, 'false');
            }
        }
            // run the function that sorts the table
        if (execute) this.onChange();
        
    }

        // a function to handle the change of the sort select
    sortSelectChange(execute = true) {
            // Get the selected column index 
        this.sortCol = this.sortDropdown.select.value;
            // Set cookie
        if (execute) setStorageItem(`sortBy${this.id}`, this.sortCol);
            // run the onChange function
        if (execute) this.onChange();
    }

        // member called when a sortLevel is deleted, clears the session storage
    clearSelect() {
        removeStorageItem(`sortBy${this.id}`);
    }
}
    


// another class that creates the sortSelect classes and sorts the table
class sortMenu {

        // columnsInfo - the columnsInfo object generated in initialization
        // tableToSort - the html Node for the table we will be sorting
    constructor(columnsInfo, tableToSort, rows) {
        this.columnsInfo = columnsInfo;
        this.table = tableToSort;
        this.rowCollection = rows;
        this.levelArray = new Array();
        window.sortBy = 1;
    }

        // Create the menu!
        // args:
        //  - text - the text to be displayed before the menu
        //  - tooltip - text for the tooltip
        //  
    createMenu(text, tooltip) {
            // create a dropdown container and place it in the page
        let div = document.createElement('div');
        div.classList = 'tableFunction';
        let divContainer = document.createElement('div');
        divContainer.classList = 'displayDropdown';
        div.appendChild(divContainer);
            // create the big button (with first select)
        let bigButton = document.createElement('div');
        bigButton.style.width = '270px';
        bigButton.classList.add('displayDropbtn');
        divContainer.append(bigButton);
        
            // add stuff to the bigButton
        bigButton.textContent = text;
            // set the tooltip
        setTooltip(bigButton, tooltip);
            // create the first sort by level
        this.levelArray.push(new sortSelect(this.columnsInfo, 0, this.sortTable.bind(this)));
            // append it to the sort menu
        bigButton.append(this.levelArray[0].generateSortSelect());
            // tell the bigButton that it is set (so it will be sorted by)
        this.levelArray[0].isSet = true;

            // create the place to put the other options
        let bigDropdown = document.createElement('div');
        bigDropdown.classList.add('displayDropdown-content');
        divContainer.append(bigDropdown);
            // create and place all the other options
        let sortLevelIndex = 1;
        for (let col in this.columnsInfo) {
            let nextLevel = new sortSelect(this.columnsInfo, sortLevelIndex, this.sortTable.bind(this));
            nextLevel.sortHtml = nextLevel.generateSortSelect('Then : ');
            nextLevel.sortHtml.style.display = (nextLevel.isSet ? 'inherit':'none') // display the select if it has a previous level
            bigDropdown.append(nextLevel.sortHtml); 
            this.levelArray[sortLevelIndex] = nextLevel;
            sortLevelIndex ++;
        }
            // create the add new filter level button
        bigDropdown.append(createButton("+ Level", this.addLevel.bind(this), 'Add another level to the sort'));

            // create the remove filter level button
        bigDropdown.append(createButton("- Level", this.removeLevel.bind(this), 'Add another level to the sort'));

            // sort the table
        this.sortTable();

        return div; // return the html node to be placed in the page
    }

        // add another level to the table
    addLevel() {
        
        // loop through the columns
        for (let level in this.levelArray) {
            if ((level != 0)) {
                let levelObject = this.levelArray[level]; // store the levelObject

                if (levelObject.isSet == false) { // if it is hidden
                    levelObject.isSet = true;
                    levelObject.sortHtml.style.display = 'inherit';
                    break;
                }
            }
        }
    }

    removeLevel() {
         // loop through the columns
         for (let level in this.levelArray) {
            if ((level != 0)) {
                if ((level == (this.levelArray.length - 1)) && (this.levelArray[level].isSet == true)) {
                    let levelObject = this.levelArray[level]; // grab the levelObject one back 
                    levelObject.isSet = false;
                    levelObject.sortHtml.style.display = 'none';
                    levelObject.clearSelect();
                    break;
                }
                else if ((this.levelArray[level].isSet == false)) { // if it is hidden
                    let levelObject = this.levelArray[level - 1]; // grab the levelObject one back 
                    levelObject.isSet = false;
                    levelObject.sortHtml.style.display = 'none';
                    levelObject.clearSelect();
                    break;
                }
            }
        }
    }

    sortTable() {
            // prepare the array to sort by
        let preppedArray = new Array();

        this.levelArray.forEach(level => {
            if (level.isSet) preppedArray.push({column:level.sortCol, reversed:level.reverse});
        });

            // do the actual sorting
            // Actually sort the table
        let tb = this.table.tBodies[0],
            tr = this.actuallySortTheTable(Object.values(this.rowCollection), preppedArray)

            // append each row in order
        tb.innerHTML = '';
        for (let row of tr) tb.appendChild(row.rowRef);
        // run the paginate command when the row updates if the paginate select has been created
        if (window.updatePagination) window.updatePagination();

    }

    actuallySortTheTable(tr, sortData) {
        // sorts a given array of rowEngine objects by the sortCol
        // sort array of rows with custom compare function
        tr = tr.sort(function (aRaw, bRaw) {
                // THE ULTIMATE COMPARE FUNCTION TO ALPHABETIZE THAT CAN DO IP ADDRESSES
                // it does it all, don't judge: it's a complected process
                // size doesn't matter anyway, only quality

                // a place to store the result of the compare
            let verdict = 0;
            let sortLevel = 0;
                // Loop through all the columns until we run out of sort columns
            while (verdict == 0 && sortLevel < sortData.length) {
                    // Extract the desired sting to compare from the row
                let aStr = aRaw.fields[sortData[sortLevel].column].sortVal();
                let bStr = bRaw.fields[sortData[sortLevel].column].sortVal();

                if (aStr == null && bStr == null) verdict = 0
                else if (aStr == null && bStr != null) verdict = 1
                else if (aStr != null && bStr == null) verdict = -1
                else {
                    verdict = ultimateStringComparer(String(aStr), String(bStr))
                    // sets reverse as a positive or negative 1, respectively
                    let reversed = -((+sortData[sortLevel].reversed) || -1);
                        // return a positive or negative number based on position of b relative to a
                    verdict = verdict * reversed;
                }
                    // advance the sort level
                sortLevel = sortLevel + 1;
            }

            return verdict;
        });

        return tr;
    }
        
}
