/*
    Mason
    Cleaning up the looooong editSr.js file by putting all the little helper functions in this file
*/

// code from the internet! It automatically gets the current date and time based on the timezone we are in.
Date.prototype.toDateInputValue = function () {
  var local = new Date(this);
  local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
  return local.toJSON().slice(0, 19);
};

// changes a sql formatted date into a usable format
function sqlDateToUsableDate(sqlDate) {
  if (sqlDate != null) {
    var sqlDateArr1 = sqlDate.split(" ");
    var month =
      "JanFebMarAprMayJunJulAugSepOctNovDec".indexOf(sqlDateArr1[2]) / 3 + 1;
    var monthhelper;
    if (month < 10) {
      monthhelper = "0";
    } else {
      monthhelper = "";
    }

    var usableDate =
      sqlDateArr1[3] +
      "-" +
      monthhelper +
      month +
      "-" +
      sqlDateArr1[1] +
      "T" +
      sqlDateArr1[4];

    return usableDate;
  } else {
    return null;
  }
}

// function that is run when the completed button is clicked.
function setCompleted() {
  let completed = document.getElementById("completed");
  completed.value = new Date().toDateInputValue();

  let completedBtn = document.getElementById("completedBtn");
  completedBtn.setAttribute("onclick", "removeCompleted()");
  completedBtn.setAttribute("value", "Mark Request Not Completed");
}
// function that is run to un-set the date completed.
function removeCompleted() {
  let completed = document.getElementById("completed");
  completed.value = "";

  let completedBtn = document.getElementById("completedBtn");
  completedBtn.setAttribute("onclick", "setCompleted()");
  completedBtn.setAttribute("value", "Mark Request Completed");
}

function tabIndexInit() {
  // remove the byu button in the header from the tab order
  let domHeaderElement = document.querySelector(".byu-component-rendered");
  let myHeaderShadowRoot = domHeaderElement && domHeaderElement.shadowRoot;
  let byuLink = myHeaderShadowRoot.querySelector('a[href*="//byu.edu"]');
  byuLink.tabIndex = -1;

  // remove the login button from the tab order
  let allLinks = document.getElementsByTagName("a");
  for (var i = 0; i < allLinks.length; i++) {
    if (allLinks[i].slot == "login") {
      allLinks[i].tabIndex = -1;
    }
  }

  // remove the links from the footer from the tab order
  let domFooterElement = document.querySelector("byu-footer");
  let myFooterShadowRoot = domFooterElement && domFooterElement.shadowRoot;
  let topFooterLink = myFooterShadowRoot.querySelector(
    'a[href*="home.byu.edu"]'
  );
  topFooterLink.tabIndex = -1;
  let phoneFooterLink = myFooterShadowRoot.querySelector(
    'a[href*="tel:18014224636"]'
  );
  phoneFooterLink.tabIndex = -1;
}

function populateNotesTable(notetableBod) {
  notetableBod.innerHTML = ""; // Clear the table body first

  if (newSRNotes && newSRNotes.length > 0) {
    for (let note of newSRNotes) {
      let notestBodRow = document.createElement("tr");
      notestBodRow.id = note["newNoteTempId"];
      notetableBod.appendChild(notestBodRow);

      let edit = document.createElement("td");
      // Edit icon
      edit.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><path d="M384 224v184a40 40 0 01-40 40H104a40 40 0 01-40-40V168a40 40 0 0140-40h167.48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path d="M459.94 53.25a16.06 16.06 0 00-23.22-.56L424.35 65a8 8 0 000 11.31l11.34 11.32a8 8 0 0011.34 0l12.06-12c6.1-6.09 6.67-16.01.85-22.38zM399.34 90L218.82 270.2a9 9 0 00-2.31 3.93L208.16 299a3.91 3.91 0 004.86 4.86l24.85-8.35a9 9 0 003.93-2.31L422 112.66a9 9 0 000-12.66l-9.95-10a9 9 0 00-12.71 0z"/></svg>';
      edit.style = "cursor: pointer;";
      edit.onclick = sendNoteId.bind(note);
      notestBodRow.appendChild(edit);
      let noteid = createTableCell(note["newNoteTempId"]);
      notestBodRow.appendChild(noteid);
      let notecontent = createTableCell(note["note"]);
      notestBodRow.appendChild(notecontent);
      let noteinputBy = createTableCell(note["inputBy"]);
      notestBodRow.appendChild(noteinputBy);
      let noteDate = createTableCell(note["modDate"]);
      notestBodRow.appendChild(noteDate);
    }
  } else {
    let tableHead = document.getElementById("notesTableHeader");
    tableHead.style.display = "none";
    console.log("newSRNotes is empty or undefined");
  }
};


function populateItemsTable(tableBod) {
  tableBod.innerHTML = ""; // Clear the table body first

  if (newSRItems && newSRItems.length > 0) {
    for (let item of newSRItems) {
      let tBodRow = document.createElement("tr");
      tBodRow.id = item["newItemTempId"];
      tableBod.appendChild(tBodRow);

      let edit = document.createElement("td");
      // Edit icon
      edit.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><path d="M384 224v184a40 40 0 01-40 40H104a40 40 0 01-40-40V168a40 40 0 0140-40h167.48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path d="M459.94 53.25a16.06 16.06 0 00-23.22-.56L424.35 65a8 8 0 000 11.31l11.34 11.32a8 8 0 0011.34 0l12.06-12c6.1-6.09 6.67-16.01.85-22.38zM399.34 90L218.82 270.2a9 9 0 00-2.31 3.93L208.16 299a3.91 3.91 0 004.86 4.86l24.85-8.35a9 9 0 003.93-2.31L422 112.66a9 9 0 000-12.66l-9.95-10a9 9 0 00-12.71 0z"/></svg>';
      edit.style = "cursor: pointer;";
      edit.onclick = sendItemId.bind(item);
      tBodRow.appendChild(edit);
      let noteid = createTableCell(item["newItemTempId"]);
      tBodRow.appendChild(noteid);
      let notecontent = createTableCell(item["items"]);
      tBodRow.appendChild(notecontent);
      let noteinputBy = createTableCell(item["inputBy"]);
      tBodRow.appendChild(noteinputBy);
      let quantity = createTableCell(item["itemquantity"]);
      tBodRow.appendChild(quantity);
      let voidedItem = createTableCell(item["voided"]);
      tBodRow.appendChild(voidedItem);
    }
  } else {
    let itemsTableHead = document.getElementById("itemsTableHeader");
    itemsTableHead.style.display = "none";
    console.log("newSRItems is empty or undefined");
  }
}
