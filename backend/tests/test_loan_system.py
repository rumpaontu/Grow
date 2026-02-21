#!/usr/bin/env python3
"""
Extended test for milestone bonuses and loan system
Tests specific scenarios for loan eligibility and milestone bonuses
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

class ExtendedTester:
    def __init__(self):
        self.admin_token = None
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None) -> Dict:
        """Make HTTP request with error handling"""
        url = f"{API_BASE_URL}{endpoint}"
        headers = self.session.headers.copy()
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
            
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            
            return {
                'status_code': response.status_code,
                'data': response.json(),
                'success': response.status_code < 400
            }
        except Exception as e:
            return {
                'status_code': 0,
                'data': {'error': str(e)},
                'success': False
            }

    def admin_login(self):
        """Login as admin"""
        response = self.make_request('POST', '/auth/login', {
            'email': ADMIN_EMAIL,
            'password': ADMIN_PASSWORD
        })
        
        if response['success']:
            self.admin_token = response['data']['token']
            return True
        return False

    def create_and_setup_user(self, name: str, referrer_code: str = None) -> Dict:
        """Create, KYC approve a user"""
        timestamp = str(int(time.time() * 1000))  # More unique timestamp
        email = f"{name.lower().replace(' ', '.')}.{timestamp}@test.com"
        
        # Create user
        signup_data = {
            'email': email,
            'password': 'password123',
            'full_name': name
        }
        
        if referrer_code:
            signup_data['referral_code'] = referrer_code
            
        signup_resp = self.make_request('POST', '/auth/signup', signup_data)
        if not signup_resp['success']:
            return {'success': False, 'error': 'signup_failed'}
        
        # Login
        login_resp = self.make_request('POST', '/auth/login', {
            'email': email,
            'password': 'password123'
        })
        
        if not login_resp['success']:
            return {'success': False, 'error': 'login_failed'}
            
        user = {
            'name': name,
            'email': email,
            'token': login_resp['data']['token'],
            'id': login_resp['data']['user']['id'],
            'referral_code': login_resp['data']['user']['referral_code']
        }
        
        # Submit KYC
        dummy_img = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        kyc_resp = self.make_request('POST', '/kyc/upload', {
            'id_card_base64': dummy_img,
            'selfie_base64': dummy_img
        }, user['token'])
        
        if kyc_resp['success']:
            # Admin approve KYC
            approve_resp = self.make_request('POST', '/admin/kyc/action', {
                'user_id': user['id'],
                'action': 'approve'
            }, self.admin_token)
            
            if approve_resp['success']:
                user['success'] = True
                return user
        
        return {'success': False, 'error': 'kyc_failed'}

    def purchase_and_approve_package(self, user: Dict, amount: int) -> bool:
        """User purchases package and admin approves it"""
        transaction_id = str(uuid.uuid4())
        dummy_screenshot = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        # Purchase
        purchase_resp = self.make_request('POST', '/transactions/deposit', {
            'amount': amount,
            'transaction_id': transaction_id,
            'screenshot_base64': dummy_screenshot
        }, user['token'])
        
        if not purchase_resp['success']:
            return False
        
        # Get pending transactions and find ours
        pending_resp = self.make_request('GET', '/admin/transactions/pending', token=self.admin_token)
        if not pending_resp['success']:
            return False
        
        # Find transaction
        transactions = pending_resp['data'].get('transactions', [])
        db_tx_id = None
        for tx in transactions:
            if tx.get('transaction_id') == transaction_id:
                db_tx_id = tx['id']
                break
        
        if not db_tx_id:
            return False
        
        # Approve
        approve_resp = self.make_request('POST', f'/admin/transactions/{db_tx_id}/approve', {}, self.admin_token)
        return approve_resp['success']

    def test_loan_system(self):
        """Test the loan system specifically"""
        print("\n🏦 Testing Loan System...")
        
        if not self.admin_login():
            print("❌ Admin login failed")
            return
        
        # Create main user (will get the loans)
        main_user = self.create_and_setup_user("Main User")
        if not main_user.get('success'):
            print("❌ Failed to create main user")
            return
        
        print(f"✅ Created main user: {main_user['name']} with referral code: {main_user['referral_code']}")
        
        # Test small package loan (need 10 small packages by referrals)
        print("\n🎯 Testing Small Package Loan (10 x $25)...")
        
        for i in range(10):
            referral = self.create_and_setup_user(f"Referral {i+1}", main_user['referral_code'])
            if referral.get('success'):
                success = self.purchase_and_approve_package(referral, 25)
                if success:
                    print(f"  ✅ Referral {i+1}: Purchased $25 package")
                else:
                    print(f"  ❌ Referral {i+1}: Failed to purchase package")
            else:
                print(f"  ❌ Failed to create referral {i+1}")
            
            # Small delay to avoid overwhelming
            time.sleep(0.5)
        
        # Check if loan was awarded
        time.sleep(2)  # Allow processing
        earnings_resp = self.make_request('GET', '/referrals/earnings', token=main_user['token'])
        if earnings_resp['success']:
            earnings = earnings_resp['data']
            loan_balance = earnings.get('loan_balance', 0)
            small_loan_earned = earnings.get('loans', {}).get('small', {}).get('earned', 0)
            
            print(f"📊 Small Package Loan Results:")
            print(f"  - Loan earned: ${small_loan_earned}")
            print(f"  - Current loan balance: ${loan_balance}")
            print(f"  - Expected: $100 loan for 10 small packages")
            
            if small_loan_earned == 100:
                print("  ✅ Small package loan system working correctly!")
            else:
                print("  ❌ Small package loan system not working as expected")
        
        # Test big package bonus (need 10 big packages by referrals)
        print("\n🎯 Testing Big Package Bonus (10 x $60)...")
        
        for i in range(10):
            referral = self.create_and_setup_user(f"Big Referral {i+1}", main_user['referral_code'])
            if referral.get('success'):
                success = self.purchase_and_approve_package(referral, 60)
                if success:
                    print(f"  ✅ Big Referral {i+1}: Purchased $60 package")
                else:
                    print(f"  ❌ Big Referral {i+1}: Failed to purchase package")
            else:
                print(f"  ❌ Failed to create big referral {i+1}")
            
            time.sleep(0.5)
        
        # Check if big package bonus was awarded
        time.sleep(2)
        earnings_resp = self.make_request('GET', '/referrals/earnings', token=main_user['token'])
        if earnings_resp['success']:
            earnings = earnings_resp['data']
            big_bonus_earned = earnings.get('loans', {}).get('big', {}).get('earned', 0)
            
            print(f"📊 Big Package Bonus Results:")
            print(f"  - Bonus earned: ${big_bonus_earned}")
            print(f"  - Expected: $500 bonus for 10 big packages")
            
            if big_bonus_earned == 500:
                print("  ✅ Big package bonus system working correctly!")
            else:
                print("  ❌ Big package bonus system not working as expected")
        
        # Test loan repayment
        user_resp = self.make_request('GET', '/auth/me', token=main_user['token'])
        if user_resp['success']:
            user_data = user_resp['data']
            balance = user_data.get('balance', 0)
            loan_balance = user_data.get('loan_balance', 0)
            
            print(f"\n💳 Testing Loan Repayment:")
            print(f"  - Current balance: ${balance}")
            print(f"  - Current loan balance: ${loan_balance}")
            
            if loan_balance > 0 and balance >= 50:
                # Try to repay $50
                repay_resp = self.make_request('POST', '/referrals/repay-loan', {
                    'amount': 50.0
                }, main_user['token'])
                
                if repay_resp['success']:
                    remaining = repay_resp['data'].get('remaining_loan', 0)
                    print(f"  ✅ Loan repayment successful! Remaining loan: ${remaining}")
                else:
                    print(f"  ❌ Loan repayment failed: {repay_resp['data']}")
            else:
                print(f"  ⚠️  Cannot test repayment - insufficient balance or no loan")

        # Final earnings summary
        earnings_resp = self.make_request('GET', '/referrals/earnings', token=main_user['token'])
        if earnings_resp['success']:
            earnings = earnings_resp['data']
            print(f"\n📈 Final Earnings Summary:")
            print(f"  - Instant bonuses: ${earnings.get('instant_bonuses', {}).get('total', 0)}")
            print(f"  - Daily bonuses: ${earnings.get('daily_bonuses', {}).get('total', 0)}")
            print(f"  - Milestone earned: ${earnings.get('milestone', {}).get('earned', 0)}")
            print(f"  - Small loan earned: ${earnings.get('loans', {}).get('small', {}).get('earned', 0)}")
            print(f"  - Big bonus earned: ${earnings.get('loans', {}).get('big', {}).get('earned', 0)}")
            print(f"  - Total earned: ${earnings.get('total_earned', 0)}")
            print(f"  - Outstanding loan: ${earnings.get('loan_balance', 0)}")

if __name__ == "__main__":
    tester = ExtendedTester()
    tester.test_loan_system()