import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
  format: 'A4' | 'Letter' | 'Mobile';
  includeNutritionalCharts: boolean;
  includeShoppingList: boolean;
  includeMealPrepTips: boolean;
  includeCulturalNotes: boolean;
  customBranding: boolean;
  pageOrientation: 'portrait' | 'landscape';
}

export interface MealPlanPDFData {
  title: string;
  user: string;
  generatedDate: string;
  days: Array<{
    day: string;
    totalCalories: number;
    meals: Array<{
      mealType: string;
      name: string;
      calories: number;
      ingredients: string[];
      instructions: string[];
      prepTime?: number;
      cookingTime?: number;
      difficulty?: string;
    }>;
  }>;
  nutritionalSummary: {
    dailyCalories: number;
    proteinRange: string;
    carbRange: string;
    fatRange: string;
    fiberRange: string;
  };
  shoppingList: {
    categories: Array<{
      category: string;
      items: Array<{
        name: string;
        quantity: string;
        notes?: string;
      }>;
    }>;
  };
  mealPrepTips: string[];
  culturalNotes: string[];
}

export class PDFExportService {
  private defaultOptions: PDFExportOptions = {
    format: 'A4',
    includeNutritionalCharts: true,
    includeShoppingList: true,
    includeMealPrepTips: true,
    includeCulturalNotes: true,
    customBranding: true,
    pageOrientation: 'portrait'
  };

  async generateMealPlanPDF(
    mealPlanData: MealPlanPDFData,
    options: Partial<PDFExportOptions> = {}
  ): Promise<jsPDF> {
    const finalOptions = { ...this.defaultOptions, ...options };
    
    // Create PDF with appropriate dimensions
    const pdf = this.createPDF(finalOptions);
    
    // Add content based on options
    await this.addCoverPage(pdf, mealPlanData, finalOptions);
    await this.addMealPlanContent(pdf, mealPlanData, finalOptions);
    
    if (finalOptions.includeShoppingList) {
      await this.addShoppingList(pdf, mealPlanData.shoppingList, finalOptions);
    }
    
    if (finalOptions.includeNutritionalCharts) {
      await this.addNutritionalCharts(pdf, mealPlanData.nutritionalSummary, finalOptions);
    }
    
    if (finalOptions.includeMealPrepTips) {
      await this.addMealPrepTips(pdf, mealPlanData.mealPrepTips, finalOptions);
    }
    
    if (finalOptions.includeCulturalNotes) {
      await this.addCulturalNotes(pdf, mealPlanData.culturalNotes, finalOptions);
    }
    
    return pdf;
  }

