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
