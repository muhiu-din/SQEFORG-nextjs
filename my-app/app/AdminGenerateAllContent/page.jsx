"use client";
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  BookOpen,
  Brain,
  FileText,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Zap,
  Target,
  Sparkles,
  Activity
} from 'lucide-react';

const ALL_SUBJECTS = [
  "Business Law & Practice", "Contract Law", "Tort Law", "Dispute Resolution",
  "Property Practice", "Land Law", "Wills & Administration of Estates", "Trusts",
  "Criminal Law", "Criminal Practice", "Solicitors Accounts",
  "Constitutional & Administrative Law", "EU Law",
  "The Legal System of England & Wales", "Legal Services", "Ethics & Professional Conduct"
];

const FLK_MAPPING = {
  "Business Law & Practice": "FLK 1",
  "Contract Law": "FLK 1",
  "Tort Law": "FLK 1",
  "Dispute Resolution": "FLK 1",
  "Constitutional & Administrative Law": "FLK 1",
  "EU Law": "FLK 1",
  "The Legal System of England & Wales": "FLK 1",
  "Legal Services": "FLK 1",
  "Property Practice": "FLK 2",
  "Land Law": "FLK 2",
  "Wills & Administration of Estates": "FLK 2",
  "Trusts": "FLK 2",
  "Criminal Law": "FLK 2",
  "Criminal Practice": "FLK 2",
  "Solicitors Accounts": "FLK 2",
  "Ethics & Professional Conduct": "Both"
};

const MOCKS_PER_SUBJECT = 5;

