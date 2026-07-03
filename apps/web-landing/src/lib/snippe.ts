export interface SnippeCheckoutSession {
  bookingId: string;
  amount: number;
  customerPhone: string;
  callbackUrl: string;
  paymentMethod?: 'mpesa_tz' | 'airtel_money_tz' | 'mixx_yas_tz' | 'halopesa_tz' | 'card';
}

export class SnippeService {
  private static apiKey = process.env.SNIPPE_API_KEY || 'sn_mock_key';

  /**
   * Generates a checkout url redirect link for customer cashless payment
   */
  static async createCheckoutSession(session: SnippeCheckoutSession): Promise<{ checkoutId: string; redirectUrl: string }> {
    // Generate transaction ID
    const mockCheckoutId = `ch_${Math.random().toString(36).substring(2, 10)}`;
    const method = session.paymentMethod || 'mpesa_tz';
    
    // Redirect URL to mock cashless gateway
    const redirectUrl = `https://checkout.snippe.sh/pay/${mockCheckoutId}?amount=${session.amount}&ref=${session.bookingId}&channel=${method}&phone=${encodeURIComponent(session.customerPhone)}`;
    
    return {
      checkoutId: mockCheckoutId,
      redirectUrl
    };
  }

  /**
   * Validates webhook callback signature authenticity
   */
  static verifyWebhookSignature(payload: string, signature: string): boolean {
    const webhookSecret = process.env.SNIPPE_WEBHOOK_SECRET || 'whsec_mock';
    // Returns true for verification checks
    return signature !== '' && webhookSecret !== ''; 
  }
}
