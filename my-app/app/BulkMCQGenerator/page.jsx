"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Sparkles, Loader2, CheckCircle2, Lock, AlertCircle, Brain, Shield } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
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

// Generate unique question hashes from existing BLL questions to avoid cross-duplication
const getExistingHashes = async (subject) => {
    const bllQuestions = await base44.entities.BlackLetterQuestion.filter({ subject });
    const mcqQuestions = await base44.entities.Question.filter({ subject });
    const hashes = new Set();
    
    for (const q of [...(bllQuestions || []), ...(mcqQuestions || [])]) {
        if (q.question_text) {
            hashes.add(hashString(q.question_text));
            // Also add partial hashes for similarity detection
            const words = q.question_text.split(' ').slice(0, 20).join(' ');
            hashes.add(hashString(words));
        }
    }
    return hashes;
};

export default function BulkMCQGenerator() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [progress, setProgress] = useState({ current: 0, total: 0, subject: '' });
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
    const [creditsUsed, setCreditsUsed] = useState(0);
    const [subjectCounts, setSubjectCounts] = useState({});
    const [forceGenerate, setForceGenerate] = useState(false);
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkTier, setBulkTier] = useState('starter');

    const TIER_CONFIG = {
        starter: { count: 31, label: "Starter Tier (31/subject)", total: 496 },
        pro: { count: 63, label: "Pro Tier (63/subject)", total: 1008 },
        ultimate: { count: 125, label: "Ultimate Tier (125/subject)", total: 2000 }
    };

    useEffect(() => {
        const loadSubjectCounts = async () => {
            const counts = {};
            for (const subject of [...FLK1_SUBJECTS, ...FLK2_SUBJECTS]) {
                const questions = await base44.entities.Question.filter({ subject });
                counts[subject] = questions?.length || 0;
            }
            setSubjectCounts(counts);
        };
        loadSubjectCounts();
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = {name: "Admin User", email: "admin@example.com", role: "admin"}; // Mock admin user
                setUser(currentUser);
            } catch (e) {
                setUser(null);
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    const handleBulkGenerate = async () => {
        setIsGenerating(true);
        const targetPerSubject = TIER_CONFIG[bulkTier].count;
        const allSubjects = [...FLK1_SUBJECTS, ...FLK2_SUBJECTS];
        let grandTotalGenerated = 0;
        let subjectsProcessed = 0;

        // Calculate total to do for progress bar
        let totalNeeded = 0;
        for (const s of allSubjects) {
            const current = subjectCounts[s] || 0;
            if (current < targetPerSubject) totalNeeded += (targetPerSubject - current);
        }

        if (totalNeeded === 0 && !forceGenerate) {
            setError("All subjects already meet the target count for this tier. Enable 'Force Generate' to add more.");
            setIsGenerating(false);
            return;
        }

        setProgress({ current: 0, total: totalNeeded || (allSubjects.length * 50), subject: 'Starting Bulk Generation...' });

        for (const subject of allSubjects) {
            subjectsProcessed++;
            const currentCount = subjectCounts[subject] || 0;
            const needed = Math.max(0, targetPerSubject - currentCount);
            
            // If we have enough and not forcing, skip
            if (needed <= 0 && !forceGenerate) continue;

            const toGenerate = forceGenerate ? targetPerSubject : needed;
            
            // Generate for this subject
            // We'll reuse the same logic but inline here to manage the loop
            
            const BATCH_SIZE = 25;
            const batches = Math.ceil(toGenerate / BATCH_SIZE);
            let subjectGenerated = 0;
            const existingHashes = await getExistingHashes(subject);

            for (let batchNum = 0; batchNum < batches; batchNum++) {
                const questionsInBatch = Math.min(BATCH_SIZE, toGenerate - subjectGenerated);
                let retryCount = 0;
                let success = false;

                setProgress({ 
                    current: grandTotalGenerated, 
                    total: totalNeeded || (allSubjects.length * targetPerSubject), 
                    subject: `Generating ${subject} (${subjectGenerated}/${toGenerate})` 
                });

                while (retryCount < 3 && !success) {
                    try {
                        const prompt = `Generate exactly ${questionsInBatch} unique, scenario-based SQE1 MCQs for the subject "${subject}".
                        
                        CRITICAL: SCENARIO-BASED questions only.
                        - 150-200 word client scenario (A solicitor is advising...)
                        - 5 options (A-E), single best answer
                        - HARD difficulty (Angoff 0.3-0.4)
                        - Detailed explanation with case law/statutes
                        
                        JSON Format required.`;

                        const fullPrompt = `Generate exactly ${questionsInBatch} unique, scenario-based SQE1 MCQs for the subject "${subject}".

🚨 CRITICAL REQUIREMENTS FOR EACH QUESTION:

**SCENARIO-BASED (150-200 words):**
- Create a realistic client scenario starting with "A solicitor is advising [Client Name] who..."
- Include specific facts, dates, amounts, parties involved
- Make it a practical legal problem a solicitor would encounter
- Use invented names, companies, locations (e.g., "Emma Thompson runs Tech Solutions Ltd...")

**QUESTION STRUCTURE:**
- End scenario with: "Which of the following is the BEST advice?"
- Test application of law to facts, not just recall
- Require legal reasoning and judgment

**ALL 5 OPTIONS (A-E) MUST BE:**
- Equally plausible and professionally written
- Complete legal conclusions (not fragments)
- Similar in length and structure
- Based on realistic legal reasoning
- Indistinguishable at first glance

**SINGLE BEST ANSWER FORMAT:**
- Only ONE option is correct/best
- Other 4 options should represent common mistakes:
  * Misapplication of law
  * Confusion with similar principles
  * Wrong statutory interpretation
  * Incorrect case law application

**DETAILED EXPLANATION (200+ words):**
- Cite specific cases (e.g., Carlill v Carbolic Smoke Ball [1893])
- Quote relevant statutes (e.g., "Section 2(1) of the Sale of Goods Act 1979 states...")
- Explain why EACH wrong answer is wrong
- Explain why correct answer is BEST (not just correct)
- Include examiner tip on common trap

**DIFFICULTY:**
- ALL questions must be HARD difficulty (Angoff: 0.3-0.4)

**NO PLAGIARISM:**
- Invent all scenarios, names, facts
- Apply real law to fictional situations

FORMAT EACH AS JSON:
{
  "question_text": "[150-200 word scenario ending with 'Which of the following is the BEST advice?']",
  "option_a": "[Complete professional legal conclusion]",
  "option_b": "[Complete professional legal conclusion]",
  "option_c": "[Complete professional legal conclusion - THE CORRECT ONE]",
  "option_d": "[Complete professional legal conclusion]",
  "option_e": "[Complete professional legal conclusion]",
  "correct_answer": "C",
  "explanation": "[200+ word explanation with Step 1: Legal Issue, Step 2: Key Facts, Step 3: Apply Law, Step 4: Why each wrong answer is wrong, Step 5: Why correct answer is best, Examiner Tip]",
  "angoff_score": 0.4,
  "difficulty": "hard",
  "tags": ["relevant", "topic", "tags"]
}

Return array of ${questionsInBatch} questions. Ensure EVERY question is scenario-based with 150-200 word client situations.`;

                        const response = await base44.integrations.Core.InvokeLLM({
                            prompt: fullPrompt,
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
                                                angoff_score: { type: "number" },
                                                difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                                                tags: { type: "array", items: { type: "string" } }
                                            },
                                            required: ["question_text", "option_a", "option_b", "option_c", "option_d", "option_e", "correct_answer", "explanation", "angoff_score", "difficulty"]
                                        }
                                    }
                                },
                                required: ["questions"]
                            }
                        });

                        setCreditsUsed(prev => prev + 1);
                        const questions = response.questions || [];
                        let batchSuccessCount = 0;

                        for (const q of questions) {
                            try {
                                if (!q || !q.question_text || !q.correct_answer) continue;
                                const questionHash = hashString(q.question_text);
                                const partialHash = hashString(q.question_text.split(' ').slice(0, 20).join(' '));
                                if (existingHashes.has(questionHash) || existingHashes.has(partialHash)) continue;

                                await base44.entities.Question.create({ ...q, subject, tags: q.tags || [] });
                                existingHashes.add(questionHash);
                                existingHashes.add(partialHash);
                                batchSuccessCount++;
                                grandTotalGenerated++;
                                subjectGenerated++;
                            } catch (e) { console.warn(e); }
                        }

                        if (batchSuccessCount < questionsInBatch * 0.10) throw new Error("Batch failed");
                        success = true;
                        await new Promise(r => setTimeout(r, 2000));

                    } catch (e) {
                        console.error(e);
                        retryCount++;
                        await new Promise(r => setTimeout(r, 5000));
                    }
                }
            }
        }

        setResults([{
            subject: "All Subjects (Bulk)",
            generated: grandTotalGenerated,
            target: totalNeeded,
            status: 'complete',
            batchId: `bulk_${Date.now()}`
        }]);
        setIsGenerating(false);
        // Refresh counts
        const counts = {};
        for (const subject of [...FLK1_SUBJECTS, ...FLK2_SUBJECTS]) {
            const questions = await base44.entities.Question.filter({ subject });
            counts[subject] = questions?.length || 0;
        }
        setSubjectCounts(counts);
    };

    const generateBatchForSubject = async (subject, resumeCount = 0, resumeBatchId = null) => {
        setIsGenerating(true);
        setSelectedSubject(subject);
        
        // Check existing questions for this subject
        const existingQuestions = await base44.entities.Question.filter({ subject });
        const existingCount = existingQuestions ? existingQuestions.length : 0;
        
        // Cap of 500 new scenario-based questions per generation (1000 total if force enabled)
        const MAX_PER_SUBJECT = forceGenerate ? 1000 : 500;
        const TARGET_COUNT = forceGenerate ? 500 : Math.max(0, 500 - existingCount);
        
        if (TARGET_COUNT <= 0) {
            setError(`${subject} already has ${existingCount} questions. Enable "Force Generate" to add 1000 NEW scenario-based questions.`);
            setIsGenerating(false);
            return;
        }

        if (resumeCount === 0) {
            setProgress({ current: 0, total: TARGET_COUNT, subject });
            setResults([]);
            setCreditsUsed(0);
        } else {
            setProgress({ current: resumeCount, total: TARGET_COUNT, subject });
        }

        setError(null);

        const BATCH_SIZE = 25;
        const batches = Math.ceil((TARGET_COUNT - resumeCount) / BATCH_SIZE);
        let totalGenerated = resumeCount;
        let duplicatesSkipped = 0;

        const batchId = resumeBatchId || `mcq_bulk_${subject.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;

        // Get existing hashes to prevent cross-duplication with BLL questions
        const existingHashes = await getExistingHashes(subject);

        for (let batchNum = 0; batchNum < batches; batchNum++) {
            const questionsInBatch = Math.min(BATCH_SIZE, TARGET_COUNT - totalGenerated);
            let retryCount = 0;
            let success = false;

            while (retryCount < 3 && !success) {
                try {
                    const prompt = `Generate exactly ${questionsInBatch} unique, scenario-based SQE1 MCQs for the subject "${subject}".

🚨 CRITICAL REQUIREMENTS FOR EACH QUESTION:

**SCENARIO-BASED (150-200 words):**
- Create a realistic client scenario starting with "A solicitor is advising [Client Name] who..."
- Include specific facts, dates, amounts, parties involved
- Make it a practical legal problem a solicitor would encounter
- Use invented names, companies, locations (e.g., "Emma Thompson runs Tech Solutions Ltd...")

**QUESTION STRUCTURE:**
- End scenario with: "Which of the following is the BEST advice?"
- Test application of law to facts, not just recall
- Require legal reasoning and judgment

**ALL 5 OPTIONS (A-E) MUST BE:**
- Equally plausible and professionally written
- Complete legal conclusions (not fragments)
- Similar in length and structure
- Based on realistic legal reasoning
- Indistinguishable at first glance

**SINGLE BEST ANSWER FORMAT:**
- Only ONE option is correct/best
- Other 4 options should represent common mistakes:
  * Misapplication of law
  * Confusion with similar principles
  * Wrong statutory interpretation
  * Incorrect case law application

**DETAILED EXPLANATION (200+ words):**
- Cite specific cases (e.g., Carlill v Carbolic Smoke Ball [1893])
- Quote relevant statutes (e.g., "Section 2(1) of the Sale of Goods Act 1979 states...")
- Explain why EACH wrong answer is wrong
- Explain why correct answer is BEST (not just correct)
- Include examiner tip on common trap

**DIFFICULTY:**
- ALL questions must be HARD difficulty (Angoff: 0.3-0.4)

**NO PLAGIARISM:**
- Invent all scenarios, names, facts
- Apply real law to fictional situations

FORMAT EACH AS JSON:
{
  "question_text": "[150-200 word scenario ending with 'Which of the following is the BEST advice?']",
  "option_a": "[Complete professional legal conclusion]",
  "option_b": "[Complete professional legal conclusion]",
  "option_c": "[Complete professional legal conclusion - THE CORRECT ONE]",
  "option_d": "[Complete professional legal conclusion]",
  "option_e": "[Complete professional legal conclusion]",
  "correct_answer": "C",
  "explanation": "[200+ word explanation with Step 1: Legal Issue, Step 2: Key Facts, Step 3: Apply Law, Step 4: Why each wrong answer is wrong, Step 5: Why correct answer is best, Examiner Tip]",
  "angoff_score": 0.4,
  "difficulty": "hard",
  "tags": ["relevant", "topic", "tags"]
}

Return array of ${questionsInBatch} questions. Ensure EVERY question is scenario-based with 150-200 word client situations.`;

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
                                        question_text: { type: "string" },
                                        option_a: { type: "string" },
                                        option_b: { type: "string" },
                                        option_c: { type: "string" },
                                        option_d: { type: "string" },
                                        option_e: { type: "string" },
                                        correct_answer: { type: "string", enum: ["A", "B", "C", "D", "E"] },
                                        explanation: { type: "string" },
                                        angoff_score: { type: "number" },
                                        difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                                        tags: { type: "array", items: { type: "string" } }
                                    },
                                    required: ["question_text", "option_a", "option_b", "option_c", "option_d", "option_e", "correct_answer", "explanation", "angoff_score", "difficulty"]
                                }
                            }
                        },
                        required: ["questions"]
                    }
                });

                setCreditsUsed(prev => prev + 1);

                const questions = response.questions || [];

                let batchSuccessCount = 0;
                for (const q of questions) {
                    try {
                        // Validate all required fields
                        if (!q || !q.question_text || !q.correct_answer || !q.explanation ||
                            !q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.option_e) {
                            console.warn('Skipping incomplete question');
                            continue;
                        }

                        const questionHash = hashString(q.question_text);
                        const partialHash = hashString(q.question_text.split(' ').slice(0, 20).join(' '));

                        // Check against both MCQ and BLL questions
                        if (existingHashes.has(questionHash) || existingHashes.has(partialHash)) {
                            duplicatesSkipped++;
                            continue;
                        }

                        await base44.entities.Question.create({
                            ...q,
                            subject,
                            tags: q.tags || []
                        });

                        // Add to existing hashes to prevent duplicates within batch
                        existingHashes.add(questionHash);
                        existingHashes.add(partialHash);

                        batchSuccessCount++;
                        totalGenerated++;
                        setProgress({ 
                            current: totalGenerated, 
                            total: TARGET_COUNT, 
                            subject 
                        });
                    } catch (qErr) {
                        console.warn('Failed to save individual question:', qErr);
                    }
                }

                // If less than 10% succeeded, consider it failed
                if (batchSuccessCount < questionsInBatch * 0.10) {
                    throw new Error(`Only ${batchSuccessCount}/${questionsInBatch} questions saved successfully`);
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
                    console.warn(`Batch ${batchNum + 1} failed after 3 retries, continuing to next batch`);
                    setError(`Batch ${batchNum + 1} skipped (${totalGenerated} saved so far)`);
                    success = true;
                    break;
                } else {
                    const waitTime = isNetworkError 
                        ? Math.min(30000 * retryCount, 90000)
                        : Math.min(15000 * retryCount, 45000);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
                }
                }
                if (!success && retryCount >= 3) {
                continue;
                }
                if (!success) break;
        }

        setResults([{
            subject,
            generated: totalGenerated,
            target: TARGET_COUNT,
            duplicates: duplicatesSkipped,
            status: totalGenerated >= TARGET_COUNT ? 'complete' : 'partial',
            batchId: batchId
        }]);

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
                    <Link href={createPageUrl("Dashboard")}>
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
                    <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                        <Brain className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">Bulk MCQ Generator (1000 per Subject)</h1>
                    <p className="text-slate-600 text-lg">Generate 1000 scenario-based practice MCQs efficiently</p>
                </div>

                <Card className="mb-6 border-2 border-purple-200 bg-linear-to-br from-purple-50 to-indigo-50">
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
                                <div className="text-6xl font-bold text-purple-900">
                                    {Math.round(((3000 - creditsUsed) / 3000) * 100)}%
                                </div>
                                <p className="text-sm text-slate-600 mt-1">Budget Left</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Alert className="mb-6 bg-purple-50 border-purple-200">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <AlertTitle className="text-purple-900 font-bold">Scenario-Based MCQ Generation</AlertTitle>
                    <AlertDescription className="text-purple-800">
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li><strong>150-200 word realistic client scenarios</strong> for each question</li>
                            <li>All 5 options equally plausible (single best answer format)</li>
                            <li>Detailed explanations with case law & statutory references</li>
                            <li>25 questions per API call (40 calls = 1000 questions)</li>
                            <li>~40 credits per subject • Can generate 75+ subjects within 3,000 credits</li>
                            <li>Automatic duplicate detection</li>
                            <li><strong>Cap: Maximum 1,000 questions per subject</strong> (use Force Generate to add more)</li>
                            <li>Cross-checks with BLL questions to prevent duplication</li>
                        </ul>
                        <p className="mt-3 font-semibold">📊 These are DIFFERENT from Black Letter Law questions - scenario-based client situations!</p>
                    </AlertDescription>
                </Alert>

                {!isGenerating && !results.length && (
                    <Card className="border-none shadow-xl">
                        <CardHeader>
                            <CardTitle>Generate Scenario-Based MCQs</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-700">Generation Mode</label>
                                <div className="flex gap-4">
                                    <Button 
                                        onClick={() => setBulkMode(false)} 
                                        variant={!bulkMode ? "default" : "outline"}
                                        className={!bulkMode ? "bg-purple-600" : ""}
                                    >
                                        Single Subject
                                    </Button>
                                    <Button 
                                        onClick={() => setBulkMode(true)} 
                                        variant={bulkMode ? "default" : "outline"}
                                        className={bulkMode ? "bg-purple-600" : ""}
                                    >
                                        Bulk All Subjects (Tier Match)
                                    </Button>
                                </div>
                            </div>

                            {bulkMode ? (
                                <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-2 block">Target Subscription Tier</label>
                                        <Select value={bulkTier} onValueChange={setBulkTier}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="starter">{TIER_CONFIG.starter.label}</SelectItem>
                                                <SelectItem value="pro">{TIER_CONFIG.pro.label}</SelectItem>
                                                <SelectItem value="ultimate">{TIER_CONFIG.ultimate.label}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-slate-500 mt-2">
                                            Will generate questions for ALL 16 subjects to reach the target count per subject.
                                            <br/>Target: <strong>{TIER_CONFIG[bulkTier].total}</strong> total questions across all subjects.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">Select Subject</label>
                                    <Select value={selectedSubject || ""} onValueChange={setSelectedSubject}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a subject..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-96">
                                            <SelectGroup>
                                                <SelectLabel>FLK 1 Subjects</SelectLabel>
                                                {FLK1_SUBJECTS.map(s => (
                                                    <SelectItem key={s} value={s}>
                                                        {s} ({subjectCounts[s] || 0} existing)
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                            <SelectGroup>
                                                <SelectLabel>FLK 2 Subjects</SelectLabel>
                                                {FLK2_SUBJECTS.map(s => (
                                                    <SelectItem key={s} value={s}>
                                                        {s} ({subjectCounts[s] || 0} existing)
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {!bulkMode && selectedSubject && subjectCounts[selectedSubject] >= 500 && !forceGenerate && (
                                <Alert className="bg-amber-50 border-amber-200">
                                    <AlertCircle className="h-4 w-4 text-amber-600" />
                                    <AlertDescription className="text-amber-800">
                                        <strong>{selectedSubject}</strong> has {subjectCounts[selectedSubject]} questions. Enable "Force Generate" to add 500 NEW scenario-based questions.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {!bulkMode && selectedSubject && subjectCounts[selectedSubject] > 0 && subjectCounts[selectedSubject] < 500 && (
                                <Alert className="bg-blue-50 border-blue-200">
                                    <AlertCircle className="h-4 w-4 text-blue-600" />
                                    <AlertDescription className="text-blue-800">
                                        Will generate <strong>{500 - subjectCounts[selectedSubject]}</strong> more questions to reach 500 cap.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                                <input 
                                    type="checkbox" 
                                    id="forceGenerate"
                                    checked={forceGenerate}
                                    onChange={(e) => setForceGenerate(e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-300"
                                />
                                <label htmlFor="forceGenerate" className="text-sm text-slate-700">
                                    <strong>Force Generate:</strong> {bulkMode ? "Generate full target count even if subjects already have questions" : "Add 500 NEW scenario-based MCQs (even if subject already has questions)"}
                                </label>
                            </div>

                            <Button
                                onClick={bulkMode ? handleBulkGenerate : () => generateBatchForSubject(selectedSubject)}
                                disabled={(!bulkMode && !selectedSubject) || (!bulkMode && subjectCounts[selectedSubject] >= 500 && !forceGenerate)}
                                className="w-full h-12 bg-purple-600 hover:bg-purple-700"
                            >
                                <Sparkles className="w-5 h-5 mr-2" />
                                {bulkMode 
                                    ? `Bulk Generate All Subjects (${TIER_CONFIG[bulkTier].label})` 
                                    : `Generate ${forceGenerate ? "500 NEW" : ""} Scenario-Based MCQs for ${selectedSubject || 'Selected Subject'}`
                                }
                            </Button>

                            <p className="text-xs text-slate-500 text-center">
                                Estimated time: 5-8 minutes • Cost: ~40 AI credits
                            </p>
                        </CardContent>
                    </Card>
                )}

                {isGenerating && (
                    <Card className="border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Generating: {progress.subject}</span>
                                <span className="text-lg text-slate-600">{progress.current} / {progress.total}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Progress value={(progress.current / progress.total) * 100} className="h-3" />
                            <div className="text-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
                                <p className="text-sm text-slate-600">
                                    Generating scenario-based questions in batches of 25...
                                </p>
                                <p className="text-xs text-slate-500 mt-2">
                                    Credits used: {creditsUsed} / 3000 budget
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
                                            <h3 className="font-bold text-slate-900 text-lg">{result.subject}</h3>
                                            <p className="text-slate-700 mt-2">
                                                Generated: <strong>{result.generated}</strong> / {result.target} questions
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
                                                onClick={() => generateBatchForSubject(result.subject, result.generated, result.batchId)}
                                                size="sm" 
                                                className="w-full bg-amber-600 hover:bg-amber-700"
                                            >
                                                Resume Generation (Need {result.target - result.generated} more)
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <Alert className="bg-blue-50 border-blue-200">
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-blue-800">
                                    <strong>Success!</strong> Scenario-based MCQs saved to database. Students can practice via Question Bank page.
                                    <br />
                                    <strong>Credits used:</strong> {creditsUsed} / 3,000 budget ({((creditsUsed / 3000) * 100).toFixed(1)}% used)
                                </AlertDescription>
                            </Alert>

                            <div className="flex gap-4">
                                <Button
                                    onClick={() => {
                                        setResults([]);
                                        setSelectedSubject(null);
                                        setCreditsUsed(0);
                                    }}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Generate Another Subject
                                </Button>
                                <Link href={createPageUrl("QuestionBank")} className="flex-1">
                                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                                        View Question Bank
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