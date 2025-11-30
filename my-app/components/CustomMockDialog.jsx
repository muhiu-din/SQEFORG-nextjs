import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Sparkles, Play, Shield, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ALL_SUBJECTS = [
  "Business Law & Practice", "Contract Law", "Tort Law", "Dispute Resolution",
  "Property Practice", "Land Law", "Wills & Administration of Estates", "Trusts",
  "Criminal Law", "Criminal Practice", "Solicitors Accounts",
  "Constitutional & Administrative Law", "EU Law",
  "The Legal System of England & Wales", "Legal Services", "Ethics & Professional Conduct"
];

const FLK1_SUBJECTS = ["Business Law & Practice", "Contract Law", "Tort Law", "Dispute Resolution", "Constitutional & Administrative Law", "EU Law", "The Legal System of England & Wales", "Legal Services"];
const FLK2_SUBJECTS = ["Property Practice", "Land Law", "Wills & Administration of Estates", "Trusts", "Criminal Law", "Criminal Practice", "Solicitors Accounts", "Ethics & Professional Conduct"];

export default function CustomMockDialog({ trigger }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const [mode, setMode] = useState('quick');
  
  const [quickNumQuestions, setQuickNumQuestions] = useState(90);
  const [quickExamType, setQuickExamType] = useState('Mixed');
  const [quickDifficulty, setQuickDifficulty] = useState('mixed');
  
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [questionsPerSubject, setQuestionsPerSubject] = useState(10);
  const [advancedDifficulty, setAdvancedDifficulty] = useState('mixed');
  const [timeLimit, setTimeLimit] = useState(153);
  const [customTimeLimit, setCustomTimeLimit] = useState(153);
  const [timeLimitMode, setTimeLimitMode] = useState('official');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setCheckingUser(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
    setCheckingUser(false);
  };

  // ADMIN ONLY CHECK
  const isAdmin = user?.role === 'admin';

  const handleSubjectToggle = (subject) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleSelectAllFLK1 = () => setSelectedSubjects(FLK1_SUBJECTS);
  const handleSelectAllFLK2 = () => setSelectedSubjects(FLK2_SUBJECTS);
  const handleSelectAll = () => setSelectedSubjects(ALL_SUBJECTS);
  const handleClearAll = () => setSelectedSubjects([]);

  const calculateTimeLimit = () => {
    if (mode === 'quick') {
      if (timeLimitMode === 'official') {
        return quickNumQuestions === 90 ? 153 : Math.round(quickNumQuestions * 1.7);
      }
      if (timeLimitMode === 'proportional') {
        return Math.round(quickNumQuestions * 1.7);
      }
      return customTimeLimit;
    } else {
      const totalQuestions = selectedSubjects.length * questionsPerSubject;
      if (timeLimitMode === 'official') {
        return totalQuestions === 90 ? 153 : Math.round(totalQuestions * 1.7);
      }
      if (timeLimitMode === 'proportional') {
        return Math.round(totalQuestions * 1.7);
      }
      return customTimeLimit;
    }
  };

  const handleCreateQuick = async () => {
    setLoading(true);
    try {
      let subjectsPool = quickExamType === 'FLK 1' ? FLK1_SUBJECTS : quickExamType === 'FLK 2' ? FLK2_SUBJECTS : ALL_SUBJECTS;

      const questionsPerSubject = Math.floor(quickNumQuestions / subjectsPool.length);
      const remainder = quickNumQuestions % subjectsPool.length;

      const questionIds = [];
      for (let i = 0; i < subjectsPool.length; i++) {
        const subject = subjectsPool[i];
        const numForSubject = questionsPerSubject + (i < remainder ? 1 : 0);
        
        let subjectQuestions = await base44.entities.Question.filter({ subject }, '-created_date', 100);
        
        if (quickDifficulty !== 'mixed') {
          subjectQuestions = subjectQuestions.filter(q => q.difficulty === quickDifficulty);
        }
        
        const shuffled = subjectQuestions.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, numForSubject);
        questionIds.push(...selected.map(q => q.id));
      }

      const calculatedTimeLimit = calculateTimeLimit();
      
      const mockExam = await base44.entities.MockExam.create({
        title: `Custom ${quickExamType} Mock - ${new Date().toLocaleDateString()}`,
        description: `${quickNumQuestions} questions, ${quickDifficulty} difficulty`,
        exam_type: quickExamType,
        difficulty: quickDifficulty,
        time_limit_minutes: calculatedTimeLimit,
        question_ids: questionIds
      });

      setOpen(false);
      navigate(createPageUrl("TakeExam") + `?examId=${mockExam.id}`);
    } catch (error) {
      console.error("Failed to create mock:", error);
      alert("Failed to create custom mock exam. Please try again.");
    }
    setLoading(false);
  };

  const handleCreateAdvanced = async () => {
    if (selectedSubjects.length === 0) {
      alert("Please select at least one subject");
      return;
    }

    setLoading(true);
    try {
      const questionIds = [];
      
      for (const subject of selectedSubjects) {
        let subjectQuestions = await base44.entities.Question.filter({ subject }, '-created_date', 100);
        
        if (advancedDifficulty !== 'mixed') {
          subjectQuestions = subjectQuestions.filter(q => q.difficulty === advancedDifficulty);
        }
        
        const shuffled = subjectQuestions.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, questionsPerSubject);
        questionIds.push(...selected.map(q => q.id));
      }

      const calculatedTimeLimit = calculateTimeLimit();
      const totalQuestions = selectedSubjects.length * questionsPerSubject;

      const mockExam = await base44.entities.MockExam.create({
        title: `Custom Multi-Subject Mock - ${new Date().toLocaleDateString()}`,
        description: `${totalQuestions} questions across ${selectedSubjects.length} subjects`,
        exam_type: 'Mixed',
        difficulty: advancedDifficulty,
        time_limit_minutes: calculatedTimeLimit,
        question_ids: questionIds
      });

      setOpen(false);
      navigate(createPageUrl("TakeExam") + `?examId=${mockExam.id}`);
    } catch (error) {
      console.error("Failed to create mock:", error);
      alert("Failed to create custom mock exam. Please try again.");
    }
    setLoading(false);
  };

  const totalAdvancedQuestions = selectedSubjects.length * questionsPerSubject;
  const estimatedTimeAdvanced = calculateTimeLimit();

  // ADMIN CHECK: Don't render for non-admins
  if (checkingUser) {
    return null;
  }

  if (!isAdmin) {
    return null; // Don't show the button/dialog to non-admins
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 gap-2">
            <Sparkles className="w-4 h-4" />
            Create Custom Mock
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            Create Custom Mock Exam (Admin Only)
          </DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={setMode} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick">Quick Setup</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-6 mt-6">
            <div>
              <Label htmlFor="quick-num">Number of Questions</Label>
              <Input
                id="quick-num"
                type="number"
                value={quickNumQuestions}
                onChange={(e) => setQuickNumQuestions(parseInt(e.target.value) || 90)}
                min="10"
                max="180"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="quick-type">Exam Type</Label>
              <Select value={quickExamType} onValueChange={setQuickExamType}>
                <SelectTrigger id="quick-type" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FLK 1">FLK 1</SelectItem>
                  <SelectItem value="FLK 2">FLK 2</SelectItem>
                  <SelectItem value="Mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quick-difficulty">Difficulty</Label>
              <Select value={quickDifficulty} onValueChange={setQuickDifficulty}>
                <SelectTrigger id="quick-difficulty" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">Mixed</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCreateQuick}
              disabled={loading}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Play className="w-5 h-5 mr-2" />}
              Create & Start Exam
            </Button>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6 mt-6">
            <div>
              <Label>Select Subjects</Label>
              <div className="flex gap-2 mt-2 mb-3">
                <Button type="button" onClick={handleSelectAllFLK1} variant="outline" size="sm">FLK 1</Button>
                <Button type="button" onClick={handleSelectAllFLK2} variant="outline" size="sm">FLK 2</Button>
                <Button type="button" onClick={handleSelectAll} variant="outline" size="sm">All</Button>
                <Button type="button" onClick={handleClearAll} variant="outline" size="sm">Clear</Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-3 border rounded-lg">
                {ALL_SUBJECTS.map(subject => (
                  <div key={subject} className="flex items-center space-x-2">
                    <Checkbox
                      id={subject}
                      checked={selectedSubjects.includes(subject)}
                      onCheckedChange={() => handleSubjectToggle(subject)}
                    />
                    <label htmlFor={subject} className="text-sm cursor-pointer">
                      {subject}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Questions Per Subject</Label>
                <Input
                  type="number"
                  value={questionsPerSubject}
                  onChange={(e) => setQuestionsPerSubject(parseInt(e.target.value) || 10)}
                  min="1"
                  max="50"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Difficulty</Label>
                <Select value={advancedDifficulty} onValueChange={setAdvancedDifficulty}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleCreateAdvanced}
              disabled={loading || selectedSubjects.length === 0}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Play className="w-5 h-5 mr-2" />}
              Create Custom Exam ({totalAdvancedQuestions} questions)
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}