import fs from "fs";
import path from "path";
import { storage } from "./storage";

export async function validateAndCleanupFiles() {
  console.log("Starting file validation and cleanup...");
  
  try {
    // Get all media records from database
    const allMedia = await getAllMediaRecords();
    let cleanedCount = 0;
    
    for (const media of allMedia) {
      const fullPath = path.join(process.cwd(), media.filePath);
      
      try {
        // Check if file exists on disk
        await fs.promises.access(fullPath);
      } catch (error) {
        // File doesn't exist, remove database record
        console.log(`Removing orphaned media record: ${media.fileName} (ID: ${media.id})`);
        await storage.deleteAssessmentMedia(media.id);
        cleanedCount++;
      }
    }
    
    console.log(`File validation complete. Cleaned up ${cleanedCount} orphaned records.`);
  } catch (error) {
    console.error("Error during file validation:", error);
  }
}

async function getAllMediaRecords() {
  // Get all media records directly from database
  try {
    const { db } = await import("./db");
    const { assessmentMedia } = await import("@shared/schema");
    const allMedia = await db.select().from(assessmentMedia);
    return allMedia;
  } catch (error) {
    console.error("Error fetching all media records:", error);
    return [];
  }
}