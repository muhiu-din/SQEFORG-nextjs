"use client";
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, AlertTriangle, FileText, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function TermsAcceptanceModal({ open, user, onAccept }) {
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [antiShareChecked, setAntiShareChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!termsChecked || !privacyChecked || !antiShareChecked) {
      alert('You must accept all three terms to continue using SQEForge');
      return;
    }

    setLoading(true);
    try {
      await base44.auth.updateMe({
        terms_accepted: true,
        terms_accepted_date: new Date().toISOString(),
        terms_version: '1.0'
      });
      onAccept();
    } catch (error) {
      console.error('Failed to save terms acceptance:', error);
      alert('Failed to save acceptance. Please try again.');
      setLoading(false);
    }
  };

  const handleOpenTerms = () => {
    window.open('/TermsAndConditions', '_blank');
  };

  const handleOpenPrivacy = () => {
    window.open('/PrivacyPolicy', '_blank');
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}} modal={true}>
      <DialogContent 
        className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="p-6 pb-4 border-b bg-white flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-slate-700" />
            <h2 className="text-2xl font-bold text-slate-900">Welcome to SQEForge</h2>
          </div>
          <p className="text-slate-600">You must review and accept our terms before accessing the platform</p>
          <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-lg">
            <p className="text-sm text-amber-900 font-medium">⚠️ Required: Tick all 3 checkboxes below to continue</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6 text-sm">
            {/* Key Terms Summary */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 text-lg mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Key Terms Summary
              </h3>
              <ul className="space-y-2 text-blue-900">
                <li>✓ You're getting access to premium SQE preparation materials</li>
                <li>✓ All content is copyrighted and for your personal use only</li>
                <li>✓ You can use materials to study and prepare for the SQE</li>
                <li>✓ Different subscription tiers have different access levels</li>
                <li>✓ You can cancel anytime (access continues until period ends)</li>
              </ul>
            </div>

            {/* Critical Prohibitions */}
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6">
              <h3 className="font-bold text-red-900 text-lg mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                STRICTLY PROHIBITED - Zero Tolerance
              </h3>
              <p className="text-red-800 mb-3 font-semibold">
                The following will result in IMMEDIATE PERMANENT BAN with NO REFUND:
              </p>
              <ul className="space-y-2 text-red-900">
                <li>✖ <strong>Sharing content</strong> - Screenshots, copy-paste, photos, recordings</li>
                <li>✖ <strong>Distributing materials</strong> - WhatsApp, forums, social media, email</li>
                <li>✖ <strong>Account sharing</strong> - Letting others use your login</li>
                <li>✖ <strong>Reselling</strong> - Creating competing products or services</li>
                <li>✖ <strong>Scraping/copying</strong> - Using bots or automated tools</li>
              </ul>
              <div className="mt-4 p-3 bg-red-100 rounded border border-red-600">
                <p className="font-bold text-red-900">WE ACTIVELY MONITOR:</p>
                <p className="text-red-800 text-sm">Content includes digital watermarks with your email. Shared content is traceable back to you.</p>
              </div>
            </div>

            {/* Refund Policy */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-6">
              <h3 className="font-bold text-amber-900 text-lg mb-3">Refund Policy</h3>
              <ul className="space-y-2 text-amber-900">
                <li>• <strong>14-day cooling-off period</strong> if you haven't used substantial content</li>
                <li>• <strong>NO REFUNDS</strong> if account terminated for Terms violations</li>
                <li>• Pro-rata refunds available for unresolved technical issues</li>
                <li>• Subscription cancellation takes effect at end of billing period</li>
              </ul>
            </div>

            {/* Privacy Summary */}
            <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6">
              <h3 className="font-bold text-purple-900 text-lg mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Your Privacy & Data
              </h3>
              <ul className="space-y-2 text-purple-900">
                <li>✓ We collect data necessary to provide services (name, email, usage)</li>
                <li>✓ We <strong>DO NOT sell</strong> your personal data to third parties</li>
                <li>✓ Data is encrypted and stored securely in the UK/EEA</li>
                <li>✓ You can access, correct, or delete your data anytime</li>
                <li>✓ We comply with UK GDPR and Data Protection Act 2018</li>
              </ul>
            </div>

            {/* Legal Documents */}
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-6 mb-4">
              <h3 className="font-bold text-slate-900 mb-3 text-lg">Full Legal Documents</h3>
              <p className="text-slate-700 mb-4">Please review the complete documents:</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleOpenTerms}
                  type="button"
                  className="inline-block px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-center cursor-pointer"
                >
                  📄 Read Full Terms and Conditions (Opens in New Tab)
                </button>
                <button
                  onClick={handleOpenPrivacy}
                  type="button"
                  className="inline-block px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-center cursor-pointer"
                >
                  🔒 Read Full Privacy Policy (Opens in New Tab)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Acceptance Checkboxes - Fixed at bottom */}
        <div className="border-t bg-white p-6 space-y-4 flex-shrink-0">
          <div className="bg-slate-100 p-4 rounded-lg mb-4">
            <p className="font-bold text-slate-900 mb-2">✓ Required Actions:</p>
            <p className="text-sm text-slate-700">Tick all 3 checkboxes below to accept and continue</p>
          </div>

          <div className="flex items-start gap-3 p-4 bg-white border-2 border-slate-300 rounded-lg hover:border-slate-400 transition-colors">
            <Checkbox 
              id="terms" 
              checked={termsChecked} 
              onCheckedChange={setTermsChecked}
              className="mt-1 flex-shrink-0"
            />
            <label htmlFor="terms" className="text-sm text-slate-900 cursor-pointer leading-tight">
              <strong>1. I accept the Terms and Conditions</strong> - including intellectual property rights, prohibited activities, and refund policy
            </label>
          </div>

          <div className="flex items-start gap-3 p-4 bg-white border-2 border-slate-300 rounded-lg hover:border-slate-400 transition-colors">
            <Checkbox 
              id="privacy" 
              checked={privacyChecked} 
              onCheckedChange={setPrivacyChecked}
              className="mt-1 flex-shrink-0"
            />
            <label htmlFor="privacy" className="text-sm text-slate-900 cursor-pointer leading-tight">
              <strong>2. I accept the Privacy Policy</strong> - I understand how my data will be collected, used, and protected
            </label>
          </div>

          <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-400 rounded-lg hover:border-red-500 transition-colors">
            <Checkbox 
              id="anti-share" 
              checked={antiShareChecked} 
              onCheckedChange={setAntiShareChecked}
              className="mt-1 flex-shrink-0"
            />
            <label htmlFor="anti-share" className="text-sm text-red-900 cursor-pointer leading-tight font-medium">
              <strong>3. I will NOT share content</strong> - I understand that sharing, distributing, or copying any content will result in immediate permanent account termination with no refund eligibility
            </label>
          </div>

          <Button 
            onClick={handleAccept}
            disabled={!termsChecked || !privacyChecked || !antiShareChecked || loading}
            className="w-full h-14 text-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : termsChecked && privacyChecked && antiShareChecked ? '✓ I Accept All Terms - Continue to SQEForge' : '⚠️ Please Tick All 3 Checkboxes Above'}
          </Button>

          <p className="text-xs text-center text-slate-500">
            By clicking "I Accept", you confirm you are 18+ or have parental consent, and you agree to be legally bound by these terms.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}