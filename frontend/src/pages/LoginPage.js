import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, LogIn } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      toast.success('Login successful!');
      
      if (response.data.user.role === 'admin') {
        navigate('/admin');
      } else if (response.data.user.kyc_status === 'pending' || response.data.user.kyc_status === 'rejected') {
        navigate('/kyc');
      } else if (response.data.user.kyc_status === 'under_review') {
        toast.info('Your KYC is under review. Please wait for approval.');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
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

        <h1 className="text-4xl font-bold text-gold mb-2 font-montserrat">Welcome Back</h1>
        <p className="text-muted-foreground mb-8">Login to your GrowVault account</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              type="email"
              data-testid="login-email-input"
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
              data-testid="login-password-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="bg-black/50 border-white/10 focus:border-gold/50 text-white mt-2 h-12"
              placeholder="••••••••"
              required
            />
          </div>

          <Button
            data-testid="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-black hover:bg-accent font-semibold py-6 text-lg"
          >
            {loading ? 'Logging in...' : (
              <>
                <LogIn className="mr-2 w-5 h-5" />
                Login
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-muted-foreground mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-gold hover:text-accent font-semibold">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
