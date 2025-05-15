/*  
    Functions that display a full linked element at the bottom of the page

           Written by: 
      Isaac Cutler 12/1/2020
    Property of the BYU A/C Shop
*/

// function that creates a little inspect icon that calls show link when clicked
function createInspectIcon(id, table) {
    icon = document.createElement('button');
    icon.innerHTML = '&#x1f50d;';
    icon.onclick = function() { showLink(id, table); };
    icon.classList = 'icon';

    setTooltip(icon, 'Get more information about the part in this cell');

    return icon;
}

// Function that runs onclick of a linked element
function showLink(id, table) {

    post(null, "GET", `/linkedElement?name=${table}&id=${id}`, onShowLinkReturn);
}

function onShowLinkReturn() {
        // Stores response
        container = unobtrusiveAlert();
        table = document.createElement('TABLE');
        
        table.innerHTML = this.responseText;
        container.appendChild(table);

        loadForeignRow(table, foreignType.SINGLE_ROW)
}


// define the possible types of restorable elements
const foreignType = {
    DELETED:'deleted',
    AUDIT:'audit',
    EDITABLE:'editable',
    AIRPLANE_MODE:'noSaveMode',
    EMPTY_ENGINE_ONLY:'empEngOnly',
    SINGLE_ROW:'singRow'
};


/* given a table ref for a table with all the linked and column data in the header load the rows with the rowEngine class
 * Args:
 *  table - htmlRef - table element for the table you want to load
 *  type - foreignType - the type of the foreign rows being loaded. an instance of the foreignType object
 *      parentRowEngine - required if type is foreignType.AUDIT, is is a rowEngine instance that is the parent row
 *      for instance in the audit tables the parentRow is the row in the table being audited
 *  parentRowEngine - rowEngine - (only for foreignType.AUDIT) the rowEngine for the audit's parent
 * 
 * returns:
 * an object with keys 
 *  'emptyEngine' - an empty row engine with the same configuration as the rows loaded
 *  'engineList' - a list containing all the rowEngines created
 *  
 */
function loadForeignRow(table, type, parentRowEngine=null, showDeleted=false) {
    // Get the table data from the tags
    let tableHead = table.childNodes[0].childNodes[0];
    let quickLinkedRaw = JSON.parse(tableHead.getAttribute('data-linked'));
    let quickTableName = tableHead.getAttribute('data-tableName');
    let quickColumnTypes = JSON.parse(tableHead.getAttribute('data-columnTypes'));
    let quickColumns = JSON.parse(tableHead.getAttribute('data-columns'));
    let permissions = JSON.parse(tableHead.getAttribute('data-permissions'));
    let foreignHasLinkedChildren = JSON.parse(tableHead.getAttribute('data-linkedChildrenExist'));
    let uneditable = JSON.parse(tableHead.getAttribute('data-uneditable'));
    // create the columns Object
    let quickLookColumnsObject = generateColumnsObject(tableHead, quickColumns, quickColumnTypes, quickLinkedRaw, quickTableName, uneditable);
    // create a place to store all the initialized rows
    let engineArray = new Array();


    // Initialize the rows (if he type is not EMPTY_ENGINE_ONLY)
    if (type != foreignType.EMPTY_ENGINE_ONLY) { 
        for (row of table.childNodes[1].childNodes) {
            // create a rowEngine instance for each row and call .loadRow on it.
            let placeholder = new rowEngine(quickLookColumnsObject, quickTableName, permissions, foreignHasLinkedChildren);
            engineArray.push(placeholder); // append the created rowEngine to the engineList
            // change the airplaneMode variable if applicable
            if (type == foreignType.AIRPLANE_MODE) placeholder.airplaneMode = true;
            // load the row
            placeholder.loadRow(row, false, null, (type == foreignType.EDITABLE || type == foreignType.AIRPLANE_MODE || type == foreignType.SINGLE_ROW)); // pass true for the dynamic argument of the type is editable to tell .loadRow wether to include save/edit buttons
            console.log(placeholder);
            // deal with the types that are not dynamic
            if (type != foreignType.EDITABLE && type != foreignType.AIRPLANE_MODE && type != foreignType.SINGLE_ROW) { // if the type is not dynamic (not editable)
                if (!parentRowEngine && type == foreignType.AUDIT) throw "loadForginRow() - when the type is AUDIT a parentRowEngine must be passed"; // error handling
                    // create a restore button to restore that element
                let restoreBtn = createButton('Restore', null, 'Restore this row. Either resurrect it or restore it to this previous version.');
                placeholder.buttonCell.appendChild(restoreBtn);
                    // give the created restoreBtn something to do (depending on the case)
                if (type == foreignType.AUDIT) restoreEngine(parentRowEngine, placeholder, restoreBtn);
            }
        }
    }
        // insert a show deleted selector (if applicable)
        // we want a show deleted option only on editable rows (also airplaneMode)
    if (type == foreignType.EDITABLE || type == foreignType.AIRPLANE_MODE) {
        let showDeletedCell = tableHead.lastChild; // select the last cell in the header
            // create the text for the show Deleted checkbox
        let showDeletedLabel = document.createElement('label');
        showDeletedLabel.setAttribute('for', quickTableName);
        showDeletedLabel.textContent = 'Show Deleted';
        showDeletedLabel.classList.add('showDeletedLabel');
        showDeletedCell.append(showDeletedLabel);
            // create the actual checkbox
        let showDeletedCheckbox = document.createElement('input');
        showDeletedCheckbox.type = 'checkbox';
        showDeletedCheckbox.id = quickTableName;
        showDeletedCheckbox.classList.add('showDeletedCheckbox');
        showDeletedCell.append(showDeletedCheckbox);
            // loop through all the recently created engines
        for (engine of engineArray) {
                // tell the row to not show the deleted rows
            engine.showDeleted = false;
                // if the row came from the server with the deleted flag then tell it's engine that it is deleted
            if (engine.rowRef.getAttribute('data-deleted') == 'true') {
                engine.isDeleted = true;
            }
                // tell the engine to update it's deleted visibility and the delete/unDelete button
            engine.updateDeletedVisibility();
        }
            // set the function that runs when the show deleted checkbox is cliched
        showDeletedCheckbox.onclick = function() {
                // loop through the engines in the table
            for (engine of engineArray) {
                    // tell the row to show the deleted rows (or not depends on if the checkbox is checked)
                engine.showDeleted = showDeletedCheckbox.checked;
                engine.updateDeletedVisibility();
            }
        }
    }
        // alternately for a single row we want to load it as if it was a deleted row but don't want to display the show deleted button
    if (type == foreignType.SINGLE_ROW) {
        for (engine of engineArray) {
                // tell the row to show the deleted row
            engine.showDeleted = true;
                // if the row came from the server with the deleted flag then tell it's engine that it is deleted
            if (engine.rowRef.getAttribute('data-deleted') == 'true') {
                engine.isDeleted = true;
            }
                // tell the engine to update it's deleted visibility and the delete/unDelete button
            engine.updateDeletedVisibility();
        }
    }

        // return an empty rowEngine to create input fields out of and the engineList
    return {
        emptyEngine : new rowEngine(quickLookColumnsObject, quickTableName, permissions, foreignHasLinkedChildren),
        engineList : engineArray
    };
}


