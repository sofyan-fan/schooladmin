
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

  events.forEach(event => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = `${event.date} - ${event.name}`;
    eventList.appendChild(li);
  });
}

// Generate PDF
async function generatePDF() {
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

  const {
    jsPDF
  } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(12);
  doc.text('Event List', 10, 10);

  filteredEvents.forEach((event, index) => {
    doc.text(`${index + 1}. ${event.date} - ${event.name}`, 10, 20 + index * 10);
  });

  doc.save('events.pdf');
}