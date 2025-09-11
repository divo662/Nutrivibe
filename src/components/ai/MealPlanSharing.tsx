import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Share2, 
  Users, 
  Calendar, 
  Link, 
  Copy, 
  Mail, 
  MessageSquare,
  Facebook,
  Twitter
} from 'lucide-react';
import { toast } from 'sonner';

interface MealPlanSharingProps {
  mealPlanId: string;
  mealPlanTitle: string;
  mealPlanData: any;
}

export default function MealPlanSharing({ 
  mealPlanId, 
  mealPlanTitle, 
  mealPlanData 
}: MealPlanSharingProps) {
  const [shareEmail, setShareEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const generateShareLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/meal-plan/${mealPlanId}`;
  };

  const copyShareLink = async () => {
    try {
      const shareLink = generateShareLink();
      await navigator.clipboard.writeText(shareLink);
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const shareViaEmail = async () => {
    if (!shareEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsSharing(true);
    try {
      const shareLink = generateShareLink();
      const subject = `Check out my meal plan: ${mealPlanTitle}`;
      const body = `${shareMessage}\n\nView my meal plan: ${shareLink}`;
      
      const mailtoLink = `mailto:${shareEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);
      
      toast.success('Email client opened!');
      setShareEmail('');
      setShareMessage('');
    } catch (error) {
      toast.error('Failed to open email client');
    } finally {
      setIsSharing(false);
    }
  };

  const exportToCalendar = () => {
    try {
      // Create calendar event data
      const event = {
        title: `Meal Plan: ${mealPlanTitle}`,
        description: `View my meal plan: ${generateShareLink()}`,
        start: new Date().toISOString(),
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        location: 'NutriVibe App'
      };

      // Generate calendar file content
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//NutriVibe//Meal Plan//EN',
        'BEGIN:VEVENT',
        `DTSTART:${event.start.replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTEND:${event.end.replace(/[-:]/g, '').split('.')[0]}Z`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description}`,
        `LOCATION:${event.location}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      // Create and download file
      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${mealPlanTitle.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Calendar file downloaded!');
    } catch (error) {
      toast.error('Failed to export calendar');
    }
  };

  const shareToSocialMedia = (platform: string) => {
    const shareLink = generateShareLink();
    const text = `Check out my meal plan: ${mealPlanTitle}`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`;
        break;
      case 'copy':
        copyShareLink();
        return;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share Meal Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Share Link */}
        <div className="space-y-3">
          <Label>Share Link</Label>
          <div className="flex gap-2">
            <Input 
              value={generateShareLink()} 
              readOnly 
              className="flex-1"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyShareLink}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            Anyone with this link can view your meal plan
          </p>
        </div>

        {/* Email Sharing */}
        <div className="space-y-3">
          <Label>Share via Email</Label>
          <Input
            type="email"
            placeholder="Enter email address"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
          />
          <Input
            placeholder="Add a personal message (optional)"
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
          />
          <Button 
            onClick={shareViaEmail}
            disabled={isSharing || !shareEmail.trim()}
            className="w-full gap-2"
          >
            <Mail className="h-4 w-4" />
            {isSharing ? 'Opening Email...' : 'Share via Email'}
          </Button>
        </div>

        {/* Calendar Export */}
        <div className="space-y-3">
          <Label>Export to Calendar</Label>
          <Button 
            variant="outline" 
            onClick={exportToCalendar}
            className="w-full gap-2"
          >
            <Calendar className="h-4 w-4" />
            Download Calendar File (.ics)
          </Button>
          <p className="text-sm text-gray-500">
            Import this file into Google Calendar, Outlook, or any calendar app
          </p>
        </div>

        {/* Social Media Sharing */}
        <div className="space-y-3">
          <Label>Share on Social Media</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              onClick={() => shareToSocialMedia('facebook')}
              className="gap-2"
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </Button>
            <Button 
              variant="outline" 
              onClick={() => shareToSocialMedia('twitter')}
              className="gap-2"
            >
              <Twitter className="h-4 w-4" />
              Twitter
            </Button>
                         <Button 
               variant="outline" 
               onClick={() => shareToSocialMedia('copy')}
               className="gap-2"
             >
               <Copy className="h-4 w-4" />
               Copy Link
             </Button>
            
          </div>
        </div>

        {/* Family Sharing */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <Label>Family Sharing</Label>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
          <p className="text-sm text-gray-500">
            Share meal plans with family members and collaborate on meal planning
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
