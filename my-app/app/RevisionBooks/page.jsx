"use client";
import React, { useState, useEffect } from 'react';
import { RevisionBook, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Loader2, Lock, FileText, ArrowLeft, Gavel, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { createPageUrl } from '@/utils';
import { useToast } from '@/components/ui/use-toast';

const FLK1_SUBJECTS = ["Business Law & Practice", "Dispute Resolution", "Contract Law", "Tort Law", "The Legal System of England & Wales", "Constitutional & Administrative Law", "Legal Services", "Ethics & Professional Conduct"];
const FLK2_SUBJECTS = ["Property Practice", "Wills & Administration of Estates", "Solicitors Accounts", "Land Law", "Trusts", "Criminal Law", "Criminal Practice"];

export default function RevisionBooks() {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBook, setSelectedBook] = useState(null);
    const [activeTab, setActiveTab] = useState('flk1');
    const [deleting, setDeleting] = useState(null);
    const { toast } = useToast();

    useEffect(() => {
        const initialize = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
            } catch (e) {
                setUser({ subscription_tier: 'starter' });
            }
            setLoadingUser(false);
        };
        initialize();
    }, []);

    useEffect(() => {
        if (user && (user.role === 'admin' || user.subscription_tier === 'ultimate')) {
            loadBooks();
        } else if (!loadingUser) {
            setLoading(false);
        }
    }, [user, loadingUser]);

    const loadBooks = async () => {
        setLoading(true);
        const allBooks = await RevisionBook.list('-created_date');
        setBooks(allBooks);
        setLoading(false);
    };

    const handleDeleteBook = async (bookId, bookTitle, e) => {
        e.stopPropagation();
        if (!confirm(`Delete "${bookTitle}"? This will allow you to regenerate it without wasting credits.`)) {
            return;
        }
        
        setDeleting(bookId);
        try {
            await RevisionBook.delete(bookId);
            setBooks(books.filter(b => b.id !== bookId));
            toast({
                title: "Book deleted",
                description: `${bookTitle} has been removed. You can now regenerate it.`,
            });
        } catch (error) {
            toast({
                title: "Delete failed",
                description: error.message,
                variant: "destructive"
            });
        }
        setDeleting(null);
    };

    if (loadingUser || loading) {
        return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-500" /></div>;
    }

    const hasAccess = user?.role === 'admin' || user?.subscription_tier === 'ultimate';

    if (!hasAccess) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10 flex items-center justify-center">
                <div className="max-w-3xl mx-auto text-center">
                    <Card className="border-none shadow-xl p-10">
                        <Lock className="w-16 h-16 text-amber-400 mx-auto mb-6" />
                        <h1 className="text-3xl font-bold text-slate-900 mb-4">Ultimate Plan Feature</h1>
                        <p className="text-slate-600 mb-8">
                            Access comprehensive, exam-focused revision books for all SQE1 subjects. Upgrade to Ultimate for complete coverage.
                        </p>
                        <Link href={createPageUrl("Packages")}>
                            <Button className="bg-amber-400 text-slate-900 hover:bg-amber-500 h-12 px-8 text-lg">
                                Upgrade to Ultimate
                            </Button>
                        </Link>
                    </Card>
                </div>
            </div>
        );
    }

    if (selectedBook) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-100 to-slate-200 p-6 md:p-10">
                <div className="max-w-5xl mx-auto">
                    <Button variant="outline" onClick={() => setSelectedBook(null)} className="mb-6 bg-white">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
                    </Button>
                    
                    {/* Book Cover Page */}
                    <Card className="border-none shadow-2xl mb-8 bg-linear-to-br from-slate-800 via-slate-700 to-slate-900 text-white overflow-hidden">
                        <div className="relative p-12 md:p-20 text-center">
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-10 left-10 w-64 h-64 bg-amber-400 rounded-full blur-3xl"></div>
                                <div className="absolute bottom-10 right-10 w-64 h-64 bg-blue-400 rounded-full blur-3xl"></div>
                            </div>
                            
                            <div className="relative z-10">
                                <div className="w-24 h-24 mx-auto mb-8 bg-linear-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-2xl">
                                    <Gavel className="w-12 h-12 text-slate-900" />
                                </div>
                                
                                <div className="mb-8">
                                    <div className="inline-block px-4 py-2 bg-amber-400 text-slate-900 font-bold text-sm rounded-full mb-6">
                                        {selectedBook.flk_type}
                                    </div>
                                </div>
                                
                                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                                    {selectedBook.subject}
                                </h1>
                                <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
                                    Complete Revision Guide
                                </p>
                                
                                <div className="border-t border-slate-600 pt-8 mt-8">
                                    <p className="text-2xl font-bold mb-2">SQEForge</p>
                                    <p className="text-sm text-slate-400">Forge Your Path To Success</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Book Content */}
                    <Card className="border-none shadow-2xl bg-white">
                        <CardContent className="p-8 md:p-12">
                            {/* Copyright Page */}
                            <div className="mb-12 pb-8 border-b-2 border-slate-200">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-linear-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center">
                                        <Gavel className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-lg">SQEForge</p>
                                        <p className="text-xs text-slate-600">Forge Your Path To Success</p>
                                    </div>
                                </div>
                                
                                <div className="text-sm text-slate-600 space-y-2">
                                    <p className="font-semibold text-slate-900">{selectedBook.title}</p>
                                    <p>Published by SQEForge</p>
                                    <p>© {new Date().getFullYear()} SQEForge. All rights reserved.</p>
                                    <p className="mt-4 text-xs leading-relaxed">
                                        No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, 
                                        including photocopying, recording, or other electronic or mechanical methods, without the prior written 
                                        permission of the publisher, except in the case of brief quotations embodied in critical reviews and 
                                        certain other noncommercial uses permitted by copyright law.
                                    </p>
                                    <p className="mt-4 text-xs">
                                        <span className="font-semibold">Disclaimer:</span> This revision guide is designed to assist students 
                                        preparing for the SQE1 examination. While every effort has been made to ensure accuracy, this material 
                                        should be used in conjunction with official SRA materials and other authoritative sources.
                                    </p>
                                    <p className="mt-4 text-xs">
                                        <span className="font-semibold">Edition:</span> {new Date().getFullYear()} | 
                                        <span className="font-semibold ml-2">Subject:</span> {selectedBook.subject} | 
                                        <span className="font-semibold ml-2">Exam:</span> SQE1 {selectedBook.flk_type}
                                    </p>
                                </div>
                            </div>

                            {/* Table of Contents (extracted from content) */}
                            <div className="mb-12 pb-8 border-b-2 border-slate-200">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6">Table of Contents</h2>
                                <div className="text-sm text-slate-600 space-y-1">
                                    {selectedBook.content.split('\n').filter(line => line.startsWith('##')).slice(0, 15).map((heading, idx) => (
                                        <p key={idx} className="hover:text-slate-900 cursor-pointer py-1">
                                            {heading.replace(/^#+\s/, '')}
                                        </p>
                                    ))}
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="prose prose-slate prose-lg max-w-none">
                                <ReactMarkdown
                                    components={{
                                        h1: ({node, ...props}) => <h1 className="text-4xl font-bold text-slate-900 mt-12 mb-6 pb-4 border-b-2 border-amber-400" {...props} />,
                                        h2: ({node, ...props}) => <h2 className="text-3xl font-bold text-slate-800 mt-10 mb-4" {...props} />,
                                        h3: ({node, ...props}) => <h3 className="text-2xl font-semibold text-slate-700 mt-8 mb-3" {...props} />,
                                        h4: ({node, ...props}) => <h4 className="text-xl font-semibold text-slate-700 mt-6 mb-2" {...props} />,
                                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-amber-400 bg-amber-50 pl-4 py-2 my-4 italic" {...props} />,
                                        table: ({node, ...props}) => <div className="overflow-x-auto my-6"><table className="min-w-full border-collapse border border-slate-300" {...props} /></div>,
                                        th: ({node, ...props}) => <th className="border border-slate-300 bg-slate-100 px-4 py-2 text-left font-semibold" {...props} />,
                                        td: ({node, ...props}) => <td className="border border-slate-300 px-4 py-2" {...props} />,
                                    }}
                                >
                                    {selectedBook.content}
                                </ReactMarkdown>
                            </div>

                            {/* Footer */}
                            <div className="mt-16 pt-8 border-t-2 border-slate-200 text-center text-sm text-slate-500">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-linear-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center">
                                        <Gavel className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <span className="font-bold text-slate-700">SQEForge</span>
                                </div>
                                <p>© {new Date().getFullYear()} SQEForge. All rights reserved.</p>
                                <p className="text-xs mt-2">For examination preparation purposes only.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const flk1Books = books.filter(b => b.flk_type === 'FLK 1');
    const flk2Books = books.filter(b => b.flk_type === 'FLK 2');

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                        <BookOpen className="w-8 h-8 text-amber-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">SQE1 Revision Library</h1>
                    <p className="text-slate-600 text-lg">Professional revision guides for guaranteed exam success</p>
                </div>

                {books.length === 0 ? (
                    <Card className="border-none shadow-xl text-center p-12">
                        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Building Your Library</h2>
                        <p className="text-slate-600">Revision books are being created. Check back soon!</p>
                        {user?.role === 'admin' && (
                            <Link href={createPageUrl("AdminRevisionBookGenerator")}>
                                <Button className="mt-6 bg-slate-900 hover:bg-slate-800">
                                    Create Revision Books
                                </Button>
                            </Link>
                        )}
                    </Card>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8 h-14">
                            <TabsTrigger value="flk1" className="text-lg">FLK 1 ({flk1Books.length} books)</TabsTrigger>
                            <TabsTrigger value="flk2" className="text-lg">FLK 2 ({flk2Books.length} books)</TabsTrigger>
                        </TabsList>

                        <TabsContent value="flk1">
                            {flk1Books.length === 0 ? (
                                <Card className="text-center p-8 border-none shadow-lg">
                                    <p className="text-slate-600">No FLK 1 books available yet.</p>
                                </Card>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {flk1Books.map(book => (
                                        <Card 
                                            key={book.id} 
                                            className="border-none shadow-lg hover:shadow-2xl transition-all cursor-pointer group overflow-hidden relative"
                                            onClick={() => setSelectedBook(book)}
                                        >
                                            {user?.role === 'admin' && (
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => handleDeleteBook(book.id, book.subject, e)}
                                                    disabled={deleting === book.id}
                                                >
                                                    {deleting === book.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </Button>
                                            )}
                                            <div className="h-48 bg-linear-to-br from-slate-800 via-slate-700 to-slate-900 relative overflow-hidden">
                                                <div className="absolute inset-0 opacity-20">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400 rounded-full blur-2xl"></div>
                                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400 rounded-full blur-2xl"></div>
                                                </div>
                                                <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
                                                    <div className="w-12 h-12 mb-4 bg-amber-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Gavel className="w-6 h-6 text-slate-900" />
                                                    </div>
                                                    <h3 className="text-white font-bold text-lg leading-tight">
                                                        {book.subject}
                                                    </h3>
                                                </div>
                                            </div>
                                            <CardContent className="p-6">
                                                <p className="text-slate-600 text-sm mb-3 line-clamp-2">{book.summary}</p>
                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                    <span>~{book.page_count_estimate || 'N/A'} pages</span>
                                                    <span className="font-semibold text-amber-600">Read Now →</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="flk2">
                            {flk2Books.length === 0 ? (
                                <Card className="text-center p-8 border-none shadow-lg">
                                    <p className="text-slate-600">No FLK 2 books available yet.</p>
                                </Card>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {flk2Books.map(book => (
                                        <Card 
                                            key={book.id} 
                                            className="border-none shadow-lg hover:shadow-2xl transition-all cursor-pointer group overflow-hidden relative"
                                            onClick={() => setSelectedBook(book)}
                                        >
                                            {user?.role === 'admin' && (
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => handleDeleteBook(book.id, book.subject, e)}
                                                    disabled={deleting === book.id}
                                                >
                                                    {deleting === book.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </Button>
                                            )}
                                            <div className="h-48 bg-linear-to-br from-slate-800 via-slate-700 to-slate-900 relative overflow-hidden">
                                                <div className="absolute inset-0 opacity-20">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400 rounded-full blur-2xl"></div>
                                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400 rounded-full blur-2xl"></div>
                                                </div>
                                                <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
                                                    <div className="w-12 h-12 mb-4 bg-amber-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Gavel className="w-6 h-6 text-slate-900" />
                                                    </div>
                                                    <h3 className="text-white font-bold text-lg leading-tight">
                                                        {book.subject}
                                                    </h3>
                                                </div>
                                            </div>
                                            <CardContent className="p-6">
                                                <p className="text-slate-600 text-sm mb-3 line-clamp-2">{book.summary}</p>
                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                    <span>~{book.page_count_estimate || 'N/A'} pages</span>
                                                    <span className="font-semibold text-amber-600">Read Now →</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </div>
    );
}