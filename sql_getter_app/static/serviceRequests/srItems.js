// a function called when opening a service request window that summons and creates the items
function loadItems(itemsTable, requestId, serviceRequestWindowEngine) {
  // Get request setup
  let request = post(
    null,
    "GET",
    `/serviceRequestItems/${requestId}`,
    finishLoadItems
  );
  // attach data to the request object
  request.table = itemsTable;
  request.id = requestId;
  request.reqEngine = serviceRequestWindowEngine;
}

// Called on return of the request form loadItems()
function finishLoadItems() {
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
  createInputNewItemRow(requestContext);
}

function createInputNewItemRow(requestContext) {
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
  // set edit to true for the inputEngine
  inputEngine.editing = true;
  // set the 'new' id for the input engine
  inputEngine.id = "new";
  // load columns for the input new item
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
  // start the item column
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
  let button = generateByuButton("+Item", function () {
    // call the saveRow() method
    inputEngine.saveRow(null, null, customSaveFunction);
    console.log(inputEngine);
  });

  // place that button in its place
  inputButtons.append(button);
  inputButtons.classList.add("srItemsNewSaveBtnCell");
}

// START MASON

function addItemModal() {
  // create popup
  let itempop = document.createElement("div");

  document.getElementById("body").appendChild(itempop);
  itempop.classList = "modal";
  itempop.setAttribute("id", "itempop");
  itempop.style.display = "none";

  // create popup content
  let itempopCon = document.createElement("div");
  document.getElementById("itempop").appendChild(itempopCon);
  itempopCon.classList = "modal-content";
  itempopCon.setAttribute("id", "itempopup-content");
  let title = document.createElement("h2");
  title.innerHTML = "Add Item";
  itempopCon.appendChild(title);

/////////////////////// START ADD ITEM FORM   ////////////////////////////

  // create the form
  let itempopForm = document.createElement("form");
  document.getElementById("itempopup-content").appendChild(itempopForm);
  itempopForm.setAttribute("id", "addItemForm");
  itempopForm.method = "post";
  itempopForm.action = $SCRIPT_ROOT + "/NewServiceRequest";

  // create the Item label
  const itemDiv = document.createElement("div");
  itemDiv.id = "itemDiv";
  itemDiv.classList.add("textInput");
  createLabel("items", "Items", itemDiv);
  createDropdownElement("items", "items", itemDiv); // onclick clear the input field
  createDatalistElement("items", items, itemDiv);
  itempopForm.appendChild(itemDiv);

  // create the Quantity label
  const quantityDiv = document.createElement("div");
  quantityDiv.id = "itemQuant";
  quantityDiv.classList.add("numericInput");
  createLabel("itemquantity", "Quantity", quantityDiv);
  // create the input element
  let input = document.createElement("input");
  // set the input type
  input.setAttribute("type", "number");
  // give the input an id
  input.setAttribute("id", "itemquantity");
  input.name = "itemquantity";
  input.min = 0;
  quantityDiv.appendChild(input);
  itempopForm.appendChild(quantityDiv);

  // create the Void label
  const voidDiv = document.createElement("div");
  voidDiv.id = "itemVoid";
  voidDiv.classList.add("checkboxInput");
  createLabel("itemvoid", "Void", voidDiv);
  createInputElement("checkbox", "itemvoid", voidDiv);
  itempopForm.appendChild(voidDiv);

  // Input By
  const inputByDiv = document.createElement("div");
  inputByDiv.id = "inputByDiv";
  inputByDiv.classList.add("textInput");
  createLabel("inputBy", "Input By", inputByDiv);
  createInputElement("text", "inputBy", inputByDiv);
  itempopForm.appendChild(inputByDiv);
  itempopForm.appendChild(document.createElement("br"));

  // line break for aesthetics
  itempopForm.appendChild(document.createElement("br"));

  createInputElement("number", "servReqId", itempopForm);

//////////////////////////  END ADD ITEM FORM    ///////////////////////////

  //submit
  let itemsubmit = document.createElement("input");
  itemsubmit.type = "submit";
  itemsubmit.value = "Create";
  itempopForm.appendChild(itemsubmit);
  itemsubmit.onclick = function () {
    // save scroll position to restore after reload
    localStorage.setItem("scrollPosition", window.scrollY || document.documentElement.scrollTop);
  }
  if(!servReq) {
    itempopForm.addEventListener("submit", function (event) {
      if (!servReq) {
        event.preventDefault();
        document.getElementById("itemsTableHeader").style.display = "";
        // Get the values from the form
        const items = document.getElementById("items").value;
        const inputBy = document.getElementById("inputBy").value;
        const itemquantity = document.getElementById("itemquantity").value;
        const voided = document.getElementById("itemvoid").checked;

        // Create a new item object
        const newItem = {
          items, itemquantity, voided, inputBy,
        };
        newSRItems.push(newItem);

        // Add the new item to the service request form
        // FIXME (write logic here)
        // Close the modal
        itemCancel();
        // enable scrolling
        document.body.style.overflow = "auto";
        // update UI
        const itemsTable = document.getElementById("tableBody");
        const newRow = `<tr>
          <td></td>
          <td></td>
          <td>${items}</td>
          <td>${inputBy}</td>
          <td>${itemquantity}</td>
          <td>${voided ? "Yes" : "No"}</td>
        </tr>`;
        itemsTable.innerHTML += newRow;
      }
    });
  };

  //cancel
  let itemcancel = document.createElement("input");
  itemcancel.type = "button";
  itemcancel.value = "Cancel";
  itemcancel.onclick = function () {
    itemCancel();
    document.body.style.overflow = "auto";
  };
  itempopForm.appendChild(itemcancel);

  // function that opens the popup
  let openFunction = function () {
    itempop.style.display = "block";
    document.getElementById("inputBy").value = userName;
  };
  itempop.open = openFunction;
}

