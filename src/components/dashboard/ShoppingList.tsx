import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContentService, ShoppingListItem } from '@/services/contentService';

const ShoppingList: React.FC = () => {
  const [items, setItems] = useState<ShoppingListItem[]>([]);

  useEffect(() => {
    ContentService.getShoppingList().then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-3 sm:pb-4">
        <div>
          <CardTitle className="text-base sm:text-lg">Shopping list</CardTitle>
          <CardDescription className="text-xs sm:text-sm">See all</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((i) => (
          <div key={i.name} className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 sm:gap-3">
              <input type="checkbox" className="h-3 w-3 sm:h-4 sm:w-4 rounded border" />
              <span className="truncate">{i.name}</span>
            </div>
            <span className="text-muted-foreground text-xs sm:text-sm">{i.quantity}</span>
          </div>
        ))}
        <Button className="w-full mt-2 text-xs sm:text-sm h-8 sm:h-9">Shop now</Button>
      </CardContent>
    </Card>
  );
};

export default ShoppingList;


