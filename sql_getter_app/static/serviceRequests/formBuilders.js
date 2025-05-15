/*
    Mason Hunter
    Functions to more easily build dynamic forms using javascript
*/

// function that creates a label element
function createLabel(forId, labelText, form, hidden = false) {
  // create the label
  let lab = document.createElement("label");
  //set what it is labeling
  lab.setAttribute("for", forId);
  lab.id = "for" + forId;
  //set what the label says
  lab.innerText = labelText + ": ";
  //standardize font size for all labels
  lab.style.fontSize = "1rem";

  if (hidden && !servReq) {
    lab.style.display = "none";
  }

  //insert the label
  form.appendChild(lab);
}

// creates an input element for the form
function createInputElement(type, id, form) {
  // create the input element
  let input = document.createElement("input");
  // set the input type
  input.setAttribute("type", type);
  // give the input an id
  input.setAttribute("id", id);
  input.name = id;
  // input.required = true;

  // the date value should be todays date ad the current time. It is automatically populated w/ todays date and current time. You cannot edit it.
  if (id == "date") {
    input.setAttribute("readonly", true);
    input.tabIndex = -1;
    input.step = 1;
    if (servReq == null) {
      input.value = new Date().toDateInputValue();
    } else {
      input.value = sqlDateToUsableDate(servReq["date"]);
    }
  } else if (id == "completed") {
    input.setAttribute("readonly", true);
    input.required = false;
    input.step = 1;
    input.tabIndex = -1;
    if (servReq != null) {
      input.value = sqlDateToUsableDate(servReq["completed"]);
    }
  } else if (id == "location") {
    input.tabIndex = 8;
    if (servReq != null) {
      input.value = servReq["location"];
    }
  } else if (id == "estimate") {
    input.tabIndex = 9;
    input.step = 1;
    if (servReq != null) {
      input.value = sqlDateToUsableDate(servReq["estimate"]);
    }
  } else if (id == "completedBtn") {
    input.setAttribute("onclick", "setCompleted()");
    input.setAttribute("value", "Mark Request Completed");
    input.tabIndex = 10;
  }
  // instructions for the email part
  else if (id == "cc") {
    input.onblur = function () {
      emailValidation(input);
    };
    input.required = false;
    input.tabIndex = 11;
    if (servReq != null) {
      input.value = servReq["cc"];
    }
  } else if (id == "contactedDate") {
    input.required = false;
    input.tabIndex = 12;
    input.step = 1;
    if (servReq != null) {
      input.value = sqlDateToUsableDate(servReq["contactedDate"]);
    }
  } else if (id == "externalId") {
    input.required = false;
    input.tabIndex = 13;
    if (servReq != null) {
      input.value = servReq["externalId"];
    }
  } else if (id == "servReqId") {
    input.style.display = "none";
    if (servReq != null) {
      input.value = servReq["servReqId"];
    }
  // } else if (id == "partvoid") {
  //   input.required = false;
  } else if (id == "inputBy") {
    input.value = userName;
    input.readOnly = true;
    input.tabIndex = -1;
  } else if (id == "noteinputBy") {
    input.readOnly = true;
    input.tabIndex = -1;
  } else if (id == "modDate") {
    input.value = new Date().toDateInputValue();
    input.readOnly = true;
    input.tabIndex = -1;
    input.style.height = "32px";
    input.style.fontSize = "1rem";
  } else if (id == "public") {
    input.checked = true;
    input.required = false;
    if (!userIsTech) {
      input.style.display = "none";
      document.getElementById("forpublic").style.display = "none";
    }
  } else if (
    id == "requestPartId" ||
    id == "serviceRequestId" ||
    id == "partId" ||
    id == "noteinputDate" ||
    id == "requestNoteId" ||
    id == "noteCreator" ||
    id == "editnotetoday" ||
    id == "phone" ||
    id == "email" ||
    id == "fullname"
    ) {
    input.style.height = "32px"
    input.required = false;
    input.readOnly = true;
  // } else if (id == "editpartvoid") {
  //   input.required = false;
  } else if (id == "editpublic") {
    input.required = false;
    if (!userIsTech) {
      input.style.display = "none";
      document.getElementById("foreditpublic").style.display = "none";
    }
  } else if (id == "newNoteTempId") {
    input.readOnly = true;
  }
  //put the input in the form
  form.appendChild(input);
}

// creates the datalist element
function createDatalistElement(id, dictionary, form) {
  // create the datalist for the dropdowns. 'dictionary' is a dict from python with a list of values.
  let list = document.createElement("datalist");
  // give it an id
  list.setAttribute("id", id + "-dropdown");
  // loop through the dictionary and make every part an option for the dropdown

  for (key in dictionary) {
    let value = dictionary[key];
    let opt = document.createElement("option");
    opt.setAttribute("value", value);
    list.appendChild(opt);
  }
  
  // put the list on the form
  form.appendChild(list);
}

