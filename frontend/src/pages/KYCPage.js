import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';
import { Upload, FileText, User } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function KYCPage() {
  const navigate = useNavigate();
  const [idCard, setIdCard] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState('');
  const [selfiePreview, setSelfiePreview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'idCard') {
        setIdCard(reader.result);
        setIdCardPreview(reader.result);
      } else {
        setSelfie(reader.result);
        setSelfiePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idCard || !selfie) {
      toast.error('Please upload both ID card and selfie');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/kyc/upload`,
        {
          id_card_base64: idCard,
          selfie_base64: selfie
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast.success('KYC documents submitted successfully! Awaiting admin approval.');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit KYC');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-obsidian flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect p-8 md:p-12 max-w-2xl w-full"
      >
        <h1 className="text-4xl font-bold text-gold mb-2 font-montserrat">KYC Verification</h1>
        <p className="text-muted-foreground mb-8">
          Please upload your ID card and a selfie for verification
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ID Card Upload */}
          <div>
            <Label className="text-white text-lg mb-4 block">
              <FileText className="inline w-5 h-5 mr-2" />
              ID Card / Passport
            </Label>
            <div className="border-2 border-dashed border-white/10 hover:border-gold/50 transition-colors p-8 text-center">
              {idCardPreview ? (
                <div className="relative">
                  <img src={idCardPreview} alt="ID Card" className="max-h-48 mx-auto mb-4" />
                  <Button
                    data-testid="change-id-card-btn"
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('idCard').click()}
                    className="border-gold/30 text-gold hover:bg-gold/10"
                  >
                    Change Image
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <Button
                    data-testid="upload-id-card-btn"
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('idCard').click()}
                    className="border-gold/30 text-gold hover:bg-gold/10"
                  >
                    Upload ID Card
                  </Button>
                </div>
              )}
              <input
                id="idCard"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'idCard')}
                className="hidden"
              />
            </div>
          </div>

          {/* Selfie Upload */}
          <div>
            <Label className="text-white text-lg mb-4 block">
              <User className="inline w-5 h-5 mr-2" />
              Selfie Photo
            </Label>
            <div className="border-2 border-dashed border-white/10 hover:border-gold/50 transition-colors p-8 text-center">
              {selfiePreview ? (
                <div className="relative">
                  <img src={selfiePreview} alt="Selfie" className="max-h-48 mx-auto mb-4" />
                  <Button
                    data-testid="change-selfie-btn"
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('selfie').click()}
                    className="border-gold/30 text-gold hover:bg-gold/10"
                  >
                    Change Image
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <Button
                    data-testid="upload-selfie-btn"
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('selfie').click()}
                    className="border-gold/30 text-gold hover:bg-gold/10"
                  >
                    Upload Selfie
                  </Button>
                </div>
              )}
              <input
                id="selfie"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'selfie')}
                className="hidden"
              />
            </div>
          </div>

          <Button
            data-testid="submit-kyc-btn"
            type="submit"
            disabled={loading || !idCard || !selfie}
            className="w-full bg-gold text-black hover:bg-accent font-semibold py-6 text-lg"
          >
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
