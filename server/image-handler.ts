import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs-extra";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

// ESM module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create directory for storing images
const imagesDir = path.join(__dirname, "../public/uploads/images");
fs.ensureDirSync(imagesDir);

// Setup multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Ensure the upload directory exists
      fs.ensureDirSync(imagesDir);
      cb(null, imagesDir);
    },
    filename: (req, file, cb) => {
      // Generate a unique filename
      const uniqueId = uuidv4();
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uniqueId}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext) || 
        file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Handler for image uploads
export const uploadImage = upload.single("imageFile");

// Handle image upload request
export async function handleImageUpload(req: Request, res: Response) {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Create response with file details
    const imageUrl = `/uploads/images/${req.file.filename}`;
    
    console.log("Image uploaded successfully:", {
      path: req.file.path,
      filename: req.file.filename,
      destination: req.file.destination,
      url: imageUrl
    });
    
    res.json({
      success: true,
      imageUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
    
  } catch (error) {
    console.error("Error handling image upload:", error);
    res.status(500).json({ 
      error: "Failed to process image upload",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// Serve uploaded image files
export function serveImageFile(req: Request, res: Response) {
  const filename = req.params.filename;
  const imagePath = path.join(imagesDir, filename);
  
  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: "Image not found" });
  }
  
  // Send the file
  res.sendFile(imagePath);
}