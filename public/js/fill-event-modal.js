document.addEventListener('DOMContentLoaded', function () {
  // Add event listener to the edit buttons
  const editButtons = document.querySelectorAll('.btn-primary[data-bs-toggle="modal"]');
  
  editButtons.forEach(button => {
    button.addEventListener('click', function () {
      // Get event data from button data attributes
      const eventId = this.getAttribute('data-event-id');
      const eventName = this.getAttribute('data-event-name');
      const eventDate = this.getAttribute('data-event-date');

      // Set the form action dynamically based on the event ID
      const form = document.getElementById('editEventForm');
      form.action = '/event/edit/' + eventId;  // Make sure the URL is `/event/edit/{eventId}`

      // Fill the modal with event data
      document.getElementById('modalEventId').value = eventId;
      document.getElementById('modalEventName').value = eventName;
      document.getElementById('modalEventDate').value = eventDate;

    });
  });
});