  // Enhanced fallback method for raw markdown content
  generateSimplePDFFromMarkdown(
    markdownContent: string,
    title: string,
    options: Partial<PDFExportOptions> = {}
  ): jsPDF {
    const finalOptions = { ...this.defaultOptions, ...options };
    const pdf = this.createPDF(finalOptions);
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 25;
    let currentY = 30;
    
    // Add beautiful cover page
    this.addEnhancedCoverPage(pdf, title, pageWidth, pageHeight);
    pdf.addPage();
    currentY = 30;
    
    // Parse and structure the meal plan content
    const structuredContent = this.parseMealPlanContent(markdownContent);
    
    // Add meal plan overview
    this.addMealPlanOverview(pdf, structuredContent, pageWidth, margin);
    currentY = 120;
    
    // Process each day
    structuredContent.days.forEach((day, dayIndex) => {
      // Check if we need a new page
      if (currentY > pageHeight - 100) {
        pdf.addPage();
        currentY = 30;
        this.addPageHeader(pdf, title, pageWidth);
        currentY += 40;
      }
      
      // Add day header with background
      pdf.setFillColor(34, 197, 94);
      pdf.rect(margin - 5, currentY - 8, pageWidth - (margin * 2) + 10, 25, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(day.title, margin, currentY + 5);
      currentY += 35;
      
      // Add meals for this day
      day.meals.forEach((meal, mealIndex) => {
        // Check if we need a new page
        if (currentY > pageHeight - 120) {
          pdf.addPage();
          currentY = 30;
          this.addPageHeader(pdf, title, pageWidth);
          currentY += 40;
        }
        
        // Meal type header
        pdf.setTextColor(59, 130, 246);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(meal.type, margin, currentY);
        currentY += 20;
        
        // Meal description
        pdf.setTextColor(55, 65, 81);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        
        const description = meal.description || meal.name || '';
        if (description) {
          const wrappedText = this.wrapText(pdf, description, pageWidth - (margin * 2));
          wrappedText.forEach(line => {
            pdf.text(line, margin, currentY);
            currentY += 14;
          });
          currentY += 5;
        }
        
        // Calories if available
        if (meal.calories) {
          pdf.setTextColor(239, 68, 68);
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Calories: ${meal.calories}`, margin, currentY);
          currentY += 18;
        }
        
        // Ingredients if available
        if (meal.ingredients && meal.ingredients.length > 0) {
          pdf.setTextColor(75, 85, 99);
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Ingredients:', margin, currentY);
          currentY += 15;
          
          meal.ingredients.forEach(ingredient => {
            pdf.setFillColor(34, 197, 94);
            pdf.circle(margin + 3, currentY - 2, 2, 'F');
            
            pdf.setTextColor(75, 85, 99);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(ingredient, margin + 12, currentY);
            currentY += 14;
          });
          currentY += 10;
        }
        
        currentY += 15;
      });
      
      // Add separator between days
      if (dayIndex < structuredContent.days.length - 1) {
        pdf.setDrawColor(229, 231, 235);
        pdf.setLineWidth(1);
        pdf.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 20;
      }
    });
    
    // Add shopping list page
    if (structuredContent.shoppingList && structuredContent.shoppingList.length > 0) {
      this.addShoppingListPage(pdf, structuredContent.shoppingList, pageWidth, pageHeight, margin);
    }
    
    // Add footer to last page
    this.addFooter(pdf, pageWidth, pageHeight);
    
    return pdf;
  }

  private parseMealPlanContent(content: string): any {
    const lines = content.split('\n');
    const result = {
      days: [],
      shoppingList: [],
      nutritionalInfo: {}
    };
    
    let currentDay = null;
    let currentMeal = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) continue;
      
      // Detect day headers
      if (trimmedLine.match(/^Day \d+/i)) {
        currentDay = {
          title: trimmedLine,
          meals: []
        };
        result.days.push(currentDay);
        continue;
      }
      
      // Detect meal types
      if (trimmedLine.match(/^(Breakfast|Lunch|Dinner|Snack):/i)) {
        const mealType = trimmedLine.split(':')[0];
        currentMeal = {
          type: mealType,
          name: trimmedLine.split(':')[1]?.trim() || '',
          description: '',
          calories: '',
          ingredients: []
        };
        if (currentDay) {
          currentDay.meals.push(currentMeal);
        }
        continue;
      }
      
      // Detect calories
      if (trimmedLine.includes('calories') || trimmedLine.includes('Calories')) {
        if (currentMeal) {
          currentMeal.calories = trimmedLine;
        }
        continue;
      }
      
      // Detect ingredients (bullet points)
      if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
        const ingredient = trimmedLine.substring(2);
        if (currentMeal) {
          currentMeal.ingredients.push(ingredient);
        } else {
          result.shoppingList.push(ingredient);
        }
        continue;
      }
      
      // Add description to current meal
      if (currentMeal && !currentMeal.description && !trimmedLine.includes('calories')) {
        currentMeal.description = trimmedLine;
      }
    }
    
    return result;
  }

  private wrapText(pdf: jsPDF, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = pdf.getTextWidth(testLine);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  private addMealPlanOverview(pdf: jsPDF, content: any, pageWidth: number, margin: number): void {
    // Add overview section
    pdf.setTextColor(34, 197, 94);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Meal Plan Overview', pageWidth / 2, 50, { align: 'center' });
    
    // Add day count
    pdf.setTextColor(59, 130, 246);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${content.days.length} Days`, margin, 80);
    
    // Add total meals
    const totalMeals = content.days.reduce((total: number, day: any) => total + day.meals.length, 0);
    pdf.text(`${totalMeals} Meals`, margin + 100, 80);
    
    // Add shopping list count
    if (content.shoppingList.length > 0) {
      pdf.text(`${content.shoppingList.length} Shopping Items`, margin + 200, 80);
    }
  }

  private addShoppingListPage(pdf: jsPDF, shoppingList: string[], pageWidth: number, pageHeight: number, margin: number): void {
    pdf.addPage();
    
    // Header
    pdf.setTextColor(34, 197, 94);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Shopping List', pageWidth / 2, 40, { align: 'center' });
    
    let currentY = 80;
    
    // Group items by category (simple grouping)
    const categories = {
      'Proteins': shoppingList.filter(item => 
        item.toLowerCase().includes('chicken') || 
        item.toLowerCase().includes('fish') || 
        item.toLowerCase().includes('beef') ||
        item.toLowerCase().includes('egg') ||
        item.toLowerCase().includes('bean')
      ),
      'Vegetables': shoppingList.filter(item => 
        item.toLowerCase().includes('tomato') || 
        item.toLowerCase().includes('onion') || 
        item.toLowerCase().includes('pepper') ||
        item.toLowerCase().includes('vegetable') ||
        item.toLowerCase().includes('carrot')
      ),
      'Grains': shoppingList.filter(item => 
        item.toLowerCase().includes('rice') || 
        item.toLowerCase().includes('bread') || 
        item.toLowerCase().includes('pasta') ||
        item.toLowerCase().includes('quinoa')
      ),
      'Other': shoppingList.filter(item => 
        !shoppingList.some(catItem => 
          ['Proteins', 'Vegetables', 'Grains'].some(cat => 
            cat === 'Proteins' && (item.toLowerCase().includes('chicken') || item.toLowerCase().includes('fish') || item.toLowerCase().includes('beef') || item.toLowerCase().includes('egg') || item.toLowerCase().includes('bean')) ||
            cat === 'Vegetables' && (item.toLowerCase().includes('tomato') || item.toLowerCase().includes('onion') || item.toLowerCase().includes('pepper') || item.toLowerCase().includes('vegetable') || item.toLowerCase().includes('carrot')) ||
            cat === 'Grains' && (item.toLowerCase().includes('rice') || item.toLowerCase().includes('bread') || item.toLowerCase().includes('pasta') || item.toLowerCase().includes('quinoa'))
          )
        )
      )
    };
    
    Object.entries(categories).forEach(([category, items]) => {
      if (items.length === 0) return;
      
      // Check if we need a new page
      if (currentY > pageHeight - 100) {
        pdf.addPage();
        currentY = 40;
      }
      
      // Category header
      pdf.setTextColor(59, 130, 246);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(category, margin, currentY);
      currentY += 20;
      
      // Items
      items.forEach(item => {
        pdf.setFillColor(34, 197, 94);
        pdf.circle(margin + 3, currentY - 2, 2, 'F');
        
        pdf.setTextColor(75, 85, 99);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(item, margin + 12, currentY);
        currentY += 16;
      });
      
      currentY += 15;
    });
  }

  private addEnhancedCoverPage(pdf: jsPDF, title: string, pageWidth: number, pageHeight: number): void {
    // Create gradient-like background effect using multiple rectangles with different colors
    const gradientSteps = 20;
    for (let i = 0; i < gradientSteps; i++) {
      const intensity = 0.1 + (i / gradientSteps) * 0.3;
      const y = (i / gradientSteps) * pageHeight;
      const height = pageHeight / gradientSteps;
      
      // Create a lighter shade for gradient effect
      const r = Math.floor(34 + (255 - 34) * intensity);
      const g = Math.floor(197 + (255 - 197) * intensity);
      const b = Math.floor(94 + (255 - 94) * intensity);
      
      pdf.setFillColor(r, g, b);
      pdf.rect(0, y, pageWidth, height, 'F');
    }
    
    // Reset to original color
    pdf.setFillColor(34, 197, 94);
    
    // Add decorative elements
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(3);
    
    // Top border
    pdf.line(30, 50, pageWidth - 30, 50);
    
    // Bottom border
    pdf.line(30, pageHeight - 50, pageWidth - 30, pageHeight - 50);
    
    // Corner decorations
    this.addCornerDecorations(pdf, pageWidth, pageHeight);
    
    // Add NutriVibe branding
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(32);
    pdf.setFont('helvetica', 'bold');
    pdf.text('NutriVibe', pageWidth / 2, 120, { align: 'center' });
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'normal');
    pdf.text('AI-Powered Meal Planning', pageWidth / 2, 150, { align: 'center' });
    
    // Add main title
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, pageWidth / 2, 220, { align: 'center' });
    
    // Add subtitle
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Your Personalized Nutrition Journey', pageWidth / 2, 250, { align: 'center' });
    
    // Add date
    pdf.setFontSize(14);
    pdf.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, pageWidth / 2, 300, { align: 'center' });
    
    // Add decorative icons
    this.addDecorativeIcons(pdf, pageWidth, pageHeight);
  }

  private addPageHeader(pdf: jsPDF, title: string, pageWidth: number): void {
    // Add subtle header bar
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, 0, pageWidth, 25, 'F');
    
    // Add title
    pdf.setTextColor(34, 197, 94);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, 25, 17);
    
    // Add page number - using a simple approach since jsPDF page counting can be complex
    pdf.setTextColor(156, 163, 175);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Page', pageWidth - 60, 17, { align: 'right' });
  }

