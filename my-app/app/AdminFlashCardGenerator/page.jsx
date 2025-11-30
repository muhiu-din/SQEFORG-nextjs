"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Layers, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AICreditsBadge from '@/components/AICreditsBadge';

const ALL_SUBJECTS = [
  "Business Law & Practice", "Contract Law", "Tort Law", "Dispute Resolution", "Property Practice", "Land Law",
  "Wills & Administration of Estates", "Trusts", "Criminal Law", "Criminal Practice", "Solicitors Accounts",
  "Constitutional & Administrative Law", "EU Law", "The Legal System of England & Wales", "Legal Services", "Ethics & Professional Conduct"
];

export default function AdminFlashCardGenerator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [subject, setSubject] = useState('');
  const [numCards, setNumCards] = useState(50);
  const [bulkTier, setBulkTier] = useState('starter');
  
  const TIER_CONFIG = {
    starter: { cardsPerSubject: 31, label: "Starter Tier", total: 496 },
    pro: { cardsPerSubject: 93, label: "Pro Tier", total: 1488 },
    ultimate: { cardsPerSubject: 94, label: "Ultimate Tier", total: 1504 }
  };
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState(null);
  const [existingCounts, setExistingCounts] = useState({});

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser.role === 'admin') {
          await loadExistingCounts();
        }
      } catch (e) {
        setUser(null);
      }
      setLoading(false);
    };
    init();
  }, []);

  const loadExistingCounts = async () => {
    try {
      const counts = {};
      for (const subject of ALL_SUBJECTS) {
        const cards = await base44.entities.FlashCard.filter({ subject }, null, 1);
        counts[subject] = cards.length;
      }
      setExistingCounts(counts);
    } catch (e) {
      console.error('Failed to load counts:', e);
    }
  };

  const handleGenerate = async () => {
    if (bulkMode) {
      return handleBulkGenerate();
    }
    
    if (!subject || numCards <= 0) return;

    setGenerating(true);
    setProgress(0);
    setProgressMsg('Preparing AI generation...');
    setResult(null);

    try {
      const BATCH_SIZE = 10;
      const numBatches = Math.ceil(numCards / BATCH_SIZE);
      let totalGenerated = 0;

      for (let batch = 0; batch < numBatches; batch++) {
        const cardsInBatch = Math.min(BATCH_SIZE, numCards - totalGenerated);
        
        setProgressMsg(`Generating batch ${batch + 1}/${numBatches} (${cardsInBatch} cards)...`);

        const prompt = `You are an expert SQE1/SQE2 exam tutor. Generate ${cardsInBatch} high-quality flash cards for the subject: "${subject}".

Requirements:
- Focus on key definitions, principles, case law, and statutes
- Front of card: Clear, concise question or concept
- Back of card: Detailed answer with explanations
- Cover different difficulty levels
- Include relevant cases and statutory references where applicable
- Make them practical and exam-focused

Return a JSON array of ${cardsInBatch} flashcards in this format:
{
  "flashcards": [
    {
      "front": "What is...",
      "back": "Detailed explanation...",
      "difficulty": "easy|medium|hard"
    }
  ]
}`;

        const response = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              flashcards: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    front: { type: "string" },
                    back: { type: "string" },
                    difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
                  },
                  required: ["front", "back"]
                }
              }
            },
            required: ["flashcards"]
          }
        });

        if (response.flashcards && response.flashcards.length > 0) {
          const cardsToCreate = response.flashcards.map(card => ({
            subject: subject,
            front: card.front,
            back: card.back,
            difficulty: card.difficulty || 'medium'
          }));

          await base44.entities.FlashCard.bulkCreate(cardsToCreate);
          totalGenerated += cardsToCreate.length;
        }

        setProgress(((batch + 1) / numBatches) * 100);
        
        if (batch < numBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      setResult({
        success: true,
        generated: totalGenerated,
        subject: subject
      });
      
      await loadExistingCounts();

    } catch (error) {
      console.error('Generation failed:', error);
      setResult({
        success: false,
        error: error.message
      });
    }

    setGenerating(false);
    setProgressMsg('');
  };

  const handleBulkGenerate = async () => {
    setGenerating(true);
    setProgress(0);
    setProgressMsg('Starting bulk generation...');
    setResult(null);

    const cardsPerSubject = TIER_CONFIG[bulkTier].cardsPerSubject;
    let totalGenerated = 0;
    const totalTarget = ALL_SUBJECTS.length * cardsPerSubject;

    try {
      for (const subj of ALL_SUBJECTS) {
        setProgressMsg(`Generating ${cardsPerSubject} cards for ${subj}...`);
        
        const BATCH_SIZE = 10;
        const numBatches = Math.ceil(cardsPerSubject / BATCH_SIZE);

        for (let batch = 0; batch < numBatches; batch++) {
          const cardsInBatch = Math.min(BATCH_SIZE, cardsPerSubject - (batch * BATCH_SIZE));
          
          const prompt = `You are an expert SQE1/SQE2 exam tutor. Generate ${cardsInBatch} high-quality flash cards for the subject: "${subj}".

Requirements:
- Focus on key definitions, principles, case law, and statutes
- Front of card: Clear, concise question or concept
- Back of card: Detailed answer with explanations
- Cover different difficulty levels
- Include relevant cases and statutory references where applicable
- Make them practical and exam-focused

Return a JSON array of ${cardsInBatch} flashcards in this format:
{
  "flashcards": [
    {
      "front": "What is...",
      "back": "Detailed explanation...",
      "difficulty": "easy|medium|hard"
    }
  ]
}`;

          const response = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
              type: "object",
              properties: {
                flashcards: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      front: { type: "string" },
                      back: { type: "string" },
                      difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
                    },
                    required: ["front", "back"]
                  }
                }
              },
              required: ["flashcards"]
            }
          });

          if (response.flashcards && response.flashcards.length > 0) {
            const cardsToCreate = response.flashcards.map(card => ({
              subject: subj,
              front: card.front,
              back: card.back,
              difficulty: card.difficulty || 'medium'
            }));

            await base44.entities.FlashCard.bulkCreate(cardsToCreate);
            totalGenerated += cardsToCreate.length;
          }

          setProgress((totalGenerated / totalTarget) * 100);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      setResult({
        success: true,
        generated: totalGenerated,
        subject: 'All Subjects'
      });
      
      await loadExistingCounts();

    } catch (error) {
      console.error('Bulk generation failed:', error);
      setResult({
        success: false,
        error: error.message
      });
    }

    setGenerating(false);
    setProgressMsg('');
  };

  if (loading) {
    return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 p-10 flex items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Admin Access Required</h1>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Flash Card Generator</h1>
          <p className="text-slate-600 text-lg mb-4">Generate high-quality flash cards using AI - separate from MCQ questions</p>
          <AICreditsBadge className="text-lg px-6 py-3" />
        </div>

        <Alert className="mb-8 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Equal Distribution Per Subject:</strong> All flashcards are generated equally across all 16 subjects.
            <br/>• Starter: 31 cards per subject = 496 total
            <br/>• Pro: 93 cards per subject = 1,488 total
            <br/>• Ultimate: 94 cards per subject = 1,504 total
          </AlertDescription>
        </Alert>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Flash Card Library</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {ALL_SUBJECTS.map(subj => (
                <div key={subj} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-700">{subj}</span>
                  <Badge variant={existingCounts[subj] > 0 ? "default" : "outline"}>
                    {existingCounts[subj] || 0} cards
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              Generate New Flash Cards
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <Label className="mb-2 block">Subject</Label>
                <Select value={subject} onValueChange={setSubject} disabled={generating}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Choose a subject..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-96">
                    {ALL_SUBJECTS.map(s => (
                      <SelectItem key={s} value={s}>
                        {s} ({existingCounts[s] || 0} existing)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Generation Mode</Label>
                <Select value={bulkMode ? 'bulk' : 'single'} onValueChange={(v) => setBulkMode(v === 'bulk')} disabled={generating}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Subject (Custom Amount)</SelectItem>
                    <SelectItem value="bulk">Bulk All Subjects (Tier-Based)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {bulkMode ? (
                <div>
                  <Label className="mb-2 block">Subscription Tier</Label>
                  <Select value={bulkTier} onValueChange={setBulkTier} disabled={generating}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">
                        Starter - 31 cards per subject (496 total)
                      </SelectItem>
                      <SelectItem value="pro">
                        Pro - 93 cards per subject (1,488 total)
                      </SelectItem>
                      <SelectItem value="ultimate">
                        Ultimate - 94 cards per subject (1,504 total)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Alert className="mt-3 bg-blue-50 border-blue-200">
                    <AlertDescription className="text-sm text-blue-900">
                      <strong>{TIER_CONFIG[bulkTier].label}:</strong> {TIER_CONFIG[bulkTier].cardsPerSubject} cards × 16 subjects = {TIER_CONFIG[bulkTier].total} flashcards
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div>
                  <Label className="mb-2 block">Number of Cards to Generate</Label>
                  <Input
                    type="number"
                    value={numCards}
                    onChange={e => setNumCards(parseInt(e.target.value) || 50)}
                    min="10"
                    max="200"
                    disabled={generating}
                    className="h-12"
                  />
                </div>
              )}

              {generating && (
                <div className="space-y-3">
                  <Progress value={progress} className="h-3" />
                  <p className="text-sm text-center text-slate-600">{progressMsg}</p>
                </div>
              )}

              {result && (
                <Alert className={result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                  {result.success ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                  <AlertTitle className={result.success ? 'text-green-900' : 'text-red-900'}>
                    {result.success ? 'Generation Complete!' : 'Generation Failed'}
                  </AlertTitle>
                  <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                    {result.success 
                      ? `Successfully generated ${result.generated} flash cards for ${result.subject}`
                      : `Error: ${result.error}`
                    }
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleGenerate}
                disabled={(bulkMode ? false : (!subject || numCards <= 0)) || generating}
                className="w-full h-14 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Flash Cards...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    {bulkMode 
                      ? `Generate ${TIER_CONFIG[bulkTier].total} Flash Cards (All Subjects)` 
                      : `Generate ${numCards} Flash Cards`}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}