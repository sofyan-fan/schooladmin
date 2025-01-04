document.addEventListener("DOMContentLoaded", () => {
  // Select all buttons with the class 'admin-btn'
  const buttons = document.querySelectorAll(".admin-btn");

  // Attach a click event listener to each button
  buttons.forEach(button => {
      button.addEventListener("click", () => {
          // Remove the 'active' class from all buttons
          buttons.forEach(btn => btn.classList.remove("active"));
          
          // Add the 'active' class only to the clicked button
          button.classList.add("active");
      });
  });
});
