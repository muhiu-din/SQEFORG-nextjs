"use client";
import React, { useState, useEffect } from 'react';
import { User, Question } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lock, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const KEYWORD_RULES = {
  "Contract Law": ["contract", "offer", "acceptance", "consideration", "breach", "misrepresentation", "frustrated", "frustration", "privity"],
  "Tort Law": ["tort", "negligence", "duty of care", "breach of duty", "causation", "nuisance", "trespass", "defamation", "vicarious liability"],
  "Criminal Law": ["theft", "robbery", "burglary", "assault", "battery", "murder", "manslaughter", "actus reus", "mens rea", "intention", "recklessness"],
  "Land Law": ["easement", "covenant", "freehold", "leasehold", "mortgage", "adverse possession", "proprietary estoppel", "land registration"],
  "Property Practice": ["residential", "commercial property", "completion", "exchange of contracts", "cpse", "stamp duty land tax"],
  "Trusts": ["trust", "trustee", "beneficiary", "settlor", "certainty", "charitable trust", "express trust", "constructive trust", "resulting trust"],
  "Wills & Administration of Estates": ["will", "intestacy", "executor", "administrator", "probate", "testator", "codicil", "ademption"],
  "Business Law & Practice": ["company", "director", "shareholder", "articles of association", "share capital", "dividend", "corporate", "partnership", "sole trader"],
  "Dispute Resolution": ["cpr", "civil procedure", "claim form", "defence", "counterclaim", "disclosure", "witness statement", "trial", "settlement", "mediation", "arbitration"],
  "Solicitors Accounts": ["client account", "office account", "residual balance", "ledger", "sra accounts rules", "double entry"],
  "Criminal Practice": ["bail", "plea", "sentencing", "magistrates", "crown court", "prosecution", "defence", "criminal procedure"],
  "Constitutional & Administrative Law": ["parliament", "judicial review", "ultra vires", "human rights", "constitutional", "prerogative", "separation of powers"],
  "EU Law": ["european union", "treaty", "directive", "regulation", "ecj", "supremacy", "direct effect"],
  "The Legal System of England & Wales": ["jurisdiction", "court system", "supreme court", "court of appeal", "hierarchy"],
  "Legal Services": ["legal profession", "solicitor", "barrister", "regulation", "sra", "bsb"],
  "Ethics & Professional Conduct": ["professional conduct", "ethics", "conflict of interest", "confidentiality", "client care", "sra principles", "undertaking"]
};

export default function KeywordCategorizer() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState(null);
  const [log, setLog] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setUser(await User.me());
      } catch (e) {
        setUser(null);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const categorizeByKeywords = (questionText) => {
    const text = questionText.toLowerCase();
    const scores = {};

    for (const [subject, keywords] of Object.entries(KEYWORD_RULES)) {
      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          score++;
        }
      }
      if (score > 0) {
        scores[subject] = score;
      }
    }

    if (Object.keys(scores).length === 0) return null;

    const bestMatch = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    return bestMatch[1] >= 2 ? bestMatch[0] : null; // Need at least 2 keyword matches
  };

  const handleAutoCategorize = async () => {
    setProcessing(true);
    setProgress(0);
    setLog([]);
    setStats(null);

    try {
      const allQuestions = await Question.list();
      setLog(prev => [...prev, `📊 Loaded ${allQuestions.length.toLocaleString()} questions`]);

      let categorized = 0;
      let skipped = 0;

      for (let i = 0; i < allQuestions.length; i++) {
        const question = allQuestions[i];
        const suggestedSubject = categorizeByKeywords(question.question_text);

        if (suggestedSubject && suggestedSubject !== question.subject) {
          try {
            await Question.update(question.id, { subject: suggestedSubject });
            categorized++;
            
            if (categorized <= 20) {
              setLog(prev => [...prev, `✓ Moved: "${question.subject}" → "${suggestedSubject}"`]);
            }
          } catch (error) {
            console.error(`Failed to update question ${question.id}:`, error);
          }
        } else {
          skipped++;
        }

        setProgress(Math.round(((i + 1) / allQuestions.length) * 100));

        // Rate limit protection
        if (i % 50 === 0 && i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setStats({ total: allQuestions.length, categorized, skipped });
      setLog(prev => [...prev, `\n✅ COMPLETE!`, `Re-categorized: ${categorized}`, `Skipped: ${skipped}`]);

    } catch (error) {
      console.error("Auto-categorization failed:", error);
      setLog(prev => [...prev, `❌ Error: ${error.message}`]);
    }

    setProcessing(false);
  };

  if (loading) {
    return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 p-10 flex items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-slate-600 mt-2">This page is for administrators only.</p>
          <Link to={createPageUrl("Dashboard")}><Button variant="outline" className="mt-6">Return to Dashboard</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Keyword Auto-Categorizer</h1>
          <p className="text-slate-600 text-lg">Automatically re-categorize all questions using keyword matching (no AI needed)</p>
        </div>

        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-700" />
          <AlertTitle className="text-blue-800">How It Works</AlertTitle>
          <AlertDescription className="text-blue-700 space-y-1">
            <p>✓ Analyzes each question for subject-specific keywords</p>
            <p>✓ Moves questions to subjects with highest keyword match</p>
            <p>✓ Requires at least 2 keyword matches for safety</p>
            <p>✓ Skips questions without clear keyword matches</p>
            <p>✓ No AI credits needed - pure keyword matching</p>
          </AlertDescription>
        </Alert>

        <Card className="border-2 border-green-500 shadow-xl">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-2xl">Auto-Categorize All Questions</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {!processing && !stats && (
              <Button 
                onClick={handleAutoCategorize} 
                className="w-full h-16 text-xl bg-green-600 hover:bg-green-700"
              >
                <Zap className="w-6 h-6 mr-3" />
                Start Auto-Categorization
              </Button>
            )}

            {processing && (
              <div className="space-y-4">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-green-600" />
                  <p className="text-lg font-semibold mb-2">Processing questions...</p>
                  <Progress value={progress} className="h-4" />
                  <p className="text-sm text-slate-600 mt-2">{progress}% complete</p>
                </div>
              </div>
            )}

            {stats && (
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
                <h3 className="text-2xl font-bold text-green-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6" />
                  Auto-Categorization Complete!
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg text-center">
                    <p className="text-sm text-slate-600">Total</p>
                    <p className="text-3xl font-bold">{stats.total.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center">
                    <p className="text-sm text-slate-600">Re-categorized</p>
                    <p className="text-3xl font-bold text-green-600">{stats.categorized.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center">
                    <p className="text-sm text-slate-600">Skipped</p>
                    <p className="text-3xl font-bold text-slate-600">{stats.skipped.toLocaleString()}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    setStats(null);
                    setLog([]);
                    setProgress(0);
                  }}
                  variant="outline"
                  className="w-full mt-4"
                >
                  Reset
                </Button>
              </div>
            )}

            {log.length > 0 && (
              <div className="mt-6 p-4 bg-slate-50 rounded-lg border max-h-96 overflow-y-auto">
                <h4 className="font-bold mb-2">Processing Log:</h4>
                <div className="space-y-1 text-sm font-mono">
                  {log.map((entry, i) => (
                    <p key={i} className={entry.startsWith('✓') ? 'text-green-700' : entry.startsWith('❌') ? 'text-red-700' : 'text-slate-700'}>
                      {entry}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}