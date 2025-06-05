import { storage } from "./storage";
import type { User, Assessment, InsertActivityLog } from "@shared/schema";

export class ActivityService {
  // Log edit request creation
  async logEditRequestCreated(
    requestingUser: User,
    assessment: Assessment,
    reason: string
  ) {
    await storage.createActivityLog({
      userId: requestingUser.id,
      activityType: "edit_request_created",
      title: "Edit Request Submitted",
      description: `${requestingUser.firstName} ${requestingUser.lastName} requested permission to edit ${assessment.buildingName}`,
      assessmentId: assessment.id,
      assessmentPublicId: assessment.publicId,
      buildingName: assessment.buildingName,
      priority: "medium",
      metadata: {
        reason,
        assessmentStatus: assessment.status,
        requestingUserRole: requestingUser.role
      }
    });
  }

  // Log edit request approval
  async logEditRequestApproved(
    approvingAdmin: User,
    requestingUser: User,
    assessment: Assessment
  ) {
    // Log for the admin who approved
    await storage.createActivityLog({
      userId: approvingAdmin.id,
      activityType: "edit_request_approved",
      title: "Edit Request Approved",
      description: `Approved ${requestingUser.firstName} ${requestingUser.lastName}'s request to edit ${assessment.buildingName}`,
      targetUserId: requestingUser.id,
      assessmentId: assessment.id,
      assessmentPublicId: assessment.publicId,
      buildingName: assessment.buildingName,
      priority: "high",
      metadata: {
        requestingUserName: `${requestingUser.firstName} ${requestingUser.lastName}`,
        requestingUserRole: requestingUser.role,
        assessmentStatus: assessment.status
      }
    });

    // Log for the requesting user
    await storage.createActivityLog({
      userId: requestingUser.id,
      activityType: "edit_request_approved",
      title: "Edit Request Approved",
      description: `Your request to edit ${assessment.buildingName} was approved by ${approvingAdmin.firstName} ${approvingAdmin.lastName}`,
      targetUserId: approvingAdmin.id,
      assessmentId: assessment.id,
      assessmentPublicId: assessment.publicId,
      buildingName: assessment.buildingName,
      priority: "high",
      metadata: {
        approvingAdminName: `${approvingAdmin.firstName} ${approvingAdmin.lastName}`,
        assessmentStatus: assessment.status,
        actionTaken: "approved"
      }
    });
  }

  // Log edit request denial
  async logEditRequestDenied(
    denyingAdmin: User,
    requestingUser: User,
    assessment: Assessment,
    reason?: string
  ) {
    // Log for the admin who denied
    await storage.createActivityLog({
      userId: denyingAdmin.id,
      activityType: "edit_request_denied",
      title: "Edit Request Denied",
      description: `Denied ${requestingUser.firstName} ${requestingUser.lastName}'s request to edit ${assessment.buildingName}`,
      targetUserId: requestingUser.id,
      assessmentId: assessment.id,
      assessmentPublicId: assessment.publicId,
      buildingName: assessment.buildingName,
      priority: "medium",
      metadata: {
        reason,
        requestingUserName: `${requestingUser.firstName} ${requestingUser.lastName}`,
        requestingUserRole: requestingUser.role,
        assessmentStatus: assessment.status
      }
    });

    // Log for the requesting user
    await storage.createActivityLog({
      userId: requestingUser.id,
      activityType: "edit_request_denied",
      title: "Edit Request Denied",
      description: `Your request to edit ${assessment.buildingName} was denied by ${denyingAdmin.firstName} ${denyingAdmin.lastName}`,
      targetUserId: denyingAdmin.id,
      assessmentId: assessment.id,
      assessmentPublicId: assessment.publicId,
      buildingName: assessment.buildingName,
      priority: "medium",
      metadata: {
        reason,
        denyingAdminName: `${denyingAdmin.firstName} ${denyingAdmin.lastName}`,
        assessmentStatus: assessment.status,
        actionTaken: "denied"
      }
    });
  }

  // Log user creation
  async logUserCreated(
    creatingAdmin: User,
    newUser: User,
    invitationType: "direct" | "invitation"
  ) {
    // Log for the admin who created the user
    await storage.createActivityLog({
      userId: creatingAdmin.id,
      activityType: "user_created",
      title: "User Created",
      description: `Created new ${newUser.role} account for ${newUser.firstName} ${newUser.lastName}`,
      targetUserId: newUser.id,
      priority: "high",
      metadata: {
        newUserEmail: newUser.email,
        newUserRole: newUser.role,
        invitationType,
        creationMethod: invitationType === "direct" ? "Direct creation" : "Email invitation"
      }
    });

    // Log for the new user
    await storage.createActivityLog({
      userId: newUser.id,
      activityType: "account_created",
      title: "Account Created",
      description: `Your ${newUser.role} account was created by ${creatingAdmin.firstName} ${creatingAdmin.lastName}`,
      targetUserId: creatingAdmin.id,
      priority: "high",
      metadata: {
        createdByAdmin: `${creatingAdmin.firstName} ${creatingAdmin.lastName}`,
        accountRole: newUser.role,
        invitationType,
        welcomeMessage: "Welcome to GREDA Green Building Certification Platform"
      }
    });
  }

