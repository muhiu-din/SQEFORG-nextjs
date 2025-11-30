"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RevisionBook, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, BookOpen, Sparkles, Lock } from 'lucide-react';
import Link from 'next/link';
import { createPageUrl } from '@/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const FLK1_SUBJECTS = ["Business Law & Practice", "Dispute Resolution", "Contract Law", "Tort Law", "The Legal System of England & Wales", "Constitutional & Administrative Law", "Legal Services", "Ethics & Professional Conduct"];
const FLK2_SUBJECTS = ["Property Practice", "Wills & Administration of Estates", "Solicitors Accounts", "Land Law", "Trusts", "Criminal Law", "Criminal Practice"];

export default function AdminRevisionBookGenerator() {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [flkType, setFlkType] = useState('FLK 1');
    const [subject, setSubject] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');
    const [customPrompt, setCustomPrompt] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
            } catch (e) {
                setUser(null);
            }
            setLoadingUser(false);
        };
        fetchUser();
    }, []);

    const availableSubjects = flkType === 'FLK 1' ? FLK1_SUBJECTS : FLK2_SUBJECTS;

    const handleGenerate = async () => {
        if (!subject) return;
        setGenerating(true);
        setGeneratedContent('');

        const basePrompt = `You are an expert legal educator and SQE examiner creating a COMPREHENSIVE TEXTBOOK-STYLE revision book for the SQE1 ${flkType} exam.

Create a complete, authoritative revision book for: **${subject}**

This must be a PROPER BOOK with extensive depth, not just notes. Think of this as a published textbook chapter.

# STRUCTURE REQUIREMENTS:

## PART 1: FOUNDATIONS (15-20% of content)
- Introduction to the subject area
- Historical context and development
- Key terminology and definitions (comprehensive glossary-style)
- Overview of relevant legislation and case law hierarchy
- Relationship to other SQE topics

## PART 2: CORE PRINCIPLES (50-60% of content)
For EACH major topic area, include:

### Topic Structure:
- **Overview** - What this topic covers and why it matters for SQE
- **The Legal Framework** - All relevant statutes, sections, subsections with full citations
- **Key Principles** - Detailed explanation of each principle with examples
- **Leading Cases** - For each major case include:
  - Full case name and citation
  - Detailed facts (not just "brief" - full context)
  - Legal issue and arguments
  - Court's reasoning (ratio decidendi)
  - Judgment and key quotes
  - Significance and application today
  - How it's tested in SQE (specific scenarios)
- **Statutory Provisions** - Full text of key sections with line-by-line analysis
- **Practical Application** - Multiple worked examples showing how principles apply
- **Common Mistakes** - What students get wrong and why
- **Exam Scenarios** - 3-5 detailed practice scenarios per topic with full analysis

## PART 3: ADVANCED TOPICS (15-20% of content)
- Complex interactions between principles
- Controversial areas and academic debates
- Recent developments and reforms
- Comparative analysis where relevant
- Problem-solving frameworks and flowcharts

## PART 4: EXAM STRATEGY (10-15% of content)
- Topic-by-topic exam breakdown
- How questions are structured
- Time management strategies
- Common traps and pitfalls
- Model answers and approaches
- Self-assessment checklist

# FORMATTING REQUIREMENTS:

Use extensive Markdown formatting:
- # Part Headings
- ## Chapter Headings  
- ### Section Headings
- #### Subsection Headings
- **Bold** for key terms, case names, statutes
- *Italics* for Latin terms, emphasis
- > Blockquotes for important principles and exam tips
- Tables for comparisons, timelines, distinctions
- Numbered lists for processes and steps
- Bullet points for elements and factors
- Code blocks for statutory text
- Horizontal rules (---) between major sections

# SPECIAL SECTIONS TO INCLUDE:

Throughout the book, insert:
- 📚 **Case Study:** Deep dives into landmark cases
- ⚖️ **Statute Focus:** Detailed statutory analysis
- ⚠️ **Exam Alert:** Common traps and mistakes  
- 💡 **Pro Tip:** Advanced insights and shortcuts
- 🎯 **Practice Question:** Exam-style scenarios with full answers
- 📊 **Comparison Table:** Side-by-side analysis
- 🔄 **Flowchart:** Decision-making processes
- 📝 **Summary:** Chapter summaries and key takeaways
- 🔍 **Deep Dive:** Extended analysis of complex issues
- ⏱️ **Quick Revision:** One-page topic summaries

# DEPTH REQUIREMENTS:

- Minimum 30-50 pages (20,000-30,000 words)
- Each major case should get 300-500 words of analysis
- Each principle should have at least 3 practical examples
- Include at least 15-20 detailed practice scenarios throughout
- Provide 50+ case citations with detailed analysis
- Cover ALL statutory provisions relevant to the topic
- Include 10+ comparison tables
- Provide 5+ flowcharts or decision trees
- End each chapter with comprehensive summary

# WRITING STYLE:

- Professional but accessible
- Use active voice
- Define ALL technical terms when first used
- Provide context and rationale, not just rules
- Explain WHY rules exist and HOW they work in practice
- Include real-world examples alongside legal principles
- Use signposting ("First...", "In contrast...", "Importantly...")
- Cross-reference related topics extensively

# CRITICAL: 
This is a COMPLETE REVISION BOOK, not a summary. Students should be able to learn this entire subject area from this book alone. It should rival commercial SQE revision guides in depth and quality.

Subject to cover: **${subject}**
Target: SQE1 ${flkType} Exam

${customPrompt ? `\n\n# ADDITIONAL CUSTOM INSTRUCTIONS:\n${customPrompt}` : ''}`;

        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: basePrompt,
                add_context_from_internet: true
            });

            setGeneratedContent(response);
        } catch (error) {
            console.error("Failed to generate book:", error);
            alert("Failed to generate revision book. Please try again.");
        }

        setGenerating(false);
    };

    const handleSave = async () => {
        if (!generatedContent || !subject) return;

        try {
            await RevisionBook.create({
                title: `${subject} - Complete Revision Guide`,
                subject: subject,
                flk_type: flkType,
                content: generatedContent,
                summary: `Comprehensive exam-focused revision guide covering all key topics in ${subject} for SQE1 ${flkType}.`,
                page_count_estimate: Math.round(generatedContent.length / 500)
            });

            alert("Revision book saved successfully!");
            setGeneratedContent('');
            setSubject('');
        } catch (error) {
            console.error("Failed to save book:", error);
            alert("Failed to save revision book. Please try again.");
        }
    };

    if (loadingUser) {
        return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
    }

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
                <Card className="max-w-md text-center p-8">
                    <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold">Admin Only</h1>
                    <p className="text-slate-600 mt-2">This tool is for administrators only.</p>
                    <Link href={createPageUrl("Dashboard")}>
                        <Button variant="outline" className="mt-6">Return to Dashboard</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-amber-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">Revision Book Generator</h1>
                    <p className="text-slate-600 text-lg">Create comprehensive, exam-focused study guides</p>
                </div>

                <Alert className="mb-8 bg-blue-50 border-blue-200">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <AlertTitle className="text-blue-900 font-bold">AI-Powered Generation</AlertTitle>
                    <AlertDescription className="text-blue-800">
                        This tool uses AI with internet context to create comprehensive revision books covering all SQE1 topics. 
                        Each book is structured for exam success and includes cases, statutes, and practical tips.
                    </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-8">
                    <Card className="border-none shadow-xl">
                        <CardHeader>
                            <CardTitle>Book Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="flk-type">FLK Type</Label>
                                <Select value={flkType} onValueChange={setFlkType}>
                                    <SelectTrigger id="flk-type" className="h-12">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FLK 1">FLK 1</SelectItem>
                                        <SelectItem value="FLK 2">FLK 2</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="subject">Subject</Label>
                                <Select value={subject} onValueChange={setSubject}>
                                    <SelectTrigger id="subject" className="h-12">
                                        <SelectValue placeholder="Choose subject..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-96">
                                        {availableSubjects.map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="custom-prompt">Custom Instructions (Optional)</Label>
                                <Textarea
                                    id="custom-prompt"
                                    placeholder="e.g., Focus more on recent case law, include more diagrams..."
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    className="h-24"
                                />
                            </div>

                            <Button
                                onClick={handleGenerate}
                                disabled={!subject || generating}
                                className="w-full h-12 bg-slate-900 hover:bg-slate-800"
                            >
                                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                                {generating ? 'Generating...' : 'Generate Revision Book'}
                            </Button>

                            {generating && (
                                <div className="space-y-2">
                                    <p className="text-sm text-slate-500 text-center">
                                        Generating comprehensive textbook...
                                    </p>
                                    <p className="text-xs text-slate-400 text-center">
                                        This may take 60-120 seconds for in-depth content
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl">
                        <CardHeader>
                            <CardTitle>Generated Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {generatedContent ? (
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-lg max-h-[400px] overflow-y-auto">
                                        <pre className="text-sm whitespace-pre-wrap font-mono text-slate-700">
                                            {generatedContent.substring(0, 1000)}...
                                        </pre>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700">
                                            Save to Library
                                        </Button>
                                        <Link href={createPageUrl("RevisionBooks")} className="flex-1">
                                            <Button variant="outline" className="w-full">
                                                View Library
                                            </Button>
                                        </Link>
                                    </div>
                                    <p className="text-xs text-slate-500 text-center">
                                        Word count: ~{generatedContent.split(/\s+/).length} | 
                                        Est. pages: ~{Math.round(generatedContent.length / 500)}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-20 text-slate-400">
                                    <BookOpen className="w-16 h-16 mx-auto mb-4" />
                                    <p>Generated content will appear here...</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}