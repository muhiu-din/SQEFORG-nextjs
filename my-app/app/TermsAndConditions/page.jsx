import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <FileText className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Terms and Conditions</h1>
          <p className="text-slate-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader className="bg-red-50 border-b border-red-200">
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="w-6 h-6" />
              CRITICAL: Zero-Tolerance Content Sharing Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="font-bold text-red-900 text-lg">
                ALL CONTENT IS STRICTLY CONFIDENTIAL AND FOR PERSONAL USE ONLY
              </p>
              
              <div className="bg-red-100 border-2 border-red-600 rounded-lg p-4">
                <h3 className="font-bold text-red-900 mb-3">IMMEDIATE PERMANENT BAN - NO REFUNDS - for:</h3>
                <ul className="space-y-2 text-red-900">
                  <li>✖ <strong>Sharing ANY content</strong> - Screenshots, photos, screen recordings, copy-paste of questions, mock exams, flash cards, study notes, or any other materials</li>
                  <li>✖ <strong>Distributing materials</strong> - Via WhatsApp, Telegram, Discord, email, forums, social media, file-sharing services, or any other medium</li>
                  <li>✖ <strong>Account sharing</strong> - Letting anyone else use your login credentials or access your account</li>
                  <li>✖ <strong>Posting about content</strong> - Discussing specific questions, answers, or materials in public forums, social media, or any external platform</li>
                  <li>✖ <strong>Creating derivative works</strong> - Rewriting, paraphrasing, or adapting our questions or materials for any purpose</li>
                  <li>✖ <strong>Automated access</strong> - Using bots, scrapers, or any automated tools to extract or access content</li>
                  <li>✖ <strong>Commercial use</strong> - Reselling, licensing, or using content for any commercial purpose whatsoever</li>
                </ul>
              </div>

              <div className="bg-amber-50 border-2 border-amber-500 rounded-lg p-4">
                <h3 className="font-bold text-amber-900 mb-2">⚠️ WE ACTIVELY MONITOR AND ENFORCE:</h3>
                <ul className="space-y-2 text-amber-900 text-sm">
                  <li>• <strong>Digital watermarks</strong> embedded in all content with your email address</li>
                  <li>• <strong>Automated detection systems</strong> scanning social media, forums, and file-sharing sites</li>
                  <li>• <strong>Community reporting</strong> - Users can report violations</li>
                  <li>• <strong>Access pattern analysis</strong> - Unusual usage patterns trigger review</li>
                  <li>• <strong>Legal action</strong> - We will pursue copyright infringement claims</li>
                </ul>
                <p className="font-bold text-amber-900 mt-3">
                  Shared content is traceable back to your account. You are personally liable for any sharing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>1. Agreement to Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              By accessing or using SQEForge ("the Platform"), you agree to be bound by these Terms and Conditions. 
              If you do not agree to all terms, you must not use the Platform.
            </p>
            <p>
              These terms constitute a legally binding agreement between you and SQEForge. Your continued use of the Platform 
              constitutes acceptance of any updated terms.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>2. Intellectual Property Rights</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p><strong>All content on SQEForge is protected by copyright, trademark, and other intellectual property laws.</strong></p>
            
            <h4 className="font-semibold mt-4">2.1 Our Property</h4>
            <p>
              We own or license all rights to:
            </p>
            <ul>
              <li>All questions, mock exams, and practice materials</li>
              <li>Flash cards, study notes, and revision materials</li>
              <li>Text, graphics, logos, icons, images</li>
              <li>Software, algorithms, and platform functionality</li>
              <li>Compilations, arrangements, and presentations of content</li>
            </ul>

            <h4 className="font-semibold mt-4">2.2 Your Limited License</h4>
            <p>
              We grant you a <strong>personal, non-transferable, non-exclusive, revocable</strong> license to:
            </p>
            <ul>
              <li>Access and use the Platform for your personal SQE preparation only</li>
              <li>View and interact with content within the Platform interface</li>
              <li>Nothing more - You may NOT download, copy, reproduce, modify, distribute, transmit, display, perform, publish, license, or create derivative works</li>
            </ul>

            <h4 className="font-semibold mt-4">2.3 Enforcement</h4>
            <p>
              Any unauthorized use terminates your license immediately. We reserve the right to pursue all available legal remedies 
              including but not limited to injunctive relief and monetary damages for copyright infringement.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>3. Subscription Plans and Access</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h4 className="font-semibold">3.1 Plan Tiers</h4>
            <ul>
              <li><strong>Starter:</strong> 500 MCQs, 4 mocks, basic features</li>
              <li><strong>Pro:</strong> 1000 MCQs, 6 mocks, 1000 flash cards per topic, advanced features</li>
              <li><strong>Ultimate:</strong> Unlimited MCQs, 18 mocks, 3000 flash cards per topic, all features</li>
            </ul>

            <h4 className="font-semibold mt-4">3.2 Billing</h4>
            <p>
              Subscriptions are billed monthly in advance. By subscribing, you authorize us to charge your payment method automatically 
              each billing cycle until you cancel.
            </p>

            <h4 className="font-semibold mt-4">3.3 Cancellation</h4>
            <p>
              You may cancel anytime. Cancellation takes effect at the end of your current billing period. 
              You will retain access until then. No refunds for partial months.
            </p>

            <h4 className="font-semibold mt-4">3.4 Access Restrictions</h4>
            <p>
              Access is tied to your subscription tier. Downgrading may result in loss of access to certain features. 
              We reserve the right to modify plan features with notice.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>4. Refund Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h4 className="font-semibold">4.1 14-Day Cooling-Off Period</h4>
            <p>
              UK residents have a 14-day cooling-off period from purchase. You may request a full refund if:
            </p>
            <ul>
              <li>You have not accessed substantial content (defined as &lt;20 questions attempted and &lt;1 mock exam taken)</li>
              <li>You contact us within 14 days of purchase</li>
            </ul>

            <h4 className="font-semibold mt-4">4.2 Technical Issues</h4>
            <p>
              If you experience unresolved technical issues preventing Platform access, we may offer pro-rata refunds at our discretion.
            </p>

            <h4 className="font-semibold mt-4">4.3 NO REFUNDS for:</h4>
            <ul className="text-red-700">
              <li>Account termination due to Terms violations (including content sharing)</li>
              <li>Change of mind after 14 days</li>
              <li>Failure to pass SQE exams</li>
              <li>Not using your subscription</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>5. Account Termination</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h4 className="font-semibold">5.1 Our Right to Terminate</h4>
            <p>
              We may suspend or terminate your account immediately, without notice or refund, if:
            </p>
            <ul>
              <li>You violate these Terms (especially content sharing prohibitions)</li>
              <li>You engage in fraudulent or illegal activity</li>
              <li>You abuse the Platform or harass other users</li>
              <li>Your payment fails or you have an outstanding balance</li>
            </ul>

            <h4 className="font-semibold mt-4">5.2 Your Right to Terminate</h4>
            <p>
              You may delete your account anytime through Platform settings or by contacting us. 
              Termination does not entitle you to a refund except as described in Section 4.
            </p>

            <h4 className="font-semibold mt-4">5.3 Effect of Termination</h4>
            <p>
              Upon termination, you immediately lose all access rights. Sections relating to intellectual property, 
              liability limitations, and dispute resolution survive termination.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>6. Disclaimer of Warranties</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p><strong>THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.</strong></p>
            <p>
              We do not guarantee:
            </p>
            <ul>
              <li>That you will pass the SQE exams</li>
              <li>Accuracy, completeness, or currency of content</li>
              <li>Uninterrupted or error-free operation</li>
              <li>That defects will be corrected</li>
              <li>Freedom from viruses or harmful components</li>
            </ul>
            <p className="font-semibold mt-4">
              Use of the Platform is at your sole risk. We strongly recommend using multiple preparation resources.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>7. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p><strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong></p>
            <p>
              SQEForge, its directors, employees, and affiliates shall not be liable for:
            </p>
            <ul>
              <li>Indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, data, or opportunities</li>
              <li>Failure to pass SQE exams</li>
              <li>Emotional distress or reputational harm</li>
            </ul>
            <p className="font-semibold">
              Our total liability to you for all claims shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
            <p className="text-sm text-slate-600 mt-4">
              Nothing in these Terms excludes liability for death/personal injury caused by negligence, fraud, or anything that cannot be excluded under UK law.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>8. Governing Law and Disputes</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction 
              of the courts of England and Wales.
            </p>
            <p>
              We encourage you to contact us first to resolve disputes informally. If unsuccessful, you may pursue claims through 
              the courts or applicable alternative dispute resolution.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>9. Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              We may modify these Terms at any time. Material changes will be notified via email or Platform notification. 
              Continued use after changes constitutes acceptance.
            </p>
            <p>
              If you do not agree to changes, you must stop using the Platform and cancel your subscription.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>10. Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              For questions about these Terms or to report violations:
            </p>
            <ul>
              <li>Email: support@sqeforge.com</li>
              <li>Or use the Contact Us page within the Platform</li>
            </ul>
            <p className="font-semibold text-red-700 mt-4">
              To report content sharing violations: violations@sqeforge.com
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link to={createPageUrl("Dashboard")}>
            <Button className="bg-slate-900 hover:bg-slate-800">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}