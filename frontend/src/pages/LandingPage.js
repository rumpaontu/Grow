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
