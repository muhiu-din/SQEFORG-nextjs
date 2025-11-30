import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, AlertCircle, Flag } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Calculator from '../Calculator';
import Watermark from '../Watermark';

export default function SimulatorPart({ questions, title, timeLimitMinutes, onFinish, user, examMode = 'standard' }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimitMinutes ? timeLimitMinutes * 60 : null);
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questionTimes, setQuestionTimes] = useState({});

  const submitPart = useCallback(() => {
    let correctCount = 0;
    questions.forEach(question => {
      if (answers[question.id] === question.correct_answer) {
        correctCount++;
      }
    });
    
    // Convert flaggedQuestions Set to object for storage
    const flaggedQuestionsObject = {};
    flaggedQuestions.forEach(idx => {
      const questionId = questions[idx]?.id;
      if (questionId) {
        flaggedQuestionsObject[questionId] = true;
      }
    });
    
    onFinish(answers, correctCount, flaggedQuestionsObject, questionTimes);
  }, [questions, answers, flaggedQuestions, onFinish, questionTimes]);

  useEffect(() => {
    if (timeLimitMinutes && timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            submitPart();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, submitPart, timeLimitMinutes]);

  const handleAnswerSelect = (answer) => {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Record time spent on this question
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    setQuestionTimes(prev => ({
      ...prev,
      [currentQuestion.id]: (prev[currentQuestion.id] || 0) + timeSpent
    }));
    
    setAnswers({
      ...answers,
      [currentQuestion.id]: answer
    });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Record time before moving
      const currentQuestion = questions[currentQuestionIndex];
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      setQuestionTimes(prev => ({
        ...prev,
        [currentQuestion.id]: (prev[currentQuestion.id] || 0) + timeSpent
      }));
      
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Record time before moving
      const currentQuestion = questions[currentQuestionIndex];
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      setQuestionTimes(prev => ({
        ...prev,
        [currentQuestion.id]: (prev[currentQuestion.id] || 0) + timeSpent
      }));
      
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setQuestionStartTime(Date.now());
    }
  };

  const toggleFlag = () => {
    const newFlags = new Set(flaggedQuestions);
    if (newFlags.has(currentQuestionIndex)) {
      newFlags.delete(currentQuestionIndex);
    } else {
      newFlags.add(currentQuestionIndex);
    }
    setFlaggedQuestions(newFlags);
  };

  const jumpToQuestion = (index) => {
    // Record time before jumping
    const currentQuestion = questions[currentQuestionIndex];
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    setQuestionTimes(prev => ({
      ...prev,
      [currentQuestion.id]: (prev[currentQuestion.id] || 0) + timeSpent
    }));
    
    setCurrentQuestionIndex(index);
    setQuestionStartTime(Date.now());
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (questions.length === 0) {
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <Card className="max-w-md w-full border-none shadow-xl text-center">
                <CardHeader>
                    <CardTitle className="text-red-600">Loading Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Could not load questions for this part of the simulator. Please try again later.</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestion?.id];
  const answeredCount = Object.keys(answers).filter(questionId => answers[questionId] !== undefined).length;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 flex flex-col">
       <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-slate-200 z-20 p-6">
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                    <p className="text-slate-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
                    {examMode === 'unrestricted' && (
                      <p className="text-sm text-blue-600 font-semibold">Untimed Practice Mode</p>
                    )}
                    {examMode === 'adaptive' && (
                      <p className="text-sm text-amber-600 font-semibold">Adaptive Mode - Focus on Weak Areas</p>
                    )}
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-md">
                    <Calculator />
                    {timeRemaining !== null && (
                      <>
                        <div className="w-px h-6 bg-slate-200" />
                        <Clock className="w-5 h-5 text-slate-600" />
                        <span className={`font-mono text-lg font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-slate-900'}`}>
                            {formatTime(timeRemaining)}
                        </span>
                      </>
                    )}
                </div>
            </div>
            <Progress value={(answeredCount / questions.length) * 100} className="h-2" />
        </div>
      </div>

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 md:p-10 relative">
            <Watermark user={user} />
            {timeRemaining !== null && timeRemaining < 300 && (
            <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Less than 5 minutes remaining!</AlertDescription>
            </Alert>
            )}

            <Card className="border-none shadow-xl mb-6">
            <CardHeader className="p-8 border-b border-slate-100">
                <CardTitle className="text-xl leading-relaxed text-slate-900 whitespace-pre-wrap">
                {currentQuestion.question_text}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
                <div className="space-y-3">
                {['A', 'B', 'C', 'D', 'E'].map((option) => {
                    const optionText = currentQuestion[`option_${option.toLowerCase()}`];
                    const isSelected = selectedAnswer === option;

                    return (
                      <button
                          key={option}
                          onClick={() => handleAnswerSelect(option)}
                          className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                      >
                          <div className="flex items-start gap-4">
                          <span className="font-bold text-lg">{option}.</span>
                          <span className="flex-1">{optionText}</span>
                          </div>
                      </button>
                    );
                })}
                </div>
            </CardContent>
            </Card>

            <div className="flex gap-3">
            <Button
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                className="w-32 h-12"
            >
                Previous
            </Button>
            <Button
                onClick={toggleFlag}
                variant={flaggedQuestions.has(currentQuestionIndex) ? "destructive" : "outline"}
                className="flex-1 h-12 gap-2"
            >
                <Flag className="w-4 h-4" />
                {flaggedQuestions.has(currentQuestionIndex) ? "Unflag" : "Flag for Review"}
            </Button>
            {currentQuestionIndex === questions.length - 1 ? (
                <Button
                onClick={submitPart}
                className="w-32 h-12 bg-slate-900 hover:bg-slate-800"
                >
                Finish Part
                </Button>
            ) : (
                <Button
                onClick={nextQuestion}
                className="w-32 h-12 bg-slate-900 hover:bg-slate-800"
                >
                Next Question
                </Button>
            )}
            </div>
        </div>
        <div className="w-64 border-l border-slate-200 bg-white/50 p-4 overflow-y-auto hidden lg:block">
            <h3 className="font-bold text-slate-800 mb-4">Question Navigator</h3>
            <div className="grid grid-cols-5 gap-2">
                {questions.map((q, index) => {
                    const isFlagged = flaggedQuestions.has(index);
                    const isCurrent = currentQuestionIndex === index;
                    const isAnswered = answers[q.id] !== undefined;

                    let statusClass = "bg-slate-200 hover:bg-slate-300 text-slate-700";
                    if (isCurrent) {
                        statusClass = "bg-slate-900 text-white font-bold ring-2 ring-slate-900 ring-offset-2";
                    } else if (isFlagged) {
                        statusClass = "bg-amber-400 hover:bg-amber-500 text-slate-900";
                    } else if (isAnswered) {
                        statusClass = "bg-green-200 hover:bg-green-300 text-green-800";
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => jumpToQuestion(index)}
                            className={`w-10 h-10 rounded-md flex items-center justify-center font-medium transition-all ${statusClass}`}
                        >
                            {index + 1}
                        </button>
                    )
                })}
            </div>
        </div>
      </div>
    </div>
  );
}