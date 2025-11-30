import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coffee } from 'lucide-react';

export default function BreakScreen({ onContinue }) {
    return (
        <div className="min-h-screen bg-slate-800 p-6 md:p-10 flex items-center justify-center">
            <Card className="max-w-lg w-full text-center p-10 border-none shadow-2xl bg-white">
                <Coffee className="w-20 h-20 text-slate-700 mx-auto mb-8" />
                <h1 className="text-3xl font-bold text-slate-900 mb-4">
                    Morning Session Complete
                </h1>
                <p className="text-lg text-slate-600 mb-8">
                    Take a break. Stretch your legs, have a drink, and clear your head before starting the afternoon session. Your progress is saved.
                </p>
                <Button onClick={onContinue} className="w-full h-14 text-xl bg-slate-900 hover:bg-slate-800">
                    Start Afternoon Session
                </Button>
            </Card>
        </div>
    );
}