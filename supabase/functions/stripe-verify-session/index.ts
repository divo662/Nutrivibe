import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const stripe = new Stripe('sk_test_51RRkPd2f8DespJafTj0uZmHEOf4qsnvmYukEKHrLZfwGgwgMexES9nv7oTcgWN1DnfaxHv4q7psnEB1sESOt8RlI00czFONlfP', {
  apiVersion: '2024-12-18.acacia',
})

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
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the request body
    const { sessionId } = await req.json()

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing session ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    })

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ 
          error: 'Payment not completed',
          payment_status: session.payment_status 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract metadata from session
    const { planId, planName, planPrice, planInterval } = session.metadata || {}
    
    if (!planId) {
      return new Response(
        JSON.stringify({ error: 'Invalid session metadata' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update user's profile with subscription details
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        subscription_plan: planId,
        subscription_status: 'active',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + (planInterval === 'year' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to update profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create billing history record
    const { error: billingError } = await supabaseClient
      .from('billing_history')
      .insert({
        user_id: user.id,
        stripe_subscription_id: session.subscription as string,
        amount: session.amount_total || 0,
        currency: session.currency || 'ngn',
        status: 'succeeded',
        billing_reason: 'subscription_create',
        created_at: new Date().toISOString()
      })

    if (billingError) {
      console.error('Error creating billing history:', billingError)
    }

    // Create or update subscription usage record
    const { error: usageError } = await supabaseClient
      .from('subscription_usage')
      .upsert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        ai_generations_used: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,date'
      })

    if (usageError) {
      console.error('Error creating usage record:', usageError)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Subscription activated successfully',
        plan: planId,
        planName: planName,
        subscriptionId: session.subscription,
        customerId: session.customer
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error verifying session:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