// creates the dropdown element that displays the datalist
function createDropdownElement(list, id, form, hidden = false) {
  // create the dropdown element
  let drop = document.createElement("input");
  // assign it a list of dropdown options
  drop.setAttribute("list", list + "-dropdown");
  // give it an id
  drop.setAttribute("id", id);
  drop.setAttribute("name", id);
  drop.required = true;
 // special cases for the dropdowns below
  if (id == "requestor") {
    if (servReq != null) {
      drop.value = servReq["requestor"];
    }
    drop.tabIndex = 1;
    // clear the value in the dropdown when it is clicked on
    drop.onclick = function () {
      drop.value = "";
    };
  } else if (id == "parts") {
    drop.style.height = "32px";
    // clear the value in the dropdown when it is clicked on
    drop.onclick = function () {
      drop.value = "";
    };
  } else if (id == "priority") {
    if (servReq != null) {
      drop.value = servReq["priority"];
    }
    drop.tabIndex = 2;
    // clear the value in the dropdown when it is clicked on
    drop.onclick = function () {
      drop.value = "";
    };
  } else if (id == "department") {
    if (servReq != null) {
      // console.log(servReq["department"]);
      drop.value = servReq["department"];
    }
    drop.tabIndex = 4;
    // clear the value in the dropdown when it is clicked on
    drop.onclick = function () {
      drop.value = "";
    };
    drop.addEventListener("change", function () {
      if (id === "department") {
      const department = drop.value;
      const departmentUsers = userDict[departmentDict[department]];

      const assignedToDropdown = document.getElementById("assignedTo-dropdown");
      assignedToDropdown.innerHTML = ""; // Clear existing options

      departmentUsers.forEach(user => {
        const option = document.createElement("option");
        option.value = user;
        assignedToDropdown.appendChild(option);
      });
      }
    });
  } else if (id == "assignedTo") {
    if (userRole !== "Admin" && userRole !== "Secretary" && userRole !== "Mechanic") {
      drop.readOnly = true;
      drop.value = "Unassigned  ";
    } else {
      if (servReq != null) {
      drop.value = servReq["assignedTo"];
      }
      // clear the value in the dropdown when it is clicked on
      drop.onclick = function () {
        drop.value = "";
      }
      drop.tabIndex = 5;
    };
  } else if (id == "building") {
    if (servReq != null) {
      drop.value = servReq["building"];
    }
    drop.tabIndex = 6;
    // clear the value in the dropdown when it is clicked on
    drop.onclick = function () {
      drop.value = "";
    };
  } else if (id == "status") {
    if (!servReq) {
      drop.readOnly = true;
      drop.value = "Open";
    } else {
      if (servReq != null) {
        drop.value = servReq["status"];
      }
      // clear the value in the dropdown when it is clicked on
      drop.onclick = function () {
        drop.value = "";
      };
    }
    drop.tabIndex = 7;
  } else if (id == "parts") {
    if (partDesc != null) {
      drop.value = partDesc;
    }
    // clear the value in the dropdown when it is clicked on
    drop.onclick = function () {
      drop.value = "";
    };
  } else if (id == "partStat") {
    // clear the value in the dropdown when it is clicked on
    drop.onclick = function () {
      drop.value = "";
    };
    drop.style.height = "32px";
  } else if (
    id == "partStat" ||
    id == "newpartVendor" ||
    id == "newpartManu" ||
    id == "newpartdeviceType" ||
    id == "newpartdeviceSubType"
  ) {
    // clear the value in the dropdown when it is clicked on
    drop.onclick = function () {
      drop.value = "";
    };
    drop.style.height = "32px";
  }

  drop.addEventListener("blur", (event) => {
    let inputVal = event.target.value;
    let inputId = event.target.id;
    let dataList = document.getElementById(inputId + "-dropdown");
    let valid = Array.from(dataList.options).some(opt => opt.value === inputVal);

    if (inputVal !== "" && !valid) {
      event.target.value = "";
      alert("Enter valid input");
      document.getElementById(inputId).focus();
    }
  }, true);
  
    if (id === "requestor") {
      if (newRequestor != null) drop.value = newRequestor;
      drop.addEventListener("change", function () {
        if (drop.value === "New Requestor") {
          createTableModal("User", userName, { isServiceRequest: true });
          drop.value = "";
        }
      });
    }

    else if (id === "parts") {
      if (newRequestor != null) drop.value = newRequestor;
      drop.addEventListener("change", function () {
        if (drop.value === "New Part") {
          createTableModal("Part", userName, { isServiceRequest: true });
          drop.value = "";
        }
      });
    }

  if (hidden && !servReq) {
    drop.style.display = "none";
  }
  // put it on the form
  form.appendChild(drop);
}

