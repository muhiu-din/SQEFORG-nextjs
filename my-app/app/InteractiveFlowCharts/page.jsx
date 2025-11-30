"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Scale,
  Gavel,
  FileText,
  Home,
  Users,
  Briefcase
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const FLOWCHARTS = {
  'dispute-resolution': {
    title: 'Civil Litigation Procedure',
    icon: Scale,
    description: 'Step-by-step guide through civil litigation from pre-action to trial',
    color: 'from-blue-500 to-indigo-600',
    steps: [
      {
        id: 'pre-action',
        title: 'Pre-Action Protocol',
        description: 'Send Letter of Claim to defendant',
        actions: ['Draft detailed letter', 'Include key facts & legal basis', 'Propose ADR', 'Allow 14 days (personal injury) or reasonable time'],
        nextSteps: ['Defendant responds positively', 'Defendant rejects/ignores'],
        outcomes: {
          positive: 'settlement',
          negative: 'issue-claim'
        }
      },
      {
        id: 'settlement',
        title: 'Settlement Negotiation',
        description: 'Parties attempt to settle without court',
        actions: ['Exchange offers', 'Consider Part 36 offers', 'Draft settlement agreement if agreed'],
        nextSteps: ['Settlement reached', 'No agreement'],
        outcomes: {
          positive: 'case-closed',
          negative: 'issue-claim'
        }
      },
      {
        id: 'issue-claim',
        title: 'Issue Claim Form (N1)',
        description: 'File claim at court and pay issue fee',
        actions: ['Complete N1 form', 'Attach Particulars of Claim', 'Pay court fee', 'Court issues claim'],
        nextSteps: ['Claim issued successfully'],
        outcomes: {
          positive: 'serve-claim'
        }
      },
      {
        id: 'serve-claim',
        title: 'Serve Claim on Defendant',
        description: 'Serve within 4 months of issue (6 if out of jurisdiction)',
        actions: ['Serve by post/personal service/DX', 'Complete certificate of service', 'File at court'],
        nextSteps: ['Service completed'],
        outcomes: {
          positive: 'await-response'
        }
      },
      {
        id: 'await-response',
        title: 'Defendant Response Period',
        description: 'Defendant has 14 days to acknowledge, 28 days to file defence',
        actions: ['Monitor deadlines', 'Prepare for possible directions'],
        nextSteps: ['Defence filed', 'No response (default)', 'Admission'],
        outcomes: {
          defence: 'directions',
          default: 'default-judgment',
          admission: 'judgment-admission'
        }
      },
      {
        id: 'default-judgment',
        title: 'Apply for Default Judgment',
        description: 'Defendant failed to respond',
        actions: ['File N225 (default judgment)', 'Obtain judgment', 'Enforce if necessary'],
        nextSteps: ['Case concluded'],
        outcomes: {
          positive: 'case-closed'
        }
      },
      {
        id: 'directions',
        title: 'Case Management & Directions',
        description: 'Court allocates track and gives directions',
        actions: ['Court allocates to small/fast/multi-track', 'Directions questionnaire', 'Comply with directions'],
        nextSteps: ['Proceed to disclosure'],
        outcomes: {
          positive: 'disclosure'
        }
      },
      {
        id: 'disclosure',
        title: 'Disclosure of Documents',
        description: 'Exchange relevant documents',
        actions: ['Prepare disclosure list', 'Exchange documents', 'Inspect opponent documents'],
        nextSteps: ['Disclosure complete'],
        outcomes: {
          positive: 'witness-statements'
        }
      },
      {
        id: 'witness-statements',
        title: 'Exchange Witness Statements',
        description: 'Serve witness evidence',
        actions: ['Draft witness statements', 'Exchange simultaneously', 'Serve by court deadline'],
        nextSteps: ['Exchange complete'],
        outcomes: {
          positive: 'expert-evidence'
        }
      },
      {
        id: 'expert-evidence',
        title: 'Expert Evidence (if applicable)',
        description: 'Exchange expert reports',
        actions: ['Obtain court permission if needed', 'Instruct expert', 'Exchange reports', 'Experts discuss issues'],
        nextSteps: ['Expert stage complete'],
        outcomes: {
          positive: 'pre-trial-review'
        }
      },
      {
        id: 'pre-trial-review',
        title: 'Pre-Trial Review',
        description: 'Final preparations before trial',
        actions: ['File pre-trial checklist', 'Prepare trial bundle', 'Brief counsel', 'List authorities'],
        nextSteps: ['Ready for trial'],
        outcomes: {
          positive: 'trial'
        }
      },
      {
        id: 'trial',
        title: 'Trial',
        description: 'Matter heard before judge',
        actions: ['Opening speeches', 'Claimant evidence', 'Defendant evidence', 'Closing speeches', 'Judgment'],
        nextSteps: ['Judgment given'],
        outcomes: {
          positive: 'judgment',
          negative: 'judgment'
        }
      },
      {
        id: 'judgment',
        title: 'Judgment & Costs',
        description: 'Court delivers judgment and awards costs',
        actions: ['Note judgment', 'Costs assessment', 'Consider appeal (if grounds exist)'],
        nextSteps: ['Case concluded or appeal'],
        outcomes: {
          positive: 'case-closed',
          appeal: 'appeal-process'
        }
      },
      {
        id: 'case-closed',
        title: 'Case Concluded',
        description: 'Matter is resolved',
        actions: [],
        nextSteps: [],
        outcomes: {}
      }
    ]
  },
  'criminal-procedure': {
    title: 'Criminal Procedure Flow',
    icon: Gavel,
    description: 'From arrest through trial in criminal proceedings',
    color: 'from-red-500 to-rose-600',
    steps: [
      {
        id: 'arrest',
        title: 'Arrest & Detention',
        description: 'Police arrest suspect under PACE',
        actions: ['Inform of arrest grounds', 'Caution given', 'Take to police station', 'Custody officer decision'],
        nextSteps: ['Detained for questioning', 'Released without charge'],
        outcomes: {
          detained: 'interview',
          released: 'case-closed'
        }
      },
      {
        id: 'interview',
        title: 'Police Interview',
        description: 'Suspect interviewed under caution',
        actions: ['Right to legal advice', 'Interview conducted', 'Evidence gathered', 'Custody time limits apply'],
        nextSteps: ['Charged', 'Released under investigation', 'NFA'],
        outcomes: {
          charged: 'charge-decision',
          rui: 'released-investigation',
          nfa: 'case-closed'
        }
      },
      {
        id: 'charge-decision',
        title: 'Charging Decision',
        description: 'CPS decides whether to charge',
        actions: ['Apply Full Code Test', 'Evidential test', 'Public interest test', 'Decide charge'],
        nextSteps: ['Charged', 'No further action'],
        outcomes: {
          charged: 'first-appearance',
          nfa: 'case-closed'
        }
      },
      {
        id: 'first-appearance',
        title: 'First Appearance (Magistrates)',
        description: 'Defendant appears in magistrates court',
        actions: ['Charges read', 'Indication of plea', 'Bail decision', 'Case management'],
        nextSteps: ['Summary offence', 'Either-way offence', 'Indictable-only offence'],
        outcomes: {
          summary: 'magistrates-trial',
          either_way: 'mode-of-trial',
          indictable: 'crown-court-send'
        }
      },
      {
        id: 'mode-of-trial',
        title: 'Mode of Trial Decision',
        description: 'Decide where either-way offence tried',
        actions: ['Magistrates decide suitability', 'Defendant elects if magistrates accept', 'Allocation decision made'],
        nextSteps: ['Summary trial', 'Crown Court trial'],
        outcomes: {
          magistrates: 'magistrates-trial',
          crown: 'crown-court-send'
        }
      },
      {
        id: 'magistrates-trial',
        title: 'Magistrates Court Trial',
        description: 'Summary trial before magistrates',
        actions: ['Prosecution case', 'Defence case', 'Magistrates deliberate', 'Verdict'],
        nextSteps: ['Guilty verdict', 'Not guilty verdict'],
        outcomes: {
          guilty: 'sentencing',
          not_guilty: 'case-closed'
        }
      },
      {
        id: 'crown-court-send',
        title: 'Sent to Crown Court',
        description: 'Case transferred to Crown Court',
        actions: ['PTPH (Plea & Trial Preparation Hearing)', 'Enter plea', 'Set trial date if not guilty plea'],
        nextSteps: ['Guilty plea', 'Not guilty plea'],
        outcomes: {
          guilty: 'sentencing',
          not_guilty: 'crown-trial'
        }
      },
      {
        id: 'crown-trial',
        title: 'Crown Court Trial',
        description: 'Trial before judge and jury',
        actions: ['Jury empanelled', 'Prosecution opening', 'Evidence presented', 'Defence case', 'Closing speeches', 'Judge sums up', 'Jury verdict'],
        nextSteps: ['Guilty verdict', 'Not guilty verdict'],
        outcomes: {
          guilty: 'sentencing',
          not_guilty: 'case-closed'
        }
      },
      {
        id: 'sentencing',
        title: 'Sentencing',
        description: 'Court determines sentence',
        actions: ['Consider sentencing guidelines', 'Aggravating/mitigating factors', 'Pre-sentence report (if needed)', 'Impose sentence'],
        nextSteps: ['Sentence imposed'],
        outcomes: {
          positive: 'case-closed'
        }
      },
      {
        id: 'case-closed',
        title: 'Case Concluded',
        description: 'Matter is resolved',
        actions: [],
        nextSteps: [],
        outcomes: {}
      }
    ]
  },
  'property-conveyancing': {
    title: 'Residential Property Purchase',
    icon: Home,
    description: 'Complete conveyancing process from offer to completion',
    color: 'from-green-500 to-emerald-600',
    steps: [
      {
        id: 'offer-accepted',
        title: 'Offer Accepted',
        description: 'Buyer offer accepted by seller',
        actions: ['Agree sale price', 'Confirm in writing', 'Instruct solicitors', 'Arrange mortgage offer'],
        nextSteps: ['Both parties instruct solicitors'],
        outcomes: {
          positive: 'pre-contract'
        }
      },
      {
        id: 'pre-contract',
        title: 'Pre-Contract Stage',
        description: 'Due diligence and draft contract',
        actions: ['Seller solicitor drafts contract pack', 'Send TA6/TA10 forms', 'Title investigation', 'Searches ordered'],
        nextSteps: ['Contract pack sent'],
        outcomes: {
          positive: 'searches-enquiries'
        }
      },
      {
        id: 'searches-enquiries',
        title: 'Searches & Enquiries',
        description: 'Buyer solicitor investigates',
        actions: ['Local authority search', 'Water & drainage search', 'Environmental search', 'Raise enquiries on contract', 'Review title documents'],
        nextSteps: ['Searches returned, enquiries answered'],
        outcomes: {
          positive: 'mortgage-offer'
        }
      },
      {
        id: 'mortgage-offer',
        title: 'Mortgage Offer Received',
        description: 'Lender makes formal mortgage offer',
        actions: ['Review mortgage offer', 'Check conditions', 'Confirm acceptable to buyer', 'Report to lender'],
        nextSteps: ['Mortgage approved'],
        outcomes: {
          positive: 'exchange-ready'
        }
      },
      {
        id: 'exchange-ready',
        title: 'Ready to Exchange',
        description: 'Both parties ready for exchange',
        actions: ['Agree completion date', 'Client signs contract', 'Transfer deposit to seller solicitor', 'Obtain buildings insurance'],
        nextSteps: ['Contracts exchanged'],
        outcomes: {
          positive: 'exchange'
        }
      },
      {
        id: 'exchange',
        title: 'Exchange of Contracts',
        description: 'Legally binding contract',
        actions: ['Exchange contracts by phone/email', 'Confirm in writing', 'Send signed contract copies', 'Deposit paid', 'Binding agreement created'],
        nextSteps: ['Proceed to completion'],
        outcomes: {
          positive: 'pre-completion'
        }
      },
      {
        id: 'pre-completion',
        title: 'Pre-Completion',
        description: 'Final steps before completion',
        actions: ['Buyer solicitor requisitions on title', 'Prepare completion statement', 'Draft transfer deed (TR1)', 'Buyer signs transfer', 'Arrange final funds from lender'],
        nextSteps: ['Ready for completion'],
        outcomes: {
          positive: 'completion'
        }
      },
      {
        id: 'completion',
        title: 'Completion Day',
        description: 'Legal title transfers to buyer',
        actions: ['Transfer funds to seller solicitor', 'Seller solicitor confirms receipt', 'Seller hands over keys', 'Buyer takes possession', 'SDLT payable within 14 days'],
        nextSteps: ['Completion achieved'],
        outcomes: {
          positive: 'post-completion'
        }
      },
      {
        id: 'post-completion',
        title: 'Post-Completion',
        description: 'Register the transaction',
        actions: ['Pay SDLT', 'Apply for registration at Land Registry (within priority period)', 'Register mortgage charge', 'Send title deeds to lender'],
        nextSteps: ['Registration complete'],
        outcomes: {
          positive: 'transaction-complete'
        }
      },
      {
        id: 'transaction-complete',
        title: 'Transaction Complete',
        description: 'Purchase concluded',
        actions: [],
        nextSteps: [],
        outcomes: {}
      }
    ]
  }
};

