// here are functions Isaac is proud of and wants to keep

// better sort function 
function sorting(c, d) {
    let posA = 0,
        posB = 0,
        verdict = 0,
        tempPosA = 0,
        tempPosB = 0;
    
    while (verdict == 0 && (c[posA] || d[posB])) { 
        a = c[posA];
        b = d[posB]; 
        console.log(a, b);
        if (!a) { verdict = -1; } 
        else if (!b) { verdict = 1; }
        else if (!isNum(a) && !isNum(b)) {
            verdict =  a.localeCompare(b);
        } else {
            tempPosA = posA;
            while (isNum(c[tempPosA])) { tempPosA ++; }
            numberA = num(c.substring(posA, tempPosA));
            console.log(posA, tempPosA, numberA);
            posA = tempPosA;

            tempPosB = posB;
            while (isNum(d[tempPosB])) { tempPosB ++; }
            numberB = num(d.substring(posB, tempPosB));
            console.log(posB, tempPosB, numberB);
            posB = tempPosB; 

            verdict = numberA - numberB;
        }
        posA ++;
        posB ++;
    }
    return verdict;
}

// a dropdown class for creating dropdowns
class dropdown {
    constructor() {}

    create(container, id=' ', onchange=' ', title=false) {
        if(title) {
                // Create a title for the select
            let text = document.createTextNode(title);
            container.appendChild(text);
        }
            // create new select
        this.select = document.createElement("SELECT");
            // assign that select with it's attributes
        this.select.setAttribute("id", id);
        this.select.setAttribute("onchange", onchange);
            // Put the select where it needs to go on the page
        container.appendChild(this.select);
        // creates the selecter using the columns object
    }

    option(text, value, selected=false) {
            // Create an option
        let option = document.createElement("option");
            // set option value as the column number
        option.setAttribute("value", value);
            // set option text as the column names
        let text = document.createTextNode(text);
            // Append the text and the option to the select
        if (selected) {
            option.selected = true;
        }
        option.appendChild(text);
        this.select.appendChild(option);
    }

    clear() {
        this.select.innerHTML = '';
    }
}
