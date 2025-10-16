// Social Media Sharing JavaScript
class SocialShare {
  constructor() {
    this.initializeShareButtons();
  }

  // Initialize all share buttons
  initializeShareButtons() {
    // Share buttons for blog posts
    document.querySelectorAll(".share-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const url = btn.dataset.url || window.location.href;
        const title = btn.dataset.title || document.title;
        this.showShareModal(url, title);
      });
    });

    // Social share buttons on voting page
    document
      .querySelectorAll(".social-share-buttons .share-btn")
      .forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const platform = btn.dataset.platform;
          this.shareToPlatform(platform);
        });
      });
  }

  // Show share modal with platform options
  showShareModal(url, title) {
    // Create modal if it doesn't exist
    let modal = document.getElementById("share-modal");
    if (!modal) {
      modal = this.createShareModal();
      document.body.appendChild(modal);
    }

    // Update modal content
    modal.querySelector("#share-url").value = url;
    modal.querySelector("#share-title").value = title;

    // Show modal
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  // Create share modal
  createShareModal() {
    const modal = document.createElement("div");
    modal.id = "share-modal";
    modal.className = "modal";
    modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Share This Post</h3>
                    <button class="modal-close" id="share-modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="share-platforms">
                        <button class="share-platform-btn facebook" data-platform="facebook">
                            <i class="fab fa-facebook"></i>
                            Facebook
                        </button>
                        <button class="share-platform-btn twitter" data-platform="twitter">
                            <i class="fab fa-twitter"></i>
                            Twitter
                        </button>
                        <button class="share-platform-btn linkedin" data-platform="linkedin">
                            <i class="fab fa-linkedin"></i>
                            LinkedIn
                        </button>
                        <button class="share-platform-btn whatsapp" data-platform="whatsapp">
                            <i class="fab fa-whatsapp"></i>
                            WhatsApp
                        </button>
                        <button class="share-platform-btn telegram" data-platform="telegram">
                            <i class="fab fa-telegram"></i>
                            Telegram
                        </button>
                        <button class="share-platform-btn copy" data-platform="copy">
                            <i class="fas fa-copy"></i>
                            Copy Link
                        </button>
                    </div>
                    <div class="share-url-section">
                        <label for="share-url">URL:</label>
                        <input type="text" id="share-url" readonly>
                        <button class="copy-url-btn" id="copy-url-btn">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

    // Add event listeners
    modal.querySelector("#share-modal-close").addEventListener("click", () => {
      this.closeShareModal();
    });

    modal.addEventListener("click", (e) => {
      if (e.target.id === "share-modal") {
        this.closeShareModal();
      }
    });

    modal.querySelectorAll(".share-platform-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const platform = btn.dataset.platform;
        const url = modal.querySelector("#share-url").value;
        const title = modal.querySelector("#share-title").value;
        this.shareToPlatform(platform, url, title);
      });
    });

    modal.querySelector("#copy-url-btn").addEventListener("click", () => {
      this.copyToClipboard(modal.querySelector("#share-url").value);
    });

    return modal;
  }

  // Close share modal
  closeShareModal() {
    const modal = document.getElementById("share-modal");
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
    }
  }

  // Share to specific platform
  shareToPlatform(
    platform,
    url = window.location.href,
    title = document.title
  ) {
    const text = this.getShareText(title);
    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          url
        )}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          url
        )}&text=${encodeURIComponent(text)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          url
        )}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(
          text + " " + url
        )}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
          url
        )}&text=${encodeURIComponent(text)}`;
        break;
      case "copy":
        this.copyToClipboard(url);
        return;
    }

    if (shareUrl) {
      this.openShareWindow(shareUrl);
    }
  }

  // Get share text based on page
  getShareText(title) {
    if (window.location.pathname.includes("voting")) {
      return "Vote for your favorite Bigg Boss Telugu contestants! Your vote matters.";
    } else if (window.location.pathname.includes("blog")) {
      return `Check out this interesting post: ${title}`;
    } else {
      return `Check out this amazing content: ${title}`;
    }
  }

  // Open share window
  openShareWindow(url) {
    const width = 600;
    const height = 400;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;

    window.open(
      url,
      "share",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
  }

  // Copy to clipboard
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        this.showCopySuccess();
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand("copy");
          this.showCopySuccess();
        } catch (err) {
          console.error("Failed to copy text: ", err);
          this.showCopyError();
        }

        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error("Failed to copy text: ", err);
      this.showCopyError();
    }
  }

  // Show copy success message
  showCopySuccess() {
    this.showToast("Link copied to clipboard!", "success");
  }

  // Show copy error message
  showCopyError() {
    this.showToast("Failed to copy link. Please try again.", "error");
  }

  // Show toast notification
  showToast(message, type = "info") {
    // Remove existing toast
    const existingToast = document.querySelector(".social-share-toast");
    if (existingToast) {
      existingToast.remove();
    }

    // Create new toast
    const toast = document.createElement("div");
    toast.className = `social-share-toast ${type}`;
    toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${
                  type === "success"
                    ? "check-circle"
                    : type === "error"
                    ? "exclamation-circle"
                    : "info-circle"
                }"></i>
                <span>${message}</span>
            </div>
        `;

    // Add styles
    toast.style.cssText = `
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
            max-width: 300px;
        `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = "translateX(0)";
    }, 100);

    // Auto remove
    setTimeout(() => {
      toast.style.transform = "translateX(400px)";
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  // Share specific content (for blog posts)
  shareContent(content) {
    const url = content.url || window.location.href;
    const title = content.title || document.title;
    const description = content.description || "";
    const image = content.image || "";

    // Create share data
    const shareData = {
      title,
      text: description,
      url,
    };

    // Check if Web Share API is supported
    if (navigator.share) {
      navigator
        .share(shareData)
        .then(() => console.log("Content shared successfully"))
        .catch((error) => {
          console.log("Error sharing:", error);
          this.showShareModal(url, title);
        });
    } else {
      this.showShareModal(url, title);
    }
  }
}

// Initialize social sharing when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.socialShare = new SocialShare();
});

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = SocialShare;
}
