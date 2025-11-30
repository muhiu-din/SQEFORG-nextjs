
import React, { useState, useEffect } from 'react';
import { MockExam } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Package, BookOpen, FileText, CheckCircle, Sparkles, ShieldCheck, Layers, ShieldAlert } from 'lucide-react';

const FLK1_SUBJECTS = ["Business Law & Practice", "Dispute Resolution", "Contract Law", "Tort Law", "The Legal System of England & Wales", "Constitutional & Administrative Law", "Legal Services", "Ethics & Professional Conduct"];
const FLK2_SUBJECTS = ["Property Practice", "Wills & Administration of Estates", "Solicitors Accounts", "Land Law", "Trusts", "Criminal Law", "Criminal Practice"];

const FeatureListItem = ({ children }) => (
    <li className="flex items-start">
        <CheckCircle className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-1" />
        <span className="text-slate-700">{children}</span>
    </li>
);

export default function AccountStatusSummary({ user }) {
    const [mockCounts, setMockCounts] = useState({ flk1: 0, flk2: 0 });
    const [loadingCounts, setLoadingCounts] = useState(true);

    useEffect(() => {
        const fetchCounts = async () => {
            if (!user) {
                setLoadingCounts(false);
                return;
            }
            setLoadingCounts(true);
            try {
                const allMocks = await MockExam.list(null, null, ['id', 'exam_type']);
                
                const flk1M = allMocks.filter(e => e.exam_type === 'FLK 1').length;
                const flk2M = allMocks.filter(e => e.exam_type === 'FLK 2').length;
                setMockCounts({ flk1: flk1M, flk2: flk2M });

            } catch (error) {
                console.error("Failed to fetch summary counts:", error);
                setMockCounts({ flk1: 0, flk2: 0 });
            }
            setLoadingCounts(false);
        };
        fetchCounts();
    }, [user]);

    if (!user) return null;

    const tier = user.subscription_tier || 'starter';
    const mock_credits = user.mock_exam_credits || 0;
    const sim_credits = user.simulation_credits || 0;

    let accessibleFlk1Mocks, accessibleFlk2Mocks;
    let questionAccessTier, flashCardAccess;

    switch (tier) {
        case 'ultimate':
            accessibleFlk1Mocks = Math.min(mockCounts.flk1, 9);
            accessibleFlk2Mocks = Math.min(mockCounts.flk2, 9);
            questionAccessTier = 'Unlimited';
            flashCardAccess = '3000 per topic';
            break;
        case 'pro':
            accessibleFlk1Mocks = Math.min(mockCounts.flk1, 3);
            accessibleFlk2Mocks = Math.min(mockCounts.flk2, 3);
            questionAccessTier = '~1000';
            flashCardAccess = '1000 per topic';
            break;
        default: // starter
            accessibleFlk1Mocks = Math.min(mockCounts.flk1, 2);
            accessibleFlk2Mocks = Math.min(mockCounts.flk2, 2);
            questionAccessTier = '~500';
            flashCardAccess = '200 per topic';
    }
    
    const totalFlk1PapersAvailable = accessibleFlk1Mocks + mock_credits;
    const totalFlk2PapersAvailable = accessibleFlk2Mocks + mock_credits;

    if (user.role === 'admin') {
        return (
            <Card className="mb-10 border-amber-300 bg-amber-50/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg font-bold text-amber-800">
                        <ShieldCheck className="w-6 h-6" />
                        Administrator Account
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-amber-700">You have full access to all features, questions, and mock exams across the platform.</p>
                </CardContent>
            </Card>
        )
    }

    const availableFeatures = {
        starter: [
            'Access to 4 full mocks (2 FLK1, 2 FLK2)',
            'Practice with up to 500 MCQs',
            '200 Flash Cards per topic',
            'Core Study Notes',
            'Daily Challenge Questions',
            'Community Forum Access',
        ],
        pro: [
            'Access to 6 full mocks',
            'Practice with up to 1000 MCQs',
            'Access to 1000 Flash Cards per topic',
            'Personalised weak-area practice',
            'Full Revision Planner access',
            '30-Day Final Prep Bootcamp',
            'Interactive Mind Maps',
            'All Starter features included',
        ],
        ultimate: [
            'Access to 18 full mocks',
            'Unlimited MCQs',
            '3000 Flash Cards per topic',
            'Deep performance analytics',
            'All Pro features included',
        ],
    };

    return (
        <Card className="mb-10 border-none shadow-lg">
            <CardHeader className="border-b p-6">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                    <Package className="w-6 h-6 text-slate-700" />
                    Your Account Status
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                    <h3 className="font-semibold text-slate-800 mb-3">Your Plan: <span className="text-amber-600 font-bold capitalize">{tier}</span></h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                            <BookOpen className="w-5 h-5 text-blue-500 shrink-0" />
                            <div>
                                <p className="font-medium text-slate-800">Practice Questions</p>
                                <p className="text-sm text-slate-600">Access to: {questionAccessTier}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                            <FileText className="w-5 h-5 text-green-500 shrink-0" />
                            <div>
                                <p className="font-medium text-slate-800">Mock Exams</p>
                                <p className="text-sm text-slate-600">{loadingCounts ? 'Loading...' : `FLK1: ${totalFlk1PapersAvailable} | FLK2: ${totalFlk2PapersAvailable} papers available`}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                            <Layers className="w-5 h-5 text-purple-500 shrink-0" />
                            <div>
                                <p className="font-medium text-slate-800">Flash Cards</p>
                                <p className="text-sm text-slate-600">Access to: {flashCardAccess}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-3 rounded-lg bg-slate-50">
                            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-1" />
                            <div>
                                <p className="font-medium text-slate-800">Exam Day Simulator</p>
                                {sim_credits === 0 ? (
                                    <div className="mt-2">
                                        <p className="text-sm text-slate-600 mb-2">Full-day timed exam experience. Purchase separately.</p>
                                        <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                                            <Link to={createPageUrl("Packages")}>Purchase Simulator Credits</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <p className="text-3xl font-bold text-slate-800">{user.role === 'admin' ? '∞' : sim_credits}</p>
                                        <p className="text-slate-600">credit{sim_credits === 1 && user.role !== 'admin' ? '' : 's'} available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-slate-800 mb-3">Key Features Unlocked:</h3>
                    <ul className="space-y-3">
                        {availableFeatures[tier].map(feature => (
                            <FeatureListItem key={feature}>{feature}</FeatureListItem>
                        ))}
                    </ul>
                     {tier === 'starter' && (
                        <Button asChild className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-slate-900 gap-2">
                             <Link to={createPageUrl("Packages")}>
                                <Sparkles className="w-4 h-4"/>
                                Upgrade Plan for Full Access
                            </Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
