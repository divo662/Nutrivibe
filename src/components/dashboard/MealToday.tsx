import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const MealToday: React.FC = () => {
  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Your Meal Today</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Quick overview of your plan</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="text-xs sm:text-sm space-y-1.5 sm:space-y-2 list-disc pl-4 sm:pl-5">
          <li>Bread & Jam, Coffee</li>
          <li>Grilled Chicken, Salad</li>
          <li>Fruit tarts, Chocolate mousse</li>
        </ul>
      </CardContent>
    </Card>
  );
};

export default MealToday;


