import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ContentService, Task } from '@/services/contentService';

const TasksTable: React.FC = () => {
  const [rows, setRows] = useState<Task[]>([]);

  useEffect(() => {
    ContentService.getTasks().then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Upcoming task</CardTitle>
          <CardDescription>All tasks</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item name</TableHead>
              <TableHead>Calories</TableHead>
              <TableHead>Ingredients</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>State</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.title}</TableCell>
                <TableCell>{r.calories ? `${r.calories}cal` : '-'}</TableCell>
                <TableCell className="truncate max-w-xs">{r.ingredients_summary ?? '-'}</TableCell>
                <TableCell>{r.time_minutes ? `${r.time_minutes}min` : '-'}</TableCell>
                <TableCell>{r.state.replace('_',' ')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TasksTable;


