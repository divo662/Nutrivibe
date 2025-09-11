import React from 'react';
import { Button } from '@/components/ui/button';
import { ChefHat, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-primary p-2 rounded-lg shadow-glow">
              <ChefHat className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              NutriVibe
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-foreground hover:text-primary transition-smooth">
              Features
            </a>
            <a href="#pricing" className="text-foreground hover:text-primary transition-smooth">
              Pricing
            </a>
            <a href="#recipes" className="text-foreground hover:text-primary transition-smooth">
              Recipes
            </a>
            <a href="#about" className="text-foreground hover:text-primary transition-smooth">
              About
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/auth'}>
              Login
            </Button>
            <Button variant="hero" size="sm" onClick={() => window.location.href = '/auth'}>
              Start Free Trial
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg">
            <div className="py-4 space-y-4">
              <a href="#features" className="block px-4 py-2 text-foreground hover:text-primary transition-smooth">
                Features
              </a>
              <a href="#pricing" className="block px-4 py-2 text-foreground hover:text-primary transition-smooth">
                Pricing
              </a>
              <a href="#recipes" className="block px-4 py-2 text-foreground hover:text-primary transition-smooth">
                Recipes
              </a>
              <a href="#about" className="block px-4 py-2 text-foreground hover:text-primary transition-smooth">
                About
              </a>
              <div className="px-4 pt-4 space-y-2">
                <Button variant="ghost" size="sm" className="w-full" onClick={() => window.location.href = '/auth'}>
                  Login
                </Button>
                <Button variant="hero" size="sm" className="w-full" onClick={() => window.location.href = '/auth'}>
                  Start Free Trial
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;