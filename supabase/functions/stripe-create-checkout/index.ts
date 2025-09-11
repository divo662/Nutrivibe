import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const stripe = new Stripe('sk_test_51RRkPd2f8DespJafTj0uZmHEOf4qsnvmYukEKHrLZfwGgwgMexES9nv7oTcgWN1DnfaxHv4q7psnEB1sESOt8RlI00czFONlfP', {
  apiVersion: '2024-12-18.acacia',
})

// Add publishable key for checkout
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RRkPd2f8DespJafTj0uZmHEOf4qsnvmYukEKHrLZfwGgwgMexES9nv7oTcgWN1DnfaxHv4q7psnEB1sESOt8RlI00czFONlfP'

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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing environment variables:', { supabaseUrl: !!supabaseUrl, supabaseAnonKey: !!supabaseAnonKey })
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
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
    const { planId, successUrl, cancelUrl, customerEmail } = await req.json()

    if (!planId || !successUrl || !cancelUrl || !customerEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Define plan configurations
    const plans = {
      'pro_monthly': {
        price: 250000, // ₦2,500 in kobo
        interval: 'month',
        name: 'Pro Monthly Plan'
      },
      'pro_annual': {
        price: 2500000, // ₦25,000 in kobo
        interval: 'year',
        name: 'Pro Annual Plan'
      }
    }

    const plan = plans[planId as keyof typeof plans]
    if (!plan) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Stripe checkout session with enhanced metadata
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'ngn',
            product_data: {
              name: plan.name,
              description: `NutriVibe Naija - ${plan.name}`,
            },
            unit_amount: plan.price,
            recurring: {
              interval: plan.interval,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&plan_id=${planId}&user_id=${user.id}`,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: {
        userId: user.id,
        planId: planId,
        supabaseUserId: user.id,
        planName: plan.name,
        planPrice: plan.price.toString(),
        planInterval: plan.interval
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: planId,
          supabaseUserId: user.id,
          planName: plan.name,
          planPrice: plan.price.toString(),
          planInterval: plan.interval
        }
      },
      // Enhanced checkout options
      billing_address_collection: 'required',
      allow_promotion_codes: true
      // Note: customer_creation and automatic_tax removed for subscription mode compatibility
    })

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating checkout session:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Internal server error'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
