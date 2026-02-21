import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    referral_code: searchParams.get('ref') || ''
  });
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      toast.error('You must agree to the Terms & Conditions and Privacy Policy');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/signup`, formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      toast.success('Account created successfully!');
      navigate('/kyc');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-obsidian flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect p-8 md:p-12 max-w-md w-full"
      >
        <Button
          data-testid="back-to-home-btn"
          onClick={() => navigate('/')}
          variant="ghost"
          className="mb-6 text-muted-foreground hover:text-gold"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Home
        </Button>

        <h1 className="text-4xl font-bold text-gold mb-2 font-montserrat">Join GrowVault</h1>
        <p className="text-muted-foreground mb-8">Create your investor account</p>

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <Label htmlFor="full_name" className="text-white">Full Name</Label>
            <Input
              id="full_name"
              data-testid="signup-fullname-input"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="bg-black/50 border-white/10 focus:border-gold/50 text-white mt-2 h-12"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              type="email"
              data-testid="signup-email-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-black/50 border-white/10 focus:border-gold/50 text-white mt-2 h-12"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input
              id="password"
              type="password"
              data-testid="signup-password-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="bg-black/50 border-white/10 focus:border-gold/50 text-white mt-2 h-12"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <Label htmlFor="referral_code" className="text-white">Referral Code (Optional)</Label>
            <Input
              id="referral_code"
              data-testid="signup-referral-input"
              value={formData.referral_code}
              onChange={(e) => setFormData({ ...formData, referral_code: e.target.value })}
              className="bg-black/50 border-white/10 focus:border-gold/50 text-white mt-2 h-12"
              placeholder="ABC12345"
            />
          </div>

          {/* Terms and Conditions Checkbox */}
          <div className="flex items-start gap-3 p-4 bg-gold/5 border border-gold/20 rounded-lg">
            <input
              type="checkbox"
              id="terms_checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 w-5 h-5 accent-gold cursor-pointer"
              data-testid="terms-checkbox"
            />
            <label htmlFor="terms_checkbox" className="text-sm text-gray-300 cursor-pointer">
              I agree to the{' '}
              <Link to="/terms" target="_blank" className="text-gold hover:text-accent font-semibold underline">
                Terms & Conditions
              </Link>
              {' '}and{' '}
              <Link to="/privacy" target="_blank" className="text-gold hover:text-accent font-semibold underline">
                Privacy Policy
              </Link>
              {' '}of GrowVault.
            </label>
          </div>

          <Button
            data-testid="signup-submit-btn"
            type="submit"
            disabled={loading || !agreedToTerms}
            className="w-full bg-gold text-black hover:bg-accent font-semibold py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : (
              <>
                <UserPlus className="mr-2 w-5 h-5" />
                Sign Up
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-gold hover:text-accent font-semibold">
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
