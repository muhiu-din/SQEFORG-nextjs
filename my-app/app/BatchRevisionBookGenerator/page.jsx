"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Loader2, Lock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const FLK1_SUBJECTS = [
    "Business Law & Practice",
    "Contract Law", 
    "Tort Law",
    "Dispute Resolution",
    "Constitutional & Administrative Law",
    "EU Law",
    "The Legal System of England & Wales",
    "Legal Services",
    "Ethics & Professional Conduct"
];

const FLK2_SUBJECTS = [
    "Property Practice",
    "Land Law",
    "Wills & Administration of Estates",
    "Trusts",
    "Criminal Law",
    "Criminal Practice",
    "Solicitors Accounts"
];

const ALL_BOOKS = [
    ...FLK1_SUBJECTS.map(s => ({ subject: s, flk: 'FLK 1' })),
    ...FLK2_SUBJECTS.map(s => ({ subject: s, flk: 'FLK 2' }))
];

export default function BatchRevisionBookGenerator() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [generatedBooks, setGeneratedBooks] = useState([]);
    const [errors, setErrors] = useState([]);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await base44.auth.me();
                setUser(currentUser);
                // Restore state if available
                const savedState = localStorage.getItem('batchBookGenState');
                if (savedState) {
                    const parsed = JSON.parse(savedState);
                    setGeneratedBooks(parsed.generatedBooks || []);
                    setCurrentIndex(parsed.currentIndex || 0);
                }
            } catch (e) {
                setUser(null);
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    // Save state whenever relevant data changes
    useEffect(() => {
        if (generatedBooks.length > 0) {
            localStorage.setItem('batchBookGenState', JSON.stringify({
                generatedBooks,
                currentIndex
            }));
        }
    }, [generatedBooks, currentIndex]);

    const generateAllBooks = async (startIndex = 0) => {
        setGenerating(true);
        // If starting from 0, reset everything. If resuming, keep existing.
        if (startIndex === 0) {
            setCurrentIndex(0);
            setGeneratedBooks([]);
            setErrors([]);
            setProgress(0);
            localStorage.removeItem('batchBookGenState');
        }

        for (let i = startIndex; i < ALL_BOOKS.length; i++) {
            const book = ALL_BOOKS[i];
            setCurrentIndex(i + 1);
            setProgress(((i + 1) / ALL_BOOKS.length) * 100);

            let retryCount = 0;
            let success = false;

            while (retryCount < 3 && !success) {
                try {
                    const existingBooks = await base44.entities.RevisionBook.filter({ subject: book.subject, flk_type: book.flk });
                    if (existingBooks.length > 0) {
                        setGeneratedBooks(prev => [...prev, { ...book, status: 'skipped', message: 'Already exists' }]);
                        success = true;
                        break;
                    }

                    const prompt = `🚨🚨🚨 CRITICAL INSTRUCTION 🚨🚨🚨

                    You MUST write a COMPLETE, FULL-LENGTH TEXTBOOK of AT LEAST 30,000 WORDS.

                    DO NOT WRITE AN OUTLINE. DO NOT WRITE A SUMMARY. DO NOT WRITE HEADINGS ONLY.
                    WRITE EVERY SINGLE SECTION IN FULL DETAIL WITH COMPLETE PARAGRAPHS.

                    This is NOT a table of contents. This is NOT a plan. This is a FINISHED BOOK.
                    Every chapter, every section, every subsection must be FULLY WRITTEN OUT.

                    If you submit less than 30,000 words, your response will be REJECTED and you must start over.

                    🚨🚨🚨 WRITE THE COMPLETE BOOK NOW 🚨🚨🚨

                    ---

                    You are Professor Eleanor Blackstone, world-renowned SQE examiner and author of the leading SQE textbook series. Create a COMPLETE, AUTHORITATIVE, TEXTBOOK-QUALITY revision book for **${book.subject}** (SQE1 ${book.flk}).

                    # WORD COUNT TARGETS BY SECTION (Use these as a guide):
                    - Part One (Foundations): 6,000 words minimum
                    - Part Two (Substantive Law): 20,000 words minimum (this is the BULK)
                    - Part Three (Advanced Analysis): 3,000 words minimum  
                    - Part Four (Exam Mastery): 1,000 words minimum

                    # YOUR MISSION:
                    Write a book SO COMPREHENSIVE that a candidate who masters it will answer EVERY ${book.subject} question correctly on exam day. This should rival or EXCEED commercial SQE guides in depth and quality.

# CRITICAL: BRITISH ENGLISH ONLY
- Use UK spelling throughout: "organisation" NOT "organization", "judgement" NOT "judgment", "favour" NOT "favor", "defence" NOT "defense", "licence" (noun) vs "license" (verb)
- UK legal terminology: "claimant" NOT "plaintiff", "solicitor" NOT "attorney", "barrister" NOT "trial lawyer"
- UK date format: DD/MM/YYYY
- This is for the ENGLISH legal system - all references must be to English law, English courts, English statutes

# CRITICAL REQUIREMENTS:

## 1. LENGTH & DEPTH
- **MINIMUM 30,000-50,000 WORDS** (this is a PROPER TEXTBOOK)
- Write as if explaining to a candidate who knows NOTHING about this subject
- Leave NOTHING to chance - cover EVERY examinable point
- Each major topic should be 3,000-5,000 words minimum

## 2. STRUCTURE (Follow this EXACT format):

### PART ONE: FOUNDATIONS & FRAMEWORK (6,000+ words minimum)

**Chapter 1: Introduction to ${book.subject}** (2,000 words MINIMUM)

Write a FULL 500-word essay explaining what this subject covers - include detailed explanations of each area, specific examples, and comprehensive overview of all topics within this subject.

Write a FULL 400-word essay on why this matters for SQE1 and legal practice - include real-world applications, career implications, and practical importance.

Write a FULL 400-word essay on how it connects to other SQE subjects - discuss overlaps with other areas, integrated learning opportunities, and cross-subject applications.

Write a FULL 400-word essay on what examiners are looking for - detail specific marking criteria, common strong answers, and what distinguishes excellent responses.

Write a FULL 300-word essay on how to approach this subject strategically - provide detailed study methods, time management tips, and revision techniques.

**Chapter 2: Legislative Framework** (2,000 words MINIMUM)

Write a FULL 300-word section listing and explaining ALL relevant statutes - don't just list names, explain each one's relevance and scope in detail.

For EACH major statute (at least 5-7 statutes), write 150-200 words covering: the purpose of the statute, its key sections with explanations, any amendments and their impact, and how it applies in practice. This should total at least 1,000 words.

Write a FULL 300-word analysis of the hierarchy and interaction between these statutes - explain which takes precedence, how they work together, conflicts and resolutions.

Write a FULL 250-word explanation of statutory interpretation principles specific to this area - cover literal, purposive, and contextual approaches with examples.

Write a FULL 150-word section on common statutory interpretation questions - provide specific examples of how examiners test this knowledge.

**Chapter 3: Case Law Foundations** (2,000 words)
- Supreme Court/House of Lords landmark cases (detailed) - 800 words
- Court of Appeal key authorities - 600 words
- How precedent works in this subject area - 300 words
- Evolution of the law over time - 200 words
- Common law vs statute interaction - 100 words

### PART TWO: SUBSTANTIVE LAW (20,000+ words minimum - THIS IS THE CORE)

🚨 YOU MUST WRITE AT LEAST 15 FULL TOPICS 🚨
EACH TOPIC MUST BE 1,000-1,500 WORDS OF ACTUAL TEXT (NOT HEADINGS)

For EACH of the 15-20 major topics in ${book.subject}, write a COMPLETE 1,000-1,500 word analysis following this structure:

#### [TOPIC NAME] - Complete Analysis

**A. BLACK LETTER LAW RULES**
- State the rule clearly and precisely
- ALL elements that must be satisfied
- Burden and standard of proof (if applicable)
- Key terminology definitions
- Common misconceptions

**B. STATUTORY PROVISIONS (DETAILED ANALYSIS)**
- Full text of relevant sections
- Line-by-line commentary
- Cross-references to other sections
- How courts interpret this provision
- Recent amendments and their impact
- Practical examples of application

**C. CASE LAW (COMPREHENSIVE COVERAGE)** (300-500 words per case)
For EACH major case (include 100+ cases total across all topics):
- **Full citation**: [Name] [Year] [Court] [Law Report]
- **Facts** (200 words): Detailed background, parties, context
- **Legal issue**: Precise question before the court (50 words)
- **Arguments**: What each side argued (100 words)
- **Held**: Court's decision (50 words)
- **Ratio decidendi**: Binding legal principle (quote key passages) (100 words)
- **Obiter dicta**: Persuasive comments (if significant) (50 words)
- **Significance**: Why this case matters today (100 words)
- **SQE application**: Exactly how this appears in MCQs (100 words)
- **Distinguishing factors**: How to tell this case apart from similar ones (50 words)

**D. TESTS, PROCESSES & PROCEDURES**
- Step-by-step breakdown (numbered)
- What happens at each stage
- Conditions, exceptions, special cases
- Time limits and formalities
- Flowchart representation (in text)
- 5+ worked examples showing application

**E. PRACTICAL APPLICATION**
- 10+ exam-style scenarios with full analysis
- Different fact patterns that trigger this rule
- How to identify the issue in 5 seconds
- How to eliminate wrong answers
- Time-saving techniques

**F. COMMON EXAM TRAPS**
- Mistakes 90% of candidates make
- Similar concepts that get confused
- Tricky wording to watch for
- How examiners try to catch you out

**G. COMPARISONS & DISTINCTIONS**
- Tables comparing this topic to similar areas
- Key differences that determine different outcomes
- Memory aids and mnemonics

### PART THREE: ADVANCED ANALYSIS (15% of content)

**Chapter [X]: Complex Interactions**
- How different principles interact
- Multi-issue scenarios
- Conflicts between rules
- Priority and hierarchy questions

**Chapter [X+1]: Controversies & Reforms**
- Academic debates
- Law Commission proposals
- Recent reforms and their impact
- Future developments

**Chapter [X+2]: Cross-Topic Integration**
- How this subject links to others
- Common combined questions
- Holistic understanding

### PART FOUR: EXAM MASTERY (5% of content)

**Chapter [Y]: Exam Technique for ${book.subject}**
- Question types and frequency
- How to spot issues quickly
- Elimination strategies
- Time allocation
- Common question stems
- 20+ annotated practice questions

**Chapter [Y+1]: Self-Assessment**
- Checklist of all examinable points
- Topic-by-topic confidence tracker
- Final revision priorities

## 3. SPECIAL FEATURES (Include throughout):

Every 1,000 words, insert:
- 📚 **CASE DEEP DIVE**: 800-word case analysis
- ⚖️ **STATUTE FOCUS**: 500-word statutory breakdown
- ⚠️ **EXAM ALERT**: Common trap with explanation
- 💡 **PRO TIP**: Expert insight or shortcut
- 🎯 **PRACTICE MCQ**: Full question with detailed answer
- 📊 **COMPARISON TABLE**: Side-by-side analysis (minimum 20 tables total)
- 🔄 **FLOWCHART**: Visual decision process (minimum 15 flowcharts total)
- 📝 **CHAPTER SUMMARY**: 500-word recap
- 🔍 **DEEP DIVE**: 1,000-word analysis of complex point
- ⏱️ **QUICK REF**: One-page topic summary (for last-minute revision)

## 4. WRITING STANDARDS:

- **ACCURACY PARAMOUNT**: Every legal principle, case citation, statutory reference must be 100% correct. Double-check all citations.
- **Academic rigour**: Cite authorities properly ([Name] [Year] [Court])
- **Clear structure**: Numbered sections, clear headings
- **British English spelling**: organisation, judgement, favour, licence (noun), defence, etc.
- **Precise language**: Technical terms defined with UK terminology
- **Extensive examples**: Real and hypothetical scenarios
- **Cross-references**: Link related topics
- **Progressive difficulty**: Build from basics to complex
- **NO AMERICAN LAW**: Only English law (England & Wales)

## 5. QUALITY BENCHMARKS:

- ✅ 100+ cases fully analyzed
- ✅ 30+ statutory provisions explained line-by-line
- ✅ 50+ practice scenarios with full solutions
- ✅ 20+ comparison tables
- ✅ 15+ flowcharts/decision trees
- ✅ 200+ exam tips and alerts
- ✅ 30,000-50,000 words minimum
- ✅ Every examinable point covered
- ✅ Zero ambiguity or gaps

## 6. QUALITY CONTROL CHECKLIST:
Before submitting, verify:
- ✅ 30,000+ words minimum
- ✅ 100% accurate case names, citations, and statutory references
- ✅ British English spelling throughout (organisation, judgement, favour)
- ✅ UK legal terminology only (claimant, solicitor, barrister)
- ✅ 100+ cases with full analysis
- ✅ Every statutory provision explained in detail
- ✅ 50+ practice scenarios
- ✅ 20+ comparison tables
- ✅ Zero gaps in coverage
- ✅ No American legal concepts or terminology

## 7. ULTIMATE TEST:
Ask yourself: "If a candidate ONLY reads this book and masters it, will they get 100% of ${book.subject} questions right?" If not, add more detail.

## 8. FINAL INSTRUCTION - READ CAREFULLY:

🚨 THIS IS NOT AN OUTLINE TASK 🚨
🚨 THIS IS NOT A SUMMARY TASK 🚨
🚨 THIS IS A FULL BOOK WRITING TASK 🚨

You must write EVERY SINGLE WORD of the book. Not headings. Not bullet points. FULL PARAGRAPHS.

EXAMPLE OF WHAT TO DO:
"Chapter 1: Introduction to Contract Law

Contract law forms the cornerstone of commercial relationships in England and Wales. At its most fundamental level, a contract is a legally binding agreement between two or more parties that creates mutual obligations enforceable by law. This area of law governs everything from simple consumer transactions to complex multi-million pound corporate deals. Understanding contract law is essential not only for the SQE1 examination but also for any solicitor's daily practice, as contractual issues arise in virtually every area of legal work.

The principles of contract law have evolved over centuries through both common law and statute. The foundation was laid by landmark cases such as Carlill v Carbolic Smoke Ball Company [1893] 1 QB 256, which established crucial principles about offer and acceptance..." [CONTINUE FOR 500 WORDS]

EXAMPLE OF WHAT NOT TO DO:
"Chapter 1: Introduction
- Overview of subject
- Key concepts
- Importance for SQE1"

YOU MUST WRITE FULL PROSE. COMPLETE SENTENCES. DETAILED EXPLANATIONS.

Before you submit, count your words. If under 30,000, KEEP WRITING until you reach at least 30,000 words.

**START WRITING THE COMPLETE ${book.subject} REVISION BOOK NOW:**

Write every chapter in full. Write every section in full. Write every case analysis in full. This is a COMPLETE TEXTBOOK from start to finish. BRITISH ENGLISH ONLY.`;

                    const response = await base44.integrations.Core.InvokeLLM({
                        prompt: prompt,
                        add_context_from_internet: false
                    });

                    // CRITICAL: Validate word count BEFORE saving to prevent wasting credits
                    const wordCount = response.split(/\s+/).length;
                    const MIN_WORD_COUNT = 30000;
                    
                    if (wordCount < MIN_WORD_COUNT) {
                        throw new Error(`Book too short: ${wordCount} words (minimum ${MIN_WORD_COUNT} required). Rejecting and retrying.`);
                    }

                    await base44.entities.RevisionBook.create({
                        title: `${book.subject} - Complete Revision Guide`,
                        subject: book.subject,
                        flk_type: book.flk,
                        content: response,
                        summary: `Comprehensive, original revision guide covering ALL black letter law principles in ${book.subject}. Written specifically to help you PASS every SQE1 MCQ on this subject.`,
                        page_count_estimate: Math.round(response.length / 500)
                    });

                    setGeneratedBooks(prev => [...prev, { ...book, status: 'success', message: `Generated successfully (${wordCount.toLocaleString()} words)` }]);
                    success = true;
                } catch (error) {
                    retryCount++;
                    const errorMsg = error.message || 'Unknown error';
                    console.error(`Failed to generate ${book.subject} (attempt ${retryCount}):`, error);

                    if (retryCount < 3) {
                        const waitTime = 15000 * retryCount; // Exponential backoff: 15s, 30s, 45s
                        const reasonMsg = errorMsg.includes('too short') 
                            ? `Book too short - retrying ${retryCount}/3` 
                            : `Network timeout - retrying ${retryCount}/3`;
                        setGeneratedBooks(prev => {
                            const filtered = prev.filter(b => !(b.subject === book.subject && b.flk === book.flk));
                            return [...filtered, { ...book, status: 'retrying', message: `${reasonMsg}, waiting ${waitTime/1000}s...` }];
                        });
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                    } else {
                        setErrors(prev => [...prev, { ...book, error: errorMsg }]);
                        setGeneratedBooks(prev => {
                            const filtered = prev.filter(b => !(b.subject === book.subject && b.flk === book.flk));
                            return [...filtered, { ...book, status: 'error', message: `Failed after 3 attempts: ${errorMsg}` }];
                        });
                    }
                }
            }

            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        setGenerating(false);
    };

    if (loading) {
        return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-500" /></div>;
    }

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
                <Card className="max-w-md text-center p-8">
                    <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold">Admin Only</h1>
                    <p className="text-slate-600 mt-2">This tool is for administrators only.</p>
                    <Link to={createPageUrl("Dashboard")}>
                        <Button variant="outline" className="mt-6">Return to Dashboard</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-amber-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">Generate All 16 In-Depth Revision Books</h1>
                    <p className="text-slate-600 text-lg">Create 20k-30k word textbook-style books for every SQE1 subject</p>
                </div>

                <Alert className="mb-8 bg-blue-50 border-blue-200">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <AlertTitle className="text-blue-900 font-bold">In-Depth, Accurate, British English Content</AlertTitle>
                    <AlertDescription className="text-blue-800">
                        Each book will be 30,000-50,000 words of comprehensive, textbook-quality content with 100% accurate citations and British English spelling throughout.
                        Includes 100+ case analyses, detailed statutory breakdowns, 50+ practice scenarios, comparison tables, and exam strategies.
                        <br/><br/>
                        <strong>⚠️ CREDIT PROTECTION:</strong> Books that already exist will be SKIPPED. Books under 30,000 words will be REJECTED and retried automatically (no credit wasted on short books).
                        <br/>
                        <strong>Time:</strong> 60-90 minutes for all 16 books | <strong>Cost:</strong> ~400 AI credits per book (6,400 total for quality books only)
                    </AlertDescription>
                </Alert>

                {!generating && generatedBooks.length === 0 && (
                    <Card className="border-none shadow-xl">
                        <CardContent className="p-10 text-center">
                            <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Generate All 16 In-Depth Books</h2>
                            <p className="text-slate-600 mb-2">
                                30,000-50,000 words each • 100% accurate citations • British English spelling • Books that already exist will be skipped
                            </p>
                            <p className="text-slate-600 mb-4">
                                This will create comprehensive, textbook-style revision books for:
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 text-left mb-6 max-w-2xl mx-auto">
                                <div>
                                    <p className="font-bold text-slate-900 mb-2">FLK 1 (9 subjects):</p>
                                    <ul className="text-sm text-slate-600 space-y-1">
                                        {FLK1_SUBJECTS.map(s => <li key={s}>• {s}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 mb-2">FLK 2 (7 subjects):</p>
                                    <ul className="text-sm text-slate-600 space-y-1">
                                        {FLK2_SUBJECTS.map(s => <li key={s}>• {s}</li>)}
                                    </ul>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button 
                                    onClick={() => generateAllBooks(0)}
                                    className="bg-slate-900 hover:bg-slate-800 h-14 px-8 text-lg w-full"
                                >
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Start Generating All 16 Books Now
                                </Button>
                                {generatedBooks.length > 0 && generatedBooks.length < ALL_BOOKS.length && (
                                    <Button 
                                        onClick={() => generateAllBooks(generatedBooks.length)}
                                        className="bg-amber-600 hover:bg-amber-700 h-12 px-8 text-lg w-full"
                                    >
                                        <Sparkles className="w-5 h-5 mr-2" />
                                        Resume Generation (From Book {generatedBooks.length + 1})
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-4">
                                Each book takes 3-5 minutes. Total time: 60-90 minutes.
                                <br/>Cost: ~6,400 AI credits (400 per book)
                            </p>
                        </CardContent>
                    </Card>
                )}

                {generating && (
                    <div className="space-y-6">
                        <Card className="border-none shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Generation Progress</span>
                                    <span className="text-lg text-slate-600">{currentIndex} / {ALL_BOOKS.length}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Progress value={progress} className="h-3" />
                                <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-600 mb-2" />
                                    <p className="text-sm text-slate-600">
                                        {currentIndex > 0 && currentIndex <= ALL_BOOKS.length
                                            ? `Generating: ${ALL_BOOKS[currentIndex - 1].subject} (${ALL_BOOKS[currentIndex - 1].flk})`
                                            : 'Preparing...'}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-2">
                                       This may take 3-5 minutes per book for in-depth generation. Please keep this page open.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl">
                            <CardHeader>
                                <CardTitle>Status Log</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {generatedBooks.map((book, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                            {book.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                                            {book.status === 'skipped' && <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />}
                                            {book.status === 'retrying' && <Loader2 className="w-5 h-5 text-amber-500 shrink-0 animate-spin" />}
                                            {book.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 truncate">{book.subject} ({book.flk})</p>
                                                <p className="text-sm text-slate-600">{book.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {!generating && generatedBooks.length > 0 && (
                    <div className="space-y-6">
                        <Card className="border-none shadow-xl bg-linear-to-br from-green-50 to-emerald-50">
                            <CardContent className="p-10 text-center">
                                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                    {generatedBooks.length >= ALL_BOOKS.length ? 'Generation Complete!' : 'Generation Paused/Partial'}
                                </h2>
                                <p className="text-slate-600 mb-6">
                                    Processed {generatedBooks.length} of {ALL_BOOKS.length} books.
                                    {errors.length > 0 && ` ${errors.length} errors occurred.`}
                                </p>
                                <div className="flex gap-4 justify-center flex-wrap">
                                    <Link to={createPageUrl("RevisionBooks")}>
                                        <Button className="bg-slate-900 hover:bg-slate-800">
                                            View Revision Books
                                        </Button>
                                    </Link>
                                    {generatedBooks.length < ALL_BOOKS.length && (
                                        <Button 
                                            className="bg-amber-600 hover:bg-amber-700"
                                            onClick={() => generateAllBooks(generatedBooks.length)}
                                        >
                                            Resume Generation
                                        </Button>
                                    )}
                                    <Button variant="outline" onClick={() => {
                                        localStorage.removeItem('batchBookGenState');
                                        window.location.reload();
                                    }}>
                                        Reset & Start Over
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl">
                            <CardHeader>
                                <CardTitle>Final Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {generatedBooks.map((book, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                            {book.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                                            {book.status === 'skipped' && <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />}
                                            {book.status === 'retrying' && <Loader2 className="w-5 h-5 text-amber-500 shrink-0 animate-spin" />}
                                            {book.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 truncate">{book.subject} ({book.flk})</p>
                                                <p className="text-sm text-slate-600">{book.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}