  private addFooter(pdf: jsPDF, pageWidth: number, pageHeight: number): void {
    const footerY = pageHeight - 20;
    
    // Add footer line
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(1);
    pdf.line(25, footerY - 5, pageWidth - 25, footerY - 5);
    
    // Add footer text
    pdf.setTextColor(156, 163, 175);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Generated by NutriVibe - Your AI Nutrition Assistant', pageWidth / 2, footerY, { align: 'center' });
  }

  private addCornerDecorations(pdf: jsPDF, pageWidth: number, pageHeight: number): void {
    const cornerSize = 30;
    const lineWidth = 2;
    
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(lineWidth);
    
    // Top-left corner
    pdf.line(30, 30, 30 + cornerSize, 30);
    pdf.line(30, 30, 30, 30 + cornerSize);
    
    // Top-right corner
    pdf.line(pageWidth - 30, 30, pageWidth - 30 - cornerSize, 30);
    pdf.line(pageWidth - 30, 30, pageWidth - 30, 30 + cornerSize);
    
    // Bottom-left corner
    pdf.line(30, pageHeight - 30, 30 + cornerSize, pageHeight - 30);
    pdf.line(30, pageHeight - 30, 30, pageHeight - 30 - cornerSize);
    
    // Bottom-right corner
    pdf.line(pageWidth - 30, pageHeight - 30, pageWidth - 30 - cornerSize, pageHeight - 30);
    pdf.line(pageWidth - 30, pageHeight - 30, pageWidth - 30, pageHeight - 30 - cornerSize);
  }

