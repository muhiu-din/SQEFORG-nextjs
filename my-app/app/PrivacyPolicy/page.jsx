import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Shield, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Lock className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Privacy Policy</h1>
          <p className="text-slate-600">Last updated: {new Date().toLocaleDateString()}</p>
          <p className="text-sm text-slate-500 mt-2">We are committed to protecting your privacy and complying with UK GDPR and Data Protection Act 2018</p>
        </div>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-6 h-6" />
              1. Data We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-4">
            <h4 className="font-semibold">1.1 Information You Provide</h4>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, password (encrypted)</li>
              <li><strong>Payment Information:</strong> Billing details (processed by third-party payment processors)</li>
              <li><strong>Profile Information:</strong> Study preferences, exam dates, subscription tier</li>
              <li><strong>Communications:</strong> Messages you send us, feedback, support requests</li>
            </ul>

            <h4 className="font-semibold mt-4">1.2 Data Generated Through Use</h4>
            <ul>
              <li><strong>Study Activity:</strong> Questions attempted, answers given, time spent, scores, progress</li>
              <li><strong>Mock Exam Performance:</strong> Exam attempts, results, subject breakdowns</li>
              <li><strong>Usage Patterns:</strong> Features accessed, session duration, study streaks</li>
              <li><strong>Device Information:</strong> IP address, browser type, device type, operating system</li>
              <li><strong>Cookies & Analytics:</strong> Platform usage data, navigation patterns</li>
            </ul>

            <h4 className="font-semibold mt-4">1.3 Anti-Fraud & Security Monitoring</h4>
            <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4">
              <p className="font-semibold text-amber-900">⚠️ Content Protection Monitoring</p>
              <p className="text-amber-900 mt-2">
                To protect our intellectual property and enforce our Terms, we actively monitor:
              </p>
              <ul className="text-amber-900 mt-2">
                <li>• <strong>Digital watermarks</strong> embedded in all content (questions, mocks, flash cards, notes) containing your unique identifier</li>
                <li>• <strong>Access patterns</strong> - Unusual usage, multiple simultaneous logins, rapid content viewing</li>
                <li>• <strong>External platforms</strong> - Automated scanning of social media, forums, file-sharing sites for our copyrighted content</li>
                <li>• <strong>User reports</strong> - Community-reported violations</li>
                <li>• <strong>Screenshot detection attempts</strong> - Technical measures to detect unauthorized content capture</li>
              </ul>
              <p className="font-bold text-amber-900 mt-3">
                If shared content is detected, the watermark allows us to trace it back to the source account for enforcement action.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>2. How We Use Your Data</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h4 className="font-semibold">We use your data to:</h4>
            <ul>
              <li><strong>Provide Services:</strong> Deliver Platform functionality, personalize your experience, track progress</li>
              <li><strong>Process Payments:</strong> Handle subscriptions, credits, refunds</li>
              <li><strong>Improve Platform:</strong> Analyze usage patterns, fix bugs, develop new features</li>
              <li><strong>Communicate:</strong> Send account updates, platform notifications, respond to inquiries</li>
              <li><strong>Marketing:</strong> Send promotional emails (you can opt-out anytime)</li>
              <li><strong>Security & Fraud Prevention:</strong> Detect suspicious activity, enforce Terms, protect intellectual property</li>
              <li><strong>Legal Compliance:</strong> Fulfill legal obligations, enforce agreements, respond to lawful requests</li>
            </ul>

            <h4 className="font-semibold mt-4">Legal Bases (UK GDPR):</h4>
            <ul>
              <li><strong>Contract Performance:</strong> Providing services you've subscribed to</li>
              <li><strong>Legitimate Interests:</strong> Platform improvement, security, fraud prevention, IP protection</li>
              <li><strong>Consent:</strong> Marketing communications (where required)</li>
              <li><strong>Legal Obligation:</strong> Compliance with laws and regulations</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>3. Data Sharing and Disclosure</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h4 className="font-semibold">3.1 We DO NOT Sell Your Personal Data</h4>
            <p className="font-semibold text-green-700">
              We will never sell, rent, or trade your personal information to third parties for their marketing purposes.
            </p>

            <h4 className="font-semibold mt-4">3.2 We May Share Data With:</h4>
            <ul>
              <li><strong>Service Providers:</strong> Payment processors, hosting providers, analytics tools (under strict confidentiality agreements)</li>
              <li><strong>Legal Authorities:</strong> When required by law, court order, or to protect rights/safety</li>
              <li><strong>Business Transfers:</strong> In event of merger, acquisition, or asset sale (you will be notified)</li>
              <li><strong>With Your Consent:</strong> Any other sharing will require your explicit consent</li>
            </ul>

            <h4 className="font-semibold mt-4">3.3 Anonymized Data</h4>
            <p>
              We may share aggregated, anonymized data (e.g., "70% of users scored above 65%") that cannot identify you individually.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>4. Data Security</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h4 className="font-semibold">We protect your data using:</h4>
            <ul>
              <li><strong>Encryption:</strong> All data transmitted via HTTPS/TLS. Passwords are hashed and salted.</li>
              <li><strong>Access Controls:</strong> Role-based access, multi-factor authentication for admin accounts</li>
              <li><strong>Secure Hosting:</strong> Data stored on secure servers in the UK/EEA</li>
              <li><strong>Regular Audits:</strong> Security reviews and vulnerability assessments</li>
              <li><strong>Monitoring:</strong> Continuous monitoring for unauthorized access attempts</li>
            </ul>

            <p className="text-sm text-slate-600 mt-4">
              <strong>No system is 100% secure.</strong> While we implement industry-standard measures, we cannot guarantee absolute security. 
              You are responsible for keeping your password confidential and logging out of shared devices.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>5. Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h4 className="font-semibold">How Long We Keep Your Data:</h4>
            <ul>
              <li><strong>Active Accounts:</strong> For the duration of your subscription plus 6 months</li>
              <li><strong>Deleted Accounts:</strong> Most data deleted within 30 days; some retained for legal/fraud prevention (anonymized where possible)</li>
              <li><strong>Financial Records:</strong> Retained for 7 years (UK tax law requirement)</li>
              <li><strong>IP Violation Evidence:</strong> Retained indefinitely if account terminated for content sharing</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6" />
              6. Your Rights (UK GDPR)
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>You have the right to:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Erasure ("Right to be Forgotten"):</strong> Request deletion of your data (subject to legal exceptions)</li>
              <li><strong>Restrict Processing:</strong> Limit how we use your data</li>
              <li><strong>Data Portability:</strong> Receive your data in a machine-readable format</li>
              <li><strong>Object:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Withdraw Consent:</strong> For marketing or other consent-based processing</li>
              <li><strong>Lodge a Complaint:</strong> With the Information Commissioner's Office (ICO) - ico.org.uk</li>
            </ul>

            <p className="font-semibold mt-4">To Exercise Your Rights:</p>
            <p>
              Email us at privacy@sqeforge.com with your request. We will respond within 30 days. 
              We may need to verify your identity before fulfilling requests.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>7. Cookies and Tracking</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h4 className="font-semibold">We use cookies for:</h4>
            <ul>
              <li><strong>Essential:</strong> Authentication, security, Platform functionality (cannot be disabled)</li>
              <li><strong>Analytics:</strong> Understanding usage patterns, improving user experience</li>
              <li><strong>Performance:</strong> Monitoring Platform speed and reliability</li>
            </ul>

            <p className="mt-4">
              Most browsers allow you to control cookies through settings. Disabling non-essential cookies may affect Platform functionality.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>8. International Data Transfers</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              Your data is primarily stored in the UK/EEA. If we transfer data outside these regions, we ensure adequate 
              protections through standard contractual clauses or other approved mechanisms.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>9. Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              Our Platform is not intended for users under 18. If under 18, you must have parental/guardian consent to use SQEForge. 
              If we discover data from a child under 13 without parental consent, we will delete it immediately.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>10. Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              We may update this Privacy Policy periodically. Material changes will be notified via email or Platform notification. 
              The "Last updated" date at the top reflects the latest revision.
            </p>
            <p>
              Continued use after changes constitutes acceptance of the updated policy.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>11. Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              For privacy questions, data requests, or concerns:
            </p>
            <ul>
              <li><strong>Email:</strong> privacy@sqeforge.com</li>
              <li><strong>Data Protection Inquiries:</strong> dpo@sqeforge.com</li>
              <li><strong>Or use the Contact Us page within the Platform</strong></li>
            </ul>
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