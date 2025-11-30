"use client";
import "./globals.css";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPageUrl } from "@/utils";
import { Home, BookOpen, FileText, Sparkles, BarChart3, Gavel, Mail, Package, ShieldQuestion, CalendarClock, ScrollText, BrainCircuit, Layers, Network, MessageSquare, Files, Pencil, Folder, Lightbulb, Video, ShieldAlert, Settings, BookUp, FileUp, Server, SearchCheck, ShieldCheck, Shield, Eye, Edit, MessagesSquare, Trophy, Clock, LifeBuoy, Star, Users, Book, CheckCircle2, Trash2, RefreshCw, Zap, Target, TrendingUp, FileText as FileIcon, AlertTriangle, Database, BookText, Brain, Heart } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const practiceNav = [
    { title: "Question Bank", url: createPageUrl("QuestionBank"), icon: BrainCircuit },
    { title: "Black Letter Law Practice", url: createPageUrl("BlackLetterLawPractice"), icon: BookText, highlight: true },
    { title: "Mastered Questions", url: createPageUrl("MasteredQuestions"), icon: CheckCircle2 },
    { title: "Exam Day Simulator", url: createPageUrl("ExamDaySimulator"), icon: ShieldCheck },
    { title: "Exam Review", url: createPageUrl("ExamReview"), icon: SearchCheck },
];

const allMocksNav = [
    { title: "Mock Exams", url: createPageUrl("MockExams"), icon: FileText, access: "user" },
    { title: "Mock Exam Management", url: createPageUrl("AdminMockStandardizer"), icon: Gavel, access: "admin" },
    { title: "Mock Question Review", url: createPageUrl("MockQuestionReview"), icon: Eye, access: "admin" },
    { title: "Manual Mock Creator", url: createPageUrl("ManualMockCreator"), icon: Edit, access: "admin" },
    { title: "AI Mock Series", url: createPageUrl("AIGenerateMockSeries"), icon: Layers, access: "admin" },
    { title: "Bulk Mock Generator", url: createPageUrl("BulkMockGenerator"), icon: Server, access: "admin" },
    { title: "Bulk Exam Importer", url: createPageUrl("AIBulkExamImporter"), icon: FileUp, access: "admin" },
];

const adminNav = [
    { title: "🚀 Launch Checklist", url: createPageUrl("LaunchChecklist"), icon: Target, highlight: true },
    { title: "📱 Quick AI Generator", url: createPageUrl("QuickAIGenerator"), icon: Zap, highlight: true },
    { title: "Student Wellbeing Monitor", url: createPageUrl("AdminMentalHealthMonitor"), icon: Heart, highlight: true },
    { title: "User Management", url: createPageUrl("UserManagement"), icon: Shield },
    { title: "Generate All Content", url: createPageUrl("AdminGenerateAllContent"), icon: Sparkles, highlight: true },
    { title: "Admin Reporting", url: createPageUrl("AdminReporting"), icon: BarChart3 },
    { title: "Content Sharing Monitor", url: createPageUrl("ContentSharingMonitor"), icon: AlertTriangle },
    { title: "Mass Question Generator", url: createPageUrl("MassQuestionGenerator"), icon: Database },
    { title: "Question Editor", url: createPageUrl("AdminQuestionEditor"), icon: Pencil },
    { title: "BLL Question Generator", url: createPageUrl("AdminBLLGenerator"), icon: Gavel },
    { title: "🚀 Bulk BLL Generator (1000/subject)", url: createPageUrl("BulkBLLGenerator"), icon: Database, highlight: true },
    { title: "🚀 Bulk MCQ Generator (1000/subject)", url: createPageUrl("BulkMCQGenerator"), icon: Brain, highlight: true },
    { title: "Topic Mock Generator", url: createPageUrl("TopicMockGenerator"), icon: FileText, highlight: true },
    { title: "Subject Review Tool", url: createPageUrl("SubjectReviewTool"), icon: RefreshCw },
    { title: "Keyword Auto-Categorizer", url: createPageUrl("KeywordCategorizer"), icon: Zap },
    { title: "AI Question Auditor", url: createPageUrl("AIQuestionAuditor"), icon: SearchCheck },
    { title: "Duplicate Remover", url: createPageUrl("DuplicateQuestionRemover"), icon: Trash2 },
    { title: "Question Generator", url: createPageUrl("AIGenerator"), icon: Sparkles },
    { title: "Flash Card Generator", url: createPageUrl("AdminFlashCardGenerator"), icon: Layers },
    { title: "Exam Pack Generator", url: createPageUrl("AIGenerateExamPack"), icon: Package },
    { title: "Generate All Revision Books", url: createPageUrl("BatchRevisionBookGenerator"), icon: Book },
    { title: "✨ Modular Book Generator", url: createPageUrl("ModularRevisionBookGenerator"), icon: BookOpen, highlight: true },
    { title: "Single Book Generator", url: createPageUrl("AdminRevisionBookGenerator"), icon: BookUp },
    { title: "Admin Note Generator", url: createPageUrl("AdminNoteGenerator"), icon: BookUp },
    { title: "Exam From Text", url: createPageUrl("AIGenerateExam"), icon: Files },
    { title: "Bulk Question Importer", url: createPageUrl("BulkQuestionImporter"), icon: FileUp },
    { title: "FileManager", url: createPageUrl("FileManager"), icon: Folder },
    { title: "Edit App", url: createPageUrl("EditApp"), icon: Settings },
];

