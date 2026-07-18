/**
 * MEV AI — payments backend.
 *
 * Why this has to be a Cloud Function and not client code: creating a Razorpay order and
 * verifying a payment both require your Razorpay KEY SECRET. If that secret ever ends up in
 * the browser bundle, anyone can read it from the network tab and fake successful payments.
 * This file is the only place that secret should ever live.
 *
 * Setup (see ADMIN_SETUP.md in the project root for the full walkthrough):
 *   1. Requires the Firebase "Blaze" (pay-as-you-go) plan — Cloud Functions that call external
 *      APIs (like Razorpay) don't run on the free "Spark" plan. Blaze still has a generous free
 *      tier; you only pay if you go over it.
 *   2. cd functions && npm install
 *   3. firebase functions:secrets:set RAZORPAY_KEY_ID
 *      firebase functions:secrets:set RAZORPAY_KEY_SECRET
 *      firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET   (optional but recommended)
 *   4. firebase deploy --only functions
 */

const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const crypto = require('crypto');
const Razorpay = require('razorpay');

admin.initializeApp();
const db = admin.firestore();

const RAZORPAY_KEY_ID = defineSecret('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = defineSecret('RAZORPAY_KEY_SECRET');
const RAZORPAY_WEBHOOK_SECRET = defineSecret('RAZORPAY_WEBHOOK_SECRET');

function getRazorpayClient() {
  return new Razorpay({
    key_id: RAZORPAY_KEY_ID.value(),
    key_secret: RAZORPAY_KEY_SECRET.value(),
  });
}

/**
 * Creates a Razorpay order for a plan. The price is read from Firestore server-side —
 * NEVER trust an amount sent from the client, or anyone could pay ₹1 for a ₹999 plan.
 */
exports.createRazorpayOrder = onCall({ secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'You must be signed in.');
  const { planId } = request.data || {};
  if (!planId) throw new HttpsError('invalid-argument', 'planId is required.');

  const planSnap = await db.collection('plans').doc(planId).get();
  if (!planSnap.exists) throw new HttpsError('not-found', 'That plan does not exist.');
  const plan = planSnap.data();
  if (!plan.active) throw new HttpsError('failed-precondition', 'That plan is not currently available.');
  if (!plan.priceINR || plan.priceINR <= 0) throw new HttpsError('failed-precondition', 'Free plans do not need checkout.');

  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({
    amount: Math.round(plan.priceINR * 100), // paise
    currency: 'INR',
    receipt: `${request.auth.uid}_${planId}_${Date.now()}`,
    notes: { uid: request.auth.uid, planId },
  });

  return { orderId: order.id, amount: order.amount, currency: order.currency, keyId: RAZORPAY_KEY_ID.value() };
});

/**
 * Verifies the payment signature Razorpay's checkout widget returns to the client, and only
 * then upgrades the user's plan. This is the step that actually matters for security — the
 * client-side "payment succeeded" callback alone can be spoofed, this signature check can't.
 */
exports.verifyRazorpayPayment = onCall({ secrets: [RAZORPAY_KEY_SECRET] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'You must be signed in.');
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = request.data || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
    throw new HttpsError('invalid-argument', 'Missing payment details.');
  }

  const expected = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET.value())
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expected !== razorpay_signature) {
    throw new HttpsError('permission-denied', 'Payment signature did not match — this payment was not verified.');
  }

  const planSnap = await db.collection('plans').doc(planId).get();
  if (!planSnap.exists) throw new HttpsError('not-found', 'That plan does not exist.');
  const plan = planSnap.data();

  await db.collection('users').doc(request.auth.uid).set(
    { plan: plan.tier, planId, planRenewsAt: Date.now() + 30 * 24 * 60 * 60 * 1000 },
    { merge: true }
  );

  await db.collection('payments').add({
    uid: request.auth.uid,
    planId,
    amountINR: plan.priceINR,
    razorpay_order_id,
    razorpay_payment_id,
    status: 'paid',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, plan: plan.tier };
});

/**
 * Optional but recommended: Razorpay calls this directly (server-to-server) on payment
 * events, which is more reliable than only trusting the browser to call verifyRazorpayPayment
 * (e.g. if the user closes the tab right after paying). Point your Razorpay webhook at this
 * function's URL and set the same secret with `firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET`.
 */
exports.razorpayWebhook = onRequest({ secrets: [RAZORPAY_WEBHOOK_SECRET] }, async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const expected = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET.value())
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expected) {
    res.status(400).send('Invalid signature');
    return;
  }

  const event = req.body.event;
  if (event === 'payment.captured') {
    const payment = req.body.payload.payment.entity;
    const { uid, planId } = payment.notes || {};
    if (uid && planId) {
      const planSnap = await db.collection('plans').doc(planId).get();
      if (planSnap.exists) {
        await db.collection('users').doc(uid).set(
          { plan: planSnap.data().tier, planId, planRenewsAt: Date.now() + 30 * 24 * 60 * 60 * 1000 },
          { merge: true }
        );
      }
    }
  }

  res.status(200).send('ok');
});
