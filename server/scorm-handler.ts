import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs-extra";
import extractZip from "extract-zip";
import { parseString } from "xml2js";
import { v4 as uuidv4 } from "uuid";
import { storage } from "./storage";
import type { InsertScormPackage } from "@shared/schema";
import { fileURLToPath } from "url";

// ESM module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Store uploaded files temporarily
      const tempUploadDir = path.join(__dirname, "../uploads/temp");
      fs.ensureDirSync(tempUploadDir);
      cb(null, tempUploadDir);
    },
    filename: (req, file, cb) => {
      // Generate a unique filename
      const uniqueId = uuidv4();
      cb(null, `${uniqueId}-${file.originalname}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    // Only accept zip files
    if (file.mimetype === "application/zip" || path.extname(file.originalname).toLowerCase() === ".zip") {
      cb(null, true);
    } else {
      cb(new Error("Only zip files are allowed"));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Create directory for storing SCORM packages
const scormPackagesDir = path.join(__dirname, "../uploads/scorm-packages");
fs.ensureDirSync(scormPackagesDir);

// Helper function to parse SCORM manifest file
async function parseManifestFile(manifestPath: string): Promise<any> {
  try {
    const manifestXml = await fs.readFile(manifestPath, "utf8");
    
    return new Promise((resolve, reject) => {
      parseString(manifestXml, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  } catch (error) {
    console.error("Error parsing manifest file:", error);
    throw error;
  }
}

// Helper function to find the main entry point (launch file) in the manifest
function findScormEntryPoint(manifestData: any): string {
  try {
    // Try to find the resource with "adlcp:scormtype" attribute equal to "sco"
    const resources = manifestData?.manifest?.resources?.[0]?.resource;
    const scoResource = resources?.find((resource: any) => {
      const adlcpScormtype = resource?.["$"]?.["adlcp:scormtype"];
      return adlcpScormtype === "sco";
    });
    
    if (scoResource) {
      return scoResource["$"]?.href || "";
    }
    
    // If no resource has adlcp:scormtype="sco", try to find the first resource with a href
    const firstResourceWithHref = resources?.find((resource: any) => {
      return resource["$"]?.href;
    });
    
    if (firstResourceWithHref) {
      return firstResourceWithHref["$"]?.href || "";
    }
    
    // Default to index.html if nothing else is found
    return "index.html";
  } catch (error) {
    console.error("Error finding SCORM entry point:", error);
    return "index.html"; // Default to index.html
  }
}

// Find a title in the manifest data
function findScormTitle(manifestData: any): string {
  try {
    return (
      manifestData?.manifest?.organizations?.[0]?.organization?.[0]?.title?.[0] ||
      manifestData?.manifest?.metadata?.[0]?.["imsmd:lom"]?.[0]?.["imsmd:general"]?.[0]?.["imsmd:title"]?.[0]?.["imsmd:langstring"]?.[0]?._ ||
      "SCORM Package"
    );
  } catch (error) {
    console.error("Error finding SCORM title:", error);
    return "SCORM Package";
  }
}

// Find a description in the manifest data
function findScormDescription(manifestData: any): string {
  try {
    return (
      manifestData?.manifest?.organizations?.[0]?.organization?.[0]?.description?.[0] ||
      manifestData?.manifest?.metadata?.[0]?.["imsmd:lom"]?.[0]?.["imsmd:general"]?.[0]?.["imsmd:description"]?.[0]?.["imsmd:langstring"]?.[0]?._ ||
      "SCORM Package"
    );
  } catch (error) {
    console.error("Error finding SCORM description:", error);
    return "SCORM Package Description";
  }
}

// Handler for SCORM package uploads
export const uploadScormPackage = upload.single("scormPackage");

export async function handleScormUpload(req: Request, res: Response) {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Create a unique directory for this SCORM package
    const packageId = uuidv4();
    const packageDir = path.join(scormPackagesDir, packageId);
    await fs.ensureDir(packageDir);
    
    // Extract the zip file
    try {
      await extractZip(req.file.path, { dir: packageDir });
      
      // Clean up the temporary upload file
      await fs.unlink(req.file.path);
    } catch (error) {
      console.error("Error extracting zip file:", error);
      return res.status(500).json({ error: "Failed to extract SCORM package" });
    }
    
    // Look for the imsmanifest.xml file
    const manifestPath = path.join(packageDir, "imsmanifest.xml");
    
    if (!(await fs.pathExists(manifestPath))) {
      return res.status(400).json({ error: "Invalid SCORM package: missing imsmanifest.xml" });
    }
    
    // Parse the manifest file
    let manifestData;
    try {
      manifestData = await parseManifestFile(manifestPath);
    } catch (error) {
      console.error("Error parsing manifest file:", error);
      return res.status(400).json({ error: "Invalid manifest file" });
    }
    
    // Find the entry point (main HTML file)
    const entryPoint = findScormEntryPoint(manifestData);
    if (!entryPoint) {
      return res.status(400).json({ error: "Could not determine SCORM entry point" });
    }
    
    // Extract metadata from the manifest
    const title = req.body.title || findScormTitle(manifestData);
    const description = req.body.description || findScormDescription(manifestData);
    const version = manifestData?.manifest?.["$"]?.version || "1.0";
    
    // Save SCORM package info to the database
    const packageData: InsertScormPackage = {
      title,
      description,
      version,
      folderPath: packageDir,
      entryPoint,
      manifestData,
    };
    
    const scormPackage = await storage.createScormPackage(packageData);
    
    // Return the saved SCORM package data
    return res.status(201).json(scormPackage);
  } catch (error) {
    console.error("Error handling SCORM upload:", error);
    return res.status(500).json({ error: "Failed to process SCORM package" });
  }
}

// Handler for getting a list of SCORM packages
export async function getScormPackages(req: Request, res: Response) {
  try {
    const packages = await storage.getScormPackages();
    res.status(200).json(packages);
  } catch (error) {
    console.error("Error getting SCORM packages:", error);
    res.status(500).json({ error: "Failed to retrieve SCORM packages" });
  }
}

// Handler for getting a specific SCORM package
export async function getScormPackage(req: Request, res: Response) {
  try {
    const packageId = parseInt(req.params.id);
    if (isNaN(packageId)) {
      return res.status(400).json({ error: "Invalid package ID" });
    }
    
    const scormPackage = await storage.getScormPackage(packageId);
    if (!scormPackage) {
      return res.status(404).json({ error: "SCORM package not found" });
    }
    
    res.status(200).json(scormPackage);
  } catch (error) {
    console.error("Error getting SCORM package:", error);
    res.status(500).json({ error: "Failed to retrieve SCORM package" });
  }
}

// Handler for serving SCORM package files
export function serveScormFile(req: Request, res: Response) {
  const { packageId, filePath } = req.params;
  
  // For security, make sure filePath doesn't contain '..' to prevent directory traversal
  if (filePath.includes('..')) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  // Construct the full file path
  const fullFilePath = path.join(scormPackagesDir, packageId, filePath);
  
  // Check if file exists
  if (!fs.existsSync(fullFilePath)) {
    return res.status(404).json({ error: "File not found" });
  }
  
  // Serve the file
  res.sendFile(fullFilePath);
}

// Handler for SCORM tracking data
export async function saveScormTrackingData(req: Request, res: Response) {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const userId = req.user!.id;
    const { scormPackageId } = req.params;
    const trackingData = req.body;
    
    // Check if the SCORM package exists
    const scormPackage = await storage.getScormPackage(parseInt(scormPackageId));
    if (!scormPackage) {
      return res.status(404).json({ error: "SCORM package not found" });
    }
    
    // Check if tracking data already exists for this user and SCORM package
    const existingData = await storage.getScormTrackingData(userId, parseInt(scormPackageId));
    
    if (existingData) {
      // Update existing tracking data
      const updatedData = await storage.updateScormTrackingData(
        existingData.id,
        {
          ...trackingData,
          userId,
          scormPackageId: parseInt(scormPackageId),
        }
      );
      
      return res.status(200).json(updatedData);
    } else {
      // Create new tracking data
      const newData = await storage.createScormTrackingData({
        userId,
        scormPackageId: parseInt(scormPackageId),
        ...trackingData,
      });
      
      return res.status(201).json(newData);
    }
  } catch (error) {
    console.error("Error saving SCORM tracking data:", error);
    res.status(500).json({ error: "Failed to save SCORM tracking data" });
  }
}

// Handler for getting SCORM tracking data
export async function getScormTrackingData(req: Request, res: Response) {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const userId = req.user!.id;
    const { scormPackageId } = req.params;
    
    // Get tracking data for this user and SCORM package
    const trackingData = await storage.getScormTrackingData(userId, parseInt(scormPackageId));
    
    if (!trackingData) {
      return res.status(404).json({ error: "No tracking data found" });
    }
    
    res.status(200).json(trackingData);
  } catch (error) {
    console.error("Error getting SCORM tracking data:", error);
    res.status(500).json({ error: "Failed to retrieve SCORM tracking data" });
  }
}