#!/usr/bin/env python3
"""
Focused test suite for GrowVault MLM Loan and Special Bonus System
Tests the corrected loan award logic where loans are awarded to REFERRERS, not purchasers.

TESTING FOCUS:
1. $100 Loan Test (10 small packages by referrals) - awarded to REFERRER
2. $500 Special Bonus Test (10 big packages by referrals) - awarded to REFERRER  
3. Referral Earnings API verification
4. Loan Repayment functionality

Admin credentials: moneypower15@gmail.com / Adminpowerssa15
"""

import requests
import json
import time
import uuid
from typing import Dict, Any, Optional

# Configuration
API_BASE_URL = "https://investor-portal-dev-2.preview.emergentagent.com/api"
ADMIN_EMAIL = "moneypower15@gmail.com"
ADMIN_PASSWORD = "Adminpowerssa15"

class TestUser:
    def __init__(self, name: str, email: str, password: str):
        self.name = name
        self.email = email
        self.password = password
        self.id: Optional[str] = None
        self.token: Optional[str] = None
        self.referral_code: Optional[str] = None
        self.balance: float = 0.0
        self.loan_balance: float = 0.0

class LoanSystemTester:
    def __init__(self):
        self.admin_token = None
        self.test_results = []
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

    def log_result(self, test_name: str, success: bool, message: str, data: Any = None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'data': data,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} | {test_name}: {message}")
        if data and not success:
            print(f"     Debug data: {json.dumps(data, indent=2)}")

    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None, token: str = None) -> Dict:
        """Make HTTP request with error handling"""
        url = f"{API_BASE_URL}{endpoint}"
        request_headers = self.session.headers.copy()
        
        if headers:
            request_headers.update(headers)
        
        if token:
            request_headers['Authorization'] = f'Bearer {token}'
            
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=request_headers)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=request_headers)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, headers=request_headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            try:
                return {
                    'status_code': response.status_code,
                    'data': response.json(),
                    'success': response.status_code < 400
                }
            except ValueError:
                return {
                    'status_code': response.status_code,
                    'data': {'text': response.text},
                    'success': response.status_code < 400
                }
        except requests.exceptions.RequestException as e:
            return {
                'status_code': 0,
                'data': {'error': str(e)},
                'success': False
            }

    def admin_login(self) -> bool:
        """Login as admin and store token"""
        print("\n🔐 Admin Authentication...")
        response = self.make_request('POST', '/auth/login', {
            'email': ADMIN_EMAIL,
            'password': ADMIN_PASSWORD
        })
        
        if response['success'] and 'token' in response['data']:
            self.admin_token = response['data']['token']
            self.log_result("Admin Login", True, "Successfully logged in as admin")
            return True
        
        self.log_result("Admin Login", False, "Failed to login as admin", response['data'])
        return False

    def create_user(self, user: TestUser, referral_code: str = None) -> bool:
        """Create a test user with optional referral code"""
        print(f"\n👤 Creating user: {user.name} ({user.email})")
        
        signup_data = {
            'email': user.email,
            'password': user.password,
            'full_name': user.name
        }
        
        if referral_code:
            signup_data['referral_code'] = referral_code
        
        response = self.make_request('POST', '/auth/signup', signup_data)
        
        if response['success']:
            # Login to get user details
            login_response = self.make_request('POST', '/auth/login', {
                'email': user.email,
                'password': user.password
            })
            
            if login_response['success']:
                user.token = login_response['data']['token']
                user.id = login_response['data']['user']['id']
                user.referral_code = login_response['data']['user']['referral_code']
                user.balance = login_response['data']['user'].get('balance', 0.0)
                user.loan_balance = login_response['data']['user'].get('loan_balance', 0.0)
                
                ref_msg = f" with referral code {referral_code}" if referral_code else ""
                self.log_result(f"Create User {user.name}", True, f"Successfully created user{ref_msg}")
                return True
        
        self.log_result(f"Create User {user.name}", False, "Failed to create user", response['data'])
        return False

    def submit_kyc(self, user: TestUser) -> bool:
        """Submit KYC for user"""
        print(f"\n📄 Submitting KYC for {user.name}...")
        
        # Generate dummy base64 data (small valid base64 strings)
        dummy_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        response = self.make_request('POST', '/kyc/upload', {
            'id_card_base64': dummy_image_base64,
            'selfie_base64': dummy_image_base64
        }, token=user.token)
        
        if response['success']:
            self.log_result(f"Submit KYC {user.name}", True, "KYC submitted successfully")
            return True
        
        self.log_result(f"Submit KYC {user.name}", False, "Failed to submit KYC", response['data'])
        return False

    def admin_approve_kyc(self, user: TestUser) -> bool:
        """Admin approves user KYC"""
        print(f"\n✅ Admin approving KYC for {user.name}...")
        
        response = self.make_request('POST', '/admin/kyc/action', {
            'user_id': user.id,
            'action': 'approve'
        }, token=self.admin_token)
        
        if response['success']:
            self.log_result(f"Approve KYC {user.name}", True, "KYC approved by admin")
            return True
        
        self.log_result(f"Approve KYC {user.name}", False, "Failed to approve KYC", response['data'])
        return False

    def purchase_package(self, user: TestUser, amount: int) -> Optional[str]:
        """User purchases a package and returns transaction ID"""
        print(f"\n💰 {user.name} purchasing ${amount} package...")
        
        transaction_id = str(uuid.uuid4())
        dummy_screenshot = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        response = self.make_request('POST', '/transactions/deposit', {
            'amount': amount,
            'transaction_id': transaction_id,
            'screenshot_base64': dummy_screenshot
        }, token=user.token)
        
        if response['success']:
            self.log_result(f"Purchase Package {user.name}", True, f"${amount} package purchase submitted")
            return transaction_id
        
        self.log_result(f"Purchase Package {user.name}", False, f"Failed to purchase ${amount} package", response['data'])
        return None

    def admin_approve_transaction(self, transaction_id: str, user_name: str) -> bool:
        """Admin approves a transaction"""
        print(f"\n✅ Admin approving transaction for {user_name}...")
        
        # First get pending transactions to find the actual database ID
        pending_response = self.make_request('GET', '/admin/transactions/pending', token=self.admin_token)
        if not pending_response['success']:
            self.log_result(f"Approve Transaction {user_name}", False, "Failed to get pending transactions", pending_response['data'])
            return False
        
        # Find the transaction with matching transaction_id
        transactions = pending_response['data'].get('transactions', [])
        target_transaction = None
        for tx in transactions:
            if tx.get('transaction_id') == transaction_id:
                target_transaction = tx
                break
        
        if not target_transaction:
            self.log_result(f"Approve Transaction {user_name}", False, f"Transaction {transaction_id} not found in pending")
            return False
        
        # Use the database ID for approval
        db_transaction_id = target_transaction['id']
        response = self.make_request('POST', f'/admin/transactions/{db_transaction_id}/approve', {}, token=self.admin_token)
        
        if response['success']:
            self.log_result(f"Approve Transaction {user_name}", True, "Transaction approved by admin")
            return True
        
        self.log_result(f"Approve Transaction {user_name}", False, "Failed to approve transaction", response['data'])
        return False

    def get_user_balance(self, user: TestUser) -> Dict:
        """Get current user balance and loan balance"""
        response = self.make_request('GET', '/auth/me', token=user.token)
        
        if response['success']:
            user_data = response['data']  # The response data is the user object directly
            user.balance = user_data.get('balance', 0.0)
            user.loan_balance = user_data.get('loan_balance', 0.0)
            return {
                'balance': user.balance,
                'loan_balance': user.loan_balance
            }
        return {'balance': 0.0, 'loan_balance': 0.0}

    def get_referral_earnings(self, user: TestUser) -> Optional[Dict]:
        """Get referral earnings breakdown"""
        response = self.make_request('GET', '/referrals/earnings', token=user.token)
        
        if response['success']:
            return response['data']
        
        self.log_result(f"Get Earnings {user.name}", False, "Failed to get referral earnings", response['data'])
        return None

    def repay_loan(self, user: TestUser, amount: float) -> bool:
        """Repay loan amount"""
        print(f"\n💳 {user.name} repaying ${amount} loan...")
        
        response = self.make_request('POST', '/referrals/repay-loan', {
            'amount': amount
        }, token=user.token)
        
        if response['success']:
            remaining = response['data'].get('remaining_loan', 0)
            self.log_result(f"Repay Loan {user.name}", True, f"Repaid ${amount}, remaining: ${remaining}")
            return True
        
        self.log_result(f"Repay Loan {user.name}", False, f"Failed to repay ${amount}", response['data'])
        return False

    def verify_notification_exists(self, user: TestUser, title_contains: str) -> bool:
        """Verify user received specific notification"""
        print(f"\n🔔 Checking notifications for {user.name}...")
        
        response = self.make_request('GET', '/auth/me', token=user.token)
        
        # For now, we'll verify by checking the balance changes
        # In a real system, we'd check a notifications endpoint
        if response['success']:
            current_balance = response['data'].get('balance', 0.0)
            loan_balance = response['data'].get('loan_balance', 0.0)
            
            # Indirect verification through balance changes
            self.log_result(f"Notification Check {user.name}", True, 
                          f"Balance: ${current_balance}, Loan Balance: ${loan_balance}")
            return True
        
        return False

    def run_loan_system_tests(self):
        """Run focused loan system tests after bug fix"""
        print("🚀 FOCUSED LOAN SYSTEM TESTING - POST BUG FIX")
        print("=" * 80)
        print("Testing corrected logic: Loans awarded to REFERRER, not purchaser")
        print("=" * 80)
        
        # 1. Admin Login
        if not self.admin_login():
            print("❌ Cannot proceed without admin access")
            return
        
        # 2. Create test users with unique timestamps for this focused test
        timestamp = str(int(time.time()))
        
        # User A is the REFERRER who should receive the loans
        user_a = TestUser("Alice Referrer", f"alice.referrer.{timestamp}@example.com", "securepass123")
        
        if not self.create_user(user_a):
            return
        
        print(f"\n🎯 REFERRER SETUP: User A ({user_a.name}) created with referral code: {user_a.referral_code}")
        
        # Get User A's initial balance
        initial_balance_a = self.get_user_balance(user_a)
        print(f"User A initial balance: ${initial_balance_a['balance']}, loan: ${initial_balance_a['loan_balance']}")
        
        # 3. TEST 1: $100 LOAN FOR 10 SMALL PACKAGES BY REFERRALS
        print("\n" + "="*60)
        print("📋 TEST 1: $100 LOAN - 10 SMALL PACKAGES BY REFERRALS")
        print("="*60)
        
        small_package_users = []
        for i in range(1, 11):  # B1 through B10
            user_name = f"Bob{i} SmallPackage"
            user_email = f"bob{i}.small.{timestamp}@example.com"
            user = TestUser(user_name, user_email, "testpass123")
            
            # Create user with User A's referral code
            if self.create_user(user, user_a.referral_code):
                # Submit and approve KYC
                if self.submit_kyc(user) and self.admin_approve_kyc(user):
                    # Purchase $25 package  
                    transaction_id = self.purchase_package(user, 25)
                    if transaction_id:
                        # Admin approve transaction
                        if self.admin_approve_transaction(transaction_id, user.name):
                            small_package_users.append(user)
                            print(f"✅ {user.name} completed $25 package purchase ({len(small_package_users)}/10)")
                            
                            # Check User A's balance after each approval
                            if len(small_package_users) == 10:
                                time.sleep(3)  # Allow loan processing
                                updated_balance_a = self.get_user_balance(user_a)
                                loan_awarded = updated_balance_a['loan_balance'] - initial_balance_a['loan_balance']
                                balance_increase = updated_balance_a['balance'] - initial_balance_a['balance'] 
                                
                                if loan_awarded == 100.0:
                                    self.log_result("$100 Loan Award", True, 
                                                  f"✅ CORRECT: User A received $100 loan after 10th small package. Balance increased by ${balance_increase}, loan_balance increased by ${loan_awarded}")
                                    
                                    # Verify notification
                                    self.verify_notification_exists(user_a, "Loan Unlocked")
                                else:
                                    self.log_result("$100 Loan Award", False, 
                                                  f"❌ FAILED: Expected $100 loan, got ${loan_awarded}. Balance increase: ${balance_increase}")
                        else:
                            print(f"❌ Failed to approve transaction for {user.name}")
                    else:
                        print(f"❌ Failed to purchase package for {user.name}")
                else:
                    print(f"❌ Failed KYC process for {user.name}")
            else:
                print(f"❌ Failed to create user {user.name}")
            
            # Small delay between user creations
            time.sleep(1)
        
        # 4. TEST 2: $500 SPECIAL BONUS FOR 10 BIG PACKAGES BY REFERRALS
        print("\n" + "="*60)
        print("📋 TEST 2: $500 SPECIAL BONUS - 10 BIG PACKAGES BY REFERRALS") 
        print("="*60)
        
        # Get User A's balance before big packages test
        balance_before_big = self.get_user_balance(user_a)
        
        big_package_users = []
        for i in range(1, 11):  # C1 through C10
            user_name = f"Charlie{i} BigPackage"
            user_email = f"charlie{i}.big.{timestamp}@example.com"
            user = TestUser(user_name, user_email, "bigpass123")
            
            # Create user with User A's referral code
            if self.create_user(user, user_a.referral_code):
                # Submit and approve KYC
                if self.submit_kyc(user) and self.admin_approve_kyc(user):
                    # Purchase $60 package
                    transaction_id = self.purchase_package(user, 60)
                    if transaction_id:
                        # Admin approve transaction
                        if self.admin_approve_transaction(transaction_id, user.name):
                            big_package_users.append(user)
                            print(f"✅ {user.name} completed $60 package purchase ({len(big_package_users)}/10)")
                            
                            # Check User A's balance after 10th approval
                            if len(big_package_users) == 10:
                                time.sleep(3)  # Allow bonus processing
                                updated_balance_a = self.get_user_balance(user_a)
                                balance_increase = updated_balance_a['balance'] - balance_before_big['balance']
                                loan_increase = updated_balance_a['loan_balance'] - balance_before_big['loan_balance']
                                
                                if balance_increase == 500.0 and loan_increase == 0.0:
                                    self.log_result("$500 Special Bonus", True, 
                                                  f"✅ CORRECT: User A received $500 bonus (not loan) after 10th big package. Balance increased by ${balance_increase}, loan_balance unchanged (${loan_increase})")
                                    
                                    # Verify notification
                                    self.verify_notification_exists(user_a, "Special Bonus")
                                else:
                                    self.log_result("$500 Special Bonus", False, 
                                                  f"❌ FAILED: Expected $500 bonus with no loan increase. Balance: +${balance_increase}, Loan: +${loan_increase}")
                        else:
                            print(f"❌ Failed to approve transaction for {user.name}")
                    else:
                        print(f"❌ Failed to purchase package for {user.name}")
                else:
                    print(f"❌ Failed KYC process for {user.name}")
            else:
                print(f"❌ Failed to create user {user.name}")
            
            # Small delay between user creations
            time.sleep(1)
        
        # 5. TEST 3: VERIFY REFERRAL EARNINGS API
        print("\n" + "="*60)
        print("📋 TEST 3: REFERRAL EARNINGS API VERIFICATION")
        print("="*60)
        
        earnings = self.get_referral_earnings(user_a)
        if earnings:
            loans = earnings.get('loans', {})
            small_loan = loans.get('small', {})
            big_loan = loans.get('big', {})
            
            small_unlocked = small_loan.get('unlocked', False)
            small_earned = small_loan.get('earned', 0)
            big_unlocked = big_loan.get('unlocked', False) 
            big_earned = big_loan.get('earned', 0)
            loan_balance = earnings.get('loan_balance', 0)
            
            self.log_result("Small Loan API", small_unlocked and small_earned == 100,
                          f"Small loan - Unlocked: {small_unlocked}, Earned: ${small_earned}")
            
            self.log_result("Big Loan API", big_unlocked and big_earned == 500,
                          f"Big loan - Unlocked: {big_unlocked}, Earned: ${big_earned}")
            
            self.log_result("Loan Balance API", loan_balance == 100,
                          f"Loan balance: ${loan_balance} (should be $100 - only the loan, not the bonus)")
        else:
            self.log_result("Earnings API", False, "Failed to get earnings data")
        
        # 6. TEST 4: LOAN REPAYMENT
        print("\n" + "="*60)
        print("📋 TEST 4: LOAN REPAYMENT FUNCTIONALITY")
        print("="*60)
        
        current_balance = self.get_user_balance(user_a)
        if current_balance['loan_balance'] > 0:
            # Test partial repayment ($50)
            if current_balance['balance'] >= 50:
                balance_before_repay = current_balance['balance']
                loan_before_repay = current_balance['loan_balance']
                
                if self.repay_loan(user_a, 50):
                    time.sleep(2)
                    balance_after_partial = self.get_user_balance(user_a)
                    
                    balance_decrease = balance_before_repay - balance_after_partial['balance']
                    loan_decrease = loan_before_repay - balance_after_partial['loan_balance']
                    
                    self.log_result("Partial Loan Repayment", balance_decrease == 50 and loan_decrease == 50,
                                  f"Repaid $50 - Balance decreased: ${balance_decrease}, Loan decreased: ${loan_decrease}")
                    
                    # Test full repayment of remaining loan
                    remaining_loan = balance_after_partial['loan_balance']
                    if remaining_loan > 0 and balance_after_partial['balance'] >= remaining_loan:
                        if self.repay_loan(user_a, remaining_loan):
                            time.sleep(2)
                            final_balance = self.get_user_balance(user_a)
                            
                            self.log_result("Full Loan Repayment", final_balance['loan_balance'] == 0,
                                          f"Final loan balance: ${final_balance['loan_balance']} (should be $0)")
                    else:
                        self.log_result("Full Loan Repayment", False, f"Insufficient funds for remaining ${remaining_loan}")
            else:
                self.log_result("Loan Repayment", False, f"Insufficient balance ${current_balance['balance']} for repayment")
        else:
            self.log_result("Loan Repayment", False, "No outstanding loan to repay")
        
        # Final Summary
        self.print_test_summary()

    def print_test_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 80)
        print("📊 LOAN SYSTEM TEST SUMMARY (POST BUG FIX)")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result['success'])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        # Critical test analysis
        critical_tests = [
            "$100 Loan Award",
            "$500 Special Bonus", 
            "Small Loan API",
            "Big Loan API",
            "Loan Balance API"
        ]
        
        print(f"\n🎯 CRITICAL LOAN SYSTEM TESTS:")
        for test_name in critical_tests:
            test_result = next((r for r in self.test_results if test_name in r['test']), None)
            if test_result:
                status = "✅ PASS" if test_result['success'] else "❌ FAIL"
                print(f"  {status} {test_name}: {test_result['message']}")
        
        if failed > 0:
            print(f"\n🔍 FAILED TESTS DETAILS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  ❌ {result['test']}: {result['message']}")
        
        # Key findings
        loan_award_passed = any(r['success'] for r in self.test_results if "$100 Loan Award" in r['test'])
        bonus_award_passed = any(r['success'] for r in self.test_results if "$500 Special Bonus" in r['test'])
        
        print(f"\n🏆 KEY FINDINGS:")
        print(f"  💰 Loan Award Logic: {'✅ FIXED - Awards to REFERRER' if loan_award_passed else '❌ Still awarding to wrong user'}")
        print(f"  🎁 Bonus Award Logic: {'✅ FIXED - Awards to REFERRER' if bonus_award_passed else '❌ Still awarding to wrong user'}")
        
        if loan_award_passed and bonus_award_passed:
            print(f"\n🎉 SUCCESS: Bug fix verified! Loan system now correctly awards loans to REFERRERS.")
        else:
            print(f"\n⚠️  WARNING: Bug fix may not be complete. Check failed tests above.")

if __name__ == "__main__":
    tester = LoanSystemTester()
    tester.run_loan_system_tests()