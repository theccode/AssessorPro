import { storage } from "./storage";
import { emailService } from "./email-service";
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
    await storage.createNotification({
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
  }

  // Create notification for edit request denial
  async notifyEditRequestDenied(assessment: Assessment, requestingUser: User, denyingAdmin: User, reason?: string) {
    await storage.createNotification({
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
}

export const notificationService = new NotificationService();