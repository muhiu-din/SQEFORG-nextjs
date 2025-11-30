import React, { useState } from 'react';
import { MockExam } from '@/api/entities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';

export default function EditMockDialog({ exam, open, onOpenChange, onSuccess }) {
    const { toast } = useToast();
    const [title, setTitle] = useState(exam?.title || '');
    const [description, setDescription] = useState(exam?.description || '');
    const [difficulty, setDifficulty] = useState(exam?.difficulty || 'medium'); // NEW
    const [isSaving, setIsSaving] = useState(false);

    React.useEffect(() => {
        if (exam) {
            setTitle(exam.title);
            setDescription(exam.description);
            setDifficulty(exam.difficulty || 'medium');
        }
    }, [exam]);

    const handleSave = async () => {
        if (!exam) return;
        setIsSaving(true);
        try {
            const updatedExam = await MockExam.update(exam.id, { title, description, difficulty });
            toast({ title: "Success", description: "Mock exam updated." });
            onSuccess(updatedExam);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to update mock exam:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to update mock exam." });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!exam) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Mock Exam</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                        <Label htmlFor="mock-title">Title</Label>
                        <Input id="mock-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="mock-description">Description</Label>
                        <Textarea id="mock-description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="mock-difficulty">Difficulty</Label>
                        <Select value={difficulty} onValueChange={setDifficulty}>
                            <SelectTrigger id="mock-difficulty">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}