/*  
    Functions that create and send the 'Filter' menu

           Written by: 
      Isaac Cutler 1/4/2021
    Property of the BYU A/C Shop
*/

// function that creates the filter button
function generateFilterButton(container = document.getElementsByClassName('tableFunctions')[0]) {
  let button = document.createElement('p');
  button.appendChild(document.createTextNode('Filter'));
  button.classList = 'BYUbutton';
  button.id = 'filterButton'
  button.setAttribute("onclick", "filterMenu()");
  div = putInContainer(button, 'div');
  div.classList = 'tableFunction';
  container.appendChild(div);

  setTooltip(button, 'Pick or modify filters for the table');

  // alert the user to filters present
  let urlArgEngine = new URLSearchParams(window.location.search);

  if (urlArgEngine.has('filter') && Object.keys(JSON.parse(urlArgEngine.get('filter'))).length > 0) { // if the filter url exists and has arguments
    unobtrusiveAlert('This page has the following filters applied: ' + filterReadableText());
  }
}

/* 
  function that runs when the filter button is clicked: it will...
  * reveal the existing filter menu or
  * create it
*/
function filterMenu() {
  if (document.getElementById('filterMenu')) {
    window.filterMenuContainer.openModal();
    document.body.style.overflow = "hidden";
  } else {
    let urlArgEngine = new URLSearchParams(window.location.search);
    document.body.style.overflow = "hidden";
    // create display box
    window.filterMenuContainer = createDisplayContainer('filterMenu', false, 'filterModal');
    window.filterMenuContainer.openModal();
    document.body.style.overflow = 'hidden';
    // create the title
    let title = document.createElement('h1');
    title.classList.add('filterTitle');
    title.textContent = 'Filtering';
    window.filterMenuContainer.appendChild(title);
    // create a place to put the filter options
    let tableDiv = document.createElement('div');
    tableDiv.classList.add('filterTableDiv')
    // create the table
    let tableBox = document.createElement('table');
    tableBox.id = 'filterTable';
    let table = document.createElement('tbody');
    window.filterMenuContainer.appendChild(tableDiv);
    tableDiv.appendChild(tableBox);
    tableBox.appendChild(table);
    // get the url args
    let urlArgs = JSON.parse(decodeURIComponent(urlArgEngine.get('filter')));
    
    // create the options and store them in a global array
    window.filterDataArray = new Array();
    for (let headerData of columnsInfo) {
      let colClass = new filterOption(headerData, table, urlArgs);
      filterDataArray.push(colClass);
    }

   // let typeCol = generateColumnsObject();

    // create the showDeleted option
    filterDataArray.push(new showDeletedOption(tableDiv, urlArgs));
    // store the filterDataArray in a place we can access it for debugging
    window.filterOptionsArray = filterDataArray;
    // create filter rows
    let buttonRow = document.createElement('div');
    window.filterMenuContainer.appendChild(buttonRow);
    buttonRow.classList.add('filterButtonContainer');

    // create Reset button
    let buttonReset = document.createElement('p');
    buttonReset.appendChild(document.createTextNode('Reset'));
    buttonReset.classList.add('BYUbutton');
    buttonReset.classList.add('filterFunctionButtons');
    buttonReset.onclick = function() {
      // clear the table
      table.innerHTML = '';
      // recreate the filter table
      window.filterDataArray = new Array();
      for (let headerData of columnsInfo) {
        let colClass = new filterOption(headerData, table, urlArgs);
        filterDataArray.push(colClass);
      }
        // delete the showDeleted option
        const showDeletedIndex = document.getElementById('showDeletedContainer');
        if (showDeletedIndex)
          showDeletedIndex.parentNode.removeChild(showDeletedIndex);
        // create the showDeleted option
      filterDataArray.push(new showDeletedOption(tableDiv, urlArgs));
    };
    setTooltip(buttonReset, 'Reset these filters to how they were before you went and messed with them');
    buttonRow.appendChild(buttonReset);

    // create the apply button
    let buttonApply = document.createElement('p');
    buttonApply.appendChild(document.createTextNode('Apply'));
    buttonApply.classList.add('BYUbutton');
    buttonApply.classList.add('filterFunctionButtons');
    buttonApply.onclick = function() { 
      applyFilter(filterDataArray);
      document.body.style.overflow = "auto";
    };
    setTooltip(buttonApply, 'Apply the selected filters to this page');
    buttonRow.appendChild(buttonApply);

    // create clear button
    let buttonClear = document.createElement('p');
    buttonClear.appendChild(document.createTextNode('Clear'));
    buttonClear.classList.add('BYUbutton');
    buttonClear.classList.add('filterFunctionButtons');
    buttonClear.onclick = function() {
      // reload the page with removed filter
      window.location.href = window.location.pathname;
      document.body.style.overflow = "auto";
    }
    setTooltip(buttonClear, 'Clear any filters associated with this page');
    buttonRow.append(buttonClear);
  }
}

