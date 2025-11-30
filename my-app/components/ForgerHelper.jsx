import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ForgerHelper({ question }) {
  return (
    <div className="mt-4">
      <Alert className="bg-amber-50 border-amber-200">
        <Clock className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-900 font-semibold">Forger AI Tutor - Coming Soon!</AlertTitle>
        <AlertDescription className="text-amber-800">
          Our intelligent AI tutor "Forger" will soon be available to provide personalized explanations and help you understand complex legal concepts. Stay tuned!
        </AlertDescription>
      </Alert>
      <Button disabled variant="outline" className="w-full gap-2 mt-4">
        <Sparkles className="w-4 h-4 text-amber-500" />
        Ask Forger for a simpler explanation (Coming Soon)
      </Button>
    </div>
  );
}