// Voting System JavaScript with Real-time MongoDB Integration
class VotingSystem {
  constructor() {
    this.baseURL = "http://localhost:3000/api";
    this.contestants = [];
    this.votingStatus = {
      dailyVoteCount: 0,
      remainingVotes: 3,
      votedContestants: [],
    };
    this.socket = null;
    this.initializeSocket();
    this.initializeEventListeners();
    this.loadContestants();
    this.loadVotingStatus();
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
        console.log("✅ Connected to voting server");
        this.socket.emit("subscribe-voting");
      });

      this.socket.on("voteUpdate", (data) => {
        console.log("🗳️ Real-time vote update:", data);
        this.updateContestantVotes(data);
      });

      this.socket.on("disconnect", () => {
        console.log("❌ Disconnected from voting server");
      });
    } catch (error) {
      console.error("Socket connection error:", error);
      // Fallback to polling if socket fails
      this.startPolling();
    }
  }

  // Fallback polling for updates if WebSocket fails
  startPolling() {
    setInterval(() => {
      this.loadContestants();
      this.loadVotingStatus();
    }, 30000); // Poll every 30 seconds
  }

  // Load contestants from MongoDB
  async loadContestants() {
    try {
      const response = await fetch(`${this.baseURL}/voting/contestants`);
      const data = await response.json();

      if (data.success) {
        this.contestants = data.data;
        this.renderContestants();
        this.updateVoteStats(data.totalVotes, data.totalContestants);
      } else {
        console.error("Failed to load contestants:", data.message);
        this.showMessage("Failed to load voting data", "error");
      }
    } catch (error) {
      console.error("Error loading contestants:", error);
      this.showMessage("Unable to connect to voting server", "error");
    }
  }

  // Load current voting status for the user
  async loadVotingStatus() {
    try {
      const response = await fetch(`${this.baseURL}/voting/status`);
      const data = await response.json();

      if (data.success) {
        this.votingStatus = data.data;
        this.updateVotingStatus();
      }
    } catch (error) {
      console.error("Error loading voting status:", error);
    }
  }

  // Render contestants from MongoDB data
  renderContestants() {
    const grid = document.getElementById("contestants-grid");
    if (!grid) return;

    grid.innerHTML = "";

    this.contestants.forEach((contestant, index) => {
      const hasVoted = this.votingStatus.votedContestants.some(
        (voted) => voted.contestantId === contestant._id
      );

      const contestantCard = this.createContestantCard(contestant, hasVoted);
      grid.appendChild(contestantCard);
    });
  }

  // Create contestant card element
  createContestantCard(contestant, hasVoted = false) {
    const card = document.createElement("div");
    card.className = `contestant-card ${hasVoted ? "voted" : ""}`;
    card.setAttribute("data-contestant", contestant._id);

    card.innerHTML = `
      <div class="contestant-image">
        <img src="${contestant.image}" alt="${
      contestant.name
    }" class="contestant-img" />
        <div class="contestant-overlay">
          <button class="vote-btn" data-contestant="${contestant._id}" ${
      hasVoted || this.votingStatus.remainingVotes <= 0 ? "disabled" : ""
    }>
            <i class="fas fa-vote-yea"></i>
            ${hasVoted ? "Voted" : "Vote"}
          </button>
        </div>
      </div>
      <div class="contestant-info">
        <h3 class="contestant-name">${contestant.name}</h3>
        <p class="contestant-description">${contestant.description}</p>
        <div class="contestant-stats">
          <div class="vote-count">
            <i class="fas fa-heart"></i>
            <span class="votes" data-votes="${
              contestant._id
            }">${this.formatNumber(contestant.votes)}</span> votes
          </div>
          <div class="vote-percentage">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${
                contestant.votePercentage || 0
              }%"></div>
            </div>
            <span class="percentage">${contestant.votePercentage || 0}%</span>
          </div>
        </div>
      </div>
    `;

    // Add click event listener
    const voteBtn = card.querySelector(".vote-btn");
    voteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!hasVoted && this.votingStatus.remainingVotes > 0) {
        this.handleVoteClick(contestant._id, contestant);
      }
    });

    return card;
  }

  // Handle vote button click
  async handleVoteClick(contestantId, contestantData) {
    if (this.votingStatus.remainingVotes <= 0) {
      this.showMessage("You have reached your daily vote limit", "error");
      return;
    }

    this.showVoteModal(contestantData);
  }

  // Show vote confirmation modal
  showVoteModal(contestant) {
    const modal = document.getElementById("vote-modal");
    if (!modal) return;

    // Update modal content
    document.getElementById("modal-contestant-img").src = contestant.image;
    document.getElementById("modal-contestant-img").alt = contestant.name;
    document.getElementById("modal-contestant-name").textContent =
      contestant.name;
    document.getElementById("modal-contestant-description").textContent =
      contestant.description;

    // Store contestant data for confirmation
    modal.dataset.contestantId = contestant._id;

    modal.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  // Submit vote to server
  async submitVote(contestantId) {
    try {
      const response = await fetch(`${this.baseURL}/voting/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contestantId }),
      });

      const data = await response.json();

      if (data.success) {
        this.closeModal();
        this.showSuccessToast();
        // Update local state
        this.votingStatus.remainingVotes = data.data.remainingVotes;
        this.votingStatus.votedContestants.push({
          contestantId: contestantId,
          voteTime: new Date(),
        });
        this.updateVotingStatus();
        this.loadContestants(); // Refresh data
      } else {
        this.showMessage(data.message, "error");
      }
    } catch (error) {
      console.error("Error submitting vote:", error);
      this.showMessage("Failed to submit vote. Please try again.", "error");
    }
  }

  // Update contestant votes in real-time
  updateContestantVotes(data) {
    const { contestantId, newVoteCount, votePercentage, totalVotes } = data;

    // Update the specific contestant's vote count
    const voteElement = document.querySelector(
      `[data-votes="${contestantId}"]`
    );
    if (voteElement) {
      voteElement.textContent = this.formatNumber(newVoteCount);
    }

    // Update progress bar and percentage
    const contestantCard = document.querySelector(
      `[data-contestant="${contestantId}"]`
    );
    if (contestantCard) {
      const progressFill = contestantCard.querySelector(".progress-fill");
      const percentage = contestantCard.querySelector(".percentage");

      if (progressFill) progressFill.style.width = `${votePercentage}%`;
      if (percentage) percentage.textContent = `${votePercentage}%`;
    }

    // Update total votes in hero section
    this.updateVoteStats(totalVotes);
  }

  // Update vote statistics in the hero section
  updateVoteStats(totalVotes, totalContestants = null) {
    const totalVotesElement = document.getElementById("total-votes");
    if (totalVotesElement) {
      totalVotesElement.textContent = this.formatNumber(totalVotes);
    }

    if (totalContestants !== null) {
      const contestantsElement = document.querySelector(".stat-number");
      if (contestantsElement) {
        contestantsElement.textContent = totalContestants;
      }
    }

    // Update user votes
    const userVotesElement = document.getElementById("your-votes");
    if (userVotesElement) {
      userVotesElement.textContent = this.votingStatus.dailyVoteCount;
    }
  }

  // Update voting status display
  updateVotingStatus() {
    const statusElement = document.getElementById("voting-status");
    if (!statusElement) return;

    const statusSpan = statusElement.querySelector("span");
    if (this.votingStatus.remainingVotes <= 0) {
      statusElement.className = "voting-status voted-limit";
      statusSpan.textContent = "You have reached your daily vote limit";
    } else {
      statusElement.className = "voting-status";
      statusSpan.textContent = `You can vote for ${this.votingStatus.remainingVotes} more contestants today`;
    }
  }

  // Close modal
  closeModal() {
    const modal = document.getElementById("vote-modal");
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
    }
  }

  // Show success toast
  showSuccessToast() {
    const toast = document.getElementById("success-toast");
    if (toast) {
      toast.style.display = "block";
      setTimeout(() => {
        toast.style.display = "none";
      }, 3000);
    }
  }

  // Format number with commas
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Show message to user
  showMessage(message, type = "info") {
    // Create or update message element
    let messageEl = document.querySelector(".user-message");
    if (!messageEl) {
      messageEl = document.createElement("div");
      messageEl.className = "user-message";
      document.body.appendChild(messageEl);
    }

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

    // Style the message
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
      max-width: 400px;
      transform: translateX(400px);
      transition: transform 0.3s ease;
    `;

    // Animate in
    setTimeout(() => {
      messageEl.style.transform = "translateX(0)";
    }, 100);

    // Close button functionality
    messageEl.querySelector(".message-close").addEventListener("click", () => {
      messageEl.style.transform = "translateX(400px)";
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.parentNode.removeChild(messageEl);
        }
      }, 300);
    });

    // Auto remove after 5 seconds
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

  // Initialize event listeners
  initializeEventListeners() {
    // Modal close events
    const modalClose = document.getElementById("modal-close");
    const cancelVote = document.getElementById("cancel-vote");
    const confirmVote = document.getElementById("confirm-vote");

    if (modalClose) {
      modalClose.addEventListener("click", () => this.closeModal());
    }

    if (cancelVote) {
      cancelVote.addEventListener("click", () => this.closeModal());
    }

    if (confirmVote) {
      confirmVote.addEventListener("click", () => {
        const modal = document.getElementById("vote-modal");
        const contestantId = modal.dataset.contestantId;
        if (contestantId) {
          this.submitVote(contestantId);
        }
      });
    }

    // Close modal on outside click
    const modal = document.getElementById("vote-modal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }

    // Social share buttons
    document
      .querySelectorAll(".social-share-buttons .share-btn")
      .forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const platform = btn.dataset.platform;
          this.shareVotingPage(platform);
        });
      });
  }

  // Share voting page
  shareVotingPage(platform) {
    const url = window.location.href;
    const title = "Vote for Bigg Boss Telugu Contestants on Memes Muthyam";

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
        )}&text=${encodeURIComponent(title)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(
          title + " " + url
        )}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  }
}

// Initialize voting system when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.votingSystem = new VotingSystem();
});
