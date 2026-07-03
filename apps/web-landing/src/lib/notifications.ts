import { supabase } from './supabaseClient';

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'system' | 'security';
}

export class NotificationService {
  /**
   * Dispatches notifications to database logs and checks preference channels
   */
  static async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      // 1. Log notification record into Supabase
      const { error: dbErr } = await supabase
        .from('notifications')
        .insert({
          user_id: payload.userId,
          title: payload.title,
          message: payload.message,
          type: payload.type,
        });

      if (dbErr) throw dbErr;

      // 2. Fetch target user's preference settings
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', payload.userId)
        .single();

      if (prefs) {
        if (prefs.enable_email) {
          await this.dispatchEmail(payload.userId, payload.title, payload.message);
        }
        if (prefs.enable_sms) {
          await this.dispatchSms(payload.userId, payload.message);
        }
      }
    } catch (err) {
      console.error('Notification dispatch failure:', err);
    }
  }

  /**
   * Mocks sending email (e.g. Resend, Sendgrid API)
   */
  private static async dispatchEmail(userId: string, title: string, message: string): Promise<void> {
    // In production, load user's email and query email gateway API
    console.log(`[Email Dispatcher] Target User: ${userId} | Subject: ${title} | Body: ${message}`);
  }

  /**
   * Mocks sending SMS (e.g. Twilio, SMS Gateway API for Dar es Salaam provider ready)
   */
  private static async dispatchSms(userId: string, message: string): Promise<void> {
    // In production, load user's phone and query Twilio/SMS gateway API
    console.log(`[SMS Dispatcher] Target User: ${userId} | Message: ${message}`);
  }
}