function itemCancel() {
  document.getElementById("items").value = "";
  document.getElementById("itemquantity").value = "";
  document.getElementById("itemvoid").checked = false;
  document.getElementById("inputBy").value = "";
  itempop.style.display = "none";
}

function newItemModal() {
  // create popup
  let newitempop = document.createElement("div");
  document.getElementById("body").appendChild(newitempop);
  newitempop.classList = "modal";
  newitempop.setAttribute("id", "newitempop");
  newitempop.style.display = "none";

  // create popup content
  let newitempopCon = document.createElement("div");
  document.getElementById("newitempop").appendChild(newitempopCon);
  newitempopCon.classList = "modal-content";
  newitempopCon.setAttribute("id", "newitempop-content");

  // create the form
  let newitempopForm = document.createElement("form");
  document.getElementById("newitempop-content").appendChild(newitempopForm);
  newitempopForm.setAttribute("id", "newitempopForm");
  newitempopForm.method = "post";
  newitempopForm.action = $SCRIPT_ROOT + "/NewServiceRequest";

  /////////////////   BUILD THE NEW ITEM FORM  ////////////////////////

  // title
  const title = document.createElement("h2");
  title.innerText = "Create Item"
  newitempopForm.appendChild(title)

  // description
  createLabel("newitemdescription", "Description", newitempopForm);
  createDescription("newitemdescription", newitempopForm);
  newitempopForm.appendChild(document.createElement("br"));

  // modelNumber
  createLabel("newitemmodelNumber", "Model Number", newitempopForm);
  createInputElement("text", "newitemmodelNumber", newitempopForm);
  newitempopForm.appendChild(document.createElement("br"));

  // vendorId (the user only sees the vendor's name)
  createLabel("newitemVendor", "Vendor", newitempopForm);
  createDropdownElement("newitemVendorList", "newitemVendor", newitempopForm);
  createDatalistElement("newitemVendorList", itemvendors, newitempopForm);
  newitempopForm.appendChild(document.createElement("br"));

  // minimumToStock
  createLabel("newitemMinStock", "Minimum To Stock", newitempopForm);
  createInputElement("number", "newitemMinStock", newitempopForm);
  newitempopForm.appendChild(document.createElement("br"));

  // manufacturerId
  createLabel("newitemManu", "Manufacturer", newitempopForm);
  createDropdownElement("newitemManuList", "newitemManu", newitempopForm);
  createDatalistElement("newitemManuList", manufacturers, newitempopForm);
  newitempopForm.appendChild(document.createElement("br"));

  // deviceTypeId
  createLabel("newitemdeviceType", "Device Type", newitempopForm);
  createDropdownElement(
    "newitemdeviceTypeList",
    "newitemdeviceType",
    newitempopForm
  );
  createDatalistElement("newitemdeviceTypeList", deviceTypes, newitempopForm);
  newitempopForm.appendChild(document.createElement("br"));

  // deviceSubTypeId
  createLabel("newitemdeviceSubType", "Device Sub-Type", newitempopForm);
  createDropdownElement(
    "newitemdeviceSubTypeList",
    "newitemdeviceSubType",
    newitempopForm
  );
  createDatalistElement(
    "newitemdeviceSubTypeList",
    deviceSubTypes,
    newitempopForm
  );
  newitempopForm.appendChild(document.createElement("br"));
  newitempopForm.appendChild(document.createElement("br"));

  createInputElement("number", "servReqId", newitempopForm);

  /////////////////   NEW ITEM FORM END    ////////////////////////////

  //submit
  let newitemsubmit = document.createElement("input");
  newitemsubmit.type = "submit";
  newitemsubmit.value = "Create";
  newitempopForm.appendChild(newitemsubmit);

  newitemsubmit.onclick = function () {
    // save scroll position to restore after reload
    localStorage.setItem("scrollPosition", window.scrollY || document.documentElement.scrollTop);
  }

  //cancel
  let newitemcancel = document.createElement("input");
  newitemcancel.type = "button";
  newitemcancel.value = "Cancel";
  newitemcancel.onclick = function () {
    newitemCancel();
  };
  newitempopForm.appendChild(newitemcancel);

  // function that opens the popup
  let openFunction = function () {
    newitempop.style.display = "block";
  };
  newitempop.open = openFunction;
}

