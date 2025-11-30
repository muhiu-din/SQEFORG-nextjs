"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Layers, Plus, Trash2, Edit, Play, Download, Upload, Loader2, Share2, Lock, Unlock } from 'lucide-react';
import Link from 'next/link';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

const ALL_SUBJECTS = [
  "Business Law & Practice", "Contract Law", "Tort Law", "Dispute Resolution",
  "Property Practice", "Land Law", "Wills & Administration of Estates", "Trusts",
  "Criminal Law", "Criminal Practice", "Solicitors Accounts",
  "Constitutional & Administrative Law", "EU Law",
  "The Legal System of England & Wales", "Legal Services", "Ethics & Professional Conduct", "Mixed"
];

export default function MyDecks() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decks, setDecks] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newDeck, setNewDeck] = useState({
    name: '',
    description: '',
    subject: 'Mixed',
    is_public: false
  });

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const userDecks = await base44.entities.FlashCardDeck.filter(
        { created_by: currentUser.email },
        '-created_date'
      );
      setDecks(userDecks);
    } catch (error) {
      console.error('Failed to load decks:', error);
    }
    setLoading(false);
  };

  const handleCreateDeck = async () => {
    if (!newDeck.name) return;

    try {
      await base44.entities.FlashCardDeck.create(newDeck);
      setShowCreateDialog(false);
      setNewDeck({ name: '', description: '', subject: 'Mixed', is_public: false });
      await loadDecks();
    } catch (error) {
      console.error('Failed to create deck:', error);
      alert('Failed to create deck');
    }
  };

  const handleDeleteDeck = async (deckId) => {
    if (!confirm('Are you sure you want to delete this deck?')) return;

    try {
      await base44.entities.FlashCardDeck.delete(deckId);
      await loadDecks();
    } catch (error) {
      console.error('Failed to delete deck:', error);
      alert('Failed to delete deck');
    }
  };

  const handleTogglePublic = async (deck) => {
    try {
      await base44.entities.FlashCardDeck.update(deck.id, {
        is_public: !deck.is_public
      });
      await loadDecks();
    } catch (error) {
      console.error('Failed to update deck:', error);
    }
  };

  const handleExportDeck = async (deck) => {
    try {
      const flashcards = await base44.entities.FlashCard.filter({
        id: { $in: deck.flashcard_ids }
      });

      const exportData = {
        deck: {
          name: deck.name,
          description: deck.description,
          subject: deck.subject,
          tags: deck.tags
        },
        flashcards: flashcards.map(card => ({
          front: card.front,
          back: card.back,
          subject: card.subject,
          difficulty: card.difficulty,
          tags: card.tags
        })),
        exported_at: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${deck.name.replace(/\s+/g, '_')}_deck.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export deck:', error);
      alert('Failed to export deck');
    }
  };

  const handleImportDeck = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.deck || !importData.flashcards) {
        alert('Invalid deck file format');
        return;
      }

      const createdCards = [];
      for (const cardData of importData.flashcards) {
        const card = await base44.entities.FlashCard.create(cardData);
        createdCards.push(card.id);
      }

      await base44.entities.FlashCardDeck.create({
        name: `${importData.deck.name} (Imported)`,
        description: importData.deck.description,
        subject: importData.deck.subject,
        flashcard_ids: createdCards,
        tags: importData.deck.tags || [],
        source: 'imported'
      });

      await loadDecks();
      alert(`Successfully imported ${createdCards.length} flashcards!`);
    } catch (error) {
      console.error('Failed to import deck:', error);
      alert('Failed to import deck. Please check the file format.');
    }

    event.target.value = '';
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3">My Flashcard Decks</h1>
            <p className="text-slate-600">Organize and manage your custom flashcard collections</p>
          </div>
          <div className="flex gap-3">
            <label htmlFor="import-deck">
              <Button variant="outline" className="gap-2" onClick={() => document.getElementById('import-deck').click()}>
                <Upload className="w-4 h-4" />
                Import Deck
              </Button>
              <input
                id="import-deck"
                type="file"
                accept=".json"
                onChange={handleImportDeck}
                className="hidden"
              />
            </label>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
                  <Plus className="w-4 h-4" />
                  Create Deck
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Deck</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="deck-name">Deck Name *</Label>
                    <Input
                      id="deck-name"
                      value={newDeck.name}
                      onChange={(e) => setNewDeck(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Contract Law - Formation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deck-description">Description</Label>
                    <Textarea
                      id="deck-description"
                      value={newDeck.description}
                      onChange={(e) => setNewDeck(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="What does this deck cover?"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deck-subject">Subject</Label>
                    <Select
                      value={newDeck.subject}
                      onValueChange={(value) => setNewDeck(prev => ({ ...prev, subject: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-96">
                        {ALL_SUBJECTS.map(subject => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="deck-public"
                      checked={newDeck.is_public}
                      onChange={(e) => setNewDeck(prev => ({ ...prev, is_public: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="deck-public" className="cursor-pointer">
                      Make this deck public (others can view)
                    </Label>
                  </div>
                </div>
                <Button onClick={handleCreateDeck} disabled={!newDeck.name} className="w-full">
                  Create Deck
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Layers className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Pro Tip:</strong> Create custom decks from difficult practice questions, import shared decks, 
            or build your own from scratch. Use spaced repetition for optimal learning!
          </AlertDescription>
        </Alert>

        {decks.length === 0 ? (
          <Card className="border-none shadow-xl p-12 text-center">
            <Layers className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Decks Yet</h3>
            <p className="text-slate-600 mb-6">Create your first flashcard deck to get started!</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Deck
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href={createPageUrl("QuestionBank")}>
                  <Play className="w-4 h-4" />
                  Practice Questions
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map(deck => (
              <Card key={deck.id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{deck.name}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{deck.subject}</Badge>
                        {deck.is_public ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Unlock className="w-3 h-3 mr-1" />
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Lock className="w-3 h-3 mr-1" />
                            Private
                          </Badge>
                        )}
                        {deck.source && (
                          <Badge variant="outline">{deck.source}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {deck.description && (
                    <p className="text-sm text-slate-600 mb-4">{deck.description}</p>
                  )}
                  <p className="text-sm text-slate-500 mb-4">
                    {deck.flashcard_ids?.length || 0} cards • Created {format(new Date(deck.created_date), 'MMM d, yyyy')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      asChild
                      size="sm"
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      disabled={!deck.flashcard_ids || deck.flashcard_ids.length === 0}
                    >
                      <Link href={createPageUrl(`FlashCards?deckId=${deck.id}`)}>
                        <Play className="w-4 h-4 mr-1" />
                        Study
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExportDeck(deck)}
                      disabled={!deck.flashcard_ids || deck.flashcard_ids.length === 0}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePublic(deck)}
                    >
                      {deck.is_public ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteDeck(deck.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-8 border-none shadow-lg">
          <CardHeader className="border-b">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href={createPageUrl("FlashCards")}>
                  <Layers className="w-6 h-6 mb-2" />
                  Browse All Flashcards
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href={createPageUrl("QuestionBank")}>
                  <Plus className="w-6 h-6 mb-2" />
                  Create from Questions
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href={createPageUrl("FlashCardProgress")}>
                  <Share2 className="w-6 h-6 mb-2" />
                  View Progress
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}