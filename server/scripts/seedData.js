const mongoose = require("mongoose");
const Contestant = require("../models/Contestant");
const BlogPost = require("../models/BlogPost");
require("dotenv").config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/memes-muthyam"
    );
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

// Sample contestants data
const sampleContestants = [
  {
    name: "Contestant 1",
    description:
      "Popular contestant with strong fan base and great personality",
    image: "images/contestant-1.jpg",
    votes: 2456,
    season: "current",
    socialLinks: {
      instagram: "https://instagram.com/contestant1",
      twitter: "https://twitter.com/contestant1",
    },
  },
  {
    name: "Contestant 2",
    description:
      "Drama queen with entertaining personality and excellent game sense",
    image: "images/contestant-2.jpg",
    votes: 1892,
    season: "current",
    socialLinks: {
      instagram: "https://instagram.com/contestant2",
      twitter: "https://twitter.com/contestant2",
    },
  },
  {
    name: "Contestant 3",
    description:
      "Strategic player with good game sense and leadership qualities",
    image: "images/contestant-3.jpg",
    votes: 2134,
    season: "current",
    socialLinks: {
      instagram: "https://instagram.com/contestant3",
      twitter: "https://twitter.com/contestant3",
    },
  },
  {
    name: "Contestant 4",
    description:
      "Underdog with surprising popularity and great entertainment value",
    image: "images/contestant-4.jpg",
    votes: 1567,
    season: "current",
    socialLinks: {
      instagram: "https://instagram.com/contestant4",
      twitter: "https://twitter.com/contestant4",
    },
  },
  {
    name: "Contestant 5",
    description: "Comedy king with great entertainment value and humor",
    image: "images/contestant-5.jpg",
    votes: 1234,
    season: "current",
    socialLinks: {
      instagram: "https://instagram.com/contestant5",
      twitter: "https://twitter.com/contestant5",
    },
  },
  {
    name: "Contestant 6",
    description:
      "Strong personality with leadership qualities and strategic mind",
    image: "images/contestant-6.jpg",
    votes: 1789,
    season: "current",
    socialLinks: {
      instagram: "https://instagram.com/contestant6",
      twitter: "https://twitter.com/contestant6",
    },
  },
  {
    name: "Contestant 7",
    description: "Emotional and relatable contestant with great fan following",
    image: "images/contestant-7.jpg",
    votes: 1456,
    season: "current",
    socialLinks: {
      instagram: "https://instagram.com/contestant7",
      twitter: "https://twitter.com/contestant7",
    },
  },
  {
    name: "Contestant 8",
    description:
      "Wildcard entry with unpredictable nature and surprising moves",
    image: "images/contestant-8.jpg",
    votes: 1123,
    season: "current",
    socialLinks: {
      instagram: "https://instagram.com/contestant8",
      twitter: "https://twitter.com/contestant8",
    },
  },
];

// Sample blog posts data
const sampleBlogPosts = [
  {
    title: "Top 10 Funniest Bigg Boss Memes This Week",
    content: `
      <p>This week had some of the most hilarious moments in Bigg Boss Telugu history, and our amazing community has created some incredible memes to capture them!</p>
      
      <h3>1. The Kitchen Drama Meme</h3>
      <p>When Contestant 2 tried to cook and almost burned down the kitchen, the internet went wild! This meme perfectly captures that moment.</p>
      
      <h3>2. The Voting Confusion</h3>
      <p>Everyone was confused about the voting system this week, leading to this relatable meme that had us all laughing.</p>
      
      <p>Check out all the memes and vote for your favorites!</p>
    `,
    excerpt:
      "Check out the most hilarious memes that have been circulating about our favorite contestants this week...",
    featuredImage: "images/blog-post-1.jpg",
    category: "memes",
    tags: ["memes", "contestants", "funny"],
    author: "Admin",
    metaDescription:
      "Check out the funniest Bigg Boss Telugu memes of the week",
    metaKeywords: ["bigg boss", "memes", "telugu", "funny"],
    isPublished: true,
    isFeatured: true,
    viewCount: 1240,
    shareCount: 89,
  },
  {
    title: "Weekly Contestant Performance Analysis",
    content: `
      <p>Another week of intense drama and competition in the Bigg Boss house. Let's analyze how each contestant performed this week.</p>
      
      <h3>Top Performers</h3>
      <p>Contestant 1 has been showing excellent leadership skills and has maintained their position as a fan favorite.</p>
      
      <h3>Surprise Moments</h3>
      <p>Contestant 4's unexpected strategy this week surprised everyone, including other housemates!</p>
      
      <p>What do you think about this week's performances? Let us know in the comments!</p>
    `,
    excerpt:
      "Who's winning hearts and who's causing drama? Our detailed analysis of this week's performances...",
    featuredImage: "images/blog-post-2.jpg",
    category: "analysis",
    tags: ["analysis", "performance", "week"],
    author: "Admin",
    metaDescription:
      "Weekly analysis of Bigg Boss Telugu contestants performance",
    metaKeywords: ["bigg boss", "analysis", "performance", "contestants"],
    isPublished: true,
    isFeatured: false,
    viewCount: 856,
    shareCount: 34,
  },
  {
    title: "Behind the Scenes: What You Don't See on TV",
    content: `
      <p>Ever wondered what happens when the cameras are off in the Bigg Boss house? We have some exclusive insights for you!</p>
      
      <h3>The Real Story</h3>
      <p>While the show focuses on drama and competition, there are many heartwarming moments that happen off-camera.</p>
      
      <h3>Production Secrets</h3>
      <p>Learn about how the team manages to capture every important moment and keep the show running smoothly.</p>
      
      <p>This week, we got some insider information about what really goes on behind the scenes!</p>
    `,
    excerpt:
      "Exclusive insights into the making of Bigg Boss Telugu and what happens when cameras are off...",
    featuredImage: "images/blog-post-3.jpg",
    category: "behind-scenes",
    tags: ["behind-scenes", "exclusive", "production"],
    author: "Admin",
    metaDescription: "Behind the scenes secrets of Bigg Boss Telugu production",
    metaKeywords: ["bigg boss", "behind scenes", "production", "secrets"],
    isPublished: true,
    isFeatured: true,
    viewCount: 2100,
    shareCount: 156,
  },
];

// Seed the database
const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Clear existing data
    await Contestant.deleteMany({});
    await BlogPost.deleteMany({});
    console.log("✅ Cleared existing data");

    // Insert sample contestants
    const contestants = await Contestant.insertMany(sampleContestants);
    console.log(`✅ Inserted ${contestants.length} contestants`);

    // Insert sample blog posts
    const blogPosts = await BlogPost.insertMany(sampleBlogPosts);
    console.log(`✅ Inserted ${blogPosts.length} blog posts`);

    console.log("🎉 Database seeding completed successfully!");

    // Print summary
    console.log("\n📊 Database Summary:");
    console.log(`- Contestants: ${contestants.length}`);
    console.log(`- Blog Posts: ${blogPosts.length}`);
    console.log(
      `- Total Votes: ${sampleContestants.reduce((sum, c) => sum + c.votes, 0)}`
    );
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
};

// Run the seeding
(async () => {
  await connectDB();
  await seedDatabase();
})();
