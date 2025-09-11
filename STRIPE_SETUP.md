# 🚀 Stripe Integration Setup Guide

## 📋 **Prerequisites**

1. **Stripe Account**: You need a Stripe account with test API keys
2. **Supabase Project**: Your project must have Edge Functions enabled
3. **Database Migration**: Run the subscription database migration first

## 🔑 **Step 1: Get Your Stripe Keys**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** > **API keys**
3. Copy your **Publishable key** and **Secret key**
4. **Important**: The secret key is already in the Edge Functions (for testing)

## 🌐 **Step 2: Set Up Stripe Webhook**

1. In Stripe Dashboard, go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL to: `https://kkwuifmmnrvzyxduzxkw.supabase.co/functions/v1/stripe-webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Webhook signing secret** (starts with `whsec_`)

## ⚙️ **Step 3: Configure Edge Functions**

1. **Update Webhook Secret**: In `supabase/functions/stripe-webhook/index.ts`, replace:
   ```typescript
   const webhookSecret = 'whsec_your_webhook_secret_here'
   ```
   with your actual webhook secret.

2. **Set Environment Variables**: In your Supabase dashboard:
   - Go to **Settings** > **Edge Functions**
   - Add these environment variables:
     ```
     SUPABASE_URL=https://kkwuifmmnrvzyxduzxkw.supabase.co
     SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     ```

## 🚀 **Step 4: Deploy Edge Functions**

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Deploy the functions**:
   ```bash
   supabase functions deploy stripe-create-checkout
   supabase functions deploy stripe-webhook
   supabase functions deploy stripe-cancel-subscription
   ```

## 🧪 **Step 5: Test the Integration**

1. **Test Checkout Session Creation**:
   - Go to your app and try to upgrade to Pro
   - Check the browser console for any errors
   - Verify the Stripe checkout page loads

2. **Test Webhook Handling**:
   - Complete a test payment
   - Check your Supabase database to see if the profile was updated
   - Verify billing history records were created

## 🔍 **Step 6: Monitor and Debug**

1. **Check Edge Function Logs**:
   ```bash
   supabase functions logs stripe-create-checkout
   supabase functions logs stripe-webhook
   ```

2. **Check Stripe Dashboard**:
   - Go to **Payments** to see test transactions
   - Go to **Subscriptions** to see active subscriptions
   - Go to **Webhooks** to see delivery attempts

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Unauthorized" Error**
- **Cause**: Missing or invalid authorization header
- **Solution**: Ensure the user is logged in and the session token is valid

### **Issue 2: Webhook Signature Verification Failed**
- **Cause**: Incorrect webhook secret
- **Solution**: Double-check the webhook secret in the Edge Function

### **Issue 3: Database Update Errors**
- **Cause**: Missing database tables or RLS policies
- **Solution**: Run the subscription database migration first

### **Issue 4: CORS Errors**
- **Cause**: Browser blocking cross-origin requests
- **Solution**: The Edge Functions already include proper CORS headers

## 📱 **Frontend Integration**

The frontend is already set up to use these Edge Functions:

1. **Upgrade to Pro**: Uses `stripe-create-checkout`
2. **Cancel Subscription**: Uses `stripe-cancel-subscription`
3. **Webhook Handling**: Automatically updates user profiles and billing history

## 🔒 **Security Notes**

1. **Never expose your Stripe secret key** in frontend code
2. **Always verify webhook signatures** (already implemented)
3. **Use RLS policies** to protect user data (already implemented)
4. **Test thoroughly** with Stripe test cards before going live

## 💳 **Test Card Numbers**

Use these Stripe test cards for testing:

- **Successful Payment**: `4242 4242 4242 4242`
- **Declined Payment**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

## 🎯 **Next Steps**

1. **Test the complete flow** from signup to payment
2. **Monitor webhook deliveries** in Stripe dashboard
3. **Verify database updates** after successful payments
4. **Test subscription cancellation** and reactivation
5. **Go live** with real Stripe keys when ready

## 📞 **Support**

If you encounter issues:
1. Check the Edge Function logs
2. Verify Stripe webhook configuration
3. Ensure database migration is complete
4. Check RLS policies are properly configured
