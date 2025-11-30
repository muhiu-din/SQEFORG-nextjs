"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Loader2, Lock, FileText, ArrowLeft, Gavel, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { createPageUrl } from '@/utils';
import { useToast } from '@/components/ui/use-toast';

const MOCK_BOOKS = [
    {
        id: '1',
        flk_type: 'FLK 1',
        subject: 'Business Law & Practice',
        title: 'Business Law & Practice',
        summary: 'Comprehensive guide to Business Law & Practice.',
        page_count_estimate: 120,
        content: '## Introduction\nContent goes here...\n## Chapter 1\nMore content...',
    },
    {
        id: '2',
        flk_type: 'FLK 1',
        subject: 'Contract Law',
        title: 'Contract Law',
        summary: 'Learn the fundamentals of contract law.',
        page_count_estimate: 90,
        content: '## Introduction\nContent goes here...\n## Chapter 1\nMore content...',
    },
    {
        id: '3',
        flk_type: 'FLK 2',
        subject: 'Property Practice',
        title: 'Property Practice',
        summary: 'Complete revision for Property Practice.',
        page_count_estimate: 80,
        content: '## Introduction\nContent goes here...\n## Chapter 1\nMore content...',
    }
];

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
        // Mock admin user
        setUser({name: "Admin User", email: "admin@example.com", role: "admin"});
        setLoadingUser(false);
    }, []);

    useEffect(() => {
        if (user) {
            // Load mock books
            setBooks(MOCK_BOOKS);
            setLoading(false);
        }
    }, [user]);

    const handleDeleteBook = async (bookId, bookTitle, e) => {
        e.stopPropagation();
        if (!confirm(`Delete "${bookTitle}"?`)) return;

        setDeleting(bookId);
        setBooks(books.filter(b => b.id !== bookId));
        toast({
            title: "Book deleted",
            description: `${bookTitle} has been removed.`,
        });
        setDeleting(null);
    };

    if (loadingUser || loading) {
        return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-500" /></div>;
    }

    const hasAccess = user?.role === 'admin';

    if (!hasAccess) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10 flex items-center justify-center">
                <div className="max-w-3xl mx-auto text-center">
                    <Card className="border-none shadow-xl p-10">
                        <Lock className="w-16 h-16 text-amber-400 mx-auto mb-6" />
                        <h1 className="text-3xl font-bold text-slate-900 mb-4">Ultimate Plan Feature</h1>
                        <p className="text-slate-600 mb-8">
                            Upgrade to Ultimate for complete access.
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

                    <Card className="border-none shadow-2xl bg-white">
                        <CardContent className="p-8 md:p-12">
                            <h1 className="text-4xl font-bold mb-6">{selectedBook.title}</h1>
                            <ReactMarkdown>{selectedBook.content}</ReactMarkdown>
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
                        <Link href={createPageUrl("AdminRevisionBookGenerator")}>
                                <Button className="mt-6 bg-slate-900 hover:bg-slate-800">
                                    Create Revision Books
                                </Button>
                            </Link>
                    </Card>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8 h-14">
                            <TabsTrigger value="flk1" className="text-lg">FLK 1 ({flk1Books.length} books)</TabsTrigger>
                            <TabsTrigger value="flk2" className="text-lg">FLK 2 ({flk2Books.length} books)</TabsTrigger>
                        </TabsList>

                        <TabsContent value="flk1">
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
                                        <CardContent className="p-6">
                                            <h3 className="text-lg font-bold">{book.subject}</h3>
                                            <p className="text-slate-600 text-sm">{book.summary}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="flk2">
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
                                        <CardContent className="p-6">
                                            <h3 className="text-lg font-bold">{book.subject}</h3>
                                            <p className="text-slate-600 text-sm">{book.summary}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </div>
    );
}
