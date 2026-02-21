import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsAndConditions() {
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
          <h1 className="text-4xl font-bold text-gold mb-2 font-montserrat">Terms & Conditions</h1>
          <p className="text-sm text-muted-foreground mb-8">Effective Date: January 1, 2022 | Last Updated: December 2024</p>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using GrowVault ("the Platform"), you accept and agree to be bound by these Terms and Conditions. 
                If you do not agree to these terms, you must not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">2. Eligibility Requirements</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong className="text-white">Age Requirement:</strong> You must be at least 18 years of age to register and use GrowVault services.</li>
                <li><strong className="text-white">One Account Policy:</strong> Each user is permitted only ONE account. Multiple accounts by the same individual are strictly prohibited and will result in immediate termination.</li>
                <li><strong className="text-white">Identity Verification:</strong> All users must complete KYC (Know Your Customer) verification before accessing investment features.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">3. Investment Packages</h2>
              <p>
                GrowVault offers investment packages with predetermined returns. All package details, including daily income rates and 
                duration, are clearly displayed on the platform. Returns are conditional upon completing daily tasks as outlined in 
                your dashboard.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">4. Referral Program</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>GrowVault operates a 2-tier referral system with instant and recurring bonuses.</li>
                <li>Referral bonuses are earned based on legitimate activity by referred users.</li>
                <li>Any attempt to manipulate the referral system will result in account suspension and forfeiture of earnings.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">5. Withdrawals</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong className="text-white">Processing Time:</strong> Withdrawal requests are processed within 24-48 hours after admin approval.</li>
                <li><strong className="text-white">Minimum Amount:</strong> Withdrawals are subject to a minimum threshold as specified on the platform.</li>
                <li><strong className="text-white">Verification Required:</strong> All withdrawal requests require approved KYC status.</li>
                <li><strong className="text-white">Payment Method:</strong> Withdrawals are processed via Binance (TRC20) to the wallet address you provide.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">6. Anti-Fraud Policy</h2>
              <p className="mb-3">
                GrowVault maintains a zero-tolerance policy for fraudulent activity. Prohibited actions include but are not limited to:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Creating multiple accounts</li>
                <li>Using fake identity documents for KYC</li>
                <li>Manipulating task completion systems</li>
                <li>Engaging in money laundering or other illegal activities</li>
                <li>Sharing account credentials or allowing unauthorized access</li>
              </ul>
              <p className="mt-3">
                <strong className="text-red-400">Violations will result in immediate account termination and forfeiture of all funds.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">7. Account Suspension and Bans</h2>
              <p>
                GrowVault reserves the right to temporarily or permanently ban users who violate these Terms. Banned users may still 
                access their dashboard to view their account status, but task completion and withdrawals will be disabled during the ban period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">8. Risk Disclosure</h2>
              <p>
                Investing carries inherent risks. Past performance does not guarantee future results. Users should only invest amounts 
                they can afford to lose. GrowVault is not responsible for any financial losses incurred through use of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">9. Intellectual Property</h2>
              <p>
                All content, trademarks, and intellectual property on GrowVault are owned by GrowVault Global. Unauthorized use, 
                reproduction, or distribution is strictly prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">10. Changes to Terms</h2>
              <p>
                GrowVault reserves the right to modify these Terms at any time. Users will be notified of significant changes via 
                email or platform notifications. Continued use of the platform after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gold mb-3">11. Contact Information</h2>
              <p>
                For questions or concerns regarding these Terms & Conditions, please contact us at:
                <br />
                <strong className="text-gold">Email:</strong> support@growvault.com
                <br />
                <strong className="text-gold">Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM EST
              </p>
            </section>

            <div className="bg-gold/10 border-l-4 border-gold p-4 mt-8">
              <p className="text-sm">
                <strong>Important:</strong> By clicking "I Agree" during registration, you acknowledge that you have read, 
                understood, and agree to be bound by these Terms and Conditions.
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