const toolsNav = [
    { title: "Personalised Study Path", url: createPageUrl("PersonalizedStudyPath"), icon: Target, tier: "starter" },
    { title: "Weak Area Practice", url: createPageUrl("PersonalisedPractice"), icon: Sparkles, tier: "pro" },
    { title: "Final Prep", url: createPageUrl("FinalPrep"), icon: ShieldAlert, tier: "pro" },
    { title: "Mental Preparation", url: createPageUrl("MentalPreparation"), icon: BrainCircuit, tier: "starter", highlight: true },
    { title: "Interactive Flowcharts", url: createPageUrl("InteractiveFlowcharts"), icon: Network, tier: "starter", highlight: true },
    { title: "Spaced Repetition Review", url: createPageUrl("SpacedRepetitionReview"), icon: Clock, tier: "starter", highlight: true },
    { title: "Black Letter Law", url: createPageUrl("BlackLetterLaw"), icon: Gavel, tier: "starter" },
    { title: "Mind Maps", url: createPageUrl("MindMaps"), icon: Network, tier: "pro" },
    { title: "Flash Cards", url: createPageUrl("FlashCards"), icon: Layers, tier: "pro" },
    { title: "Flash Card Progress", url: createPageUrl("FlashCardProgress"), icon: TrendingUp, tier: "pro" },
    { title: "Flash Card Review Banks", url: createPageUrl("FlashCardReviewBanks"), icon: CheckCircle2, tier: "pro" },
    { title: "Revision Books", url: createPageUrl("RevisionBooks"), icon: Book, tier: "ultimate" },
    { title: "Revision Planner", url: createPageUrl("RevisionPlanner"), icon: CalendarClock, tier: "pro" },
    { title: "Study Notes", url: createPageUrl("StudyNotes"), icon: ScrollText, tier: "starter" },
    { title: "Review Bank", url: createPageUrl("ReviewBank"), icon: ShieldQuestion, tier: "pro" },
    { title: "Exam Tips", url: createPageUrl("ExamTips"), icon: Lightbulb, tier: "starter" },
];

const comingSoonNav = [
    { title: "Coming Soon", url: createPageUrl("ComingSoon"), icon: Clock },
];

const accountNav = [
    { title: "Analytics Dashboard", url: createPageUrl("AnalyticsDashboard"), icon: Brain, highlight: true },
    { title: "Progress Tracker", url: createPageUrl("ProgressTracker"), icon: BarChart3 },
    { title: "Performance Benchmarks", url: createPageUrl("PerformanceBenchmarks"), icon: TrendingUp },
    { title: "Leaderboard", url: createPageUrl("Leaderboard"), icon: Trophy },
    { title: "Study Groups", url: createPageUrl("StudyGroups"), icon: Users },
    { title: "Community Forum", url: createPageUrl("CommunityForum"), icon: MessagesSquare },
    { title: "Premium Content", url: createPageUrl("PremiumContentLibrary"), icon: BookUp },
    { title: "Feedback & Reviews", url: createPageUrl("FeedbackReviews"), icon: Star },
    { title: "Packages", url: createPageUrl("Packages"), icon: Package },
    { title: "Contact Us", url: createPageUrl("ContactUs"), icon: LifeBuoy },
    { title: "Terms & Conditions", url: createPageUrl("TermsAndConditions"), icon: FileIcon },
    { title: "Privacy Policy", url: createPageUrl("PrivacyPolicy"), icon: Shield },
];


