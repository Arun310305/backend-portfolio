import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import authRoutes from "./routes/auth.js";




dotenv.config();

/* ------------------------------------------------------
   CLOUDINARY CONFIG
------------------------------------------------------ */
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

/* ------------------------------------------------------
   MULTER → CLOUDINARY STORAGE
------------------------------------------------------ */
const blogStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "portfolio_uploads/blogs",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const projectStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "portfolio_uploads/projects",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const uploadBlogImage = multer({ storage: blogStorage });
const uploadProjectImage = multer({ storage: projectStorage });

/* ------------------------------------------------------
   EXPRESS APP
------------------------------------------------------ */
const app = express();
app.use(cors());
app.use(express.json());




/* ------------------------------------------------------
   MONGODB CONNECTION (SAFE)
------------------------------------------------------ */
let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    throw error;
  }
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch {
    res.status(500).json({ message: "Database connection failed" });
  }
});

/* ------------------------------------------------------
   Routes connection
------------------------------------------------------ */
app.use("/api/auth", authRoutes);

/* ------------------------------------------------------
   MODELS
------------------------------------------------------ */
const blogSchema = new mongoose.Schema({
  title: String,
  content: String,
  image: String,
  date: String,
});

const Blog = mongoose.models.Blog || mongoose.model("Blog", blogSchema);

const projectSchema = new mongoose.Schema({
  name: String,
  description: String,
  image: String,
  link: String,
});

const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);

/* ------------------------------------------------------
   HEALTH CHECK
------------------------------------------------------ */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Backend is running",
  });
});

/* ------------------------------------------------------
   COMBINED PORTFOLIO
------------------------------------------------------ */
app.get("/api/portfolio", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ _id: -1 });
    const projects = await Project.find().sort({ _id: -1 });

    res.status(200).json({
      blogs,
      projects,
      totalBlogs: blogs.length,
      totalProjects: projects.length,
    });
  } catch (error) {
    console.error("Portfolio error:", error);
    res.status(500).json({ message: "Failed to fetch portfolio" });
  }
});

/* ------------------------------------------------------
   BLOG ROUTES
------------------------------------------------------ */
app.get("/api/blogs", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ _id: -1 });
    res.status(200).json(blogs);
  } catch (error) {
    console.error("Blogs fetch error:", error);
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
});

app.post("/api/blogs", uploadBlogImage.single("image"), async (req, res) => {
  try {
    const { title, content } = req.body;

    const newBlog = new Blog({
      title,
      content,
      image: req.file?.path || null,
      date: new Date().toDateString(),
    });

    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (error) {
    console.error("Create blog error:", error);
    res.status(500).json({ message: "Failed to create blog" });
  }
});
  app.delete("/api/blogs/:id", async (req, res) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);

    if (!deletedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Delete blog error:", error);
    res.status(500).json({ message: "Failed to delete blog" });
  }
});


/* ------------------------------------------------------
   PROJECT ROUTES
------------------------------------------------------ */
app.get("/api/projects", async (req, res) => {
  try {
    const projects = await Project.find().sort({ _id: -1 });
    res.status(200).json(projects);
  } catch (error) {
    console.error("Projects fetch error:", error);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

app.post("/api/projects", uploadProjectImage.single("image"), async (req, res) => {
  try {
    const { name, description, link } = req.body;

    const newProject = new Project({
      name,
      description,
      link,
      image: req.file?.path || null,
    });

    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ message: "Failed to create project" });
  }
});
 app.delete("/api/projects/:id", async (req, res) => {
  try {
    const deletedProject = await Project.findByIdAndDelete(req.params.id);

    if (!deletedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ message: "Failed to delete project" });
  }
});


/* ------------------------------------------------------
   CONTACT FORM
------------------------------------------------------ */
  app.get("/api/test", (req, res) => {
  res.json({ ok: true });
});

/* ------------------------------------------------------
   EXPORT FOR VERCEL
------------------------------------------------------ */
export default app;
