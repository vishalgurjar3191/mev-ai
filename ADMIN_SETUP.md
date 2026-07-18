# Admin Panel + Razorpay Payments — Setup Guide

This covers everything added for: the Admin Panel (Users / Plans / Voices), and real Razorpay
subscription payments. None of this requires touching code again — it's all config/console steps.

## 1. Make yourself an admin

The very first admin has to be set manually (nobody should be able to make themselves admin from
the app — that would defeat the point). In the Firebase Console:

1. Go to your project → **Firestore Database** → `users` collection.
2. Find your own user document (match by email).
3. Edit the `role` field from `"user"` to `"admin"`.
4. Reload the app — you'll now see an **Admin** section in the sidebar.

From then on, you can promote/demote other admins from inside the Admin Panel itself (Users tab).

## 2. Upgrade to the Firebase Blaze plan

Cloud Functions that call an external API (Razorpay) require the **Blaze (pay-as-you-go)** plan —
this is a Firebase/Google requirement, not something in this code. Blaze still has a free monthly
quota; you only pay if you exceed it, which is very unlikely for a personal project.

Firebase Console → **Upgrade** (bottom-left) → follow the prompts (needs a billing card on file,
but won't charge unless you exceed free limits).

## 3. Get Razorpay keys

1. Sign up at [razorpay.com](https://razorpay.com) (free, test mode available immediately —
   no business docs needed to test).
2. Dashboard → **Settings → API Keys** → generate a **Key ID** and **Key Secret** (use "Test Mode"
   keys first so you can try the whole flow without real money).
3. Optional but recommended: **Settings → Webhooks** → add a webhook pointing at
   `https://<your-region>-<your-project-id>.cloudfunctions.net/razorpayWebhook` for the
   `payment.captured` event, and generate a webhook secret there.

## 4. Deploy the Cloud Functions

From the project root, in Termux:

```
cd functions
npm install
cd ..
firebase login          # if you haven't already
firebase use --add      # pick your Firebase project
firebase functions:secrets:set RAZORPAY_KEY_ID
firebase functions:secrets:set RAZORPAY_KEY_SECRET
firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET   # optional, only if you set up the webhook
firebase deploy --only functions
```

Each `secrets:set` command will prompt you to paste the value — paste the key/secret from
Razorpay and press Enter.

## 5. Deploy the updated Firestore rules

```
firebase deploy --only firestore:rules
```

This is what allows the Admin Panel to manage `plans` and `voices`, and locks the new `payments`
collection so only the Cloud Functions backend (never a client) can write to it.

## 6. Create your plans

Open the app → **Admin → Plans** tab. If it's empty, click **"Create default plans"** to seed
Free / Pro (₹199) / Premium (₹499), then edit prices, names, and features however you like, and
hit **Save** on each one. Only plans marked **Active** show up for users to upgrade to.

## 7. Test a payment

Razorpay's test mode gives you fake card numbers that always "succeed" without moving real money —
see [razorpay.com/docs/payments/payments/test-card-upi-details](https://razorpay.com/docs/payments/payments/test-card-upi-details/).
Go to your app's **Profile** page → **Upgrade** → pick a paid plan → pay with a test card. Your
plan should update within a couple seconds.

Once you're confident it works, switch Razorpay to **Live Mode**, generate live keys, and re-run
step 4's `secrets:set` commands with the live Key ID/Secret (they overwrite the test ones).

## 8. Managing voices from the Admin Panel

**Admin → Voices** lets you add more ElevenLabs voices without touching code. Find Voice IDs at
[elevenlabs.io/app/voice-library](https://elevenlabs.io/app/voice-library) — open any voice,
copy its Voice ID, paste it into the form, mark it Active, Save. It'll show up in every user's
Settings → Realistic Voice picker automatically.

## Notes / limitations

- This charges a **monthly flat price**, not a recurring Razorpay Subscription — a user's plan
  reverts to free automatically after 30 days (`planRenewsAt`) unless you build a renewal
  reminder/re-charge flow, or switch to Razorpay's native Subscriptions API for auto-renewal.
- The webhook function is optional but makes payments more reliable (catches the case where
  someone closes the browser tab right after paying, before the app can confirm it).
- Free plan users are never charged — the "Upgrade" button only appears for paid plans.
