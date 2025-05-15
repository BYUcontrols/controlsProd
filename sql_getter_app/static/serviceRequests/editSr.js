/*
    Mason
    Functions for the 'edit' or 'new' service request feature
*/
  // these are declared var so they can be accessed outside of this file
  // used to add parts and notes to a new SR
  var newSRNotes = [];
  var newSRParts = [];

// the onload function of the page to edit or create a new service request
function EditSrInnit() {

  // these modals should be created first
  addPartModal();
  newPartModal();
  addNoteModal();
  editPartModal();
  editNoteModal();

  // the main form is created
  CreateForm();
  tabIndexInit();

  // some fancy stuff that puts the user's focus on the priority field if they just created a new requestor
  if (newRequestor != null) {
    let priority = document.querySelector("#priority");
    priority.focus();
  }
  // presents the user with a message letting them know their changes have been saved
  if (message != null) {
    // let msgBox = document.createElement("div");
    // msgBox.id = "msgBox";
    // msgBox.classList = "msgBox";
    // let boxHolder = document.getElementsByClassName("page-content")[0];
    // boxHolder.appendChild(msgBox);

    // let msgElement = document.createElement("p");
    // msgElement.innerText = message;
    // msgBox.appendChild(msgElement);
    // msgElement.style.color = "black";     // Black text
    // msgElement.style.fontWeight = "bold"; // Bold text
    // msgElement.style.fontFamily = "'HCo Ringside Narrow SSm', Arial, sans-serif"; // BYU font
    // // msgbox styles
    // msgBox.style.position = "fixed";
    // msgBox.style.width = "50%";          // Spans the full width of the viewport
    // msgBox.style.height = "25px";         // Fixed height for the message box
    // msgBox.style.bottom = "10px";         // 10px from the bottom of the viewport
    // msgBox.style.left = "50%";
    // msgBox.style.transform = "translateX(-50%)";
    // msgBox.style.backgroundColor = "#ADEBB3"; // Light green background
    // msgBox.style.border = "1px solid #28a745"; // Green border
    // msgBox.style.color = "white";         // White text for contrast
    // msgBox.style.padding = "10px";        // Adds inner spacing
    // msgBox.style.borderRadius = "5px"; // Rounds top corners
    // msgBox.style.boxShadow = "0 -2px 4px rgba(0, 0, 0, 0.2)"; // Shadow above the box
    // msgBox.style.zIndex = "1000";         // Ensures it appears above other elements
    // msgBox.style.alignParts = "center";
    // msgBox.style.justifyContent = "center";
    // msgBox.style.display = "flex";
    
    setTimeout(function() {
      // msgBox.style.display = "none";
      window.location.href = $SCRIPT_ROOT + "/ServiceRequest";
    }, 0);
  }
  // if there is an part description then we need it to populate the part field in the add part form
  if (partDesc != null) {
    partpop.open();
  }
  // SCROLL TO PREVIOUS SPOT ON RELOAD
  // there will be a scroll position saved if the user is coming back from the notes or parts modals
  // this is so the user does not get reloaded to the top of the page for every note or part they add/delete/edit
  if (localStorage.getItem("scrollPosition")){
    window.scrollTo(0, localStorage.getItem("scrollPosition"));
    localStorage.removeItem("scrollPosition");
  }
}

