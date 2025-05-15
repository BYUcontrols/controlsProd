// a function called when opening a service request window that summons and creates the notes table
function loadNotes(notesTable, requestId, serviceRequestWindowEngine) {
  // Get request setup
  let request = post(
    null,
    "GET",
    `/serviceRequestNotes/${requestId}`,
    finishLoadNotes
  );
  // attach data to the request object
  request.table = notesTable;
  request.id = requestId;
  request.reqEngine = serviceRequestWindowEngine;

  console.log("SR WINDOW ENGINE");
  console.log(serviceRequestWindowEngine);
}

// Called on return of the request form loadParts()
function finishLoadNotes() {
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
  createInputNewNoteRow(requestContext);
}

/* Function that takes a rowEngine template for the notes table and outputs a  */

function createInputNewNoteRow(requestContext) {
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
  // set edit to to true for the inputEngine
  inputEngine.editing = true;
  // set the 'new' id for the input engine
  inputEngine.id = "new";
  // load columns for the input new part
  let startColumn = function (index, defaultVal = undefined) {
    let cell = inputEngine.fields[index];
    // create the cell for the input field
    cell.htmlRef = document.createElement("td");
    // call the .edit() member on that cell to create the input field
    cell.edit(defaultVal);
    // put the cell in it's place in the table
    inputEngine.rowRef.append(cell.htmlRef);
  };
  // load the note column
  startColumn(0);
  // create the placeholder cell for the userId
  let userCell = document.createElement("td");
  inputEngine.rowRef.append(userCell);
  // create the 'private' selector
  startColumn(2, "False"); // default value False
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
  let button = generateByuButton("+Note", function () {
    // call the saveRow() method
    inputEngine.saveRow(null, null, customSaveFunction);
  });

  // place that button in its place
  inputButtons.append(button);
  inputButtons.classList.add("srPartsNewSaveBtnCell");
}

// START MASON

// clears the creation form when you click the cancel button
function notePopCancel() {
  document.getElementById("note").value = "";
  document.getElementById("public").checked = true;
  document.getElementById("noteinputBy").value = "";
  document.getElementById("modDate").value = "";

  document.getElementById("addNotePop").style.display = "none";
  document.body.style.overflow = "auto"; // Enable scrolling when the modal is closed
}

