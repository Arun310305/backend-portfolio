import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

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
   MULTER → CLOUDINARY DIFFERENT FOLDERS
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
   EXPRESS SETUP
------------------------------------------------------ */
const app = express();
app.use(cors());
app.use(express.json());

/* ------------------------------------------------------
   MONGO CONNECTION
------------------------------------------------------ */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

/* ------------------------------------------------------
   BLOG MODEL
------------------------------------------------------ */
const blogSchema = new mongoose.Schema({
  title: String,
  content: String,
  image: String,
  date: String,
});
const Blog = mongoose.model("Blog", blogSchema);

/* ------------------------------------------------------
   PROJECT MODEL
------------------------------------------------------ */
const projectSchema = new mongoose.Schema({
  name: String,
  description: String,
  image: String,
  link: String,
});
const Project = mongoose.model("Project", projectSchema);

/* ------------------------------------------------------
   DEFAULT ROUTE
------------------------------------------------------ */
app.get("/", (req, res) => {
  res.send("Backend is running!");
});


/* ------------------------------------------------------
   COMBINED API → Blogs + Projects
------------------------------------------------------ */
app.get("/api/portfolio", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ _id: -1 });
    const projects = await Project.find().sort({ _id: -1 });

    res.json({
      blogs,
      projects,
      totalBlogs: blogs.length,
      totalProjects: projects.length,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching combined data",
      error: err.message,
    });
  }
});

/* ------------------------------------------------------
   BLOG ROUTES
------------------------------------------------------ */
app.get("/api/blogs", async (req, res) => {
  const blogs = await Blog.find().sort({ _id: -1 });
  res.json(blogs);
});

app.post("/api/blogs", uploadBlogImage.single("image"), async (req, res) => {
  try {
    const { title, content } = req.body;
    const image = req.file?.path || null;

    const newBlog = new Blog({
      title,
      content,
      image,
      date: new Date().toDateString(),
    });

    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (err) {
    res.status(500).json({ message: "Error creating blog", error: err.message });
  }
});

app.put("/api/blogs/:id", uploadBlogImage.single("image"), async (req, res) => {
  try {
    const { title, content } = req.body;
    const updateData = { title, content };

    if (req.file?.path) updateData.image = req.file.path;

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!updatedBlog) return res.status(404).json({ message: "Blog not found" });

    res.json(updatedBlog);
  } catch (err) {
    res.status(500).json({ message: "Error updating blog", error: err.message });
  }
});

app.delete("/api/blogs/:id", async (req, res) => {
  try {
    const deleted = await Blog.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Blog not found" });

    res.json({ message: "Blog deleted successfully", deleted });
  } catch (err) {
    res.status(500).json({ message: "Error deleting blog", error: err.message });
  }
});

/* ------------------------------------------------------
   PROJECT ROUTES
------------------------------------------------------ */
app.get("/api/projects", async (req, res) => {
  const projects = await Project.find().sort({ _id: -1 });
  res.json(projects);
});

app.post("/api/projects", uploadProjectImage.single("image"), async (req, res) => {
  try {
    const { name, description, link } = req.body;
    const image = req.file?.path || null;

    const newProject = new Project({
      name,
      description,
      link,
      image,
    });

    await newProject.save();
    res.status(201).json(newProject);
  } catch (err) {
    res.status(500).json({ message: "Error creating project", error: err.message });
  }
});

app.put("/api/projects/:id", uploadProjectImage.single("image"), async (req, res) => {
  try {
    const { name, description, link } = req.body;
    const updateData = { name, description, link };

    if (req.file?.path) updateData.image = req.file.path;

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedProject)
      return res.status(404).json({ message: "Project not found" });

    res.json(updatedProject);
  } catch (err) {
    res.status(500).json({ message: "Error updating project", error: err.message });
  }
});

app.delete("/api/projects/:id", async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Project not found" });

    res.json({ message: "Project deleted successfully", deleted });
  } catch (err) {
    res.status(500).json({ message: "Error deleting project", error: err.message });
  }
});

/* ------------------------------------------------------
   START SERVER
------------------------------------------------------ */
app.listen(5000, () =>
  console.log("🚀 Server running at http://localhost:5000")
);