// function that runs when 'Apply' is clicked in the filter menu. It loops through the
//  given array of filterOption objects, gets their values and reloads the page with the
//  filter options.
function applyFilter(rawData) {
  let outData = new Object();
  for (let row of rawData) {
    Object.assign(outData, row.data);
  }
  // get a urlEngine
  let urlArgEngine = new URLSearchParams(window.location.search);
  // remove the filter url parameter
  if (urlArgEngine.has('filter')) urlArgEngine.delete('filter');
  // put the arguments (minus the filter arg) in the url and append the new filter args
  window.location.href = window.location.pathname + '?' + urlArgEngine.toString() + 'filter=' + encodeURIComponent(JSON.stringify(outData));

}

/* A class to handle the filter column options. It:
  * Creates a selector for the filter operation (is, isNot, etc.) appropriate to the data type
  * Based on the operation selected creates input boxes appropriate to the data type
  * Creates a 'add option' button so that we can specify multiple values for a single operation
  * Defines a .data function used to retrieve the input data and returns it as an object
  * And fills in all that with the filter parameters from the url Arguments
  * 
  * This is a fairly complicated but robust class, if it breaks the most likely culprit would be
  * that the constructor is being fed bad data. The data needed is:
  *   colData - the data for the column as generated by the getColumnsObject() function
  *   container - the html node to put everything in
  *   existingArgs - the url argument with the past data
  */
class filterOption {
  constructor(colData, container, existingArgs=null) {
    this.colName = colData.name;
    this.displayName = colData.readableName;
    this.type = colData.type;
    this.nullable = colData.nullable;
    this.colData = colData;

    // we don't want a filter option for Estimate on the SR table
    if (this.displayName != 'Estimate') {
      // the rest of this is by Cutler
      if (existingArgs) {
        if (existingArgs[this.colName]) {
          this.oldOp = existingArgs[this.colName]['op'];
          this.oldData = existingArgs[this.colName]['list'];
        } else {
          this.oldOp = null;
          this.oldData = null;
        }
        } else {
        this.oldOp = null;
        this.oldData = null;
      }

      let row = document.createElement('tr');
      row.classList = 'filterRow';
      container.appendChild(row);

      this.nameCell = document.createElement('td');
      setTooltip(this.nameCell, 'A column in the table')
      row.appendChild(this.nameCell);

      this.opCell = document.createElement('td');
      setTooltip(this.opCell, 'Choose the filter method for this column')
      row.appendChild(this.opCell);
      
      this.valCell = document.createElement('td');
      setTooltip(this.valCell, 'The filter terms go here');
      row.appendChild(this.valCell);

      this.storedOperaton = new Array();
      this.operationInputRef = new Object();

      this.nameCell.textContent = this.displayName;
      this.createFilterDropdown();
    }
  }

    // gets the data for the filter
  get data() {
    // we don't want a filter option for Estimate on the SR table
    if (this.displayName != 'Estimate') {
      if (this.drop.value != 'null') {
        let values = new Array()

        for (let input of this.operationInputRef[this.drop.value]) {
          if (this.type != 'datetime') {
            values.push(cleanOutput(input.value));
          } else {
            if (input.value != 'null') { // datetime needs special handling to format it for sql
              console.log(input.value);
              let dateEngine = new dateTimeVoodoo(input.value);
              values.push(dateEngine.forComputers());
            }
          }
        }

        let data = new Object();
        data['op'] = this.drop.value;
        data['list'] = values;

        var wrapper = new Object();
        wrapper[this.colName] = data;
      } else {
        var wrapper = null
      }
    
      return wrapper;
    }
  }