// creates and handles the popup and form for adding a new note
function addNoteModal() {
  // create popup
  let addNotePop = document.createElement("div");
  document.getElementById("body").appendChild(addNotePop);
  addNotePop.classList = "modal";
  addNotePop.setAttribute("id", "addNotePop");
  addNotePop.style.display = "none";

  // create popup content
  let addNotePopCon = document.createElement("div");
  document.getElementById("addNotePop").appendChild(addNotePopCon);
  addNotePopCon.classList = "modal-content";
  addNotePopCon.setAttribute("id", "addNotePop-content");
  let title = document.createElement("h2");
  title.innerHTML = "Add Note";
  addNotePopCon.appendChild(title);

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
    notePopCancel();
  };
  // Add the SVG button to the modal content
  addNotePopCon.appendChild(xButton);

  // create the form
  let addNotePopForm = document.createElement("form");
  document.getElementById("addNotePop-content").appendChild(addNotePopForm);
  addNotePopForm.setAttribute("id", "addNotePopForm");
  addNotePopForm.method = "post";
  addNotePopForm.action = $SCRIPT_ROOT + "/NewServiceRequest";

  /////////////////   FORM START  ///////////////////////

  // if it's a new service request form, each note is given a temporary id
  if (!servReq) {
    // newNoteTempId
    const newNoteTempIdDiv = document.createElement("div");
    newNoteTempIdDiv.id = "newNoteTempIdDiv";
    newNoteTempIdDiv.style.display = "none"; // makes it so the temporary note id exists but is not shown on screen
    createLabel("newNoteTempId", "Request Note Temporary ID", newNoteTempIdDiv);
    let newNoteTemp = createInputElement(
      "number",
      "newNoteTempId",
      newNoteTempIdDiv
    );
    addNotePopForm.appendChild(newNoteTempIdDiv);
    // addNotePopForm.appendChild(document.createElement("br"));
  }

  // Note
  const noteDiv = document.createElement("div");
  noteDiv.id = "noteDiv";
  noteDiv.classList.add("textInput");
  createLabel("note", "Note", noteDiv);
  createDescription("note", noteDiv);
  addNotePopForm.appendChild(noteDiv);

  // Public
  createLabel("public", "Public", addNotePopForm);
  createInputElement("checkbox", "public", addNotePopForm);
  addNotePopForm.appendChild(document.createElement("br"));

  // Modified Date
  const modDateDiv = document.createElement("div");
  modDateDiv.id = "modDateDiv";
  modDateDiv.classList.add("textInput");
  createLabel("modDate", "Modified Date", modDateDiv);
  createInputElement("datetime-local", "modDate", modDateDiv);
  addNotePopForm.appendChild(modDateDiv);

  // Input By
  const inputByDiv = document.createElement("div");
  inputByDiv.id = "inputByDiv";
  inputByDiv.classList.add("textInput");
  createLabel("noteinputBy", "Input By", inputByDiv);
  createInputElement("text", "noteinputBy", inputByDiv);
  addNotePopForm.appendChild(inputByDiv);
  addNotePopForm.appendChild(document.createElement("br"));

  createInputElement("number", "servReqId", addNotePopForm);
  // if editing a SR set to SR.id else set to userNextId (IDK where userNextId is defined)
  document.getElementById("servReqId").value = servReq
    ? servReq["servReqId"]
    : userNextId;

  /////////////////   FORM END    ////////////////////////////

  //submit
  let addNotePopsubmit = document.createElement("input");
  addNotePopsubmit.type = "submit";
  addNotePopsubmit.value = "Create";
  addNotePopsubmit.id = "addNotePopSubmit";
  addNotePopForm.appendChild(addNotePopsubmit);

  // if new SR then prevent default and add the note to the SR form to be submitted at the same time.
  addNotePopForm.addEventListener("submit", function (event) {
    // log the form data for debugging
    // let formData = new FormData(addNotePopForm);
    // // Iterate over the FormData and log key-value pairs
    // formData.forEach((value, key) => {
    //     console.log(`${key}: ${value}`);
    // });
    if (!servReq) {
      event.preventDefault();
      // display the table header if it is hidden
      document.getElementById("notesTableHeader").style.display = "";

      let newNoteTempId = document.getElementById("newNoteTempId").value;
      3;
      let note = document.getElementById("note").value;
      let isPublic = document.getElementById("public").checked;
      let inputBy = document.getElementById("noteinputBy").value;
      let modDate = document.getElementById("modDate").value;

      let newNote = {
        newNoteTempId: newNoteTempId,
        note: note,
        public: isPublic,
        inputBy: inputBy,
        modDate: modDate,
      };
      newSRNotes.push(newNote);
      // Gives newNoteCounter counter for newNoteTempId one more each time a new note is submitted
      window.newServiceRequestNoteCounter++;

      // Assuming there's a global array to hold notes for the new service request
      if (!window.newServiceRequestNotes) {
        window.newServiceRequestNotes = [];
      }
      window.newServiceRequestNotes.push(newNote);

      // Clear the form
      notePopCancel();
      // enable scrolling
      window.body.style.overflow = "auto";
      // update the UI
      if (!servReq) {
        populateNotesTable(document.getElementById("notesTableBody"));
      }
      // const noteTable = document.getElementById("notesTableBody");
      // const formattedDate = new Date(newNote.modDate).toUTCString();
      // const newRow = `<tr id="notesrow">
      //   <td onclick="sendNoteId()" style="cursor: pointer;">
      //     <svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512">
      //       <path d="M384 224v184a40 40 0 01-40 40H104a40 40 0 01-40-40V168a40 40 0 0140-40h167.48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
      //       <path d="M459.94 53.25a16.06 16.06 0 00-23.22-.56L424.35 65a8 8 0 000 11.31l11.34 11.32a8 8 0 0011.34 0l12.06-12c6.1-6.09 6.67-16.01.85-22.38zM399.34 90L218.82 270.2a9 9 0 00-2.31 3.93L208.16 299a3.91 3.91 0 004.86 4.86l24.85-8.35a9 9 0 003.93-2.31L422 112.66a9 9 0 000-12.66l-9.95-10a9 9 0 00-12.71 0z"/>
      //     </svg>
      //   </td>
      //   <td>${newNote.newNoteTempId}</td>
      //   <td>${newNote.note}</td>
      //   <td>${newNote.inputBy}</td>
      //   <td>${formattedDate}</td>
      // </tr>`;
      // noteTable.innerHTML += newRow;
    } else {
      // Store the current scroll position (this will be used to restore position on reload)
      localStorage.setItem(
        "scrollPosition",
        window.scrollY || document.documentElement.scrollTop
      );
    }
  });

  //cancel
  let addNotePopcancel = document.createElement("input");
  addNotePopcancel.type = "button";
  addNotePopcancel.value = "Cancel";
  addNotePopcancel.onclick = function () {
    notePopCancel();
    document.body.style.overflow = "auto";
  };
  addNotePopForm.appendChild(addNotePopcancel);

  // function that opens the popup
  let openFunction = function () {
    addNotePop.style.display = "block";
    document.getElementById("noteinputBy").value = userName;
    document.getElementById("modDate").value = new Date().toDateInputValue();
    if (!servReq){
        document.getElementById("newNoteTempId").value =
        window.newServiceRequestNoteCounter; // Set the counter value
    };
    closeModalByClickingOutside();
  };
  addNotePop.open = openFunction;
}


