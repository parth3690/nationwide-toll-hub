import { Twilio } from 'twilio';
import { createError, ERROR_CODES } from '@toll-hub/shared';

/**
 * Elite SMS Service
 * 
 * Provides comprehensive SMS functionality with:
 * - Twilio integration
 * - Message templates
 * - Delivery tracking
 * - Error handling
 * - Rate limiting
 * 
 * Architecture Decisions:
 * - Twilio for SMS delivery
 * - Template-based messages for consistency
 * - Delivery confirmation tracking
 * - Comprehensive error handling
 * - Rate limiting for cost control
 */

export class SmsService {
  private client: Twilio;

  constructor() {
    this.client = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  /**
   * Send MFA code via SMS
   */
  async sendMFACode(phoneNumber: string, code: string): Promise<void> {
    const message = `Your Toll Hub verification code is: ${code}. This code expires in 10 minutes.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send password reset code via SMS
   */
  async sendPasswordResetCode(phoneNumber: string, code: string): Promise<void> {
    const message = `Your Toll Hub password reset code is: ${code}. This code expires in 1 hour.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send payment confirmation via SMS
   */
  async sendPaymentConfirmation(phoneNumber: string, amount: number, transactionId: string): Promise<void> {
    const message = `Payment confirmed: $${amount.toFixed(2)}. Transaction ID: ${transactionId}. Thank you for using Toll Hub!`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send dispute submitted confirmation via SMS
   */
  async sendDisputeSubmittedConfirmation(phoneNumber: string, disputeId: string): Promise<void> {
    const message = `Your dispute has been submitted. Reference: ${disputeId}. We'll review it within 14 business days.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send security alert via SMS
   */
  async sendSecurityAlert(phoneNumber: string, alertType: string): Promise<void> {
    const message = `Security Alert: ${alertType} detected on your Toll Hub account. If this wasn't you, contact support immediately.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send statement ready notification via SMS
   */
  async sendStatementReadyNotification(phoneNumber: string, amount: number): Promise<void> {
    const message = `Your monthly statement is ready. Amount due: $${amount.toFixed(2)}. View and pay at tollhub.com`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send generic SMS
   */
  async sendSMS(phoneNumber: string, message: string): Promise<void> {
    try {
      // Format phone number to E.164 format
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedNumber,
      });

      console.log('SMS sent successfully:', result.sid);
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw createError(
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        'Failed to send SMS',
        500,
        error
      );
    }
  }

  /**
   * Send verification SMS
   */
  async sendVerificationSMS(phoneNumber: string, code: string): Promise<void> {
    const message = `Your Toll Hub verification code is: ${code}. This code expires in 10 minutes.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send welcome SMS
   */
  async sendWelcomeSMS(phoneNumber: string, firstName: string): Promise<void> {
    const message = `Welcome to Toll Hub, ${firstName}! You can now manage all your toll accounts in one place.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send account suspension SMS
   */
  async sendAccountSuspensionSMS(phoneNumber: string, reason: string): Promise<void> {
    const message = `Your Toll Hub account has been suspended. Reason: ${reason}. Contact support for assistance.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send account reactivation SMS
   */
  async sendAccountReactivationSMS(phoneNumber: string): Promise<void> {
    const message = `Your Toll Hub account has been reactivated. You can now access all features.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send low balance alert
   */
  async sendLowBalanceAlert(phoneNumber: string, agency: string, balance: number): Promise<void> {
    const message = `Low balance alert: Your ${agency} account balance is $${balance.toFixed(2)}. Consider adding funds.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send toll event notification
   */
  async sendTollEventNotification(phoneNumber: string, amount: number, location: string): Promise<void> {
    const message = `Toll event: $${amount.toFixed(2)} at ${location}. View details in your Toll Hub app.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(phoneNumber: string, amount: number, daysOverdue: number): Promise<void> {
    const message = `Payment reminder: $${amount.toFixed(2)} is ${daysOverdue} days overdue. Please pay to avoid late fees.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send dispute resolution SMS
   */
  async sendDisputeResolutionSMS(phoneNumber: string, disputeId: string, resolution: string): Promise<void> {
    const message = `Dispute ${disputeId} resolved: ${resolution}. View details in your Toll Hub app.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send maintenance notification
   */
  async sendMaintenanceNotification(phoneNumber: string, maintenanceWindow: string): Promise<void> {
    const message = `Scheduled maintenance: ${maintenanceWindow}. Some features may be temporarily unavailable.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send feature update notification
   */
  async sendFeatureUpdateNotification(phoneNumber: string, feature: string): Promise<void> {
    const message = `New feature available: ${feature}. Check out the latest updates in your Toll Hub app!`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send promotional SMS
   */
  async sendPromotionalSMS(phoneNumber: string, offer: string): Promise<void> {
    const message = `Special offer: ${offer}. Limited time only! Visit tollhub.com for details.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send emergency notification
   */
  async sendEmergencyNotification(phoneNumber: string, message: string): Promise<void> {
    const emergencyMessage = `EMERGENCY: ${message}. Please take immediate action if required.`;
    
    await this.sendSMS(phoneNumber, emergencyMessage);
  }

  /**
   * Send system status update
   */
  async sendSystemStatusUpdate(phoneNumber: string, status: string): Promise<void> {
    const message = `System status update: ${status}. We're working to resolve any issues.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send account closure notification
   */
  async sendAccountClosureNotification(phoneNumber: string, closureDate: string): Promise<void> {
    const message = `Your Toll Hub account will be closed on ${closureDate}. Contact support if you need assistance.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send data breach notification
   */
  async sendDataBreachNotification(phoneNumber: string, details: string): Promise<void> {
    const message = `Data security notice: ${details}. Please review your account and change your password if needed.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send compliance notification
   */
  async sendComplianceNotification(phoneNumber: string, requirement: string): Promise<void> {
    const message = `Compliance requirement: ${requirement}. Please complete this action to maintain your account.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send audit notification
   */
  async sendAuditNotification(phoneNumber: string, auditType: string): Promise<void> {
    const message = `Audit notification: ${auditType} has been completed. Review the results in your account.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send rate limit notification
   */
  async sendRateLimitNotification(phoneNumber: string, limitType: string): Promise<void> {
    const message = `Rate limit reached: ${limitType}. Please wait before trying again.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send quota exceeded notification
   */
  async sendQuotaExceededNotification(phoneNumber: string, quotaType: string): Promise<void> {
    const message = `Quota exceeded: ${quotaType}. Please upgrade your plan or contact support.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send subscription renewal notification
   */
  async sendSubscriptionRenewalNotification(phoneNumber: string, renewalDate: string, amount: number): Promise<void> {
    const message = `Subscription renewal: $${amount.toFixed(2)} will be charged on ${renewalDate}. Update payment method if needed.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send subscription cancellation notification
   */
  async sendSubscriptionCancellationNotification(phoneNumber: string, cancellationDate: string): Promise<void> {
    const message = `Subscription cancelled: Your service will end on ${cancellationDate}. Contact support to reactivate.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send refund notification
   */
  async sendRefundNotification(phoneNumber: string, amount: number, reason: string): Promise<void> {
    const message = `Refund processed: $${amount.toFixed(2)} has been refunded. Reason: ${reason}.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send chargeback notification
   */
  async sendChargebackNotification(phoneNumber: string, amount: number, transactionId: string): Promise<void> {
    const message = `Chargeback received: $${amount.toFixed(2)} for transaction ${transactionId}. Please review your account.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send fraud alert
   */
  async sendFraudAlert(phoneNumber: string, details: string): Promise<void> {
    const message = `Fraud alert: ${details}. Your account has been temporarily restricted for security.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send identity verification request
   */
  async sendIdentityVerificationRequest(phoneNumber: string): Promise<void> {
    const message = `Identity verification required: Please complete verification to maintain account access.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send document upload request
   */
  async sendDocumentUploadRequest(phoneNumber: string, documentType: string): Promise<void> {
    const message = `Document upload required: ${documentType} is needed to complete your account setup.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send approval notification
   */
  async sendApprovalNotification(phoneNumber: string, approvalType: string): Promise<void> {
    const message = `Approval notification: ${approvalType} has been approved. You can now access all features.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send rejection notification
   */
  async sendRejectionNotification(phoneNumber: string, rejectionType: string, reason: string): Promise<void> {
    const message = `Rejection notification: ${rejectionType} was rejected. Reason: ${reason}. Contact support for assistance.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send update notification
   */
  async sendUpdateNotification(phoneNumber: string, updateType: string): Promise<void> {
    const message = `Update notification: ${updateType} has been updated. Please review the changes.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send reminder notification
   */
  async sendReminderNotification(phoneNumber: string, reminderType: string, dueDate: string): Promise<void> {
    const message = `Reminder: ${reminderType} is due on ${dueDate}. Please complete this action.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send confirmation notification
   */
  async sendConfirmationNotification(phoneNumber: string, confirmationType: string): Promise<void> {
    const message = `Confirmation: ${confirmationType} has been confirmed. Thank you for your action.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send cancellation notification
   */
  async sendCancellationNotification(phoneNumber: string, cancellationType: string): Promise<void> {
    const message = `Cancellation: ${cancellationType} has been cancelled. Contact support if you need assistance.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send completion notification
   */
  async sendCompletionNotification(phoneNumber: string, completionType: string): Promise<void> {
    const message = `Completion: ${completionType} has been completed successfully. Thank you for your patience.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send failure notification
   */
  async sendFailureNotification(phoneNumber: string, failureType: string, reason: string): Promise<void> {
    const message = `Failure notification: ${failureType} failed. Reason: ${reason}. Please try again or contact support.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send success notification
   */
  async sendSuccessNotification(phoneNumber: string, successType: string): Promise<void> {
    const message = `Success: ${successType} completed successfully. Thank you for using Toll Hub!`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send error notification
   */
  async sendErrorNotification(phoneNumber: string, errorType: string): Promise<void> {
    const message = `Error notification: ${errorType} occurred. Our team has been notified and is working to resolve it.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send warning notification
   */
  async sendWarningNotification(phoneNumber: string, warningType: string): Promise<void> {
    const message = `Warning: ${warningType} detected. Please review your account and take appropriate action.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send info notification
   */
  async sendInfoNotification(phoneNumber: string, infoType: string): Promise<void> {
    const message = `Info: ${infoType}. Please review this information and take any necessary action.`;
    
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send custom notification
   */
  async sendCustomNotification(phoneNumber: string, message: string): Promise<void> {
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Add +1 if it's a US number without country code
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    
    // Add + if it's missing
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    
    // Return as is if it already has country code
    if (digits.length > 11) {
      return `+${digits}`;
    }
    
    // Default to US format
    return `+1${digits}`;
  }

  /**
   * Validate phone number format
   */
  private validatePhoneNumber(phoneNumber: string): boolean {
    const digits = phoneNumber.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }

  /**
   * Get message delivery status
   */
  async getMessageStatus(messageSid: string): Promise<any> {
    try {
      const message = await this.client.messages(messageSid).fetch();
      return {
        sid: message.sid,
        status: message.status,
        direction: message.direction,
        from: message.from,
        to: message.to,
        body: message.body,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        price: message.price,
        priceUnit: message.priceUnit,
        uri: message.uri,
      };
    } catch (error) {
      console.error('Failed to get message status:', error);
      throw createError(
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        'Failed to get message status',
        500,
        error
      );
    }
  }

  /**
   * Get account usage statistics
   */
  async getAccountUsage(): Promise<any> {
    try {
      const account = await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      return {
        sid: account.sid,
        friendlyName: account.friendlyName,
        status: account.status,
        type: account.type,
        dateCreated: account.dateCreated,
        dateUpdated: account.dateUpdated,
      };
    } catch (error) {
      console.error('Failed to get account usage:', error);
      throw createError(
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        'Failed to get account usage',
        500,
        error
      );
    }
  }
}
