import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (razorpayScriptPromise) return razorpayScriptPromise;
  razorpayScriptPromise = new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Razorpay checkout. Check your internet connection.'));
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
}

interface CheckoutParams {
  planId: string;
  userName: string;
  userEmail: string;
  onSuccess: (newPlan: string) => void;
  onError: (message: string) => void;
}

/**
 * Full checkout flow: ask the Cloud Function for a real order (server-priced, so a user can't
 * tamper with the amount), open Razorpay's widget, then send the result back to the Cloud
 * Function to verify the signature before the plan is actually upgraded.
 */
export async function startRazorpayCheckout({ planId, userName, userEmail, onSuccess, onError }: CheckoutParams): Promise<void> {
  try {
    await loadRazorpayScript();

    const createOrder = httpsCallable(functions, 'createRazorpayOrder');
    const orderResult = (await createOrder({ planId })).data as { orderId: string; amount: number; currency: string; keyId: string };

    const razorpay = new window.Razorpay({
      key: orderResult.keyId,
      amount: orderResult.amount,
      currency: orderResult.currency,
      name: 'MEV AI',
      description: 'Plan upgrade',
      order_id: orderResult.orderId,
      prefill: { name: userName, email: userEmail },
      theme: { color: '#B08515' },
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        try {
          const verify = httpsCallable(functions, 'verifyRazorpayPayment');
          const verifyResult = (await verify({ ...response, planId })).data as { success: boolean; plan: string };
          if (verifyResult.success) onSuccess(verifyResult.plan);
          else onError('Payment could not be verified. If money was deducted, contact support.');
        } catch (err) {
          onError((err as Error).message || 'Payment verification failed.');
        }
      },
      modal: {
        ondismiss: () => onError('Checkout closed before completing payment.'),
      },
    });

    razorpay.open();
  } catch (err) {
    onError((err as Error).message || 'Could not start checkout.');
  }
}
