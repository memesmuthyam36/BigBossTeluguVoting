// Admin Panel JavaScript
class AdminPanel {
  constructor() {
    this.baseURL = API_BASE_URL || "http://localhost:3000/api";
    this.currentTab = "contestants";
    this.contestants = [];
    this.blogs = [];

    this.initializeEventListeners();
    this.loadContestants();
  }

  initializeEventListeners() {
    // Tab switching
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.switchTab(btn.dataset.tab));
    });

    // Contestant modal
    document
      .getElementById("add-contestant-btn")
      .addEventListener("click", () => this.showContestantModal());
    document
      .getElementById("contestant-modal-close")
      .addEventListener("click", () => this.closeContestantModal());
    document
      .getElementById("cancel-contestant")
      .addEventListener("click", () => this.closeContestantModal());
    document
      .getElementById("contestant-form")
      .addEventListener("submit", (e) => this.saveContestant(e));

    // Blog modal
    document
      .getElementById("add-blog-btn")
      .addEventListener("click", () => this.showBlogModal());
    document
      .getElementById("blog-modal-close")
      .addEventListener("click", () => this.closeBlogModal());
    document
      .getElementById("cancel-blog")
      .addEventListener("click", () => this.closeBlogModal());
    document
      .getElementById("blog-form")
      .addEventListener("submit", (e) => this.saveBlog(e));

    // Auto-generate slug from title
    document.getElementById("blog-title").addEventListener("input", (e) => {
      const slug = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      document.getElementById("blog-slug").value = slug;
    });
  }

  switchTab(tab) {
    this.currentTab = tab;

    // Update tab buttons
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });

    // Update tab content
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.toggle("active", content.id === `${tab}-tab`);
    });

    // Load data for the tab
    if (tab === "contestants" && this.contestants.length === 0) {
      this.loadContestants();
    } else if (tab === "blogs" && this.blogs.length === 0) {
      this.loadBlogs();
    }
  }

  // Contestants Management
  async loadContestants() {
    try {
      const response = await fetch(`${this.baseURL}/voting/contestants`);
      const data = await response.json();

      if (data.success) {
        this.contestants = data.data;
        this.renderContestants();
      }
    } catch (error) {
      console.error("Error loading contestants:", error);
      this.showToast("Failed to load contestants", "error");
    }
  }

  renderContestants() {
    const container = document.getElementById("contestants-list");

    if (this.contestants.length === 0) {
      container.innerHTML = `
        <div class="loading">
          <p>No contestants found. Add your first contestant!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.contestants
      .map(
        (contestant) => `
      <div class="contestant-item">
        <div class="contestant-item-header">
          <img src="${contestant.image}" alt="${
          contestant.name
        }" class="contestant-item-img" />
          <div class="contestant-item-info">
            <h3>${contestant.name}</h3>
            <div class="contestant-item-votes">
              <i class="fas fa-heart"></i>
              <span>${this.formatNumber(contestant.votes)} votes</span>
            </div>
          </div>
        </div>
        <p class="contestant-item-description">${contestant.description}</p>
        <div class="contestant-item-actions">
          <button class="btn btn-sm btn-secondary" onclick="adminPanel.editContestant('${
            contestant._id
          }')">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteContestant('${
            contestant._id
          }', '${contestant.name}')">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `
      )
      .join("");
  }

  showContestantModal(contestant = null) {
    const modal = document.getElementById("contestant-modal");
    const title = document.getElementById("contestant-modal-title");
    const form = document.getElementById("contestant-form");

    if (contestant) {
      title.textContent = "Edit Contestant";
      document.getElementById("contestant-id").value = contestant._id;
      document.getElementById("contestant-name").value = contestant.name;
      document.getElementById("contestant-description").value =
        contestant.description;
      document.getElementById("contestant-image").value = contestant.image;
    } else {
      title.textContent = "Add Contestant";
      form.reset();
    }

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  closeContestantModal() {
    const modal = document.getElementById("contestant-modal");
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  async saveContestant(e) {
    e.preventDefault();

    const id = document.getElementById("contestant-id").value;
    const contestantData = {
      name: document.getElementById("contestant-name").value,
      description: document.getElementById("contestant-description").value,
      image: document.getElementById("contestant-image").value,
    };

    try {
      const url = id
        ? `${this.baseURL}/admin/contestants/${id}`
        : `${this.baseURL}/admin/contestants`;
      const method = id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contestantData),
      });

      const data = await response.json();

      if (data.success) {
        this.showToast(
          id
            ? "Contestant updated successfully"
            : "Contestant added successfully",
          "success"
        );
        this.closeContestantModal();
        this.loadContestants();
      } else {
        this.showToast(data.message || "Failed to save contestant", "error");
      }
    } catch (error) {
      console.error("Error saving contestant:", error);
      this.showToast("Failed to save contestant", "error");
    }
  }

  async editContestant(id) {
    const contestant = this.contestants.find((c) => c._id === id);
    if (contestant) {
      this.showContestantModal(contestant);
    }
  }

  async deleteContestant(id, name) {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const response = await fetch(`${this.baseURL}/admin/contestants/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        this.showToast("Contestant deleted successfully", "success");
        this.loadContestants();
      } else {
        this.showToast(data.message || "Failed to delete contestant", "error");
      }
    } catch (error) {
      console.error("Error deleting contestant:", error);
      this.showToast("Failed to delete contestant", "error");
    }
  }

  // Blog Management
  async loadBlogs() {
    try {
      const response = await fetch(`${this.baseURL}/blog/posts?limit=100`);
      const data = await response.json();

      if (data.success) {
        this.blogs = data.data.posts || [];
        this.renderBlogs();
      }
    } catch (error) {
      console.error("Error loading blogs:", error);
      this.showToast("Failed to load blog posts", "error");
    }
  }

  renderBlogs() {
    const container = document.getElementById("blogs-list");

    if (this.blogs.length === 0) {
      container.innerHTML = `
        <div class="loading">
          <p>No blog posts found. Add your first post!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.blogs
      .map(
        (blog) => `
      <div class="blog-item">
        <img src="${blog.featuredImage}" alt="${
          blog.title
        }" class="blog-item-image" />
        <div class="blog-item-content">
          <div class="blog-item-header">
            <h3 class="blog-item-title">${blog.title}</h3>
            <span class="blog-item-category">${blog.category}</span>
          </div>
          <p class="blog-item-excerpt">${blog.excerpt}</p>
          <div class="blog-item-meta">
            <div class="blog-item-meta-item">
              <i class="fas fa-eye"></i>
              <span>${this.formatNumber(blog.viewCount)} views</span>
            </div>
            <div class="blog-item-meta-item">
              <i class="fas fa-share-alt"></i>
              <span>${this.formatNumber(blog.shareCount)} shares</span>
            </div>
            <div class="blog-item-meta-item">
              <i class="fas fa-calendar"></i>
              <span>${new Date(blog.publishDate).toLocaleDateString()}</span>
            </div>
          </div>
          <div class="blog-item-actions">
            <button class="btn btn-sm btn-secondary" onclick="adminPanel.editBlog('${
              blog._id
            }')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteBlog('${
              blog._id
            }', '${blog.title.replace(/'/g, "\\'")}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `
      )
      .join("");
  }

  showBlogModal(blog = null) {
    const modal = document.getElementById("blog-modal");
    const title = document.getElementById("blog-modal-title");
    const form = document.getElementById("blog-form");

    if (blog) {
      title.textContent = "Edit Blog Post";
      document.getElementById("blog-id").value = blog._id;
      document.getElementById("blog-title").value = blog.title;
      document.getElementById("blog-slug").value = blog.slug;
      document.getElementById("blog-excerpt").value = blog.excerpt;
      document.getElementById("blog-content").value = blog.content;
      document.getElementById("blog-category").value = blog.category;
      document.getElementById("blog-featured-image").value = blog.featuredImage;
      document.getElementById("blog-tags").value = blog.tags.join(", ");
    } else {
      title.textContent = "Add Blog Post";
      form.reset();
    }

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  closeBlogModal() {
    const modal = document.getElementById("blog-modal");
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  async saveBlog(e) {
    e.preventDefault();

    const id = document.getElementById("blog-id").value;
    const blogData = {
      title: document.getElementById("blog-title").value,
      slug: document.getElementById("blog-slug").value,
      excerpt: document.getElementById("blog-excerpt").value,
      content: document.getElementById("blog-content").value,
      category: document.getElementById("blog-category").value,
      featuredImage: document.getElementById("blog-featured-image").value,
      tags: document
        .getElementById("blog-tags")
        .value.split(",")
        .map((t) => t.trim())
        .filter((t) => t),
      author: "Admin",
    };

    try {
      const url = id
        ? `${this.baseURL}/admin/blog/${id}`
        : `${this.baseURL}/admin/blog`;
      const method = id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blogData),
      });

      const data = await response.json();

      if (data.success) {
        this.showToast(
          id
            ? "Blog post updated successfully"
            : "Blog post added successfully",
          "success"
        );
        this.closeBlogModal();
        this.loadBlogs();
      } else {
        this.showToast(data.message || "Failed to save blog post", "error");
      }
    } catch (error) {
      console.error("Error saving blog:", error);
      this.showToast("Failed to save blog post", "error");
    }
  }

  async editBlog(id) {
    const blog = this.blogs.find((b) => b._id === id);
    if (blog) {
      this.showBlogModal(blog);
    }
  }

  async deleteBlog(id, title) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const response = await fetch(`${this.baseURL}/admin/blog/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        this.showToast("Blog post deleted successfully", "success");
        this.loadBlogs();
      } else {
        this.showToast(data.message || "Failed to delete blog post", "error");
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
      this.showToast("Failed to delete blog post", "error");
    }
  }

  // Utility Methods
  showToast(message, type = "info") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}

// Initialize admin panel
let adminPanel;
document.addEventListener("DOMContentLoaded", () => {
  adminPanel = new AdminPanel();
});
