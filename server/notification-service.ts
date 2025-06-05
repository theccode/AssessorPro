import { storage } from "./storage";
import { emailService } from "./email-service";
import { activityService } from "./activity-service";
import { 
  type InsertNotification,
  type Assessment,
  type User
} from "@shared/schema";

// Helper function to get WebSocket manager
function getWSManager() {
  return (global as any).wsManager;
}

export class NotificationService {
  
  // Helper method to send email notification
  private async sendEmailNotification(user: User, subject: string, htmlContent: string) {
    try {
      if (user.email) {
        await emailService.sendEmail({
          to: user.email,
          subject: subject,
          html: htmlContent
        });
        console.log(`Email notification sent to ${user.email}: ${subject}`);
      }
    } catch (error) {
      console.error(`Failed to send email to ${user.email}:`, error);
      // Don't throw error - email failure shouldn't break the notification flow
    }
  }

  // Create notification for assessment completion
  async notifyAssessmentCompleted(assessment: Assessment, assessor: User, client: User) {
    console.log(`Starting assessment completed notifications for assessment ${assessment.id}, assessor: ${assessor.id}, client: ${client.id}`);
    
    // Notify admin
    const adminUsers = await storage.getUsersByRole("admin");
    console.log(`Found ${adminUsers.length} admin users to notify`);
    
    for (const admin of adminUsers) {
      const notification = await storage.createNotification({
        userId: admin.id,
        type: "assessment_completed",
        title: "Assessment Completed",
        message: `Assessment for ${assessment.buildingName} has been completed by ${assessor.firstName} ${assessor.lastName}`,
        assessmentId: assessment.id,
        assessmentPublicId: assessment.publicId,
        buildingName: assessment.buildingName,
        clientName: assessment.clientName,
        priority: "medium",
        metadata: {
          assessorId: assessor.id,
          assessorName: `${assessor.firstName} ${assessor.lastName}`,
          clientId: client.id
        }
      });

      console.log(`Created admin notification ${notification.id} for admin ${admin.id}`);

      // Send real-time notification via WebSocket
      const wsManager = getWSManager();
      if (wsManager) {
        const wsResult = wsManager.sendToUser(admin.id, {
          type: 'new_notification',
          notification: {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            isRead: false,
            createdAt: notification.createdAt
          },
          count: await storage.getUnreadNotificationCount(admin.id)
        });
        console.log(`WebSocket notification sent to admin ${admin.id}: ${wsResult}`);
      } else {
        console.log('WebSocket manager not available for admin notification');
      }

      // Send email notification to admin
      const adminEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2E7D32;">Assessment Completed - GREDA GBC</h2>
          <p>Dear ${admin.firstName} ${admin.lastName},</p>
          <p>An assessment has been completed and requires your review:</p>
          <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #2E7D32;">
            <strong>Building:</strong> ${assessment.buildingName}<br>
            <strong>Client:</strong> ${assessment.clientName}<br>
            <strong>Assessor:</strong> ${assessor.firstName} ${assessor.lastName}<br>
            <strong>Overall Score:</strong> ${assessment.overallScore || 'Pending'}%
          </div>
          <p>Please log in to the GREDA GBC platform to review the assessment details.</p>
          <p>Best regards,<br>GREDA Green Building Certification Team</p>
        </div>
      `;
      await this.sendEmailNotification(admin, "Assessment Completed - Action Required", adminEmailHtml);
    }

    // Notify client
    console.log(`Creating client notification for user ${client.id}`);
    const clientNotification = await storage.createNotification({
      userId: client.id,
      type: "assessment_completed",
      title: "Your Assessment is Complete",
      message: `Your building assessment for ${assessment.buildingName} has been completed and is ready for review`,
      assessmentId: assessment.id,
      assessmentPublicId: assessment.publicId,
      buildingName: assessment.buildingName,
      clientName: assessment.clientName,
      priority: "high",
      metadata: {
        assessorId: assessor.id,
        assessorName: `${assessor.firstName} ${assessor.lastName}`
      }
    });

    console.log(`Created client notification ${clientNotification.id} for client ${client.id}`);

    // Send real-time notification to client
    const wsManager = getWSManager();
    if (wsManager) {
      const wsResult = wsManager.sendToUser(client.id, {
        type: 'new_notification',
        notification: {
          id: clientNotification.id,
          type: clientNotification.type,
          title: clientNotification.title,
          message: clientNotification.message,
          priority: clientNotification.priority,
          isRead: false,
          createdAt: clientNotification.createdAt
        },
        count: await storage.getUnreadNotificationCount(client.id)
      });
      console.log(`WebSocket notification sent to client ${client.id}: ${wsResult}`);
    } else {
      console.log('WebSocket manager not available for client notification');
    }

    // Send email notification to client
    const clientEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E7D32;">Your Building Assessment is Complete!</h2>
        <p>Dear ${client.firstName} ${client.lastName},</p>
        <p>Great news! Your building assessment has been completed.</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #2E7D32;">
          <strong>Building:</strong> ${assessment.buildingName}<br>
          <strong>Location:</strong> ${assessment.buildingLocation}<br>
          <strong>Assessor:</strong> ${assessor.firstName} ${assessor.lastName}<br>
          ${assessment.overallScore ? `<strong>Overall Score:</strong> ${assessment.overallScore}%<br>` : ''}
          <strong>Completion Date:</strong> ${new Date().toLocaleDateString()}
        </div>
        <p>Your detailed assessment report is now available for review in your dashboard.</p>
        <p>Please log in to the GREDA GBC platform to view your complete assessment results and recommendations.</p>
        <p>Thank you for choosing GREDA Green Building Certification!</p>
        <p>Best regards,<br>GREDA Green Building Certification Team</p>
      </div>
    `;
    await this.sendEmailNotification(client, "Your Building Assessment is Complete! 🏗️", clientEmailHtml);
  }

  // Create notification for assessment submission
  async notifyAssessmentSubmitted(assessment: Assessment, assessor: User, client: User) {
    // Notify admin
    const adminUsers = await storage.getUsersByRole("admin");
    for (const admin of adminUsers) {
      const notification = await storage.createNotification({
        userId: admin.id,
        type: "assessment_submitted",
        title: "Assessment Submitted",
        message: `Assessment for ${assessment.buildingName} has been submitted for final review`,
        assessmentId: assessment.id,
        assessmentPublicId: assessment.publicId,
        buildingName: assessment.buildingName,
        clientName: assessment.clientName,
        priority: "high",
        metadata: {
          assessorId: assessor.id,
          assessorName: `${assessor.firstName} ${assessor.lastName}`,
          clientId: client.id
        }
      });

      // Send real-time notification via WebSocket
      const wsManager = getWSManager();
      if (wsManager) {
        wsManager.sendToUser(admin.id, {
          type: 'new_notification',
          notification: {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            isRead: false,
            createdAt: notification.createdAt
          },
          count: await storage.getUnreadNotificationCount(admin.id)
        });
      }
    }

    // Notify client
    const clientNotification = await storage.createNotification({
      userId: client.id,
      type: "assessment_submitted",
      title: "Assessment Submitted for Review",
      message: `Your building assessment for ${assessment.buildingName} has been submitted for final review`,
      assessmentId: assessment.id,
      assessmentPublicId: assessment.publicId,
      buildingName: assessment.buildingName,
      clientName: assessment.clientName,
      priority: "medium",
      metadata: {
        assessorId: assessor.id,
        assessorName: `${assessor.firstName} ${assessor.lastName}`
      }
    });

    // Send real-time notification to client
    const wsManager = getWSManager();
    if (wsManager) {
      wsManager.sendToUser(client.id, {
        type: 'new_notification',
        notification: {
          id: clientNotification.id,
          type: clientNotification.type,
          title: clientNotification.title,
          message: clientNotification.message,
          priority: clientNotification.priority,
          isRead: false,
          createdAt: clientNotification.createdAt
        },
        count: await storage.getUnreadNotificationCount(client.id)
      });
    }
  }

  // Create notification when assessment is started for a client's building
  async notifyAssessmentStarted(assessment: Assessment, assessor: User, client: User) {
    // Notify client that assessment has started on their building
    const notification = await storage.createNotification({
      userId: client.id,
      type: "assessment_started",
      title: "Assessment Started",
      message: `Assessment has been started for your building "${assessment.buildingName}" by ${assessor.firstName} ${assessor.lastName}`,
      assessmentId: assessment.id,
      assessmentPublicId: assessment.publicId,
      buildingName: assessment.buildingName,
      clientName: assessment.clientName,
      priority: "medium",
      metadata: {
        assessorId: assessor.id,
        assessorName: `${assessor.firstName} ${assessor.lastName}`,
        buildingAddress: assessment.buildingLocation
      }
    });

    // Send real-time notification via WebSocket
    const wsManager = getWSManager();
    if (wsManager) {
      wsManager.sendToUser(client.id, {
        type: 'new_notification',
        notification: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          isRead: false,
          createdAt: notification.createdAt
        },
        count: await storage.getUnreadNotificationCount(client.id)
      });
    }

    // Send email notification to client
    const clientEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E7D32;">Your Building Assessment Has Started!</h2>
        <p>Dear ${client.firstName} ${client.lastName},</p>
        <p>Good news! Your building assessment has been initiated by our certified assessor.</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #2E7D32;">
          <strong>Building:</strong> ${assessment.buildingName}<br>
          <strong>Location:</strong> ${assessment.buildingLocation}<br>
          <strong>Assessor:</strong> ${assessor.firstName} ${assessor.lastName}<br>
          <strong>Start Date:</strong> ${new Date().toLocaleDateString()}
        </div>
        <p>Your assessor will now begin the comprehensive evaluation of your building's sustainability features.</p>
        <p>You can track the progress of your assessment in your dashboard. We'll notify you when the assessment is complete.</p>
        <p>Thank you for choosing GREDA Green Building Certification!</p>
        <p>Best regards,<br>GREDA Green Building Certification Team</p>
      </div>
    `;
    await this.sendEmailNotification(client, "Your Building Assessment Has Started!", clientEmailHtml);

    // Also notify admin for tracking purposes
    const adminUsers = await storage.getUsersByRole("admin");
    for (const admin of adminUsers) {
      const adminNotification = await storage.createNotification({
        userId: admin.id,
        type: "assessment_started",
        title: "Assessment Started",
        message: `Assessment started for ${assessment.buildingName} by ${assessor.firstName} ${assessor.lastName}`,
        assessmentId: assessment.id,
        assessmentPublicId: assessment.publicId,
        buildingName: assessment.buildingName,
        clientName: assessment.clientName,
        priority: "low",
        metadata: {
          assessorId: assessor.id,
          assessorName: `${assessor.firstName} ${assessor.lastName}`,
          clientId: client.id
        }
      });

      // Send real-time notification to admin
      if (wsManager) {
        wsManager.sendToUser(admin.id, {
          type: 'new_notification',
          notification: {
            id: adminNotification.id,
            type: adminNotification.type,
            title: adminNotification.title,
            message: adminNotification.message,
            priority: adminNotification.priority,
            isRead: false,
            createdAt: adminNotification.createdAt
          },
          count: await storage.getUnreadNotificationCount(admin.id)
        });
      }
    }
  }

  // Create notification for edit request
  async notifyEditRequestCreated(assessment: Assessment, requestingUser: User, reason: string) {
    // Notify admin
    const adminUsers = await storage.getUsersByRole("admin");
    for (const admin of adminUsers) {
      await storage.createNotification({
        userId: admin.id,
        type: "edit_request_created",
        title: "Edit Request Created",
        message: `${requestingUser.firstName} ${requestingUser.lastName} has requested permission to edit ${assessment.buildingName}`,
        assessmentId: assessment.id,
        assessmentPublicId: assessment.publicId,
        buildingName: assessment.buildingName,
        clientName: assessment.clientName,
        priority: "high",
        metadata: {
          requestingUserId: requestingUser.id,
          requestingUserName: `${requestingUser.firstName} ${requestingUser.lastName}`,
          reason
        }
      });
    }

    // Notify the assessor who owns the assessment if different from requesting user
    const assessor = await storage.getUser(assessment.userId);
    if (assessor && assessor.id !== requestingUser.id) {
      await storage.createNotification({
        userId: assessor.id,
        type: "edit_request_created",
        title: "Edit Request for Your Assessment",
        message: `${requestingUser.firstName} ${requestingUser.lastName} has requested permission to edit your assessment for ${assessment.buildingName}`,
        assessmentId: assessment.id,
        assessmentPublicId: assessment.publicId,
        buildingName: assessment.buildingName,
        clientName: assessment.clientName,
        priority: "medium",
        metadata: {
          requestingUserId: requestingUser.id,
          requestingUserName: `${requestingUser.firstName} ${requestingUser.lastName}`,
          reason
        }
      });
    }
  }

  // Create notification for edit request approval
  async notifyEditRequestApproved(assessment: Assessment, requestingUser: User, approvingAdmin: User) {
    // Create dashboard notification
    const notification = await storage.createNotification({
      userId: requestingUser.id,
      type: "edit_request_approved",
      title: "Edit Request Approved",
      message: `Your request to edit ${assessment.buildingName} has been approved by ${approvingAdmin.firstName} ${approvingAdmin.lastName}`,
      assessmentId: assessment.id,
      assessmentPublicId: assessment.publicId,
      buildingName: assessment.buildingName,
      clientName: assessment.clientName,
      priority: "high",
      metadata: {
        approvingAdminId: approvingAdmin.id,
        approvingAdminName: `${approvingAdmin.firstName} ${approvingAdmin.lastName}`
      }
    });

    // Send real-time notification
    const wsManager = getWSManager();
    if (wsManager) {
      wsManager.sendToUser(requestingUser.id, {
        type: 'new_notification',
        notification: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          createdAt: notification.createdAt
        }
      });
    }

    // Send email notification to assessor
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E7D32;">Edit Request Approved - GREDA GBC</h2>
        <p>Dear ${requestingUser.firstName} ${requestingUser.lastName},</p>
        <p>Great news! Your request to edit the assessment has been approved.</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #2E7D32;">
          <strong>Building:</strong> ${assessment.buildingName}<br>
          <strong>Approved by:</strong> ${approvingAdmin.firstName} ${approvingAdmin.lastName}<br>
          <strong>Status:</strong> Assessment is now unlocked for editing
        </div>
        <p>You can now access and edit the assessment. The assessment has been unlocked and is ready for your updates.</p>
        <p>Please log in to the GREDA GBC platform to begin editing.</p>
        <p>Best regards,<br>GREDA Green Building Certification Team</p>
      </div>
    `;
    await this.sendEmailNotification(requestingUser, "Edit Request Approved - You Can Now Edit", emailHtml);
  }

