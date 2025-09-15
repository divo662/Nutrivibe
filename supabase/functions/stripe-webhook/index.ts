import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const stripe = new Stripe('sk_test_51RRkPd2f8DespJafTj0uZmHEOf4qsnvmYukEKHrLZfwGgwgMexES9nv7oTcgWN1DnfaxHv4q7psnEB1sESOt8RlI00czFONlfP', {
  apiVersion: '2024-12-18.acacia',
})

const webhookSecret = 'whsec_your_webhook_secret_here' // You'll get this from Stripe dashboard

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'No signature provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabaseClient)
        break
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription, supabaseClient)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabaseClient)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabaseClient)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, supabaseClient)
        break
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabaseClient)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabaseClient: any) {
  const { userId, planId } = session.metadata || {}
  
  if (!userId || !planId) {
    console.error('Missing metadata in checkout session')
    return
  }

  try {
    // Update user's profile with subscription details
    const { error } = await supabaseClient
      .from('profiles')
      .update({
        subscription_plan: planId,
        subscription_status: 'active',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating profile:', error)
    }

    // Create billing history record
    await supabaseClient
      .from('billing_history')
      .insert({
        user_id: userId,
        stripe_subscription_id: session.subscription as string,
        amount: session.amount_total || 0,
        currency: session.currency || 'ngn',
        status: 'succeeded',
        billing_reason: 'subscription_create',
        created_at: new Date().toISOString()
      })

  } catch (error) {
    console.error('Error handling checkout session completed:', error)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription, supabaseClient: any) {
  const { userId, planId } = subscription.metadata || {}
  
  if (!userId || !planId) {
    console.error('Missing metadata in subscription')
    return
  }

  try {
    // Update user's profile with subscription details
    const { error } = await supabaseClient
      .from('profiles')
      .update({
        subscription_plan: planId,
        subscription_status: subscription.status,
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating profile:', error)
    }

  } catch (error) {
    console.error('Error handling subscription created:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabaseClient: any) {
  const { userId } = subscription.metadata || {}
  
  if (!userId) {
    console.error('Missing metadata in subscription')
    return
  }

  try {
    // Update user's profile with subscription details
    const { error } = await supabaseClient
      .from('profiles')
      .update({
        subscription_status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating profile:', error)
    }

  } catch (error) {
    console.error('Error handling subscription updated:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabaseClient: any) {
  const { userId } = subscription.metadata || {}
  
  if (!userId) {
    console.error('Missing metadata in subscription')
    return
  }

  try {
    // Update user's profile to free plan
    const { error } = await supabaseClient
      .from('profiles')
      .update({
        subscription_plan: 'free',
        subscription_status: 'canceled',
        stripe_subscription_id: null,
        current_period_start: null,
        current_period_end: null,
        trial_end: null,
        cancel_at_period_end: false,
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating profile:', error)
    }

  } catch (error) {
    console.error('Error handling subscription deleted:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, supabaseClient: any) {
  const subscriptionId = invoice.subscription as string
  
  if (!subscriptionId) return

  try {
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const { userId } = subscription.metadata || {}
    
    if (!userId) return

    // Create billing history record
    await supabaseClient
      .from('billing_history')
      .insert({
        user_id: userId,
        stripe_subscription_id: subscriptionId,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        billing_reason: 'subscription_cycle',
        created_at: new Date().toISOString()
      })

  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, supabaseClient: any) {
  const subscriptionId = invoice.subscription as string
  
  if (!subscriptionId) return

  try {
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const { userId } = subscription.metadata || {}
    
    if (!userId) return

    // Update subscription status to past_due
    const { error } = await supabaseClient
      .from('profiles')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating profile:', error)
    }

    // Create billing history record
    await supabaseClient
      .from('billing_history')
      .insert({
        user_id: userId,
        stripe_subscription_id: subscriptionId,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
        billing_reason: 'subscription_cycle',
        created_at: new Date().toISOString()
      })

  } catch (error) {
    console.error('Error handling invoice payment failed:', error)
  }
}
