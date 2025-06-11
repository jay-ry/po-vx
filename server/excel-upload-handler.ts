import multer from 'multer';
import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx';
import { Request, Response } from 'express';
import { hashPassword } from './seed';
import { IStorage } from './storage';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current file path and directory
const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFilePath);

// Configure storage for excel uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(currentDir, '../uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'users-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter for Excel files only
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Excel or CSV files are allowed.'));
  }
};

// Set up multer upload
export const uploadExcel = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('excelFile');

// Process uploaded Excel file and create users
export async function processExcelUpload(req: Request, res: Response, storage: IStorage) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    const { defaultRole, defaultLanguage, courseIds = [] } = req.body;
    
    if (!defaultRole || !defaultLanguage) {
      return res.status(400).json({ message: "Default role and language are required" });
    }
    
    // Read Excel file using the read method
    const fileBuffer = fs.readFileSync(req.file.path);
    console.log("File read successfully. File size:", fileBuffer.length, "bytes");
    
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    console.log("XLSX parsed successfully. Sheet names:", workbook.SheetNames);
    
    if (workbook.SheetNames.length === 0) {
      return res.status(400).json({ message: "Excel file does not contain any sheets" });
    }
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    console.log("Using sheet:", sheetName);
    
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log("Parsed data from sheet. Row count:", data.length);
    
    if (!data || data.length === 0) {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "No data found in the uploaded file" });
    }
    
    const createdUsers = [];
    const failedUsers = [];
    
    // Process each row in the Excel file
    for (const rowData of data) {
      try {
        const row = rowData as any;
        
        // Check if required fields exist and consider different column name formats
        const name = row.name || row.Name || row['Full Name'] || row['Name'];
        const email = row.email || row.Email || row['Email Address'] || row['E-mail'];
        
        console.log("Processing user row:", { originalRow: row, extractedName: name, extractedEmail: email });
        
        if (!name || !email) {
          failedUsers.push({
            name: name || '',
            email: email || '',
            error: `Missing required fields (name or email). Found columns: ${Object.keys(row).join(', ')}`
          });
          continue;
        }
        
        // Check if email already exists using a direct email check
        console.log(`Checking if user with email ${email} already exists. Using role: ${defaultRole}`);
        
        // Check for existing user with this email
        const existingUser = await storage.getUserByUsername(email);
        const usersByEmail = existingUser ? [existingUser] : [];
        
        if (usersByEmail.length > 0) {
          failedUsers.push({
            name: name,
            email: email,
            error: "Email already exists"
          });
          continue;
        }
        
        // Generate a random password if none provided
        const password = row.password || Math.random().toString(36).slice(2, 10);
        const hashedPassword = await hashPassword(password);
        
        // Create the user
        const newUser = await storage.createUser({
          username: email, // Use email as username since we're using email-based login
          password: hashedPassword,
          name: name,
          email: email,
          role: defaultRole,
          language: defaultLanguage || "en",
        });
        
        // If course IDs were provided, assign the courses to the user
        if (courseIds && courseIds.length > 0) {
          for (const courseId of courseIds) {
            await storage.createUserProgress({
              userId: newUser.id,
              courseId: parseInt(courseId),
              completed: false,
              percentComplete: 0,
              lastAccessed: new Date(),
            });
          }
        }
        
        // Include generated password in response if auto-generated
        createdUsers.push({
          ...newUser,
          generatedPassword: !row.password ? password : undefined // Include the generated password in the response only if it was auto-generated
        });
      } catch (error) {
        console.error("Error creating user from Excel:", error);
        const rowDataAny = rowData as any;
        failedUsers.push({
          name: rowDataAny.name || '',
          email: rowDataAny.email || '',
          username: rowDataAny.username || '',
          error: "Failed to create user"
        });
      }
    }
    
    // Delete the uploaded file after processing
    fs.unlinkSync(req.file.path);
    
    res.status(201).json({ 
      created: createdUsers.length,
      failed: failedUsers.length,
      users: createdUsers,
      failedUsers: failedUsers
    });
  } catch (error) {
    console.error("Error processing Excel upload:", error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: "Failed to process Excel file" });
  }
}