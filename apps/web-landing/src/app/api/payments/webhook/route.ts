import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';
import { SnippeService } from '../../../../lib/snippe';

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-snippe-signature') || '';
    const payloadText = await req.text();
    const payload = JSON.parse(payloadText);

    // Verify authenticity
    const isValid = SnippeService.verifyWebhookSignature(payloadText, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized signature' }, { status: 401 });
    }

    const { bookingId, status, transactionId } = payload;

    if (status === 'success') {
      // 1. Update Payment status
      await supabase
        .from('payments')
        .update({
          status: 'completed',
          transaction_id: transactionId,
          completed_at: new Date().toISOString(),
        })
        .eq('booking_id', bookingId);

      // 2. Update Booking status to confirmed
      await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);
    } else {
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('booking_id', bookingId);

      await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Webhook error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
