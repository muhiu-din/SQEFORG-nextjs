"use client";
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, LifeBuoy, Send, CheckCircle, Gavel } from "lucide-react"; // Added Gavel
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSent(false);

    try {
      // Find all admin users to send the email to
      const allUsers = await User.list();
      const adminUsers = allUsers.filter(user => user.role === 'admin');

      if (adminUsers.length === 0) {
        throw new Error("No admin users configured to receive messages.");
      }

      // Create an array of email sending promises
      const emailPromises = adminUsers.map(admin => 
        base44.integrations.Core.SendEmail({
          to: admin.email, // Send to a registered admin user
          from_name: `SQEForge Feedback - ${formData.name}`, // Changed 'Contact' to 'Feedback'
          subject: `Feedback Form: ${formData.subject}`, // Changed 'Contact Form' to 'Feedback Form'
          body: `
            New feedback from: ${formData.name} (${formData.email})
            
            Message:
            ${formData.message}
          `,
        })
      );
      
      // Send all emails
      await Promise.all(emailPromises);

      setSent(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error("Feedback form error:", err); // Changed 'Contact form error' to 'Feedback form error'
      setError(err.message || "Sorry, something went wrong. Please try again later.");
    }

    setSending(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center">
            <Gavel className="w-8 h-8 text-amber-400" /> {/* Changed LifeBuoy to Gavel */}
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Support</h1> {/* Updated title */}
          <p className="text-slate-600 text-lg">
            Have a question or need help? We're here for you. {/* Updated description */}
          </p>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader className="p-8">
            <CardTitle className="text-2xl font-bold text-slate-900">
              Submit Your Feedback {/* Changed 'Send us a Message' to 'Submit Your Feedback' */}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            {sent ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="font-bold text-green-800">Feedback Sent!</AlertTitle> {/* Changed 'Message Sent!' to 'Feedback Sent!' */}
                <AlertDescription className="text-green-700">
                  Thank you for your feedback. We'll review your submission as soon as possible. {/* Updated description */}
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Your Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="mt-2 h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Your Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="mt-2 h-12"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="mt-2 h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="mt-2 h-40"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full h-14 text-lg bg-slate-900 hover:bg-slate-800"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 mr-2" />
                  )}
                  {sending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
