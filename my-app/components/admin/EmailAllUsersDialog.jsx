"use client";
import React, { useState, useEffect } from 'react';
//call api entities here
// import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Mail, Loader2, Send } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export default function EmailAllUsersDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (open) {
      User.me().then(setAdminUser).catch(() => setAdminUser(null));
    }
  }, [open]);

  const handleSendTest = async () => {
    if (!adminUser || !subject || !body) {
      toast({ variant: "destructive", title: "Please fill out all fields." });
      return;
    }
    setIsSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: adminUser.email,
        from_name: "SQEForge Admin",
        subject: `[TEST] ${subject}`,
        body: body,
      });
      toast({ title: "Test email sent successfully!", description: `Sent to ${adminUser.email}` });
    } catch (error) {
      console.error("Failed to send test email:", error);
      toast({ variant: "destructive", title: "Failed to send test email", description: error.message });
    }
    setIsSending(false);
  };

  const handleSendAll = async () => {
    if (!subject || !body) {
      toast({ variant: "destructive", title: "Please fill out all fields." });
      return;
    }
    setIsSending(true);
    try {
      const allUsers = await User.list();
      const emailPromises = allUsers.map(user => 
        base44.integrations.Core.SendEmail({
          to: user.email,
          from_name: "SQEForge",
          subject: subject,
          body: body,
        })
      );
      await Promise.all(emailPromises);
      toast({ variant: "success", title: "Emails sent to all users!", description: `Sent to ${allUsers.length} users.` });
      setOpen(false);
      setSubject('');
      setBody('');
    } catch (error) {
      console.error("Failed to send bulk email:", error);
      toast({ variant: "destructive", title: "Failed to send emails", description: error.message });
    }
    setIsSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Mail className="w-4 h-4" />
          Email All Users
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Send Email to All Users</DialogTitle>
          <DialogDescription>
            Compose a message to be sent to every registered user of the application.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Important Platform Update"
            />
          </div>
          <div>
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here..."
              className="h-48"
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
           <Button onClick={handleSendTest} variant="secondary" disabled={isSending}>
             {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
             Send Test Email
           </Button>
           <Button onClick={handleSendAll} disabled={isSending}>
             {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
             Send to All Users
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
