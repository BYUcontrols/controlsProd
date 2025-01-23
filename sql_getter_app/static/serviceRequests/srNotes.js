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

// Called on return of the request form loadItems()
function finishLoadNotes() {
  // place the return table where it goes
  this.table.innerHTML = this.response;
  // load the rows and save the list of rowEngines returned in the rowEngine for the service request window
  // we do this so that when the service request window is closed we have a list of items and notes and people
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
  inputEngine.rowRef.classList.add("srItemsNewRow");
  // set edit to to true for the inputEngine
  inputEngine.editing = true;
  // set the 'new' id for the input engine
  inputEngine.id = "new";
  // load columns for the input new item
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
    inputEngine.rowRef.classList.remove("srItemsNewRow");
    // remove the + item button
    inputButtons.innerHTML = "";
    inputButtons.append(inputEngineOptions);
    inputButtons.classList.remove("srItemsNewSaveBtnCell");
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
    createInputNewItemRow(requestContext);
    // It's not an infinite loop I swear. This part of the code is run when the user clicks a button
  };

  // create an add button for the new item
  let button = generateByuButton("+Note", function () {
    // call the saveRow() method
    inputEngine.saveRow(null, null, customSaveFunction);
  });

  // place that button in its place
  inputButtons.append(button);
  inputButtons.classList.add("srItemsNewSaveBtnCell");
}

// START MASON

// clears the creation form when you click the cancel button
function notePopCancel() {
  document.getElementById("note").value = "";
  document.getElementById("public").checked = true;
  document.getElementById("noteinputBy").value = "";
  document.getElementById("modDate").value = "";

  document.getElementById("addNotePop").style.display = "none";
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

  // create the form
  let addNotePopForm = document.createElement("form");
  document.getElementById("addNotePop-content").appendChild(addNotePopForm);
  addNotePopForm.setAttribute("id", "addNotePopForm");
  addNotePopForm.method = "post";
  addNotePopForm.action = $SCRIPT_ROOT + "/NewServiceRequest";

  /////////////////   FORM START  ///////////////////////

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
  addNotePopsubmit.id = 'addNotePopSubmit';
  addNotePopForm.appendChild(addNotePopsubmit);

  // if new SR then prevent default and add the note to the SR form to be submitted at the same time.
  addNotePopForm.addEventListener("submit", function (event) {
    if (!servReq) {
      event.preventDefault();
      // display the table header if it is hidden
      document.getElementById("notesTableHeader").style.display = "";

      let note = document.getElementById("note").value;
      let isPublic = document.getElementById("public").checked;
      let inputBy = document.getElementById("noteinputBy").value;
      let modDate = document.getElementById("modDate").value;

      let newNote = {
        note: note,
        public: isPublic,
        inputBy: inputBy,
        modDate: modDate,
      };
      newSRNotes.push(newNote);

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
      const noteTable = document.getElementById("notestableBody");
      const formattedDate = new Date(newNote.modDate).toUTCString();
      const newRow = `<tr>
        <td id="notesrow"></td>
        <td></td>
        <td>${newNote.note}</td>
        <td>${newNote.inputBy}</td>
        <td>${formattedDate}</td>
      </tr>`;
      noteTable.innerHTML += newRow;
      // andrewhiggins
      // // Create a button
      // const button = document.createElement('button');
      // button.textContent = 'Change Note';

      // // Add the button to the document (e.g., below the table)
      // document.body.appendChild(button);

      // // Add an event listener to the button
      // button.addEventListener('click', () => {
      //     // Find the <td> element by its ID and change its content
      //     const notesRow = document.getElementById('notesrow');
      //     notesRow.textContent = 'New Note Added!';
      // });

    }else{
      // Store the current scroll position (this will be used to restore position on reload)
      localStorage.setItem("scrollPosition", window.scrollY || document.documentElement.scrollTop);
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
  };
  addNotePop.open = openFunction;
}

// opens the editor form with a specific note loaded
function sendNoteId() {
  let reqnoteid = parseInt(this.id);
  editnotepop.open(reqnoteid);
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

  // inputDate
  createLabel("noteinputDate", "Input Date", editnotepopForm);
  createInputElement("datetime-local", "noteinputDate", editnotepopForm);
  editnotepopForm.appendChild(document.createElement("br"));

  // userIdInput/userIdCreator
  createLabel("noteCreator", "Creator", editnotepopForm);
  createInputElement("text", "noteCreator", editnotepopForm);
  editnotepopForm.appendChild(document.createElement("br"));

  // date
  createLabel("editnotetoday", "Date", editnotepopForm);
  createInputElement("datetime-local", "editnotetoday", editnotepopForm);
  editnotepopForm.appendChild(document.createElement("br"));

  editnotepopForm.appendChild(document.createElement("br"));

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
  createLabel("editpublic", "Public", editnotepopForm);
  createInputElement("checkbox", "editpublic", editnotepopForm);
  editnotepopForm.appendChild(document.createElement("br"));

  createInputElement("number", "servReqId", editnotepopForm);

  /////////////////   FORM END    ////////////////////////////
  //submit
  let editnotesubmit = document.createElement("input");
  editnotesubmit.type = "submit";
  editnotesubmit.value = "Save";
  editnotepopForm.appendChild(editnotesubmit);

  editnotepopForm.addEventListener("submit", () => {
    // Store the current scroll position (this will be used to restore position on reload)
    let scrollPosition = window.scrollY || document.documentElement.scrollTop;
    localStorage.setItem("scrollPosition", scrollPosition);
  })

  //delete
  let editnotedelete = document.createElement("input");
  editnotedelete.type = "button";
  editnotedelete.value = "Delete";
  editnotedelete.onclick = function () {
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
  };
  editnotepopForm.appendChild(editnotedelete);

  // function that opens the popup
  let openFunction = function (id) {
    editnotepop.style.display = "block";
    document.getElementById("requestNoteId").value =
      servReq["notes"][id]["reqNoteId"];
    document.getElementById("noteinputDate").value =
      servReq["notes"][id]["inputDate"];
    document.getElementById("noteCreator").value =
      servReq["notes"][id]["userCreator"];
    document.getElementById("editnotetoday").value =
      new Date().toDateInputValue();

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

    document.getElementById("noteinputDate").value = sqlDateToUsableDate(
      servReq["notes"][id]["inputDate"]
    );
  };
  editnotepop.open = openFunction;
}

// clears the edit form when you click the cancel button
function editNoteCancel() {
  document.getElementById("editnotepop").style.display = "none";

  document.getElementById("requestNoteId").value = "";
  document.getElementById("noteinputDate").value = "";
  document.getElementById("noteCreator").value = "";

  document.getElementById("editnote").value = "";
  document.getElementById("editpublic").checked = true;
}
