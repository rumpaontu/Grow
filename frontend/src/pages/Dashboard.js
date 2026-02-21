import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { LogOut, Package, TrendingUp, Users, DollarSign, Clock, Play, CheckCircle, Copy, Wallet, Bell, Award, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [packages, setPackages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [referralStats, setReferralStats] = useState({ level1_count: 0, level2_count: 0 });
  const [referralTree, setReferralTree] = useState({ level1: [], level2: [] });
  const [banner, setBanner] = useState(null);
  const [binanceAddress, setBinanceAddress] = useState('');
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(25);
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState({});
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBinanceAddress, setWithdrawBinanceAddress] = useState('');
  const [minWithdrawal, setMinWithdrawal] = useState(5);
  const [withdrawals, setWithdrawals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [referralEarnings, setReferralEarnings] = useState(null);
  const [showReferralTree, setShowReferralTree] = useState(false);
  const [loanRepayAmount, setLoanRepayAmount] = useState('');
  const [showLoanRepayDialog, setShowLoanRepayDialog] = useState(false);


  useEffect(() => {
    fetchData();
    
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const [userRes, packagesRes, tasksRes, refStatsRes, refTreeRes, bannerRes, binanceRes, minWithdrawalRes, withdrawalsRes, notificationsRes, unreadCountRes, refEarningsRes] = await Promise.all([
        axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/packages/mine`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/tasks/daily`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/referrals/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/referrals/tree`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/settings/banner`),
        axios.get(`${API}/settings/binance`),
        axios.get(`${API}/settings/min-withdrawal`),
        axios.get(`${API}/withdrawals/mine`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/notifications/mine`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/notifications/unread-count`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/referrals/earnings`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setUser(userRes.data);
      setPackages(packagesRes.data.packages);
      setTasks(tasksRes.data.tasks);
      setReferralStats(refStatsRes.data);
      setReferralTree(refTreeRes.data);
      setBanner(bannerRes.data.banner_url);
      setBinanceAddress(binanceRes.data.binance_address);
      setMinWithdrawal(minWithdrawalRes.data.min_withdrawal_amount);
      setWithdrawals(withdrawalsRes.data.withdrawals);
      setNotifications(notificationsRes.data.notifications);
      setUnreadCount(unreadCountRes.data.unread_count);
      setReferralEarnings(refEarningsRes.data);

      if (userRes.data.kyc_status === 'under_review') {
        toast.info('Your KYC is under review. Some features are limited.');
      } else if (userRes.data.kyc_status === 'rejected') {
        toast.error('Your KYC was rejected. Please resubmit.');
        navigate('/kyc');
      } else if (userRes.data.kyc_status === 'pending') {
        navigate('/kyc');
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const startTimer = (taskId) => {
    setActiveTimer(taskId);
    setTimerSeconds({ ...timerSeconds, [taskId]: 30 });

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        const newSeconds = (prev[taskId] || 30) - 1;
        if (newSeconds <= 0) {
          clearInterval(interval);
          return { ...prev, [taskId]: 0 };
        }
        return { ...prev, [taskId]: newSeconds };
      });
    }, 1000);
  };

  const completeTask = async (taskId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${API}/tasks/complete`,
        { task_id: taskId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.daily_income_added > 0) {
        toast.success(`Task completed! +$${response.data.daily_income_added.toFixed(2)} added to your balance!`);
      } else {
        toast.success('Task completed!');
      }
      
      fetchData();
      fetchNotifications();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to complete task');
    }
  };

  const handlePurchaseSubmit = async () => {
    if (!transactionId || !screenshot) {
      toast.error('Please provide transaction ID and screenshot');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API}/packages/purchase`,
        {
          amount: purchaseAmount,
          transaction_id: transactionId,
          screenshot_base64: screenshot
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Package purchase submitted! Awaiting admin approval.');
      setShowPurchaseDialog(false);
      setTransactionId('');
      setScreenshot(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit purchase');
    }
  };

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshot(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/signup?ref=${user.referral_code}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied!');
  };

  const handleWithdrawalSubmit = async () => {
    if (!withdrawAmount || !withdrawBinanceAddress) {
      toast.error('Please provide withdrawal amount and Binance address');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < minWithdrawal) {
      toast.error(`Minimum withdrawal amount is $${minWithdrawal}`);
      return;
    }

    if (amount > user.balance) {
      toast.error('Insufficient balance');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API}/withdrawals/request`,
        {
          amount: amount,
          binance_address: withdrawBinanceAddress
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Withdrawal request submitted! Awaiting admin approval.');
      setShowWithdrawDialog(false);
      setWithdrawAmount('');
      setWithdrawBinanceAddress('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit withdrawal request');
    }
  };
  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const [notificationsRes, unreadCountRes] = await Promise.all([
        axios.get(`${API}/notifications/mine`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/notifications/unread-count`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const newNotifications = notificationsRes.data.notifications;
      setNotifications(newNotifications);
      setUnreadCount(unreadCountRes.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API}/notifications/mark-read`,
        { notification_id: notificationId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Immediately update local state to reflect the read status
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_unread: false, read_by: [...(n.read_by || []), user?.id] }
            : n
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Fetch fresh data from server
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read');
    }
  };

  const handleLoanRepayment = async () => {
    if (!loanRepayAmount) {
      toast.error('Please enter repayment amount');
      return;
    }

    const amount = parseFloat(loanRepayAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid repayment amount');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${API}/referrals/repay-loan`,
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Loan repayment successful! Remaining: $${response.data.remaining_loan.toFixed(2)}`);
      setShowLoanRepayDialog(false);
      setLoanRepayAmount('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to repay loan');
    }
  };



  if (!user) {
    return (
      <div className="min-h-screen bg-dark-obsidian flex items-center justify-center">
        <div className="text-gold text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-obsidian">
      {/* Header */}
      <header className="glass-effect sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gold font-montserrat">GrowVault</h1>
          <div className="flex items-center gap-4">
            <Button
              data-testid="notifications-btn"
              onClick={() => setShowNotifications(true)}
              variant="ghost"
              className="relative text-white hover:text-gold"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-gold text-black px-1.5 py-0.5 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Welcome back,</p>
              <p className="text-white font-semibold">{user.full_name}</p>
            </div>
            <Button
              data-testid="logout-btn"
              onClick={handleLogout}
              variant="outline"
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Banner Ad */}
      {banner && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <img
            src={banner}
            alt="Sponsor Banner"
            className="w-full h-48 object-cover glass-effect"
          />
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect p-6"
            data-testid="balance-card"
          >
            <DollarSign className="w-8 h-8 text-gold mb-2" />
            <p className="text-sm text-muted-foreground">Balance</p>
            <h3 className="text-3xl font-bold text-white font-montserrat">${user.balance?.toFixed(2) || '0.00'}</h3>
            <p className="text-xs text-muted-foreground mt-2">Min. Withdrawal: ${minWithdrawal}</p>
            <Button
              data-testid="withdraw-btn"
              onClick={() => setShowWithdrawDialog(true)}
              variant="outline"
              className="mt-3 w-full border-gold/30 text-gold hover:bg-gold/10 text-sm"
              disabled={user.balance < minWithdrawal}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-effect p-6"
          >
            <Package className="w-8 h-8 text-gold mb-2" />
            <p className="text-sm text-muted-foreground">Active Packages</p>
            <h3 className="text-3xl font-bold text-white font-montserrat">{packages.filter(p => p.is_active).length}</h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-effect p-6"
          >
            <Users className="w-8 h-8 text-gold mb-2" />
            <p className="text-sm text-muted-foreground">Level 1 Referrals</p>
            <h3 className="text-3xl font-bold text-white font-montserrat">{referralStats.level1_count}</h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-effect p-6"
          >
            <Users className="w-8 h-8 text-gold mb-2" />
            <p className="text-sm text-muted-foreground">Level 2 Referrals</p>
            <h3 className="text-3xl font-bold text-white font-montserrat">{referralStats.level2_count}</h3>
          </motion.div>
        </div>

        {/* Referral Link */}
        <div className="glass-effect p-6">
          <h2 className="text-xl font-bold text-gold mb-4 font-montserrat">Your Referral Link</h2>
          <div className="flex gap-2">
            <Input
              value={`${window.location.origin}/signup?ref=${user.referral_code}`}
              readOnly
              className="bg-black/50 border-white/10 text-white"
            />
            <Button
              data-testid="copy-referral-link-btn"
              onClick={copyReferralLink}
              className="bg-gold text-black hover:bg-accent"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Referral Earnings & Bonuses */}
        {referralEarnings && (
          <div className="glass-effect p-6">
            <h2 className="text-2xl font-bold text-gold mb-6 font-montserrat">💰 Referral Earnings & Bonuses</h2>
            
            {/* Total Earnings Summary */}
            <div className="bg-gradient-to-r from-gold/20 to-amber-600/20 border-2 border-gold/40 p-6 mb-6">
              <p className="text-sm text-muted-foreground mb-2">Total Referral Earnings</p>
              <h3 className="text-4xl font-bold text-gold font-montserrat">${referralEarnings.total_earned.toFixed(2)}</h3>
            </div>

            {/* Earnings Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Instant Bonuses */}
              <div className="bg-black/40 border border-white/10 p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  ⚡ Instant Bonuses
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Level 1 (5%):</span>
                    <span className="text-gold font-bold">${referralEarnings.instant_bonuses.level1.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Level 2 (2%):</span>
                    <span className="text-gold font-bold">${referralEarnings.instant_bonuses.level2.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">Total:</span>
                      <span className="text-gold font-bold text-lg">${referralEarnings.instant_bonuses.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Bonuses */}
              <div className="bg-black/40 border border-white/10 p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  📅 Daily Recurring Bonuses
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Level 1 (5%):</span>
                    <span className="text-green-500 font-bold">${referralEarnings.daily_bonuses.level1.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Level 2 (2%):</span>
                    <span className="text-green-500 font-bold">${referralEarnings.daily_bonuses.level2.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">Total:</span>
                      <span className="text-green-500 font-bold text-lg">${referralEarnings.daily_bonuses.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Milestone Bonus */}
              <div className="bg-black/40 border border-white/10 p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  🎯 Milestone Bonus
                  {referralEarnings.milestone.unlocked && <Badge className="bg-green-500 text-white">Unlocked!</Badge>}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Target:</span>
                    <span className="text-white font-semibold">20 Active Referrals</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Progress:</span>
                    <span className="text-white font-semibold">{referralEarnings.milestone.progress} / {referralEarnings.milestone.target}</span>
                  </div>
                  <Progress value={(referralEarnings.milestone.progress / referralEarnings.milestone.target) * 100} className="h-3" />
                  <div className="border-t border-white/10 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">Earned:</span>
                      <span className="text-gold font-bold text-lg">${referralEarnings.milestone.earned.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan & Special Bonuses */}
              <div className="bg-black/40 border border-white/10 p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  🏦 Loan & Special Bonuses
                </h3>
                <div className="space-y-3">
                  {/* Small Package Loan */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground text-sm">$100 Loan (10 small pkgs by refs):</span>
                      {referralEarnings.loans.small.unlocked && <Badge className="bg-blue-500 text-white">Unlocked</Badge>}
                    </div>
                    <Progress value={(referralEarnings.loans.small.progress / referralEarnings.loans.small.target) * 100} className="h-2 mb-1" />
                    <p className="text-xs text-muted-foreground">{referralEarnings.loans.small.progress}/{referralEarnings.loans.small.target} packages</p>
                  </div>
                  
                  {/* Big Package Bonus */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground text-sm">$500 Bonus (10 big pkgs by refs):</span>
                      {referralEarnings.loans.big.unlocked && <Badge className="bg-green-500 text-white">Unlocked</Badge>}
                    </div>
                    <Progress value={(referralEarnings.loans.big.progress / referralEarnings.loans.big.target) * 100} className="h-2 mb-1" />
                    <p className="text-xs text-muted-foreground">{referralEarnings.loans.big.progress}/{referralEarnings.loans.big.target} packages</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Loan Repayment Section */}
            {referralEarnings.loan_balance > 0 && (
              <div className="bg-red-900/20 border-2 border-red-500/40 p-5 mt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-red-400 mb-1">⚠️ Outstanding Loan</h3>
                    <p className="text-sm text-muted-foreground">You have an active loan that needs to be repaid</p>
                  </div>
                  <p className="text-2xl font-bold text-red-400">${referralEarnings.loan_balance.toFixed(2)}</p>
                </div>
                <Dialog open={showLoanRepayDialog} onOpenChange={setShowLoanRepayDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-red-500 text-white hover:bg-red-600">
                      Repay Loan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1A1A1A] border-white/10">
                    <DialogHeader>
                      <DialogTitle className="text-gold font-montserrat text-2xl">Repay Loan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 mt-4">
                      <div className="bg-red-900/20 border border-red-500/40 p-4">
                        <p className="text-sm text-muted-foreground mb-1">Outstanding Loan Balance</p>
                        <p className="text-2xl font-bold text-red-400">${referralEarnings.loan_balance.toFixed(2)}</p>
                      </div>
                      <div className="bg-black/40 border border-white/10 p-4">
                        <p className="text-sm text-muted-foreground mb-1">Your Available Balance</p>
                        <p className="text-2xl font-bold text-gold">${user?.balance?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <Label htmlFor="loan_repay_amount" className="text-white">Repayment Amount ($)</Label>
                        <Input
                          id="loan_repay_amount"
                          type="number"
                          value={loanRepayAmount}
                          onChange={(e) => setLoanRepayAmount(e.target.value)}
                          className="bg-black/50 border-white/10 text-white mt-2"
                          placeholder="Enter amount to repay"
                          max={referralEarnings.loan_balance}
                        />
                      </div>
                      <Button
                        onClick={handleLoanRepayment}
                        className="w-full bg-red-500 text-white hover:bg-red-600 py-6"
                      >
                        Confirm Repayment
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        )}

        {/* Daily Tasks */}
        <div className="glass-effect p-6">
          <h2 className="text-2xl font-bold text-gold mb-6 font-montserrat">Daily Tasks</h2>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="bg-black/40 border border-white/10 p-6 hover:border-gold/30 transition-all" data-testid={`task-${task.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{task.title}</h3>
                    <a
                      href={task.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:text-accent text-sm"
                    >
                      {task.url}
                    </a>
                  </div>
                  <div>
                    {task.completed ? (
                      <div className="flex items-center gap-2 text-green-500">
                        <CheckCircle className="w-5 h-5" />
                        <span>Completed</span>
                      </div>
                    ) : activeTimer === task.id ? (
                      <div className="text-center">
                        <p className="text-gold font-bold text-2xl mb-2">{timerSeconds[task.id] || 0}s</p>
                        {timerSeconds[task.id] === 0 ? (
                          <Button
                            data-testid={`complete-task-${task.id}-btn`}
                            onClick={() => completeTask(task.id)}
                            className="bg-gold text-black hover:bg-accent"
                          >
                            Claim
                          </Button>
                        ) : (
                          <p className="text-sm text-muted-foreground">Wait...</p>
                        )}
                      </div>
                    ) : (
                      <Button
                        data-testid={`start-task-${task.id}-btn`}
                        onClick={() => startTimer(task.id)}
                        className="bg-gold text-black hover:bg-accent"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No tasks available</p>
            )}
          </div>
        </div>

        {/* Active Packages */}
        <div className="glass-effect p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gold font-montserrat">My Packages</h2>
            <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
              <DialogTrigger asChild>
                <Button
                  data-testid="purchase-package-btn"
                  className="bg-gold text-black hover:bg-accent"
                  disabled={user.kyc_status !== 'approved'}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Purchase Package
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1A1A1A] border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-gold font-montserrat text-2xl">Purchase Package</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 mt-4">
                  <div>
                    <Label className="text-white mb-4 block">Select Package</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        data-testid="select-package-25-btn"
                        onClick={() => setPurchaseAmount(25)}
                        className={`p-4 border-2 transition-all ${
                          purchaseAmount === 25
                            ? 'border-gold bg-gold/10'
                            : 'border-white/10 hover:border-gold/30'
                        }`}
                      >
                        <p className="text-gold font-bold text-2xl">$25</p>
                        <p className="text-sm text-muted-foreground">$1/day for 60 days</p>
                      </button>
                      <button
                        data-testid="select-package-60-btn"
                        onClick={() => setPurchaseAmount(60)}
                        className={`p-4 border-2 transition-all ${
                          purchaseAmount === 60
                            ? 'border-gold bg-gold/10'
                            : 'border-white/10 hover:border-gold/30'
                        }`}
                      >
                        <p className="text-gold font-bold text-2xl">$60</p>
                        <p className="text-sm text-muted-foreground">$2.5/day for 60 days</p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Binance TRC20 Address</Label>
                    <Input
                      value={binanceAddress}
                      readOnly
                      className="bg-black/50 border-white/10 text-gold mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="transaction_id" className="text-white">Transaction ID</Label>
                    <Input
                      id="transaction_id"
                      data-testid="transaction-id-input"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="bg-black/50 border-white/10 text-white mt-2"
                      placeholder="Enter transaction ID"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Payment Screenshot</Label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotUpload}
                      className="w-full mt-2 text-white"
                    />
                  </div>

                  <Button
                    data-testid="submit-purchase-btn"
                    onClick={handlePurchaseSubmit}
                    className="w-full bg-gold text-black hover:bg-accent py-6"
                  >
                    Submit Purchase Request
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.id} className="bg-black/40 border border-white/10 p-6" data-testid={`package-${pkg.id}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gold">${pkg.amount} Package</h3>
                  <span className={`px-3 py-1 text-xs font-semibold ${
                    pkg.is_active ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'
                  }`}>
                    {pkg.is_active ? 'Active' : 'Completed'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Daily Income:</span>
                    <span className="text-white font-semibold">${pkg.daily_income}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Days Remaining:</span>
                    <span className="text-white font-semibold">{pkg.days_remaining}/60</span>
                  </div>
                  <Progress value={(60 - pkg.days_remaining) / 60 * 100} className="h-2" />
                </div>
              </div>
            ))}
            {packages.length === 0 && (
              <p className="text-center text-muted-foreground py-8 col-span-2">No packages purchased yet</p>
            )}
          </div>
        </div>

        {/* Referral Tree */}
        <div className="glass-effect p-6">
          <h2 className="text-2xl font-bold text-gold mb-6 font-montserrat">Referral Network</h2>
          
          {/* Level 1 */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Level 1 (Direct Referrals)</h3>
            <div className="space-y-3">
              {referralTree.level1.map((ref) => (
                <div key={ref.id} className="bg-black/40 border border-white/10 p-4 flex items-center justify-between" data-testid={`level1-ref-${ref.id}`}>
                  <div>
                    <p className="text-white font-semibold">{ref.full_name}</p>
                    <p className="text-sm text-muted-foreground">{ref.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gold font-semibold">${ref.balance?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs text-muted-foreground">Balance</p>
                  </div>
                </div>
              ))}
              {referralTree.level1.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No Level 1 referrals yet</p>
              )}
            </div>
          </div>

          {/* Level 2 */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Level 2 (Indirect Referrals)</h3>
            <div className="space-y-3">
              {referralTree.level2.map((ref) => (
                <div key={ref.id} className="bg-black/40 border border-white/10 p-4 flex items-center justify-between" data-testid={`level2-ref-${ref.id}`}>
                  <div>
                    <p className="text-white font-semibold">{ref.full_name}</p>
                    <p className="text-sm text-muted-foreground">{ref.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gold font-semibold">${ref.balance?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs text-muted-foreground">Balance</p>
                  </div>
                </div>
              ))}
              {referralTree.level2.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No Level 2 referrals yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="glass-effect p-6">
          <h2 className="text-2xl font-bold text-gold mb-6 font-montserrat">Withdrawal History</h2>
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="bg-black/40 border border-white/10 p-4 flex items-center justify-between" data-testid={`withdrawal-${withdrawal.id}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-white font-semibold">${withdrawal.amount.toFixed(2)}</p>
                    <span className={`px-3 py-1 text-xs font-semibold ${
                      withdrawal.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                      withdrawal.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                      'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">To: {withdrawal.binance_address}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requested: {new Date(withdrawal.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {withdrawals.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No withdrawal requests yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Withdrawal Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="bg-[#1A1A1A] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-gold font-montserrat text-2xl">Withdraw Balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="bg-black/40 border border-white/10 p-4">
              <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-gold">${user?.balance?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-muted-foreground mt-2">Minimum withdrawal: ${minWithdrawal}</p>
            </div>

            <div>
              <Label htmlFor="withdraw_amount" className="text-white">Withdrawal Amount ($)</Label>
              <Input
                id="withdraw_amount"
                type="number"
                data-testid="withdraw-amount-input"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="bg-black/50 border-white/10 text-white mt-2"
                placeholder={`Min: $${minWithdrawal}`}
                min={minWithdrawal}
                max={user?.balance || 0}
              />
            </div>

            <div>
              <Label htmlFor="binance_address" className="text-white">Your Binance TRC20 Address</Label>
              <Input
                id="binance_address"
                data-testid="binance-address-input"
                value={withdrawBinanceAddress}
                onChange={(e) => setWithdrawBinanceAddress(e.target.value)}
                className="bg-black/50 border-white/10 text-white mt-2"
                placeholder="Enter your Binance TRC20 address"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Make sure your address is correct. Funds sent to wrong address cannot be recovered.
              </p>
            </div>

            <Button
              data-testid="submit-withdrawal-btn"
              onClick={handleWithdrawalSubmit}
              className="w-full bg-gold text-black hover:bg-accent py-6"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Submit Withdrawal Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gold font-montserrat text-2xl">Notifications</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4 max-h-[500px] overflow-y-auto">
            {notifications.map((notification) => {
              const isRead = !notification.is_unread;
              return (
                <div
                  key={notification.id}
                  className={`p-4 border transition-all cursor-pointer ${
                    isRead
                      ? 'bg-black/20 border-white/5'
                      : 'bg-gold/10 border-gold/30'
                  }`}
                  onClick={() => !isRead && handleMarkAsRead(notification.id)}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">{notification.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!isRead && (
                      <Badge className="bg-gold text-black ml-2">New</Badge>
                    )}
                  </div>
                </div>
              );
            })}
            {notifications.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No notifications</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