  createFilterDropdown() {
    // add the normal filter types based on field type
    if (this.type == 'linked') {
      var options = {'is':'Equals', 'isNot':'Is not equal'};
    } else if (this.type == 'datetime') {
      var options = {'is':'Equals', 'isNot':'Is not equal', 'range':'is between'};
    } else if (this.type == 'varchar') {
      var options = {'is':'Equals', 'isNot':'Is not equal', 'range':'is between', 'containsAnd':'Contains (AND)', 'containsOr':'Contains (OR)'};
    } else if (this.type == 'bit') {
      var options = {'bool':'is'};
    } else if (this.type == 'int') {
      var options = {'is':'Equals', 'isNot':'Is not equal', 'range':'is between'};
    }
    // add the is none option
    if (this.nullable) options['noneType'] = 'None type filter'

    this.drop = createDropdown(options, this.oldOp);
    this.drop.onchange = this.changeOperation.bind(this);
    this.opCell.appendChild(this.drop);
    this.changeOperation();
  }

  changeOperation() {
    if (this.drop.value == 'is' || this.drop.value == 'isNot' || this.drop.value == 'containsAnd' || this.drop.value == 'containsOr') {
      this.generateInputFields();
    } else if (this.drop.value == 'range') this.createRange();
    else if (this.drop.value == 'bool') this.createBoolInput();
    else if (this.drop.value == 'noneType') this.createNoneType();
    else if (this.drop.value == 'null') this.valCell.innerHTML = '';
  }

  /************************** Members that populate the input container based on operation ******************************/
  generateInputFields() {
    this.valCell.innerHTML = '';
    this.valuesContainer = document.createElement('div');
    this.valuesContainer.classList = 'filterValues';
    this.valCell.appendChild(this.valuesContainer);

    let newButton = document.createElement('button');
    this.valCell.appendChild(newButton);
    newButton.textContent = 'Add Parameter';
    newButton.onclick = this.createInput.bind(this);

    if (this.operationInputRef[this.drop.value]) {
      for (let val of this.operationInputRef[this.drop.value]) {
        this.valuesContainer.appendChild(this.createRemoveX(val));
      }
    } else {
      this.operationInputRef[this.drop.value] = new Array();
      if (this.oldData) {
        for (let oldVal of this.oldData) {
          this.createInput('nada', oldVal);
        }
      } else {
        this.createInput();
      }
    }
  }

  createRange() {
    this.valCell.innerHTML = '';
    this.valuesContainer = document.createElement('div');
    this.valuesContainer.classList = 'filterRangeValues';
    this.valCell.appendChild(this.valuesContainer);

    if (this.operationInputRef[this.drop.value]) {
      this.valuesContainer.appendChild(this.operationInputRef[this.drop.value][0]);
      this.valuesContainer.appendChild(document.createTextNode('- and -'));
      this.valuesContainer.appendChild(this.operationInputRef[this.drop.value][1]);
    } else {
      this.operationInputRef[this.drop.value] = new Array();
      if (this.oldData) {
        this.createInput('nada', this.oldData[0], false);
        this.valuesContainer.appendChild(document.createTextNode('- and -'));
        this.createInput('nada', this.oldData[1], false);
      } else {
        this.createInput(null, null, false);
        this.valuesContainer.appendChild(document.createTextNode('- and -'));
        this.createInput(null, null, false);
      }
    }
  }

  createBoolInput() {
    this.valCell.innerHTML = '';
    this.valuesContainer = document.createElement('div');
    this.valuesContainer.classList = 'filterValues';
    this.valCell.appendChild(this.valuesContainer);
    if (this.operationInputRef[this.drop.value]) {
      for (let val of this.operationInputRef[this.drop.value]) {
        this.valuesContainer.appendChild(val);
      }
    } else {
      this.operationInputRef[this.drop.value] = new Array();
      if (this.oldData) {
        this.operationInputRef[this.drop.value].push(this.createBool(this.valuesContainer, this.oldData[0]));
      } else {
        this.operationInputRef[this.drop.value].push(this.createBool(this.valuesContainer, null));
      }
    }
  }

