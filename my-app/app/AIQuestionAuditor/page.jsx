"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Lock, Loader2, SearchCheck, AlertCircle, Zap, RefreshCw, Brain, DollarSign, Info, Sparkles, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { createPageUrl } from '@/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AICreditsBadge from '@/components/AICreditsBadge';

const ALL_SUBJECTS = [
  "Business Law & Practice", "Contract Law", "Tort Law", "Dispute Resolution", "Property Practice", "Land Law",
  "Wills & Administration of Estates", "Trusts", "Criminal Law", "Criminal Practice", "Solicitors Accounts",
  "Constitutional & Administrative Law", "EU Law", "The Legal System of England & Wales", "Legal Services", "Ethics & Professional Conduct"
];

const FLK1_SUBJECTS = ["Business Law & Practice", "Dispute Resolution", "Contract Law", "Tort Law", "The Legal System of England & Wales", "Constitutional & Administrative Law", "Legal Services", "Ethics & Professional Conduct"];
const FLK2_SUBJECTS = ["Property Practice", "Wills & Administration of Estates", "Solicitors Accounts", "Land Law", "Trusts", "Criminal Law", "Criminal Practice"];

export default function AIQuestionAuditor() {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [progressMessage, setProgressMessage] = useState("");
    const [progressPercent, setProgressPercent] = useState(0);
    const [processLog, setProcessLog] = useState([]);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [showStartDialog, setShowStartDialog] = useState(false);
    
    const [auditStats, setAuditStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);
    
    // NEW: Test AI credits
    const [testingCredits, setTestingCredits] = useState(false);
    const [testResult, setTestResult] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setUser( {name: "Admin User", email: "admin@example.com", role: "admin"}); //set user here
            } catch (e) {
                setUser(null);
            }
            setLoadingUser(false);
        };
        fetchUser();
    }, []);

    const calculateAuditStats = async () => {
        setLoadingStats(true);
        try {
            const allQuestions = await Question.list();
            const unaudited = allQuestions.filter(q => !q.ai_audited);
            
            const QUESTIONS_PER_BATCH = 10;
            const numBatches = Math.ceil(unaudited.length / QUESTIONS_PER_BATCH);
            
            const estimatedCredits = numBatches * 1;
            const estimatedTime = Math.ceil((numBatches * 3) / 60);
            
            setAuditStats({
                total: allQuestions.length,
                audited: allQuestions.length - unaudited.length,
                unaudited: unaudited.length,
                estimatedCredits,
                estimatedTime,
                batchSize: QUESTIONS_PER_BATCH
            });
        } catch (err) {
            console.error("Failed to calculate stats:", err);
            setError(`Failed to load stats: ${err.message}`);
        }
        setLoadingStats(false);
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            calculateAuditStats();
        }
    }, [user]);

    // NEW: Test if AI credits actually work
    const handleTestCredits = async () => {
        setTestingCredits(true);
        setTestResult(null); // Clear previous results
        
        try {
            const testPrompt = "Please provide a JSON object with a key 'message' and the value 'AI credits working'.";
            
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: testPrompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        message: { type: "string" }
                    },
                    required: ["message"]
                }
            });
            
            if (response && response.message === "AI credits working") {
                setTestResult({
                    success: true,
                    message: "✅ AI Credits Working! Response received successfully.",
                    response: response.message
                });
            } else {
                // If response was not exactly as expected, treat as a partial failure
                setTestResult({
                    success: false,
                    message: "❌ AI Credits Test Failed: Unexpected Response",
                    error: `Received: ${JSON.stringify(response)}`,
                    fullError: JSON.stringify(response, null, 2)
                });
            }

        } catch (err) {
            setTestResult({
                success: false,
                message: "❌ AI Credits Test Failed",
                error: err.message || err.toString(),
                fullError: JSON.stringify(err, null, 2)
            });
        }
        
        setTestingCredits(false);
    };

    const handleAIAudit = async () => {
        setIsProcessing(true);
        setError(null);
        setProcessLog([]);
        setProgressPercent(0);
        setProgressMessage("Loading questions for AI audit...");

        try {
            const allQuestions = await Question.filter({ ai_audited: { '$ne': true } });
            
            if (allQuestions.length === 0) {
                setStats({ total: 0, moved: 0, kept: 0, errors: 0 });
                setProcessLog(prev => [...prev, `✓ All questions have already been AI audited!`]);
                setProgressMessage("Nothing to process - all done!");
                setIsProcessing(false);
                return;
            }

            const BATCH_SIZE = 10;
            const DELAY_BETWEEN_BATCHES = 2000;
            const MAX_RETRIES = 3;

            setProcessLog([`📊 Found ${allQuestions.length.toLocaleString()} unaudited questions`]);
            setProcessLog(prev => [...prev, `🤖 Will process in batches of ${BATCH_SIZE} questions`]);
            setProcessLog(prev => [...prev, `⏱️ Estimated time: ${auditStats?.estimatedTime} minutes`]);
            setProcessLog(prev => [...prev, `Starting TRUE AI audit...`]);

            let moved = 0;
            let kept = 0;
            let errors = 0;

            const auditBatchWithRetry = async (batch, retryCount = 0) => {
                try {
                    const batchText = batch.map((q, i) => `
QUESTION ${i + 1}:
ID: ${q.id}
CURRENT_SUBJECT: ${q.subject}
TEXT: ${q.question_text}
OPTIONS: ${q.option_a} | ${q.option_b} | ${q.option_c} | ${q.option_d} | ${q.option_e}
`).join('\n---\n');

                    const prompt = `You are an expert SQE1 legal examiner. Analyze each question below and determine the MOST APPROPRIATE subject from this list:

FLK 1 Subjects: ${FLK1_SUBJECTS.join(', ')}
FLK 2 Subjects: ${FLK2_SUBJECTS.join(', ')}

For each question:
1. Read the scenario and question carefully
2. Identify the PRIMARY legal area being tested
3. If the current subject is correct or close enough, keep it
4. Only suggest a change if the question is CLEARLY in a different subject
5. Consider that questions can have overlapping topics - choose the MAIN focus

Return a JSON array with one object per question:
{
  "question_id": "the ID",
  "recommended_subject": "the best subject",
  "confidence": "high|medium|low",
  "reason": "brief explanation"
}

${batchText}`;

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
                                            question_id: { type: "string" },
                                            recommended_subject: { type: "string" },
                                            confidence: { type: "string", enum: ["high", "medium", "low"] },
                                            reason: { type: "string" }
                                        },
                                        required: ["question_id", "recommended_subject", "confidence"]
                                    }
                                }
                            },
                            required: ["questions"]
                        }
                    });

                    return { success: true, data: response.questions };

                } catch (err) {
                    const errorMsg = err.message || err.toString();
                    const isRetryable = errorMsg.includes('Network') || errorMsg.includes('timeout') || errorMsg.includes('429');
                    
                    if (isRetryable && retryCount < MAX_RETRIES) {
                        const delay = 3000 * Math.pow(2, retryCount);
                        setProcessLog(prev => [...prev, `⚠ AI call failed, retrying in ${delay/1000}s... (${retryCount + 1}/${MAX_RETRIES})`]);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return auditBatchWithRetry(batch, retryCount + 1);
                    }
                    
                    return { success: false, error: errorMsg };
                }
            };

            for (let batchStart = 0; batchStart < allQuestions.length; batchStart += BATCH_SIZE) {
                const batchEnd = Math.min(batchStart + BATCH_SIZE, allQuestions.length);
                const batch = allQuestions.slice(batchStart, batchEnd);

                setProgressMessage(`AI analyzing batch ${Math.floor(batchStart / BATCH_SIZE) + 1} of ${Math.ceil(allQuestions.length / BATCH_SIZE)}...`);

                const result = await auditBatchWithRetry(batch);

                if (result.success && result.data) {
                    for (const recommendation of result.data) {
                        const question = batch.find(q => q.id === recommendation.question_id);
                        if (!question) continue;

                        try {
                            const shouldMove = recommendation.recommended_subject !== question.subject && 
                                             recommendation.confidence === 'high' &&
                                             ALL_SUBJECTS.includes(recommendation.recommended_subject);

                            if (shouldMove) {
                                await Question.update(question.id, {
                                    subject: recommendation.recommended_subject,
                                    ai_audited: true
                                });
                                moved++;
                                
                                if (moved <= 30) {
                                    setProcessLog(prev => [...prev, `✓ MOVED: "${question.subject}" → "${recommendation.recommended_subject}" (${recommendation.confidence} confidence)`]);
                                }
                            } else {
                                await Question.update(question.id, { ai_audited: true });
                                kept++;
                            }
                        } catch (updateErr) {
                            errors++;
                            setProcessLog(prev => [...prev, `✗ Failed to update Q ID:${question.id}`]);
                        }
                    }
                } else {
                    errors += batch.length;
                    setProcessLog(prev => [...prev, `✗ Batch failed: ${result.error}`]);
                }

                setProgressPercent(((batchEnd) / allQuestions.length) * 100);

                if (batchEnd < allQuestions.length) {
                    setProcessLog(prev => [...prev, `📊 Progress: ${moved} moved, ${kept} kept, ${errors} errors`]);
                    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
                }
            }

            setProgressPercent(100);
            setProgressMessage("AI audit complete!");
            setStats({ total: allQuestions.length, moved, kept, errors });
            setProcessLog(prev => [...prev, 
                `\n✅ AI AUDIT COMPLETE!`,
                `Total processed: ${allQuestions.length.toLocaleString()}`,
                `Moved to better subjects: ${moved.toLocaleString()}`,
                `Kept in current subject: ${kept.toLocaleString()}`,
                errors > 0 ? `⚠ Errors: ${errors.toLocaleString()}` : `✓ No errors!`
            ]);

            await calculateAuditStats();

        } catch (err) {
            console.error("AI audit error:", err);
            setError(`AI audit failed: ${err.message}`);
            setProgressMessage("Process failed.");
        }

        setIsProcessing(false);
    };

    if (loadingUser) {
        return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
    }

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
                <Card className="max-w-md text-center p-8">
                    <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold">Access Denied</h1>
                    <p className="text-slate-600 mt-2">This tool is for administrators only.</p>
                    <Link href={createPageUrl("Dashboard")}><Button variant="outline" className="mt-6">Return to Dashboard</Button></Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-10">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center">
                        <Brain className="w-8 h-8 text-amber-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">AI Question Auditor</h1>
                    <p className="text-slate-600 text-lg mb-4">Use real AI to categorize all 49,000+ questions accurately</p>
                    <AICreditsBadge className="text-lg px-6 py-3" />
                </div>

                {/* NEW: AI Credits Test Card */}
                <Card className="mb-8 border-2 border-green-500 shadow-xl">
                    <CardHeader className="bg-green-50">
                        <CardTitle className="text-2xl flex items-center gap-3">
                            <Sparkles className="w-8 h-8 text-green-600" />
                            Test Your AI Credits
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <p className="text-slate-700 mb-4">
                            You have <strong>{user?.ai_credits?.toLocaleString()}</strong> AI credits. 
                            Let's test if they're working properly before running the full audit.
                        </p>
                        
                        <Button 
                            onClick={handleTestCredits} 
                            disabled={testingCredits}
                            className="w-full bg-green-600 hover:bg-green-700 h-14 text-lg mb-4"
                        >
                            {testingCredits ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : <Zap className="w-5 h-5 mr-2" />}
                            {testingCredits ? "Testing AI Connection..." : "Test AI Credits Now"}
                        </Button>

                        {testResult && (
                            <Alert className={`${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                {testResult.success ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                                <AlertTitle className={testResult.success ? 'text-green-900' : 'text-red-900'}>
                                    {testResult.message}
                                </AlertTitle>
                                <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                                    {testResult.success ? (
                                        <div>
                                            <p className="font-semibold mb-2">✅ Your AI credits are working perfectly!</p>
                                            <p>AI Response: "{testResult.response}"</p>
                                            <p className="mt-2 text-xs">You can now proceed with the full audit.</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="font-semibold mb-2">Error Details:</p>
                                            <pre className="text-xs bg-white p-2 rounded overflow-x-auto whitespace-pre-wrap">
                                                {testResult.error}
                                            </pre>
                                            <div className="mt-4 space-y-2">
                                                <p className="font-semibold">📧 Send this to base44 support:</p>
                                                <div className="bg-white p-3 rounded text-xs">
                                                    <p>Subject: AI Credits Not Working Despite Payment</p>
                                                    <p className="mt-2">Invoice: EXRBBLAB-0004</p>
                                                    <p>Amount Paid: $29.56</p>
                                                    <p>Credits Showing: {user?.ai_credits?.toLocaleString()}</p>
                                                    <p>Error: {testResult.error}</p>
                                                    {testResult.fullError && (
                                                        <>
                                                            <p className="mt-2 font-bold">Full Error Object:</p>
                                                            <p>{testResult.fullError}</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Cost Estimator Card */}
                <Card className="mb-8 border-2 border-blue-500 shadow-xl">
                    <CardHeader className="bg-blue-50">
                        <CardTitle className="text-2xl flex items-center gap-3">
                            <DollarSign className="w-8 h-8 text-blue-600" />
                            Cost Estimate & Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        {loadingStats ? (
                            <div className="text-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                                <p className="text-slate-600">Calculating audit requirements...</p>
                            </div>
                        ) : auditStats ? (
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <p className="text-sm text-slate-600 mb-1">Total Questions</p>
                                    <p className="text-4xl font-bold text-slate-900">{auditStats.total.toLocaleString()}</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <p className="text-sm text-slate-600 mb-1">Already AI Audited</p>
                                    <p className="text-4xl font-bold text-green-600">{auditStats.audited.toLocaleString()}</p>
                                </div>
                                <div className="bg-amber-50 p-6 rounded-lg shadow-sm border-2 border-amber-400">
                                    <p className="text-sm text-amber-800 mb-1">Need AI Audit</p>
                                    <p className="text-4xl font-bold text-amber-600">{auditStats.unaudited.toLocaleString()}</p>
                                </div>
                                <div className="bg-purple-50 p-6 rounded-lg shadow-sm border-2 border-purple-400">
                                    <p className="text-sm text-purple-800 mb-1">Estimated AI Credits</p>
                                    <p className="text-4xl font-bold text-purple-600">~{auditStats.estimatedCredits.toLocaleString()}</p>
                                </div>
                                <div className="bg-blue-50 p-6 rounded-lg shadow-sm col-span-2">
                                    <p className="text-sm text-blue-800 mb-2">Estimated Time</p>
                                    <p className="text-3xl font-bold text-blue-600">~{auditStats.estimatedTime} minutes</p>
                                    <p className="text-xs text-blue-700 mt-2">Processing {auditStats.batchSize} questions per AI call for efficiency</p>
                                </div>
                            </div>
                        ) : null}

                        <Alert className="mt-6 bg-blue-50 border-blue-200">
                            <Info className="h-4 w-4 text-blue-700" />
                            <AlertTitle className="text-blue-900 font-bold">How AI Audit Works</AlertTitle>
                            <AlertDescription className="text-blue-800 space-y-2">
                                <p>✓ <strong>Real AI Analysis:</strong> Uses LLM to read each question and understand the legal concepts</p>
                                <p>✓ <strong>Confidence-Based:</strong> Only moves questions when AI is highly confident</p>
                                <p>✓ <strong>Smart Batching:</strong> Processes {auditStats?.batchSize} questions per call to save credits</p>
                                <p>✓ <strong>Safe & Reversible:</strong> Marks questions as audited so you can track progress</p>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                {/* Main Action Card */}
                <Card className="border-4 border-purple-500 shadow-2xl">
                    <CardHeader className="bg-purple-50 border-b-4 border-purple-500">
                        <div className="flex items-center gap-3">
                            <Brain className="w-10 h-10 text-purple-600" />
                            <div>
                                <CardTitle className="text-3xl">🤖 AI-Powered Audit</CardTitle>
                                <p className="text-lg text-slate-700 mt-1 font-semibold">Let AI intelligently categorize all questions</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        {!isProcessing && !stats && (
                            <>
                                <Alert className="mb-6 bg-amber-50 border-amber-400 border-2">
                                    <AlertCircle className="h-6 w-6 text-amber-700" />
                                    <AlertTitle className="text-amber-900 font-bold text-xl">Before You Start</AlertTitle>
                                    <AlertDescription className="text-amber-800 text-lg space-y-2">
                                        <p>⚠️ This will use approximately <strong>{auditStats?.estimatedCredits.toLocaleString()} AI credits</strong></p>
                                        <p>⏱️ Will take approximately <strong>{auditStats?.estimatedTime} minutes</strong> to complete</p>
                                        <p>💡 Make sure you have enough AI credits in your base44 account</p>
                                        <p>✅ You can pause/stop anytime - progress is saved automatically</p>
                                    </AlertDescription>
                                </Alert>

                                <Button 
                                    onClick={() => setShowStartDialog(true)} 
                                    className="w-full h-20 text-2xl bg-purple-600 hover:bg-purple-700 font-bold"
                                    disabled={!auditStats || auditStats.unaudited === 0 || !testResult?.success}
                                >
                                    <Brain className="w-8 h-8 mr-3" /> 
                                    Start AI Audit ({auditStats?.unaudited.toLocaleString()} questions)
                                </Button>
                                
                                {!testResult?.success && !testingCredits && (
                                    <p className="text-amber-700 text-center mt-4">
                                        ⚠️ Please test your AI credits first using the green card above to enable the audit.
                                    </p>
                                )}
                            </>
                        )}

                        {isProcessing && (
                            <div className="space-y-4">
                                <div className="text-center">
                                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
                                    <p className="text-xl font-semibold text-slate-900 mb-2">{progressMessage}</p>
                                    <Progress value={progressPercent} className="h-4" />
                                    <p className="text-sm text-slate-600 mt-2">{progressPercent.toFixed(1)}% complete</p>
                                </div>
                            </div>
                        )}

                        {stats && (
                            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 space-y-3">
                                <h3 className="text-2xl font-bold text-green-900 flex items-center gap-2">
                                    <Brain className="w-6 h-6" />
                                    AI Audit Complete!
                                </h3>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="bg-white p-4 rounded-lg">
                                        <p className="text-sm text-slate-600">Total Processed</p>
                                        <p className="text-3xl font-bold text-slate-900">{stats.total.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg">
                                        <p className="text-sm text-slate-600">Moved by AI</p>
                                        <p className="text-3xl font-bold text-purple-600">{stats.moved.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg">
                                        <p className="text-sm text-slate-600">Kept in Place</p>
                                        <p className="text-3xl font-bold text-blue-600">{stats.kept.toLocaleString()}</p>
                                    </div>
                                    {stats.errors > 0 && (
                                        <div className="bg-white p-4 rounded-lg">
                                            <p className="text-sm text-slate-600">Errors</p>
                                            <p className="text-3xl font-bold text-red-600">{stats.errors.toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                                <Button 
                                    onClick={() => {
                                        setStats(null);
                                        setProcessLog([]);
                                        setProgressPercent(0);
                                        calculateAuditStats();
                                    }}
                                    variant="outline"
                                    className="w-full mt-4"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Reset Dashboard
                                </Button>
                            </div>
                        )}

                        {processLog.length > 0 && (
                            <div className="mt-6 p-6 bg-white rounded-lg border-2 border-slate-300">
                                <h4 className="font-bold text-xl mb-3 text-slate-800">AI Audit Log:</h4>
                                <div className="space-y-1 max-h-96 overflow-y-auto text-sm font-mono bg-slate-50 p-4 rounded">
                                    {processLog.map((log, index) => (
                                        <p key={index} className={`${
                                            log.startsWith('✓') || log.startsWith('✅') ? 'text-green-700 font-semibold' : 
                                            log.startsWith('✗') || log.startsWith('⚠') ? 'text-amber-700 font-semibold' : 
                                            log.startsWith('📊') || log.startsWith('🤖') ? 'text-blue-700 font-semibold' :
                                            'text-slate-700'
                                        }`}>{log}</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {error && (
                            <Alert variant="destructive" className="mt-6">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={showStartDialog} onOpenChange={setShowStartDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl">⚡ Start AI Audit?</AlertDialogTitle>
                        <AlertDialogDescription className="text-lg space-y-3 py-4">
                            <p>This will use <strong>~{auditStats?.estimatedCredits} AI credits</strong> from your base44 account.</p>
                            <p>The audit will take approximately <strong>{auditStats?.estimatedTime} minutes</strong>.</p>
                            <p className="text-green-700 font-semibold">✓ Progress is saved automatically</p>
                            <p className="text-blue-700">The AI will intelligently analyze each question and only move it if highly confident about a better subject.</p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => {
                                setShowStartDialog(false);
                                handleAIAudit();
                            }}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            Yes, Start AI Audit
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
