// Voting System JavaScript with Real-time MongoDB Integration
class VotingSystem {
  constructor() {
    // Use configuration from config.js if available, otherwise fallback to localhost
    const config = window.APP_CONFIG || {
      API_BASE_URL: "http://localhost:3000/api",
      API_URL: "http://localhost:3000",
    };

    this.baseURL = config.API_BASE_URL;
    this.socketURL = config.API_URL;
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
      script.src = `${this.socketURL}/socket.io/socket.io.js`;
      script.onload = () => this.connectSocket();
      script.onerror = () => {
        console.log("Socket.IO not available, using polling fallback");
        this.startPolling();
      };
      document.head.appendChild(script);
    } else {
      this.connectSocket();
    }
  }

  connectSocket() {
    try {
      console.log("🔌 Attempting to connect to:", this.socketURL);
      this.socket = io(this.socketURL);

      this.socket.on("connect", () => {
        console.log("✅ Connected to voting server");
        this.socket.emit("subscribe-voting");
      });

      this.socket.on("voteUpdate", (data) => {
        console.log("🗳️ Real-time vote update received:", data);
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
      console.log(
        "📡 Loading contestants from:",
        `${this.baseURL}/voting/contestants`
      );
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
      console.log(
        "📊 Loading voting status from:",
        `${this.baseURL}/voting/status`
      );
      const response = await fetch(`${this.baseURL}/voting/status`);
      const data = await response.json();

      if (data.success) {
        this.votingStatus = data.data;
        this.updateVotingStatus();
        // Update the "Your Votes" count in the hero section
        const userVotesElement = document.getElementById("your-votes");
        if (userVotesElement) {
          userVotesElement.textContent = this.votingStatus.dailyVoteCount || 0;
          console.log(
            `✅ Updated your votes: ${this.votingStatus.dailyVoteCount || 0}`
          );
        }
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

    // Render bar graph results
    this.updateBarGraphResults();
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
    console.log("🔄 Real-time update received:", data);
    const { contestantId, newVoteCount, votePercentage, totalVotes } = data;

    // Update the specific contestant's vote count
    const voteElement = document.querySelector(
      `[data-votes="${contestantId}"]`
    );
    if (voteElement) {
      voteElement.textContent = this.formatNumber(newVoteCount);
      console.log(
        `✅ Updated votes for contestant ${contestantId}: ${newVoteCount}`
      );
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
    console.log(`📊 Updating hero stats with total votes: ${totalVotes}`);
    this.updateVoteStats(totalVotes);

    // Update bar graph results
    this.updateBarGraphResults();
  }

  // Update vote statistics in the hero section
  updateVoteStats(totalVotes, totalContestants = null) {
    console.log("🎯 Updating vote stats:", { totalVotes, totalContestants });
    const totalVotesElement = document.getElementById("total-votes");
    if (totalVotesElement) {
      totalVotesElement.textContent = this.formatNumber(totalVotes);
      console.log(
        `✅ Updated total votes element: ${this.formatNumber(totalVotes)}`
      );
    } else {
      console.log("❌ Total votes element not found");
    }

    if (totalContestants !== null) {
      const contestantsElement = document.getElementById("total-contestants");
      if (contestantsElement) {
        contestantsElement.textContent = totalContestants;
        console.log(`✅ Updated total contestants: ${totalContestants}`);
      } else {
        console.log("❌ Total contestants element not found");
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

    // Scroll to results section after successful vote
    this.scrollToResults();
  }

  // Scroll to results section
  scrollToResults() {
    const resultsSection = document.getElementById("vote-results-section");
    if (resultsSection) {
      setTimeout(() => {
        resultsSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 1000); // Wait for toast to show first
    }
  }

  // Update bar graph results
  updateBarGraphResults() {
    if (!this.contestants || this.contestants.length === 0) {
      return;
    }

    const resultsList = document.getElementById("results-list");
    if (!resultsList) return;

    // Sort contestants by vote count (highest first)
    const sortedContestants = [...this.contestants].sort(
      (a, b) => b.votes - a.votes
    );

    // Clear loading state
    resultsList.innerHTML = "";

    // Create result items
    sortedContestants.forEach((contestant, index) => {
      const resultItem = this.createResultItem(contestant, index + 1);
      resultsList.appendChild(resultItem);
    });

    // Update summary stats
    this.updateResultsSummary(sortedContestants);
  }

  // Create individual result item
  createResultItem(contestant, rank) {
    const resultItem = document.createElement("div");
    resultItem.className = "result-item";
    resultItem.setAttribute("data-contestant", contestant._id);

    const rankClass =
      rank === 1 ? "first" : rank === 2 ? "second" : rank === 3 ? "third" : "";
    const rankIcon =
      rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank;

    // Check if user has already voted for this contestant
    const hasVoted = this.votingStatus.votedContestants.some(
      (voted) => voted.contestantId === contestant._id
    );
    const canVote = !hasVoted && this.votingStatus.remainingVotes > 0;

    resultItem.innerHTML = `
      <div class="result-rank ${rankClass}">${rankIcon}</div>
      <div class="result-info">
        <img src="${contestant.image}" alt="${
      contestant.name
    }" class="result-avatar" />
        <div class="result-details">
          <div class="result-name">${contestant.name}</div>
          <p class="result-description">${contestant.description}</p>
        </div>
      </div>
      <div class="result-bar-container">
        <div class="result-bar">
          <div class="result-bar-fill" style="width: ${
            contestant.votePercentage || 0
          }%"></div>
        </div>
        <div class="result-stats">
          <div class="result-percentage">${
            contestant.votePercentage || 0
          }%</div>
          <div class="result-votes">${this.formatNumber(
            contestant.votes
          )} votes</div>
          ${
            canVote
              ? `<button class="quick-vote-btn" data-contestant="${contestant._id}">
            <i class="fas fa-heart"></i> Vote
          </button>`
              : hasVoted
              ? `<span class="voted-indicator"><i class="fas fa-check"></i> Voted</span>`
              : ""
          }
        </div>
      </div>
    `;

    // Add click event for quick vote button
    if (canVote) {
      const quickVoteBtn = resultItem.querySelector(".quick-vote-btn");
      if (quickVoteBtn) {
        quickVoteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.handleVoteClick(contestant._id, contestant);
        });
      }
    }

    return resultItem;
  }

  // Update results summary
  updateResultsSummary(sortedContestants) {
    const totalVotes = sortedContestants.reduce(
      (sum, contestant) => sum + contestant.votes,
      0
    );
    const leader = sortedContestants[0];

    // Update total votes
    const totalVotesElement = document.getElementById("results-total-votes");
    if (totalVotesElement) {
      totalVotesElement.textContent = this.formatNumber(totalVotes);
    }

    // Update leader
    const leaderElement = document.getElementById("results-leader");
    if (leaderElement && leader) {
      leaderElement.textContent = leader.name;
    }

    // Update last updated time
    const lastUpdatedElement = document.getElementById("results-last-updated");
    if (lastUpdatedElement) {
      const now = new Date();
      lastUpdatedElement.textContent = now.toLocaleTimeString();
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
