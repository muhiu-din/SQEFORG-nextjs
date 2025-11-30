"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileUp, Loader2, BookUp, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ALL_SUBJECTS = [
  "Business Law & Practice",
  "Contract Law",
  "Tort Law",
  "Dispute Resolution",
  "Property Practice",
  "Land Law",
  "Wills & Administration of Estates",
  "Trusts",
  "Criminal Law",
  "Criminal Practice",
  "Solicitors Accounts",
  "Constitutional & Administrative Law",
  "EU Law",
  "The Legal System of England & Wales",
  "Legal Services",
  "Ethics & Professional Conduct"
];

export default function AdminNoteGenerator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState(null);
  const [existingNotes, setExistingNotes] = useState([]);
  const [customPrompt, setCustomPrompt] = useState('');

  useEffect(() => {
    const initialize = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role === 'admin') {
          const notes = await base44.entities.StudyNote.list('-created_date');
          setExistingNotes(notes);
        }
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };
    initialize();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleGenerate = async () => {
    if (!file || !subject) {
      alert('Please select a file and subject.');
      return;
    }

    setGenerating(true);
    setProgress('Uploading file...');
    setResult(null);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setProgress('Creating uploaded file record...');
      const uploadedFileRecord = await base44.entities.UploadedFile.create({
        file_name: file.name,
        file_uri: file_url,
        file_type: file.type
      });

      setProgress('Extracting content from PDF...');
      const extractionResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract all text content from the uploaded PDF document. Return the full text content.`,
        file_urls: [file_url]
      });

      const extractedText = typeof extractionResult === 'string' ? extractionResult : JSON.stringify(extractionResult);

      setProgress('Generating comprehensive study notes...');
      
      const basePrompt = `You are an expert SQE1 tutor creating comprehensive, in-depth study notes.

**Source Material:** ${file.name}
**Subject:** ${subject}

Create DETAILED, COMPREHENSIVE study notes that include:

# ${subject} - Comprehensive Study Notes

## 1. Core Principles & Framework
- Fundamental legal principles explained in depth
- Key statutory provisions with full context
- Leading case law with detailed facts, holdings, and ratios
- Policy considerations and theoretical foundations

## 2. Detailed Topic Analysis
For each major topic within ${subject}:
- **Definition & Scope:** Precise legal definitions with nuances
- **Key Elements:** All constituent requirements explained thoroughly
- **Legal Tests & Standards:** Complete frameworks with application guidance
- **Exceptions & Defenses:** Comprehensive coverage of all exceptions
- **Procedural Aspects:** Step-by-step procedural requirements
- **Common Pitfalls:** Frequent mistakes and how to avoid them

## 3. Case Law Deep Dive
For each important case:
- Full case name and citation
- Detailed facts and procedural history
- Court's reasoning and legal analysis
- Ratio decidendi (binding precedent)
- Obiter dicta (persuasive statements)
- Practical significance and modern application
- How it differs from similar cases

## 4. Statutory Interpretation
- Full statutory provisions (key sections)
- Legislative intent and purpose
- Judicial interpretation over time
- Recent amendments and their impact
- Cross-references to related legislation

## 5. Practical Application
- Step-by-step problem-solving frameworks
- Common exam scenarios with model answers
- Tips for spotting issues in questions
- How to structure answers effectively
- Time management strategies

## 6. Visual Learning Aids
- Flow charts for decision-making processes
- Tables comparing similar concepts
- Timelines for procedural requirements
- Mind maps for topic interconnections

## 7. Memory Techniques
- Mnemonics for key lists and tests
- Acronyms for remembering elements
- Memorable phrases for principles
- Pattern recognition tips

## 8. Common Exam Issues
- Frequently tested areas
- Tricky distinctions to master
- Areas of recent development
- Cross-topic connections

## 9. Quick Reference Summary
- One-page cheat sheet of key points
- Essential cases to remember
- Critical statutory sections
- Formula/test templates

${customPrompt ? `\n## Additional Instructions:\n${customPrompt}` : ''}

**IMPORTANT:**
- Be comprehensive - aim for 3000-5000 words minimum
- Use clear headings and subheadings
- Include ALL relevant case law with full details
- Provide SPECIFIC statutory section numbers
- Give PRACTICAL examples for every principle
- Use markdown formatting extensively
- Make it suitable for complete topic mastery

Now generate the comprehensive study notes based on the extracted text.

**Extracted Text:**
${extractedText.substring(0, 15000)}`;

      const notesContent = await base44.integrations.Core.InvokeLLM({
        prompt: basePrompt
      });

      const finalContent = typeof notesContent === 'string' ? notesContent : JSON.stringify(notesContent);

      setProgress('Generating practice questions...');
      const miniMockPrompt = `Based on the ${subject} study notes, create 10 high-quality SQE1-style MCQ questions.

Each question should:
- Test understanding of key concepts covered in the notes
- Have 5 options (A, B, C, D, E)
- Include a detailed explanation
- Be at medium difficulty level
- Follow SQE1 question format

Return as a JSON array with this structure:
[
  {
    "question_text": "Question here...",
    "options": ["Option A", "Option B", "Option C", "Option D", "Option E"],
    "correct_answer_index": 0,
    "explanation": "Detailed explanation here..."
  },
  ...
]`;

      const miniMockResult = await base44.integrations.Core.InvokeLLM({
        prompt: miniMockPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question_text: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  correct_answer_index: { type: "number" },
                  explanation: { type: "string" }
                }
              }
            }
          }
        }
      });

      const miniMockQuestions = miniMockResult.questions || [];

      setProgress('Saving study notes to database...');
      const studyNote = await base44.entities.StudyNote.create({
        title: file.name.replace('.pdf', ''),
        subject: subject,
        content: finalContent,
        source_filename: file.name,
        mini_mock_questions: miniMockQuestions
      });

      setResult({
        success: true,
        note: studyNote,
        questionsGenerated: miniMockQuestions.length
      });

      setProgress('');
      
      const updatedNotes = await base44.entities.StudyNote.list('-created_date');
      setExistingNotes(updatedNotes);

    } catch (error) {
      console.error('Error generating notes:', error);
      setResult({
        success: false,
        error: error.message || 'An error occurred during generation'
      });
      setProgress('');
    }

    setGenerating(false);
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-500" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-10 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin Access Required</h1>
        <p className="text-slate-600">This tool is only accessible to administrators.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Study Note Generator</h1>
          <p className="text-slate-600">
            Generate comprehensive, in-depth study notes from PDF materials using AI.
          </p>
        </div>

        <Alert className="mb-6 border-blue-400 bg-blue-50">
          <AlertDescription className="text-blue-900">
            <strong>Enhanced Generation:</strong> This tool now creates comprehensive 3000-5000 word study notes with:
            detailed case law, statutory analysis, practical examples, visual learning aids, memory techniques, and 10 practice MCQs.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookUp className="w-5 h-5" />
                Generate New Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select subject..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_SUBJECTS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="file">Upload PDF</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {file && (
                  <p className="text-sm text-slate-600 mt-2">
                    Selected: {file.name}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="customPrompt">Custom Instructions (Optional)</Label>
                <Textarea
                  id="customPrompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="E.g., Focus on recent case law, emphasize practical examples, include comparison tables..."
                  rows={4}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generating || !file || !subject}
                className="w-full h-12"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {progress}
                  </>
                ) : (
                  <>
                    <FileUp className="w-5 h-5 mr-2" />
                    Generate Comprehensive Notes
                  </>
                )}
              </Button>

              {result && (
                <Alert className={result.success ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}>
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <AlertDescription className={result.success ? 'text-green-900' : 'text-red-900'}>
                    {result.success ? (
                      <>
                        <strong>Success!</strong> Generated comprehensive study notes for {result.note.subject}.
                        <br />
                        <small>Included {result.questionsGenerated} practice questions.</small>
                      </>
                    ) : (
                      <>
                        <strong>Error:</strong> {result.error}
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Existing Study Notes ({existingNotes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {existingNotes.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No study notes yet.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {existingNotes.slice(0, 10).map(note => (
                    <div key={note.id} className="p-3 bg-slate-50 rounded-lg border">
                      <p className="font-medium text-slate-900">{note.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{note.subject}</Badge>
                        <span className="text-xs text-slate-500">{note.source_filename}</span>
                      </div>
                      {note.mini_mock_questions && note.mini_mock_questions.length > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          {note.mini_mock_questions.length} practice questions
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Note:</strong> The AI generates comprehensive study notes including detailed case law analysis, 
            statutory interpretation, practical examples, visual aids, memory techniques, and practice questions. 
            Each note set is 3000-5000 words for complete topic coverage. Always review AI-generated content for accuracy.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}