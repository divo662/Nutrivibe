import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceCommandInputProps {
  onCommand: (command: string) => void;
  isListening?: boolean;
}

export default function VoiceCommandInput({ onCommand, isListening = false }: VoiceCommandInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  React.useEffect(() => {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onstart = () => {
        setIsRecording(true);
        toast.success('Listening... Speak now!');
      };
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        toast.success(`Heard: "${transcript}"`);
        
        // Process the command
        processVoiceCommand(transcript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        toast.error('Voice recognition error. Please try again.');
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      setIsSupported(false);
    }
  }, []);

  const processVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    // Simple command processing
    if (lowerCommand.includes('generate') || lowerCommand.includes('create') || lowerCommand.includes('make')) {
      if (lowerCommand.includes('meal plan') || lowerCommand.includes('meal')) {
        onCommand('generate_meal_plan');
        return;
      }
      if (lowerCommand.includes('recipe') || lowerCommand.includes('food')) {
        onCommand('generate_recipe');
        return;
      }
      if (lowerCommand.includes('shopping list') || lowerCommand.includes('grocery')) {
        onCommand('generate_shopping_list');
        return;
      }
    }
    
    if (lowerCommand.includes('weight loss') || lowerCommand.includes('lose weight')) {
      onCommand('set_goal_weight_loss');
      return;
    }
    
    if (lowerCommand.includes('muscle gain') || lowerCommand.includes('build muscle')) {
      onCommand('set_goal_muscle_gain');
      return;
    }
    
    if (lowerCommand.includes('maintenance') || lowerCommand.includes('maintain')) {
      onCommand('set_goal_maintenance');
      return;
    }
    
    if (lowerCommand.includes('vegetarian') || lowerCommand.includes('vegan')) {
      onCommand('set_diet_vegetarian');
      return;
    }
    
    if (lowerCommand.includes('nigerian') || lowerCommand.includes('local')) {
      onCommand('set_culture_nigerian');
      return;
    }
    
    // Default response
    toast.info(`Command received: "${command}". Processing...`);
    onCommand(command);
  };

  const startListening = () => {
    if (recognitionRef.current && !isRecording) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast.error('Failed to start voice recognition');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MicOff className="h-5 w-5 text-gray-400" />
            Voice Commands Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Your browser doesn't support voice recognition. Please use Chrome, Edge, or Safari for voice commands.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-4" />
          Voice Commands
          <Badge variant="secondary">Pro Feature</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <Button
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            onClick={isRecording ? stopListening : startListening}
            disabled={isListening}
            className="h-16 w-16 rounded-full"
          >
            {isRecording ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
          
          <p className="text-sm text-gray-600 mt-2">
            {isRecording ? 'Listening... Click to stop' : 'Click to start voice command'}
          </p>
        </div>

        {transcript && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-800">Last Command:</p>
            <p className="text-blue-600">"{transcript}"</p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Try saying:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-gray-50 rounded">
              "Generate a meal plan"
            </div>
            <div className="p-2 bg-gray-50 rounded">
              "Set goal to weight loss"
            </div>
            <div className="p-2 bg-gray-50 rounded">
              "Make it vegetarian"
            </div>
            <div className="p-2 bg-gray-50 rounded">
              "Add Nigerian cuisine"
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
