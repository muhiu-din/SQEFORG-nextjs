"use client";
import React, { useState, useEffect } from "react";
//call api entities here
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Plus, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const FLK1_SUBJECTS = ["Business Law & Practice", "Dispute Resolution", "Contract Law", "Tort Law", "The Legal System of England & Wales", "Constitutional & Administrative Law", "Legal Services", "Ethics & Professional Conduct"];
const FLK2_SUBJECTS = ["Property Practice", "Wills & Administration of Estates", "Solicitors Accounts", "Land Law", "Trusts", "Criminal Law", "Criminal Practice"];

export default function CreateMockExam() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState(153);
  const [examType, setExamType] = useState("Mixed");
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const data = await Question.list();
    setQuestions(data);
    setLoading(false);
  };

  const handleExamTypeChange = (newType) => {
    setExamType(newType);
    setSelectedQuestions([]);
  };

  const toggleQuestion = (questionId) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      await MockExam.create({
        title,
        description,
        exam_type: examType,
        time_limit_minutes: timeLimit,
        question_ids: selectedQuestions
      });
      navigate(createPageUrl("MockExams"));
    } catch (err) {
      setError("Failed to create mock exam. Please try again.");
      console.error("Error creating mock exam:", err);
      setCreating(false);
    }
  };

  const difficultyColors = {
    easy: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    hard: "bg-red-100 text-red-800"
  };
  
  const filteredQuestions = questions.filter(q => {
    if (examType === 'FLK 1') return FLK1_SUBJECTS.includes(q.subject);
    if (examType === 'FLK 2') return FLK2_SUBJECTS.includes(q.subject);
    return true;
  });
  
  const QuestionList = ({ questionsToList }) => (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {questionsToList.map((question) => (
        <div
          key={question.id}
          className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <Checkbox
            checked={selectedQuestions.includes(question.id)}
            onCheckedChange={() => toggleQuestion(question.id)}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${difficultyColors[question.difficulty]} text-xs`}>
                {question.difficulty}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {question.subject}
              </Badge>
            </div>
            <p className="text-slate-900 text-sm">{question.question_text}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("MockExams"))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Create Mock Exam</h1>
            <p className="text-slate-600 mt-1">Build a custom practice exam</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-xl font-bold text-slate-900">Exam Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="title">Exam Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., SQE Practice Exam 1"
                  required
                  className="mt-2 h-12"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description of this exam"
                  className="mt-2 h-24"
                />
              </div>

              <div>
                <Label htmlFor="timeLimit">Time Limit (minutes) *</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                  min="1"
                  required
                  className="mt-2 h-12"
                />
              </div>
               <div>
                  <Label htmlFor="examType">Exam Type *</Label>
                   <Select value={examType} onValueChange={handleExamTypeChange}>
                        <SelectTrigger className="mt-2 h-12"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="FLK 1">FLK 1</SelectItem>
                            <SelectItem value="FLK 2">FLK 2</SelectItem>
                            <SelectItem value="Mixed">Mixed</SelectItem>
                        </SelectContent>
                    </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-slate-900">Select Questions</CardTitle>
                <Badge variant="outline">
                  {selectedQuestions.length} selected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Alert className="mb-4 bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-700" />
                <AlertDescription className="text-blue-700">
                  {examType === 'FLK 1' && "Showing only questions from FLK 1 subjects."}
                  {examType === 'FLK 2' && "Showing only questions from FLK 2 subjects."}
                  {examType === 'Mixed' && "Showing all questions from all subjects."}
                </AlertDescription>
              </Alert>
              {loading ? (
                <p>Loading questions...</p>
              ) : filteredQuestions.length === 0 ? (
                <p>No questions available for the selected exam type.</p>
              ) : (
                <QuestionList questionsToList={filteredQuestions} />
              )}
            </CardContent>
          </Card>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(createPageUrl("MockExams"))}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title || selectedQuestions.length === 0 || creating}
              className="flex-1 h-12 bg-slate-900 hover:bg-slate-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              {creating ? "Creating..." : "Create Exam"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}