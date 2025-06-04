import { storage } from "./storage";

export async function transferMediaBetweenAssessments(
  fromAssessmentId: number, 
  toAssessmentId: number
): Promise<void> {
  try {
    console.log(`Starting media transfer from assessment ${fromAssessmentId} to ${toAssessmentId}`);
    
    // Get all media from source assessment
    const sourceMedia = await storage.getAssessmentMedia(fromAssessmentId);
    console.log(`Found ${sourceMedia.length} media files to transfer`);
    
    // Verify target assessment exists
    const targetAssessment = await storage.getAssessment(toAssessmentId);
    if (!targetAssessment) {
      throw new Error(`Target assessment ${toAssessmentId} not found`);
    }
    
    // Transfer each media file
    for (const media of sourceMedia) {
      // Create new media record for target assessment
      await storage.createAssessmentMedia({
        assessmentId: toAssessmentId,
        sectionType: media.sectionType,
        fieldName: media.fieldName,
        fileName: media.fileName,
        fileType: media.fileType,
        fileSize: media.fileSize,
        filePath: media.filePath,
        mimeType: media.mimeType,
      });
      
      // Delete from source assessment
      await storage.deleteAssessmentMedia(media.id);
    }
    
    console.log(`Successfully transferred ${sourceMedia.length} media files`);
  } catch (error) {
    console.error("Error transferring media:", error);
    throw error;
  }
}

// Helper function to safely transfer media for specific user
export async function transferUserMediaFiles(
  userId: string,
  fromPublicId: string,
  toPublicId: string
): Promise<{ success: boolean; transferredCount: number; message: string }> {
  try {
    // Get assessments by public IDs
    const fromAssessment = await storage.getAssessmentByPublicId(fromPublicId);
    const toAssessment = await storage.getAssessmentByPublicId(toPublicId);
    
    if (!fromAssessment || !toAssessment) {
      return {
        success: false,
        transferredCount: 0,
        message: "One or both assessments not found"
      };
    }
    
    // Verify user owns both assessments
    if (fromAssessment.userId !== userId || toAssessment.userId !== userId) {
      return {
        success: false,
        transferredCount: 0,
        message: "Access denied - user does not own one or both assessments"
      };
    }
    
    // Get media count before transfer
    const sourceMedia = await storage.getAssessmentMedia(fromAssessment.id);
    const mediaCount = sourceMedia.length;
    
    if (mediaCount === 0) {
      return {
        success: true,
        transferredCount: 0,
        message: "No media files to transfer"
      };
    }
    
    // Perform the transfer
    await transferMediaBetweenAssessments(fromAssessment.id, toAssessment.id);
    
    return {
      success: true,
      transferredCount: mediaCount,
      message: `Successfully transferred ${mediaCount} media files`
    };
  } catch (error) {
    console.error("Error in user media transfer:", error);
    return {
      success: false,
      transferredCount: 0,
      message: `Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}