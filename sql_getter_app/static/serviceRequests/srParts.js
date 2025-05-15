// a function called when opening a service request window that summons and creates the parts
function loadParts(partsTable, requestId, serviceRequestWindowEngine) {
  // Get request setup
  let request = post(
    null,
    "GET",
    `/serviceRequestParts/${requestId}`,
    finishLoadParts
  );
  // attach data to the request object
  request.table = partsTable;
  request.id = requestId;
  request.reqEngine = serviceRequestWindowEngine;
}

// Called on return of the request form loadParts()
function finishLoadParts() {
  // place the return table where it goes
  this.table.innerHTML = this.response;
  // load the rows and save the list of rowEngines returned in the rowEngine for the service request window
  // we do this so that when the service request window is closed we have a list of parts and notes and people
  // to save. As a note the type of foreign row loaded is AIRPLANE_MODE which means that the Notes will not
  // actually send any requests to the server when saved or edited
  let listOfEngines = loadForeignRow(
    this.table,
    foreignType.AIRPLANE_MODE
  ).engineList;
  // add the request engine to the one that already exists
  this.reqEngine.enginesToSave =
    this.reqEngine.enginesToSave.concat(listOfEngines);

  // store the context (this) as a variable that way we can access it inside the createInputNewNoteRow
  let requestContext = this;
  // create the new input new row (passing the context)
  createInputNewPartRow(requestContext);
}

function createInputNewPartRow(requestContext) {
  // get a fresh empty rowEngine to create the input new fields off of
  let inputEngine = loadForeignRow(
    requestContext.table,
    foreignType.EMPTY_ENGINE_ONLY
  ).emptyEngine;
  // set airplaneMode to true (tells the rowEngine not to send anything to the server)
  inputEngine.airplaneMode = true;
  // append this new row to the requestWindow.enginesToSave (they will not be saved until the input new button is pressed)
  requestContext.reqEngine.enginesToSave.push(inputEngine);

  // create the input new row
  inputEngine.rowRef = document.createElement("tr");
  requestContext.table.childNodes[1].append(inputEngine.rowRef);
  inputEngine.rowRef.classList.add("srPartsNewRow");
  // set edit to true for the inputEngine
  inputEngine.editing = true;
  // set the 'new' id for the input engine
  inputEngine.id = "new";
  // load columns for the input new part
  let startColumn = function (
    index,
    defaultVal = undefined,
    secondArg = undefined
  ) {
    let cell = inputEngine.fields[index];
    // create the cell for the input field
    cell.htmlRef = document.createElement("td");
    // call the .edit() member on that cell to create the input field
    cell.edit(defaultVal, secondArg);
    // put the cell in it's place in the table
    inputEngine.rowRef.append(cell.htmlRef);
  };
  // start the part column
  startColumn(0);
  // start the quantity column
  startColumn(1);
  // start the status column
  startColumn(2, "18", false); // default 'In Need', no status Table button (not necessary)
  // create the optionsButtons for the inputEngine (but don't put them anywhere yet)
  let inputEngineOptions = inputEngine.createOptionsButtons();
  // create a place to put the add and options button
  let inputButtons = document.createElement("td");
  inputEngine.rowRef.append(inputButtons);

  // create a custom onSaveReturn for the inputEngine that makes the input row look like a normal row

  let customSaveFunction = function () {
    // remove the css class of the row so that makes it look different from the other rows
    inputEngine.rowRef.classList.remove("srPartsNewRow");
    // remove the + part button
    inputButtons.innerHTML = "";
    inputButtons.append(inputEngineOptions);
    inputButtons.classList.remove("srPartsNewSaveBtnCell");
    inputButtons.classList.add("noPrint");
    // disable the undo button (can't undo a creation)
    inputEngine.undoBtn.disabled = true;

    // do button things
    inputEngine.saveBtn.disabled = true;
    inputEngine.undoBtn.disabled = false;
    inputEngine.editBtn.disabled = false;
    // remove the editing style and attribute
    inputEngine.editing = false;
    inputEngine.rowRef.classList.remove("editable");
    // remove the edit cookie
    removeStorageItem(inputEngine.id + "RowProgress");
    // restore the cells to their unedited state
    for (let cell of inputEngine.fields) {
      // if an object was provided then restore with those values
      cell.restoreCell();
    }
    // call this whole function again to create another input new row
    createInputNewPartRow(requestContext);
    // It's not an infinite loop I swear. This part of the code is run when the user clicks a button
  };

  // create an add button for the new part
  let button = generateByuButton("+Part", function () {
    // call the saveRow() method
    inputEngine.saveRow(null, null, customSaveFunction);
    console.log(inputEngine);
  });

  // place that button in its place
  inputButtons.append(button);
  inputButtons.classList.add("srPartsNewSaveBtnCell");
}

