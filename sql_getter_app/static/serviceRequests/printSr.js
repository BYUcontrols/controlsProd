function printSingleSr(rawHtml) {
    redirectPost(rawHtml.innerHTML, '/printSingleServiceRequest');
}

// runs when the Print button is clicked in the SR page
function printFunc(servReq) {

    // create a table for the random SR data for the printout
    let table = document.createElement('table');
    table.id = 'table';
    table.classList = 'printThis';
    body.appendChild(table);

    let tableBod = document.createElement('tbody');
    tableBod.id = 'tableBody';
    table.appendChild(tableBod);

    let tBodRow1 = document.createElement('tr');
    tableBod.appendChild(tBodRow1);
    let srId = createTableCell();
    if (servReq['servReqId']){srId.appendChild(createNestedTable("ID", servReq['servReqId']))}
    else {srId.appendChild(createNestedTable("ID", "None"))}
    tBodRow1.appendChild(srId);
    let srDate = createTableCell();
    if (servReq['date']){srDate.appendChild(createNestedTable("Date", servReq['date']))}
    else {srDate.appendChild(createNestedTable("Date", "None"))}
    tBodRow1.appendChild(srDate);

    let tBodRow2 = document.createElement('tr');
    tableBod.appendChild(tBodRow2);
    let srReq = createTableCell();
    if (servReq['requestor']){srReq.appendChild(createNestedTable("Requestor", servReq['requestor']))}
    else {srReq.appendChild(createNestedTable("Requestor", "None"))}
    tBodRow2.appendChild(srReq);
    let srPrio = createTableCell();
    if (servReq['priority']){srPrio.appendChild(createNestedTable("Priority", servReq['priority']))}
    else {srPrio.appendChild(createNestedTable("Priority", "None"))}
    tBodRow2.appendChild(srPrio);

    let tBodRow3 = document.createElement('tr');
    tableBod.appendChild(tBodRow3);
    let srLoc = createTableCell();
    if (servReq['location']){srLoc.appendChild(createNestedTable("Location", servReq['location']))}
    else {srLoc.appendChild(createNestedTable("Location", "None"))}
    tBodRow3.appendChild(srLoc);

    let tBodRow4 = document.createElement('tr');
    tableBod.appendChild(tBodRow4);
    let srAssigTo = createTableCell();
    if (servReq['assignedTo']){srAssigTo.appendChild(createNestedTable("Assigned To", servReq['assignedTo']))}
    else {srAssigTo.appendChild(createNestedTable("Assigned To", "None"))}
    tBodRow4.appendChild(srAssigTo);
    let srBldg = createTableCell();
    if (servReq['building']){srBldg.appendChild(createNestedTable("Building", servReq['building']))}
    else {srBldg.appendChild(createNestedTable("Building", "None"))}
    tBodRow4.appendChild(srBldg);

    let tBodRow5 = document.createElement('tr');
    tableBod.appendChild(tBodRow5);
    let srEst = createTableCell();
    if (servReq['estimate']){srEst.appendChild(createNestedTable("Estimate", servReq['estimate']))}
    else {srEst.appendChild(createNestedTable("Estimate", "None"))}
    tBodRow5.appendChild(srEst);
    let srStat = createTableCell();
    if (servReq['status']){srStat.appendChild(createNestedTable("Status", servReq['status']))}
    else {srStat.appendChild(createNestedTable("Status", "None"))}
    tBodRow5.appendChild(srStat);

    let tBodRow6 = document.createElement('tr');
    tableBod.appendChild(tBodRow6);
    let srComp = createTableCell();
    if (servReq['completed']){srComp.appendChild(createNestedTable("Completed", servReq['completed']))}
    else {srComp.appendChild(createNestedTable("Completed", "None"))}
    tBodRow6.appendChild(srComp);
    let srCont = createTableCell();
    if (servReq['contactedDate']){srCont.appendChild(createNestedTable("Contacted", servReq['contactedDate']))}
    else {srCont.appendChild(createNestedTable("Contacted", "None"))}
    tBodRow6.appendChild(srCont);

    let tBodRow7 = document.createElement('tr');
    tableBod.appendChild(tBodRow7);
    let srExt = createTableCell();
    if (servReq['externalId']){srExt.appendChild(createNestedTable("External ID", servReq['externalId']))}
    else {srExt.appendChild(createNestedTable("External ID", "None"))}
    tBodRow7.appendChild(srExt);
    let empty = createTableCell();
    tBodRow7.appendChild(empty);

    // Table for the description part of the printout
    let descTable = document.createElement('table');
    descTable.id = 'descTable';
    descTable.classList = 'printThis noBorders';
    descTable.setAttribute("style", "display: none")
    body.appendChild(descTable);

    let descTableHead = document.createElement('thead');
    descTableHead.classList = "noBorders";
    descTable.appendChild(descTableHead);

    let descTableHeadRow = document.createElement('tr');
    descTableHeadRow.id = 'descTableHeadRow';
    descTableHeadRow.classList = "noBorders";
    descTableHead.appendChild(descTableHeadRow);

    let descTitle = createTableHeader('Description:');
    descTitle.classList = "noBorders title";
    descTableHeadRow.appendChild(descTitle);

    let desctableBod = document.createElement('tbody');
    desctableBod.id = 'desctableBody';
    desctableBod.classList = "noBorders";
    descTable.appendChild(desctableBod);
    let desctBodRow = document.createElement('tr');
    desctBodRow.classList = "noBorders";
    desctableBod.appendChild(desctBodRow);
    let descsr = createTableCell(servReq['description']);
    descsr.classList = "noBorders";
    desctBodRow.appendChild(descsr);

    // create an object where we can store data to send to the server neatly  
    let data = new Object;
    let srcont = putInContainer(table, 'div');

    // --- MODIFICATION FOR partsTable ---
    let clonedPartsTable = null;
    const originalPartsTable = document.getElementById('partsTable');
    if (originalPartsTable) {
        clonedPartsTable = originalPartsTable.cloneNode(true);
        // Remove "edit" column header if it exists
        const partsHeaderToRemove = clonedPartsTable.querySelector('th.editTableColumn');
        if (partsHeaderToRemove) {
            partsHeaderToRemove.remove();
        }
        // Remove "edit" column data cells if they exist
        const partsCellsToRemove = clonedPartsTable.querySelectorAll('td#editCell');
        partsCellsToRemove.forEach(cell => cell.remove());
    }
    let partcont = putInContainer(clonedPartsTable || document.createElement('div'), 'div'); // Use cloned or an empty div

    // --- MODIFICATION FOR notesTable ---
    let clonedNotesTable = null;
    const originalNotesTable = document.getElementById('notesTable');
    if (originalNotesTable) {
        clonedNotesTable = originalNotesTable.cloneNode(true);
        // Remove "edit" column header if it exists
        const notesHeaderToRemove = clonedNotesTable.querySelector('th.editTableColumn');
        if (notesHeaderToRemove) {
            notesHeaderToRemove.remove();
        }
        // Remove "edit" column data cells if they exist
        const notesCellsToRemove = clonedNotesTable.querySelectorAll('td#editCell');
        notesCellsToRemove.forEach(cell => cell.remove());
    }
    let notecont = putInContainer(clonedNotesTable || document.createElement('div'), 'div'); // Use cloned or an empty div

    // --- descTable handling ---
    // If descTable was set to "display: none" and you need its content for printing,
    // you might need to make it visible before cloning or ensure its content is built correctly regardless of display style.
    // The original code clones it as is.
    const originalDescTable = document.getElementById('descTable');
    let desccont = putInContainer(originalDescTable ? originalDescTable.cloneNode(true) : document.createElement('div'), 'div');

    data['html'] = "<h1>Service Request Form</h1> <div class=\"logo\"><img src=\"/path/to/your/BYU.png\"><h2 class=\"title\">AC Shop</h2></div>" + srcont.innerHTML + "<br>" + desccont.innerHTML + "<br>" + notecont.innerHTML + "<br>" + partcont.innerHTML;
    data['params'] = "";
    data['sort'] = "ID";
    data['tableName'] = "Service_Request";

    redirectPost(data,'/printSingleServiceRequest');

    // Clean up tables appended to body if they are temporary
    if (table.parentNode === document.body) document.body.removeChild(table);
    if (descTable.parentNode === document.body) document.body.removeChild(descTable);
}
