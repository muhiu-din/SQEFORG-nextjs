"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Zap, CheckCircle, AlertCircle, Database, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ALL_SUBJECTS = [
  "Business Law & Practice", "Contract Law", "Tort Law", "Dispute Resolution",
  "Constitutional & Administrative Law", "EU Law", "The Legal System of England & Wales", 
  "Legal Services", "Ethics & Professional Conduct", "Property Practice", "Land Law",
  "Wills & Administration of Estates", "Trusts", "Criminal Law", "Criminal Practice", 
  "Solicitors Accounts"
];

const ULTRA_HARD_PROMPT = `You are an expert SQE1 exam question writer creating ORIGINAL, UNIQUE questions that test BLACK LETTER LAW principles.

Generate EXACTLY {batchSize} {difficulty} difficulty SQE1 questions for: {subject}

ABSOLUTE REQUIREMENTS - ANTI-PLAGIARISM:
- Create 100% ORIGINAL scenarios - DO NOT copy from published materials
- Use UNIQUE fact patterns never seen before
- Reference real cases/statutes but create NEW application scenarios
- Vary names, dates, amounts, locations in every question
- Each question must test law from a DIFFERENT angle
- DO NOT repeat common textbook examples

DIFFICULTY REQUIREMENTS FOR {difficulty}:

{difficultyInstructions}

BLACK LETTER LAW FOCUS:
- Test pure legal rules, principles, and doctrines
- Clear application of statute/case law to facts
- Focus on WHAT the law says, not policy/ethics
- Include precise legal tests, elements, requirements
- Reference specific sections/cases in explanations

ALL QUESTIONS MUST:
- 3-5 paragraph detailed scenario with specific facts, dates, amounts, names
- Test application of law to complex facts (not just recall)
- Include realistic professional situations
- Options must be sophisticated - all plausible
- Test nuanced understanding and exceptions
- Detailed explanations with case/statutory citations
- Official SQE1 "single best answer" format

UNIQUENESS CHECK:
- Vary scenario context (different professions, situations, contexts)
- Use diverse fact patterns (commercial, residential, personal, professional)
- Test different sub-topics within the subject
- Create questions that complement (not duplicate) existing questions

Return ONLY valid JSON:
{
  "questions": [
    {
      "question_text": "Full detailed scenario ending with question",
      "option_a": "First option",
      "option_b": "Second option", 
      "option_c": "Third option",
      "option_d": "Fourth option",
      "option_e": "Fifth option",
      "correct_answer": "A/B/C/D/E",
      "explanation": "Detailed explanation with case citations and statutory references",
      "angoff_score": 0.X
    }
  ]
}`;

const DIFFICULTY_INSTRUCTIONS = {
  easy: `EASY (Angoff 0.75-0.85) - 500 questions per subject:
- Test core principles and fundamental rules
- Straightforward application of well-known law
- Facts clearly point to one answer
- Common scenarios (basic contract formation, simple negligence, standard wills)
- Fundamental concepts students learn first
- Limited complicating factors
- Test foundational black letter law`,

  medium: `MEDIUM (Angoff 0.50-0.65) - 1500 questions per subject:
- Test standard rules with moderate complexity
- 2-3 legal issues integrated
- Require careful analysis of facts
- Test common exceptions or qualifications
- Realistic professional scenarios
- Options require discrimination
- Intermediate black letter law application
- Test interactions between rules`,

  hard: `EXTREMELY HARD/ADVANCED (Angoff 0.30-0.50) - 1500 questions per subject:
- Test edge cases, exceptions to exceptions, rare scenarios
- Combine 3+ complex legal issues simultaneously
- Deep understanding of rule interactions required
- Controversial/uncertain areas of law
- Conflicting authorities or recent developments
- Multi-step legal reasoning required
- All 5 options highly plausible
- Test limits and boundaries of legal principles
- Complex professional scenarios with multiple complications
- Obscure cases or statutory provisions
- Advanced black letter law at highest SQE1 difficulty`
};

// Simple hash function for duplicate detection
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

