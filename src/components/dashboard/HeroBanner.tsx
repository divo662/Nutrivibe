import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const HeroBanner: React.FC = () => {
  return (
    <Card className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white overflow-hidden">
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-tight">
          Elevate Your Culinary
          <br className="hidden sm:block" />
          Experience with NutriVibe
        </CardTitle>
        <CardDescription className="text-emerald-50 text-sm sm:text-base mt-2 sm:mt-3">
          Explore recipes, plan your week, and shop seamlessly. Elevate your dining experience effortlessly.
          <span className="hidden sm:inline"> From curated recipes to nutrition insights, we make healthy eating delightful.</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between pb-4 sm:pb-6">
        <Button variant="secondary" size="sm" className="sm:h-10 sm:px-4 sm:text-base">
          Get started
        </Button>
        <div className="hidden md:block opacity-90">
          <div className="h-28 w-28 lg:h-36 lg:w-36 rounded-full bg-white/20" />
        </div>
      </CardContent>
    </Card>
  );
};

export default HeroBanner;