  createNoneType() {
    this.valCell.innerHTML = '';
    this.valuesContainer = document.createElement('div');
    this.valuesContainer.classList = 'filterValues';
    this.valCell.appendChild(this.valuesContainer);
    console.log('DROP VALUE', this.drop.value)
    if (this.operationInputRef[this.drop.value]) {
      for (let val of this.operationInputRef[this.drop.value]) {
        this.valuesContainer.appendChild(val);
      }
    } else {
      this.operationInputRef[this.drop.value] = new Array();
      if (this.oldData) {
        this.operationInputRef[this.drop.value].push(this.createNoneTypeInput(this.valuesContainer, this.oldData[0]));
      } else {
        this.operationInputRef[this.drop.value].push(this.createNoneTypeInput(this.valuesContainer, null));
      }
    }
  }

  /************************** Members that are called by the previous section that create inputs by type******************/
  createInput(nada, current=null, removeOption=true) {
    if (this.type == 'linked') {
      this.operationInputRef[this.drop.value].push(this.createDrop(this.valuesContainer, current, removeOption));
    } if (this.type == 'datetime') {
      this.operationInputRef[this.drop.value].push(this.createDate(this.valuesContainer, current, removeOption));
    } if (this.type == 'varchar') {
      this.operationInputRef[this.drop.value].push(this.createText(this.valuesContainer, current, removeOption));
    } if (this.type == 'bit') {
      this.operationInputRef[this.drop.value].push(this.createBool(this.valuesContainer, current, removeOption));
    } if (this.type == 'int') {
      this.operationInputRef[this.drop.value].push(this.createInt(this.valuesContainer, current, removeOption));
    }
      // disable the remove x if there is only one box
    if (this.removeBtn) this.removeBtn.disabled = !(this.operationInputRef[this.drop.value].length > 1);

  }

  // creates a div and fills with it with the input arg and an x that runs this.removeInput();
  createRemoveX(input) { 
    let div = document.createElement('div');
    div.classList.add('filterDiv');
    
    let removeX = document.createElement('p');
    removeX.classList = 'filterOptionX';
    removeX.innerHTML = '&times;';
    removeX.onclick = this.removeInput.bind(this);

    div.appendChild(input);
    div.appendChild(removeX);
    return div;
  }

  // given a mouse event it removes the input deleted 
  removeInput(event) {
    let inputToDelete = event.target.parentNode.childNodes[0];
    let inputsArray = this.operationInputRef[this.drop.value];
    if (inputsArray.length > 1) {
      inputToDelete.parentNode.display = 'none';
      inputToDelete.parentNode.innerHTML = '';
      inputsArray.splice(inputsArray.indexOf(inputToDelete), 1);
    } else { // if this input box is the last one
      // change the operation box to 'None'
      this.drop.value = "null";
      // run the operation dropdown change handler
      this.changeOperation();
    }
      
  }

  /***************** Members that create the actual input boxes based on type******************/
  createDrop(container, current, remove=false) {
    let dropdown = createDropdown(this.colData.linkObject, current);
    dropdown.classList.add('filterInput');

    if (remove) container.appendChild(this.createRemoveX(dropdown));
    else container.appendChild(dropdown);

    return dropdown;
  }

  createDate(container, current, remove=false) {
    let input = document.createElement('input');
    input.type = 'datetime-local';
      // parse datetime input
    if (current != null) {
      let dateEngine = new dateTimeVoodoo(current);
      input.value = dateEngine.forComputers();
    } else input.value = '1999-04-20T00:00'

   input.classList.add('filterInput');
    
    if (remove) container.appendChild(this.createRemoveX(input));
    else container.appendChild(input);

    return input;
  }

  createBool(container, current, remove=false) {
    let bool = createBool(current)
    bool.classList.add('filterInput');
    container.appendChild(bool);
    return bool;
  }

