import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function MiniMock({ questions }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [sessionFinished, setSessionFinished] = useState(false);

  if (!questions || questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (index) => {
    if (showFeedback) return;
    setSelectedAnswer(index);
    setShowFeedback(true);
    if (index === currentQuestion.correct_answer_index) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setSessionFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);
    setSessionFinished(false);
  };
  
  if(sessionFinished) {
    return (
        <div className="mt-6 text-center p-6 bg-slate-100 rounded-lg">
            <h3 className="text-xl font-bold">Mini-Mock Complete!</h3>
            <p className="text-2xl font-bold my-2">Your score: {score} / {questions.length}</p>
            <Button onClick={handleRestart} variant="outline">Try Again</Button>
        </div>
    )
  }

  return (
    <Card className="mt-6 border-dashed border-amber-400 bg-amber-50/50">
        <CardHeader>
            <CardTitle className="text-lg font-semibold">Topic Mini-Mock</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="font-semibold text-slate-800 mb-4">{currentQuestion.question_text}</p>
            <div className="space-y-2">
                {currentQuestion.options.map((option, index) => {
                    const isCorrect = index === currentQuestion.correct_answer_index;
                    const isSelected = selectedAnswer === index;
                    let buttonClass = "border-slate-300 bg-white";
                    if(showFeedback) {
                        if(isCorrect) {
                            buttonClass = "border-green-500 bg-green-100 text-green-900";
                        } else if (isSelected) {
                            buttonClass = "border-red-500 bg-red-100 text-red-900";
                        } else {
                            buttonClass = "border-slate-200 bg-slate-50 text-slate-500";
                        }
                    } else if (isSelected) {
                        buttonClass = "border-slate-900 bg-slate-900 text-white";
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => handleAnswerSelect(index)}
                            disabled={showFeedback}
                            className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 flex items-start gap-3 ${buttonClass}`}
                        >
                            {showFeedback && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />}
                            {showFeedback && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600 mt-0.5" />}
                            <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                            <span>{option}</span>
                        </button>
                    )
                })}
            </div>
            {showFeedback && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
                    <h4 className="font-bold">Explanation</h4>
                    <p className="text-sm text-slate-600">{currentQuestion.explanation}</p>
                </div>
            )}
            <Button onClick={handleNext} disabled={!showFeedback} className="w-full mt-4 bg-slate-800 hover:bg-slate-700">
                {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish"}
            </Button>
        </CardContent>
    </Card>
  );
}