  // Create notification for edit request denial
  async notifyEditRequestDenied(assessment: Assessment, requestingUser: User, denyingAdmin: User, reason?: string) {
    // Create dashboard notification
    const notification = await storage.createNotification({
      userId: requestingUser.id,
      type: "edit_request_denied",
      title: "Edit Request Denied",
      message: `Your request to edit ${assessment.buildingName} has been denied${reason ? `: ${reason}` : ''}`,
      assessmentId: assessment.id,
      assessmentPublicId: assessment.publicId,
      buildingName: assessment.buildingName,
      clientName: assessment.clientName,
      priority: "medium",
      metadata: {
        denyingAdminId: denyingAdmin.id,
        denyingAdminName: `${denyingAdmin.firstName} ${denyingAdmin.lastName}`,
        reason
      }
    });

    // Send real-time notification
    const wsManager = getWSManager();
    if (wsManager) {
      wsManager.sendToUser(requestingUser.id, {
        type: 'new_notification',
        notification: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          createdAt: notification.createdAt
        }
      });
    }

    // Send email notification to assessor
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #D32F2F;">Edit Request Denied - GREDA GBC</h2>
        <p>Dear ${requestingUser.firstName} ${requestingUser.lastName},</p>
        <p>Your request to edit the assessment has been reviewed and denied.</p>
        <div style="background-color: #fff3e0; padding: 15px; margin: 15px 0; border-left: 4px solid #D32F2F;">
          <strong>Building:</strong> ${assessment.buildingName}<br>
          <strong>Reviewed by:</strong> ${denyingAdmin.firstName} ${denyingAdmin.lastName}<br>
          ${reason ? `<strong>Reason:</strong> ${reason}<br>` : ''}
          <strong>Status:</strong> Assessment remains locked
        </div>
        <p>The assessment remains locked and cannot be edited at this time. If you have questions about this decision, please contact the administrator.</p>
        <p>Best regards,<br>GREDA Green Building Certification Team</p>
      </div>
    `;
    await this.sendEmailNotification(requestingUser, "Edit Request Denied", emailHtml);
  }

  // Create notification for report readiness
  async notifyReportReady(assessment: Assessment, client: User) {
    await storage.createNotification({
      userId: client.id,
      type: "report_ready",
      title: "Assessment Report Ready",
      message: `Your green building assessment report for ${assessment.buildingName} is now ready for download`,
      assessmentId: assessment.id,
      assessmentPublicId: assessment.publicId,
      buildingName: assessment.buildingName,
      clientName: assessment.clientName,
      priority: "high",
      metadata: {
        overallScore: assessment.overallScore,
        maxPossibleScore: assessment.maxPossibleScore
      }
    });
  }

  // Create notification for assessment lock
  async notifyAssessmentLocked(assessment: Assessment, lockingAdmin: User, reason?: string) {
    // Notify the assessor
    const assessor = await storage.getUser(assessment.userId);
    if (assessor) {
      await storage.createNotification({
        userId: assessor.id,
        type: "assessment_locked",
        title: "Assessment Locked",
        message: `Your assessment for ${assessment.buildingName} has been locked by ${lockingAdmin.firstName} ${lockingAdmin.lastName}${reason ? `: ${reason}` : ''}`,
        assessmentId: assessment.id,
        assessmentPublicId: assessment.publicId,
        buildingName: assessment.buildingName,
        clientName: assessment.clientName,
        priority: "high",
        metadata: {
          lockingAdminId: lockingAdmin.id,
          lockingAdminName: `${lockingAdmin.firstName} ${lockingAdmin.lastName}`,
          reason
        }
      });
    }

    // Notify the client
    const client = await storage.getUser(assessment.clientId);
    if (client) {
      await storage.createNotification({
        userId: client.id,
        type: "assessment_locked",
        title: "Assessment Status Update",
        message: `Your assessment for ${assessment.buildingName} has been locked for review`,
        assessmentId: assessment.id,
        assessmentPublicId: assessment.publicId,
        buildingName: assessment.buildingName,
        clientName: assessment.clientName,
        priority: "medium",
        metadata: {
          lockingAdminId: lockingAdmin.id,
          lockingAdminName: `${lockingAdmin.firstName} ${lockingAdmin.lastName}`
        }
      });
    }
  }

  // Create notification for assessment unlock
  async notifyAssessmentUnlocked(assessment: Assessment, unlockingAdmin: User) {
    // Notify the assessor
    const assessor = await storage.getUser(assessment.userId);
    if (assessor) {
      await storage.createNotification({
        userId: assessor.id,
        type: "assessment_unlocked",
        title: "Assessment Unlocked",
        message: `Your assessment for ${assessment.buildingName} has been unlocked and is available for editing`,
        assessmentId: assessment.id,
        assessmentPublicId: assessment.publicId,
        buildingName: assessment.buildingName,
        clientName: assessment.clientName,
        priority: "medium",
        metadata: {
          unlockingAdminId: unlockingAdmin.id,
          unlockingAdminName: `${unlockingAdmin.firstName} ${unlockingAdmin.lastName}`
        }
      });
    }
  }

  // Create notification for admin notes
  async notifyAdminNoteCreated(assessment: Assessment, admin: User, assignedUser: User, noteContent: string) {
    const notification = await storage.createNotification({
      userId: assignedUser.id,
      type: "admin_note_created",
      title: "New Admin Note",
      message: `${admin.firstName} ${admin.lastName} has left a note for you regarding assessment "${assessment.buildingName}".`,
      assessmentId: assessment.id,
      assessmentPublicId: assessment.publicId,
      buildingName: assessment.buildingName,
      clientName: assessment.clientName,
      priority: "high",
      metadata: {
        adminName: `${admin.firstName} ${admin.lastName}`,
        notePreview: noteContent.substring(0, 100) + (noteContent.length > 100 ? '...' : ''),
        action: "note_created"
      }
    });

    // Send real-time notification
    const wsManager = getWSManager();
    if (wsManager) {
      wsManager.sendToUser(assignedUser.id, {
        type: 'new_notification',
        notification: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          isRead: false,
          createdAt: notification.createdAt
        },
        count: await storage.getUnreadNotificationCount(assignedUser.id)
      });
    }

    // Send email notification to assigned user
    const userEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E7D32;">New Admin Note - GREDA GBC</h2>
        <p>Dear ${assignedUser.firstName} ${assignedUser.lastName},</p>
        <p>An administrator has left an important note for you regarding one of your assessments:</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #2E7D32;">
          <strong>Assessment:</strong> ${assessment.buildingName}<br>
          <strong>Admin:</strong> ${admin.firstName} ${admin.lastName}<br>
          <strong>Note:</strong><br>
          <div style="background-color: white; padding: 10px; margin-top: 10px; border-radius: 4px; font-style: italic;">
            "${noteContent}"
          </div>
        </div>
        <p>Please log in to the GREDA GBC platform to view the complete note and take any necessary action.</p>
        <p>Best regards,<br>GREDA Green Building Certification Team</p>
      </div>
    `;
    await this.sendEmailNotification(assignedUser, "New Admin Note - Action Required", userEmailHtml);
  }

  // Notify when assessment editing is completed and automatically locked
  async notifyEditingCompleted(assessment: Assessment, editor: User) {
    const client = await storage.getUser(assessment.clientId);
    const assessor = await storage.getUser(assessment.userId);

    // Notify client that editing is complete
    if (client) {
      const clientNotification = await storage.createNotification({
        userId: client.id,
        type: "assessment_editing_completed",
        title: "Assessment Editing Completed",
        message: `Editing has been completed for your assessment: ${assessment.buildingName}. The assessment is now locked for security.`,
        assessmentId: assessment.id,
        assessmentPublicId: assessment.publicId,
        buildingName: assessment.buildingName,
        clientName: assessment.clientName,
        priority: "medium",
        metadata: {
          editorId: editor.id,
          editorName: `${editor.firstName} ${editor.lastName}`,
          lockAction: "auto_locked_after_editing"
        }
      });

      // Send real-time notification to client
      const wsManager = getWSManager();
      if (wsManager) {
        wsManager.sendToUser(client.id, {
          type: 'new_notification',
          notification: {
            id: clientNotification.id,
            type: clientNotification.type,
            title: clientNotification.title,
            message: clientNotification.message,
            priority: clientNotification.priority,
            isRead: false,
            createdAt: clientNotification.createdAt
          },
          count: await storage.getUnreadNotificationCount(client.id)
        });
      }

      // Send email notification to client
      const clientEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2E7D32;">Assessment Editing Completed - GREDA GBC</h2>
          <p>Dear ${client.firstName} ${client.lastName},</p>
          <p>We wanted to inform you that the editing process for your building assessment has been completed.</p>
          <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #2E7D32;">
            <strong>Assessment:</strong> ${assessment.buildingName}<br>
            <strong>Editor:</strong> ${editor.firstName} ${editor.lastName}<br>
            <strong>Status:</strong> Locked for security
          </div>
          <p>Your assessment is now securely locked to maintain data integrity. You can view the updated assessment by logging into the GREDA GBC platform.</p>
          <p>If you have any questions about the changes made, please contact our support team.</p>
          <p>Best regards,<br>GREDA Green Building Certification Team</p>
        </div>
      `;
      await this.sendEmailNotification(client, "Assessment Editing Completed", clientEmailHtml);
    }

    // Notify admins that editing is complete
    const adminUsers = await storage.getUsersByRole("admin");
    for (const admin of adminUsers) {
      const adminNotification = await storage.createNotification({
        userId: admin.id,
        type: "assessment_editing_completed",
        title: "Assessment Editing Completed",
        message: `Assessment editing for ${assessment.buildingName} has been completed by ${editor.firstName} ${editor.lastName} and automatically locked.`,
        assessmentId: assessment.id,
        assessmentPublicId: assessment.publicId,
        buildingName: assessment.buildingName,
        clientName: assessment.clientName,
        priority: "low",
        metadata: {
          editorId: editor.id,
          editorName: `${editor.firstName} ${editor.lastName}`,
          lockAction: "auto_locked_after_editing"
        }
      });

      // Send real-time notification to admin
      const wsManager = getWSManager();
      if (wsManager) {
        wsManager.sendToUser(admin.id, {
          type: 'new_notification',
          notification: {
            id: adminNotification.id,
            type: adminNotification.type,
            title: adminNotification.title,
            message: adminNotification.message,
            priority: adminNotification.priority,
            isRead: false,
            createdAt: adminNotification.createdAt
          },
          count: await storage.getUnreadNotificationCount(admin.id)
        });
      }
    }
  }

  // Notify assessment archived
  async notifyAssessmentArchived(assessment: Assessment, archivingAdmin: User) {
    // Get the assessor who conducted the assessment
    const assessor = await storage.getUser(assessment.userId);
    
    // Get the client who owns the assessment
    const client = await storage.getUser(assessment.clientId);

    // Notify assessor
    if (assessor) {
      const assessorNotification = await storage.createNotification({
        userId: assessor.id,
        type: "assessment_archived",
        title: "Assessment Archived",
        message: `Your assessment for ${assessment.buildingName} has been archived by ${archivingAdmin.firstName} ${archivingAdmin.lastName}`,
        assessmentId: assessment.id,
        assessmentPublicId: assessment.publicId,
        buildingName: assessment.buildingName,
        clientName: assessment.clientName,
        priority: "medium",
        metadata: {
          archivingAdminId: archivingAdmin.id,
          archivingAdminName: `${archivingAdmin.firstName} ${archivingAdmin.lastName}`,
          archivedAt: new Date().toISOString()
        }
      });

      // Send real-time notification to assessor
      const wsManager = getWSManager();
      if (wsManager) {
        wsManager.sendToUser(assessor.id, {
          type: 'new_notification',
          notification: {
            id: assessorNotification.id,
            type: assessorNotification.type,
            title: assessorNotification.title,
            message: assessorNotification.message,
            priority: assessorNotification.priority,
            createdAt: assessorNotification.createdAt
          }
        });
      }

      // Send email notification to assessor
      const assessorEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6B35;">Assessment Archived - GREDA GBC</h2>
          <p>Dear ${assessor.firstName} ${assessor.lastName},</p>
          <p>This is to inform you that an assessment you conducted has been archived.</p>
          <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #FF6B35;">
            <strong>Building:</strong> ${assessment.buildingName}<br>
            <strong>Location:</strong> ${assessment.buildingLocation}<br>
            <strong>Client:</strong> ${assessment.clientName}<br>
            <strong>Archived by:</strong> ${archivingAdmin.firstName} ${archivingAdmin.lastName}<br>
            <strong>Archived on:</strong> ${new Date().toLocaleDateString()}
          </div>
          <p>The assessment has been moved to the archives and is no longer visible in the public gallery or active assessments list. All data remains securely stored for compliance and record-keeping purposes.</p>
          <p>If you have any questions about this action, please contact the administrator.</p>
          <p>Best regards,<br>GREDA Green Building Certification Team</p>
        </div>
      `;
      await this.sendEmailNotification(assessor, "Assessment Archived - GREDA GBC", assessorEmailHtml);
    }

    // Notify client
    if (client) {
      const clientNotification = await storage.createNotification({
        userId: client.id,
        type: "assessment_archived",
        title: "Your Assessment Archived",
        message: `Your building assessment for ${assessment.buildingName} has been archived`,
        assessmentId: assessment.id,
        assessmentPublicId: assessment.publicId,
        buildingName: assessment.buildingName,
        clientName: assessment.clientName,
        priority: "medium",
        metadata: {
          archivingAdminId: archivingAdmin.id,
          archivingAdminName: `${archivingAdmin.firstName} ${archivingAdmin.lastName}`,
          archivedAt: new Date().toISOString()
        }
      });

      // Send real-time notification to client
      const wsManager = getWSManager();
      if (wsManager) {
        wsManager.sendToUser(client.id, {
          type: 'new_notification',
          notification: {
            id: clientNotification.id,
            type: clientNotification.type,
            title: clientNotification.title,
            message: clientNotification.message,
            priority: clientNotification.priority,
            createdAt: clientNotification.createdAt
          }
        });
      }

      // Send email notification to client
      const clientEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6B35;">Assessment Archived - GREDA GBC</h2>
          <p>Dear ${client.firstName} ${client.lastName},</p>
          <p>This is to inform you that your building assessment has been archived.</p>
          <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #FF6B35;">
            <strong>Building:</strong> ${assessment.buildingName}<br>
            <strong>Location:</strong> ${assessment.buildingLocation}<br>
            <strong>Assessment Score:</strong> ${assessment.overallScore}%<br>
            <strong>Archived on:</strong> ${new Date().toLocaleDateString()}
          </div>
          <p>Your assessment has been moved to the archives and is no longer visible in the public gallery. However, you can still access your assessment report through your dashboard.</p>
          <p>All certification data remains valid and securely stored for your records.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>GREDA Green Building Certification Team</p>
        </div>
      `;
      await this.sendEmailNotification(client, "Your Assessment Archived - GREDA GBC", clientEmailHtml);
    }
  }
}

export const notificationService = new NotificationService();