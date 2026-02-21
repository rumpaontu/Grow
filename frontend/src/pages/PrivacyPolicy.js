import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="outline" className="mb-6 border-gold/30 text-gold hover:bg-gold/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-effect p-8"
        >
          <h1 className="text-4xl font-bold text-gold mb-2 font-montserrat">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Effective Date: January 1, 2022 | Last Updated: December 2024</p>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">1. Introduction</h2>
              <p>
                GrowVault Global ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how 
                we collect, use, disclose, and safeguard your information when you use our investment platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-white mb-2 mt-4">2.1 Personal Information</h3>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong className="text-white">Account Registration:</strong> Full name, email address, password, country of residence</li>
                <li><strong className="text-white">KYC Verification:</strong> Government-issued ID, proof of address, selfie photograph</li>
                <li><strong className="text-white">Financial Information:</strong> Wallet addresses, transaction history, investment details</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-2 mt-4">2.2 Automatically Collected Information</h3>
              <ul className="list-disc ml-6 space-y-2">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Usage patterns and activity logs</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">3. How We Use Your Information</h2>
              <p className="mb-3">We use the collected information for the following purposes:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong className="text-white">Account Management:</strong> Creating and maintaining your GrowVault account</li>
                <li><strong className="text-white">Verification:</strong> Conducting KYC checks to comply with regulatory requirements</li>
                <li><strong className="text-white">Transactions:</strong> Processing deposits, withdrawals, and referral bonuses</li>
                <li><strong className="text-white">Communication:</strong> Sending notifications about your account activity and platform updates</li>
                <li><strong className="text-white">Security:</strong> Detecting and preventing fraud, unauthorized access, and illegal activities</li>
                <li><strong className="text-white">Analytics:</strong> Improving our services and user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">4. Information Sharing and Disclosure</h2>
              <p className="mb-3">
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong className="text-white">Legal Compliance:</strong> When required by law, court order, or government regulation</li>
                <li><strong className="text-white">Service Providers:</strong> With trusted third parties who assist in platform operations (e.g., KYC verification services)</li>
                <li><strong className="text-white">Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
                <li><strong className="text-white">Protection of Rights:</strong> To protect our rights, safety, and property, or those of our users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">5. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your information, including:
              </p>
              <ul className="list-disc ml-6 space-y-2 mt-2">
                <li>Encrypted data transmission (SSL/TLS)</li>
                <li>Secure database storage with encryption at rest</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication protocols</li>
                <li>Monitoring for suspicious activity and unauthorized access</li>
              </ul>
              <p className="mt-3">
                <strong className="text-yellow-400">Note:</strong> While we strive to protect your data, no method of transmission 
                over the internet is 100% secure. Users are responsible for maintaining the confidentiality of their login credentials.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">6. Cookies and Tracking Technologies</h2>
              <p>
                GrowVault uses cookies and similar technologies to enhance user experience and analyze platform performance. 
                You can control cookie preferences through your browser settings, though disabling cookies may affect platform functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">7. Data Retention</h2>
              <p>
                We retain your personal information for as long as necessary to provide our services and comply with legal obligations. 
                Account data is retained for a minimum of 5 years after account closure for regulatory compliance purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">8. Your Rights</h2>
              <p className="mb-3">Depending on your jurisdiction, you may have the following rights:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong className="text-white">Access:</strong> Request a copy of your personal data</li>
                <li><strong className="text-white">Correction:</strong> Update or correct inaccurate information</li>
                <li><strong className="text-white">Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
                <li><strong className="text-white">Objection:</strong> Object to certain data processing activities</li>
                <li><strong className="text-white">Portability:</strong> Request transfer of your data to another service</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, please contact us at <strong className="text-gold">privacy@growvault.com</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">9. Children's Privacy</h2>
              <p>
                GrowVault is not intended for users under 18 years of age. We do not knowingly collect personal information from 
                minors. If we discover that a minor has provided personal information, we will promptly delete such data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">10. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your country of residence. We ensure 
                appropriate safeguards are in place to protect your data during international transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">11. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Material changes will be communicated via email or platform 
                notification. Your continued use of GrowVault after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">12. Contact Us</h2>
              <p>
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
                <br /><br />
                <strong className="text-gold">Email:</strong> privacy@growvault.com
                <br />
                <strong className="text-gold">Address:</strong> GrowVault Global HQ, 123 Financial District, New York, NY 10004, USA
                <br />
                <strong className="text-gold">Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM EST
              </p>
            </section>

            <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 mt-8">
              <p className="text-sm">
                <strong>Your Consent:</strong> By using GrowVault, you consent to the collection and use of your information 
                as described in this Privacy Policy.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            © 2022-2026 GrowVault Global. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
