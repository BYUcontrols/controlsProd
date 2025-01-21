/*  
    Functions relating to the pushing of data to the server,
    loading saved cookie data, and rediecting backward

           Written by: 
      Isaac Cutler 12/1/2020
    Property of the BYU A/C Shop
*/

/* Called when a '*something* Table' button is clicked (when editing a row with a linked element)
 *
 * It opens the *something page* in a new tab with links back to the original page
 *  
 * nextPage - String - the table to open up 'Building' or 'Device' for instance
 * onReturn - Function that takes one argument - a function that will be called by the 'Select' button on the child page
 *    with the index number of the created row as the argument
 */
function redirectHandler(nextPage, onReturn, idEditing=null) {
        // create the data object that will be accessed by the new opened page
    let forChildPage = new Object()
    forChildPage.onSelect = onReturn;
    forChildPage.idBeingEdited = idEditing;
        // If the dataForChildPages foes not exist create it  
    if (!window.dataForChildPages) window.dataForChildPages = new Object()
        // set the forChildPage in a place that the opened page will be able to find it (the window object)
    window.dataForChildPages[nextPage] = forChildPage;
        // open the new window
    forChildPage.openedWindow = open(`/${nextPage}`, `Select a ${nextPage}`);
}

/* function called on startup that checks for a parent window that refers to it
 * and if there is it tells the page that it needs to load with the 'Select' buttons
 * 
 */
function checkForParentWindows() {
        // get the current window name
    currentWindow = window.tableName;
        // check to see if the parent window expects anything from this window (if there even is a parent)
    if (opener && opener.dataForChildPages && opener.dataForChildPages[currentWindow]) {
        window.displaySelectButton = true;
        let alert = unobtrusiveAlert();
        alert.innerHTML = `You have been redirected from the ${opener.tableName} Table. Click a <button class='selectButton'>Select</button> button or create a new row to return with that row selected. When a select button is pressed this page will close and you may have to navigate back to the tab you came from.`;
    } else window.displaySelectButton = false;
}

/* a function called when a 'Select' button is pressed or a new item is created
 *     It calls the onSelected function as defined by the parent window (if one exists)
 *
 * index - integer - the index of the row created/selected/edited
 * nada - a nothing value because sometimes when this is called it is passed a second argument
 */
function nextPage(selectedId, nada=null) {
        // get the current window name
    let currentWindow = window.tableName;
        // check to see if an on selected function exists for this page
    if (opener && opener.dataForChildPages && opener.dataForChildPages[currentWindow] && opener.dataForChildPages[currentWindow].onSelect) {
            // try to call the onSelect function (passing the selectedId)
        opener.dataForChildPages[currentWindow].onSelect(selectedId);
            // close the window (so we can go back to the other page)
        window.close();
    }
}



function removeInputCookie(nada=null) {
    alert('erasing cookie');
    removeStorageItem('newProgress');
}

// function to make an unobtrusive alert box
function unobtrusiveAlert(text = false) {

    let content = document.createElement('DIV');
    content.classList = 'unobtrusiveAlert';
    document.getElementById('unobtrusiveAlerts').appendChild(content);
    content.display = 'flex';
    
    let closeBox = document.createElement('SPAN');
    closeBox.classList = 'closeAlert';
    closeBox.innerHTML = '&times;';
    closeBox.divToClose = content;
    closeBox.onclick = function() {
        this.divToClose.style.display = 'none';
    }
    content.appendChild(closeBox)

    let container = document.createElement('DIV');
    container.classList = 'alertContent';
    content.appendChild(container);
    if (text) {
        content.append(text);
    }
    return container;
}


// COOKIES!!!!!!!!
//  except after writing everything I realized that cookies were not the correct way to do this
//  localstorage is a way that we can save values for every site in a safer way that isn't transmitted with every request.
//  because localstorage is the same across all paths we save everything by keys

// returns the storage object for that specific page
function fetchStorageForPage() {
    let path = window.location.pathname;
    let storage = window.localStorage;
        // gets the data for the specified path
    let data = storage.getItem(path);
        // returns the data or an empty object of there is no data
    return data ? JSON.parse(data) : new Object();
}

// saves the storage object for that specific page
function saveStorageForPage(data='nada') {
    
    let path = window.location.pathname;
    let storage = window.localStorage;
        // saves the data
    storage.setItem(path, JSON.stringify(data));
}

// find out if a local storage key exists exists
function isStorageItem(name) {
    let storage = fetchStorageForPage();
    
    if (storage[name] == null) return false; 
    else return true;
}

// get a cookie by name
function getStorageItem(name) {
    let storage = fetchStorageForPage();
    return storage[name];
}

// create a cookie
function setStorageItem(name, value) {
    
    let storage = fetchStorageForPage();
    storage[name] = value;
    saveStorageForPage(storage);
}

// get rid of a cookie
function removeStorageItem(name) {   
    let storage = fetchStorageForPage();
    delete storage[name];
    saveStorageForPage(storage);  
}