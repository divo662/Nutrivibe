import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, Star, Users, Zap } from 'lucide-react';
import heroFood from '@/assets/hero-food.jpg';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-subtle">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
      
      <div className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="bg-accent/20 text-accent-foreground border-accent/30">
                <Zap className="h-3 w-3 mr-1" />
                AI-Powered Nutrition
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Personalized
                </span>{' '}
                <span className="text-foreground">
                  Meal Plans for
                </span>{' '}
                <span className="bg-gradient-warm bg-clip-text text-transparent">
                  Nigerian Culture
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg">
                Transform your health journey with AI-generated meal plans featuring authentic Nigerian cuisine. 
                From jollof rice to healthy egusi - nutrition that honors your culture.
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full bg-gradient-primary border-2 border-background"
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">2,000+</span> happy users
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-4 w-4 fill-accent text-accent" />
                ))}
                <span className="text-sm text-muted-foreground ml-2">4.9/5 rating</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="group">
                Start Your Free Trial
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-smooth" />
              </Button>
              
              <Button variant="outline" size="lg" className="group">
                <Play className="h-4 w-4 mr-2 group-hover:scale-110 transition-smooth" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant">
              <img
                src={heroFood}
                alt="Delicious Nigerian dishes and healthy ingredients"
                className="w-full h-[600px] object-cover"
              />
              
              {/* Overlay Cards */}
              <div className="absolute top-6 left-6 bg-background/90 backdrop-blur-sm rounded-lg p-4 shadow-warm max-w-[200px]">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">AI Generating...</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Jollof Rice with grilled chicken - 485 calories
                </p>
              </div>
              
              <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur-sm rounded-lg p-4 shadow-warm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">95%</div>
                  <div className="text-xs text-muted-foreground">Cultural Match</div>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-accent text-accent-foreground rounded-full p-4 shadow-glow animate-bounce">
              <Zap className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;