  private addDecorativeIcons(pdf: jsPDF, pageWidth: number, pageHeight: number): void {
    // Add some decorative elements to make it more visually appealing
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;
    
    // Add circles with lighter colors to create a subtle effect
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(1);
    
    // Large circle with lighter fill
    pdf.setFillColor(255, 255, 255);
    pdf.circle(centerX, centerY + 50, 40, 'F');
    
    // Medium circles with lighter fill
    pdf.setFillColor(240, 240, 240);
    pdf.circle(centerX - 80, centerY + 20, 25, 'F');
    pdf.circle(centerX + 80, centerY + 20, 25, 'F');
    
    // Small circles with lighter fill
    pdf.setFillColor(230, 230, 230);
    pdf.circle(centerX - 120, centerY - 30, 15, 'F');
    pdf.circle(centerX + 120, centerY - 30, 15, 'F');
  }

  private createPDF(options: PDFExportOptions): jsPDF {
    let pdf: jsPDF;
    
    switch (options.format) {
      case 'A4':
        pdf = new jsPDF(options.pageOrientation, 'mm', 'a4');
        break;
      case 'Letter':
        pdf = new jsPDF(options.pageOrientation, 'mm', 'letter');
        break;
      case 'Mobile':
        pdf = new jsPDF(options.pageOrientation, 'mm', [210, 297]); // Custom mobile size
        break;
      default:
        pdf = new jsPDF(options.pageOrientation, 'mm', 'a4');
    }
    
    return pdf;
  }

  private async addCoverPage(
    pdf: jsPDF, 
    mealPlanData: MealPlanPDFData, 
    options: PDFExportOptions
  ): Promise<void> {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Add background color
    pdf.setFillColor(34, 197, 94); // Green background
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Add NutriVibe branding
    if (options.customBranding) {
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('NutriVibe', pageWidth / 2, 60, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.text('AI-Powered Meal Planning', pageWidth / 2, 80, { align: 'center' });
    }
    
    // Add meal plan title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.text(mealPlanData.title, pageWidth / 2, 120, { align: 'center' });
    
    // Add user info
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Created for: ${mealPlanData.user}`, pageWidth / 2, 150, { align: 'center' });
    pdf.text(`Generated on: ${mealPlanData.generatedDate}`, pageWidth / 2, 170, { align: 'center' });
    
    // Add nutritional summary
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Daily Target:', pageWidth / 2, 200, { align: 'center' });
    
    pdf.setFontSize(24);
    pdf.text(`${mealPlanData.nutritionalSummary.dailyCalories} calories`, pageWidth / 2, 220, { align: 'center' });
    
    // Add plan duration
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${mealPlanData.days.length} days`, pageWidth / 2, 250, { align: 'center' });
    
    // Add decorative elements
    this.addDecorativeElements(pdf, pageWidth, pageHeight);
  }