// START MASON

function addPartModal() {
  // create popup
  let partpop = document.createElement("div");

  document.getElementById("body").appendChild(partpop);
  partpop.classList = "modal";
  partpop.setAttribute("id", "partpop");
  partpop.style.display = "none";

  // create popup content
  let partpopCon = document.createElement("div");
  document.getElementById("partpop").appendChild(partpopCon);
  partpopCon.classList = "modal-content";
  partpopCon.setAttribute("id", "partpopup-content");
  let title = document.createElement("h2");
  title.innerHTML = "Add Part";
  partpopCon.appendChild(title);

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
    partCancel();
  };
  // Add the SVG button to the modal content
  partpopCon.appendChild(xButton);


  /////////////////////// START ADD Part FORM   ////////////////////////////

  // create the form
  let partpopForm = document.createElement("form");
  document.getElementById("partpopup-content").appendChild(partpopForm);
  partpopForm.setAttribute("id", "addPartForm");
  partpopForm.method = "post";

  // if it's a new service request form, each part is given a temporary id
  if (!servReq) {
    // newPartTempId
    const newPartTempIdDiv = document.createElement("div");
    newPartTempIdDiv.id = "newNoteTempIdDiv";
    newPartTempIdDiv.style.display = "none"; // makes it so the temporary part id exists but is not shown on screen
    createLabel("newPartTempId", "Request Part Temporary ID", newPartTempIdDiv);
    let newPartTemp = createInputElement(
      "number",
      "newPartTempId",
      newPartTempIdDiv
    );
    partpopForm.appendChild(newPartTempIdDiv);
    // addNotePopForm.appendChild(document.createElement("br"));
  }
  partpopForm.action = $SCRIPT_ROOT + "/NewServiceRequest";

  // create the Part label
  const partDiv = document.createElement("div");
  partDiv.id = "partDiv";
  partDiv.class;
  partDiv.classList.add("textInput");
  createLabel("parts", "Parts", partDiv);
  createDropdownElement("parts", "parts", partDiv); // onclick clear the input field
  createDatalistElement("parts", parts, partDiv);
  partpopForm.appendChild(partDiv);

  // create the Quantity label
  const quantityDiv = document.createElement("div");
  quantityDiv.id = "partQuant";
  quantityDiv.classList.add("numericInput");
  createLabel("partquantity", "Quantity", quantityDiv);
  // create the input element
  let input = document.createElement("input");
  // set the input type
  input.setAttribute("type", "number");
  // give the input an id
  input.setAttribute("id", "partquantity");
  input.setAttribute("required", "required");
  input.name = "partquantity";
  input.min = 0;
  quantityDiv.appendChild(input);
  partpopForm.appendChild(quantityDiv);

  // // create the Void label
  // const voidDiv = document.createElement("div");
  // voidDiv.id = "partVoid";
  // voidDiv.classList.add("checkboxInput");
  // createLabel("partvoid", "Void", voidDiv);
  // createInputElement("checkbox", "partvoid", voidDiv);
  // partpopForm.appendChild(voidDiv);

  // Input By
  const inputByDiv = document.createElement("div");
  inputByDiv.id = "inputByDiv";
  inputByDiv.classList.add("textInput");
  createLabel("inputBy", "Input By", inputByDiv);
  createInputElement("text", "inputBy", inputByDiv);
  partpopForm.appendChild(inputByDiv);
  partpopForm.appendChild(document.createElement("br"));

  createInputElement("number", "servReqId", partpopForm);

  //////////////////////////  END ADD Part FORM    ///////////////////////////

  //submit
  let partsubmit = document.createElement("input");
  partsubmit.type = "submit";
  partsubmit.value = "Create";
  partpopForm.appendChild(partsubmit);
  partsubmit.onclick = function () {
    // save scroll position to restore after reload
    localStorage.setItem(
      "scrollPosition",
      window.scrollY || document.documentElement.scrollTop
    );
  };
  if (!servReq) {
    partpopForm.addEventListener("submit", function (event) {
      if (!servReq) {
        event.preventDefault();
        document.getElementById("partsTableHeader").style.display = "";
        // Get the values from the form
        const newPartTempId = document.getElementById("newPartTempId").value;
        const parts = document.getElementById("parts").value;
        const inputBy = document.getElementById("inputBy").value;
        const partquantity = document.getElementById("partquantity").value;
        // const voided = document.getElementById("partvoid").checked;

        // Create a new part object
        const newPart = {
          newPartTempId: newPartTempId,
          parts: parts,
          partquantity: partquantity,
          inputBy: inputBy,
          // voided: voided,
        };
        newSRParts.push(newPart);

        // Gives newNoteCounter counter for newNoteTempId one more each time a new part is submitted
        window.newServiceRequestPartCounter++;
        
        // Close the modal
        partCancel();
        // enable scrolling
        document.body.style.overflow = "auto";
        // update UI
        if (!servReq) {
          populatePartsTable(document.getElementById("tableBody"));
        }
        // c
        // const partsTable = document.getElementById("tableBody");
        // const newRow = `<tr id="partsrow">
        //   <td onclick="sendNoteId()" style="cursor: pointer;"><svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512">
        //   //<path d="M384 224v184a40 40 0 01-40 40H104a40 40 0 01-40-40V168a40 40 0 0140-40h167.48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
        //   //<path d="M459.94 53.25a16.06 16.06 0 00-23.22-.56L424.35 65a8 8 0 000 11.31l11.34 11.32a8 8 0 0011.34 0l12.06-12c6.1-6.09 6.67-16.01.85-22.38zM399.34 90L218.82 270.2a9 9 0 00-2.31 3.93L208.16 299a3.91 3.91 0 004.86 4.86l24.85-8.35a9 9 0 003.93-2.31L422 112.66a9 9 0 000-12.66l-9.95-10a9 9 0 00-12.71 0z"/></svg></td>
        //   <td></td>
        //   <td>${parts}</td>
        //   <td>${inputBy}</td>
        //   <td>${partquantity}</td>
        //   <td>${voided ? "Yes" : "No"}</td>
        // </tr>`;
        // partsTable.innerHTML += newRow;
      }
    });
  }

  //cancel
  let partcancel = document.createElement("input");
  partcancel.type = "button";
  partcancel.value = "Cancel";
  partcancel.onclick = function () {
    partCancel();
    document.body.style.overflow = "auto";
  };
  partpopForm.appendChild(partcancel);

  // function that opens the popup
  let openFunction = function () {
    partpop.style.display = "block";
    document.getElementById("inputBy").value = userName;
    if (!servReq) {    
      document.getElementById("newPartTempId").value =
        window.newServiceRequestPartCounter; // Set the counter value
    };
    closeModalByClickingOutside();
  };
  partpop.open = openFunction;
}

