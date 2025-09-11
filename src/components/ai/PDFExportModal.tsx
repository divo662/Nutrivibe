import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Eye, 
  Settings, 
  Crown, 
  CheckCircle,
  Smartphone,
  Monitor,
  Printer
} from 'lucide-react';
import { pdfExportService, PDFExportOptions, MealPlanPDFData } from '@/services/pdfExportService';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';

interface PDFExportModalProps {
  mealPlanData: any;
  mealPlanTitle: string;
  trigger?: React.ReactNode;
}

export default function PDFExportModal({ 
  mealPlanData, 
  mealPlanTitle, 
  trigger 
}: PDFExportModalProps) {
  const { subscription } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportOptions, setExportOptions] = useState<PDFExportOptions>({
    format: 'A4',
    includeNutritionalCharts: true,
    includeShoppingList: true,
    includeMealPrepTips: true,
    includeCulturalNotes: true,
    customBranding: true,
    pageOrientation: 'portrait'
  });

  const isProUser = subscription?.plan === 'pro_monthly' || subscription?.plan === 'pro_yearly';

  const handleExportOptionChange = (key: keyof PDFExportOptions, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const cleanMarkdownContent = (content: string): string => {
    // Clean up markdown content for better PDF generation
    let cleaned = content;
    
    // Remove excessive asterisks and formatting
    cleaned = cleaned.replace(/\*\*\*(.*?)\*\*\*/g, '$1'); // Remove bold italic
    cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold
    cleaned = cleaned.replace(/\*(.*?)\*/g, '$1'); // Remove italic
    
    // Clean up bullet points
    cleaned = cleaned.replace(/^\s*[\*\-]\s*/gm, '* '); // Standardize bullet points
    
    // Clean up headers
    cleaned = cleaned.replace(/^#+\s*/gm, ''); // Remove markdown headers
    
    // Clean up excessive whitespace
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n'); // Remove excessive line breaks
    cleaned = cleaned.replace(/^\s+|\s+$/gm, ''); // Trim lines
    
    // Add proper structure for days if missing
    if (!cleaned.includes('Day 1') && !cleaned.includes('Day 2')) {
      const lines = cleaned.split('\n');
      const structuredLines = [];
      let dayCounter = 1;
      
      for (const line of lines) {
        if (line.trim() && !line.includes('Day')) {
          if (dayCounter === 1) {
            structuredLines.push(`Day ${dayCounter}`);
            structuredLines.push('');
          }
          structuredLines.push(line);
        }
        if (line.includes('Breakfast') || line.includes('Lunch') || line.includes('Dinner')) {
          if (dayCounter < 3) { // Assuming 3-day meal plan
            dayCounter++;
            structuredLines.push('');
            structuredLines.push(`Day ${dayCounter}`);
            structuredLines.push('');
          }
        }
      }
      cleaned = structuredLines.join('\n');
    }
    
    return cleaned;
  };

  const transformMealPlanData = (): MealPlanPDFData => {
    // Transform the meal plan data to match the PDF service interface
    let days = [];
    let shoppingList = { categories: [] };
    let mealPrepTips = [];
    let culturalNotes = [];
    let nutritionalSummary = {
      dailyCalories: 2000,
      proteinRange: '60-70g',
      carbRange: '250-300g',
      fatRange: '20-25g',
      fiberRange: '25-30g'
    };

    try {
      // Handle different data formats
      let data = mealPlanData;
      if (typeof mealPlanData === 'string') {
        data = JSON.parse(mealPlanData);
      }
      
      if (data.data && data.data.raw) {
        // Handle old format with raw markdown
        data = data.data;
      }

      // If we have raw markdown, create a simple structure
      if (typeof data === 'string' || (data && data.raw)) {
        const rawContent = typeof data === 'string' ? data : data.raw;
        
        // Create a simple day structure from raw content
        days = [{
          day: 'Day 1',
          totalCalories: 2000,
          meals: [{
            mealType: 'meal',
            name: 'Generated Meal Plan',
            calories: 2000,
            ingredients: ['Ingredients will be listed in the full content'],
            instructions: ['Instructions will be shown in the full content'],
            prepTime: 30,
            cookingTime: 45,
            difficulty: 'Medium'
          }]
        }];

        // Create basic shopping list
        shoppingList = {
          categories: [{
            category: 'General',
            items: [{
              name: 'See full meal plan for complete shopping list',
              quantity: '1',
              notes: 'Generated from AI meal plan'
            }]
          }]
        };

        // Add basic tips
        mealPrepTips = [
          'Plan your meals ahead of time',
          'Prepare ingredients in advance',
          'Store meals properly for freshness'
        ];

        // Add cultural notes
        culturalNotes = [
          'This meal plan incorporates local ingredients',
          'Adapt recipes to your cultural preferences',
          'Use seasonal and fresh ingredients'
        ];

        return {
          title: mealPlanTitle,
          user: 'User',
          generatedDate: new Date().toLocaleDateString(),
          days,
          nutritionalSummary,
          shoppingList,
          mealPrepTips,
          culturalNotes
        };
      }

      // Extract days and meals from structured data
      if (data.days && Array.isArray(data.days)) {
        days = data.days.map((day: any) => ({
          day: day.day || `Day ${day.dayNumber || 1}`,
          totalCalories: day.totalCalories || 0,
          meals: (day.meals || []).map((meal: any) => ({
            mealType: meal.mealType || meal.type || 'meal',
            name: meal.name || 'Unnamed Meal',
            calories: meal.calories || 0,
            ingredients: meal.ingredients || [],
            instructions: meal.instructions || [],
            prepTime: meal.prepTime || meal.prep_time,
            cookingTime: meal.cookingTime || meal.cooking_time,
            difficulty: meal.difficulty
          }))
        }));
      }

      // Extract shopping list
      if (data.shoppingList && data.shoppingList.categories) {
        shoppingList = data.shoppingList;
      }

      // Extract meal prep tips
      if (data.mealPrepTips && Array.isArray(data.mealPrepTips)) {
        mealPrepTips = data.mealPrepTips;
      }

      // Extract cultural notes
      if (data.culturalNotes && Array.isArray(data.culturalNotes)) {
        culturalNotes = data.culturalNotes;
      }

      // Extract nutritional summary
      if (data.nutritionalGoals) {
        nutritionalSummary = {
          dailyCalories: data.nutritionalGoals.dailyCalories || 2000,
          proteinRange: data.nutritionalGoals.proteinRange || '60-70g',
          carbRange: data.nutritionalGoals.carbRange || '250-300g',
          fatRange: data.nutritionalGoals.fatRange || '20-25g',
          fiberRange: data.nutritionalGoals.fiberRange || '25-30g'
        };
      }

    } catch (error) {
      console.error('Error transforming meal plan data:', error);
      
      // Fallback data structure
      days = [{
        day: 'Day 1',
        totalCalories: 2000,
        meals: [{
          mealType: 'meal',
          name: 'Generated Meal Plan',
          calories: 2000,
          ingredients: ['Ingredients from meal plan'],
          instructions: ['Instructions from meal plan'],
          prepTime: 30,
          cookingTime: 45,
          difficulty: 'Medium'
        }]
      }];
    }

    return {
      title: mealPlanTitle,
      user: 'User',
      generatedDate: new Date().toLocaleDateString(),
      days,
      nutritionalSummary,
      shoppingList,
      mealPrepTips,
      culturalNotes
    };
  };

  const handleGeneratePDF = async () => {
    if (!isProUser) {
      toast.error('PDF export is a Pro feature. Please upgrade to continue.');
      return;
    }

    setIsGenerating(true);
    try {
      // Try to generate structured PDF first
      try {
        const transformedData = transformMealPlanData();
        const pdf = await pdfExportService.generateMealPlanPDF(transformedData, exportOptions);
        
        // Generate filename
        const filename = `${mealPlanTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        
        // Download the PDF
        pdfExportService.downloadPDF(pdf, filename);
        
        toast.success('PDF generated successfully!');
        setIsOpen(false);
        return;
      } catch (structuredError) {
        console.log('Structured PDF failed, trying simple markdown PDF...');
        
        // Fallback to simple markdown PDF
        let rawContent = '';
        if (typeof mealPlanData === 'string') {
          rawContent = mealPlanData;
        } else if (mealPlanData.data && mealPlanData.data.raw) {
          rawContent = mealPlanData.data.raw;
        } else if (mealPlanData.data) {
          rawContent = mealPlanData.data;
        } else {
          rawContent = JSON.stringify(mealPlanData, null, 2);
        }
        
        // Clean up the content for better PDF generation
        rawContent = cleanMarkdownContent(rawContent);
        
        const pdf = pdfExportService.generateSimplePDFFromMarkdown(rawContent, mealPlanTitle, exportOptions);
        
        // Generate filename
        const filename = `${mealPlanTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        
        // Download the PDF
        pdfExportService.downloadPDF(pdf, filename);
        
        toast.success('PDF generated successfully (simple format)!');
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewPDF = async () => {
    if (!isProUser) {
      toast.error('PDF preview is a Pro feature. Please upgrade to continue.');
      return;
    }

    setIsGenerating(true);
    try {
      // Try to generate structured PDF first
      try {
        const transformedData = transformMealPlanData();
        const pdf = await pdfExportService.generateMealPlanPDF(transformedData, exportOptions);
        
        // Open PDF in new tab
        pdfExportService.openPDFInNewTab(pdf);
        
        toast.success('PDF preview opened in new tab!');
        return;
      } catch (structuredError) {
        console.log('Structured PDF preview failed, trying simple markdown PDF...');
        
        // Fallback to simple markdown PDF
        let rawContent = '';
        if (typeof mealPlanData === 'string') {
          rawContent = mealPlanData;
        } else if (mealPlanData.data && mealPlanData.data.raw) {
          rawContent = mealPlanData.data.raw;
        } else if (mealPlanData.data) {
          rawContent = mealPlanData.data;
        } else {
          rawContent = JSON.stringify(mealPlanData, null, 2);
        }
        
        // Clean up the content for better PDF generation
        rawContent = cleanMarkdownContent(rawContent);
        
        const pdf = pdfExportService.generateSimplePDFFromMarkdown(rawContent, mealPlanTitle, exportOptions);
        
        // Open PDF in new tab
        pdfExportService.openPDFInNewTab(pdf);
        
        toast.success('PDF preview opened in new tab (simple format)!');
      }
    } catch (error) {
      console.error('Error previewing PDF:', error);
      toast.error('Failed to preview PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isProUser) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Pro Feature
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Upgrade to Pro</h3>
              <p className="text-gray-600 mb-4">
                Export your meal plans as beautiful, professional PDFs with custom branding and multiple format options.
              </p>
              <Button className="w-full">
                Upgrade Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Meal Plan as PDF
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Format Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="h-5 w-5" />
                Format & Layout
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="format">Page Format</Label>
                  <Select 
                    value={exportOptions.format} 
                    onValueChange={(value: any) => handleExportOptionChange('format', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4 (Standard)</SelectItem>
                      <SelectItem value="Letter">Letter (US)</SelectItem>
                      <SelectItem value="Mobile">Mobile Optimized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="orientation">Orientation</Label>
                  <Select 
                    value={exportOptions.pageOrientation} 
                    onValueChange={(value: any) => handleExportOptionChange('pageOrientation', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5" />
                Content Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="nutritionalCharts">Nutritional Charts</Label>
                    <p className="text-sm text-gray-500">Include macro breakdown and calorie analysis</p>
                  </div>
                  <Switch
                    id="nutritionalCharts"
                    checked={exportOptions.includeNutritionalCharts}
                    onCheckedChange={(checked) => handleExportOptionChange('includeNutritionalCharts', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="shoppingList">Shopping List</Label>
                    <p className="text-sm text-gray-500">Organized grocery list with categories</p>
                  </div>
                  <Switch
                    id="shoppingList"
                    checked={exportOptions.includeShoppingList}
                    onCheckedChange={(checked) => handleExportOptionChange('includeShoppingList', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="mealPrepTips">Meal Prep Tips</Label>
                    <p className="text-sm text-gray-500">Time-saving preparation advice</p>
                  </div>
                  <Switch
                    id="mealPrepTips"
                    checked={exportOptions.includeMealPrepTips}
                    onCheckedChange={(checked) => handleExportOptionChange('includeMealPrepTips', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="culturalNotes">Cultural Notes</Label>
                    <p className="text-sm text-gray-500">Nigerian cuisine insights and substitutions</p>
                  </div>
                  <Switch
                    id="culturalNotes"
                    checked={exportOptions.includeCulturalNotes}
                    onCheckedChange={(checked) => handleExportOptionChange('includeCulturalNotes', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="customBranding">NutriVibe Branding</Label>
                    <p className="text-sm text-gray-500">Professional logo and styling</p>
                  </div>
                  <Switch
                    id="customBranding"
                    checked={exportOptions.customBranding}
                    onCheckedChange={(checked) => handleExportOptionChange('customBranding', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pro Badge */}
          <div className="flex items-center justify-center">
            <Badge variant="secondary" className="gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              Pro Feature
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handlePreviewPDF}
              disabled={isGenerating}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            
            <Button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
