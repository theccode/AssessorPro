import fs from "fs";
import path from "path";
import { storage } from "./storage";

export async function validateAndCleanupFiles() {
  console.log("Starting file validation and cleanup...");
  
  try {
    // Get all media records from database
    const allMedia = await getAllMediaRecords();
    let cleanedCount = 0;
    let checkedCount = 0;
    
    // Only clean up records that are clearly orphaned (more conservative approach)
    for (const media of allMedia) {
      checkedCount++;
      
      // Skip validation if file path is missing or invalid
      if (!media.filePath || typeof media.filePath !== 'string') {
        continue;
      }
      
      // Try multiple path variations to account for different storage patterns
      const pathsToCheck = [
        path.join(process.cwd(), media.filePath),
        path.resolve(media.filePath),
        media.filePath
      ];
      
      let fileExists = false;
      
      for (const fullPath of pathsToCheck) {
        try {
          await fs.promises.access(fullPath, fs.constants.F_OK);
          fileExists = true;
          break;
        } catch (error) {
          // Continue checking other paths
        }
      }
      
      // Only remove database record if we're absolutely sure the file doesn't exist
      // AND the record is old enough (older than 1 hour) to avoid race conditions
      if (!fileExists && media.createdAt) {
        const recordAge = Date.now() - new Date(media.createdAt).getTime();
        const oneHour = 60 * 60 * 1000;
        
        if (recordAge > oneHour) {
          console.log(`Removing confirmed orphaned media record: ${media.fileName} (ID: ${media.id})`);
          await storage.deleteAssessmentMedia(media.id);
          cleanedCount++;
        }
      }
    }
    
    console.log(`File validation complete. Checked ${checkedCount} records, cleaned up ${cleanedCount} orphaned records.`);
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