  private async addMealPlanContent(
    pdf: jsPDF, 
    mealPlanData: MealPlanPDFData, 
    options: PDFExportOptions
  ): Promise<void> {
    let currentY = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    mealPlanData.days.forEach((day, dayIndex) => {
      // Check if we need a new page
      if (currentY > 250) {
        pdf.addPage();
        currentY = 20;
      }
      
      // Add day header
      pdf.setTextColor(34, 197, 94);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(day.day, margin, currentY);
      currentY += 15;
      
      // Add day summary
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total Calories: ${day.totalCalories}`, margin, currentY);
      currentY += 20;
      
      // Add meals
      day.meals.forEach((meal, mealIndex) => {
        // Check if we need a new page
        if (currentY > 250) {
          pdf.addPage();
          currentY = 20;
        }
        
        // Meal type and name
        pdf.setTextColor(59, 130, 246);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}: ${meal.name}`, margin, currentY);
        currentY += 8;
        
        // Calories
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(10);
        pdf.text(`(${meal.calories} calories)`, margin + 5, currentY);
        currentY += 12;
        
        // Ingredients
        if (meal.ingredients.length > 0) {
          pdf.setTextColor(75, 85, 99);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Ingredients:', margin + 5, currentY);
          currentY += 8;
          
          meal.ingredients.forEach(ingredient => {
            pdf.setFont('helvetica', 'normal');
            pdf.text(`• ${ingredient}`, margin + 10, currentY);
            currentY += 6;
          });
          currentY += 8;
        }
        
        // Instructions
        if (meal.instructions.length > 0) {
          pdf.setTextColor(75, 85, 99);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Instructions:', margin + 5, currentY);
          currentY += 8;
          
          meal.instructions.forEach((instruction, index) => {
            pdf.setFont('helvetica', 'normal');
            pdf.text(`${index + 1}. ${instruction}`, margin + 10, currentY);
            currentY += 6;
          });
          currentY += 8;
        }
        
        // Meal details
        if (meal.prepTime || meal.cookingTime || meal.difficulty) {
          pdf.setTextColor(100, 100, 100);
          pdf.setFontSize(9);
          const details = [];
          if (meal.prepTime) details.push(`Prep: ${meal.prepTime}min`);
          if (meal.cookingTime) details.push(`Cook: ${meal.cookingTime}min`);
          if (meal.difficulty) details.push(`Difficulty: ${meal.difficulty}`);
          
          pdf.text(details.join(' | '), margin + 5, currentY);
          currentY += 8;
        }
        
        currentY += 10;
      });
      
