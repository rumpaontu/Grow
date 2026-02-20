import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { LogOut, Users, FileCheck, ListTodo, Image, DollarSign, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
      const [usersRes, kycRes, tasksRes, inquiriesRes, transRes, binanceRes, pendingWithdrawalsRes, allWithdrawalsRes, minWithdrawalRes] = await Promise.all([
        axios.get(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/kyc/pending`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/inquiries`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/transactions/pending`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/settings/binance`),
        axios.get(`${API}/admin/withdrawals/pending`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/withdrawals/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/settings/min-withdrawal`)
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
                        <span className="text-muted-foreground">Balance: <span className="text-gold">${user.balance?.toFixed(2)}</span></span>
                        <span className="text-muted-foreground">KYC: <span className={user.kyc_status === 'approved' ? 'text-green-500' : 'text-yellow-500'}>{user.kyc_status}</span></span>
                        <span className="text-muted-foreground">Status: <span className={user.banned ? 'text-red-500' : 'text-green-500'}>{user.banned ? 'Banned' : 'Active'}</span></span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        data-testid={`ban-user-${user.id}-btn`}
                        onClick={() => handleUpdateUser(user.id, { banned: !user.banned })}
                        variant="outline"
                        className={user.banned ? 'border-green-500/30 text-green-500' : 'border-red-500/30 text-red-500'}
                      >
                        {user.banned ? 'Unban' : 'Ban'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

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
