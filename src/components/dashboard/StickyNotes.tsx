import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ContentService, StickyNote } from '@/services/contentService';

const StickyNotes: React.FC = () => {
  const [notes, setNotes] = useState<StickyNote[]>([]);

  useEffect(() => {
    ContentService.getStickyNotes().then(setNotes).catch(() => setNotes([]));
  }, []);

  return (
    <Card className="bg-yellow-50">
      <CardHeader>
        <CardTitle>Sticky Note</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {notes.map((n, idx) => (
          <div key={idx} className="flex gap-2">
            <span className="text-muted-foreground">{idx + 1}.</span>
            <p>{n.content}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default StickyNotes;


