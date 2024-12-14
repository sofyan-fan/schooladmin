// Ensure this script is linked in your HTML
// This function generates a PDF of events between the selected start and end dates.

async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;
    const eventList = document.getElementById("event-list");

    // Validate date inputs
    if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
        alert("Start date cannot be later than end date.");
        return;
    }

    const events = Array.from(eventList.getElementsByTagName("li"));
    const filteredEvents = [];

    events.forEach((eventItem) => {
        const eventNameElement = eventItem.querySelector(".event-name-pdf");
        const eventDateElement = eventItem.querySelector(".event-date-pdf");

        if (eventNameElement && eventDateElement) {
            const eventName = eventNameElement.textContent.trim();
            const eventDate = new Date(eventDateElement.textContent.trim());

            if (eventDate >= start && eventDate <= end) {
                filteredEvents.push({ name: eventName, date: eventDate.toLocaleDateString() });
            }
        }
    });

    if (filteredEvents.length === 0) {
        alert("No events found in the specified date range.");
        return;
    }

    // Create a new PDF instance
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Event List", 105, 15, null, null, "center");

    doc.setFontSize(12);
    doc.text(`Events from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`, 105, 25, null, null, "center");

    let yOffset = 40;

    filteredEvents.forEach((event, index) => {
        doc.text(`${index + 1}. ${event.name} - ${event.date}`, 10, yOffset);
        yOffset += 10;

        // Create a new page if content exceeds page height
        if (yOffset > 280) {
            doc.addPage();
            yOffset = 20;
        }
    });

    // Save the PDF
    doc.save("events.pdf");
}
