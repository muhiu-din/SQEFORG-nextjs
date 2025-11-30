"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookCopy, Loader2, FileText, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import _ from 'lodash';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import MiniMock from '@/components/MiniMock';
import Link from 'next/link';
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// MOCK DATA
const MOCK_USER = { name: "Admin User", email: "admin@example.com", role: "admin" };

const MOCK_NOTES = [
  {
    id: 'note1',
    subject: 'Contract Law',
    title: 'Consideration and Promises',
    content: '### Key Points\n- Consideration is essential for contract validity.\n- Must be something of value.',
    source_filename: 'contract_notes.pdf',
    mini_mock_questions: [
      {
        id: 'q1',
        question_text: 'What is consideration in contract law?',
        options: ['A promise without obligation', 'Something of value exchanged', 'A verbal agreement', 'Only written contracts'],
        correct_answer: 1
      }
    ]
  },
  {
    id: 'note2',
    subject: 'Tort Law',
    title: 'Negligence Essentials',
    content: '### Key Points\n- Duty, breach, causation, damage.\n- Standard of care expected.',
    source_filename: 'tort_notes.pdf',
    mini_mock_questions: [
      {
        id: 'q2',
        question_text: 'Which tort requires proving duty, breach, causation, and damage?',
        options: ['Negligence', 'Battery', 'Defamation', 'Nuisance'],
        correct_answer: 0
      }
    ]
  }
];

export default function StudyNotes() {
  const [notesBySubject, setNotesBySubject] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Mock user login
    setUser(MOCK_USER);
  }, []);

  useEffect(() => {
    if (user) {
      const hasAccess = user.role === 'admin' || ['pro', 'ultimate'].includes(user.subscription_tier);
      if (hasAccess) {
        loadNotes();
      } else {
        setLoading(false);
      }
    }
  }, [user]);

  const loadNotes = async () => {
    // Group mock notes by subject
    const notesMap = _.groupBy(MOCK_NOTES, 'subject');
    setNotesBySubject(notesMap);
    setLoading(false);
  };

  const sortedSubjects = Object.keys(notesBySubject).sort();

  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-500" />
      </div>
    );
  }

  const hasAccess = user?.role === 'admin' || ['pro', 'ultimate'].includes(user?.subscription_tier);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10 flex items-center justify-center">
        <div className="max-w-3xl mx-auto text-center">
          <Card className="border-none shadow-xl p-10">
            <Lock className="w-16 h-16 text-amber-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-slate-900 mb-4">This is a Pro Feature</h1>
            <p className="text-slate-600 mb-8">Access detailed study notes and mini-mocks by upgrading to a Pro or Ultimate plan.</p>
            <Link href={createPageUrl("Packages")}>
              <Button className="bg-amber-400 hover:bg-amber-500 text-slate-900 h-12 px-8">
                Upgrade Your Plan
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Study Notes Library</h1>
          <p className="text-slate-600">Key exam-focused study notes organized by subject • Full access for all tiers</p>
        </div>

        <Card className="border-none shadow-lg mt-8">
          <CardHeader className="p-6 border-b border-slate-100">
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <BookCopy className="w-6 h-6 text-slate-700"/>
              Study Notes by Subject
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {Object.keys(notesBySubject).length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <p>No study notes have been generated yet.</p>
                    {user?.role === 'admin' ? (
                      <p className="text-sm mt-2">
                        You can create new notes in the{' '}
                        <Link href={createPageUrl("AdminNoteGenerator")} className="font-semibold text-amber-600 hover:underline">
                          Admin Note Generator
                        </Link>
                        .
                      </p>
                    ) : (
                      <p className="text-sm mt-1">Notes are added periodically by administrators.</p>
                    )}
                </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {sortedSubjects.map((subject) => {
                  const notes = notesBySubject[subject];
                  return (
                    <AccordionItem value={subject} key={subject} className="border-b">
                      <AccordionTrigger className="text-lg font-semibold hover:no-underline px-4 py-4 sm:px-6">
                        <div className="flex justify-between items-center w-full">
                            <span>{subject}</span>
                            <Badge variant="outline" className="mr-2">{notes.length} note{notes.length > 1 ? 's' : ''}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="bg-slate-50 px-2 sm:px-4 py-4 space-y-3">
                        <Accordion type="single" collapsible className="w-full space-y-3">
                        {notes.map((note) => (
                            <AccordionItem value={note.id} key={note.id} className="border rounded-lg bg-white shadow-sm">
                                <AccordionTrigger className="text-md font-semibold hover:no-underline px-4 py-3">
                                   <div className="w-full text-left">
                                        <p className="text-slate-800">{note.title}</p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500 font-normal mt-1">
                                            <span className="flex items-center gap-1.5"><FileText className="w-3 h-3"/> {note.source_filename}</span>
                                        </div>
                                   </div>
                                </AccordionTrigger>
                                <AccordionContent className="prose prose-sm max-w-none text-slate-800 p-4 pt-2 border-t">
                                     <ReactMarkdown>{note.content}</ReactMarkdown>
                                     <MiniMock questions={note.mini_mock_questions} />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
