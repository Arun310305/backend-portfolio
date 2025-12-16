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
  res.json(await Blog.find().sort({ _id: -1 }));
});

app.post("/api/blogs", uploadBlogImage.single("image"), async (req, res) => {
  const { title, content } = req.body;

  const blog = await Blog.create({
    title,
    content,
    image: req.file?.path || null,
    date: new Date().toDateString(),
  });

  res.status(201).json(blog);
});

app.put("/api/blogs/:id", uploadBlogImage.single("image"), async (req, res) => {
  const updated = await Blog.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      ...(req.file?.path && { image: req.file.path }),
    },
    { new: true }
  );
  res.json(updated);
});

app.delete("/api/blogs/:id", async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  res.json({ message: "Blog deleted" });
});

/* ------------------------------------------------------
   PROJECT ROUTES
------------------------------------------------------ */
app.get("/api/projects", async (req, res) => {
  res.json(await Project.find().sort({ _id: -1 }));
});

app.post("/api/projects", uploadProjectImage.single("image"), async (req, res) => {
  const project = await Project.create({
    ...req.body,
    image: req.file?.path || null,
  });

  res.status(201).json(project);
});

app.put("/api/projects/:id", uploadProjectImage.single("image"), async (req, res) => {
  const updated = await Project.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      ...(req.file?.path && { image: req.file.path }),
    },
    { new: true }
  );
res.json(updated);
});

app.delete("/api/projects/:id", async (req, res) => {
  await Project.findByIdAndDelete(req.params.id);
  res.json({ message: "Project deleted" });
});

/* ------------------------------------------------------
   START SERVER
------------------------------------------------------ */
app.listen(5000, () =>
  console.log("🚀 Server running at http://localhost:5000")
);