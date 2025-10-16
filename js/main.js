// Main JavaScript file for Memes Muthyam with Real-time Features
class BiggBossBlog {
  constructor() {
    this.baseURL = "http://localhost:3000/api";
    this.socket = null;
    this.initializeSocket();
    this.initializeNavigation();
    this.initializeNewsletter();
    this.initializeBlogFeatures();
    this.initializeLazyLoading();
    this.initializeAccessibility();
    this.initializePerformance();
  }

  // Initialize navigation
  initializeNavigation() {
    const navToggle = document.getElementById("nav-toggle");
    const navMenu = document.getElementById("nav-menu");

    if (navToggle && navMenu) {
      navToggle.addEventListener("click", () => {
        navMenu.classList.toggle("active");
        navToggle.classList.toggle("active");
      });

      // Close menu when clicking on a link
      document.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", () => {
          navMenu.classList.remove("active");
          navToggle.classList.remove("active");
        });
      });

      // Close menu when clicking outside
      document.addEventListener("click", (e) => {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
          navMenu.classList.remove("active");
          navToggle.classList.remove("active");
        }
      });
    }
  }

  // Initialize Socket.IO connection for real-time updates
  initializeSocket() {
    // Load Socket.IO client library if not already loaded
    if (typeof io === "undefined") {
      const script = document.createElement("script");
      script.src = "/socket.io/socket.io.js";
      script.onload = () => this.connectSocket();
      document.head.appendChild(script);
    } else {
      this.connectSocket();
    }
  }

  connectSocket() {
    try {
      this.socket = io("http://localhost:3000");

      this.socket.on("connect", () => {
        console.log("✅ Connected to blog server");
        this.socket.emit("subscribe-blog");
      });

      this.socket.on("postView", (data) => {
        console.log("📊 Real-time view update:", data);
        this.updatePostViewCount(data);
      });

      this.socket.on("postShare", (data) => {
        console.log("📤 Real-time share update:", data);
        this.updatePostShareCount(data);
      });

      this.socket.on("newComment", (data) => {
        console.log("💬 New comment:", data);
        // You can add real-time comment updates here if needed
      });

      this.socket.on("disconnect", () => {
        console.log("❌ Disconnected from blog server");
      });
    } catch (error) {
      console.error("Socket connection error:", error);
    }
  }

  // Initialize blog-specific features
  initializeBlogFeatures() {
    this.loadBlogPosts();
    this.initializeBlogShareButtons();
    this.initializeBlogViewTracking();
  }

  // Load blog posts from API
  async loadBlogPosts() {
    try {
      const response = await fetch(`${this.baseURL}/blog/posts?limit=6`);
      const data = await response.json();

      if (data.success && data.data.posts) {
        this.updateBlogSection(data.data.posts);
      }
    } catch (error) {
      console.error("Error loading blog posts:", error);
    }
  }

  // Update blog section with real data
  updateBlogSection(posts) {
    const blogGrid = document.querySelector(".blog-grid");
    if (!blogGrid) return;

    // Keep the existing structure but update content
    const existingCards = blogGrid.querySelectorAll(".blog-card");
    existingCards.forEach((card, index) => {
      if (posts[index]) {
        const post = posts[index];

        // Update image
        const img = card.querySelector(".blog-img");
        if (img) img.src = post.featuredImage;

        // Update title
        const title = card.querySelector(".blog-title");
        if (title) {
          title.textContent = post.title;
          title.closest("a").href = `blog/${post.slug}.html`;
        }

        // Update excerpt
        const excerpt = card.querySelector(".blog-excerpt");
        if (excerpt) excerpt.textContent = post.excerpt;

        // Update category
        const category = card.querySelector(".blog-category");
        if (category)
          category.textContent =
            post.category.charAt(0).toUpperCase() + post.category.slice(1);

        // Update views
        const views = card.querySelector(".blog-views");
        if (views)
          views.innerHTML = `<i class="fas fa-eye"></i> ${this.formatNumber(
            post.viewCount
          )} views`;

        // Update share button data
        const shareBtn = card.querySelector(".share-btn");
        if (shareBtn) {
          shareBtn.dataset.url = `blog/${post.slug}.html`;
          shareBtn.dataset.title = post.title;
        }
      }
    });
  }

  // Initialize blog share buttons with API integration
  initializeBlogShareButtons() {
    document.querySelectorAll(".share-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const url = btn.dataset.url || window.location.href;
        const title = btn.dataset.title || document.title;

        // Show share modal
        if (window.socialShare) {
          window.socialShare.showShareModal(url, title);
        }

        // Track share via API if it's a blog post
        if (url.includes("/blog/")) {
          const slug = url.match(/blog\/([^\/]+)\.html$/)?.[1];
          if (slug) {
            this.trackShare(slug, "modal");
          }
        }
      });
    });
  }

  // Track blog post share
  async trackShare(slug, platform) {
    try {
      await fetch(`${this.baseURL}/blog/post/${slug}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ platform }),
      });
    } catch (error) {
      console.error("Error tracking share:", error);
    }
  }

  // Initialize view tracking for blog posts
  initializeBlogViewTracking() {
    // Track page view if it's a blog post page
    const path = window.location.pathname;
    const match = path.match(/\/blog\/([^\/]+)\.html$/);
    if (match) {
      const slug = match[1];
      this.trackPageView(slug);
    }
  }

  // Track page view
  async trackPageView(slug) {
    try {
      // The view count is automatically incremented when fetching the blog post
      // This could be used for additional analytics
      console.log("Page view tracked for:", slug);
    } catch (error) {
      console.error("Error tracking page view:", error);
    }
  }

  // Update post view count in real-time
  updatePostViewCount(data) {
    const { postId, newViewCount } = data;
    // Update view count in the UI if the post is currently displayed
    const viewElements = document.querySelectorAll("[data-post-id]");
    viewElements.forEach((el) => {
      if (el.dataset.postId === postId) {
        const countEl = el.querySelector(".view-count");
        if (countEl) {
          countEl.textContent = this.formatNumber(newViewCount);
        }
      }
    });
  }

  // Update post share count in real-time
  updatePostShareCount(data) {
    const { postId, newShareCount } = data;
    // Update share count in the UI if the post is currently displayed
    const shareElements = document.querySelectorAll("[data-post-id]");
    shareElements.forEach((el) => {
      if (el.dataset.postId === postId) {
        const countEl = el.querySelector(".share-count");
        if (countEl) {
          countEl.textContent = this.formatNumber(newShareCount);
        }
      }
    });
  }

  // Format number with commas
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Initialize newsletter subscription
  initializeNewsletter() {
    const newsletterForms = document.querySelectorAll(".newsletter-form");

    newsletterForms.forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleNewsletterSubmission(form);
      });
    });
  }

  // Handle newsletter submission
  async handleNewsletterSubmission(form) {
    const emailInput = form.querySelector(".newsletter-input");
    const submitBtn = form.querySelector(".newsletter-btn");
    const email = emailInput.value.trim();

    if (!this.isValidEmail(email)) {
      this.showMessage("Please enter a valid email address.", "error");
      return;
    }

    // Disable form
    submitBtn.disabled = true;
    submitBtn.textContent = "Subscribing...";

    try {
      // Simulate API call (replace with actual implementation)
      await this.subscribeToNewsletter(email);
      this.showMessage(
        "Thank you for subscribing! You will receive updates soon.",
        "success"
      );
      emailInput.value = "";
    } catch (error) {
      this.showMessage("Subscription failed. Please try again later.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Subscribe";
    }
  }

  // Validate email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Subscribe to newsletter (mock implementation)
  async subscribeToNewsletter(email) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Store in localStorage for demo purposes
    const subscribers = JSON.parse(
      localStorage.getItem("newsletterSubscribers") || "[]"
    );
    if (!subscribers.includes(email)) {
      subscribers.push(email);
      localStorage.setItem(
        "newsletterSubscribers",
        JSON.stringify(subscribers)
      );
    }

    // In production, send to your backend API
    console.log("Newsletter subscription:", email);
  }

  // Initialize lazy loading for images
  initializeLazyLoading() {
    if ("IntersectionObserver" in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove("lazy");
            observer.unobserve(img);
          }
        });
      });

      document.querySelectorAll("img[data-src]").forEach((img) => {
        imageObserver.observe(img);
      });
    }
  }

  // Initialize accessibility features
  initializeAccessibility() {
    // Skip to main content link
    this.createSkipLink();

    // Keyboard navigation
    this.initializeKeyboardNavigation();

    // Focus management
    this.initializeFocusManagement();

    // ARIA labels for interactive elements
    this.initializeARIALabels();
  }

  // Create skip to main content link
  createSkipLink() {
    const skipLink = document.createElement("a");
    skipLink.href = "#main-content";
    skipLink.textContent = "Skip to main content";
    skipLink.className = "skip-link";
    skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: #000;
            color: #fff;
            padding: 8px;
            text-decoration: none;
            z-index: 10000;
            transition: top 0.3s;
        `;

    skipLink.addEventListener("focus", () => {
      skipLink.style.top = "6px";
    });

    skipLink.addEventListener("blur", () => {
      skipLink.style.top = "-40px";
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  // Initialize keyboard navigation
  initializeKeyboardNavigation() {
    // Handle escape key for modals
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeAllModals();
      }
    });

    // Handle tab navigation
    document.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        document.body.classList.add("keyboard-navigation");
      }
    });

    document.addEventListener("mousedown", () => {
      document.body.classList.remove("keyboard-navigation");
    });
  }

  // Close all modals
  closeAllModals() {
    document.querySelectorAll(".modal.show").forEach((modal) => {
      modal.classList.remove("show");
      modal.style.display = "none";
    });
    document.body.style.overflow = "auto";
  }

  // Initialize focus management
  initializeFocusManagement() {
    // Focus management for modals
    document.addEventListener("focusin", (e) => {
      const modal = e.target.closest(".modal");
      if (modal && modal.style.display !== "none") {
        this.trapFocus(modal);
      }
    });
  }

  // Trap focus within modal
  trapFocus(modal) {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    modal.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    });
  }

  // Initialize ARIA labels
  initializeARIALabels() {
    // Add ARIA labels to buttons without text
    document
      .querySelectorAll("button:not([aria-label]):not([aria-labelledby])")
      .forEach((btn) => {
        if (!btn.textContent.trim()) {
          btn.setAttribute("aria-label", "Button");
        }
      });

    // Add ARIA labels to images without alt text
    document.querySelectorAll("img:not([alt])").forEach((img) => {
      img.setAttribute("alt", "Image");
    });
  }

  // Initialize performance optimizations
  initializePerformance() {
    // Preload critical resources
    this.preloadCriticalResources();

    // Optimize images
    this.optimizeImages();

    // Initialize service worker (if available)
    this.initializeServiceWorker();
  }

  // Preload critical resources
  preloadCriticalResources() {
    const criticalImages = ["images/hero-bigg-boss.jpg", "images/logo.png"];

    criticalImages.forEach((src) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = src;
      document.head.appendChild(link);
    });
  }

  // Optimize images
  optimizeImages() {
    // Add loading="lazy" to images below the fold
    const images = document.querySelectorAll("img:not([loading])");
    images.forEach((img, index) => {
      if (index > 2) {
        // Skip first few images
        img.loading = "lazy";
      }
    });
  }

  // Initialize service worker
  async initializeServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker registered:", registration);
      } catch (error) {
        console.log("Service Worker registration failed:", error);
      }
    }
  }

  // Show message to user
  showMessage(message, type = "info") {
    // Remove existing message
    const existingMessage = document.querySelector(".user-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    // Create message element
    const messageEl = document.createElement("div");
    messageEl.className = `user-message ${type}`;
    messageEl.innerHTML = `
            <div class="message-content">
                <i class="fas fa-${
                  type === "success"
                    ? "check-circle"
                    : type === "error"
                    ? "exclamation-circle"
                    : "info-circle"
                }"></i>
                <span>${message}</span>
                <button class="message-close">&times;</button>
            </div>
        `;

    // Add styles
    messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${
              type === "success"
                ? "#4caf50"
                : type === "error"
                ? "#f44336"
                : "#2196f3"
            };
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            z-index: 3000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            max-width: 400px;
        `;

    document.body.appendChild(messageEl);

    // Animate in
    setTimeout(() => {
      messageEl.style.transform = "translateX(0)";
    }, 100);

    // Close button
    messageEl.querySelector(".message-close").addEventListener("click", () => {
      messageEl.style.transform = "translateX(400px)";
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.parentNode.removeChild(messageEl);
        }
      }, 300);
    });

    // Auto remove
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.style.transform = "translateX(400px)";
        setTimeout(() => {
          if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
          }
        }, 300);
      }
    }, 5000);
  }

  // Utility function to debounce
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Utility function to throttle
  throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.biggBossBlog = new BiggBossBlog();
});

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // Page is hidden, pause any animations or timers
    console.log("Page hidden");
  } else {
    // Page is visible, resume animations or timers
    console.log("Page visible");
  }
});

// Handle online/offline status
window.addEventListener("online", () => {
  console.log("Connection restored");
  if (window.biggBossBlog) {
    window.biggBossBlog.showMessage("Connection restored!", "success");
  }
});

window.addEventListener("offline", () => {
  console.log("Connection lost");
  if (window.biggBossBlog) {
    window.biggBossBlog.showMessage(
      "You are offline. Some features may not work.",
      "error"
    );
  }
});

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = BiggBossBlog;
}