// validates that the emails were put in correctly
function emailValidation(element) {
  let id = element.id;

  var x = document.getElementById(id).value;
  var hasSemi = x.includes(";");
  var hasComa = x.includes(",");
  var hasColon = x.includes(":");

  // if the input is not empty
  if (x != "") {
    // if it is using the wrong separator
    if (hasComa || hasColon) {
      // clear the input and send them a massage
      document.getElementById(id).value = "";
      alert("Separate emails with a semicolon ( ; )");
      document.getElementById(id).value = "";
      document.getElementById(id).focus();
    }
    // if there is a semi colon present (multiple emails)
    else if (hasSemi) {
      var atcount = x.match(/\@/g || []).length;
      var dotcount = x.match(/\./g || []).length;
      var semicount = x.match(/\;/g || []).length;
      var lastSemi = x.lastIndexOf(";");
      var lastAt = x.lastIndexOf("@");
      var lastDot = x.lastIndexOf(".");

      var atPosIndices = [];
      for (var i = 0; i < x.length; i++) {
        if (x[i] === "@") atPosIndices.push(i);
      }

      var dotPosIndices = [];
      for (var i = 0; i < x.length; i++) {
        if (x[i] === ".") dotPosIndices.push(i);
      }

      var semiPosIndices = [];
      for (var i = 0; i < x.length; i++) {
        if (x[i] === ";") semiPosIndices.push(i);
      }

      // previous semi-colon position. Initialized as -1 since that is never a natural position and therefore if it is -1 we know we're on the first email
      var prevSemiPos = -1;
      var prevAtPos = -1;
      var prevDotPos = -1;

      // evergreen indicators of incorrect input
      if (
        atcount <= semicount ||
        dotcount != atcount ||
        semicount < atcount - 1
      ) {
        invalidAddress(id);
      } else {
        for (var i = 0; i < atPosIndices.length; i++) {
          for (var j = 0; j < dotPosIndices.length; j++) {
            for (var k = 0; k < semiPosIndices.length; k++) {
              // first email
              if (prevSemiPos == -1) {
                // if the email is incorrectly submitted
                if (
                  atPosIndices[i] < 1 ||
                  dotPosIndices[j] < atPosIndices[i] + 2 ||
                  dotPosIndices[j] + 2 >= semiPosIndices[k]
                ) {
                  // clear the input and send them a message
                  invalidAddress(id);
                }
                prevSemiPos = semiPosIndices[k];
                prevAtPos = atPosIndices[i];
                prevDotPos = dotPosIndices[j];
              }
              // a middle email
              else if (
                i == j &&
                j == k &&
                atPosIndices[i] > prevAtPos &&
                dotPosIndices[j] > prevDotPos &&
                semiPosIndices[k] > prevSemiPos &&
                atPosIndices[i] < lastAt &&
                dotPosIndices[j] < lastDot &&
                semiPosIndices[k] <= lastSemi
              ) {
                // if the email is incorrectly submitted
                if (
                  atPosIndices[i] < prevSemiPos + 2 ||
                  dotPosIndices[j] < atPosIndices[i] + 2 ||
                  dotPosIndices[j] + 2 >= semiPosIndices[k] + 1
                ) {
                  // clear the input and send them a message
                  invalidAddress(id);
                }
                prevSemiPos = semiPosIndices[k];
                prevAtPos = atPosIndices[i];
                prevDotPos = dotPosIndices[j];
              }
              // the last email
              else if (
                atPosIndices[i] == lastAt &&
                dotPosIndices[j] == lastDot &&
                semiPosIndices[k] == lastSemi
              ) {
                // if the email is incorrectly submitted
                if (
                  atPosIndices[i] < prevSemiPos + 2 ||
                  dotPosIndices[j] < atPosIndices[i] + 2 ||
                  dotPosIndices[j] + 2 >= x.length
                ) {
                  // clear the input and send them a message
                  invalidAddress(id);
                }
              }
            }
          }
        }
      }
    }
    // if there is no semi colon (just 1 email)
    else {
      var atpos = x.indexOf("@");
      var dotpos = x.lastIndexOf(".");
      // if it has incorrect email format
      if (atpos < 1 || dotpos < atpos + 2 || dotpos + 2 >= x.length) {
        // clear the input and send them a massage
        invalidAddress(id);
      }
    }
  }
}

// function to be run when there is an invalid email address found. Clears the input and lets the user know
function invalidAddress(id) {
  document.getElementById(id).value = "";
  alert("Enter valid email Address");
  document.getElementById(id).value = "";
  document.getElementById(id).focus();
}

// checks if the phone input is filled in or blank
function checkPhoneNum() {
  var phoneVal = document.getElementById("phone").value;
  if (phoneVal == "") {
    document.getElementById("email").required = true;
  } else {
    document.getElementById("email").required = false;
  }
}

// checks if the email input is filled in or blank
function checkEmail() {
  var emailVal = document.getElementById("email").value;
  if (emailVal == "") {
    document.getElementById("phone").required = true;
  } else {
    document.getElementById("phone").required = false;
  }
}

// create the description part of the form // seems to be the description in the add note form
function createDescription(id, form) {
  let description = document.createElement("textarea");
  description.addEventListener("keydown", function(enter_key_pressed) {
    if (enter_key_pressed.key === "Enter" || enter_key_pressed.key === "Return") { // when enter or return is pressed, it will submit the note
      enter_key_pressed.preventDefault();
      document.getElementById("addNotePopSubmit").click();
    }
  });
  description.setAttribute("rows", "4");
  description.setAttribute("cols", "50");
  description.setAttribute("id", id);
  description.name = id;
  description.required = true;
  form.appendChild(description);
}
