import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

interface StructuredRecipeDisplayProps {
  recipeData: string;
  title?: string;
}

const StructuredRecipeDisplay: React.FC<StructuredRecipeDisplayProps> = ({ 
  recipeData, 
  title = "Generated Recipe" 
}) => {
  console.log('Displaying recipe content:', recipeData);

  // Format markdown for display
  const formatMarkdown = (content: string): string => {
    return content
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      // Italic text
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3 text-emerald-700 border-b border-emerald-200 pb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-4 text-emerald-700 border-b border-emerald-200 pb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4 text-emerald-700 border-b border-emerald-200 pb-2">$1</h1>')
      // Lists with bullets
      .replace(/^- (.*$)/gim, '<li class="ml-6 mb-2 text-gray-700 flex items-start"><span class="text-emerald-500 mr-2 mt-1">•</span><span>$1</span></li>')
      // Numbered lists
      .replace(/^(\d+)\. (.*$)/gim, '<li class="ml-6 mb-2 text-gray-700 flex items-start"><span class="text-emerald-500 mr-2 mt-1 font-semibold">$1.</span><span>$2</span></li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed">')
      .replace(/\n/g, '<br>');
  };

  // Get the raw content to display
  let rawContent: string;
  
  if (typeof recipeData === 'string') {
    rawContent = recipeData;
  } else if (recipeData && typeof recipeData === 'object' && 'raw' in recipeData) {
    rawContent = (recipeData as any).raw || '';
  } else {
    rawContent = JSON.stringify(recipeData, null, 2);
  }

  // If no content, show placeholder
  if (!rawContent || rawContent.trim().length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recipe content available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border-0 bg-gradient-to-br from-white to-emerald-50">
      <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-t-lg">
        <CardTitle className="text-2xl font-bold text-center">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="prose prose-sm max-w-none">
          <div 
            className="whitespace-pre-wrap text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: `<p class="mb-3 text-gray-700">${formatMarkdown(rawContent)}</p>` 
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default StructuredRecipeDisplay;