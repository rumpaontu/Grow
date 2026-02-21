import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { LogOut, Users, FileCheck, ListTodo, Image, DollarSign, MessageSquare, CheckCircle, XCircle, Bell, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [pendingKYC, setPendingKYC] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', url: '', task_type: 'youtube' });
  const [binanceAddress, setBinanceAddress] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [showKYCDialog, setShowKYCDialog] = useState(false);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [allWithdrawals, setAllWithdrawals] = useState([]);
  const [minWithdrawal, setMinWithdrawal] = useState(5);
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState({ title: '', message: '', user_id: '' });
  const [showBalanceEditDialog, setShowBalanceEditDialog] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [newBalance, setNewBalance] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [selectedUserForBan, setSelectedUserForBan] = useState(null);
  const [banDuration, setBanDuration] = useState(3);
  const [adminLogs, setAdminLogs] = useState([]);
  const [bannerAds, setBannerAds] = useState([]);
  const [showBannerDialog, setShowBannerDialog] = useState(false);
  const [newBanner, setNewBanner] = useState({ title: '', target_url: '', image_base64: '', active: true });
  const [editingBanner, setEditingBanner] = useState(null);
  const [bonusSettings, setBonusSettings] = useState([]);
  const [showBonusEditDialog, setShowBonusEditDialog] = useState(false);
  const [editingBonusSetting, setEditingBonusSetting] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const [usersRes, kycRes, tasksRes, inquiriesRes, transRes, binanceRes, pendingWithdrawalsRes, allWithdrawalsRes, minWithdrawalRes, notificationsRes, logsRes, bannersRes, bonusRes] = await Promise.all([
        axios.get(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/kyc/pending`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/inquiries`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/transactions/pending`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/settings/binance`),
        axios.get(`${API}/admin/withdrawals/pending`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/withdrawals/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/settings/min-withdrawal`),
        axios.get(`${API}/admin/notifications/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/logs`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/banner-ads/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/bonus-settings`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setUsers(usersRes.data.users);
      setPendingKYC(kycRes.data.users);
      setTasks(tasksRes.data.tasks);
      setInquiries(inquiriesRes.data.inquiries);
      setPendingTransactions(transRes.data.transactions);
      setBinanceAddress(binanceRes.data.binance_address);
      setPendingWithdrawals(pendingWithdrawalsRes.data.withdrawals);
      setAllWithdrawals(allWithdrawalsRes.data.withdrawals);
      setMinWithdrawal(minWithdrawalRes.data.min_withdrawal_amount);
      setNotifications(notificationsRes.data.notifications);
      setAdminLogs(logsRes.data.logs);
      setBannerAds(bannersRes.data.banners);
      setBonusSettings(bonusRes.data.settings);
    } catch (error) {
      toast.error('Failed to load admin data');
      if (error.response?.status === 401 || error.response?.status === 403) {
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

  const handleKYCAction = async (userId, action) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API}/admin/kyc/action`,
        { user_id: userId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`KYC ${action}d successfully`);
      setShowKYCDialog(false);
      fetchAdminData();
    } catch (error) {
      toast.error(`Failed to ${action} KYC`);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.url) {
      toast.error('Please fill all task fields');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API}/admin/tasks/create`,
        newTask,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Task created successfully');
      setNewTask({ title: '', url: '', task_type: 'youtube' });
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API}/admin/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Task deleted successfully');
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleUpdateBinance = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API}/admin/settings/binance`,
        { binance_address: binanceAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Binance address updated successfully');
    } catch (error) {
      toast.error('Failed to update Binance address');
    }
  };

  const handleBannerUpload = async () => {
    if (!bannerFile) {
      toast.error('Please select a banner image');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const token = localStorage.getItem('token');
      try {
        await axios.post(
          `${API}/admin/banner/upload`,
          { banner_base64: reader.result },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Banner uploaded successfully');
        setBannerFile(null);
      } catch (error) {
        toast.error('Failed to upload banner');
      }
    };
    reader.readAsDataURL(bannerFile);
  };

  const handleTransactionAction = async (transactionId, action) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API}/admin/transactions/${transactionId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Transaction ${action}d successfully`);
      fetchAdminData();
    } catch (error) {
      toast.error(`Failed to ${action} transaction`);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API}/admin/users/${userId}/update`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('User updated successfully');
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleWithdrawalAction = async (withdrawalId, action) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API}/admin/withdrawals/action`,
        { withdrawal_id: withdrawalId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Withdrawal ${action}d successfully`);
      fetchAdminData();
    } catch (error) {
      toast.error(`Failed to ${action} withdrawal`);
    }
  };

  const handleUpdateMinWithdrawal = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API}/admin/settings/min-withdrawal`,
        { min_withdrawal_amount: parseFloat(minWithdrawal) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Minimum withdrawal amount updated successfully');
    } catch (error) {
      toast.error('Failed to update minimum withdrawal amount');
    }
  };

  const handleCreateNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      toast.error('Please provide title and message');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API}/admin/notifications/create`,
        newNotification,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Notification created successfully');
      setNewNotification({ title: '', message: '', user_id: '' });
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to create notification');
    }
  };

  const handleEditBalance = async () => {
    if (!newBalance || !balanceReason) {
      toast.error('Please provide new balance and reason');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API}/admin/users/${selectedUserForEdit.id}/edit-balance`,
        { new_balance: parseFloat(newBalance), reason: balanceReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Balance updated successfully');
      setShowBalanceEditDialog(false);
      setNewBalance('');
      setBalanceReason('');
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to update balance');
    }
  };

  const handleBanUser = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API}/admin/users/${selectedUserForBan.id}/ban`,
        { duration_days: banDuration },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`User banned for ${banDuration} days`);
      setShowBanDialog(false);
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API}/admin/users/${userId}/unban`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('User unbanned successfully');
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to unban user');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API}/admin/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Notification deleted successfully');
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (editingBanner) {
          setEditingBanner({ ...editingBanner, image_base64: reader.result });
        } else {
          setNewBanner({ ...newBanner, image_base64: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateBanner = async () => {
    if (!newBanner.title || !newBanner.target_url || !newBanner.image_base64) {
      toast.error('Please provide title, URL and upload an image');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API}/admin/banner-ads/create`,
        newBanner,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Banner ad created successfully');
      setShowBannerDialog(false);
      setNewBanner({ title: '', target_url: '', image_base64: '', active: true });
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to create banner ad');
    }
  };

  const handleUpdateBanner = async () => {
    if (!editingBanner.title || !editingBanner.target_url) {
      toast.error('Please provide title and URL');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.put(
        `${API}/admin/banner-ads/${editingBanner.id}`,
        {
          title: editingBanner.title,
          target_url: editingBanner.target_url,
          active: editingBanner.active,
          image_base64: editingBanner.image_base64
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Banner ad updated successfully');
      setEditingBanner(null);
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to update banner ad');
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API}/admin/banner-ads/${bannerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Banner ad deleted successfully');
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to delete banner ad');
    }
  };

  const handleUpdateBonusSetting = async () => {
    if (!editingBonusSetting) return;

    const token = localStorage.getItem('token');
    try {
      await axios.put(
        `${API}/admin/bonus-settings/${editingBonusSetting.id}`,
        {
          target: editingBonusSetting.target,
          amount: editingBonusSetting.amount,
          enabled: editingBonusSetting.enabled
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Bonus setting updated successfully');
      setShowBonusEditDialog(false);
      setEditingBonusSetting(null);
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to update bonus setting');
    }
  };

  return (
    <div className="min-h-screen bg-dark-obsidian">
      {/* Header */}
      <header className="glass-effect sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gold font-montserrat">Admin Dashboard</h1>
          <Button
            data-testid="admin-logout-btn"
            onClick={handleLogout}
            variant="outline"
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="users" className="space-y-8">
          <TabsList className="bg-black/40 border border-white/10">
            <TabsTrigger value="users" data-testid="users-tab">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="kyc" data-testid="kyc-tab">
              <FileCheck className="w-4 h-4 mr-2" />
              KYC Approval
            </TabsTrigger>
            <TabsTrigger value="transactions" data-testid="transactions-tab">
              <DollarSign className="w-4 h-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="withdrawals" data-testid="withdrawals-tab">
              <DollarSign className="w-4 h-4 mr-2" />
              Withdrawals
            </TabsTrigger>
            <TabsTrigger value="tasks" data-testid="tasks-tab">
              <ListTodo className="w-4 h-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="settings-tab">
              <Image className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="inquiries" data-testid="inquiries-tab">
              <MessageSquare className="w-4 h-4 mr-2" />
              Inquiries
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="notifications-tab">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="ads" data-testid="ads-tab">
              <Image className="w-4 h-4 mr-2" />
              Manage Ads
            </TabsTrigger>
            <TabsTrigger value="bonuses" data-testid="bonuses-tab">
              <Award className="w-4 h-4 mr-2" />
              Bonuses
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="glass-effect p-6">
            <h2 className="text-2xl font-bold text-gold mb-6 font-montserrat">All Users</h2>
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="bg-black/40 border border-white/10 p-4" data-testid={`user-${user.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-semibold">{user.full_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-muted-foreground">Balance: <span className="text-gold">${user.balance?.toFixed(2) || '0.00'}</span></span>
                        <span className="text-muted-foreground">KYC: <span className={user.kyc_status === 'approved' ? 'text-green-500' : 'text-yellow-500'}>{user.kyc_status}</span></span>
                        {user.banned && user.banned_until && (
                          <span className="text-red-500 text-xs">Banned until: {new Date(user.banned_until).toLocaleDateString()}</span>
                        )}
                      </div>
                      {user.banned ? (
                        <Badge className="mt-2 bg-red-500 text-white">🚫 BANNED</Badge>
                      ) : (
                        <Badge className="mt-2 bg-green-500 text-white">✓ ACTIVE</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedUserForEdit(user);
                          setNewBalance(user.balance?.toString() || '0');
                          setShowBalanceEditDialog(true);
                        }}
                        variant="outline"
                        className="border-gold/30 text-gold hover:bg-gold/10"
                      >
                        Edit Balance
                      </Button>
                      {user.banned ? (
                        <Button
                          onClick={() => handleUnbanUser(user.id)}
                          variant="outline"
                          className="border-green-500/30 text-green-500 hover:bg-green-500/10"
                        >
                          Unban User
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setSelectedUserForBan(user);
                            setShowBanDialog(true);
                          }}
                          variant="outline"
                          className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                        >
                          Ban User
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Balance Edit Dialog */}
          <Dialog open={showBalanceEditDialog} onOpenChange={setShowBalanceEditDialog}>
            <DialogContent className="bg-[#1A1A1A] border-white/10">
              <DialogHeader>
                <DialogTitle className="text-gold font-montserrat text-2xl">Edit User Balance</DialogTitle>
              </DialogHeader>
              {selectedUserForEdit && (
                <div className="space-y-4 mt-4">
                  <div className="bg-black/40 border border-white/10 p-4">
                    <p className="text-white font-semibold">{selectedUserForEdit.full_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUserForEdit.email}</p>
                    <p className="text-sm mt-2">Current Balance: <span className="text-gold font-bold">${selectedUserForEdit.balance?.toFixed(2) || '0.00'}</span></p>
                  </div>
                  <div>
                    <Label htmlFor="new_balance" className="text-white">New Balance ($)</Label>
                    <Input
                      id="new_balance"
                      type="number"
                      step="0.01"
                      value={newBalance}
                      onChange={(e) => setNewBalance(e.target.value)}
                      className="bg-black/50 border-white/10 text-white mt-2"
                      placeholder="Enter new balance"
                    />
                  </div>
                  <div>
                    <Label htmlFor="balance_reason" className="text-white">Reason (Required)</Label>
                    <Input
                      id="balance_reason"
                      value={balanceReason}
                      onChange={(e) => setBalanceReason(e.target.value)}
                      className="bg-black/50 border-white/10 text-white mt-2"
                      placeholder="e.g., Manual adjustment, Bonus, Refund"
                    />
                  </div>
                  <Button
                    onClick={handleEditBalance}
                    className="w-full bg-gold text-black hover:bg-accent font-semibold py-6"
                  >
                    Update Balance
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Ban User Dialog */}
          <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
            <DialogContent className="bg-[#1A1A1A] border-white/10">
              <DialogHeader>
                <DialogTitle className="text-red-500 font-montserrat text-2xl">Ban User</DialogTitle>
              </DialogHeader>
              {selectedUserForBan && (
                <div className="space-y-4 mt-4">
                  <div className="bg-red-900/20 border border-red-500/40 p-4">
                    <p className="text-white font-semibold">{selectedUserForBan.full_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUserForBan.email}</p>
                    <p className="text-sm text-red-400 mt-2">⚠️ User can login but cannot complete tasks or claim rewards during ban period.</p>
                  </div>
                  <div>
                    <Label htmlFor="ban_duration" className="text-white">Ban Duration</Label>
                    <select
                      id="ban_duration"
                      value={banDuration}
                      onChange={(e) => setBanDuration(Number(e.target.value))}
                      className="w-full bg-black/50 border border-white/10 text-white mt-2 p-3 rounded-md"
                    >
                      <option value={3}>3 Days</option>
                      <option value={7}>7 Days</option>
                      <option value={15}>15 Days</option>
                      <option value={30}>1 Month (30 Days)</option>
                    </select>
                  </div>
                  <div className="bg-yellow-900/20 border border-yellow-500/40 p-3 text-sm text-yellow-200">
                    <p>⚠️ During ban: Package days will continue to decrease (penalty)</p>
                  </div>
                  <Button
                    onClick={handleBanUser}
                    className="w-full bg-red-500 text-white hover:bg-red-600 font-semibold py-6"
                  >
                    Confirm Ban for {banDuration} Days
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* KYC Tab */}
          <TabsContent value="kyc" className="glass-effect p-6">
            <h2 className="text-2xl font-bold text-gold mb-6 font-montserrat">Pending KYC Approvals</h2>
            <div className="space-y-3">
              {pendingKYC.map((user) => (
                <div key={user.id} className="bg-black/40 border border-white/10 p-4" data-testid={`kyc-${user.id}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{user.full_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Button
                      data-testid={`view-kyc-${user.id}-btn`}
                      onClick={() => {
                        setSelectedKYC(user);
                        setShowKYCDialog(true);
                      }}
                      className="bg-gold text-black hover:bg-accent"
                    >
                      View Documents
                    </Button>
                  </div>
                </div>
              ))}
              {pendingKYC.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No pending KYC approvals</p>
              )}
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="glass-effect p-6">
            <h2 className="text-2xl font-bold text-gold mb-6 font-montserrat">Pending Transactions</h2>
            <div className="space-y-3">
              {pendingTransactions.map((transaction) => (
                <div key={transaction.id} className="bg-black/40 border border-white/10 p-4" data-testid={`transaction-${transaction.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-semibold">Package Purchase: ${transaction.amount}</p>
                      <p className="text-sm text-muted-foreground">Transaction ID: {transaction.transaction_id}</p>
                      {transaction.screenshot && (
                        <img src={transaction.screenshot} alt="Transaction" className="mt-2 max-h-32 border border-white/10" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        data-testid={`approve-transaction-${transaction.id}-btn`}
                        onClick={() => handleTransactionAction(transaction.id, 'approve')}
                        className="bg-green-500 text-white hover:bg-green-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        data-testid={`reject-transaction-${transaction.id}-btn`}
                        onClick={() => handleTransactionAction(transaction.id, 'reject')}
                        variant="outline"
                        className="border-red-500/30 text-red-500"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingTransactions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No pending transactions</p>
              )}
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="glass-effect p-6">
            <h2 className="text-2xl font-bold text-gold mb-6 font-montserrat">Manage Tasks</h2>
            
            {/* Create New Task */}
            <div className="bg-black/40 border border-white/10 p-6 mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">Create New Task</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="task_title" className="text-white">Task Title</Label>
                  <Input
                    id="task_title"
                    data-testid="new-task-title-input"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="bg-black/50 border-white/10 text-white mt-2"
                    placeholder="Subscribe to our YouTube channel"
                  />
                </div>
                <div>
                  <Label htmlFor="task_url" className="text-white">YouTube URL</Label>
                  <Input
                    id="task_url"
                    data-testid="new-task-url-input"
                    value={newTask.url}
                    onChange={(e) => setNewTask({ ...newTask, url: e.target.value })}
                    className="bg-black/50 border-white/10 text-white mt-2"
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <Button
                  data-testid="create-task-btn"
                  onClick={handleCreateTask}
                  className="bg-gold text-black hover:bg-accent"
                >
                  Create Task
                </Button>
              </div>
            </div>

            {/* Existing Tasks */}
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="bg-black/40 border border-white/10 p-4 flex items-center justify-between" data-testid={`task-item-${task.id}`}>
                  <div>
                    <p className="text-white font-semibold">{task.title}</p>
                    <a
                      href={task.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:text-accent text-sm"
                    >
                      {task.url}
                    </a>
                  </div>
                  <Button
                    data-testid={`delete-task-${task.id}-btn`}
                    onClick={() => handleDeleteTask(task.id)}
                    variant="outline"
                    className="border-red-500/30 text-red-500"
                  >
                    Delete
                  </Button>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No tasks created yet</p>
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="glass-effect p-6 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gold mb-6 font-montserrat">Binance Address</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="binance_address" className="text-white">Binance TRC20 Address</Label>
                  <Input
                    id="binance_address"
                    data-testid="binance-address-input"
                    value={binanceAddress}
                    onChange={(e) => setBinanceAddress(e.target.value)}
                    className="bg-black/50 border-white/10 text-white mt-2"
                    placeholder="TRC20 Address"
                  />
                </div>
                <Button
                  data-testid="update-binance-btn"
                  onClick={handleUpdateBinance}
                  className="bg-gold text-black hover:bg-accent"
                >
                  Update Address
                </Button>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gold mb-6 font-montserrat">Minimum Withdrawal Amount</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="min_withdrawal" className="text-white">Minimum Amount ($)</Label>
                  <Input
                    id="min_withdrawal"
                    type="number"
                    data-testid="min-withdrawal-input"
                    value={minWithdrawal}
                    onChange={(e) => setMinWithdrawal(e.target.value)}
                    className="bg-black/50 border-white/10 text-white mt-2"
                    placeholder="5"
                    min="0"
                  />
                </div>
                <Button
                  data-testid="update-min-withdrawal-btn"
                  onClick={handleUpdateMinWithdrawal}
                  className="bg-gold text-black hover:bg-accent"
                >
                  Update Minimum Amount
                </Button>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gold mb-6 font-montserrat">Banner Ad</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Upload Banner Image</Label>
                  <input
                    data-testid="banner-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBannerFile(e.target.files[0])}
                    className="w-full mt-2 text-white"
                  />
                </div>
                <Button
                  data-testid="upload-banner-btn"
                  onClick={handleBannerUpload}
                  className="bg-gold text-black hover:bg-accent"
                >
                  Upload Banner
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="glass-effect p-6">
            <h2 className="text-2xl font-bold text-gold mb-6 font-montserrat">Pending Withdrawals</h2>
            <div className="space-y-3 mb-8">
              {pendingWithdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="bg-black/40 border border-white/10 p-4" data-testid={`pending-withdrawal-${withdrawal.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="text-white font-semibold">${withdrawal.amount.toFixed(2)}</p>
                        <span className="px-3 py-1 text-xs font-semibold bg-yellow-500/20 text-yellow-500">
                          Pending
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">User: {withdrawal.user_name} ({withdrawal.user_email})</p>
                      <p className="text-sm text-gold mt-1">To: {withdrawal.binance_address}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested: {new Date(withdrawal.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        data-testid={`approve-withdrawal-${withdrawal.id}-btn`}
                        onClick={() => handleWithdrawalAction(withdrawal.id, 'approve')}
                        className="bg-green-500 text-white hover:bg-green-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        data-testid={`reject-withdrawal-${withdrawal.id}-btn`}
                        onClick={() => handleWithdrawalAction(withdrawal.id, 'reject')}
                        variant="outline"
                        className="border-red-500/30 text-red-500"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingWithdrawals.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No pending withdrawals</p>
              )}
            </div>

            <h2 className="text-2xl font-bold text-gold mb-6 font-montserrat">All Withdrawals</h2>
            <div className="space-y-3">
              {allWithdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="bg-black/40 border border-white/10 p-4" data-testid={`withdrawal-history-${withdrawal.id}`}>
                  <div className="flex items-center justify-between">
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
                      <p className="text-sm text-muted-foreground">User: {withdrawal.user_name} ({withdrawal.user_email})</p>
                      <p className="text-sm text-gold mt-1">To: {withdrawal.binance_address}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested: {new Date(withdrawal.created_at).toLocaleDateString()}
                        {withdrawal.processed_at && ` | Processed: ${new Date(withdrawal.processed_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {allWithdrawals.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No withdrawals yet</p>
              )}
            </div>
          </TabsContent>

          {/* Inquiries Tab */}
          <TabsContent value="inquiries" className="glass-effect p-6">
            <h2 className="text-2xl font-bold text-gold mb-6 font-montserrat">Sponsor Inquiries</h2>
            <div className="space-y-3">
              {inquiries.map((inquiry) => (
                <div key={inquiry.id} className="bg-black/40 border border-white/10 p-4" data-testid={`inquiry-${inquiry.id}`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="text-white font-semibold">{inquiry.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-white">{inquiry.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Country</p>
                      <p className="text-white">{inquiry.country}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="text-gold font-semibold">{inquiry.budget}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Promo Link</p>
                      <a href={inquiry.promo_link} target="_blank" rel="noopener noreferrer" className="text-gold hover:text-accent">
                        {inquiry.promo_link}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
              {inquiries.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No sponsor inquiries</p>
              )}
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="glass-effect p-6">
            <h2 className="text-2xl font-bold text-gold mb-6 font-montserrat">Send Notification</h2>
            
            <div className="bg-black/40 border border-white/10 p-6 mb-8">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notif_title" className="text-white">Title</Label>
                  <Input
                    id="notif_title"
                    data-testid="notif-title-input"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    className="bg-black/50 border-white/10 text-white mt-2"
                    placeholder="Important Update"
                  />
                </div>
                <div>
                  <Label htmlFor="notif_message" className="text-white">Message</Label>
                  <textarea
                    id="notif_message"
                    data-testid="notif-message-input"
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 text-white mt-2 p-3 min-h-[100px]"
                    placeholder="Enter notification message..."
                  />
                </div>
                <div>
                  <Label htmlFor="notif_user" className="text-white">Send To (Optional - Leave empty for broadcast)</Label>
                  <select
                    id="notif_user"
                    data-testid="notif-user-select"
                    value={newNotification.user_id}
                    onChange={(e) => setNewNotification({ ...newNotification, user_id: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 text-white mt-2 p-3"
                  >
                    <option value="">All Users (Broadcast)</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  data-testid="send-notification-btn"
                  onClick={handleCreateNotification}
                  className="bg-gold text-black hover:bg-accent"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Send Notification
                </Button>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gold mb-6 font-montserrat">All Notifications</h2>
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div key={notif.id} className="bg-black/40 border border-white/10 p-4 flex items-center justify-between" data-testid={`notif-item-${notif.id}`}>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{notif.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{notif.message}</p>
                    <p className="text-xs text-muted-foreground">
                      To: {notif.user_name || 'All Users'} | Sent: {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    data-testid={`delete-notif-${notif.id}-btn`}
                    onClick={() => handleDeleteNotification(notif.id)}
                    variant="outline"
                    className="border-red-500/30 text-red-500"
                  >
                    Delete
                  </Button>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No notifications sent yet</p>
              )}
            </div>
          </TabsContent>

          {/* Manage Ads Tab */}
          <TabsContent value="ads" className="glass-effect p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gold font-montserrat">Manage Banner Ads</h2>
              <Dialog open={showBannerDialog} onOpenChange={setShowBannerDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gold text-black hover:bg-accent">
                    <Image className="w-4 h-4 mr-2" />
                    Create New Banner
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1A1A1A] border-white/10 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-gold font-montserrat text-2xl">Create Banner Ad</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="banner_title" className="text-white">Banner Title</Label>
                      <Input
                        id="banner_title"
                        value={newBanner.title}
                        onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                        className="bg-black/50 border-white/10 text-white mt-2"
                        placeholder="e.g., Special Promotion"
                      />
                    </div>
                    <div>
                      <Label htmlFor="banner_url" className="text-white">Target URL</Label>
                      <Input
                        id="banner_url"
                        value={newBanner.target_url}
                        onChange={(e) => setNewBanner({ ...newBanner, target_url: e.target.value })}
                        className="bg-black/50 border-white/10 text-white mt-2"
                        placeholder="https://example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="banner_image" className="text-white">Upload Banner Image</Label>
                      <Input
                        id="banner_image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="bg-black/50 border-white/10 text-white mt-2"
                      />
                      {newBanner.image_base64 && (
                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                          <img src={newBanner.image_base64} alt="Preview" className="w-full h-48 object-cover rounded-md" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="banner_active"
                        checked={newBanner.active}
                        onChange={(e) => setNewBanner({ ...newBanner, active: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="banner_active" className="text-white">Active (Show to users)</Label>
                    </div>
                    <Button
                      onClick={handleCreateBanner}
                      className="w-full bg-gold text-black hover:bg-accent font-semibold py-6"
                    >
                      Create Banner Ad
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {bannerAds.map((banner) => (
                <div key={banner.id} className="bg-black/40 border border-white/10 p-4">
                  <div className="flex gap-4">
                    <div className="w-48 h-32 flex-shrink-0">
                      <img src={banner.image_base64} alt={banner.title} className="w-full h-full object-cover rounded-md" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-white font-semibold text-lg">{banner.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            <a href={banner.target_url} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                              {banner.target_url}
                            </a>
                          </p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-muted-foreground">
                              Status: {banner.active ? (
                                <Badge className="bg-green-500 text-white ml-1">Active</Badge>
                              ) : (
                                <Badge className="bg-gray-500 text-white ml-1">Inactive</Badge>
                              )}
                            </span>
                            <span className="text-muted-foreground">Clicks: <span className="text-gold font-bold">{banner.clicks || 0}</span></span>
                            <span className="text-xs text-muted-foreground">Created: {new Date(banner.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                onClick={() => setEditingBanner(banner)}
                                variant="outline"
                                className="border-gold/30 text-gold hover:bg-gold/10"
                              >
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#1A1A1A] border-white/10 max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="text-gold font-montserrat text-2xl">Edit Banner Ad</DialogTitle>
                              </DialogHeader>
                              {editingBanner && (
                                <div className="space-y-4 mt-4">
                                  <div>
                                    <Label htmlFor="edit_banner_title" className="text-white">Banner Title</Label>
                                    <Input
                                      id="edit_banner_title"
                                      value={editingBanner.title}
                                      onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                                      className="bg-black/50 border-white/10 text-white mt-2"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit_banner_url" className="text-white">Target URL</Label>
                                    <Input
                                      id="edit_banner_url"
                                      value={editingBanner.target_url}
                                      onChange={(e) => setEditingBanner({ ...editingBanner, target_url: e.target.value })}
                                      className="bg-black/50 border-white/10 text-white mt-2"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit_banner_image" className="text-white">Replace Image (Optional)</Label>
                                    <Input
                                      id="edit_banner_image"
                                      type="file"
                                      accept="image/*"
                                      onChange={handleImageUpload}
                                      className="bg-black/50 border-white/10 text-white mt-2"
                                    />
                                    <div className="mt-4">
                                      <p className="text-sm text-muted-foreground mb-2">Current Image:</p>
                                      <img src={editingBanner.image_base64} alt="Current" className="w-full h-48 object-cover rounded-md" />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id="edit_banner_active"
                                      checked={editingBanner.active}
                                      onChange={(e) => setEditingBanner({ ...editingBanner, active: e.target.checked })}
                                      className="w-4 h-4"
                                    />
                                    <Label htmlFor="edit_banner_active" className="text-white">Active (Show to users)</Label>
                                  </div>
                                  <Button
                                    onClick={handleUpdateBanner}
                                    className="w-full bg-gold text-black hover:bg-accent font-semibold py-6"
                                  >
                                    Update Banner Ad
                                  </Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this banner ad?')) {
                                handleDeleteBanner(banner.id);
                              }
                            }}
                            variant="outline"
                            className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {bannerAds.length === 0 && (
                <div className="text-center py-12">
                  <Image className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No banner ads created yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Create your first banner ad to display promotions on user dashboard</p>
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* KYC Dialog */}
      {selectedKYC && (
        <Dialog open={showKYCDialog} onOpenChange={setShowKYCDialog}>
          <DialogContent className="bg-[#1A1A1A] border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-gold font-montserrat text-2xl">KYC Documents</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div>
                <p className="text-white font-semibold mb-2">{selectedKYC.full_name}</p>
                <p className="text-muted-foreground">{selectedKYC.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white mb-2">ID Card</p>
                  {selectedKYC.kyc_id_card && (
                    <img src={selectedKYC.kyc_id_card} alt="ID Card" className="w-full border border-white/10" />
                  )}
                </div>
                <div>
                  <p className="text-white mb-2">Selfie</p>
                  {selectedKYC.kyc_selfie && (
                    <img src={selectedKYC.kyc_selfie} alt="Selfie" className="w-full border border-white/10" />
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  data-testid="approve-kyc-btn"
                  onClick={() => handleKYCAction(selectedKYC.id, 'approve')}
                  className="flex-1 bg-green-500 text-white hover:bg-green-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve KYC
                </Button>
                <Button
                  data-testid="reject-kyc-btn"
                  onClick={() => handleKYCAction(selectedKYC.id, 'reject')}
                  variant="outline"
                  className="flex-1 border-red-500/30 text-red-500"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject KYC
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