function partCancel() {
  document.getElementById("parts").value = "";
  document.getElementById("partquantity").value = "";
  // document.getElementById("partvoid").checked = false;
  document.getElementById("inputBy").value = "";
  partpop.style.display = "none";
  document.body.style.overflow = "auto"; // Enable scrolling when the modal is closed
}

function newPartModal() {
  // create popup
  let newpartpop = document.createElement("div");
  document.getElementById("body").appendChild(newpartpop);
  newpartpop.classList = "modal";
  newpartpop.setAttribute("id", "newpartpop");
  newpartpop.style.display = "none";

  // create popup content
  let newpartpopCon = document.createElement("div");

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
    newPartCancel();
  };
  // Add the SVG button to the modal content
  newpartpopCon.appendChild(xButton);
  
  let outsideClick = document.getElementById("newpartpop");

  document.getElementById("newpartpop").appendChild(newpartpopCon);
  newpartpopCon.classList = "modal-content";
  newpartpopCon.setAttribute("id", "newpartpop-content");

  // create the form
  let newpartpopForm = document.createElement("form");
  document.getElementById("newpartpop-content").appendChild(newpartpopForm);
  newpartpopForm.setAttribute("id", "newpartpopForm");
  newpartpopForm.method = "post";
  newpartpopForm.action = $SCRIPT_ROOT + "/NewServiceRequest";

  /////////////////   BUILD THE NEW PART FORM  ////////////////////////

  // title
  const title = document.createElement("h2");
  title.innerText = "Create Part";
  newpartpopForm.appendChild(title);

  // description
  createLabel("newpartdescription", "Description", newpartpopForm);
  createDescription("newpartdescription", newpartpopForm);
  newpartpopForm.appendChild(document.createElement("br"));

  // modelNumber
  createLabel("newpartmodelNumber", "Model Number", newpartpopForm);
  createInputElement("text", "newpartmodelNumber", newpartpopForm);
  newpartpopForm.appendChild(document.createElement("br"));

  // vendorId (the user only sees the vendor's name)
  createLabel("newpartVendor", "Vendor", newpartpopForm);
  createDropdownElement("newpartVendorList", "newpartVendor", newpartpopForm);
  createDatalistElement("newpartVendorList", partvendors, newpartpopForm);
  newpartpopForm.appendChild(document.createElement("br"));

  // minimumToStock
  createLabel("newpartMinStock", "Minimum To Stock", newpartpopForm);
  // createInputElement("number", "newpartMinStock", newpartpopForm);
  // Create the input element
  let minStockInput = document.createElement("input");
  // Set the input type
  minStockInput.setAttribute("type", "number");
  // Give the input an id
  minStockInput.setAttribute("id", "newpartMinStock");
  minStockInput.setAttribute("min", "0");
  minStockInput.name = "newpartMinStock";
  // Append the input to the form
  newpartpopForm.appendChild(minStockInput);

  newpartpopForm.appendChild(document.createElement("br"));

  // manufacturerId
  createLabel("newpartManu", "Manufacturer", newpartpopForm);
  createDropdownElement("newpartManuList", "newpartManu", newpartpopForm);
  createDatalistElement("newpartManuList", manufacturers, newpartpopForm);
  newpartpopForm.appendChild(document.createElement("br"));

  // deviceTypeId
  createLabel("newpartdeviceType", "Device Type", newpartpopForm);
  createDropdownElement(
    "newpartdeviceTypeList",
    "newpartdeviceType",
    newpartpopForm
  );
  createDatalistElement("newpartdeviceTypeList", deviceTypes, newpartpopForm);
  newpartpopForm.appendChild(document.createElement("br"));

  // deviceSubTypeId
  createLabel("newpartdeviceSubType", "Device Sub-Type", newpartpopForm);
  createDropdownElement(
    "newpartdeviceSubTypeList",
    "newpartdeviceSubType",
    newpartpopForm
  );
  createDatalistElement(
    "newpartdeviceSubTypeList",
    deviceSubTypes,
    newpartpopForm
  );
  newpartpopForm.appendChild(document.createElement("br"));
  newpartpopForm.appendChild(document.createElement("br"));

  createInputElement("number", "servReqId", newpartpopForm);

  /////////////////   NEW PART FORM END    ////////////////////////////

  //submit
  let newpartsubmit = document.createElement("input");
  newpartsubmit.type = "submit";
  newpartsubmit.value = "Create";
  newpartpopForm.appendChild(newpartsubmit);

  newpartsubmit.onclick = function () {
    // save scroll position to restore after reload
    localStorage.setItem(
      "scrollPosition",
      window.scrollY || document.documentElement.scrollTop
    );
  };

  //cancel
  let newPartCancel = document.createElement("input");
  newPartCancel.type = "button";
  newPartCancel.value = "Cancel";
  newPartCancel.onclick = function () {
    newPartCancel();
  };
  newpartpopForm.appendChild(newPartCancel);

  // function that opens the popup
  let openFunction = function () {
    newpartpop.style.display = "block";
    closeModalByClickingOutside();
  };
  newpartpop.open = openFunction;
}

