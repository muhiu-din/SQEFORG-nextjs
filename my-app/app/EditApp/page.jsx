"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Monitor, Gavel } from 'lucide-react';

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' && window.innerWidth > 768);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsDesktop(window.innerWidth > 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isDesktop;
};

export default function EditApp() {
  const isDesktop = useIsDesktop();

  if (!isDesktop) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10 bg-slate-50">
        <Monitor className="w-20 h-20 text-slate-400 mb-6" />
        <h1 className="text-2xl font-bold text-slate-800">Desktop View Recommended</h1>
        <p className="text-slate-600 mt-2">The 'Edit App' feature is designed for a larger screen. Please switch to a laptop or PC for the best experience.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Edit App Settings</h1>
          <p className="text-slate-600">Modify high-level application settings and branding.</p>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="p-6 border-b border-slate-100">
            <CardTitle>Branding</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label htmlFor="appName">App Name</Label>
              <Input id="appName" defaultValue="SQEForge" className="mt-2" disabled />
            </div>
            <div>
              <Label htmlFor="appSlogan">App Slogan</Label>
              <Input id="appSlogan" defaultValue="Forge Your Path To Success" className="mt-2" disabled />
            </div>
            <div>
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex items-center gap-3 mt-2">
                <Input id="accentColor" defaultValue="#FBBF24" className="w-32" disabled />
                <div className="w-10 h-10 rounded-md bg-amber-400 border border-slate-200" />
              </div>
            </div>
             <div>
              <Label htmlFor="logo">Logo</Label>
                <div className="flex items-center gap-4 mt-2">
                    <div className="w-12 h-12 bg-linear-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center p-2">
                         <Gavel className="w-6 h-6 text-amber-400" />
                    </div>
                     <Button variant="outline" disabled>Upload New Logo</Button>
                </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-8">
            <Button disabled className="h-12 px-8 text-lg">Save Changes</Button>
            <p className="text-sm text-slate-500 mt-3">Note: This is a placeholder page. Functionality to edit app settings can be implemented here.</p>
        </div>

      </div>
    </div>
  );
}