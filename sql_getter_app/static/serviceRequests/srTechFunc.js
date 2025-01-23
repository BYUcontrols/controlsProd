/*  
    MASON:
    Functions for specific Technician-only functionalities
*/

// function that hides certain buttons and things if the user is not a technician
function displayTechnicianFunctionalities(userIsTech) {
    // // display these if the user is a technician
    // if (userIsTech) {
    //     // Show Open button
    //     document.getElementById('showOpen').classList.add('visible');
    //     document.getElementById('showOpen').classList.remove('invisible');
    //     //Show All button
    //     document.getElementById('showAll').classList.add('visible');
    //     document.getElementById('showAll').classList.remove('invisible');
    // }

    // // hide these if the user is not a technician
    // else {
        // Show Open button
        document.getElementById('showOpen').classList.add('invisible');
        document.getElementById('showOpen').classList.remove('visible');
        //Show All button
        document.getElementById('showAll').classList.add('invisible');
        document.getElementById('showAll').classList.remove('visible');
    // }
}

// changes the Show Open Requests button when it is clicked
function showOpenButtonTransformation(urlPath) {
    // for the show all open request filter page
    if (String(urlPath) === '/ServiceRequestShowAllOpenRequests') {
        document.getElementById('showOpen').innerText = 'Show Mine';
        document.getElementById('showOpen').onclick = function () {
            window.location.href = $SCRIPT_ROOT + "/ServiceRequest";
        }
    }

    // for the regular sr page
    else if (String(urlPath) === '/ServiceRequest' || String(urlPath) === '/ServiceRequestShowAllRequests') {
        document.getElementById('showOpen').innerText = 'Show Open';
        document.getElementById('showOpen').onclick = function () {
            window.location.href = $SCRIPT_ROOT + "/ServiceRequestShowAllOpenRequests";
        }
    }
}

// changes the Show All STATUSES Requests button when it is clicked
function showAllButtonTransformation(urlPath) {
    // for the show all statuses filter page
    if (String(urlPath) === '/ServiceRequestShowAllRequests') {
        // Show All button
        document.getElementById('showAll').innerText = 'Show Mine';
        document.getElementById('showAll').onclick = function () {
            window.location.href = $SCRIPT_ROOT + "/ServiceRequest";
        }
    }

    // for the regular sr page
    else if (String(urlPath) === '/ServiceRequest' || String(urlPath) === '/ServiceRequestShowAllOpenRequests') {
        document.getElementById('showAll').innerText = 'Show All';
        document.getElementById('showAll').onclick = function () {
            window.location.href = $SCRIPT_ROOT + "/ServiceRequestShowAllRequests";
        }
    }
}