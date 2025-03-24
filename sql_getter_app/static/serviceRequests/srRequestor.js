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

// opens the form to create a new requestor
function createNewRequestor() {
    popup.open();
}

// creates the popup and the form to create a new requestor
function createNewReqSupport() {
    // create popup
    let popup = document.createElement('div');
    document.getElementById('body').appendChild(popup);
    popup.classList = 'modal';
    popup.setAttribute('id', 'popup');
    popup.style.display = 'none';

    // create popup content
    let popCon = document.createElement('div');
    document.getElementById('popup').appendChild(popCon);
    popCon.classList = 'modal-content';
    popCon.setAttribute('id', 'popup-content')

    // Create the SVG element for the close button
    let xButton = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    xButton.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    xButton.setAttribute("viewBox", "0 0 512 512");
    xButton.classList.add("ionicon"); // Optional, if you want to add styling class
    // Create the path element inside the SVG
    let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
        "d",
        "M400 145.49L366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49z"
    );
    // Append the path to the SVG element
    xButton.appendChild(path);
    // Add event listener to close button (SVG)
    xButton.onclick = function () {
        cancelCloser(); // Call the function when the close button is clicked
    };
    // Add the SVG button to the modal content
    popCon.appendChild(xButton);
    
    // Create the title
    let title = document.createElement("h2");
    title.innerHTML = "Add Requestor";
    popCon.appendChild(title);


    // create the form
    let popForm = document.createElement('form');
    document.getElementById('popup-content').appendChild(popForm);
    popForm.setAttribute('id', 'newReqForm');
    popForm.method = 'post';
    popForm.action = $SCRIPT_ROOT + '/NewServiceRequest';

    // the user Id
    let idText = document.createElement('div');
    idText.innerText = 'Most Probable Id: ' + userNextId;
    idText.setAttribute('title', 'The Id field is automatically populated by the database when it is saved. The Id displayed here is our best estimate of what that value will be.');
    popForm.appendChild(idText);

    // create the userName label
    createLabel('userName', 'Username (BYU Net ID)', popForm);
    // create the userName part of the form
    createInputElement('text', 'userName', popForm);

    // line break for aesthetics
    popForm.appendChild(document.createElement('br'));

    // create the firstName label
    createLabel('firstName', 'First Name', popForm);
    // create the userName part of the form
    createInputElement('text', 'firstName', popForm);

    // line break for aesthetics
    popForm.appendChild(document.createElement('br'));

    // create the lastName label
    createLabel('lastName', 'Last Name', popForm);
    // create the userName part of the form
    createInputElement('text', 'lastName', popForm);

    // line break for aesthetics
    popForm.appendChild(document.createElement('br'));

    //create the technician label
    createLabel('technician', 'Technician', popForm);
    //create the technician part of the form
    let technician = document.createElement('select');
    technician.setAttribute('id', 'technician');
    technician.name = 'technician';
    technician.required = true;
    popForm.appendChild(technician);

    let falseOption = document.createElement('option');
    falseOption.setAttribute("value", "false");
    falseOption.innerText = "False";
    technician.appendChild(falseOption);

    let trueOption = document.createElement('option');
    trueOption.setAttribute("value", "true");
    trueOption.innerText = "True";
    technician.appendChild(trueOption);
    
    // line break for aesthetics
    popForm.appendChild(document.createElement('br'));

    //phone
    createLabel('phone', 'Phone', popForm);
    let phone = document.createElement('input');
    phone.type = 'tel';
    phone.id = 'phone';
    phone.name = 'phone';
    phone.style.height = "32px";
    phone.style.fontSize = "1rem";
    phone.required = true;
    //phone.setAttribute('onblur', 'checkPhoneNum()');
    phone.pattern = '[0-9]{3}-[0-9]{3}-[0-9]{4}';
    phone.title = "Phone format: 123-456-7890";
    phone.placeholder = "Format: 123-456-7890";
    popForm.appendChild(phone);

    // line break for aesthetics
    popForm.appendChild(document.createElement('br'));  
    
    // this is for breaks that aren't working
    let breakReplacement = document.createElement('div');
    breakReplacement.style.height = '13.5px';
    popForm.appendChild(breakReplacement);

    //email
    createLabel('email', 'Email', popForm);
    let email = document.createElement('input');
    email.setAttribute('type', 'email');
    email.setAttribute('id', 'email');
    email.name = 'email';
    email.required = true;
    //email.setAttribute('onblur', 'checkEmail()');
    email.onblur = function() {
        emailValidation(email)
    };
    popForm.appendChild(email)

    // line break for aesthetics
    popForm.appendChild(document.createElement('br'));    

    //vendorId
    createLabel('vendorId', 'Vendor', popForm);
    let vendorId = document.createElement('select');
    vendorId.id = 'vendorId';
    vendorId.name = 'vendorId';
    vendorId.required = true;
    popForm.appendChild(vendorId);

    for (key in vendors) {
        let value = vendors[key];
        let opt = document.createElement('option');
        opt.setAttribute('value', value);
        opt.innerText = value;
        vendorId.appendChild(opt);
    }

    // line break for aesthetics
    popForm.appendChild(document.createElement('br'));

    //userIdModified
    createLabel('number', 'User Modified', popForm);
    let userIdModified = document.createElement('input');
    userIdModified.type = 'text';
    userIdModified.readOnly = true;
    userIdModified.value = userName;
    userIdModified.name = 'userIdModified';
    userIdModified.required = true;
    popForm.appendChild(userIdModified);

    // line break for aesthetics
    popForm.appendChild(document.createElement('br'));

    //Full Name
    createLabel('fullName', 'Full Name', popForm);
    let fullName = document.createElement('input');
    fullName.id = "fullName";
    fullName.name = 'fullName';
    fullName.type = 'text';
    fullName.required = true;
    popForm.appendChild(fullName);

    // line break for aesthetics
    popForm.appendChild(document.createElement('br'));

    //userRoleId
    createLabel('userRoleId', 'Role', popForm);
    let userRoleId = document.createElement('select');
    userRoleId.id = 'userRoleId';
    userRoleId.name = 'userRoleId';
    userRoleId.required = true;
    userRoleId.style.height = "32px";
    userRoleId.style.fontSize = "1rem";
    popForm.appendChild(userRoleId);

    for (key in roles) {
        let value = roles[key];
        let opt = document.createElement('option');
        opt.setAttribute('value', value);
        opt.innerText = value;
        if (value == "Customer") {
            opt.selected = true;
        }
        userRoleId.appendChild(opt);
    }

    // line break for aesthetics
    popForm.appendChild(document.createElement('br'));

    // this is for breaks that aren't working
    let breakReplacement2 = document.createElement('div');
    breakReplacement2.style.height = '13.5px';
    popForm.appendChild(breakReplacement2);
   
    //submit
    let submit = document.createElement('input');
    submit.type = 'submit';
    submit.value = 'Create';
    submit.onclick = function () {
        document.body.style.overflow = "auto";
    };
    popForm.appendChild(submit);

    //cancel
    let cancel = document.createElement('input');
    cancel.type = 'button';
    cancel.value = 'Cancel';
    cancel.onclick = function () {
        cancelCloser();
    };
    popForm.appendChild(cancel)

    // function that opens the popup
    let openFunction = function() {
        popup.style.display = "block";
        closeModalByClickingOutside();
    }
    popup.open = openFunction;
}

// sets the focus on requestor when a user cancels creating a new requestor
function cancelCloser() {
    document.getElementById('userName').value = '';
    document.getElementById('firstName').value = '';
    document.getElementById('lastName').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('email').value = '';
    document.getElementById('fullName').value = '';
    document.body.style.overflow = "auto";
    popup.style.display = "none";

    let requestor = document.querySelector('#requestor');
    requestor.focus();
    requestor.value = "";
}