// opens the editor form with a specific note loaded
function sendNoteId() {
  document.body.style.overflow = "hidden"; // Prevent scrolling when the modal is open
  if (servReq) {
    let reqnoteid = parseInt(this.id);
    editnotepop.open(reqnoteid);
  } else {
    let newSRNote = this;
    editnotepop.open(newSRNote);
  }
}

// creates and handles the popup and form for editing an existing note
function editNoteModal() {
  // create popup
  let editnotepop = document.createElement("div");
  document.getElementById("body").appendChild(editnotepop);
  editnotepop.classList = "modal";
  editnotepop.setAttribute("id", "editnotepop");
  editnotepop.style.display = "none";

  // Create popup content
  let editnotepopCon = document.createElement("div");
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
    editNoteCancel(); // Call the function when the close button is clicked
  };
  // Add the SVG button to the modal content
  editnotepopCon.appendChild(xButton);
 
  // Create the title
  let title = document.createElement("h2");
  title.innerHTML = "Edit Note";
  editnotepopCon.appendChild(title);

  editnotepop.appendChild(editnotepopCon);
  editnotepopCon.classList = "modal-content";
  editnotepopCon.setAttribute("id", "editnotepop-content");

  // create the form
  let editnotepopForm = document.createElement("form");
  editnotepopCon.appendChild(editnotepopForm);
  editnotepopForm.setAttribute("id", "editnotepopForm");
  editnotepopForm.method = "post";
  editnotepopForm.action = $SCRIPT_ROOT + "/NewServiceRequest";

  /////////////////   BUILD THE FORM  ////////////////////////
  /*
        modifiedDate (server side)

    */
  // Display this information, but it is not editable
  // requestNoteId
  createLabel("requestNoteId", "Request Note ID", editnotepopForm);
  createInputElement("number", "requestNoteId", editnotepopForm);
  editnotepopForm.appendChild(document.createElement("br"));

  // // inputDate
  // createLabel("noteinputDate", "Input Date", editnotepopForm);
  // createInputElement("datetime-local", "noteinputDate", editnotepopForm);
  // // editnotepopForm.appendChild(document.createElement("br"));
  // // this is for breaks that aren't working
  // let breakReplacement = document.createElement('div');
  // breakReplacement.style.height = '13.5px';
  // editnotepopForm.appendChild(breakReplacement);

  // userIdInput/userIdCreator
  createLabel("noteCreator", "Creator", editnotepopForm);
  createInputElement("text", "noteCreator", editnotepopForm);
  editnotepopForm.appendChild(document.createElement("br"));

  // // date
  // if (servReq) {
  // createLabel("editnotetoday", "Modified Date", editnotepopForm);
  // createInputElement("datetime-local", "editnotetoday", editnotepopForm);
  // editnotepopForm.appendChild(document.createElement("br"));
  // };

  // editnotepopForm.appendChild(document.createElement("br"));

  // This is editable by the user
  // Note
  createLabel("editnote", "Note", editnotepopForm);
  let noteText = document.createElement("textarea");
  noteText.setAttribute("id", "editnote");
  noteText.name = "editnote";
  noteText.required = true;
  noteText.style.width = "100%";
  editnotepopForm.appendChild(noteText);
  editnotepopForm.appendChild(document.createElement("br"));

  // Public
  if (servReq) {
    createLabel("editpublic", "Public", editnotepopForm);
    createInputElement("checkbox", "editpublic", editnotepopForm);
    editnotepopForm.appendChild(document.createElement("br"));

    createInputElement("number", "servReqId", editnotepopForm);
  };

  // line break for aesthetics
  editnotepopForm.appendChild(document.createElement("br"));

  /////////////////   FORM END    ////////////////////////////
  //submit
  let editnotesubmit = document.createElement("input");
  if (servReq) {
    editnotesubmit.type = "submit";
  } else if (!servReq) {
    editnotesubmit.type = "button";
    editnotesubmit.onclick = function () {
      // Get the value of the note ID to be edited (newNoteTempId)
      let noteIdToEdit = document.getElementById("requestNoteId").value;

      // Find the index of the map in the newSRNotes array using the newNoteTempId
      let noteIndex = newSRNotes.findIndex(note => note.newNoteTempId == noteIdToEdit);

      // If the note with the matching newNoteTempId is found
      if (noteIndex !== -1) {
        // Update the note with the new values
        newSRNotes[noteIndex].note = document.getElementById("editnote").value;
      };
      // reload the notes table to reflect the changes
      populateNotesTable(document.getElementById("notesTableBody"));
      // close the window
      editNoteCancel();
    };
  };
  editnotesubmit.id = "editnotepopsubmit";
  editnotesubmit.value = "Save";
  editnotepopForm.appendChild(editnotesubmit);

  editnotepopForm.addEventListener("submit", () => {
    // Store the current scroll position (this will be used to restore position on reload)
    let scrollPosition = window.scrollY || document.documentElement.scrollTop;
    localStorage.setItem("scrollPosition", scrollPosition);
  });

  // Prevents enter key adding a line (\n) and sumbits edit note pop form instead
  noteText.addEventListener("keydown", function (enter_key_pressed) {
    if (
      enter_key_pressed.key === "Enter" ||
      enter_key_pressed.key === "Return"
    ) {
      // when enter or return is pressed, it will submit the note
      enter_key_pressed.preventDefault();
      document.getElementById("editnotepopsubmit").click();
    }
  });

  //delete
  let editnotedelete = document.createElement("input");
  editnotedelete.type = "button";
  editnotedelete.id = "deletebutton";
  editnotedelete.value = "Delete";
  editnotedelete.onclick = function () {
    if (servReq) {
      console.log("this should NOT be showing")
      // create the form
      let deletenoteForm = document.createElement("form");
      body.appendChild(deletenoteForm);
      deletenoteForm.setAttribute("id", "deletenoteForm");
      deletenoteForm.method = "post";
      deletenoteForm.action = $SCRIPT_ROOT + "/NewServiceRequest";

      let remove = document.createElement("input");
      remove.type = "text";
      remove.name = "deleteNote";
      remove.value = document.getElementById("requestNoteId").value;
      deletenoteForm.appendChild(remove);

      let servReqId = document.createElement("input");
      servReqId.type = "number";
      servReqId.name = "servReqId";
      servReqId.value = servReq["servReqId"];
      deletenoteForm.appendChild(servReqId);
      // Store the current scroll position
      let scrollPosition = window.scrollY || document.documentElement.scrollTop;
      console.log("scrollPosition", scrollPosition);
      localStorage.setItem("scrollPosition", scrollPosition);
      deletenoteForm.submit();
    } else if (!servReq) {
      // Get the value of the note ID to be deleted (newNoteTempId)
      let noteIdToDelete = document.getElementById("requestNoteId").value;

      // Find the index of the map in the newSRNotes array using the newNoteTempId
      let noteIndex = newSRNotes.findIndex(note => note.newNoteTempId == noteIdToDelete);

      // If the note with the matching newNoteTempId is found
      if (noteIndex !== -1) {
        // Remove the map from the newSRNotes array
        newSRNotes.splice(noteIndex, 1);
      };

      // Store the current scroll position
      let scrollPosition = window.scrollY || document.documentElement.scrollTop;
      console.log("scrollPosition", scrollPosition);
      localStorage.setItem("scrollPosition", scrollPosition);
      // reload the notes table to reflect the changes
      populateNotesTable(document.getElementById("notesTableBody"));
      // close the window
      editNoteCancel();
    };
  };
  editnotepopForm.appendChild(editnotedelete);

  // function that opens the popup
  let openFunction = function (id) {
    if (servReq) {
      editnotepop.style.display = "block";
      document.getElementById("requestNoteId").value =
        servReq["notes"][id]["reqNoteId"];
      // document.getElementById("noteinputDate").value =
      //   servReq["notes"][id]["inputDate"];
      document.getElementById("noteCreator").value =
        servReq["notes"][id]["userCreator"];
      // document.getElementById("editnotetoday").value =
      //   new Date().toDateInputValue();

      document.getElementById("editnote").value = servReq["notes"][id]["note"];
      if (servReq["notes"][id]["private"]) {
        document.getElementById("editpublic").checked = false;
      } else {
        document.getElementById("editpublic").checked = true;
      }

      if (userName == servReq["notes"][id]["userCreator"]) {
        document.getElementById("editnote").readOnly = false;
      } else {
        document.getElementById("editnote").readOnly = true;
      }

      // document.getElementById("noteinputDate").value = sqlDateToUsableDate(
      //   servReq["notes"][id]["inputDate"]
      // );
    } else if (!servReq) {
      // id is the newSRNote that is passed from the populateNotesTable function in editSRHelper.js
      editnotepop.style.display = "block";
      document.getElementById("requestNoteId").value =
        id["newNoteTempId"];
      // document.getElementById("noteinputDate").value =
      //   id["modDate"];
      document.getElementById("noteCreator").value =
        id["inputBy"];
      document.getElementById("editnote").value = 
        id["note"];
    };
    closeModalByClickingOutside();
  };
  editnotepop.open = openFunction;
};


// clears the edit form when you click the cancel button
function editNoteCancel() {
  document.getElementById("editnotepop").style.display = "none";
  document.getElementById("requestNoteId").value = "";
  // document.getElementById("noteinputDate").value = "";
  document.getElementById("noteCreator").value = "";
  document.getElementById("editnote").value = "";
  if (servReq) {
    document.getElementById("editpublic").checked = true;
  };
  document.body.style.overflow = "auto"; // Enable scrolling
}
