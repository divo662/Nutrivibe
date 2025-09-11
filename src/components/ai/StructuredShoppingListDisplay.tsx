import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Props {
  listData: string | any;
  title?: string;
}

function renderMarkdown(md: string): string {
  let html = md
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3 text-emerald-700 border-b border-emerald-200 pb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-4 text-emerald-700 border-b border-emerald-200 pb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4 text-emerald-700 border-b border-emerald-200 pb-2">$1</h1>')
    .replace(/^- (.*$)/gim, '<li class="ml-6 mb-2 text-gray-700 flex items-start"><span class="text-emerald-500 mr-2 mt-1">•</span><span>$1</span></li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li class="ml-6 mb-2 text-gray-700 flex items-start"><span class="text-emerald-500 mr-2 mt-1 font-semibold">$1.</span><span>$2</span></li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed">');

  if (!html.startsWith('<p')) {
    html = `<p class="mb-4 text-gray-700 leading-relaxed">${html}`;
  }
  if (!html.endsWith('</p>')) {
    html = `${html}</p>`;
  }
  html = html.replace(/<li/g, '<ul class="list-none"></ul><li');
  return html;
}

const StructuredShoppingListDisplay: React.FC<Props> = ({ listData, title }) => {
  // Accept either raw markdown string or object with data.raw
  const raw: string = typeof listData === 'string' ? listData : listData?.raw || '';

  return (
    <Card className="w-full shadow-lg border-0 bg-gradient-to-br from-white to-emerald-50">
      {title && (
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold text-center">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-6">
        <div className="prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(raw) }} />
        </div>
      </CardContent>
    </Card>
  );
};

export default StructuredShoppingListDisplay;


