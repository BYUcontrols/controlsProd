/*  
    Class that breaks the table into pages

           Written by: 
      Isaac Cutler 12/1/2020
    Property of the BYU A/C Shop
*/


// new pagination class because I didn't like how it was done before and it could be super easy to do it and test it like this

/* 
 * pagination breaks the page up into pages to make long tables more manageable
 */
class paginationEngine {
        // takes a list of rows (obtained by aHTMLtableElement.rows)
    constructor(rows) {

        this.rows = rows;
                // check localstorage for saved pagination
        if (isStorageItem('paginateScale')) this.currentScale = getStorageItem('paginateScale');
        else this.currentScale = 'all';
            // create container and place container in page
        let functionDiv = document.createElement("DIV");    // creates a div element for the js functions
        functionDiv.classList = 'tableFunction';            // assigns the div with a class called tableFunction for all the mini tools above the table
        let divContainer = document.createElement('div');   // create a div element to the number-of-items-to-display tool
        divContainer.classList = 'tableFunctionContainer';  // creates the class specifically for the engine that lets you select how many items you want to display at once
        divContainer.style.display = 'inline-block';
        setTooltip(divContainer, 'Choose how many items to display at a time and choose which group of items is displayed based on their \'Sort by:\' column values');
        functionDiv.appendChild(divContainer);
            // create a new dropdown
        this.displayDrop = new dropdown();
        this.displayDrop.create(this.setPaginateScale.bind(this));
        divContainer.appendChild(document.createTextNode("Show:"));
        divContainer.appendChild(this.displayDrop.select);
            // create options
        this.displayDrop.option('Everything', 'all', (this.currentScale == 'all'));
        this.displayDrop.option('50 items', '50', (this.currentScale == '50'));
        this.displayDrop.option('20 items', '20', (this.currentScale == '20'));
        this.displayDrop.option('10 items', '10', (this.currentScale == '10'));
        this.displayDrop.option('2 items', '2', (this.currentScale == '2'));
            // create container for selector
        let div = document.createElement('div');
        div.style.marginLeft = '10px'
        divContainer.appendChild(div);
            // create page selector dropdown
        this.pageDrop = new dropdown();
        this.pageDrop.create(this.paginate.bind(this));
        div.appendChild(document.createTextNode('Showing:'));
        div.appendChild(this.pageDrop.select);
            // run the onchange for the displayDrop
        this.setPaginateScale();
            // create an access point from which other functions can update the pagination
        window.updatePagination = this.setPaginateScale.bind(this);
        return functionDiv;
    }
    // sets the scale for pagination, runs when the 'Show:' selector changes
    setPaginateScale() {
        this.currentScale = this.displayDrop.select.value;
        // set scale cookie
        setStorageItem('paginateScale', this.currentScale);
            // retrieve range cookie
        if (isStorageItem('paginateRange')) var currentRange = getStorageItem('paginateRange');
        else var currentRange = 0;
            // clear the range dropdown
        this.pageDrop.clear();
            // get the sorted rows in array
        this.sortCol = window.sortBy;
        this.rows = sortRowsArray(Object.values(rowCollection), this.sortCol, reverse)
            // if the scale is a number...
        if (num(this.currentScale)) {
                // display the dropdown
            this.pageDrop.select.parentNode.style.display = 'inline-block';
                // create variables
            let divideBy = num(this.currentScale),
                pointer = -1,
                oldPointer = 0;
                // runs for every chunk of range
            while((this.rows.length - 1) > pointer) {
                    // update position variable
                pointer += divideBy;
                if (pointer > (this.rows.length - 1)) pointer = this.rows.length - 1;
                    // sets the name for the option
                let lowCell = this.rows[oldPointer].fields[this.sortCol];
                let highCell = this.rows[pointer].fields[this.sortCol];
                let optionName = String(lowCell.sortVal())+" - TO - "+ String(highCell.sortVal());
                    // puts the option into the pageDrop
                this.pageDrop.option(optionName, oldPointer, (currentRange == oldPointer));
                    // update position variable
                oldPointer = pointer + 1;
            }
                // run the onchange for the pageDrop
            this.paginate();
        } else { // when the scale is all (Everything is selected)
                // hide the pageDrop dropdown (it's no longer relevant)
            this.pageDrop.select.parentNode.style.display = 'none';
                // un-hide all the rows
            this.paginate();
        }
    }

    // actually hides the rows not part of the current page, runs when the 'Showing:' selector changes value
    paginate() {
        
        if (isNum(this.currentScale)) {
            let page = this.pageDrop.select.value;
                // parse the limit variables from the value (a string) of the pageDrop dropdown
            let low = num(page)
            let high = low + num(this.currentScale) - 1;
                // set the cookie for the page range, so that when we come back it's the same
            setStorageItem('paginateRange', low);
                // loop through rows
            for (row in this.rows) {
                    // if the row is outside the range hide it
                if ((row >= low) && (row <= high)) this.rows[row].rowRef.style.display = 'table-row';
                else this.rows[row].rowRef.style.display = 'none';
            }
        } else {
                // for when the selector is set to 'Everything' (not a number)
                // un-hide all the rows
            for (row in this.rows) this.rows[row].rowRef.style.display = 'table-row';
        }
    }
}   