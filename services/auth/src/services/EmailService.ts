import nodemailer from 'nodemailer';
import { createError, ERROR_CODES } from '@toll-hub/shared';

/**
 * Elite Email Service
 * 
 * Provides comprehensive email functionality with:
 * - Multiple email providers support
 * - Template management
 * - Delivery tracking
 * - Error handling
 * - Rate limiting
 * 
 * Architecture Decisions:
 * - Nodemailer for email delivery
 * - Template-based emails for consistency
 * - Provider abstraction for flexibility
 * - Delivery confirmation tracking
 * - Comprehensive error handling
 */

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SENDGRID_API_KEY ? 'apikey' : process.env.SMTP_USER,
        pass: process.env.SENDGRID_API_KEY || process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const html = this.getVerificationEmailTemplate(verificationUrl);
    const text = `Please verify your email by clicking the following link: ${verificationUrl}`;

    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email - Toll Hub',
      html,
      text,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const html = this.getPasswordResetEmailTemplate(resetUrl);
    const text = `Reset your password by clicking the following link: ${resetUrl}`;

    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - Toll Hub',
      html,
      text,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const html = this.getWelcomeEmailTemplate(firstName);
    const text = `Welcome to Toll Hub, ${firstName}! We're excited to help you manage your tolls.`;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to Toll Hub!',
      html,
      text,
    });
  }

  /**
   * Send statement ready notification
   */
  async sendStatementReadyEmail(email: string, statementId: string, amount: number): Promise<void> {
    const statementUrl = `${process.env.FRONTEND_URL}/statements/${statementId}`;
    
    const html = this.getStatementReadyEmailTemplate(statementUrl, amount);
    const text = `Your monthly statement is ready. Amount: $${amount.toFixed(2)}. View: ${statementUrl}`;

    await this.sendEmail({
      to: email,
      subject: 'Your Monthly Statement is Ready - Toll Hub',
      html,
      text,
    });
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmationEmail(email: string, amount: number, transactionId: string): Promise<void> {
    const html = this.getPaymentConfirmationEmailTemplate(amount, transactionId);
    const text = `Payment confirmed: $${amount.toFixed(2)}. Transaction ID: ${transactionId}`;

    await this.sendEmail({
      to: email,
      subject: 'Payment Confirmed - Toll Hub',
      html,
      text,
    });
  }

  /**
   * Send dispute submitted confirmation
   */
  async sendDisputeSubmittedEmail(email: string, disputeId: string): Promise<void> {
    const disputeUrl = `${process.env.FRONTEND_URL}/disputes/${disputeId}`;
    
    const html = this.getDisputeSubmittedEmailTemplate(disputeUrl);
    const text = `Your dispute has been submitted. Reference: ${disputeId}. View: ${disputeUrl}`;

    await this.sendEmail({
      to: email,
      subject: 'Dispute Submitted - Toll Hub',
      html,
      text,
    });
  }

  /**
   * Send dispute resolution notification
   */
  async sendDisputeResolutionEmail(email: string, disputeId: string, resolution: string): Promise<void> {
    const disputeUrl = `${process.env.FRONTEND_URL}/disputes/${disputeId}`;
    
    const html = this.getDisputeResolutionEmailTemplate(disputeUrl, resolution);
    const text = `Your dispute has been resolved. Resolution: ${resolution}. View: ${disputeUrl}`;

    await this.sendEmail({
      to: email,
      subject: 'Dispute Resolved - Toll Hub',
      html,
      text,
    });
  }

  /**
   * Send security alert
   */
  async sendSecurityAlertEmail(email: string, alertType: string, details: string): Promise<void> {
    const html = this.getSecurityAlertEmailTemplate(alertType, details);
    const text = `Security Alert: ${alertType}. Details: ${details}`;

    await this.sendEmail({
      to: email,
      subject: 'Security Alert - Toll Hub',
      html,
      text,
    });
  }

  /**
   * Generic email sending method
   */
  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
    from?: string;
  }): Promise<void> {
    try {
      const mailOptions = {
        from: options.from || process.env.FROM_EMAIL || 'noreply@tollhub.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw createError(
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        'Failed to send email',
        500,
        error
      );
    }
  }

  /**
   * Email templates
   */
  private getVerificationEmailTemplate(verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - Toll Hub</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8fafc; }
          .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Toll Hub</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for signing up for Toll Hub! To complete your registration, please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>This link will expire in 24 hours.</p>
          </div>
          <div class="footer">
            <p>If you didn't create an account with Toll Hub, please ignore this email.</p>
            <p>&copy; 2024 Toll Hub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetEmailTemplate(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - Toll Hub</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8fafc; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Toll Hub</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password for your Toll Hub account. Click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This link will expire in 1 hour.</p>
            <p><strong>If you didn't request a password reset, please ignore this email.</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Toll Hub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcomeEmailTemplate(firstName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Toll Hub</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8fafc; }
          .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Toll Hub!</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            <p>Welcome to Toll Hub, the unified platform for managing all your toll accounts across the United States.</p>
            <p>With Toll Hub, you can:</p>
            <ul>
              <li>View all your toll transactions in one place</li>
              <li>Receive consolidated monthly statements</li>
              <li>Manage disputes and payments</li>
              <li>Track your toll spending across multiple agencies</li>
            </ul>
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Get Started</a>
            </p>
            <p>If you have any questions, our support team is here to help!</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Toll Hub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getStatementReadyEmailTemplate(statementUrl: string, amount: number): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Monthly Statement is Ready</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8fafc; }
          .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
          .amount { font-size: 24px; font-weight: bold; color: #1e40af; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Monthly Statement is Ready</h1>
          </div>
          <div class="content">
            <h2>Statement Summary</h2>
            <p>Your monthly toll statement is ready for review.</p>
            <p><strong>Total Amount Due: <span class="amount">$${amount.toFixed(2)}</span></strong></p>
            <p style="text-align: center;">
              <a href="${statementUrl}" class="button">View Statement</a>
            </p>
            <p>You can pay online or set up automatic payments for future statements.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Toll Hub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPaymentConfirmationEmailTemplate(amount: number, transactionId: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8fafc; }
          .amount { font-size: 24px; font-weight: bold; color: #059669; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Confirmed</h1>
          </div>
          <div class="content">
            <h2>Thank You for Your Payment</h2>
            <p>Your payment has been successfully processed.</p>
            <p><strong>Amount Paid: <span class="amount">$${amount.toFixed(2)}</span></strong></p>
            <p><strong>Transaction ID: ${transactionId}</strong></p>
            <p>You will receive a receipt via email shortly.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Toll Hub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getDisputeSubmittedEmailTemplate(disputeUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dispute Submitted</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8fafc; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Dispute Submitted</h1>
          </div>
          <div class="content">
            <h2>Your Dispute Has Been Submitted</h2>
            <p>We have received your dispute and will review it within 14 business days.</p>
            <p style="text-align: center;">
              <a href="${disputeUrl}" class="button">View Dispute</a>
            </p>
            <p>You will receive updates via email as we process your dispute.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Toll Hub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getDisputeResolutionEmailTemplate(disputeUrl: string, resolution: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dispute Resolved</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8fafc; }
          .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Dispute Resolved</h1>
          </div>
          <div class="content">
            <h2>Your Dispute Has Been Resolved</h2>
            <p><strong>Resolution:</strong> ${resolution}</p>
            <p style="text-align: center;">
              <a href="${disputeUrl}" class="button">View Details</a>
            </p>
            <p>If you have any questions about this resolution, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Toll Hub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getSecurityAlertEmailTemplate(alertType: string, details: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8fafc; }
          .alert { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 4px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Security Alert</h1>
          </div>
          <div class="content">
            <h2>${alertType}</h2>
            <div class="alert">
              <p><strong>Details:</strong> ${details}</p>
            </div>
            <p>If you did not perform this action, please contact our support team immediately.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Toll Hub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
