/*
        Helper functions that create data entry fields of various types and return them as html Elements
*/

function createTextArea(val=null, charLimit=null, nullable=true) {
    let area = document.createElement('textarea');
    area.classList.add('inputTextArea')
    area.textContent = val;
        // set the character limit for the input if provided
    if(charLimit && isNum(charLimit)) area.maxLength = num(charLimit);
        // set the grey text present when there isn't anything in the input box
    area.placeholder = (nullable ? 'None':'It is IRRESPONSIBLE to leave this field blank');
    return area;
}

function createBool(current='True') {
    // start an instance of my dropdown class
    let drop = new dropdown();
    drop.create();
        // create options
    drop.option('None', null);
    drop.option('True', 'True', current == 'True');
    drop.option('False', 'False', current == 'False');

    return drop.select;
}

function createIntegerInput(val='0') {
    let input = document.createElement('input');
    input.setAttribute('oninput', "this.value=this.value.replace(/[^0-9]/g,'')");
    input.placeholder = 'Integer value';
    input.value = val;
    input.type = "number";
    input.step = '1';
    return input;
}

function createDecimalInput(val='0') {
    let input = document.createElement('input');
    input.placeholder = 'Decimal value';
    input.value = val;
    input.type = "number";
    input.step = '1';
    return input;
}

// generate big byu button given a string and a function  
function generateByuButton(text, onClick) {
        // create a button
    let button = document.createElement('p');
    button.appendChild(document.createTextNode(text));
    button.classList = 'BYUbutton';
        // tell the button what to do when clicked
    button.onclick = onClick;
        // return the button
    return button;
}

// function that checks a string to see if it is 'None' or something similar and returns null if it is. Else returns the string.
function cleanOutput(val) {
    if (val == 'None' || val == 'none' || val == '' || val == 'null' || val == undefined) {
        return null;
    } else {
        return val;
    }
}

// function returns a button
function createButton(text, action, tooltipText=null) {
    let btn = document.createElement('button');

    btn.textContent = text;
    btn.onclick = action;
    if (tooltipText) setTooltip(btn, tooltipText);
    return btn;
}

function createDropdown(table, current=null) {
    // start an instance of my dropdown class
    let drop = new dropdown();
    drop.create();
        // create none option
    drop.option('None', null);
            // creates the selector using the table object
    for (let index in table) {
        if (index != 'info') drop.option(table[index], index, (index == current)); // if statement to exclude the 'info' member of the linked object
    }
    
    return drop.select;
}

// a dropdown class for creating dropdowns
class dropdown {
    constructor() {}

    create(onchange=null) {
            // create new select
        this.select = document.createElement("SELECT");
            // assign that select with it's attributes
        this.select.onchange = onchange;
        
    }

    option(text, value, selected=false) {
            // Create an option
        let option = document.createElement("option");
            // set option value as the column number
        option.value = value;
            // set option text as the column names
        let textElement = document.createTextNode(text);
            // Append the text and the option to the select
        if (selected) {
            option.selected = true;
        }
        option.appendChild(textElement);
        this.select.appendChild(option);
    }

    clear() {
        this.select.innerHTML = '';
    }
}

function createDatetimeInput(val=null) {
    let input = document.createElement('input');
    input.type = "datetime-local";
    // clean the date up and put in in a form we can use
    if (val) {
        let dateEngine = new dateTimeVoodoo(val);
        input.value = dateEngine.forComputers();
    }
    return input;
}

function createDateInput(val=null) {
    let input = document.createElement('input');
    input.type = "date";
    // clean the date up and put in in a form we can use
    if (val) {
        let dateEngine = new dateTimeVoodoo(val);
        input.value = dateEngine.dateOnlyForComputers();        
    }
    return input;
}

// this one's special. For the tablePermissions table:
// create a list of checkboxes with roles and let the user pick which ones apply
function createCheckboxInput(roleOptions, currentOptions) {

    // create a div to put the options in
    let inputs = document.createElement('div');
    inputs.classList.add('tablePermissionsCheckboxes');

    // unique Id randomness (so that the 'id' attribute is different for every one)
    let uniqueRandomNumber = getRndInteger(0,100000000);

    // create an array to put the inputs in
    let inputArray = new Array();

    for (role in roleOptions) {
        if (isNum(role)) {

            // create a unique id for this checkbox and label
            let uniqueId = `checkboxForTablePermissions_${roleOptions[role]}_${uniqueRandomNumber}`;

            // create a container for the option and label pair
            let optionDiv = document.createElement('div');

            // create the checkbox
            let checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = uniqueId;
            checkbox.idNumber = role; // id number for the role
            optionDiv.append(checkbox);
            inputArray.push(checkbox);

            // check if the checkbox should be checked (using the currentOptions)
            // first verifying that currentOptions exists
            if (currentOptions) {
                if (currentOptions.includes(String(role))) checkbox.checked = true;
            } 

            let label = document.createElement('label');
            label.textContent = roleOptions[role];
            label.setAttribute('for', uniqueId);
            optionDiv.append(label);

            inputs.append(optionDiv);
        }
    }

    return {node:inputs, array:inputArray};
}

// a random integer function to use in the createCheckbox function
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

// test randomness of the javascript random function
function randTest(max) {
    let a = new Array()
    let last = null;
    let counter = 0;
    let repeat = true;

    while (repeat) {
        last = getRndInteger(0,max);
        if (a.includes(last)) repeat = false;
        a.push(last);
        counter = counter + 1;
    }
    return counter
} // results are alright, but sufficient for our uses


// because we deal with three different kinds of time formats (sql, html datetime, and human readable, and dates for all those) we need
//  a class to handle datetime manipulation. The constructor takes a string with whatever datetime format you please.
// if no string is provided then we assume today's date.
class dateTimeVoodoo {
    constructor(raw) {
        if (raw) var milis = Date.parse(raw);
        // if no time is provided then assume today's date
        else var milis = Date.now();
        this.engine = new Date(milis);
    }
        // takes the datetime and turns it into something that can be fed into the value of an html datepicker
        //  * this has no way to handle timezone and outputs regardless of timezone *
    forComputers() {
        if (this.engine != 'Invalid Date') {
            let timezoneOffset = this.engine.getTimezoneOffset() * 60 * 1000;
            let localMilliseconds = this.engine.getTime() - timezoneOffset;
            let tempEngine = new Date(localMilliseconds);
            return tempEngine.toJSON().slice(0, -1);
        } else return '';
    }

    forHumans() {
        return this.engine.toLocaleString();
    }  

    dateOnly() {
        // turns the months and days into 09 instead of 9
        let month = this.engine.getMonth() < 9 ? (`0${this.engine.getMonth() + 1}`) : (`${this.engine.getMonth() + 1}`);
        let day = this.engine.getDate() < 10 ? (`0${this.engine.getDate()}`) : (`${this.engine.getDate()}`);
        return  `${month}/${day}/${this.engine.getFullYear()}`;
    }

    dateOnlyForComputers() {
        // turns the months and days into 09 instead of 9
        let month = this.engine.getMonth() < 9 ? (`0${this.engine.getMonth() + 1}`) : (`${this.engine.getMonth() + 1}`);
        let day = this.engine.getDate() < 10 ? (`0${this.engine.getDate()}`) : (`${this.engine.getDate()}`);
        return  `${this.engine.getFullYear()}-${month}-${day}`;
    }
}