"use client";
import React, { useState, useEffect } from 'react';
import { User, Question, MockExam } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileUp, Loader2, CheckCircle, XCircle, Lock, Info, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';

const mapAngoffToDifficulty = (angoffScore) => {
    if (angoffScore <= 0.4) return 'hard';
    if (angoffScore <= 0.75) return 'medium';
    return 'easy';
};

export default function BulkQuestionImporter() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [selectedFile, setSelectedFile] = useState(null);
  const [jsonTextContent, setJsonTextContent] = useState(''); // New state for pasted JSON
  const [examTitle, setExamTitle] = useState('');
  const [examType, setExamType] = useState('');
  const [timeLimit, setTimeLimit] = useState(90);

  const [status, setStatus] = useState('idle'); // idle, importing, success, error
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setUser(await User.me());
      } catch (e) {
        setUser(null);
      }
      setLoadingUser(false);
    };
    fetchUser();
  }, []);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);
      // Auto-populate title from filename
      setExamTitle(file.name.replace(/\.(json|txt)$/i, ''));
      // Clear text content if file is selected
      setJsonTextContent('');
    }
  };

  const parseJsonFromText = (text) => {
    if (!text || text.trim() === '') {
      throw new Error("No text provided to parse.");
    }
    
    // Aggressively clean the input
    let cleanText = text
      .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
      .replace(/[\u2018\u2019]/g, "'");  // Smart single quotes

    // Remove markdown fences if present
    cleanText = cleanText
      .replace(/^```json\s*/, '')       // Remove starting ```json
      .replace(/```$/, '')           // Remove ending ```
      .trim();

    // Find the start of the JSON object
    const startIndex = cleanText.indexOf('{');
    if (startIndex === -1) {
      throw new Error("Could not find a valid JSON object starting with '{' in the provided text.");
    }

    // Slice from the start of the object
    let potentialJson = cleanText.substring(startIndex);

    // Find the correct matching closing brace for the first opening brace.
    // This is more robust than `lastIndexOf` as it handles braces inside strings.
    let braceCount = 0;
    let inString = false;
    let lastBraceIndex = -1;

    for (let i = 0; i < potentialJson.length; i++) {
        const char = potentialJson[i];
        
        // Toggle inString state, being careful about escaped quotes
        // Check `i === 0` to prevent `potentialJson[i-1]` for the first character
        if (char === '"' && (i === 0 || potentialJson[i-1] !== '\\')) {
            inString = !inString;
        }

        if (!inString) { // Only count braces if not inside a string
            if (char === '{') braceCount++;
            else if (char === '}') braceCount--;
        }
        
        // If braceCount is 0 and we've just encountered a closing brace, it's the end of the main object.
        // `i > 0` ensures we've processed at least the opening brace and then a closing one.
        if (braceCount === 0 && i > 0 && char === '}') {
            lastBraceIndex = i;
            break; // Found the end of the main object
        }
    }
    
    if (lastBraceIndex !== -1) {
        // If a matching brace was found, extract up to and including it.
        potentialJson = potentialJson.substring(0, lastBraceIndex + 1);
    } 
    // If no matching brace was found, potentialJson retains its value (from the first '{' to end of input)
    // and JSON.parse will likely throw an "Unexpected end of JSON input" error, which we handle below.

    try {
        return JSON.parse(potentialJson);
    } catch (e) {
        // Final attempt: if the error is an unexpected end, try adding a brace.
        if (e.message.includes("Unexpected end of JSON input")) {
             try {
                return JSON.parse(potentialJson + '}');
            } catch (finalError) {
                 // If even the auto-fix fails, report the original error with a helpful message.
                 throw new Error(`JSON Parse error: The text appears to be incomplete or corrupted. Auto-fix failed. Original error: ${e.message}`);
            }
        }
        // For other JSON parse errors, report them directly.
        throw new Error(`JSON Parse error: ${e.message}. Please ensure the text is a valid, complete JSON object.`);
    }
  };

  // New common function to process and create exam after parsing JSON
  const processAndCreateExam = async (questionsData) => {
    if (!questionsData || !Array.isArray(questionsData)) {
      throw new Error('Invalid JSON format. The file/text must contain a top-level key "questions" which is an array, or be an array of questions directly.');
    }

    const questionsToCreate = questionsData.map(q => {
        const requiredKeys = ["question_text", "option_a", "option_b", "option_c", "option_d", "option_e", "correct_answer", "explanation", "angoff_score"];
        const missingKeys = requiredKeys.filter(key => !(key in q));
        if (missingKeys.length > 0) {
            throw new Error(`A question is missing required keys: ${missingKeys.join(', ')}`);
        }
        return {
            ...q,
            subject: examType.startsWith('FLK') ? 'Mixed' : examType,
            difficulty: mapAngoffToDifficulty(q.angoff_score)
        };
    });

    const createdQuestions = await Question.bulkCreate(questionsToCreate);
    const questionIds = createdQuestions.map(q => q.id);

    await MockExam.create({
      title: examTitle,
      description: `Imported via Bulk Question Importer.`,
      exam_type: examType,
      time_limit_minutes: timeLimit,
      question_ids: questionIds,
    });

    setSuccessMessage(`Successfully imported ${questionIds.length} questions and created the mock exam: "${examTitle}".`);
    setStatus('success');
    toast({
        title: "Import Successful",
        description: `Mock exam "${examTitle}" was created.`,
        variant: "success",
    });
  }

  const handleImportFromFile = async () => {
    if (!selectedFile || !examTitle || !examType) {
      setError("Please provide a file, exam title, and exam type.");
      return;
    }
    setStatus('importing');
    setError(null);
    setSuccessMessage('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileContent = event.target.result;
        const parsedData = parseJsonFromText(fileContent);
        // The structure expects a top-level key like {"questions": [...]}.
        // If the file directly contains an array of questions, parsedData.questions would be undefined.
        // We need to check if parsedData itself is an array or if it contains a 'questions' key that is an array.
        const questionsToProcess = parsedData.questions || parsedData;
        await processAndCreateExam(questionsToProcess);
      } catch (e) {
        console.error("Import error from file:", e);
        setError(`Import failed: ${e.message}`);
        setStatus('error');
      }
    };

    reader.onerror = () => {
        setError("Failed to read the file.");
        setStatus('error');
    };

    reader.readAsText(selectedFile);
  };
  
  const handleImportFromText = async () => {
    if (!jsonTextContent || !examTitle || !examType) {
      setError("Please paste JSON content and provide an exam title and type.");
      return;
    }
    setStatus('importing');
    setError(null);
    setSuccessMessage('');
    // Clear selected file if text content is used
    setSelectedFile(null);

    try {
      const parsedData = parseJsonFromText(jsonTextContent);
      // Similar check as in handleImportFromFile for flexibility.
      const questionsToProcess = parsedData.questions || parsedData;
      await processAndCreateExam(questionsToProcess);
    } catch (e) {
      console.error("Import error from text:", e);
      setError(`Import failed: ${e.message}. Please ensure you are pasting valid JSON content.`);
      setStatus('error');
    }
  }

  if (loadingUser) {
    return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10 flex items-center justify-center">
        <Card className="border-none shadow-xl p-10 text-center">
          <Lock className="w-16 h-16 text-amber-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Admin Access Required</h1>
          <p className="text-slate-600 mb-8">This tool is reserved for administrators.</p>
          <Link to={createPageUrl("Dashboard")}><Button variant="outline">Return to Dashboard</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center">
            <FileUp className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Bulk Question Importer</h1>
          <p className="text-slate-600 text-lg">Import pre-formatted JSON files or text to create mock exams without using AI credits.</p>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader className="p-6">
            <CardTitle className="text-xl font-bold text-slate-900">Import from JSON</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-6">
             <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-700" />
                <AlertTitle className="text-blue-800">Instructions</AlertTitle>
                <AlertDescription className="text-blue-700">
                    This tool requires questions to be in a structured JSON format. You can use a free external tool like ChatGPT to format your typed-out questions. Simply provide the AI with your text and ask it to return a JSON object with the required structure. This process uses zero AI credits.
                </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="exam-title">Mock Exam Title</Label>
              <Input id="exam-title" value={examTitle} onChange={e => setExamTitle(e.target.value)} placeholder="e.g., FLK 2 Complex Wills Mock" disabled={status === 'importing'} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exam-type">Exam Type</Label>
                <Select value={examType} onValueChange={setExamType} disabled={status === 'importing'}>
                  <SelectTrigger id="exam-type"><SelectValue placeholder="Select exam type..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLK 1">FLK 1</SelectItem>
                    <SelectItem value="FLK 2">FLK 2</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                <Input id="time-limit" type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} disabled={status === 'importing'} />
              </div>
            </div>

            <Tabs defaultValue="file" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">From File</TabsTrigger>
                <TabsTrigger value="text">From Text</TabsTrigger>
              </TabsList>
              <TabsContent value="file" className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">JSON/TXT File</Label>
                    <Input id="file-upload" type="file" onChange={handleFileChange} accept=".json,.txt" disabled={status === 'importing'} />
                  </div>
                  <Button onClick={handleImportFromFile} disabled={status === 'importing' || !selectedFile || !examTitle || !examType} className="w-full h-12">
                    {status === 'importing' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileUp className="w-4 h-4 mr-2" />}
                    {status === 'importing' ? 'Importing...' : 'Import From File'}
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="text" className="pt-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="json-content">Paste JSON Content</Label>
                      <Textarea
                        id="json-content"
                        value={jsonTextContent}
                        onChange={(e) => setJsonTextContent(e.target.value)}
                        placeholder='Paste your JSON content here. It must contain a top-level JSON object like {"questions": [...]}. Markdown fences (```json) will be automatically removed.'
                        className="h-48 font-mono text-xs"
                        disabled={status === 'importing'}
                      />
                    </div>
                    <Button onClick={handleImportFromText} disabled={status === 'importing' || !jsonTextContent || !examTitle || !examType} className="w-full h-12">
                      {status === 'importing' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                      {status === 'importing' ? 'Importing...' : 'Import From Text'}
                    </Button>
                </div>
              </TabsContent>
            </Tabs>

            {status === 'success' && (
              <Alert variant="success" className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
            {status === 'error' && (
              <Alert variant="destructive" className="mt-4">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
