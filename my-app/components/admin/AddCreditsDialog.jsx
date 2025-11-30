"use client";
import React, { useState } from 'react';
import { User, AICreditLog } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Sparkles, Loader2 } from 'lucide-react';

export default function AddCreditsDialog({ user, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [creditsToAdd, setCreditsToAdd] = useState(100);
  const [reason, setReason] = useState("Admin grant");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  React.useEffect(() => {
    User.me().then(setCurrentUser);
  }, []);

  const handleGrantCredits = async () => {
    if (!creditsToAdd || creditsToAdd <= 0 || !currentUser) return;
    setLoading(true);
    try {
      const currentCredits = user.ai_credits || 0;
      const newTotal = currentCredits + parseInt(creditsToAdd, 10);
      
      await User.update(user.id, { ai_credits: newTotal });
      
      await AICreditLog.create({
        user_email: user.email,
        credits_added: parseInt(creditsToAdd, 10),
        granted_by_admin_email: currentUser.email,
        reason: reason
      });
      
      onSuccess(); // To refetch user data
      setOpen(false);
    } catch (error) {
      console.error("Failed to grant credits:", error);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Add AI Credits
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Grant AI Credits</DialogTitle>
          <DialogDescription>
            Add AI generation credits to {user.full_name}'s account. Current balance: {user.ai_credits || 0}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="credits" className="text-right">
              Credits
            </Label>
            <Input
              id="credits"
              type="number"
              value={creditsToAdd}
              onChange={(e) => setCreditsToAdd(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reason" className="text-right">
              Reason
            </Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleGrantCredits} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Grant Credits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}