      // Add separator between days
      if (dayIndex < mealPlanData.days.length - 1) {
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 20;
      }
    });
  }

  private async addShoppingList(
    pdf: jsPDF, 
    shoppingList: MealPlanPDFData['shoppingList'], 
    options: PDFExportOptions
  ): Promise<void> {
    pdf.addPage();
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let currentY = 20;
    
    // Header
    pdf.setTextColor(34, 197, 94);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Shopping List', pageWidth / 2, currentY, { align: 'center' });
    currentY += 25;
    
    // Categories
    shoppingList.categories.forEach((category, categoryIndex) => {
      // Check if we need a new page
      if (currentY > 250) {
        pdf.addPage();
        currentY = 20;
      }
      
      // Category header
      pdf.setTextColor(59, 130, 246);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(category.category, margin, currentY);
      currentY += 15;
      
      // Items
      category.items.forEach((item, itemIndex) => {
        pdf.setTextColor(75, 85, 99);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        
        // Checkbox
        pdf.setDrawColor(100, 100, 100);
        pdf.rect(margin, currentY - 3, 4, 4, 'S');
        
        // Item name and quantity
        pdf.text(`${item.name} (${item.quantity})`, margin + 10, currentY);
        
        if (item.notes) {
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`- ${item.notes}`, margin + 15, currentY + 5);
          currentY += 8;
        }
        
        currentY += 8;
      });
      
      currentY += 10;
    });
  }

  private async addNutritionalCharts(
    pdf: jsPDF, 
    nutritionalSummary: MealPlanPDFData['nutritionalSummary'], 
    options: PDFExportOptions
  ): Promise<void> {
    pdf.addPage();
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let currentY = 20;
    
    // Header
    pdf.setTextColor(34, 197, 94);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Nutritional Analysis', pageWidth / 2, currentY, { align: 'center' });
    currentY += 25;
    
    // Daily calories
    pdf.setTextColor(59, 130, 246);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Daily Calorie Target', margin, currentY);
    currentY += 15;
    
    pdf.setTextColor(75, 85, 99);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${nutritionalSummary.dailyCalories} calories`, margin, currentY);
    currentY += 30;
    
    // Macro breakdown
    pdf.setTextColor(59, 130, 246);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Macronutrient Breakdown', margin, currentY);
    currentY += 20;
    
    const macros = [
      { name: 'Protein', range: nutritionalSummary.proteinRange, color: [239, 68, 68] },
      { name: 'Carbohydrates', range: nutritionalSummary.carbRange, color: [34, 197, 94] },
      { name: 'Fat', range: nutritionalSummary.fatRange, color: [245, 158, 11] },
      { name: 'Fiber', range: nutritionalSummary.fiberRange, color: [139, 92, 246] }
    ];
    
    macros.forEach((macro, index) => {
      pdf.setTextColor(macro.color[0], macro.color[1], macro.color[2]);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(macro.name, margin, currentY);
      
      pdf.setTextColor(75, 85, 99);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(macro.range, margin + 80, currentY);
      
      currentY += 15;
    });
  }

  private async addMealPrepTips(
    pdf: jsPDF, 
    mealPrepTips: string[], 
    options: PDFExportOptions
  ): Promise<void> {
    if (mealPrepTips.length === 0) return;
    
    pdf.addPage();
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let currentY = 20;
    
    // Header
    pdf.setTextColor(34, 197, 94);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Meal Prep Tips', pageWidth / 2, currentY, { align: 'center' });
    currentY += 25;
    
    // Tips
    mealPrepTips.forEach((tip, index) => {
      // Check if we need a new page
      if (currentY > 250) {
        pdf.addPage();
        currentY = 20;
      }
      
      pdf.setTextColor(59, 130, 246);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Tip ${index + 1}:`, margin, currentY);
      currentY += 8;
      
      pdf.setTextColor(75, 85, 99);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(tip, margin + 5, currentY);
      currentY += 15;
    });
  }

  private async addCulturalNotes(
    pdf: jsPDF, 
    culturalNotes: string[], 
    options: PDFExportOptions
  ): Promise<void> {
    if (culturalNotes.length === 0) return;
    
    pdf.addPage();
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let currentY = 20;
    
    // Header
    pdf.setTextColor(34, 197, 94);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Cultural & Nutritional Notes', pageWidth / 2, currentY, { align: 'center' });
    currentY += 25;
    
    // Notes
    culturalNotes.forEach((note, index) => {
      // Check if we need a new page
      if (currentY > 250) {
        pdf.addPage();
        currentY = 20;
      }
      
      pdf.setTextColor(75, 85, 99);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`• ${note}`, margin, currentY);
      currentY += 15;
    });
  }

  private addDecorativeElements(pdf: jsPDF, pageWidth: number, pageHeight: number): void {
    // Add some decorative elements to make the cover page more attractive
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(2);
    
    // Top border
    pdf.line(20, 40, pageWidth - 20, 40);
    
    // Bottom border
    pdf.line(20, pageHeight - 40, pageWidth - 20, pageHeight - 40);
    
    // Corner decorations
    const cornerSize = 20;
    pdf.line(20, 20, 20 + cornerSize, 20);
    pdf.line(20, 20, 20, 20 + cornerSize);
    
    pdf.line(pageWidth - 20, 20, pageWidth - 20 - cornerSize, 20);
    pdf.line(pageWidth - 20, 20, pageWidth - 20, 20 + cornerSize);
    
    pdf.line(20, pageHeight - 20, 20 + cornerSize, pageHeight - 20);
    pdf.line(20, pageHeight - 20, 20, pageHeight - 20 - cornerSize);
    
    pdf.line(pageWidth - 20, pageHeight - 20, pageWidth - 20 - cornerSize, pageHeight - 20);
    pdf.line(pageWidth - 20, pageHeight - 20, pageWidth - 20, pageHeight - 20 - cornerSize);
  }

  // Utility method to download PDF
  downloadPDF(pdf: jsPDF, filename: string): void {
    pdf.save(filename);
  }

  // Utility method to open PDF in new tab
  openPDFInNewTab(pdf: jsPDF): void {
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  }
}

export const pdfExportService = new PDFExportService();
 