  createNoneTypeInput(container, current, remove=false) {
    console.log(this.colData);
    let dropdown = createDropdown({'isNone':'is \'None\'', 'isNotNone':'is NOT \'None\''}, current)
    dropdown.classList.add('filterInput');
    container.appendChild(dropdown);
    return dropdown;
  }

  createText(container, current, remove=false) {
    let input = document.createElement('input');
    input.type = 'text';
    input.value = current;
    input.classList.add('filterInput');
    
    if (remove) container.appendChild(this.createRemoveX(input));
    else container.appendChild(input);

    return input;
  }

  createInt(container, current, remove=false) {
    let integer = createIntegerInput(current)
    integer.classList.add('filterInput');

    if (remove) container.appendChild(this.createRemoveX(integer));
    else container.appendChild(integer);

    return integer;
  }
}

// function that returns the filter parameters as human readable text. given the filter parameters
function filterReadableText(data = JSON.parse(decodeURIComponent(new URLSearchParams(window.location.search).get('filter')))) {
  let out = new String(); // as in 'output'
  for (let col in data) {
    // 'links' is a global variable containing the linked columns with data
    out += '[ ' + ((col in window.links) ? window.links[col].info.replacement : col) + ' ';

    if (data[col].op == 'containsAnd') {
      out += 'Contains: ';
      for (let part of data[col].list) out += '\''+replaceIfLinked(col, part)+'\' ' + 'AND ';
      out = out.slice(0, -4); // remove last 4 characters
    } 
    else if (data[col].op == 'containsOr') {
      out += 'Contains: ';
      for (let part of data[col].list) out += '\''+replaceIfLinked(col, part)+'\' ' + 'OR ';
      out = out.slice(0, -3); // remove last 3 characters
    }
    else if (data[col].op == 'range') {
      out += 'is Between: \''+replaceIfLinked(col, data[col].list[0])+'\' And \'' + replaceIfLinked(col, data[col].list[1]) + '\'';
    } 
    else if (data[col].op == 'bool') {
      out += `is ${data[col].list[0]}`;
    }
    else if (data[col].op == 'noneType') {
      out += `is ${(data[col].list[0] == 'isNone') ? 'None':'not None'}`;
    }
    else if (data[col].op == 'showDeleted') {
      if (data[col].list[0] == 'true') out += `Showing Deleted Rows`;
  
    }
    else {
      out += data[col].op + ': ';
      for (let part of data[col].list) out += '\''+replaceIfLinked(col, part)+'\' OR ';
      out = out.slice(0, -3); // remove last 3 characters
    }
    out += ' ] ';
  }
  return out;
}

//replaces a value with it's linked value if it is linked else just passes the raw value
// ONLY FOR THE BASE LEVEL TABLE - not the audit tables etc. - it uses the global window.links variable 
function replaceIfLinked(col, raw) {
  return ((col in window.links) && isNum(raw)) ? (window.links[col][num(raw)]) : (raw);
}

/* This class it in the same format as the filterOption class except it is for the last
  showDeleted row. It still has the get data() method

*/
class showDeletedOption {
  constructor(container, existingArgs=null) {
    // update the existing args
    if (existingArgs) {
      if (existingArgs['showDeleted']) {
        this.oldData = JSON.parse(existingArgs['showDeleted']['list']);
        window.showDeletedRows = true; // save the state of the showDeleted as a global variable that way we can change how the rws behave
      } else {
        this.oldData = false;
        window.showDeletedRows = false;
      }
    } else {
      this.oldData = false;
    }

    // create a container to put our stuff in
    this.home = document.createElement('div');
    container.appendChild(this.home);
    this.home.classList.add('filterShowDeletedContainer');
    this.home.id = "showDeletedContainer";

    this.home.textContent = 'Show Deleted Rows: ';
    this.checkbox = document.createElement('input');
    this.checkbox.type = 'checkbox';
    this.checkbox.checked = this.oldData;
    this.home.append(this.checkbox);
  }

  get data() {
    if (this.checkbox.checked) {
      let data = new Object();
      data['op'] = 'showDeleted';
      data['list'] = JSON.stringify(true);

      let wrapper = new Object();
      wrapper['showDeleted'] = data;
      
      return wrapper;
    } else return null;
  }
}