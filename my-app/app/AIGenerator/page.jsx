"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, CheckCircle2, Lock, AlertCircle, Zap, BookOpen } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { createPageUrl } from '@/utils';
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

const ALL_SUBJECTS = [
  "Business Law & Practice", "Contract Law", "Tort Law", "Dispute Resolution",
  "Property Practice", "Land Law", "Wills & Administration of Estates", "Trusts",
  "Criminal Law", "Criminal Practice", "Solicitors Accounts",
  "Constitutional & Administrative Law", "EU Law",
  "The Legal System of England & Wales", "Legal Services", "Ethics & Professional Conduct"
];

const questionSchema = {
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
        tags: { type: "array", items: { type: "string" } }
    },
    required: ["question_text", "option_a", "option_b", "option_c", "option_d", "option_e", "correct_answer", "explanation"]
};

const GENERATION_TEMPLATES = {
  standard: "Generate a realistic SQE1-style multiple-choice question that tests practical legal knowledge.",
  scenario: "Create a complex scenario-based question with multiple parties and legal issues.",
  caseLaw: "Generate a question that requires application of case law principles to a factual scenario.",
  statutory: "Create a question testing interpretation and application of statutory provisions.",
  comparative: "Generate a question comparing similar legal concepts or distinguishing between related rules."
};

