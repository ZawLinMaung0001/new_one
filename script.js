// Mobile navigation toggle
const nav = document.getElementById("nav");
const navToggle = document.getElementById("navToggle");

if (nav && navToggle) {
  navToggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });

  // Close nav when clicking a link (on mobile)
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
    });
  });
}

// Contact form validation (client-side only demo)
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const nameInput = contactForm.querySelector("#name");
    const emailInput = contactForm.querySelector("#email");
    const messageInput = contactForm.querySelector("#message");

    const fields = [nameInput, emailInput, messageInput];
    let isValid = true;

    fields.forEach((field) => {
      const errorEl = field.parentElement.querySelector(".error-message");
      field.classList.remove("error");
      if (errorEl) {
        errorEl.textContent = "";
      }

      if (!field.value.trim()) {
        isValid = false;
        field.classList.add("error");
        if (errorEl) {
          errorEl.textContent = "This field is required.";
        }
      }
    });

    if (isValid && emailInput.value.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(emailInput.value.trim())) {
        isValid = false;
        emailInput.classList.add("error");
        const errorEl = emailInput.parentElement.querySelector(".error-message");
        if (errorEl) {
          errorEl.textContent = "Please enter a valid email address.";
        }
      }
    }

    if (!isValid) {
      formStatus.textContent = "Please fix the highlighted fields and try again.";
      return;
    }

    // Demo behavior: just show a message and clear the form
    formStatus.textContent =
      "Thank you! Your message has been prepared (demo only, no email is actually sent).";
    contactForm.reset();
  });
}

// Dynamic year in footer
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}
