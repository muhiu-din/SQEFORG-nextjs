import React from 'react';

const ScoreVisualization = ({ score, total, passMark, scaledScorePassMark, showDetails }) => {
  // Handle both usage patterns: 
  // 1. QuestionBank style: score, total, showDetails
  // 2. ExamReview style: score (scaled), passMark, scaledScorePassMark
  
  const isQuestionBankStyle = total !== undefined;
  
  if (isQuestionBankStyle) {
    // QuestionBank usage - score is raw count, total is total questions
    const scorePercentage = total > 0 ? (score / total) * 100 : 0;
    const scoreColor = scorePercentage >= 60 ? 'bg-green-500' : 'bg-red-500';

    return (
      <div className="w-full">
        <div className="relative h-6 w-full bg-slate-200 rounded-full">
          <div
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${scoreColor}`}
            style={{ width: `${scorePercentage}%` }}
          />
          
          <div
            className="absolute top-0 h-full w-1 bg-slate-800"
            style={{ left: '60%' }}
          >
            <div className="absolute -top-6 -translate-x-1/2 text-xs font-semibold text-slate-800">
              60%
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-2 pt-4 text-sm font-medium text-slate-600">
          <span>Your Score: {score} / {total} ({scorePercentage.toFixed(0)}%)</span>
          <span className="text-slate-800">Pass: 60%</span>
        </div>
      </div>
    );
  }
  
  // ExamReview usage - score is scaled (0-500)
  const scorePercentage = (score / 500) * 100;
  const passMarkPercentage = (passMark / 500) * 100;
  const scaledScorePassMarkPercentage = scaledScorePassMark ? (scaledScorePassMark / 500) * 100 : null;

  const scoreColor = score >= passMark ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="w-full">
      <div className="relative h-6 w-full bg-slate-200 rounded-full">
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${scoreColor}`}
          style={{ width: `${scorePercentage}%` }}
        />
        
        <div
          className="absolute top-0 h-full w-1 bg-slate-800"
          style={{ left: `${passMarkPercentage}%` }}
        >
           <div className="absolute -top-6 -translate-x-1/2 text-xs font-semibold text-slate-800">
             {passMark.toFixed(0)}
           </div>
        </div>

        {scaledScorePassMarkPercentage !== null && (
            <div
                className="absolute top-0 h-full w-1 bg-blue-600"
                style={{ left: `${scaledScorePassMarkPercentage}%` }}
            >
                <div className="absolute top-6 -translate-x-1/2 text-xs font-semibold text-blue-600">
                    {scaledScorePassMark.toFixed(0)}
                </div>
            </div>
        )}
      </div>
      <div className="flex justify-between mt-2 pt-4 text-sm font-medium text-slate-600">
        <span>Your Score: {score.toFixed(0)} / 500</span>
        <div className="flex gap-4">
            {scaledScorePassMarkPercentage !== null && <span className="text-blue-600">Scaled Score Pass Mark</span>}
            <span className="text-slate-800">Standard Pass Mark</span>
        </div>
      </div>
    </div>
  );
};

export default ScoreVisualization;