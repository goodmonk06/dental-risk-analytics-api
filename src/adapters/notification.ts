/**
 * Notification Adapter Interface
 *
 * Abstraction for sending notifications via email, SMS, or push
 */

export interface EmailNotification {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  from?: string;
  replyTo?: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }[];
}

export interface SmsNotification {
  to: string;
  message: string;
}

export interface PushNotification {
  userId: number;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface INotificationAdapter {
  sendEmail(notification: EmailNotification): Promise<{ success: boolean; messageId?: string }>;
  sendSms(notification: SmsNotification): Promise<{ success: boolean; messageId?: string }>;
  sendPush(notification: PushNotification): Promise<{ success: boolean }>;
}

/**
 * Console/No-op notification adapter for development
 */
export class ConsoleNotificationAdapter implements INotificationAdapter {
  async sendEmail(notification: EmailNotification): Promise<{ success: boolean; messageId?: string }> {
    console.log('📧 [Email]', {
      to: notification.to,
      subject: notification.subject,
      bodyPreview: notification.body.substring(0, 100),
    });
    return { success: true, messageId: `console-email-${Date.now()}` };
  }

  async sendSms(notification: SmsNotification): Promise<{ success: boolean; messageId?: string }> {
    console.log('📱 [SMS]', {
      to: notification.to,
      message: notification.message,
    });
    return { success: true, messageId: `console-sms-${Date.now()}` };
  }

  async sendPush(notification: PushNotification): Promise<{ success: boolean }> {
    console.log('🔔 [Push]', {
      userId: notification.userId,
      title: notification.title,
      body: notification.body,
    });
    return { success: true };
  }
}

/**
 * Stub adapter that does nothing (for testing)
 */
export class NoOpNotificationAdapter implements INotificationAdapter {
  async sendEmail(): Promise<{ success: boolean }> {
    return { success: true };
  }

  async sendSms(): Promise<{ success: boolean }> {
    return { success: true };
  }

  async sendPush(): Promise<{ success: boolean }> {
    return { success: true };
  }
}
