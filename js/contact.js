// Contact Form JavaScript
class ContactForm {
  constructor() {
    this.form = document.getElementById("contact-form");
    this.initializeForm();
    this.initializeFAQ();
  }

  // Initialize contact form
  initializeForm() {
    if (this.form) {
      this.form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleFormSubmission();
      });

      // Real-time validation
      this.initializeValidation();
    }
  }

  // Initialize form validation
  initializeValidation() {
    const inputs = this.form.querySelectorAll("input, textarea, select");

    inputs.forEach((input) => {
      input.addEventListener("blur", () => {
        this.validateField(input);
      });

      input.addEventListener("input", () => {
        this.clearFieldError(input);
      });
    });
  }

  // Handle form submission
  async handleFormSubmission() {
    if (!this.validateForm()) {
      return;
    }

    const submitBtn = document.getElementById("submit-btn");
    const btnText = submitBtn.querySelector(".btn-text");
    const btnLoading = submitBtn.querySelector(".btn-loading");

    // Show loading state
    btnText.style.display = "none";
    btnLoading.style.display = "inline-flex";
    submitBtn.disabled = true;

    try {
      const formData = this.getFormData();
      await this.submitForm(formData);
      this.showSuccessMessage();
      this.resetForm();
    } catch (error) {
      this.showErrorMessage("Failed to send message. Please try again later.");
    } finally {
      // Reset button state
      btnText.style.display = "inline";
      btnLoading.style.display = "none";
      submitBtn.disabled = false;
    }
  }

  // Validate entire form
  validateForm() {
    let isValid = true;
    const requiredFields = this.form.querySelectorAll("[required]");

    requiredFields.forEach((field) => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  }

  // Validate individual field
  validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    const errorElement = document.getElementById(`${fieldName}-error`);

    let isValid = true;
    let errorMessage = "";

    // Required field validation
    if (field.hasAttribute("required") && !value) {
      errorMessage = `${this.getFieldLabel(field)} is required.`;
      isValid = false;
    }

    // Email validation
    if (fieldName === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errorMessage = "Please enter a valid email address.";
        isValid = false;
      }
    }

    // Phone validation
    if (fieldName === "phone" && value) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(value.replace(/\s/g, ""))) {
        errorMessage = "Please enter a valid phone number.";
        isValid = false;
      }
    }

    // Message length validation
    if (fieldName === "message" && value && value.length < 10) {
      errorMessage = "Message must be at least 10 characters long.";
      isValid = false;
    }

    // Show/hide error
    if (errorElement) {
      if (isValid) {
        errorElement.textContent = "";
        field.classList.remove("error");
      } else {
        errorElement.textContent = errorMessage;
        field.classList.add("error");
      }
    }

    return isValid;
  }

  // Clear field error
  clearFieldError(field) {
    const fieldName = field.name;
    const errorElement = document.getElementById(`${fieldName}-error`);

    if (errorElement) {
      errorElement.textContent = "";
      field.classList.remove("error");
    }
  }

  // Get field label
  getFieldLabel(field) {
    const label = this.form.querySelector(`label[for="${field.id}"]`);
    return label ? label.textContent.replace("*", "").trim() : field.name;
  }

  // Get form data
  getFormData() {
    const formData = new FormData(this.form);
    const data = {};

    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }

    // Add metadata
    data.timestamp = new Date().toISOString();
    data.userAgent = navigator.userAgent;
    data.referrer = document.referrer;

    return data;
  }

  // Submit form (mock implementation)
  async submitForm(data) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Store in localStorage for demo purposes
    const submissions = JSON.parse(
      localStorage.getItem("contactSubmissions") || "[]"
    );
    submissions.push(data);
    localStorage.setItem("contactSubmissions", JSON.stringify(submissions));

    // In production, send to your backend API
    console.log("Contact form submission:", data);

    // Simulate occasional failure for testing
    if (Math.random() < 0.1) {
      throw new Error("Simulated server error");
    }
  }

  // Show success message
  showSuccessMessage() {
    if (window.biggBossBlog) {
      window.biggBossBlog.showMessage(
        "Thank you for your message! We'll get back to you within 24 hours.",
        "success"
      );
    } else {
      alert(
        "Thank you for your message! We'll get back to you within 24 hours."
      );
    }
  }

  // Show error message
  showErrorMessage(message) {
    if (window.biggBossBlog) {
      window.biggBossBlog.showMessage(message, "error");
    } else {
      alert(message);
    }
  }

  // Reset form
  resetForm() {
    this.form.reset();

    // Clear all error messages
    const errorMessages = this.form.querySelectorAll(".error-message");
    errorMessages.forEach((error) => {
      error.textContent = "";
    });

    // Remove error classes
    const errorFields = this.form.querySelectorAll(".error");
    errorFields.forEach((field) => {
      field.classList.remove("error");
    });
  }

  // Initialize FAQ functionality
  initializeFAQ() {
    const faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach((item) => {
      const question = item.querySelector(".faq-question");
      const answer = item.querySelector(".faq-answer");
      const icon = question.querySelector("i");

      question.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");

        // Close all other FAQ items
        faqItems.forEach((otherItem) => {
          if (otherItem !== item) {
            otherItem.classList.remove("open");
            const otherAnswer = otherItem.querySelector(".faq-answer");
            const otherIcon = otherItem.querySelector(".faq-question i");
            otherAnswer.style.maxHeight = null;
            otherIcon.style.transform = "rotate(0deg)";
          }
        });

        // Toggle current item
        if (isOpen) {
          item.classList.remove("open");
          answer.style.maxHeight = null;
          icon.style.transform = "rotate(0deg)";
        } else {
          item.classList.add("open");
          answer.style.maxHeight = answer.scrollHeight + "px";
          icon.style.transform = "rotate(180deg)";
        }
      });
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.contactForm = new ContactForm();
});

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = ContactForm;
}
