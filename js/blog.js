// Blog Page JavaScript for Memes Muthyam
class BlogPage {
  constructor() {
    this.baseURL = "http://localhost:3000/api";
    this.currentPage = 1;
    this.itemsPerPage = 9;
    this.currentCategory = "all";
    this.posts = [];
    this.socket = null;

    this.initializeSocket();
    this.initializeEventListeners();
    this.loadBlogPosts();
  }

  // Initialize Socket.IO connection for real-time updates
  initializeSocket() {
    if (typeof io !== "undefined") {
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

        this.socket.on("disconnect", () => {
          console.log("❌ Disconnected from blog server");
        });
      } catch (error) {
        console.error("Socket connection error:", error);
      }
    }
  }

  // Initialize event listeners
  initializeEventListeners() {
    // Category filter buttons
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const category = e.target.dataset.category;
        this.filterPostsByCategory(category);
      });
    });

    // Pagination buttons
    const prevBtn = document.getElementById("prev-page");
    const nextBtn = document.getElementById("next-page");

    if (prevBtn) {
      prevBtn.addEventListener("click", () => this.goToPreviousPage());
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => this.goToNextPage());
    }

    // Share buttons
    document.addEventListener("click", (e) => {
      if (e.target.matches(".share-btn, .share-btn *")) {
        e.preventDefault();
        const btn = e.target.closest(".share-btn");
        const url = btn.dataset.url || window.location.href;
        const title = btn.dataset.title || document.title;
        this.handleShare(url, title, btn);
      }
    });
  }

  // Load blog posts from API
  async loadBlogPosts(page = 1, category = "all") {
    try {
      this.showLoading();

      const params = new URLSearchParams({
        page: page.toString(),
        limit: this.itemsPerPage.toString(),
        category: category === "all" ? "" : category,
      });

      const response = await fetch(`${this.baseURL}/blog/posts?${params}`);

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        this.posts = data.data.posts || [];
        this.currentPage = page;
        this.currentCategory = category;

        this.renderPosts();
        this.updatePagination(data.data.pagination || {});
        this.updateCategoryFilter();
      } else {
        this.showNoPosts();
      }
    } catch (error) {
      console.error("Error loading blog posts:", error);
      // Show error message instead of just "No posts"
      this.showError(error.message);
    } finally {
      this.hideLoading();
    }
  }

  // Render blog posts
  renderPosts() {
    const grid = document.getElementById("blog-posts-grid");
    const noPostsMessage = document.getElementById("no-posts-message");

    if (!grid) return;

    if (this.posts.length === 0) {
      this.showNoPosts();
      return;
    }

    grid.style.display = "grid";
    if (noPostsMessage) noPostsMessage.style.display = "none";

    grid.innerHTML = this.posts
      .map((post) => this.createPostCard(post))
      .join("");
  }

  // Create individual post card HTML
  createPostCard(post) {
    const publishDate =
      post.publishedAt || post.publishDate
        ? new Date(post.publishedAt || post.publishDate).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "short",
              day: "numeric",
            }
          )
        : "Invalid Date";

    return `
      <article class="blog-card" data-post-id="${post._id}">
        <a href="blog/${post.slug}.html" class="blog-card-link">
          <div class="blog-img-container">
            <img 
              src="${post.featuredImage}" 
              alt="${post.title}"
              class="blog-img"
              loading="lazy"
            />
            <div class="blog-category">${this.capitalizeFirst(
              post.category
            )}</div>
          </div>
          <div class="blog-content">
            <div class="blog-meta">
              <div class="blog-date">
                <i class="fas fa-calendar-alt"></i>
                <span>${publishDate}</span>
              </div>
              <div class="blogs-views">
                <i class="fas fa-eye"></i>
                <span class="view-count">${this.formatNumber(
                  post.viewCount || 0
                )} views</span>
              </div>
            </div>
            <h3 class="blog-title">${post.title}</h3>
            <p class="blog-excerpt">${post.excerpt}</p>
          </div>
        </a>
        <div class="blog-actions">
          <a href="blog/${post.slug}.html" class="read-more-btn">Read More</a>
          <button 
            class="share-btn"
            data-url="blog/${post.slug}.html"
            data-title="${post.title}"
            aria-label="Share this post"
          >
            <i class="fas fa-share-alt"></i>
          </button>
        </div>
      </article>
    `;
  }

  // Filter posts by category
  filterPostsByCategory(category) {
    this.currentCategory = category;
    this.currentPage = 1;
    this.loadBlogPosts(1, category);
  }

  // Update category filter UI
  updateCategoryFilter() {
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.category === this.currentCategory) {
        btn.classList.add("active");
      }
    });
  }

  // Pagination methods
  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.loadBlogPosts(this.currentPage - 1, this.currentCategory);
    }
  }

  goToNextPage() {
    this.loadBlogPosts(this.currentPage + 1, this.currentCategory);
  }

  // Update pagination UI
  updatePagination(pagination) {
    const prevBtn = document.getElementById("prev-page");
    const nextBtn = document.getElementById("next-page");
    const currentPageEl = document.getElementById("current-page");
    const totalPagesEl = document.getElementById("total-pages");
    const paginationContainer = document.getElementById("blog-pagination");

    if (!paginationContainer) return;

    // Show/hide pagination based on need
    const hasMultiplePages = pagination.totalPages > 1;
    paginationContainer.style.display = hasMultiplePages ? "flex" : "none";

    if (!hasMultiplePages) return;

    // Update pagination info
    if (currentPageEl)
      currentPageEl.textContent = pagination.currentPage || this.currentPage;
    if (totalPagesEl) totalPagesEl.textContent = pagination.totalPages || 1;

    // Update button states
    if (prevBtn) {
      prevBtn.disabled = this.currentPage <= 1;
    }
    if (nextBtn) {
      nextBtn.disabled = this.currentPage >= (pagination.totalPages || 1);
    }
  }

  // Handle share functionality
  handleShare(url, title, button) {
    if (window.socialShare) {
      window.socialShare.showShareModal(url, title);

      // Track share via API
      this.trackShare(url, "modal");
    } else if (navigator.share) {
      navigator.share({ title, url }).catch(console.error);
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(url).then(() => {
        if (window.biggBossBlog) {
          window.biggBossBlog.showMessage(
            "Link copied to clipboard!",
            "success"
          );
        }
      });
    }
  }

  // Track share event
  async trackShare(url, platform) {
    try {
      const slug = url.match(/blog\/([^\/]+)\.html$/)?.[1];
      if (slug) {
        await fetch(`${this.baseURL}/blog/post/${slug}/share`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform }),
        });
      }
    } catch (error) {
      console.error("Error tracking share:", error);
    }
  }

  // Update view count in real-time
  updatePostViewCount(data) {
    const { postId, newViewCount } = data;
    const postCard = document.querySelector(`[data-post-id="${postId}"]`);
    if (postCard) {
      const viewCountEl = postCard.querySelector(".view-count");
      if (viewCountEl) {
        viewCountEl.textContent = this.formatNumber(newViewCount);
      }
    }
  }

  // Update share count in real-time
  updatePostShareCount(data) {
    const { postId, newShareCount } = data;
    const postCard = document.querySelector(`[data-post-id="${postId}"]`);
    if (postCard) {
      // You could add share count display here if needed
      console.log(`Updated share count for post ${postId}: ${newShareCount}`);
    }
  }

  // Show loading state
  showLoading() {
    const loading = document.getElementById("blog-loading");
    const grid = document.getElementById("blog-posts-grid");
    const noPosts = document.getElementById("no-posts-message");

    if (loading) loading.style.display = "block";
    if (grid) grid.style.display = "none";
    if (noPosts) noPosts.style.display = "none";
  }

  // Hide loading state
  hideLoading() {
    const loading = document.getElementById("blog-loading");
    if (loading) loading.style.display = "none";
  }

  // Show no posts message
  showNoPosts() {
    const loading = document.getElementById("blog-loading");
    const grid = document.getElementById("blog-posts-grid");
    const noPosts = document.getElementById("no-posts-message");
    const pagination = document.getElementById("blog-pagination");

    if (loading) loading.style.display = "none";
    if (grid) grid.style.display = "none";
    if (noPosts) noPosts.style.display = "block";
    if (pagination) pagination.style.display = "none";
  }

  // Show error message
  showError(errorMessage) {
    const loading = document.getElementById("blog-loading");
    const grid = document.getElementById("blog-posts-grid");
    const noPosts = document.getElementById("no-posts-message");
    const pagination = document.getElementById("blog-pagination");

    if (loading) loading.style.display = "none";
    if (grid) grid.style.display = "none";
    if (pagination) pagination.style.display = "none";

    if (noPosts) {
      noPosts.style.display = "block";
      noPosts.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Unable to Load Posts</h3>
        <p>${
          errorMessage || "Please check if the server is running and try again."
        }</p>
        <p><small>Make sure your backend server is running on port 3000</small></p>
      `;
    }
  }

  // Utility functions
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}

// Individual Blog Post Page JavaScript
class BlogPostPage {
  constructor() {
    this.baseURL = "http://localhost:3000/api";
    this.postSlug = this.getPostSlug();
    this.socket = null;

    if (this.postSlug) {
      this.initializeSocket();
      this.loadBlogPost();
      this.initializeEventListeners();
    }
  }

  // Get post slug from URL
  getPostSlug() {
    const path = window.location.pathname;
    const match = path.match(/\/blog\/([^\/]+)\.html$/);
    return match ? match[1] : null;
  }

  // Initialize Socket.IO connection
  initializeSocket() {
    if (typeof io !== "undefined") {
      try {
        this.socket = io("http://localhost:3000");

        this.socket.on("connect", () => {
          console.log("✅ Connected to blog server");
        });

        this.socket.on("newComment", (data) => {
          if (data.postSlug === this.postSlug) {
            console.log("💬 New comment for this post:", data);
            // You could add real-time comment updates here
          }
        });
      } catch (error) {
        console.error("Socket connection error:", error);
      }
    }
  }

  // Load individual blog post
  async loadBlogPost() {
    try {
      const response = await fetch(
        `${this.baseURL}/blog/post/${this.postSlug}`
      );

      if (!response.ok) {
        console.log("API not available, using static content");
        return; // Use static content from HTML
      }

      const data = await response.json();

      if (data.success && data.data && data.data.post) {
        this.renderBlogPost(data.data.post);
        this.trackPageView();
      } else {
        console.log("No API data available, using static content");
        // Don't show error, just use static content
      }
    } catch (error) {
      console.log("API error, using static content:", error.message);
      // Don't show error, just use static content
    }
  }

  // Render the blog post
  renderBlogPost(post) {
    // Update page title and meta
    if (post.title) {
      document.title = `${post.title} - Memes Muthyam`;
    }

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && post.excerpt) {
      metaDesc.setAttribute("content", post.excerpt);
    }

    // Update Open Graph meta tags
    this.updateOGTags(post);

    // Render post content
    this.renderPostContent(post);
    if (post.tags) {
      this.renderRelatedPosts(post.tags);
    }
  }

  // Update Open Graph meta tags
  updateOGTags(post) {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector(
      'meta[property="og:description"]'
    );
    const ogImage = document.querySelector('meta[property="og:image"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');

    if (ogTitle && post.title) ogTitle.setAttribute("content", post.title);
    if (ogDescription && post.excerpt)
      ogDescription.setAttribute("content", post.excerpt);
    if (ogImage && post.featuredImage)
      ogImage.setAttribute("content", post.featuredImage);
    if (ogUrl) ogUrl.setAttribute("content", window.location.href);
  }

  // Render post content
  renderPostContent(post) {
    const publishDate =
      post.publishedAt || post.publishDate
        ? new Date(post.publishedAt || post.publishDate).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          )
        : "Invalid Date";

    // You would need to update the HTML structure of the blog post page
    // This is a basic example of how you might update elements
    const titleEl = document.querySelector(".blog-post-title, h1");
    const contentEl = document.querySelector(".blog-post-body, .post-content");
    const metaEl = document.querySelector(".blog-post-info, .post-meta");

    if (titleEl && post.title) titleEl.textContent = post.title;
    if (contentEl && post.content) contentEl.innerHTML = post.content;
    if (metaEl) {
      metaEl.innerHTML = `
        <div class="post-date">
          <i class="fas fa-calendar-alt"></i>
          <span>${publishDate}</span>
        </div>
        <div class="post-views">
          <i class="fas fa-eye"></i>
          <span class="view-count">${this.formatNumber(
            post.viewCount || 0
          )} views</span>
        </div>
      `;
    }
  }

  // Render related posts
  renderRelatedPosts(tags) {
    // This would load and display related posts based on tags
    // For now, just a placeholder
    console.log("Related posts for tags:", tags);
  }

  // Track page view
  async trackPageView() {
    try {
      // The view count is automatically incremented when fetching the blog post
      // This could be used for additional analytics tracking
      console.log("Page view tracked for:", this.postSlug);
    } catch (error) {
      console.error("Error tracking page view:", error);
    }
  }

  // Initialize event listeners
  initializeEventListeners() {
    // Share buttons
    document.addEventListener("click", (e) => {
      if (e.target.matches(".share-button, .share-button *")) {
        e.preventDefault();
        const platform = e.target.closest(".share-button").classList[1];
        const url = window.location.href;
        const title = document.title;
        this.shareToPlatform(platform, url, title);
      }
    });
  }

  // Share to specific platform
  shareToPlatform(platform, url, title) {
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(title)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(title)}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
      this.trackShare(platform);
    }
  }

  // Track share event
  async trackShare(platform) {
    try {
      await fetch(`${this.baseURL}/blog/post/${this.postSlug}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
    } catch (error) {
      console.error("Error tracking share:", error);
    }
  }

  // Show post not found
  showPostNotFound() {
    document.body.innerHTML = `
      <div style="text-align: center; padding: 4rem 2rem;">
        <h1>Post Not Found</h1>
        <p>The blog post you're looking for doesn't exist or has been removed.</p>
        <a href="/blog.html" style="color: #6976df;">← Back to Blog</a>
      </div>
    `;
  }

  // Utility function
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}

// Initialize based on current page
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (path === "/blog.html" || path.endsWith("/blog.html")) {
    window.blogPage = new BlogPage();
  } else if (path.includes("/blog/")) {
    window.blogPostPage = new BlogPostPage();
  }
});
