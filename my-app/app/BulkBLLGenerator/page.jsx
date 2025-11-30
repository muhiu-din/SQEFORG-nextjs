"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Sparkles, Loader2, CheckCircle2, Lock, AlertCircle, Gavel, Shield } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const FLK1_SUBJECTS = [
  "Business Law & Practice", "Contract Law", "Tort Law", "Dispute Resolution",
  "Constitutional & Administrative Law", "EU Law",
  "The Legal System of England & Wales", "Legal Services", "Ethics & Professional Conduct"
];

const FLK2_SUBJECTS = [
  "Property Practice", "Land Law", "Wills & Administration of Estates", "Trusts",
  "Criminal Law", "Criminal Practice", "Solicitors Accounts"
];

const hashString = (str) => {
    if (!str) return ''; 
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
};

export default function BulkBLLGenerator() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedFlk, setSelectedFlk] = useState(null);
    const [progress, setProgress] = useState({ current: 0, total: 0, flk: '' });
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
    const [creditsUsed, setCreditsUsed] = useState(0);
    const [progressId, setProgressId] = useState(null);
    const [savedProgress, setSavedProgress] = useState(null);

    useEffect(() => {
        const checkForSavedProgress = async () => {
            try {
                const currentUser = await base44.auth.me();
                setUser(currentUser);
                
                // Check for in-progress generation
                const inProgress = await base44.entities.BulkGenerationProgress.filter({
                    created_by: currentUser.email,
                    generation_type: 'bll',
                    status: 'in_progress'
                }, '-updated_date', 1);
                
                if (inProgress && inProgress.length > 0) {
                    setSavedProgress(inProgress[0]);
                }
            } catch (e) {
                setUser(null);
            }
            setLoading(false);
        };
        checkForSavedProgress();
    }, []);

    const resumeFromSaved = async () => {
        if (!savedProgress) return;
        
        setSelectedFlk(savedProgress.subject);
        setProgress({
            current: savedProgress.current_count,
            total: savedProgress.target_count,
            flk: savedProgress.subject
        });
        setCreditsUsed(savedProgress.credits_used || 0);
        setProgressId(savedProgress.id);
        
        await generateBatchForFlk(
            savedProgress.subject,
            savedProgress.current_count,
            savedProgress.batch_id,
            savedProgress.id
        );
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await base44.auth.me();
                setUser(currentUser);
            } catch (e) {
                setUser(null);
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    const generateBatchForFlk = async (flkType, resumeCount = 0, resumeBatchId = null, existingProgressId = null) => {
        setIsGenerating(true);
        setSelectedFlk(flkType);
        
        const subjects = flkType === 'FLK 1' ? FLK1_SUBJECTS : FLK2_SUBJECTS;
        
        // Check existing questions for this FLK
        const existingQuestions = await base44.entities.BlackLetterQuestion.list();
        const flkQuestions = existingQuestions.filter(q => subjects.includes(q.subject));
        const existingCount = flkQuestions.length;
        
        const QUESTIONS_PER_SUBJECT = 1000;
        const MAX_PER_FLK = subjects.length * QUESTIONS_PER_SUBJECT; // FLK1: 9000, FLK2: 7000
        const TARGET_COUNT = Math.min(MAX_PER_FLK - existingCount, MAX_PER_FLK);
        
        if (TARGET_COUNT <= 0) {
            setError(`${flkType} already has ${existingCount} questions (max: ${MAX_PER_FLK}). Cannot generate more.`);
            setIsGenerating(false);
            return;
        }
        
        if (resumeCount === 0) {
            setProgress({ current: 0, total: TARGET_COUNT, flk: flkType });
            setResults([]);
            setCreditsUsed(0);
        } else {
            setProgress({ current: resumeCount, total: TARGET_COUNT, flk: flkType });
        }
        
        setError(null);

        const BATCH_SIZE = 50; 
        const batches = Math.ceil((TARGET_COUNT - resumeCount) / BATCH_SIZE);
        let totalGenerated = resumeCount;
        let duplicatesSkipped = 0;

        const batchId = resumeBatchId || `bll_bulk_${flkType.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;

        let trackingId = existingProgressId;
        if (!trackingId) {
            const tracking = await base44.entities.BulkGenerationProgress.create({
                generation_type: 'bll',
                subject: flkType,
                target_count: TARGET_COUNT,
                current_count: resumeCount,
                batch_id: batchId,
                status: 'in_progress',
                last_batch_number: 0,
                credits_used: 0
            });
            trackingId = tracking.id;
            setProgressId(trackingId);
        }

        for (let batchNum = 0; batchNum < batches; batchNum++) {
            const questionsInBatch = Math.min(BATCH_SIZE, TARGET_COUNT - totalGenerated);
            let retryCount = 0;
            let success = false;

            while (retryCount < 3 && !success) {
                try {
                    const subjectList = subjects.join(', ');
                    const prompt = `Generate exactly ${questionsInBatch} unique, scenario-based Black Letter Law MCQs for SQE1 ${flkType}.

🚨 CRITICAL REQUIREMENTS:
- Cover ALL subjects in ${flkType}: ${subjectList}
- Distribute questions evenly across all ${subjects.length} subjects
- Create ${questionsInBatch} COMPLETELY DIFFERENT questions
- Each question MUST be scenario-based (100-150 word client scenario)
- ⚠️ MANDATORY: EVERY question MUST have EXACTLY 5 OPTIONS (A, B, C, D, E) - NO EXCEPTIONS
- ALL 5 OPTIONS must be equally plausible and professionally written
- Single best answer format
- Detailed explanations citing case law/statutes
- ALL questions must be HARD difficulty (Angoff: 0.3-0.4)
- NO plagiarism - invent all names, companies, dates, facts
- Each scenario must be realistic solicitor advice situation

FORMAT EACH QUESTION AS JSON (MUST include ALL fields, especially all 5 options):
{
  "subject": "[One of: ${subjectList}]",
  "question_text": "[150-word scenario starting with client name and situation]",
  "option_a": "[Complete professional legal conclusion]",
  "option_b": "[Complete professional legal conclusion]",
  "option_c": "[Complete professional legal conclusion]",
  "option_d": "[Complete professional legal conclusion]",
  "option_e": "[Complete professional legal conclusion - REQUIRED]",
  "correct_answer": "[A/B/C/D/E]",
  "explanation": "[200+ word explanation citing specific cases/statutes, explaining why each wrong answer is wrong and why correct answer is best]",
  "angoff_score": 0.4,
  "difficulty": "hard"
}

⚠️ IMPORTANT: Every question MUST have all 5 options (A, B, C, D, E). Do not skip option_e!

Return an array of ${questionsInBatch} questions with even distribution across all ${subjects.length} subjects.`;

                const response = await base44.integrations.Core.InvokeLLM({
                    prompt: prompt,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            questions: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        subject: { type: "string" },
                                        question_text: { type: "string" },
                                        option_a: { type: "string" },
                                        option_b: { type: "string" },
                                        option_c: { type: "string" },
                                        option_d: { type: "string" },
                                        option_e: { type: "string" },
                                        correct_answer: { type: "string", enum: ["A", "B", "C", "D", "E"] },
                                        explanation: { type: "string" },
                                        angoff_score: { type: "number" },
                                        difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
                                    },
                                    required: ["subject", "question_text", "option_a", "option_b", "option_c", "option_d", "option_e", "correct_answer", "explanation", "angoff_score", "difficulty"]
                                }
                            }
                        },
                        required: ["questions"]
                    }
                });

                const newCreditsUsed = creditsUsed + 1;
                setCreditsUsed(newCreditsUsed);

                const questions = response.questions || [];

                let batchSuccessCount = 0;
                for (const q of questions) {
                    try {
                        // Validate all required fields including all 5 options
                        if (!q || !q.question_text || !q.correct_answer || !q.explanation || 
                            !q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.option_e) {
                            console.warn('Skipping incomplete question - missing required fields');
                            continue;
                        }

                        const questionHash = hashString(q.question_text);

                        const existing = await base44.entities.BlackLetterQuestion.filter({
                            question_hash: questionHash
                        });

                        if (existing && existing.length > 0) {
                            duplicatesSkipped++;
                            continue;
                        }

                        await base44.entities.BlackLetterQuestion.create({
                            ...q,
                            subject: q.subject || subjects[0],
                            question_hash: questionHash,
                            generation_batch: batchId
                        });

                        batchSuccessCount++;
                        totalGenerated++;
                        setProgress({ 
                            current: totalGenerated, 
                            total: TARGET_COUNT, 
                            flk: flkType 
                        });
                    } catch (qErr) {
                        console.warn('Failed to save individual question:', qErr);
                    }
                }

                // If less than 10% of questions succeeded, consider it a failed batch
                if (batchSuccessCount < questionsInBatch * 0.10) {
                    throw new Error(`Only ${batchSuccessCount}/${questionsInBatch} questions saved successfully`);
                }

                // SAVE PROGRESS AFTER EACH SUCCESSFUL BATCH
                if (trackingId) {
                    await base44.entities.BulkGenerationProgress.update(trackingId, {
                        current_count: totalGenerated,
                        last_batch_number: batchNum + 1,
                        credits_used: newCreditsUsed,
                        status: totalGenerated >= TARGET_COUNT ? 'completed' : 'in_progress'
                    });
                }

                if (totalGenerated >= TARGET_COUNT) break;

                await new Promise(resolve => setTimeout(resolve, 10000));
                success = true;

            } catch (err) {
                console.error(`Batch ${batchNum + 1} attempt ${retryCount + 1} failed:`, err);
                retryCount++;

                const isNetworkError = err.message?.includes('Network Error') || err.message?.includes('network');
                const isJSONError = err.message?.includes('JSON') || err.message?.includes('delimiter') || err.message?.includes('Expecting');

                if (retryCount >= 3) {
                    // After 3 retries, log error but continue to next batch instead of stopping
                    console.warn(`Batch ${batchNum + 1} failed after 3 retries, continuing to next batch`);
                    setError(`Batch ${batchNum + 1} skipped after 3 retries (${totalGenerated} questions saved so far)`);
                    success = true; // Mark as "success" to move to next batch
                    break;
                } else {
                    // Longer wait for network errors, shorter for JSON errors
                    const waitTime = isNetworkError 
                        ? Math.min(30000 * retryCount, 90000)
                        : Math.min(15000 * retryCount, 45000);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
            }
            if (!success && retryCount >= 3) {
                // Continue to next batch instead of breaking the entire generation
                continue;
            }
            if (!success) break;
        }

        // Mark as completed in database
        if (trackingId) {
            await base44.entities.BulkGenerationProgress.update(trackingId, {
                status: totalGenerated >= TARGET_COUNT ? 'completed' : 'failed',
                current_count: totalGenerated
            });
        }

        setResults([{
            flk: flkType,
            generated: totalGenerated,
            target: TARGET_COUNT,
            duplicates: duplicatesSkipped,
            status: totalGenerated >= TARGET_COUNT ? 'complete' : 'partial',
            batchId: batchId,
            trackingId: trackingId
        }]);

        setSavedProgress(null);
        setIsGenerating(false);
    };

    if (loading) {
        return (
            <div className="p-10 text-center">
                <Loader2 className="animate-spin w-8 h-8 mx-auto" />
            </div>
        );
    }

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
                <Card className="max-w-md text-center p-8 border-none shadow-xl">
                    <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold">Admin Access Required</h1>
                    <p className="text-slate-600 mt-2">This tool is for administrators only.</p>
                    <Link to={createPageUrl("Dashboard")}>
                        <Button variant="outline" className="mt-6">Return to Dashboard</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center">
                        <Gavel className="w-8 h-8 text-amber-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">Bulk BLL Generator (50 per Batch)</h1>
                    <p className="text-slate-600 text-lg">Generate 1,000 questions per subject (FLK1: ~9,000 total, FLK2: ~7,000 total)</p>
                </div>

                <Card className="mb-6 border-2 border-blue-200 bg-linear-to-br from-blue-50 to-indigo-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">AI Credits Status</h3>
                                <div className="flex items-center gap-6">
                                    <div>
                                        <p className="text-sm text-slate-600">Session Used</p>
                                        <p className="text-3xl font-bold text-slate-900">{creditsUsed}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600">Budget</p>
                                        <p className="text-3xl font-bold text-green-900">3,000</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600">Remaining</p>
                                        <p className="text-2xl font-bold text-amber-900">{3000 - creditsUsed}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-6xl font-bold text-blue-900">
                                    {Math.round(((3000 - creditsUsed) / 3000) * 100)}%
                                </div>
                                <p className="text-sm text-slate-600 mt-1">Budget Left</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Alert className="mb-6 bg-blue-50 border-blue-200">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-900 font-bold">Efficient Batch Generation</AlertTitle>
                    <AlertDescription className="text-blue-800">
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li><strong>25 questions per batch</strong> covering all subjects in selected FLK</li>
                            <li><strong>Cap: 1,000 questions per subject</strong> (FLK1: ~9,000 total, FLK2: ~7,000 total)</li>
                            <li>Auto-saves progress after each batch - safe to resume</li>
                            <li>3 automatic retries with smart backoff for errors</li>
                            <li>Questions evenly distributed across all subjects</li>
                            <li>All scenario-based with detailed explanations & hard difficulty</li>
                            <li>Duplicate detection ensures uniqueness</li>
                        </ul>
                    </AlertDescription>
                </Alert>

                {savedProgress && !isGenerating && (
                    <Alert className="mb-6 bg-amber-50 border-amber-300">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <AlertTitle className="text-amber-900 font-bold">Resume Previous Generation</AlertTitle>
                        <AlertDescription className="text-amber-800">
                            Found incomplete generation: <strong>{savedProgress.subject}</strong> 
                            <br/>Progress: {savedProgress.current_count.toLocaleString()} / {savedProgress.target_count.toLocaleString()} questions
                            <br/>Credits used: {savedProgress.credits_used || 0}
                            <div className="mt-3 flex gap-3">
                                <Button onClick={resumeFromSaved} size="sm" className="bg-amber-600 hover:bg-amber-700">
                                    Resume Generation
                                </Button>
                                <Button 
                                    onClick={async () => {
                                        await base44.entities.BulkGenerationProgress.update(savedProgress.id, {
                                            status: 'failed'
                                        });
                                        setSavedProgress(null);
                                    }} 
                                    variant="outline" 
                                    size="sm"
                                >
                                    Discard & Start New
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {!isGenerating && !results.length && (
                    <Card className="border-none shadow-xl">
                        <CardHeader>
                            <CardTitle>Select FLK to Generate All Questions (100 per batch)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <Button
                                    onClick={() => generateBatchForFlk('FLK 1', 0, null, null)}
                                    disabled={savedProgress}
                                    className="h-auto py-6 flex-col bg-linear-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                >
                                    <Sparkles className="w-8 h-8 mb-2" />
                                    <span className="text-lg font-bold">Generate FLK 1</span>
                                    <span className="text-sm opacity-90">~9,000 questions (1k per subject) • ~360 batches</span>
                                </Button>
                                <Button
                                    onClick={() => generateBatchForFlk('FLK 2', 0, null, null)}
                                    disabled={savedProgress}
                                    className="h-auto py-6 flex-col bg-linear-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                >
                                    <Sparkles className="w-8 h-8 mb-2" />
                                    <span className="text-lg font-bold">Generate FLK 2</span>
                                    <span className="text-sm opacity-90">~7,000 questions (1k per subject) • ~280 batches</span>
                                </Button>
                            </div>

                            <Alert className="bg-slate-50">
                                <AlertDescription className="text-slate-700 text-sm">
                                    <strong>Batch Size: 25 questions</strong> per API call for higher quality
                                    <br/>Questions distributed evenly across all subjects in the selected FLK
                                    <br/>Progress auto-saves after each batch - safe to resume if interrupted
                                    <br/><strong>Cap: Maximum 1,000 questions per subject</strong>
                                    <br/>Automatic retry with exponential backoff for network errors
                                </AlertDescription>
                            </Alert>

                            <p className="text-xs text-slate-500 text-center">
                                FLK1: ~9,000 questions (~180 credits) • FLK2: ~7,000 questions (~140 credits)
                            </p>
                        </CardContent>
                    </Card>
                )}

                {isGenerating && (
                    <Card className="border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Generating: {progress.flk}</span>
                                <span className="text-lg text-slate-600">{progress.current.toLocaleString()} / {progress.total.toLocaleString()}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Progress value={(progress.current / progress.total) * 100} className="h-3" />
                            <div className="text-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-600 mb-2" />
                                <p className="text-sm text-slate-600">
                                    Generating in batches of 50 questions... Please wait.
                                </p>
                                <p className="text-xs text-slate-500 mt-2">
                                    Credits used: {creditsUsed} | Progress auto-saves after each batch
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {results.length > 0 && (
                    <Card className="border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                                Generation Complete
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {results.map((result, idx) => (
                                <div key={idx} className="p-4 border rounded-lg bg-green-50">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg">{result.flk}</h3>
                                            <p className="text-slate-700 mt-2">
                                                Generated: <strong>{result.generated.toLocaleString()}</strong> / {result.target.toLocaleString()} questions
                                            </p>
                                            {result.duplicates > 0 && (
                                                <p className="text-amber-700 text-sm mt-1">
                                                    {result.duplicates} duplicates skipped
                                                </p>
                                            )}
                                        </div>
                                        <Badge className={result.status === 'complete' ? 'bg-green-600' : 'bg-amber-600'}>
                                            {result.status}
                                        </Badge>
                                    </div>
                                    {result.status === 'partial' && (
                                        <div className="mt-3 pt-3 border-t border-slate-200">
                                            <Button 
                                                onClick={() => generateBatchForFlk(result.flk, result.generated, result.batchId, result.trackingId)}
                                                size="sm" 
                                                className="w-full bg-amber-600 hover:bg-amber-700"
                                            >
                                                Resume Generation (Need {(result.target - result.generated).toLocaleString()} more)
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <Alert className="bg-blue-50 border-blue-200">
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-blue-800">
                                    <strong>Success!</strong> Questions saved to database. Students can practice via Black Letter Law Practice page.
                                    <br />
                                    <strong>Credits used:</strong> {creditsUsed} / 3,000 budget ({((creditsUsed / 3000) * 100).toFixed(1)}% used)
                                </AlertDescription>
                            </Alert>

                            <div className="flex gap-4">
                                <Button
                                    onClick={() => {
                                        setResults([]);
                                        setSelectedFlk(null);
                                        setCreditsUsed(0);
                                    }}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Generate Another FLK
                                </Button>
                                <Link to={createPageUrl("BlackLetterLawPractice")} className="flex-1">
                                    <Button className="w-full bg-slate-900 hover:bg-slate-800">
                                        View Practice Page
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}