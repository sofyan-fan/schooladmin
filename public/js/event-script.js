// Array to store events

const events = [];

 

// Add Event

document.getElementById('event-form').addEventListener('submit', function (e) {

    e.preventDefault();

 

    const date = document.getElementById('event-date').value;

    const name = document.getElementById('event-name').value;

 

    if (date && name) {

        const formattedDate = formatDate(date);

        events.push({

            date: formattedDate,

            name

        });

        events.sort((a, b) => new Date(a.date.split('-').reverse().join('-')) - new Date(b.date.split('-').reverse().join('-')));

        updateEventList();

 

        // Reset form

        document.getElementById('event-form').reset();

    }

});

 

// Format Date to dd-mm-yyyy

function formatDate(date) {

    const [year, month, day] = date.split('-');

    return `${day}-${month}-${year}`;

}

 

// Update Event List Display

function updateEventList() {

    const eventList = document.getElementById('event-list');

    eventList.innerHTML = '';

 

    events.forEach((event, index) => {

        const li = document.createElement('li');

        li.className = 'list-group-item d-flex justify-content-between align-items-center m-1 rounded-2';

 

        const eventText = document.createElement('span');

        eventText.textContent = `${event.date} - ${event.name}`;

 

        const btnGroup = document.createElement('div');

 

        // Edit Button

        const editBtn = document.createElement('button');

        editBtn.className = 'btn btn-warning btn-sm me-2';

        editBtn.setAttribute('data-bs-toggle', 'modal');

        editBtn.setAttribute('data-bs-target', '#exampleModal');

        editBtn.textContent = 'Edit';

        editBtn.onclick = () => editEvent(index);

 

        // Delete Button

        const deleteBtn = document.createElement('button');

        deleteBtn.className = 'btn btn-danger btn-sm';

        deleteBtn.textContent = 'Delete';

        deleteBtn.onclick = () => deleteEvent(index);

 

        btnGroup.appendChild(editBtn);

        btnGroup.appendChild(deleteBtn);

 

        li.appendChild(eventText);

        li.appendChild(btnGroup);

        eventList.appendChild(li);

    });

}

 

// Edit Event

function editEvent(index) {

    const event = events[index];

    const [day, month, year] = event.date.split('-');

    const formattedDate = `${year}-${month}-${day}`;

    document.getElementById('event-date').value = formattedDate;

    document.getElementById('event-name').value = event.name;

 

    // Remove the event being edited from the list

    events.splice(index, 1);

    updateEventList();

}

 

// Delete Event

function deleteEvent(index) {

    events.splice(index, 1);

    updateEventList();

}

 

// Generate PDF

async function generatePDF() {

  console.log(window.jspdf);

 

  const startDate = new Date(document.getElementById('start-date').value);

  const endDate = new Date(document.getElementById('end-date').value);

 

  if (!startDate || !endDate || startDate > endDate) {

      alert('Please select a valid date range.');

      return;

  }

 

  const filteredEvents = events.filter(event => {

      const [day, month, year] = event.date.split('-');

      const eventDate = new Date(`${year}-${month}-${day}`);

      return eventDate >= startDate && eventDate <= endDate;

  });

 

  if (filteredEvents.length === 0) {

      alert('No events found in the selected date range.');

      return;

  }

 

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();

 

  doc.setFontSize(12);

  doc.text('Event List', 10, 10);

 

  filteredEvents.forEach((event, index) => {

      doc.text(`${index + 1}. ${event.date} - ${event.name}`, 10, 20 + index * 10);

  });

 

  doc.save('events.pdf');

}

 