function newitemCancel() {
  document.getElementById("newitemdescription").value = "";
  document.getElementById("newitemmodelNumber").value = "";
  document.getElementById("newitemVendor").value = "";
  document.getElementById("newitemMinStock").value = "";
  document.getElementById("newitemManu").value = "";
  document.getElementById("newitemdeviceType").value = "";
  document.getElementById("newitemdeviceSubType").value = "";

  newitempop.style.display = "none";
}

function sendItemId() {
  let reqitemid = parseInt(this.id);
  editItemPop.open(reqitemid);
}

function editItemModal() {
  // create popup
  let editItemPop = document.createElement("div");
  document.getElementById("body").appendChild(editItemPop);
  editItemPop.classList = "modal";
  editItemPop.setAttribute("id", "editItemPop");
  editItemPop.style.display = "none";

  // create popup content
  let editItemPopCon = document.createElement("div");
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
    editItemCancel();
  };
  // Add the SVG button to the modal content
  editItemPopCon.appendChild(xButton);
  editItemPop.appendChild(editItemPopCon);
  editItemPopCon.classList = "modal-content";
  editItemPopCon.setAttribute("id", "editItemPop-content");

  // create the form
  let editItemPopForm = document.createElement("form");
  editItemPopCon.appendChild(editItemPopForm);
  editItemPopForm.setAttribute("id", "editItemPopForm");
  editItemPopForm.method = "post";
  editItemPopForm.action = $SCRIPT_ROOT + "/NewServiceRequest";

  /////////////////   BUILD THE FORM  ////////////////////////
  // Display this information, but it is not editable
  // requestItemId
  createLabel("requestItemId", "Request Item ID", editItemPopForm);
  createInputElement("number", "requestItemId", editItemPopForm);
  editItemPopForm.appendChild(document.createElement("br"));

  // itemId
  createLabel("itemId", "Item ID", editItemPopForm);
  createInputElement("number", "itemId", editItemPopForm);
  editItemPopForm.appendChild(document.createElement("br"));

  editItemPopForm.appendChild(document.createElement("br"));

  // This is editable by the user
  // voided
  createLabel("edititemvoid", "Void", editItemPopForm);
  createInputElement("checkbox", "edititemvoid", editItemPopForm);
  editItemPopForm.appendChild(document.createElement("br"));

  // status
  createLabel("itemStat", "Status", editItemPopForm);
  createDropdownElement("itemStatList", "itemStat", editItemPopForm);
  createDatalistElement("itemStatList", itemStatus, editItemPopForm);
  editItemPopForm.appendChild(document.createElement("br"));

  // quantity
  createLabel("itemQuan", "Quantity", editItemPopForm);
  // create the input element
  let input = document.createElement("input");
  // set the input type
  input.setAttribute("type", "number");
  // give the input an id
  input.setAttribute("id", "itemQuan");
  input.name = "itemQuan";
  input.min = 0;
  editItemPopForm.appendChild(input);
  editItemPopForm.appendChild(document.createElement("br"));

  createInputElement("number", "servReqId", editItemPopForm);

  /////////////////   FORM END    ////////////////////////////

  //submit
  let edititemsubmit = document.createElement("input");
  edititemsubmit.type = "submit";
  edititemsubmit.value = "Save";
  editItemPopForm.appendChild(edititemsubmit);

  edititemsubmit.onclick = function () {
    // save scroll position to restore after reload
    localStorage.setItem("scrollPosition", window.scrollY || document.documentElement.scrollTop);
  }

  //delete
  let edititemdelete = document.createElement("input");
  edititemdelete.type = "button";
  edititemdelete.value = "Delete";
  edititemdelete.onclick = function () {
    // save scroll position to restore after reload
    localStorage.setItem("scrollPosition", window.scrollY || document.documentElement.scrollTop);
    // create the form
    let deleteitemForm = document.createElement("form");
    body.appendChild(deleteitemForm);
    deleteitemForm.setAttribute("id", "deleteitemForm");
    deleteitemForm.method = "post";
    deleteitemForm.action = $SCRIPT_ROOT + "/NewServiceRequest";

    let remove = document.createElement("input");
    remove.type = "text";
    remove.name = "deleteItem";
    remove.value = document.getElementById("requestItemId").value;
    deleteitemForm.appendChild(remove);

    let servReqId = document.createElement("input");
    servReqId.type = "number";
    servReqId.name = "servReqId";
    servReqId.value = servReq["servReqId"];
    deleteitemForm.appendChild(servReqId);

    deleteitemForm.submit();
  };
  editItemPopForm.appendChild(edititemdelete);

  // function that opens the popup
  let openFunction = function (id) {
    editItemPop.style.display = "block";
    document.getElementById("requestItemId").value =
      servReq["items"][id]["reqItemId"];
    document.getElementById("itemId").value = servReq["items"][id]["itemId"];
    if (servReq["items"][id]["void"]) {
      document.getElementById("edititemvoid").checked = true;
    }
    document.getElementById("itemStat").value = servReq["items"][id]["status"];
    document.getElementById("itemQuan").value =
      servReq["items"][id]["quantity"];
  };
  editItemPop.open = openFunction;
}

function editItemCancel() {
  document.getElementById("editItemPop").style.display = "none";
  document.getElementById("requestItemId").value = "";
  document.getElementById("itemId").value = "";
  document.getElementById("edititemvoid").checked = false;
  document.getElementById("itemStat").value = "";
  document.getElementById("itemQuan").value = "";
}