export default function InteractiveFlowcharts() {
  const [selectedFlowchart, setSelectedFlowchart] = useState('dispute-resolution');
  const [currentStep, setCurrentStep] = useState('pre-action');
  const [visitedSteps, setVisitedSteps] = useState(new Set(['pre-action']));

  const flowchart = FLOWCHARTS[selectedFlowchart];
  const step = flowchart.steps.find(s => s.id === currentStep);

  const handleNextStep = (outcomeKey) => {
    const nextStepId = step.outcomes[outcomeKey];
    if (nextStepId) {
      setCurrentStep(nextStepId);
      setVisitedSteps(prev => new Set([...prev, nextStepId]));
    }
  };

  const resetFlowchart = () => {
    const firstStep = flowchart.steps[0].id;
    setCurrentStep(firstStep);
    setVisitedSteps(new Set([firstStep]));
  };

  const isStepVisited = (stepId) => visitedSteps.has(stepId);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Interactive Legal Flowcharts</h1>
          <p className="text-slate-600 text-lg">
            Click through step-by-step procedures for key SQE topics
          </p>
        </div>

        <Alert className="mb-8 bg-purple-50 border-purple-200">
          <AlertCircle className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-900">
            <strong>Visual Learning:</strong> These interactive flowcharts help you understand complex procedural topics like Civil Litigation, Criminal Procedure, and Conveyancing. Click through each step to see the full process.
          </AlertDescription>
        </Alert>

        <Tabs value={selectedFlowchart} onValueChange={(val) => {
          setSelectedFlowchart(val);
          const firstStep = FLOWCHARTS[val].steps[0].id;
          setCurrentStep(firstStep);
          setVisitedSteps(new Set([firstStep]));
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            {Object.entries(FLOWCHARTS).map(([key, chart]) => {
              const Icon = chart.icon;
              return (
                <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {chart.title}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(FLOWCHARTS).map(([key, chart]) => (
            <TabsContent key={key} value={key}>
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Progress Map */}
                <Card className="lg:col-span-1 border-none shadow-lg h-fit">
                  <CardHeader className={`p-6 bg-linear-to-br ${chart.color} text-white`}>
                    <CardTitle className="flex items-center gap-2">
                      <chart.icon className="w-6 h-6" />
                      Progress Map
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      {chart.steps.map((s, idx) => (
                        <div key={s.id} className="flex items-center gap-2">
                          {isStepVisited(s.id) ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                          )}
                          <button
                            onClick={() => isStepVisited(s.id) && setCurrentStep(s.id)}
                            className={`text-sm text-left ${
                              s.id === currentStep ? 'font-bold text-slate-900' : 
                              isStepVisited(s.id) ? 'text-slate-700 hover:text-slate-900' :
                              'text-slate-400'
                            }`}
                            disabled={!isStepVisited(s.id)}
                          >
                            {idx + 1}. {s.title}
                          </button>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={resetFlowchart}
                      variant="outline"
                      className="w-full mt-6"
                    >
                      Reset Flowchart
                    </Button>
                  </CardContent>
                </Card>

                {/* Current Step */}
                <Card className="lg:col-span-2 border-none shadow-xl">
                  <CardHeader className={`p-8 bg-linear-to-br ${chart.color} text-white`}>
                    <div className="flex items-center justify-between mb-4">
                      <Badge className="bg-white/20 text-white">
                        Step {chart.steps.findIndex(s => s.id === step.id) + 1} of {chart.steps.length}
                      </Badge>
                      {step.nextSteps.length === 0 && (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Complete
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-3xl font-bold mb-3">{step.title}</CardTitle>
                    <p className="text-white/90 text-lg">{step.description}</p>
                  </CardHeader>

                  <CardContent className="p-8">
                    {step.actions.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-purple-600" />
                          Actions Required:
                        </h3>
                        <ul className="space-y-2">
                          {step.actions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                              <span className="text-slate-700">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {step.nextSteps.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <ArrowRight className="w-5 h-5 text-blue-600" />
                          What Happens Next?
                        </h3>
                        <div className="grid gap-3">
                          {step.nextSteps.map((nextStep, idx) => {
                            // Find corresponding outcome key
                            const outcomeKey = Object.entries(step.outcomes).find(
                              ([key, value]) => nextStep.toLowerCase().includes(key) || key === 'positive'
                            )?.[0];

                            return (
                              <Button
                                key={idx}
                                onClick={() => handleNextStep(outcomeKey || Object.keys(step.outcomes)[idx])}
                                className="w-full justify-between text-left h-auto py-4 px-6"
                                variant="outline"
                              >
                                <span className="flex items-center gap-3">
                                  <ArrowRight className="w-5 h-5" />
                                  {nextStep}
                                </span>
                                <ChevronRight className="w-5 h-5" />
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {step.nextSteps.length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-green-900 mb-2">
                          Process Complete!
                        </h3>
                        <p className="text-slate-600 mb-6">
                          You've reached the end of this procedure.
                        </p>
                        <Button onClick={resetFlowchart} className="bg-slate-900 hover:bg-slate-800">
                          Start Over
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

function ChevronRight({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}