export default function AIGenerator() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    const [error, setError] = useState(null);
    const [generationMode, setGenerationMode] = useState('single');
    
    // Single generation
    const [subject, setSubject] = useState("Contract Law");
    const [difficulty, setDifficulty] = useState("medium");
    const [customPrompt, setCustomPrompt] = useState("");
    const [template, setTemplate] = useState("standard");
    const [tags, setTags] = useState("");
    
    // Bulk generation
    const [bulkSubjects, setBulkSubjects] = useState([]);
    const [bulkTier, setBulkTier] = useState("starter");
    const [bulkDifficulty, setBulkDifficulty] = useState("hard");
    const [bulkTemplate, setBulkTemplate] = useState("standard");
    
    const TIER_CONFIG = {
      starter: { questionsPerSubject: 31, label: "Starter Tier", total: 500 },
      pro: { questionsPerSubject: 93, label: "Pro Tier", total: 1488 },
      ultimate: { questionsPerSubject: 94, label: "Ultimate Tier", total: 1504 }
    };
    
    const [progressMessage, setProgressMessage] = useState("");

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

    const generateSingleQuestion = async (subj, diff, prompt, templ, tagList) => {
      const templatePrompt = GENERATION_TEMPLATES[templ] || GENERATION_TEMPLATES.standard;
      
      const fullPrompt = `${templatePrompt}

      - Subject: ${subj}
      - Difficulty: ${diff}
      - Focus: ${prompt || 'Core principles and practical scenarios within this subject'}
      
      CRITICAL REQUIREMENTS:
      1. Create a realistic, exam-quality question with a clear factual scenario
      2. ALL 5 OPTIONS (A-E) MUST BE SIMILAR IN STRUCTURE, LENGTH, AND PLAUSIBILITY
         - Each option should be a complete, professional legal conclusion or statement
         - All options must sound equally correct at first glance
         - Avoid obvious wrong answers like "None of the above" or clearly incorrect statements
         - Make each distractor based on common legal misconceptions or related principles
      3. SINGLE BEST ANSWER FORMAT:
         - Only ONE option is the correct/best answer
         - Other 4 options should be plausible but incorrect for specific legal reasons
         - Each wrong answer should represent a realistic mistake a student might make
      4. Provide detailed explanation with case law or statutory references where appropriate
      5. Include Angoff score (0.0-1.0: probability a minimally competent candidate would answer correctly)
      6. Add relevant tags for categorization (e.g., ["contract formation", "offer and acceptance"])
      7. Use complex scenarios with multiple parties, timelines, and legal issues
      
      ${tagList ? `Suggested tags: ${tagList}` : ''}`;

      const response = await base44.integrations.Core.InvokeLLM({ 
        prompt: fullPrompt, 
        response_json_schema: questionSchema 
      });
      
      const questionData = {
        subject: subj,
        difficulty: diff,
        question_text: response.question_text,
        option_a: response.option_a,
        option_b: response.option_b,
        option_c: response.option_c,
        option_d: response.option_d,
        option_e: response.option_e,
        correct_answer: response.correct_answer,
        explanation: response.explanation,
        angoff_score: response.angoff_score || 0.6,
        tags: response.tags || []
      };
      
      return await base44.entities.Question.create(questionData);
    };

    const handleGenerateSingle = async () => {
        setIsGenerating(true);
        setError(null);
        setGeneratedQuestions([]);
        setProgressMessage("Generating question...");

        try {
            const question = await generateSingleQuestion(subject, difficulty, customPrompt, template, tags);
            setGeneratedQuestions([question]);
            setProgressMessage("Question generated successfully!");
        } catch (err) {
            setError(`Failed to generate question: ${err.message}`);
        }
        
        setIsGenerating(false);
    };

    const handleBulkSubjectToggle = (subj) => {
      setBulkSubjects(prev => 
        prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj]
      );
    };

    const handleGenerateBulk = async () => {
      if (bulkSubjects.length === 0) {
        alert("Please select at least one subject");
        return;
      }

      setIsGenerating(true);
      setError(null);
      setGeneratedQuestions([]);
      
      const questionsPerSubject = TIER_CONFIG[bulkTier].questionsPerSubject;
      const totalToGenerate = bulkSubjects.length * questionsPerSubject;
      let generated = 0;

      try {
        for (const subj of bulkSubjects) {
          for (let i = 0; i < questionsPerSubject; i++) {
            setProgressMessage(`Generating ${subj} question ${i + 1}/${questionsPerSubject}... (${generated + 1}/${totalToGenerate} total)`);
            
            const diff = bulkDifficulty === 'mixed' 
              ? ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)]
              : bulkDifficulty;
            
            const question = await generateSingleQuestion(subj, diff, '', bulkTemplate, '');
            setGeneratedQuestions(prev => [...prev, question]);
            generated++;
          }
        }
        
        setProgressMessage(`Successfully generated ${totalToGenerate} questions!`);
      } catch (err) {
        setError(`Error during bulk generation: ${err.message}`);
      }
      
      setIsGenerating(false);
    };
    
    if (loading) return (
      <div className="p-10 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      </div>
    );

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
                <Card className="max-w-md text-center p-8">
                    <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold">Access Denied</h1>
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
                    <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-amber-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">AI Question Generator</h1>
                    <p className="text-slate-600 text-lg">Generate EQUAL amounts per subject for fair distribution</p>
                    <p className="text-xs text-slate-500 mt-2">⚖️ Starter: 31/subject • Pro: 93/subject • Ultimate: 94/subject</p>
                </div>

                <Tabs value={generationMode} onValueChange={setGenerationMode} className="mb-8">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="single">Single Question</TabsTrigger>
                    <TabsTrigger value="bulk">Bulk Generation</TabsTrigger>
                  </TabsList>

                  <TabsContent value="single" className="mt-6">
                    <Card className="border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Zap className="w-5 h-5 text-amber-500" />
                              Single Question Generator
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="subject">Subject</Label>
                                    <Select id="subject" value={subject} onValueChange={setSubject} disabled={isGenerating}>
                                        <SelectTrigger className="mt-2">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-96">
                                            {ALL_SUBJECTS.map(s => (
                                              <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="difficulty">Difficulty</Label>
                                    <Select id="difficulty" value={difficulty} onValueChange={setDifficulty} disabled={isGenerating}>
                                        <SelectTrigger className="mt-2">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="easy">Easy</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="hard">Hard</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="template">Question Template</Label>
                              <Select value={template} onValueChange={setTemplate} disabled={isGenerating}>
                                <SelectTrigger id="template" className="mt-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="standard">Standard Question</SelectItem>
                                  <SelectItem value="scenario">Complex Scenario</SelectItem>
                                  <SelectItem value="caseLaw">Case Law Application</SelectItem>
                                  <SelectItem value="statutory">Statutory Interpretation</SelectItem>
                                  <SelectItem value="comparative">Comparative Analysis</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                                <Label htmlFor="custom-prompt">Custom Focus (Optional)</Label>
                                <Textarea
                                  id="custom-prompt"
                                  placeholder="e.g., 'Create a scenario involving agency law and apparent authority' or 'Test knowledge of equitable remedies in contract breach'"
                                  value={customPrompt}
                                  onChange={e => setCustomPrompt(e.target.value)}
                                  disabled={isGenerating}
                                  className="mt-2"
                                  rows={3}
                                />
                            </div>
                            
                            <div>
                              <Label htmlFor="tags-input">Tags (comma-separated)</Label>
                              <Input
                                id="tags-input"
                                placeholder="e.g., offer and acceptance, postal rule, timing"
                                value={tags}
                                onChange={e => setTags(e.target.value)}
                                disabled={isGenerating}
                                className="mt-2"
                              />
                            </div>
                            
                            <Button 
                              onClick={handleGenerateSingle} 
                              disabled={isGenerating} 
                              className="w-full h-12 bg-slate-900 hover:bg-slate-800"
                            >
                                {isGenerating ? (
                                  <Loader2 className="w-5 h-5 animate-spin mr-2"/>
                                ) : (
                                  <Sparkles className="w-5 h-5 mr-2" />
                                )}
                                Generate Question
                            </Button>
                        </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="bulk" className="mt-6">
                    <Card className="border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <BookOpen className="w-5 h-5 text-blue-500" />
                              Bulk Question Generator
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                              <Label>Select Subjects for Generation</Label>
                              <div className="grid grid-cols-2 gap-2 mt-2 max-h-60 overflow-y-auto p-3 border rounded-lg bg-slate-50">
                                {ALL_SUBJECTS.map(subj => (
                                  <div key={subj} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`bulk-${subj}`}
                                      checked={bulkSubjects.includes(subj)}
                                      onCheckedChange={() => handleBulkSubjectToggle(subj)}
                                      disabled={isGenerating}
                                    />
                                    <label
                                      htmlFor={`bulk-${subj}`}
                                      className="text-sm cursor-pointer leading-tight"
                                    >
                                      {subj}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              {bulkSubjects.length > 0 && (
                                <p className="text-sm text-slate-600 mt-2">
                                  Selected: {bulkSubjects.length} subject{bulkSubjects.length !== 1 && 's'}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label htmlFor="bulk-tier">Subscription Tier</Label>
                              <Select value={bulkTier} onValueChange={setBulkTier} disabled={isGenerating}>
                                <SelectTrigger id="bulk-tier" className="mt-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="starter">
                                    Starter - 31 questions per subject (500 total)
                                  </SelectItem>
                                  <SelectItem value="pro">
                                    Pro - 93 questions per subject (1,488 total)
                                  </SelectItem>
                                  <SelectItem value="ultimate">
                                    Ultimate - 94 questions per subject (1,504 total)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <Alert className="mt-3 bg-blue-50 border-blue-200">
                                <AlertDescription className="text-sm text-blue-900">
                                  <strong>⚖️ Equal Distribution - {TIER_CONFIG[bulkTier].label}:</strong><br/>
                                  {TIER_CONFIG[bulkTier].questionsPerSubject} questions × {bulkSubjects.length || 16} subjects = {TIER_CONFIG[bulkTier].questionsPerSubject * (bulkSubjects.length || 16)} questions total<br/>
                                  <span className="text-xs">Every subject gets exactly the same amount - completely fair</span>
                                </AlertDescription>
                              </Alert>
                            </div>

                            <div>
                              <Label htmlFor="bulk-template">Question Style</Label>
                              <Select value={bulkTemplate} onValueChange={setBulkTemplate} disabled={isGenerating}>
                                <SelectTrigger id="bulk-template" className="mt-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="standard">Standard Questions</SelectItem>
                                  <SelectItem value="scenario">Complex Scenarios</SelectItem>
                                  <SelectItem value="caseLaw">Case Law Focus</SelectItem>
                                  <SelectItem value="statutory">Statutory Focus</SelectItem>
                                  <SelectItem value="comparative">Comparative Analysis</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {bulkSubjects.length > 0 && (
                              <Alert className="bg-green-50 border-green-200">
                                <AlertDescription className="text-green-900">
                                  Will generate <strong>{bulkSubjects.length * TIER_CONFIG[bulkTier].questionsPerSubject} questions</strong> for {TIER_CONFIG[bulkTier].label}
                                  <br />
                                  <span className="text-sm">
                                    {TIER_CONFIG[bulkTier].questionsPerSubject} per subject × {bulkSubjects.length} subjects = ~{bulkSubjects.length * TIER_CONFIG[bulkTier].questionsPerSubject} AI credits
                                  </span>
                                </AlertDescription>
                              </Alert>
                            )}

                            <Button 
                              onClick={handleGenerateBulk} 
                              disabled={isGenerating || bulkSubjects.length === 0} 
                              className="w-full h-12 bg-slate-900 hover:bg-slate-800"
                            >
                                {isGenerating ? (
                                  <Loader2 className="w-5 h-5 animate-spin mr-2"/>
                                ) : (
                                  <Sparkles className="w-5 h-5 mr-2" />
                                )}
                                Generate {bulkSubjects.length * TIER_CONFIG[bulkTier].questionsPerSubject} Questions
                            </Button>
                        </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
                
                {isGenerating && progressMessage && (
                    <Card className="mb-6 border-blue-200 bg-blue-50">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
                          <p className="text-slate-700 font-medium mb-3">{progressMessage}</p>
                          {generationMode === 'bulk' && (
                           <Progress 
                             value={(generatedQuestions.length / (bulkSubjects.length * TIER_CONFIG[bulkTier].questionsPerSubject)) * 100} 
                             className="w-full" 
                           />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                )}
                
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {generatedQuestions.length > 0 && (
                     <Card className="border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                                Generated Questions ({generatedQuestions.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {generatedQuestions.map((q, index) => (
                                <div key={index} className="p-4 border rounded-lg bg-white space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                      <p className="font-semibold text-slate-800 flex-1">{q.question_text}</p>
                                      <div className="flex gap-2">
                                        <Badge>{q.subject}</Badge>
                                        <Badge variant="outline">{q.difficulty}</Badge>
                                      </div>
                                    </div>
                                    
                                    <div className="text-sm space-y-1">
                                      <p className="text-green-700 font-medium">✓ Correct Answer: {q.correct_answer}</p>
                                      <p className="text-slate-600">{q.explanation}</p>
                                    </div>
                                    
                                    {q.tags && q.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {q.tags.map((tag, idx) => (
                                          <Badge key={idx} variant="secondary" className="text-xs">
                                            #{tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {q.angoff_score && (
                                      <p className="text-xs text-slate-500">
                                        Angoff Score: {(q.angoff_score * 100).toFixed(0)}% (estimated correct rate)
                                      </p>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}