  // Log assessment completion
  async logAssessmentCompleted(
    assessor: User,
    assessment: Assessment,
    client?: User
  ) {
    // Log for the assessor
    await storage.createActivityLog({
      userId: assessor.id,
      activityType: "assessment_completed",
      title: "Assessment Completed",
      description: `Completed assessment for ${assessment.buildingName}`,
      assessmentId: assessment.id,
      assessmentPublicId: assessment.publicId,
      buildingName: assessment.buildingName,
      priority: "high",
      metadata: {
        overallScore: assessment.overallScore,
        maxPossibleScore: assessment.maxPossibleScore,
        completedSections: assessment.completedSections,
        totalSections: assessment.totalSections,
        clientName: assessment.clientName
      }
    });

    // Log for the client if available
    if (client) {
      await storage.createActivityLog({
        userId: client.id,
        activityType: "assessment_completed",
        title: "Your Assessment is Complete",
        description: `Your building assessment for ${assessment.buildingName} has been completed by ${assessor.firstName} ${assessor.lastName}`,
        targetUserId: assessor.id,
        assessmentId: assessment.id,
        assessmentPublicId: assessment.publicId,
        buildingName: assessment.buildingName,
        priority: "high",
        metadata: {
          assessorName: `${assessor.firstName} ${assessor.lastName}`,
          overallScore: assessment.overallScore,
          maxPossibleScore: assessment.maxPossibleScore,
          completionDate: assessment.conductedAt
        }
      });
    }
  }

  // Log assessment lock/unlock actions
  async logAssessmentLocked(
    lockingAdmin: User,
    assessment: Assessment,
    reason?: string
  ) {
    await storage.createActivityLog({
      userId: lockingAdmin.id,
      activityType: "assessment_locked",
      title: "Assessment Locked",
      description: `Locked ${assessment.buildingName} for editing`,
      assessmentId: assessment.id,
      assessmentPublicId: assessment.publicId,
      buildingName: assessment.buildingName,
      priority: "medium",
      metadata: {
        reason,
        assessmentStatus: assessment.status,
        lockAction: "locked"
      }
    });
  }

  async logAssessmentUnlocked(
    unlockingAdmin: User,
    assessment: Assessment
  ) {
    await storage.createActivityLog({
      userId: unlockingAdmin.id,
      activityType: "assessment_unlocked",
      title: "Assessment Unlocked",
      description: `Unlocked ${assessment.buildingName} for editing`,
      assessmentId: assessment.id,
      assessmentPublicId: assessment.publicId,
      buildingName: assessment.buildingName,
      priority: "medium",
      metadata: {
        assessmentStatus: assessment.status,
        lockAction: "unlocked"
      }
    });
  }

  // Log user login activities
  async logUserLogin(user: User) {
    await storage.createActivityLog({
      userId: user.id,
      activityType: "user_login",
      title: "User Login",
      description: `${user.firstName} ${user.lastName} logged into the system`,
      priority: "low",
      metadata: {
        userRole: user.role,
        loginTime: new Date().toISOString()
      }
    });
  }

  // Log assessment creation
  async logAssessmentCreated(
    creator: User,
    assessment: Assessment
  ) {
    await storage.createActivityLog({
      userId: creator.id,
      activityType: "assessment_created",
      title: "Assessment Created",
      description: `Created new assessment for ${assessment.buildingName}`,
      assessmentId: assessment.id,
      assessmentPublicId: assessment.publicId,
      buildingName: assessment.buildingName,
      priority: "high",
      metadata: {
        clientName: assessment.clientName,
        buildingLocation: assessment.buildingLocation,
        creatorRole: creator.role
      }
    });
  }

  // Log user status changes
  async logUserStatusChanged(
    admin: User,
    targetUser: User,
    oldStatus: string,
    newStatus: string
  ) {
    // Log for the admin
    await storage.createActivityLog({
      userId: admin.id,
      activityType: "user_status_changed",
      title: "User Status Updated",
      description: `Changed ${targetUser.firstName} ${targetUser.lastName}'s status from ${oldStatus} to ${newStatus}`,
      targetUserId: targetUser.id,
      priority: "medium",
      metadata: {
        targetUserEmail: targetUser.email,
        targetUserRole: targetUser.role,
        oldStatus,
        newStatus,
        statusChangeReason: "Administrative action"
      }
    });

    // Log for the target user
    await storage.createActivityLog({
      userId: targetUser.id,
      activityType: "account_status_changed",
      title: "Account Status Updated",
      description: `Your account status was changed from ${oldStatus} to ${newStatus} by ${admin.firstName} ${admin.lastName}`,
      targetUserId: admin.id,
      priority: "high",
      metadata: {
        adminName: `${admin.firstName} ${admin.lastName}`,
        oldStatus,
        newStatus,
        statusChangeDate: new Date().toISOString()
      }
    });
  }
}

export const activityService = new ActivityService();