export default function AdminGenerateAllContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedGenerators, setSelectedGenerators] = useState({
    bllQuestions: false,
    fixCategories: false,
    revisionBooks: false,
    mixedMocks: false,
    subjectMocks: false,
    practiceQuestions: false
  });
  
  const [bllQuestionsPerSubject, setBllQuestionsPerSubject] = useState(800);
  const [generating, setGenerating] = useState(false);
  const [currentTask, setCurrentTask] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [logs, setLogs] = useState([]);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [startingCredits] = useState(10000);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
    setLoading(false);
  };

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const handleSelectAll = (checked) => {
    setSelectedGenerators({
      bllQuestions: checked,
      fixCategories: checked,
      revisionBooks: checked,
      mixedMocks: checked,
      subjectMocks: checked,
      practiceQuestions: checked
    });
  };

  const calculateEstimatedCredits = () => {
    let total = 0;
    if (selectedGenerators.bllQuestions) total += Math.ceil(bllQuestionsPerSubject / 100) * 10 * 16;
    if (selectedGenerators.fixCategories) total += 40;
    if (selectedGenerators.revisionBooks) total += 16;
    if (selectedGenerators.mixedMocks) total += 10;
    if (selectedGenerators.subjectMocks) total += 80;
    if (selectedGenerators.practiceQuestions) total += 480;
    return total;
  };

  const generateSelectedContent = async () => {
    const estimatedTotal = calculateEstimatedCredits();
    if (estimatedTotal > startingCredits) {
      alert(`❌ ERROR: Estimated ${estimatedTotal} credits exceeds ${startingCredits} limit. Please deselect some options.`);
      return;
    }

    setGenerating(true);
    setLogs([]);
    setCreditsUsed(0);
    
    const tasks = [];
    if (selectedGenerators.bllQuestions) tasks.push('bll');
    if (selectedGenerators.fixCategories) tasks.push('fix');
    if (selectedGenerators.revisionBooks) tasks.push('books');
    if (selectedGenerators.mixedMocks) tasks.push('mixed');
    if (selectedGenerators.subjectMocks) tasks.push('subjects');
    if (selectedGenerators.practiceQuestions) tasks.push('questions');
    
    addLog(`🚀 Starting generation of ${tasks.length} selected task(s)...`, 'info');
    
    for (const task of tasks) {
      if (task === 'bll') await generateBLLQuestions();
      if (task === 'fix') await fixAllCategories();
      if (task === 'books') await generateAllRevisionBooks();
      if (task === 'mixed') await generateMixedMocks();
      if (task === 'subjects') await generateSubjectMocks();
      if (task === 'questions') await generatePracticeQuestions();
    }
    
    setGenerating(false);
    const finalCredits = creditsUsed;
    const remaining = startingCredits - finalCredits;
    
    alert(`✅ GENERATION COMPLETE!

📊 Credits Used: ${finalCredits} / ${startingCredits}
✅ Remaining: ${remaining.toLocaleString()} credits (${((remaining/startingCredits)*100).toFixed(1)}%)

All selected content has been generated successfully!`);
  };

  const generateBLLQuestions = async () => {
    setCurrentTask('Generating Black Letter Law Questions');
    const batchesPerSubject = Math.ceil(bllQuestionsPerSubject / 100);
    const totalQuestions = bllQuestionsPerSubject * 16;
    addLog(`⚖️ Generating ${bllQuestionsPerSubject} HARD BLL questions × 16 subjects = ${totalQuestions} questions...`, 'info');
    
    const totalBatches = 16 * batchesPerSubject;
    setProgress({ current: 0, total: totalBatches });
    
    let batchesCompleted = 0;
    
    for (const subject of ALL_SUBJECTS) {
      try {
        addLog(`📚 ${subject}: ${bllQuestionsPerSubject} HARD BLL questions...`, 'info');
        
        for (let batch = 0; batch < batchesPerSubject; batch++) {
          let retryCount = 0;
          let success = false;
          
          while (retryCount < 3 && !success) {
            try {
              const prompt = `Generate 100 HARD Black Letter Law questions for ${subject}.

CRITICAL: These are PURE BLACK LETTER LAW - test memorization of:
- Exact statutory sections and subsections
- Precise case names and citations
- Specific legal tests, elements, time limits
- Exact terminology and definitions
- Burden of proof standards
- Procedural requirements

Difficulty: HARD ONLY
Subject: ${subject} ONLY
Style: Direct legal knowledge testing (no long fact patterns)
Questions: 150-200 words max
Angoff: 0.35-0.50 (hard for minimally competent)

Return: 100 original HARD BLL questions JSON.`;

              const result = await base44.integrations.Core.InvokeLLM({
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
                          correct_answer: { type: "string" },
                          explanation: { type: "string" },
                          angoff_score: { type: "number" }
                        }
                      }
                    }
                  }
                }
              });
              
              for (const q of result.questions) {
                if (!q.question_text || !q.correct_answer || !q.explanation) continue;
                
                await base44.entities.BlackLetterQuestion.create({
                  subject: subject,
                  difficulty: 'hard',
                  question_text: q.question_text,
                  option_a: q.option_a,
                  option_b: q.option_b,
                  option_c: q.option_c,
                  option_d: q.option_d,
                  option_e: q.option_e,
                  correct_answer: q.correct_answer,
                  explanation: q.explanation,
                  angoff_score: q.angoff_score || 0.4
                });
              }
              
              success = true;
              batchesCompleted++;
              addLog(`  ✅ Batch ${batch + 1}/${batchesPerSubject} (${batchesCompleted}/${totalBatches} total)`, 'success');
              setProgress({ current: batchesCompleted, total: totalBatches });
              setCreditsUsed(prev => prev + 10);
            } catch (error) {
              retryCount++;
              if (retryCount < 3) {
                const waitTime = 10000 * retryCount;
                addLog(`  ⚠️ Batch ${batch + 1} failed, retrying in ${waitTime/1000}s (${retryCount}/3)...`, 'info');
                await new Promise(resolve => setTimeout(resolve, waitTime));
              } else {
                addLog(`  ❌ Batch ${batch + 1} failed after 3 attempts: ${error.message}`, 'error');
                batchesCompleted++;
                setProgress({ current: batchesCompleted, total: totalBatches });
              }
            }
          }
        }
        
        addLog(`✅ ${subject} complete (${bllQuestionsPerSubject} questions)`, 'success');
      } catch (error) {
        addLog(`❌ ${subject} failed: ${error.message}`, 'error');
      }
    }
  };

  const fixAllCategories = async () => {
    setCurrentTask('Fixing Question Categories');
    addLog('🔧 Fixing ALL question categorizations...', 'info');
    
    try {
      const allQuestions = await base44.entities.Question.list();
      // Filter to only HARD questions
      const hardQuestions = allQuestions.filter(q => q.difficulty === 'hard');
      setProgress({ current: 0, total: hardQuestions.length });
      
      let fixedCount = 0;
      
      for (let i = 0; i < hardQuestions.length; i += 25) {
        const batch = hardQuestions.slice(i, Math.min(i + 25, hardQuestions.length));

        let retryCount = 0;
        let success = false;

        while (retryCount < 3 && !success) {
          try {
            const prompt = `Analyze these HARD SQE questions and fix subject classifications.

      Rules: Contract disputes→Contract Law, Tort claims→Tort Law, SRA→Ethics

      Questions:
      ${batch.map((q, idx) => `${idx + 1}. ID: ${q.id} | ${q.subject} | ${q.question_text.substring(0, 150)}...`).join('\n')}

      Return: {"corrections": [{"question_id": "id", "correct_subject": "subject", "reason": "why"}]}`;

            const result = await base44.integrations.Core.InvokeLLM({
              prompt,
              response_json_schema: {
                type: "object",
                properties: {
                  corrections: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question_id: { type: "string" },
                        correct_subject: { type: "string" },
                        reason: { type: "string" }
                      }
                    }
                  }
                }
              }
            });

            if (result.corrections?.length > 0) {
              for (const correction of result.corrections) {
                await base44.entities.Question.update(correction.question_id, {
                  subject: correction.correct_subject
                });
                fixedCount++;
              }
            }

            success = true;
            setProgress({ current: Math.min(i + 25, hardQuestions.length), total: hardQuestions.length });
            setCreditsUsed(prev => prev + 1);
          } catch (error) {
            retryCount++;
            if (retryCount < 3) {
              const waitTime = 10000 * retryCount;
              addLog(`⚠️ Batch retry ${retryCount}/3 - waiting ${waitTime/1000}s...`, 'info');
              await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
              addLog(`❌ Batch failed: ${error.message}`, 'error');
              setProgress({ current: Math.min(i + 25, hardQuestions.length), total: hardQuestions.length });
            }
          }
        }
      }
      
      addLog(`✅ Fixed ${fixedCount} hard questions`, 'success');
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
    }
  };

  const generateAllRevisionBooks = async () => {
    setCurrentTask('Generating Revision Books');
    addLog('📚 Generating 16 PREMIUM revision books...', 'info');
    setProgress({ current: 0, total: 16 });
    
    for (let i = 0; i < ALL_SUBJECTS.length; i++) {
      const subject = ALL_SUBJECTS[i];
      const flk = FLK_MAPPING[subject];

      let retryCount = 0;
      let success = false;

      while (retryCount < 3 && !success) {
        try {
          const prompt = `Create COMPREHENSIVE, 100% ORIGINAL revision book for ${subject} (${flk}).

ZERO PLAGIARISM: Invent all scenarios, names, companies, dates.
Apply REAL legal principles to FICTIONAL situations.

Include:
- 7-10 key statutes
- 20-25 leading cases  
- 20 core principles
- 7-10 ORIGINAL worked examples
- 20 ORIGINAL HARD practice MCQs
- Exam strategy

Target: 15,000-18,000 words, 100% original.`;

        const content = await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: false
        });

        await base44.entities.PremiumContent.create({
          guide_id: `guide-${i + 1}`,
          title: `Complete ${subject} Study Guide`,
          subject,
          flk,
          generated_content: content,
          content_version: 1,
          generation_date: new Date().toISOString(),
          word_count: content.split(/\s+/).length
        });

        success = true;
        addLog(`✅ ${subject}`, 'success');
        setProgress({ current: i + 1, total: 16 });
        setCreditsUsed(prev => prev + 1);
        } catch (error) {
        retryCount++;
        if (retryCount < 3) {
          const waitTime = 15000 * retryCount;
          addLog(`⚠️ ${subject} retry ${retryCount}/3 - waiting ${waitTime/1000}s...`, 'info');
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          addLog(`❌ ${subject} failed after 3 attempts`, 'error');
        }
        }
        }
        }
  };

  const generateMixedMocks = async () => {
    setCurrentTask('Generating Mixed Hard Mocks');
    addLog('🎯 Generating 10 HARD mixed mocks...', 'info');
    setProgress({ current: 0, total: 10 });
    
    for (let mockNum = 1; mockNum <= 10; mockNum++) {
      try {
        const examType = mockNum <= 5 ? 'FLK 1' : 'FLK 2';
        
        const prompt = `Generate 90 HARD, 100% ORIGINAL ${examType} questions.

CRITICAL: ZERO PLAGIARISM
- INVENT all names, companies, dates
- CREATE unique scenarios
- NO copying real cases
- Apply real law to FICTIONAL facts

Difficulty: HARD ONLY (Angoff 0.35-0.50)
Format: 250-word scenarios

Return: 90 original HARD questions JSON.`;

        const result = await base44.integrations.Core.InvokeLLM({
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
                    correct_answer: { type: "string" },
                    explanation: { type: "string" },
                    subject: { type: "string" },
                    angoff_score: { type: "number" }
                  }
                }
              }
            }
          }
        });
        
        const questionIds = [];
        for (const q of result.questions) {
          const created = await base44.entities.Question.create({
            subject: q.subject,
            difficulty: 'hard',
            question_text: q.question_text,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            option_e: q.option_e,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            angoff_score: q.angoff_score || 0.4,
            tags: ['hard', 'mixed-mock', 'original']
          });
          questionIds.push(created.id);
        }
        
        await base44.entities.MockExam.create({
          title: `Hard Mixed Mock ${mockNum} - ${examType}`,
          description: `90 original hard questions for exam readiness.`,
          exam_type: examType,
          difficulty: 'hard',
          time_limit_minutes: 157.5,
          question_ids: questionIds
        });
        
        addLog(`✅ Mock ${mockNum}/10`, 'success');
        setProgress({ current: mockNum, total: 10 });
        setCreditsUsed(prev => prev + 1);
      } catch (error) {
        addLog(`❌ Mock ${mockNum} failed`, 'error');
      }
    }
  };

  const generateSubjectMocks = async () => {
    setCurrentTask('Generating Subject-Specific Hard Mocks');
    addLog(`🎯 Generating ${MOCKS_PER_SUBJECT} HARD mocks × 16 subjects = 80 mocks...`, 'info');
    
    const totalMocks = 16 * MOCKS_PER_SUBJECT;
    setProgress({ current: 0, total: totalMocks });
    
    let mocksCreated = 0;
    
    for (const subject of ALL_SUBJECTS) {
      const flk = FLK_MAPPING[subject];
      
      try {
        addLog(`📚 ${subject}: ${MOCKS_PER_SUBJECT} HARD mocks...`, 'info');
        
        for (let mockNum = 1; mockNum <= MOCKS_PER_SUBJECT; mockNum++) {
          const prompt = `Generate 90 HARD, 100% ORIGINAL questions for ${subject} ONLY.

ZERO PLAGIARISM:
- INVENT all names ("Sarah Chen", "TechStart Ltd")
- CREATE fictional dates, amounts, facts
- Apply REAL ${subject} law to FICTIONAL scenarios

Quality: HARD ONLY (Angoff 0.4-0.55)
ALL 90 questions test ${subject} exclusively.

Return: 90 original HARD questions JSON.`;

          const result = await base44.integrations.Core.InvokeLLM({
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
                      correct_answer: { type: "string" },
                      explanation: { type: "string" },
                      angoff_score: { type: "number" }
                    }
                  }
                }
              }
            }
          });
          
          const questionIds = [];
          for (const q of result.questions) {
            const created = await base44.entities.Question.create({
              subject: subject,
              difficulty: 'hard',
              question_text: q.question_text,
              option_a: q.option_a,
              option_b: q.option_b,
              option_c: q.option_c,
              option_d: q.option_d,
              option_e: q.option_e,
              correct_answer: q.correct_answer,
              explanation: q.explanation,
              angoff_score: q.angoff_score || 0.5,
              tags: ['hard', 'subject-specific', 'original', subject.toLowerCase().replace(/\s+/g, '-')]
            });
            questionIds.push(created.id);
          }
          
          await base44.entities.MockExam.create({
            title: `${subject} - Hard Mock ${mockNum}/${MOCKS_PER_SUBJECT}`,
            description: `90 challenging ${subject} questions. 100% original scenarios.`,
            exam_type: flk,
            difficulty: 'hard',
            time_limit_minutes: 157.5,
            question_ids: questionIds
          });
          
          mocksCreated++;
          addLog(`  ✅ Mock ${mockNum}/${MOCKS_PER_SUBJECT}`, 'success');
          setProgress({ current: mocksCreated, total: totalMocks });
          setCreditsUsed(prev => prev + 1);
        }
        
        addLog(`✅ ${subject} complete`, 'success');
      } catch (error) {
        addLog(`❌ ${subject} failed`, 'error');
      }
    }
  };

  const generatePracticeQuestions = async () => {
    setCurrentTask('Generating Hard Practice Questions');
    addLog('🧠 Generating 48,000 HARD practice questions...', 'info');
    
    setProgress({ current: 0, total: 16 });
    
    for (let i = 0; i < ALL_SUBJECTS.length; i++) {
      const subject = ALL_SUBJECTS[i];
      
      try {
        addLog(`📝 ${subject}: 3,000 HARD questions...`, 'info');
        
        for (let batch = 0; batch < 30; batch++) {
          const prompt = `Generate 100 HARD, 100% ORIGINAL ${subject} questions.

ZERO PLAGIARISM:
- INVENT names: "Emma Watson", "Tech Solutions Ltd"
- CREATE scenarios from scratch
- MAKE UP dates, amounts, facts
- Apply REAL law to FICTIONAL situations

Difficulty: HARD ONLY

Return: 100 original HARD questions JSON.`;

          const questions = await base44.integrations.Core.InvokeLLM({
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
                      correct_answer: { type: "string" },
                      explanation: { type: "string" },
                      angoff_score: { type: "number" }
                    }
                  }
                }
              }
            }
          });
          
          for (const q of questions.questions) {
            await base44.entities.PracticeQuestion.create({
              subject,
              difficulty: 'hard',
              question_text: q.question_text,
              option_a: q.option_a,
              option_b: q.option_b,
              option_c: q.option_c,
              option_d: q.option_d,
              option_e: q.option_e,
              correct_answer: q.correct_answer,
              explanation_a: q.explanation,
              explanation_b: q.explanation,
              explanation_c: q.explanation,
              explanation_d: q.explanation,
              explanation_e: q.explanation,
              general_explanation: q.explanation,
              tags: ['original', 'hard'],
              time_estimate_seconds: 105
            });
          }
          
          setCreditsUsed(prev => prev + 1);
        }
        
        addLog(`✅ ${subject} done`, 'success');
        setProgress({ current: i + 1, total: 16 });
      } catch (error) {
        addLog(`❌ ${subject} failed`, 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Admin access required</AlertDescription>
        </Alert>
      </div>
    );
  }

  const estimatedCredits = calculateEstimatedCredits();
  const remainingCredits = startingCredits - creditsUsed;
  const hasSelections = Object.values(selectedGenerators).some(v => v);
  const wouldExceedLimit = estimatedCredits > startingCredits;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">HARD-Only Content Generator</h1>
          <p className="text-slate-600">Choose what to generate - ALL content is HARD difficulty • Max 10,000 credits</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <Zap className="w-8 h-8 text-green-600 mb-3" />
              <p className="font-semibold text-green-900 mb-2">Available Credits</p>
              <p className="text-4xl font-bold text-green-900">{startingCredits.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className={`border-2 ${remainingCredits < 1000 ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
            <CardContent className="p-6">
              <Activity className={`w-8 h-8 mb-3 ${remainingCredits < 1000 ? 'text-red-600' : 'text-blue-600'}`} />
              <p className={`font-semibold mb-2 ${remainingCredits < 1000 ? 'text-red-900' : 'text-blue-900'}`}>
                Used / Remaining
              </p>
              <p className={`text-4xl font-bold ${remainingCredits < 1000 ? 'text-red-900' : 'text-blue-900'}`}>
                {creditsUsed} / {remainingCredits.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {wouldExceedLimit && (
          <Alert className="mb-8 bg-red-50 border-red-300">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-900">
              <strong>LIMIT EXCEEDED:</strong> Estimated {estimatedCredits} credits exceeds {startingCredits} limit. Please deselect some options.
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-8 border-none shadow-xl">
          <CardHeader className="bg-slate-50 border-b">
            <div className="flex justify-between items-center">
              <CardTitle>Select What to Generate (HARD Only)</CardTitle>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={Object.values(selectedGenerators).every(v => v)}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="cursor-pointer">Select All</Label>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="bll"
                    checked={selectedGenerators.bllQuestions}
                    onCheckedChange={(checked) => setSelectedGenerators(prev => ({ ...prev, bllQuestions: checked }))}
                  />
                  <Label htmlFor="bll" className="cursor-pointer">
                    <p className="font-semibold">{bllQuestionsPerSubject * 16} HARD Black Letter Law Questions</p>
                    <p className="text-xs text-slate-600">{bllQuestionsPerSubject} HARD BLL questions × 16 subjects - pure legal knowledge testing</p>
                  </Label>
                </div>
                <Badge className="bg-blue-600">{Math.ceil(bllQuestionsPerSubject / 100) * 10 * 16} credits</Badge>
              </div>
              {selectedGenerators.bllQuestions && (
                <div className="flex items-center gap-3 pl-8">
                  <Label className="text-sm font-medium whitespace-nowrap">Questions per subject:</Label>
                  <input
                    type="number"
                    value={bllQuestionsPerSubject}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 100 : parseInt(e.target.value);
                      setBllQuestionsPerSubject(Math.min(2000, Math.max(100, val)));
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || parseInt(e.target.value) < 100) {
                        setBllQuestionsPerSubject(100);
                      }
                    }}
                    min="100"
                    max="2000"
                    step="100"
                    className="w-24 px-3 py-1 border border-blue-300 rounded-md text-sm"
                  />
                  <span className="text-xs text-slate-600">({bllQuestionsPerSubject * 16} total)</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="fix"
                  checked={selectedGenerators.fixCategories}
                  onCheckedChange={(checked) => setSelectedGenerators(prev => ({ ...prev, fixCategories: checked }))}
                />
                <Label htmlFor="fix" className="cursor-pointer">
                  <p className="font-semibold">Fix HARD Question Categories</p>
                  <p className="text-xs text-slate-600">Review & fix misclassifications for HARD questions</p>
                </Label>
              </div>
              <Badge variant="outline">~40 credits</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="books"
                  checked={selectedGenerators.revisionBooks}
                  onCheckedChange={(checked) => setSelectedGenerators(prev => ({ ...prev, revisionBooks: checked }))}
                />
                <Label htmlFor="books" className="cursor-pointer">
                  <p className="font-semibold">16 Revision Books</p>
                  <p className="text-xs text-slate-600">Premium guides, 15k-18k words, including HARD MCQs</p>
                </Label>
              </div>
              <Badge variant="outline">16 credits</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="mixed"
                  checked={selectedGenerators.mixedMocks}
                  onCheckedChange={(checked) => setSelectedGenerators(prev => ({ ...prev, mixedMocks: checked }))}
                />
                <Label htmlFor="mixed" className="cursor-pointer">
                  <p className="font-semibold">10 Mixed HARD Mocks</p>
                  <p className="text-xs text-slate-600">5 FLK1 + 5 FLK2, 90 questions each, HARD difficulty only</p>
                </Label>
              </div>
              <Badge variant="outline">10 credits</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="subjects"
                  checked={selectedGenerators.subjectMocks}
                  onCheckedChange={(checked) => setSelectedGenerators(prev => ({ ...prev, subjectMocks: checked }))}
                />
                <Label htmlFor="subjects" className="cursor-pointer">
                  <p className="font-semibold">80 HARD Subject Mocks ({MOCKS_PER_SUBJECT} per subject)</p>
                  <p className="text-xs text-slate-600">5 HARD mocks × 16 subjects = 7,200 HARD questions</p>
                </Label>
              </div>
              <Badge className="bg-amber-600">80 credits</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="questions"
                  checked={selectedGenerators.practiceQuestions}
                  onCheckedChange={(checked) => setSelectedGenerators(prev => ({ ...prev, practiceQuestions: checked }))}
                />
                <Label htmlFor="questions" className="cursor-pointer">
                  <p className="font-semibold">48,000 HARD Practice Questions</p>
                  <p className="text-xs text-slate-600">3,000 HARD questions per subject</p>
                </Label>
              </div>
              <Badge variant="outline">480 credits</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 border-purple-200 bg-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-800 mb-1">Estimated Credit Usage</p>
                <p className="text-3xl font-bold text-purple-900">{estimatedCredits} credits</p>
                <p className="text-sm text-purple-700 mt-1">
                  {((estimatedCredits / startingCredits) * 100).toFixed(1)}% of available
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-purple-800 mb-1">Remaining After</p>
                <p className="text-3xl font-bold text-purple-900">
                  {(startingCredits - estimatedCredits).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={generateSelectedContent}
          disabled={!hasSelections || generating || wouldExceedLimit}
          className="w-full h-16 text-lg bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {currentTask} ({progress.current}/{progress.total})
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Selected ({estimatedCredits} credits)
            </>
          )}
        </Button>

        {!hasSelections && (
          <p className="text-center text-amber-600 text-sm mt-4">
            Select at least one option above
          </p>
        )}

        {logs.length > 0 && (
          <Card className="mt-8 border-none shadow-lg">
            <CardHeader>
              <CardTitle>Generation Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {generating && progress.total > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>{currentTask}</span>
                    <span>{progress.current}/{progress.total}</span>
                  </div>
                  <Progress value={(progress.current / progress.total) * 100} className="h-2" />
                </div>
              )}

              <div className="max-h-96 overflow-y-auto space-y-2 bg-slate-50 p-4 rounded-lg">
                {logs.map((log, idx) => (
                  <div key={idx} className="text-sm flex gap-2">
                    <span className="text-slate-500">{log.timestamp}</span>
                    <span className={
                      log.type === 'success' ? 'text-green-600 font-semibold' :
                      log.type === 'error' ? 'text-red-600' :
                      'text-slate-700'
                    }>{log.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Alert className="mt-8 bg-green-50 border-green-300">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>10,000 Credit Budget:</strong> BLL (1,280) + Fix (40) + Books (16) + Mixed (10) + Subjects (80) + Questions (480) = <strong>1,906 credits (19.06%)</strong>. All content is HARD difficulty only. Recommended order: BLL → Books → Everything else.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}