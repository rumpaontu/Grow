import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign } from 'lucide-react';

// Large pool of names from 3 regions (100+ names)
const NAMES_POOL = {
  bangladesh: [
    'Rafiq Ahmed', 'Nasrin Sultana', 'Kamal Hassan', 'Fatima Begum', 'Rahim Khan',
    'Ayesha Khatun', 'Jahangir Alam', 'Roksana Parvin', 'Habibur Rahman', 'Salma Akther',
    'Abdul Mannan', 'Rupa Begum', 'Mizanur Rahman', 'Shahana Akter', 'Faruk Hossain',
    'Taslima Nasrin', 'Monir Ahmed', 'Shamsun Nahar', 'Delwar Hossain', 'Rubina Sultana',
    'Kamrul Islam', 'Parveen Akter', 'Shafikul Islam', 'Rehana Begum', 'Anwar Hossain',
    'Nasima Khatun', 'Bazlur Rahman', 'Sultana Razia', 'Hafizur Rahman', 'Afroza Begum',
    'Mujibur Rahman', 'Rowshan Ara', 'Sirajul Islam', 'Farida Yasmin', 'Alamgir Kabir'
  ],
  india: [
    'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Gupta', 'Vikram Singh',
    'Anjali Verma', 'Rahul Joshi', 'Pooja Reddy', 'Suresh Rao', 'Kavita Mehta',
    'Arjun Malhotra', 'Deepika Iyer', 'Sanjay Desai', 'Neha Kapoor', 'Karan Choudhary',
    'Ritu Bansal', 'Manoj Agarwal', 'Swati Nair', 'Vishal Shah', 'Anita Pillai',
    'Anil Kumar', 'Meera Bhat', 'Nikhil Jain', 'Divya Srinivasan', 'Rohit Menon',
    'Sunita Rao', 'Prakash Naidu', 'Lakshmi Murthy', 'Ashok Reddy', 'Geeta Krishnan',
    'Ramesh Babu', 'Shanti Devi', 'Mohan Lal', 'Radha Kumari', 'Ganesh Prasad'
  ],
  usa: [
    'Michael Johnson', 'Emily Williams', 'David Brown', 'Sarah Davis', 'James Miller',
    'Jessica Wilson', 'Robert Garcia', 'Jennifer Martinez', 'John Rodriguez', 'Linda Lopez',
    'William Anderson', 'Mary Taylor', 'Richard Thomas', 'Patricia Moore', 'Charles Jackson',
    'Barbara White', 'Joseph Martin', 'Elizabeth Lee', 'Thomas Harris', 'Susan Clark',
    'Christopher Lewis', 'Margaret Walker', 'Daniel Hall', 'Nancy Allen', 'Matthew Young',
    'Karen King', 'Anthony Wright', 'Betty Scott', 'Mark Green', 'Lisa Baker',
    'Donald Adams', 'Sandra Nelson', 'Steven Carter', 'Ashley Mitchell', 'Paul Roberts',
    'Kimberly Turner', 'Andrew Phillips', 'Donna Campbell', 'Joshua Parker', 'Carol Evans',
    'Kenneth Edwards', 'Michelle Collins', 'Kevin Stewart', 'Amanda Morris', 'Brian Rogers',
    'Melissa Reed', 'George Cook', 'Deborah Morgan', 'Edward Bell', 'Stephanie Murphy'
  ]
};

const COUNTRIES = ['Bangladesh', 'India', 'USA'];

const WithdrawalNotification = ({ isLoggedIn }) => {
  const [notification, setNotification] = useState(null);
  const [realWithdrawals, setRealWithdrawals] = useState([]);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    console.log('WithdrawalNotification mounted. isLoggedIn:', isLoggedIn);
    // Show debug info for 10 seconds
    if (isLoggedIn) {
      setShowDebug(true);
      setTimeout(() => setShowDebug(false), 10000);
    }
  }, [isLoggedIn]);

  const getRandomName = () => {
    const region = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)].toLowerCase();
    const namesList = NAMES_POOL[region];
    const name = namesList[Math.floor(Math.random() * namesList.length)];
    const country = region.charAt(0).toUpperCase() + region.slice(1);
    return { name, country };
  };

  const getRandomAmount = () => {
    return (Math.random() * (200 - 10) + 10).toFixed(2);
  };

  const showNotification = (data) => {
    setNotification(data);
    setTimeout(() => {
      setNotification(null);
    }, 5000); // Hide after 5 seconds
  };

  // Fetch real withdrawals periodically
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchRealWithdrawals = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/withdrawals/recent-approved`);
        const data = await response.json();
        
        // Check for new withdrawals
        if (data.withdrawals && data.withdrawals.length > 0) {
          const newWithdrawals = data.withdrawals.filter(
            w => !realWithdrawals.find(rw => rw.id === w.id)
          );
          
          if (newWithdrawals.length > 0) {
            // Show the most recent real withdrawal
            const latest = newWithdrawals[0];
            showNotification({
              name: latest.user_name || 'User',
              country: 'GrowVault',
              amount: latest.amount.toFixed(2),
              isReal: true
            });
            setRealWithdrawals(data.withdrawals);
          }
        }
      } catch (error) {
        console.error('Failed to fetch real withdrawals');
      }
    };

    fetchRealWithdrawals();
    const realInterval = setInterval(fetchRealWithdrawals, 10000); // Check every 10 seconds

    return () => clearInterval(realInterval);
  }, [isLoggedIn, realWithdrawals]);

  // Show fake notifications
  useEffect(() => {
    if (!isLoggedIn) {
      console.log('WithdrawalNotification: Not logged in, skipping');
      return;
    }

    console.log('WithdrawalNotification: Starting fake notification timer');

    const showFakeNotification = () => {
      const { name, country } = getRandomName();
      const amount = getRandomAmount();
      
      console.log('Showing fake notification:', { name, country, amount });
      
      showNotification({
        name,
        country,
        amount,
        isReal: false
      });
    };

    // Show first notification after 5 seconds
    const initialTimeout = setTimeout(() => {
      showFakeNotification();
    }, 5000);

    // Random interval between 30-60 seconds for subsequent notifications
    const getRandomInterval = () => Math.random() * (60000 - 30000) + 30000;

    let intervalId;
    const startInterval = () => {
      intervalId = setInterval(() => {
        showFakeNotification();
      }, getRandomInterval());
    };

    // Start interval after first notification
    setTimeout(() => {
      startInterval();
    }, 5000 + getRandomInterval());

    return () => {
      clearTimeout(initialTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoggedIn]);

  if (!isLoggedIn) return null;

  return (
    <>
      {/* Debug indicator */}
      {showDebug && (
        <div className="fixed bottom-2 right-2 bg-gold/20 text-gold text-xs px-3 py-1 rounded border border-gold/40 z-50">
          Withdrawal notifications active
        </div>
      )}

      <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 left-6 z-50"
          style={{ maxWidth: '400px' }}
        >
          <div className="bg-gradient-to-r from-black/95 via-gray-900/95 to-black/95 border-2 border-gold/60 rounded-lg shadow-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="bg-gold/20 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-gold" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">
                  <span className="text-gold">{notification.name}</span> from {notification.country}
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Just withdrew <span className="text-green-500 font-bold">${notification.amount}</span> via Binance
                </p>
                {notification.isReal && (
                  <span className="inline-block mt-2 bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded">
                    ✓ Real Transaction
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WithdrawalNotification;
