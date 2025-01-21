/*  
    functions for the linking of linked elements

           Written by: 
      Isaac Cutler 12/1/2020
    Property of the BYU A/C Shop
*/

/*
*************************This section contains the code for viewing linked elements**********************
*/


/* Function called when the 'linked' button is pressed
 *  it is passed the context of the rowEngine of the row where the button is pressed
 */
function viewLinked() {
    let container = createDisplayContainer()
        // send the request to the server
    let request = post(null, "GET", `/viewLinked/${this.tableName}/${this.id}`, displayLinkedItems)
        // pass the request data that displayLinkedItems will need
    request.container = container;
    request.id = this.id;
    request.rowEngine = this;
}

/* runs on return of the viewLinked request and displays all the data
 * 
 * It is passed the context of the request (The this. things)
 */
function displayLinkedItems() {
        // create the print button
        console.log(this)
        console.log(this.tableName)
    this.container.addPrintButton(`Children_of_${this.rowEngine.tableName}_Row_${this.rowEngine.id}`);
        // clone the original row and put it in the popup
    this.container.appendChild(createCloneOfRow(this.rowEngine).htmlRef);
        // a little title
    let title = document.createElement('h1');
    title.textContent = 'Linked Items';
    this.container.appendChild(title);
        // creates a box that scrolls horizontally
    let auditTable = document.createElement('div');
    this.container.appendChild(auditTable);
        // place the actual table into the box previous
    auditTable.innerHTML = this.response;
        // initialize the tables
    let tables = auditTable.getElementsByTagName('table');
    for (let table of tables) {
        console.log(table);
            // load all the rows into their engines (with the show deleted selector)
        loadForeignRow(table, foreignType.EDITABLE);
    }
}
