import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  title: string;
}

const RecipeCard: React.FC<Props> = ({ title }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="h-16 w-16 rounded-full bg-muted" />
        <Button size="sm" variant="secondary">See recipe</Button>
      </CardContent>
      <CardDescription className="px-6 pb-4 text-xs">4m • 250cal</CardDescription>
    </Card>
  );
};

export default RecipeCard;


