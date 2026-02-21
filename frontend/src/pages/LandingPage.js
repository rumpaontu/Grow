import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, Users, Shield, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';
import WithdrawalNotification from '@/components/WithdrawalNotification';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LandingPage() {
  const navigate = useNavigate();
  const [showSponsorForm, setShowSponsorForm] = useState(false);
  const [sponsorData, setSponsorData] = useState({
    name: '',
    email: '',
    country: '',
    promo_link: '',
    budget: ''
  });

  const handleSponsorSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/sponsor/inquiry`, sponsorData);
      toast.success('Inquiry submitted successfully! We will contact you soon.');
      setShowSponsorForm(false);
      setSponsorData({ name: '', email: '', country: '', promo_link: '', budget: '' });
    } catch (error) {
      toast.error('Failed to submit inquiry');
    }
  };

  return (
    <div className="min-h-screen bg-dark-obsidian text-foreground">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://images.pexels.com/photos/15854584/pexels-photo-15854584.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-dark-obsidian/90 via-dark-obsidian/70 to-dark-obsidian"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none mb-6 font-montserrat">
              <span className="text-white">Grow</span>
              <span className="text-gold">Vault</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto font-manrope leading-relaxed">
              Empowering Global Brands, Enriching Individual Investors Since 2022.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="glass-effect p-8 hover:border-gold/30 transition-all group"
              >
                <TrendingUp className="w-12 h-12 text-gold mb-4 mx-auto" />
                <h3 className="text-3xl font-bold text-white mb-2 font-montserrat">3+</h3>
                <p className="text-muted-foreground">Years in Market</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="glass-effect p-8 hover:border-gold/30 transition-all group"
              >
                <Users className="w-12 h-12 text-gold mb-4 mx-auto" />
                <h3 className="text-3xl font-bold text-white mb-2 font-montserrat">500k+</h3>
                <p className="text-muted-foreground">Active Investors</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="glass-effect p-8 hover:border-gold/30 transition-all group"
              >
                <Shield className="w-12 h-12 text-gold mb-4 mx-auto" />
                <h3 className="text-3xl font-bold text-white mb-2 font-montserrat">100%</h3>
                <p className="text-muted-foreground">Secure Platform</p>
              </motion.div>
            </div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col md:flex-row gap-6 justify-center items-center"
            >
              <Button
                data-testid="as-sponsor-btn"
                onClick={() => setShowSponsorForm(true)}
                className="bg-gold text-black hover:bg-accent font-semibold px-10 py-6 text-lg transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)]"
              >
                As a Sponsor
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <Button
                data-testid="as-investor-btn"
                onClick={() => navigate('/login')}
                variant="outline"
                className="border-gold/30 text-gold hover:bg-gold/10 px-10 py-6 text-lg font-semibold transition-all"
              >
                As an Investor
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Supported Partners Section */}
      <div className="container mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h3 className="text-2xl font-bold text-gold mb-8 font-montserrat">Supported Partners</h3>
          <div className="flex justify-center items-center gap-12 md:gap-16 flex-wrap">
            {/* Binance Logo */}
            <div className="group">
              <div className="bg-gold/10 p-6 rounded-lg border border-gold/30 hover:border-gold/60 transition-all hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                <svg className="w-20 h-20 text-gold" viewBox="0 0 126.61 126.61" fill="currentColor">
                  <path d="M38.73 53.2l24.59-24.58 24.6 24.6 14.3-14.31L63.32 0 24.42 38.9l14.31 14.3zM0 63.31l14.3-14.3 14.31 14.3-14.3 14.3zM38.73 73.41l24.59 24.59 24.6-24.6 14.31 14.29-38.9 38.91-38.91-38.88 14.3-14.32zM98 63.31l14.3-14.3 14.31 14.3-14.3 14.3z"/>
                  <path d="M77.83 63.3L63.32 48.78 52.59 59.51l-1.246 1.245-2.045 2.046 14.51 14.52L77.83 63.3z"/>
                </svg>
              </div>
              <p className="text-gold text-sm mt-3 font-semibold">Binance</p>
            </div>

            {/* USDT Logo */}
            <div className="group">
              <div className="bg-gold/10 p-6 rounded-lg border border-gold/30 hover:border-gold/60 transition-all hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                <svg className="w-20 h-20" viewBox="0 0 2000 2000" fill="none">
                  <path d="M1000,0c552.26,0,1000,447.74,1000,1000S1552.24,2000,1000,2000,0,1552.38,0,1000,447.68,0,1000,0" fill="#50AF95"/>
                  <path d="M1123.42,866.76V718H1463.6V491.34H537.28V718H877.5V866.64C601,879.34,393.1,934.1,393.1,999.7s208,120.36,484.4,133.14v476.5h246V1132.8c276.4-12.74,484.48-67.46,484.48-133.1S1399.8,879.5,1123.42,866.76Zm0,225.64v-.12c-9.24.24-61.24,1.9-123.42,1.9-62.64,0-114.48-1.66-123.06-1.9v.12C633.18,1081.66,451,1039.12,451,988.22S633.18,894.78,877,884v360.78c8.7-.24,60.84-1.86,123.06-1.86,62.18,0,114.18,1.62,123.42,1.86V884c243.78,10.74,425.94,53.28,425.94,104.18S1367.2,1081.66,1123.42,1092.4Z" fill="#FFF"/>
                </svg>
              </div>
              <p className="text-gold text-sm mt-3 font-semibold">USDT (TRC20)</p>
            </div>

            {/* Bitcoin Logo */}
            <div className="group">
              <div className="bg-gold/10 p-6 rounded-lg border border-gold/30 hover:border-gold/60 transition-all hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                <svg className="w-20 h-20" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="16" fill="#F7931A"/>
                  <path d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z" fill="white"/>
                </svg>
              </div>
              <p className="text-gold text-sm mt-3 font-semibold">Bitcoin (BTC)</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-black/60 border-t border-gold/20 py-8 mt-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">
              © 2022-2026 GrowVault Global. All Rights Reserved.
            </p>
            <div className="flex gap-6">
              <Link to="/terms" className="text-muted-foreground hover:text-gold text-sm transition-colors">
                Terms & Conditions
              </Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-gold text-sm transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Withdrawal Notifications - Always visible on landing page */}
      <WithdrawalNotification isLoggedIn={true} />

      {/* Sponsor Form Modal */}
      {showSponsorForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-effect p-8 max-w-md w-full relative"
          >
            <button
              data-testid="close-sponsor-form-btn"
              onClick={() => setShowSponsorForm(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-3xl font-bold text-gold mb-6 font-montserrat">Sponsor Inquiry</h2>
            
            <form onSubmit={handleSponsorSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white">Full Name</Label>
                <Input
                  id="name"
                  data-testid="sponsor-name-input"
                  value={sponsorData.name}
                  onChange={(e) => setSponsorData({ ...sponsorData, name: e.target.value })}
                  className="bg-black/50 border-white/10 focus:border-gold/50 text-white mt-2"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="sponsor-email-input"
                  value={sponsorData.email}
                  onChange={(e) => setSponsorData({ ...sponsorData, email: e.target.value })}
                  className="bg-black/50 border-white/10 focus:border-gold/50 text-white mt-2"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="country" className="text-white">Country</Label>
                <Input
                  id="country"
                  data-testid="sponsor-country-input"
                  value={sponsorData.country}
                  onChange={(e) => setSponsorData({ ...sponsorData, country: e.target.value })}
                  className="bg-black/50 border-white/10 focus:border-gold/50 text-white mt-2"
                  placeholder="United States"
                  required
                />
              </div>

              <div>
                <Label htmlFor="promo_link" className="text-white">Promotion Link</Label>
                <Input
                  id="promo_link"
                  data-testid="sponsor-promo-link-input"
                  value={sponsorData.promo_link}
                  onChange={(e) => setSponsorData({ ...sponsorData, promo_link: e.target.value })}
                  className="bg-black/50 border-white/10 focus:border-gold/50 text-white mt-2"
                  placeholder="https://..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="budget" className="text-white">Budget</Label>
                <Input
                  id="budget"
                  data-testid="sponsor-budget-input"
                  value={sponsorData.budget}
                  onChange={(e) => setSponsorData({ ...sponsorData, budget: e.target.value })}
                  className="bg-black/50 border-white/10 focus:border-gold/50 text-white mt-2"
                  placeholder="$10,000"
                  required
                />
              </div>

              <Button
                data-testid="submit-sponsor-inquiry-btn"
                type="submit"
                className="w-full bg-gold text-black hover:bg-accent font-semibold py-6 text-lg mt-6"
              >
                Submit Inquiry
              </Button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
