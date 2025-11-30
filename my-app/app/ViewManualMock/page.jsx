"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
//call api entities here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ViewManualMock() {
  const searchParams = useSearchParams();
  const [mock, setMock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMock = async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams(searchParams.toString());
      const mockId = params.get('id');

      if (!mockId) {
        setError("No mock exam ID provided.");
        setLoading(false);
        return;
      }

      try {
        const fetchedMock = await ManualMock.get(mockId);
        setMock(fetchedMock);
      } catch (err) {
        console.error("Failed to fetch manual mock:", err);
        setError("Could not load the requested mock exam. It may have been deleted.");
      }
      setLoading(false);
    };
    fetchMock();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-500" />
        <p className="mt-4 text-slate-600">Loading Exam...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-red-700">Error Loading Exam</h2>
        <p className="text-slate-600 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-10">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="border-b">
            <div className="flex justify-between items-start">
              <CardTitle className="text-2xl md:text-3xl">{mock.title}</CardTitle>
              <Badge variant="outline" className="text-lg">{mock.exam_type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-8">
            <div className="prose max-w-none whitespace-pre-wrap font-sans text-base">
              {mock.content}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}