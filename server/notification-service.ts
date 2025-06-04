import { storage } from "./storage";
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
  
  // Create notification for assessment completion
  async notifyAssessmentCompleted(assessment: Assessment, assessor: User, client: User) {
    // Notify admin
    const adminUsers = await storage.getUsersByRole("admin");
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
    await storage.createNotification({
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
    await storage.createNotification({
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
          type: "admin_note_created",
          title: "New Admin Note",
          message: `${admin.firstName} ${admin.lastName} has left a note for you regarding assessment "${assessment.buildingName}".`,
          priority: "high",
          isRead: false,
          createdAt: new Date()
        },
        count: await storage.getUnreadNotificationCount(assignedUser.id)
      });
    }
  }
}

export const notificationService = new NotificationService();