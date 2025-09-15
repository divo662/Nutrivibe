import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContentService, ShoppingListItem } from '@/services/contentService';

const ShoppingList: React.FC<{ limit?: number; onViewAll?: () => void }> = ({ limit, onViewAll }) => {
  const [items, setItems] = useState<ShoppingListItem[]>([]);

  useEffect(() => {
    ContentService.getShoppingList().then(setItems).catch(() => setItems([]));
  }, []);

  const visibleItems = typeof limit === 'number' ? items.slice(0, limit) : items;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between pb-3 sm:pb-4">
        <div>
          <CardTitle className="text-base sm:text-lg">Shopping list</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {typeof limit === 'number' && items.length > limit ? `${limit} of ${items.length}` : 'All items'}
          </CardDescription>
        </div>
        {typeof limit === 'number' && items.length > limit && (
          <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-8" onClick={onViewAll}>
            View All
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2 max-h-64 overflow-y-auto sm:max-h-none">
        {visibleItems.map((i) => (
          <div key={i.name} className="flex items-start justify-between gap-2 text-xs sm:text-sm">
            <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
              <input type="checkbox" className="mt-0.5 h-3 w-3 sm:h-4 sm:w-4 rounded border flex-shrink-0" />
              <span className="truncate max-w-[70%] sm:max-w-full">{i.name}</span>
            </div>
            <span className="text-muted-foreground text-[10px] sm:text-sm flex-shrink-0">{i.quantity}</span>
          </div>
        ))}
        <Button className="w-full mt-2 text-xs sm:text-sm h-8 sm:h-9">Shop now</Button>
      </CardContent>
    </Card>
  );
};

export default ShoppingList;