export default function Layout({ children, currentPageName }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const isLegalPage = currentPageName === "TermsAndConditions" || currentPageName === "PrivacyPolicy";

  useEffect(() => {
    if (isLegalPage) {
      setLoadingUser(false);
      return;
    }

    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      }
      setLoadingUser(false);
    };
    fetchUser();
  }, [pathname, isLegalPage]);

  if (isLegalPage) {
    return <div className="min-h-screen w-full">{children}</div>;
  }

  const getFilteredTools = () => {
    if (loadingUser) {
        return toolsNav.filter(item => item.tier === 'starter');
    }
    if (!user) {
      return toolsNav.filter(item => item.tier === 'starter');
    }
    if (user.role === 'admin') {
      return toolsNav;
    }

    const userTier = user.subscription_tier || 'starter';
    const tierAccess = {
      'starter': ['starter'],
      'pro': ['starter', 'pro'],
      'ultimate': ['starter', 'pro', 'ultimate'],
    };
    const allowedTiersForUser = tierAccess[userTier] || ['starter'];
    
    return toolsNav.filter(item => {
      const itemTier = item.tier || 'starter';
      return allowedTiersForUser.includes(itemTier);
    });
  };

  const getFilteredMocks = () => {
    if (loadingUser || !user) {
      return allMocksNav.filter(item => item.access === "user");
    }
    if (user.role === 'admin') {
      return allMocksNav;
    }
    return allMocksNav.filter(item => item.access === "user");
  };

  const navGroups = [
      { label: "Practice", items: practiceNav },
      { label: "Mocks", items: getFilteredMocks() },
      { label: "Study Tools", items: getFilteredTools() },
      // { label: "Admin", items: adminNav },
  ];
  
  if (!loadingUser && user?.role === 'admin' && adminNav.length > 0) {
      navGroups.push({ label: "Admin", items: adminNav });
  }
  
  if (comingSoonNav.length > 0) {
      navGroups.push({ label: "Roadmap", items: comingSoonNav });
  }

  navGroups.push(
      { label: "Account & Support", items: accountNav }
  );

  return (
    <html lang="en">
      <body>
        
      <SidebarProvider>
        <style>{`
          :root {
            --primary: 222 47% 11%;
            --primary-foreground: 210 40% 98%;
            --secondary: 199 89% 48%;
            --accent: 199 89% 48%;
          }
        `}</style>
        <div className="min-h-screen flex w-full bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50">
          <Sidebar className="border-r border-slate-200 bg-white z-20">
            <SidebarHeader className="border-b border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 bg-linear-to-br from-slate-800 via-slate-700 to-blue-900 rounded-xl flex items-center justify-center shadow-lg">
                  <div className="absolute inset-0 bg-linear-to-br from-blue-400/20 to-transparent rounded-xl"></div>
                  <Gavel className="w-6 h-6 text-amber-400 relative z-10" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-xl tracking-tight">SQEForge</h2>
                  <p className="text-xs text-slate-500 font-medium">Forge Your Path To Success</p>
                </div>
              </div>
            </SidebarHeader>
            
            <SidebarContent className="p-3">
              {loadingUser ? (
                  <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
              ) : (
                  navGroups.map(group => (
                      <SidebarGroup key={group.label}>
                          <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 pt-4 pb-1">
                              {group.label}
                          </SidebarGroupLabel>
                          <SidebarGroupContent>
                              <SidebarMenu>
                              {group.items.map((item) => {
                                  let itemClasses = "transition-all duration-200 rounded-xl mb-1";
                                  if (pathname === item.url.split('?')[0]) {
                                      itemClasses += " bg-linear-to-r from-slate-800 to-blue-900 text-white hover:from-slate-700 hover:to-blue-800 shadow-md";
                                  } else if (item.highlight) {
                                      itemClasses += " bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200";
                                  } else {
                                      itemClasses += " text-slate-700 hover:bg-slate-50";
                                  }
                                  return (
                                      <SidebarMenuItem key={item.title}>
                                          <SidebarMenuButton asChild className={itemClasses}>
                                              <Link href={item.url} className="flex items-center gap-3 px-4 py-3">
                                                  <item.icon className="w-5 h-5" />
                                                  <span className="font-medium">{item.title}</span>
                                              </Link>
                                          </SidebarMenuButton>
                                      </SidebarMenuItem>
                                  );
                              })}
                              </SidebarMenu>
                          </SidebarGroupContent>
                      </SidebarGroup>
                  ))
              )}
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-100 p-4">
              <div className="bg-linear-to-br from-slate-800 via-slate-700 to-blue-900 rounded-xl p-4 text-white shadow-lg mb-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-400/10 rounded-full -mr-10 -mt-10"></div>
                <p className="text-sm font-semibold mb-1 relative z-10">Ready to Qualify?</p>
                <p className="text-xs text-blue-100 relative z-10">Consistent practice leads to success</p>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col relative z-10">
            <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 px-6 py-4 md:hidden sticky top-0 z-30 shadow-sm">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-linear-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                    <Gavel className="w-4 h-4 text-amber-400" />
                  </div>
                  <h1 className="text-lg font-bold text-slate-900">SQEForge</h1>
                </div>
              </div>
            </header>

            <div className="flex-1 ml-65 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
      </body>
    </html>
  );
}
