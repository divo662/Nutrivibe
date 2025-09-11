import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '₦0',
    period: 'forever',
    description: 'Perfect for getting started with basic meal planning',
    badge: null,
    features: [
      'Basic meal plans (3 meals/day)',
      'Limited recipe database (50 recipes)',
      'Basic calorie tracking',
      'Community access (view only)',
      'Basic grocery lists',
      '3 AI generations per day'
    ],
    limitations: [
      'No advanced customization',
      'Ads included',
      'No offline mode',
      'No voice features'
    ],
    cta: 'Get Started Free',
    popular: false
  },
  {
    name: 'Pro',
    price: '₦2,500',
    period: 'month',
    description: 'Complete nutrition solution for serious health enthusiasts',
    badge: 'Most Popular',
    features: [
      'Advanced meal plans with customization',
      'Full recipe database (500+ Nigerian & global)',
      'Smart grocery lists with market optimization',
      'Advanced progress analytics & trends',
      'Voice-activated meal suggestions',
      'Community forum posting & interaction',
      'Unlimited plan sharing',
      'Ad-free experience',
      'Offline mode for all content',
      'Priority AI processing',
      '20 AI generations per day',
      'Meal prep schedules',
      'Macro tracking & optimization'
    ],
    limitations: [],
    cta: 'Start Pro Trial',
    popular: true
  },
  {
    name: 'Annual Pro',
    price: '₦25,000',
    period: 'year',
    description: 'Best value for long-term health transformation',
    badge: 'Best Value',
    originalPrice: '₦30,000',
    features: [
      'Everything in Pro plan',
      '2 months free (₦5,000 savings)',
      'Priority customer support',
      'Early access to new features',
      'Advanced nutrition coaching tips',
      'Exclusive webinars & content',
      'Custom recipe development requests'
    ],
    limitations: [],
    cta: 'Choose Annual',
    popular: false
  }
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 lg:py-32 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Simple Pricing
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Choose Your{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Perfect Plan
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Start free and upgrade when you're ready. All plans include our core AI meal planning features.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`relative hover:shadow-elegant transition-all duration-300 ${
                plan.popular 
                  ? 'border-primary shadow-glow scale-105 bg-background' 
                  : 'border-border hover:border-primary/30'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge 
                    variant="default" 
                    className={`${
                      plan.popular 
                        ? 'bg-gradient-primary text-primary-foreground shadow-glow' 
                        : 'bg-gradient-warm text-secondary-foreground'
                    }`}
                  >
                    {plan.popular && <Star className="h-3 w-3 mr-1" />}
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center space-y-4 pb-8">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-center space-x-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                  {plan.originalPrice && (
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-lg text-muted-foreground line-through">
                        {plan.originalPrice}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        Save ₦5,000
                      </Badge>
                    </div>
                  )}
                </div>
                <CardDescription className="text-base">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <Button 
                  variant={plan.popular ? "hero" : "outline"} 
                  className="w-full"
                  size="lg"
                >
                  {plan.cta}
                  {plan.popular && <Zap className="h-4 w-4 ml-2" />}
                </Button>

                <div className="space-y-4">
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-3">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {plan.limitations.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <div className="space-y-2">
                        {plan.limitations.map((limitation, limitIndex) => (
                          <div key={limitIndex} className="flex items-start space-x-3">
                            <div className="h-4 w-4 mt-0.5 flex-shrink-0 flex items-center justify-center">
                              <div className="h-1 w-3 bg-muted-foreground rounded"></div>
                            </div>
                            <span className="text-sm text-muted-foreground">{limitation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Note */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            All plans include 7-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;