// function for creating the form that edits or creates a New Service Request.
function CreateForm() {

  // resets temporary note and part counter to 1 for new service requests
  window.newServiceRequestNoteCounter = 1;
  window.newServiceRequestPartCounter = 1;

  // create a form
  let editForm = document.createElement("form");
  editForm.id = "newSrForm";
  editForm.method = "post";
  editForm.action = $SCRIPT_ROOT + "/NewServiceRequest";

  editForm.style.display = "flex";
  editForm.style.flexDirection = "column";
  editForm.style.padding = "20px";
  editForm.style.fontFamily = "'HCo Ringside Narrow SSm', Arial, sans-serif";

  const formElementStyles = {
    width: "100%", // Set a fixed width for all form elements
    padding: "10px",
    marginBottom: "15px",
    border: "1px solid #ccc",
    borderRadius: "5px",
  };

  function applyStyles(element, styles) {
    for (let style in styles) {
      element.style[style] = styles[style];
    }
  }

  // tells user that their data will be lost if they reload the page
  // andrewhiggins: I tried to make it so the user would only get the message if they had made changes to the form but 
  // it kept messing the form up so I commented it out. I think it's a good feature to have but it needs to be implemented
  /*  let isFormDirty = false;

    const allInputs = document.getElementsByTagName('input');

    allInputs.addEventListener('input', () => {
      isFormDirty = true;
    });
  */

  // this is to warn the user that their inputs won't be saved if they reload or leave the page, but it got really annoying 
  /*
  window.addEventListener('beforeunload', (event) => {
    const confirmationMessage = "this text doens't matter";
    event.returnValue = confirmationMessage;
  });
  */

  let idText = document.createElement("div");
  if (servReq == null) {
    idText.innerText = "Request Id: " + nextId;
    idText.setAttribute(
      "title",
      "The Id field is automatically populated by the database when it is saved. The Id displayed here is our best estimate of what that value will be."
    );
  } else {
    idText.innerText = "Service Request Id: " + servReq["servReqId"];
    currId = document.createElement("input");
    currId.id = "currId";
    currId.name = "currId";
    currId.value = servReq["servReqId"];
    currId.readOnly = true;
    currId.classList = "invisible";
    applyStyles(currId, formElementStyles);
    editForm.appendChild(currId);
  }
  idText.style.width = "100%";
  idText.style.textAlign = "center";
  idText.style.padding = "10px";
  idText.style.fontWeight = "bold";

  editForm.appendChild(idText);

  // create the date label
  createLabel("date", "Date", editForm);

  // create the Date part of the form
  createInputElement("datetime-local", "date", editForm);

  // line break for aesthetics
  editForm.appendChild(document.createElement("br"));

  // create the requestor label
  createLabel("requestor", "Requestor", editForm);

  // create the Requestor part of the form
  createDropdownElement("requestor", "requestor", editForm);

  // create the datalist for the Requestor dropdown. 'requestors' is a dict from python with the names of all users currently assigned as requestors.
  createDatalistElement("requestor", requestors, editForm);

  // create the Priority label
  createLabel("priority", "Priority", editForm);

  // create the Priority part of the form
  createDropdownElement("priority", "priority", editForm);

  // create the datalist for the Priority dropdown. 'priorities' is a dict from python with a list of the active priority values.
  createDatalistElement("priority", priorities, editForm);

  // line break for aesthetics
  editForm.appendChild(document.createElement("br"));

  // create the Description label
  createLabel("description", "Description", editForm);

  // create the description part of the form
  let description = document.createElement("textarea");

  // Add event listener for 'Enter' and 'Return' key press so that when the user presses 'Enter' the focus moves to the location input field
  description.addEventListener("keydown", function(enter_key_pressed) {
    if (enter_key_pressed.key === "Enter" || enter_key_pressed.key === "Return") {
      enter_key_pressed.preventDefault(); // Prevent new line in the textarea
      let locationInput = document.getElementById("location");
      if (locationInput) {
        locationInput.focus();
      }
    }
  });
  description.setAttribute("rows", "4");
  description.setAttribute("cols", "50");
  description.setAttribute("id", "description");
  description.name = "description";
  description.tabIndex = 3;
  description.required = true;
  if (servReq != null) {
    description.value = servReq["description"];
  }
  editForm.appendChild(description);

  // line break for aesthetics
  editForm.appendChild(document.createElement("br"));

  
  // create the department label
  createLabel("department", "Department", editForm);

  // create the department part of the form
  createDropdownElement("department", "department", editForm);

  // create the datalist for the department dropdown. 'departments' is a dict from python with a list of the active department values.
  createDatalistElement("department", departments, editForm);

  // create the Assigned To label
  createLabel("assignedTo", "Assigned To", editForm);
  
  // create the Assigned To part of the form
  createDropdownElement("assignedTo", "assignedTo", editForm);
  
  // create the datalist for the Assigned To dropdown. 'assignedTo' is a dict from python with a list of the active assigned to values.
  createDatalistElement("assignedTo", assignedTo, editForm);
  
  // create the Building label
  createLabel("building", "Building", editForm);
  
  // create the Building part of the form
  createDropdownElement("building", "building", editForm);
  
  // create the datalist for the Building dropdown. 'building' is a dict from python with a list of the active buildingAbbreviation values.
  createDatalistElement("building", building, editForm);
  
  // create the Room/Location label
  createLabel("location", "Room/Location", editForm);

  // create the Location part of the form
  createInputElement("text", "location", editForm);

  // line break for aesthetics
  editForm.appendChild(document.createElement("br"));

  // create the estimate label
  createLabel("estimate", "Estimate", editForm);

  // create the Estimate part of the form
  createInputElement("datetime-local", "estimate", editForm);

  // create the Status label
  createLabel("status", "Status", editForm, hidden = true);

  // create the Status part of the form
  createDropdownElement("status", "status", editForm, hidden = true);

  // create the datalist for the Status dropdown. 'status' is a dict from python with a list of the active status values.
  createDatalistElement("status", status, editForm);

  // line break for aesthetics
  editForm.appendChild(document.createElement("br"));

  // create the completed label
  let completedDiv = document.createElement("div");
  completedDiv.id = "completedDiv";
  editForm.appendChild(completedDiv);
  createLabel("completed", "Completed", completedDiv);

  createInputElement("button", "completedBtn", completedDiv);

  // create the completed part of the form
  createInputElement("datetime-local", "completed", editForm);

  // create the cc label
  createLabel("cc", "CC", editForm);

  // create the cc part of the form. give it placeholder text
  let ccInput = document.createElement("input");
  ccInput.type = "text";
  ccInput.id = "cc";
  ccInput.name = "cc";
  ccInput.placeholder = "email@example.com";
  ccInput.tabIndex = "11"
  editForm.appendChild(ccInput);

  // line break for aesthetics
  editForm.appendChild(document.createElement("br"));

  // create the Contacted Date label
  createLabel("contactedDate", "Contacted Date", editForm);

  // create the Contacted Date part of the form
  createInputElement("datetime-local", "contactedDate", editForm);

  // create the external Id label
  createLabel("externalId", "External Id", editForm);

  // create the external Id part of the form
  createInputElement("number", "externalId", editForm);

  // line break for aesthetics
  editForm.appendChild(document.createElement("br"));
  // line break for aesthetics
  editForm.appendChild(document.createElement("br"));

  // Notes table title
  let notesHeader = document.createElement("div"); // Create a container for the notes header
  notesHeader.classList = "tableHeader"; // Set an ID for styling or identification
  notesHeader.id = "notesHeader"; // Set an ID for styling or identification
  let notesTitle = document.createElement("h2"); // Create the header element
  notesTitle.classList = "tableTitle  "
  notesTitle.innerText = "Notes"; // Set the text content to "Notes"
  notesHeader.appendChild(notesTitle); // Add the title to the header container
  editForm.appendChild(notesHeader); // Append the notes header to the form

  // place for the notes list to go
  let tableWrappern = document.createElement("div"); // used for styling (media queries, mobile)
  tableWrappern.classList = "tableWrapper notesTableWrapper";
  let notestable = document.createElement("table");
  notestable.id = "notesTable";
  notestable.classList = "printThis noBorders";
  tableWrappern.appendChild(notestable);
  editForm.appendChild(tableWrappern);

  let notestableHead = document.createElement("thead");
  notestableHead.classList = "noBorders";
  notestableHead.id = "notesTableHeader";
  notestable.appendChild(notestableHead);

  let notestheadrow = document.createElement("tr");
  notestheadrow.id = "notesTablehead";
  notestableHead.appendChild(notestheadrow);
  // hide the table header row if there are no notes in the SR
  if(servReq){
    if( Object.keys(servReq.notes).length === 0){
      notestableHead.style.display = "none"
    }
  } else if (!servReq) {
    if (newSRNotes.length == 0){
      notestableHead.style.display = "none"
    }
  }

  let nEdit = createTableHeader("Edit");
  notestheadrow.appendChild(nEdit);
  let noteIdHead = createTableHeader("Note ID");
  if (!servReq) {
    noteIdHead.style.display = "none"; // Hide the Note ID header if servReq is null
  }
  notestheadrow.appendChild(noteIdHead);
  let noteTitle = createTableHeader("Note");
  notestheadrow.appendChild(noteTitle);
  let inputBy = createTableHeader("Input By");
  notestheadrow.appendChild(inputBy);
  let date = createTableHeader("Date");
  notestheadrow.appendChild(date);

  let notetableBod = document.createElement("tbody");
  notetableBod.id = "notesTableBody";
  notestable.appendChild(notetableBod);

  if (servReq) {
    var notesVec = [];
    for (note in servReq["notes"]) {
      // if the note isn't private or the user is a technician then display the note
      if (!servReq["notes"][note]["private"] || userIsTech) {
        // if we haven't saved any notes yet, save this one to the array
        if (notesVec.length === 0) {
          notesVec.push(servReq["notes"][note]);
        }
        // if the array has a note in it already, compare the dates and save them in order
        else {
          var srDate = new Date(servReq["notes"][note]["date"]);
          for (i in notesVec) {
            var vecDate = new Date(notesVec[i]["date"]);
            if (vecDate.getTime() < srDate.getTime()) {
              notesVec.unshift(servReq["notes"][note]);
              break;
            }
            if (i == notesVec.length - 1) {
              notesVec.push(servReq["notes"][note]);
            }
          }
        }
      }
    }
    // Create the rows of the notes table in the edit service request view
    for (i in notesVec) {
      let notestBodRow = document.createElement("tr");
      notestBodRow.id = notesVec[i]["reqNoteId"];
      notetableBod.appendChild(notestBodRow);

      let edit = document.createElement("td");
      // Edit icon
      edit.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><path d="M384 224v184a40 40 0 01-40 40H104a40 40 0 01-40-40V168a40 40 0 0140-40h167.48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path d="M459.94 53.25a16.06 16.06 0 00-23.22-.56L424.35 65a8 8 0 000 11.31l11.34 11.32a8 8 0 0011.34 0l12.06-12c6.1-6.09 6.67-16.01.85-22.38zM399.34 90L218.82 270.2a9 9 0 00-2.31 3.93L208.16 299a3.91 3.91 0 004.86 4.86l24.85-8.35a9 9 0 003.93-2.31L422 112.66a9 9 0 000-12.66l-9.95-10a9 9 0 00-12.71 0z"/></svg>';
      edit.style = "cursor: pointer;";
      edit.onclick = sendNoteId.bind(notestBodRow);
      notestBodRow.appendChild(edit);
      let noteid = createTableCell(notesVec[i]["reqNoteId"]);
      notestBodRow.appendChild(noteid);
      let notecontent = createTableCell(notesVec[i]["note"]);
      notestBodRow.appendChild(notecontent);
      let noteinputBy = createTableCell(notesVec[i]["inputBy"]);
      notestBodRow.appendChild(noteinputBy);
      let noteDate = createTableCell(notesVec[i]["date"]);
      notestBodRow.appendChild(noteDate);
    };

  } else {
    notestableHead.style.display = "none";
  };

  // Add a Note
  let addnote = document.createElement("input");
  addnote.type = "button";
  addnote.value = "+ Note";
  addnote.classList = "BYUbutton";
  addnote.id = "add-note-btn";
  addnote.tabIndex = 13;
  addnote.onclick = function () {
    addNotePop.open(); //addNotePop defined in srNotes.js
    document.body.style.overflow = "hidden"; // Prevent scrolling when the modal is open
    document.getElementById("note").focus(); // put cursor in the notes box
  };
  notesHeader.insertBefore(addnote, notesHeader.firstChild);

  // line break for aesthetics
  editForm.appendChild(document.createElement("br"));

  // Parts table title
  let partsHeader = document.createElement("div");
  partsHeader.classList = "tableHeader";
  partsHeader.id = "partsHeader";
  let partsTitle = document.createElement("h2");
  partsTitle.classList = "tableTitle"
  partsTitle.innerText = "Parts";
  partsHeader.appendChild(partsTitle);
  if (userRole !== "Admin" && userRole !== "Secretary" && userRole !== "Mechanic"){
    partsHeader.style.display = "none"; // Hide the parts if user does not have high roles
  }
  editForm.appendChild(partsHeader);

  // place for the parts list to go
  let tableWrapper = document.createElement("div");
  tableWrapper.classList = "tableWrapper partsTableWrapper";
  let table = document.createElement("table");
  table.id = "partsTable";
  table.classList = "printThis noBorders";
  tableWrapper.appendChild(table);
  editForm.appendChild(tableWrapper);

  let tableHead = document.createElement("thead");
  tableHead.classList = "noBorders";
  tableHead.id = "partsTableHeader";
  table.appendChild(tableHead);

  let theadrow = document.createElement("tr");
  theadrow.id = "partsTablehead";
  // hide the table header row if there are no parts in the SR
  if (servReq) {
    if( Object.keys(servReq.parts).length === 0){
      theadrow.style.display = "none"
    }
  }

  tableHead.appendChild(theadrow);
  let edit = createTableHeader("Edit");
  theadrow.appendChild(edit);
  let partsid = createTableHeader("Part ID");
  theadrow.appendChild(partsid);
  let parts = createTableHeader("Part");
  theadrow.appendChild(parts);
  let partsInputBy = createTableHeader("Input By");
  theadrow.appendChild(partsInputBy);
  let quan = createTableHeader("Quantity");
  theadrow.appendChild(quan);
  // let voids = createTableHeader("Void");
  // theadrow.appendChild(voids);

  let tableBod = document.createElement("tbody");
  tableBod.id = "tableBody";
  table.appendChild(tableBod);

  // create the rows of the parts table in the edit SR view
  if (servReq) {
    for (part in servReq["parts"]) {
      let tBodRow = document.createElement("tr");
      tBodRow.id = servReq["parts"][part]["reqPartId"];
      tableBod.appendChild(tBodRow);

      let edit = document.createElement("td");
      // edit icon
      edit.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><path d="M384 224v184a40 40 0 01-40 40H104a40 40 0 01-40-40V168a40 40 0 0140-40h167.48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path d="M459.94 53.25a16.06 16.06 0 00-23.22-.56L424.35 65a8 8 0 000 11.31l11.34 11.32a8 8 0 0011.34 0l12.06-12c6.1-6.09 6.67-16.01.85-22.38zM399.34 90L218.82 270.2a9 9 0 00-2.31 3.93L208.16 299a3.91 3.91 0 004.86 4.86l24.85-8.35a9 9 0 003.93-2.31L422 112.66a9 9 0 000-12.66l-9.95-10a9 9 0 00-12.71 0z"/></svg>';
      edit.style = "cursor: pointer;";
      edit.onclick = sendPartId.bind(tBodRow);
      tBodRow.appendChild(edit);
      let partreqid = createTableCell(servReq["parts"][part]["reqPartId"]);
      tBodRow.appendChild(partreqid);
      let name = createTableCell(servReq["parts"][part]["name"]);
      tBodRow.appendChild(name);
      let partInputBy = createTableCell(servReq["parts"][part]["inputBy"]);
      tBodRow.appendChild(partInputBy);
      let quantity = createTableCell(servReq["parts"][part]["quantity"]);
      tBodRow.appendChild(quantity);
      // let voidstatus = createTableCell(servReq["parts"][part]["void"]);
      // tBodRow.appendChild(voidstatus);
    }
  } else {
    tableHead.style.display = "none";
  };

  // Add an Part
  let addpart = document.createElement("input");
  addpart.type = "button";
  addpart.value = "+ Part";
  addpart.classList = "BYUbutton";
  addpart.id = "add-part-btn";
  addpart.tabIndex = 14;
  addpart.onclick = function () {
    partpop.open();
    document.body.style.overflow = "hidden";
    document.getElementById("parts").focus();
  };
  partsHeader.insertBefore(addpart, partsHeader.firstChild);

  // line break for aesthetics
  editForm.appendChild(document.createElement("br"));
  // BUTTONS AT THE BOTTOM OF NEW/EDIT SR FORM
  // create a container for the following buttons (submit, cancel, delete, and print)
  let buttonContainer = document.createElement("div");
  buttonContainer.id = "buttonContainer";
  buttonContainer.style.display = "flex";
  buttonContainer.style.justifyContent = "center";
  buttonContainer.style.width = "100%";
  buttonContainer.style.marginTop = "20px";

  editForm.appendChild(buttonContainer);

  //Submit
  let submit = document.createElement("input");
  submit.type = "submit";
  submit.value = "Save";
  submit.classList = "BYUbutton";
  submit.tabIndex = 15;
  submit.onclick = function () {
    // if there is a service request, then it is an edit
    // set the saved message box to hidden after 3 seconds
    if (document.getElementById("msgBox")) {
      document.getElementById("msgBox").style.display = "flex"
    }
    // if (userRole === "Admin" || userRole === "Secretary" || userRole === "Mechanic"){
    //   setTimeout(function() {
    //     window.location.href = $SCRIPT_ROOT + "/ServiceRequest";
    //   }, 0);
    // } else {
    //   window.location.href = $SCRIPT_ROOT + "/home";
    // }
  }
  buttonContainer.appendChild(submit);

  //Cancel (Go back to the list page without saving what you did in the form)
  let cancel = document.createElement("input");
  cancel.type = "button";
  cancel.value = "Cancel";
  cancel.classList = "BYUbutton";
  cancel.tabIndex = 16;
  cancel.onclick = function () {
    if (userRole === "Admin" || userRole === "Secretary" || userRole === "Mechanic"){
      window.location.href = $SCRIPT_ROOT + "/ServiceRequest";
    } else {
      window.location.href = $SCRIPT_ROOT + "/home";
    }
  };
  buttonContainer.appendChild(cancel);

  // Only show Delete and Print buttons if the SR is already in the DB
  //Delete (set the 'active' column to False in the database)
  if(servReq != null){ // IF EXISTING SERVICE REQUEST (EDIT)
    let deletebtn = document.createElement("input");
    deletebtn.type = "button";
    deletebtn.value = "Delete";
    deletebtn.id = "deletebutton";
    deletebtn.classList = "BYUbutton";
    deletebtn.tabIndex = 17;
    // creates an invisible form, gives it the servReqId, submits to server via post request
    deletebtn.onclick = function () {
      console.log("delete btn clicked");
      let deleteform = document.createElement("form");
      deleteform.method = "post";
      deleteform.action = $SCRIPT_ROOT + "/NewServiceRequest";
      deleteform.classList = "invisible";
  
      let idinput = document.createElement("input");
      idinput.name = "idinput";
      if (servReq != null) {
        idinput.value = servReq["servReqId"];
      } else {
        idinput.value = "NO-ID";
      }
      deleteform.appendChild(idinput);
      document.body.appendChild(deleteform);
      deleteform.submit();
    };
    buttonContainer.appendChild(deletebtn);
  
    //Print
    let print = document.createElement("input");
    print.type = "button";
    print.value = "Print";
    print.classList = "BYUbutton";
    print.tabIndex = 18;
    print.onclick = function () {
      // printFunc is imported via script tags in the html (). Located in printSr.js
      printFunc(servReq);
      console.log("FIXME print func called");
    };
    buttonContainer.appendChild(print);
  }

  
  // Attach the submit handler to the form
  if (editForm) {
    editForm.addEventListener("submit", function(event) {
      if (!servReq){
        event.preventDefault(); // Prevent the default form submission behavior

        // Collect notes and parts to submit with the service request
        const formData = new FormData(event.target); // Extract form data
        console.log("Form data:", formData);
        formJSON = Object.fromEntries(formData)
        // Structure the data into a single json object
        const requestData = {...formJSON, newSRNotes, newSRParts};
        console.log("Request data:", requestData);
        // API call

        fetch("/NewServiceRequest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .catch(error => {
            console.error("Error:", error);
        });
        if (userRole === "Admin" || userRole === "Secretary" || userRole === "Mechanic"){
          window.location.href = $SCRIPT_ROOT + "/ServiceRequest";
        } else {
          window.location.href = $SCRIPT_ROOT + "/home";
        }
      }
    });
  } else { // if the form is not found, log an error
      console.error("Form not found. Unable to attach submit new SR event handler.");
  }

  // put the form in the div that holds it
  document.getElementById("form-holder").appendChild(editForm);
}