function newPartCancel() {
  document.getElementById("newpartdescription").value = "";
  document.getElementById("newpartmodelNumber").value = "";
  document.getElementById("newpartVendor").value = "";
  document.getElementById("newpartMinStock").value = "";
  document.getElementById("newpartManu").value = "";
  document.getElementById("newpartdeviceType").value = "";
  document.getElementById("newpartdeviceSubType").value = "";

  newpartpop.style.display = "none";
}

// opens the editor form with a specific part loaded from the notes table in a new service request form

function sendPartId() {
  document.body.style.overflow = "hidden"; // Prevent scrolling when the modal is open
  if (servReq) {
    let reqpartid = parseInt(this.id);
    editPartPop.open(reqpartid);
  } else if (!servReq){
    let newSRPart = this;
    editPartPop.open(newSRPart);
  };
};

function editPartModal() {
  // create popup
  let editPartPop = document.createElement("div");
  document.getElementById("body").appendChild(editPartPop);
  editPartPop.classList = "modal";
  editPartPop.setAttribute("id", "editPartPop");
  editPartPop.style.display = "none";

  // create popup content
  let editPartPopCon = document.createElement("div");
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
    editPartCancel();
  };
  // Add the SVG button to the modal content
  editPartPopCon.appendChild(xButton);
  editPartPop.appendChild(editPartPopCon);
  editPartPopCon.classList = "modal-content";
  editPartPopCon.setAttribute("id", "editPartPop-content");

  // create the title
  
  let title = document.createElement("h2");
  title.innerHTML = "Edit Part";
  editPartPopCon.appendChild(title);

  // create the form
  let editPartPopForm = document.createElement("form");
  editPartPopCon.appendChild(editPartPopForm);
  editPartPopForm.setAttribute("id", "editPartPopForm");
  editPartPopForm.method = "post";
  editPartPopForm.action = $SCRIPT_ROOT + "/NewServiceRequest";

  /////////////////   BUILD THE FORM  ////////////////////////
  // Display this information, but it is not editable
  // requestPartId
  createLabel("requestPartId", "Request Part ID", editPartPopForm);
  createInputElement("number", "requestPartId", editPartPopForm);
  editPartPopForm.appendChild(document.createElement("br"));

  // partId
  if (servReq) {
    createLabel("partId", "Part ID", editPartPopForm);
    createInputElement("number", "partId", editPartPopForm);
  } else if (!servReq) {
    createLabel("partId", "Part", editPartPopForm);
    createInputElement("text", "partId", editPartPopForm);
  };
  
  editPartPopForm.appendChild(document.createElement("br"));

  // This is editable by the user
  // voided
  // createLabel("editpartvoid", "Void", editPartPopForm);
  // createInputElement("checkbox", "editpartvoid", editPartPopForm);

  // this is for breaks that aren't working
  let breakReplacement = document.createElement('div');
  breakReplacement.style.height = '13.5px';
  editPartPopForm.appendChild(breakReplacement);

  // status
  if (servReq) {
    createLabel("partStat", "Status", editPartPopForm);
    createDropdownElement("partStatList", "partStat", editPartPopForm);
    createDatalistElement("partStatList", partStatus, editPartPopForm);
    editPartPopForm.appendChild(document.createElement("br"));  
  };


  // quantity
  createLabel("partQuan", "Quantity", editPartPopForm);
  // create the input element
  let input = document.createElement("input");
  // set the input type
  input.setAttribute("type", "number");
  // give the input an id
  input.setAttribute("id", "partQuan");
  input.setAttribute("required", "required");
  input.name = "partQuan";
  input.min = 0;
  editPartPopForm.appendChild(input);
  editPartPopForm.appendChild(document.createElement("br"));

  createInputElement("number", "servReqId", editPartPopForm);

  /////////////////   FORM END    ////////////////////////////

  //submit
  let editpartsubmit = document.createElement("input");
  if (servReq) {
    editpartsubmit.type = "submit";
  } else if (!servReq) {
    editpartsubmit.type = "button";
    editpartsubmit.onclick = function () {
      // Get the value of the part ID to be edited (newNoteTempId)
      let partIdToEdit = document.getElementById("requestPartId").value;

      // Find the index of the map in the newSRNotes array using the newNoteTempId
      let partIndex = newSRParts.findIndex(part => part.newPartTempId == partIdToEdit);

      // If the part with the matching newNoteTempId is found
      if (partIndex !== -1) {
        // Update the part with the new values
        // if (document.getElementById("editpartvoid").checked) {
        //   newSRParts[partIndex].voided = true;
        // } else {
        //   newSRParts[partIndex].voided = false;
        // };
        newSRParts[partIndex].partquantity = document.getElementById("partQuan").value;
      };
      // reload the parts table to reflect the changes
      populatePartsTable(document.getElementById("tableBody"));
      // close the window
      editPartCancel();
    };
  };
  editpartsubmit.id = "editPartPopSubmit";
  editpartsubmit.value = "Save";
  editPartPopForm.appendChild(editpartsubmit);

  editpartsubmit.addEventListener("submit", () => {
    // Store the current scroll position (this will be used to restore position on reload)
    let scrollPosition = window.scrollY || document.documentElement.scrollTop;
    localStorage.setItem("scrollPosition", scrollPosition);
  });

  //delete
  let editpartdelete = document.createElement("input");
  editpartdelete.type = "button";
  editpartdelete.id = "deletebutton";
  editpartdelete.value = "Delete";
  editpartdelete.onclick = function () {
    if (servReq) {
      // save scroll position to restore after reload
    localStorage.setItem(
      "scrollPosition",
      window.scrollY || document.documentElement.scrollTop
    );
    // create the form
    let deletepartForm = document.createElement("form");
    body.appendChild(deletepartForm);
    deletepartForm.setAttribute("id", "deletepartForm");
    deletepartForm.method = "post";
    deletepartForm.action = $SCRIPT_ROOT + "/NewServiceRequest";

    let remove = document.createElement("input");
    remove.type = "text";
    remove.name = "deletePart";
    remove.value = document.getElementById("requestPartId").value;
    remove.display = "hidden";
    deletepartForm.appendChild(remove);

    let servReqId = document.createElement("input");
    servReqId.type = "number";
    servReqId.name = "servReqId";
    servReqId.value = servReq["servReqId"];
    remove.display = "hidden";
    deletepartForm.appendChild(servReqId);

    deletepartForm.submit();
    } else if (!servReq) {
      // Get the value of the part ID to be deleted (newPartTempId)
      let partIdToDelete = document.getElementById("requestPartId").value;

      // Find the index of the map in the newSRParts array using the newPartTempId
      let partIndex = newSRParts.findIndex(part => part.newPartTempId == partIdToDelete);

      // If the part with the matching newPartTempId is found
      if (partIndex !== -1) {
        // Remove the map from the newSRParts array
        newSRParts.splice(partIndex, 1);
      };

      // Store the current scroll position
      let scrollPosition = window.scrollY || document.documentElement.scrollTop;
      console.log("scrollPosition", scrollPosition);
      localStorage.setItem("scrollPosition", scrollPosition);
      // reload the notes table to reflect the changes
      populatePartsTable(document.getElementById("tableBody"));
      // close the window
      editPartCancel();
      
    };
  };
  editPartPopForm.appendChild(editpartdelete);

  // function that opens the popup
  let openFunction = function (id) {
    if (servReq) {
      editPartPop.style.display = "block";
      document.getElementById("requestPartId").value =
        servReq["parts"][id]["reqPartId"];
      document.getElementById("partId").value = servReq["parts"][id]["partId"];
      // if (servReq["parts"][id]["void"]) {
      //   document.getElementById("editpartvoid").checked = true;
      // };
      document.getElementById("partStat").value = servReq["parts"][id]["status"];
      document.getElementById("partQuan").value =
        servReq["parts"][id]["quantity"];
    } else if (!servReq) {
      editPartPop.style.display = "block";
      document.getElementById("requestPartId").value =
        id["newPartTempId"];
      document.getElementById("partId").value = id["parts"];
      // if (id["voided"]) {
      //   document.getElementById("editpartvoid").checked = true;
      // };
      document.getElementById("partQuan").value =
        id["partquantity"];
    };
    closeModalByClickingOutside();
  };
  editPartPop.open = openFunction;

  // Enter or Return key sumbits edit part pop form
  editPartPopForm.addEventListener("keydown", function (enter_key_pressed) {
    if (
      enter_key_pressed.key === "Enter" ||
      enter_key_pressed.key === "Return"
    ) {
      // when enter or return is pressed, it will submit the part
      enter_key_pressed.preventDefault();
      document.getElementById("editPartPopSubmit").click();
    }
  });
}


function editPartCancel() {
  document.getElementById("editPartPop").style.display = "none";
  document.getElementById("requestPartId").value = "";
  document.getElementById("partId").value = "";
  // document.getElementById("editpartvoid").checked = false;
  if (servReq) {
    document.getElementById("partStat").value = "";
  };
  document.getElementById("partQuan").value = "";
  document.body.style.overflow = "auto"; // Enable scrolling when the modal is closed
}