export default function MassQuestionGenerator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [targetCount, setTargetCount] = useState(500);
  const [progress, setProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [duplicatesSkipped, setDuplicatesSkipped] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [result, setResult] = useState(null);
  const [existingCounts, setExistingCounts] = useState({});
  const [existingHashes, setExistingHashes] = useState(new Set());
  const [aiCredits, setAiCredits] = useState({ available: 10000, used: 0 });

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await{name: "Admin User", email: "admin@example.com", role: "admin"}; // Mock admin user
        setUser(currentUser);
        if (currentUser.role === 'admin') {
          await loadExistingCounts();
          
          // Load AI credits
          const logs = await base44.entities.AICreditLog.list();
          const totalUsed = logs.reduce((sum, log) => {
            const credits = log.credits_added || 0;
            return credits < 0 ? sum + Math.abs(credits) : sum;
          }, 0);
          setAiCredits({ available: 10000, used: totalUsed });
        }
      } catch (e) {
        setUser(null);
      }
      setLoading(false);
    };
    init();
  }, []);

  const loadExistingCounts = async () => {
    const counts = {};
    const hashes = new Set();
    
    for (const subj of ALL_SUBJECTS) {
      for (const diff of ['easy', 'medium', 'hard']) {
        try {
          const qs = await base44.entities.BlackLetterQuestion.filter({ subject: subj, difficulty: diff });
          if (!counts[subj]) counts[subj] = {};
          counts[subj][diff] = qs.length;
          
          // Collect hashes for duplicate detection
          qs.forEach(q => {
            if (q.question_hash) {
              hashes.add(q.question_hash);
            }
          });
        } catch (e) {
          if (!counts[subj]) counts[subj] = {};
          counts[subj][diff] = 0;
        }
      }
    }
    
    setExistingCounts(counts);
    setExistingHashes(hashes);
  };

  const generateBatch = async () => {
    if (!subject || !difficulty || targetCount <= 0) return;

    setGenerating(true);
    setProgress(0);
    setGeneratedCount(0);
    setDuplicatesSkipped(0);
    setResult(null);
    
    const BATCH_SIZE = 10;
    const batches = Math.ceil(targetCount / BATCH_SIZE);
    setTotalBatches(batches);

    let totalGenerated = 0;
    let totalSkipped = 0;
    let successfulBatches = 0;
    let failedBatches = 0;
    const batchId = `${subject}_${difficulty}_${Date.now()}`;

    for (let i = 0; i < batches; i++) {
      setCurrentBatch(i + 1);
      const questionsInBatch = Math.min(BATCH_SIZE, targetCount - totalGenerated);
      
      setStatusMsg(`Generating batch ${i + 1}/${batches} - ${questionsInBatch} ${difficulty} questions for ${subject}...`);

      try {
        const prompt = ULTRA_HARD_PROMPT
          .replace(/{batchSize}/g, questionsInBatch)
          .replace(/{difficulty}/g, difficulty.toUpperCase())
          .replace(/{subject}/g, subject)
          .replace(/{difficultyInstructions}/g, DIFFICULTY_INSTRUCTIONS[difficulty]);

        const response = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question_text: { type: "string" },
                    option_a: { type: "string" },
                    option_b: { type: "string" },
                    option_c: { type: "string" },
                    option_d: { type: "string" },
                    option_e: { type: "string" },
                    correct_answer: { type: "string", enum: ["A", "B", "C", "D", "E"] },
                    explanation: { type: "string" },
                    angoff_score: { type: "number" }
                  },
                  required: ["question_text", "option_a", "option_b", "option_c", "option_d", "option_e", "correct_answer", "explanation"]
                }
              }
            },
            required: ["questions"]
          }
        });

        if (response?.questions && Array.isArray(response.questions)) {
          const validQuestions = response.questions.filter(q => 
            q && typeof q === 'object' && q.question_text && q.correct_answer
          );

          if (validQuestions.length > 0) {
            const questionsToCreate = [];
            
            for (const q of validQuestions) {
              // Generate hash for duplicate detection
              const questionHash = hashString(q.question_text.toLowerCase().trim());
              
              // Skip if duplicate
              if (existingHashes.has(questionHash)) {
                totalSkipped++;
                setDuplicatesSkipped(totalSkipped);
                continue;
              }
              
              // Add to creation list
              questionsToCreate.push({
                subject: subject,
                difficulty: difficulty,
                question_text: q.question_text,
                option_a: q.option_a,
                option_b: q.option_b,
                option_c: q.option_c,
                option_d: q.option_d,
                option_e: q.option_e,
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                angoff_score: q.angoff_score || (difficulty === 'easy' ? 0.8 : difficulty === 'medium' ? 0.55 : 0.4),
                question_hash: questionHash,
                generation_batch: batchId
              });
              
              // Add to hash set
              existingHashes.add(questionHash);
            }

            if (questionsToCreate.length > 0) {
              await base44.entities.BlackLetterQuestion.bulkCreate(questionsToCreate);
              totalGenerated += questionsToCreate.length;
              setGeneratedCount(totalGenerated);
              successfulBatches++;
            }
          }
        }

        setProgress(Math.round(((i + 1) / batches) * 100));
        
        // Delay between batches
        if (i < batches - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(`Batch ${i + 1} failed:`, error);
        failedBatches++;
      }
    }

    setResult({
      success: totalGenerated > 0,
      generated: totalGenerated,
      skipped: totalSkipped,
      successfulBatches,
      failedBatches,
      subject,
      difficulty
    });

    setStatusMsg(totalGenerated > 0 
      ? `Complete! Generated ${totalGenerated} questions, skipped ${totalSkipped} duplicates (${successfulBatches} successful batches, ${failedBatches} failed)`
      : 'Generation failed - no questions created'
    );
    
    setGenerating(false);
    await loadExistingCounts();
  };

  if (loading) {
    return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 p-10 flex items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Admin Access Required</h1>
        </Card>
      </div>
    );
  }

  const totalTarget = 500 + 1500 + 1500; // 3500 per subject
  const estimatedAICalls = Math.ceil(totalTarget / 10); // 350 calls per subject
  const totalSubjects = 16;
  const totalAICalls = estimatedAICalls * totalSubjects; // 5600 total

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Black Letter Law Question Generator</h1>
          <p className="text-slate-600 text-lg">Generate EQUAL amounts per subject (500 easy, 1500 medium, 1500 hard)</p>
          <p className="text-xs text-slate-500 mt-2">⚖️ FAIR DISTRIBUTION: Every subject gets exactly the same number of questions</p>
        </div>

        {/* AI Credits Display */}
        <Card className="mb-8 border-2 border-blue-200 bg-linear-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">AI Credits Status</h3>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-sm text-slate-600">Available</p>
                    <p className="text-3xl font-bold text-green-900">{(aiCredits.available - aiCredits.used).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Used</p>
                    <p className="text-3xl font-bold text-slate-900">{aiCredits.used.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total Budget</p>
                    <p className="text-3xl font-bold text-blue-900">{aiCredits.available.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-6xl font-bold text-blue-900">
                  {Math.round(((aiCredits.available - aiCredits.used) / aiCredits.available) * 100)}%
                </div>
                <p className="text-sm text-slate-600 mt-1">Remaining</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Credits Warning */}
        <Alert className="mb-8 border-amber-300 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900 font-bold">AI Credits Required per Batch</AlertTitle>
          <AlertDescription className="text-amber-800">
            <p className="mb-2"><strong>Cost estimates for this tool:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Per subject full build: ~350 credits (3,500 questions ÷ 10 per call)</li>
              <li>Selected batch: ~{Math.ceil(targetCount / 10)} credits ({targetCount} questions ÷ 10 per call)</li>
              <li>All 16 subjects complete: ~5,600 credits total</li>
            </ul>
            <p className="mt-3 font-semibold">✅ Duplicate detection enabled - repeated questions are skipped automatically.</p>
          </AlertDescription>
        </Alert>

        {/* Current Library Status */}
        <Card className="mb-8 border-none shadow-lg">
          <CardHeader>
            <CardTitle>Current Black Letter Law Question Library</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ALL_SUBJECTS.map(subj => {
                const easy = existingCounts[subj]?.easy || 0;
                const medium = existingCounts[subj]?.medium || 0;
                const hard = existingCounts[subj]?.hard || 0;
                const total = easy + medium + hard;
                const percentComplete = (total / 3500 * 100).toFixed(1);
                
                return (
                  <div key={subj} className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-slate-900 mb-2">{subj}</h4>
                    <div className="flex gap-2 mb-2">
                      <Badge className="bg-green-600">E: {easy}/500</Badge>
                      <Badge className="bg-amber-600">M: {medium}/1500</Badge>
                      <Badge className="bg-red-600">H: {hard}/1500</Badge>
                    </div>
                    <Progress value={parseFloat(percentComplete)} className="h-2 mb-1" />
                    <p className="text-xs text-slate-500">
                      {total}/3500 ({percentComplete}% complete)
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Generation Controls */}
        <Card className="border-none shadow-xl mb-8">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-purple-600" />
              Generate Question Batch
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Subject</label>
                <Select value={subject} onValueChange={setSubject} disabled={generating}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select subject..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-96">
                    {ALL_SUBJECTS.map(s => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Difficulty</label>
                <Select value={difficulty} onValueChange={(val) => {
                  setDifficulty(val);
                  setTargetCount(val === 'easy' ? 500 : 1500);
                }} disabled={generating}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select difficulty..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy (500 target)</SelectItem>
                    <SelectItem value="medium">Medium (1500 target)</SelectItem>
                    <SelectItem value="hard">Hard/Advanced (1500 target)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Quantity</label>
                <Select value={targetCount.toString()} onValueChange={(v) => setTargetCount(parseInt(v))} disabled={generating}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 questions</SelectItem>
                    <SelectItem value="100">100 questions</SelectItem>
                    <SelectItem value="250">250 questions</SelectItem>
                    <SelectItem value="500">500 questions</SelectItem>
                    {difficulty !== 'easy' && <SelectItem value="1000">1000 questions</SelectItem>}
                    {difficulty !== 'easy' && <SelectItem value="1500">1500 questions (Full Set)</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {generating && (
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 font-medium">{statusMsg}</span>
                  <span className="text-slate-600">
                    Batch {currentBatch}/{totalBatches} • {generatedCount} created • {duplicatesSkipped} duplicates skipped
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
            )}

            {result && (
              <Alert className={`mb-6 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                {result.success ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                <AlertTitle className={result.success ? 'text-green-900' : 'text-red-900'}>
                  {result.success ? 'Generation Complete!' : 'Generation Failed'}
                </AlertTitle>
                <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                  {result.success 
                    ? `Successfully generated ${result.generated} ${result.difficulty} questions for ${result.subject}. Skipped ${result.skipped} duplicates. Success rate: ${result.successfulBatches}/${result.successfulBatches + result.failedBatches} batches.`
                    : 'No questions were generated. Check console for errors.'
                  }
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={generateBatch}
              disabled={!subject || !difficulty || generating}
              className="w-full h-14 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating... ({generatedCount}/{targetCount})
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Generate {targetCount} {difficulty} Questions
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Complete Subject Build - 3 Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              To build a complete subject library (3,500 questions), run three separate generations:
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-bold text-green-900 mb-2">Step 1: Easy</h4>
                <p className="text-sm text-green-700 mb-3">Generate 500 easy questions testing fundamental black letter law</p>
                <Badge className="bg-green-600">Angoff: 0.75-0.85</Badge>
                <p className="text-xs text-green-600 mt-2">~50 AI calls, ~10 mins</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="font-bold text-amber-900 mb-2">Step 2: Medium</h4>
                <p className="text-sm text-amber-700 mb-3">Generate 1500 medium questions with moderate complexity</p>
                <Badge className="bg-amber-600">Angoff: 0.50-0.65</Badge>
                <p className="text-xs text-amber-600 mt-2">~150 AI calls, ~25 mins</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-bold text-red-900 mb-2">Step 3: Hard</h4>
                <p className="text-sm text-red-700 mb-3">Generate 1500 advanced questions testing edge cases</p>
                <Badge className="bg-red-600">Angoff: 0.30-0.50</Badge>
                <p className="text-xs text-red-600 mt-2">~150 AI calls, ~25 mins</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-slate-100 rounded-lg">
              <p className="text-sm text-slate-700">
                <strong>Total per subject:</strong> ~350 AI calls, 60 minutes<br/>
                <strong>All 16 subjects:</strong> ~5,600 AI calls, 16 hours<br/>
                <strong>Anti-plagiarism:</strong> Automatic duplicate detection and unique scenario generation
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}