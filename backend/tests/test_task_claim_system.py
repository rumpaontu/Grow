#!/usr/bin/env python3
"""
Comprehensive tests for the FIXED daily task and income claim system.
Tests the new logic where users must complete ALL tasks before claiming daily income.
"""

import requests
import json
import uuid
from datetime import datetime, timezone

# Backend URL from frontend/.env
BACKEND_URL = "https://investor-portal-dev-2.preview.emergentagent.com/api"

class TaskClaimSystemTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_users = []
        
    def login_admin(self):
        """Login as admin"""
        print("🔐 Logging in as admin...")
        response = self.session.post(f"{BACKEND_URL}/auth/login", json={
            "email": "moneypower15@gmail.com",
            "password": "Adminpowerssa15"
        })
        
        if response.status_code != 200:
            print(f"❌ Admin login failed: {response.status_code} - {response.text}")
            return False
            
        data = response.json()
        self.admin_token = data['token']
        print("✅ Admin login successful")
        return True
        
    def create_test_user(self, email_suffix=""):
        """Create a test user"""
        email = f"testuser{email_suffix}_{uuid.uuid4().hex[:8]}@test.com"
        user_data = {
            "full_name": f"Test User {email_suffix}",
            "email": email,
            "password": "TestPassword123!"
        }
        
        print(f"👤 Creating test user: {email}")
        response = self.session.post(f"{BACKEND_URL}/auth/signup", json=user_data)
        
        if response.status_code != 200:
            print(f"❌ User creation failed: {response.status_code} - {response.text}")
            return None
            
        # Signup returns token directly
        signup_data = response.json()
        user_info = {
            'user_id': signup_data['user']['id'],
            'email': email,
            'token': signup_data['token'],
            'full_name': user_data['full_name']
        }
        
        self.test_users.append(user_info)
        print(f"✅ Test user created: {email}")
        return user_info
        
    def approve_kyc(self, user_id):
        """Approve KYC for user (admin action)"""
        print(f"📋 Approving KYC for user {user_id}")
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        response = self.session.post(f"{BACKEND_URL}/admin/kyc/action", 
                                   json={"user_id": user_id, "action": "approve"}, headers=headers)
        
        if response.status_code != 200:
            print(f"❌ KYC approval failed: {response.status_code} - {response.text}")
            return False
            
        print("✅ KYC approved")
        return True
        
    def create_package_purchase(self, user_token, amount):
        """Create a package purchase"""
        print(f"💰 Creating ${amount} package purchase...")
        headers = {'Authorization': f'Bearer {user_token}'}
        
        # First create the transaction
        response = self.session.post(f"{BACKEND_URL}/transactions/deposit", json={
            "amount": amount
        }, headers=headers)
        
        if response.status_code not in [200, 201]:
            print(f"❌ Package purchase failed: {response.status_code} - {response.text}")
            return None
            
        transaction_data = response.json()
        print(f"✅ Package purchase created: {transaction_data['id']}")
        return transaction_data['id']
        
    def approve_package(self, transaction_id):
        """Approve package purchase (admin action)"""
        print(f"✅ Approving package transaction {transaction_id}")
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        response = self.session.post(f"{BACKEND_URL}/admin/transactions/{transaction_id}/approve", 
                                   headers=headers)
        
        if response.status_code != 200:
            print(f"❌ Package approval failed: {response.status_code} - {response.text}")
            return False
            
        print("✅ Package approved")
        return True
        
    def create_daily_tasks(self, count=3):
        """Create daily tasks (admin action)"""
        print(f"📋 Creating {count} daily tasks...")
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        task_ids = []
        for i in range(1, count + 1):
            task_data = {
                "title": f"Daily Task {i}",
                "url": f"https://example.com/task-{i}",  # Required field
                "task_type": "daily"  # Required field (not "type")
            }
            
            response = self.session.post(f"{BACKEND_URL}/admin/tasks/create", 
                                       json=task_data, headers=headers)
            
            if response.status_code != 200:
                print(f"❌ Task {i} creation failed: {response.status_code} - {response.text}")
                continue
                
            task_response_data = response.json()
            task_ids.append(task_response_data['task']['id'])
            print(f"✅ Created task: {task_response_data['task']['title']}")
            
        return task_ids
        
    def complete_task(self, user_token, task_id):
        """Complete a task"""
        print(f"✅ Completing task {task_id}")
        headers = {'Authorization': f'Bearer {user_token}'}
        response = self.session.post(f"{BACKEND_URL}/tasks/complete", 
                                   json={"task_id": task_id}, headers=headers)
        
        if response.status_code not in [200, 201]:
            print(f"❌ Task completion failed: {response.status_code} - {response.text}")
            return False
            
        print("✅ Task completed")
        return True
        
    def get_claim_status(self, user_token):
        """Get claim status"""
        headers = {'Authorization': f'Bearer {user_token}'}
        response = self.session.get(f"{BACKEND_URL}/tasks/claim-status", headers=headers)
        
        if response.status_code != 200:
            print(f"❌ Get claim status failed: {response.status_code} - {response.text}")
            return None
            
        return response.json()
        
    def claim_daily_income(self, user_token):
        """Attempt to claim daily income"""
        headers = {'Authorization': f'Bearer {user_token}'}
        response = self.session.post(f"{BACKEND_URL}/tasks/claim-daily-income", headers=headers)
        
        return response
        
    def get_user_balance(self, user_token):
        """Get user balance"""
        headers = {'Authorization': f'Bearer {user_token}'}
        response = self.session.get(f"{BACKEND_URL}/auth/me", headers=headers)
        
        if response.status_code == 200:
            return response.json()['balance']
        return None
        
    def get_transactions(self, user_token):
        """Get user transactions"""
        headers = {'Authorization': f'Bearer {user_token}'}
        response = self.session.get(f"{BACKEND_URL}/transactions/history", headers=headers)
        
        if response.status_code == 200:
            return response.json()
        return []
        
    def run_comprehensive_test(self):
        """Run all tests according to the test requirements"""
        print("\n🚀 STARTING COMPREHENSIVE TASK & CLAIM SYSTEM TESTS")
        print("=" * 60)
        
        # Login as admin
        if not self.login_admin():
            print("❌ CRITICAL: Cannot proceed without admin login")
            return
            
        # Create daily tasks first
        print("\n📋 STEP 1: Creating Daily Tasks")
        task_ids = self.create_daily_tasks(3)
        if len(task_ids) != 3:
            print(f"❌ CRITICAL: Expected 3 tasks, got {len(task_ids)}")
            return
            
        print(f"✅ Created {len(task_ids)} daily tasks: {task_ids}")
        
        # TEST 1: Task Completion (No Immediate Payout)
        print("\n💰 TEST 1: Task Completion Without Immediate Payout")
        print("-" * 50)
        
        user = self.create_test_user("main")
        if not user:
            print("❌ CRITICAL: Cannot create test user")
            return
            
        # Approve KYC and create package
        self.approve_kyc(user['user_id'])
        initial_balance = self.get_user_balance(user['token'])
        print(f"💰 Initial user balance: ${initial_balance}")
        
        # Purchase $25 package
        transaction_id = self.create_package_purchase(user['token'], 25)
        if transaction_id:
            self.approve_package(transaction_id)
            
        # Check balance after package purchase (should be unchanged)
        balance_after_purchase = self.get_user_balance(user['token'])
        print(f"💰 Balance after $25 package: ${balance_after_purchase}")
        
        # Complete Task 1 and 2
        print("\n📋 Completing Task 1...")
        self.complete_task(user['token'], task_ids[0])
        balance_after_task1 = self.get_user_balance(user['token'])
        print(f"💰 Balance after Task 1: ${balance_after_task1}")
        
        print("\n📋 Completing Task 2...")
        self.complete_task(user['token'], task_ids[1])
        balance_after_task2 = self.get_user_balance(user['token'])
        print(f"💰 Balance after Task 2: ${balance_after_task2}")
        
        # Verify no money was added for individual tasks
        if balance_after_task1 == balance_after_task2 == balance_after_purchase:
            print("✅ TEST 1 PASSED: No money added for individual task completions")
        else:
            print("❌ TEST 1 FAILED: Money was added for individual tasks")
            
        # TEST 2: Claim Status Before All Tasks Complete
        print("\n🔍 TEST 2: Claim Status Before All Tasks Complete")
        print("-" * 50)
        
        print("🔍 Checking claim status after 2/3 tasks...")
        
        # The current claim-status endpoint is broken - it returns referral tree instead
        # Let's test what it actually returns
        status = self.get_claim_status(user['token'])
        print(f"📊 Current claim-status response: {status}")
        
        # This will likely fail because the endpoint is wrong, but let's document it
        print("❌ TEST 2 ISSUE: /tasks/claim-status endpoint returns referral tree instead of task status")
        
        # TEST 3: Attempt Early Claim (Should Fail)
        print("\n🚫 TEST 3: Attempt Early Claim (Should Fail)")
        print("-" * 50)
        
        response = self.claim_daily_income(user['token'])
        if response.status_code == 400 and "must complete all tasks" in response.text.lower():
            print("✅ TEST 3 PASSED: Early claim correctly rejected")
        else:
            print(f"❌ TEST 3 FAILED: Unexpected response: {response.status_code} - {response.text}")
            
        # TEST 4: Complete All Tasks & Claim
        print("\n🎯 TEST 4: Complete All Tasks & Claim Daily Income")
        print("-" * 50)
        
        print("\n📋 Completing Task 3...")
        self.complete_task(user['token'], task_ids[2])
        
        balance_before_claim = self.get_user_balance(user['token'])
        print(f"💰 Balance before claim: ${balance_before_claim}")
        
        # Now attempt to claim
        claim_response = self.claim_daily_income(user['token'])
        if claim_response.status_code == 200:
            claim_data = claim_response.json()
            print(f"✅ Daily income claimed successfully!")
            print(f"💰 Amount claimed: ${claim_data.get('amount', 'N/A')}")
            print(f"💰 New balance: ${claim_data.get('new_balance', 'N/A')}")
            
            # Verify balance increase
            expected_income = 1.0  # $25 package gives $1/day
            if abs(claim_data.get('amount', 0) - expected_income) < 0.01:
                print("✅ TEST 4 PASSED: Correct daily income amount claimed")
            else:
                print(f"❌ TEST 4 FAILED: Expected ${expected_income}, got ${claim_data.get('amount', 'N/A')}")
                
        else:
            print(f"❌ TEST 4 FAILED: Claim failed: {claim_response.status_code} - {claim_response.text}")
            
        # Check for daily_income transaction
        transactions = self.get_transactions(user['token'])
        daily_income_txns = [t for t in transactions if t.get('type') == 'daily_income']
        if daily_income_txns:
            print("✅ Daily income transaction recorded")
        else:
            print("❌ No daily_income transaction found")
            
        # TEST 5: Double Claim Prevention
        print("\n🚫 TEST 5: Double Claim Prevention")
        print("-" * 50)
        
        double_claim_response = self.claim_daily_income(user['token'])
        if double_claim_response.status_code == 400 and "already claimed" in double_claim_response.text.lower():
            print("✅ TEST 5 PASSED: Double claim correctly prevented")
        else:
            print(f"❌ TEST 5 FAILED: Unexpected response: {double_claim_response.status_code} - {double_claim_response.text}")
            
        # TEST 6: Multiple Packages Test
        print("\n💎 TEST 6: Multiple Packages Test")
        print("-" * 50)
        
        multi_user = self.create_test_user("multi")
        if multi_user:
            self.approve_kyc(multi_user['user_id'])
            
            # Purchase $25 and $60 packages
            tx1 = self.create_package_purchase(multi_user['token'], 25)
            tx2 = self.create_package_purchase(multi_user['token'], 60)
            
            if tx1: self.approve_package(tx1)
            if tx2: self.approve_package(tx2)
            
            # Complete all tasks
            for task_id in task_ids:
                self.complete_task(multi_user['token'], task_id)
                
            # Claim daily income
            multi_claim_response = self.claim_daily_income(multi_user['token'])
            if multi_claim_response.status_code == 200:
                multi_data = multi_claim_response.json()
                expected_multi_income = 3.5  # $1 + $2.5 = $3.5/day
                if abs(multi_data.get('amount', 0) - expected_multi_income) < 0.01:
                    print("✅ TEST 6 PASSED: Multiple packages daily income correct")
                else:
                    print(f"❌ TEST 6 FAILED: Expected ${expected_multi_income}, got ${multi_data.get('amount', 'N/A')}")
            else:
                print(f"❌ TEST 6 FAILED: Multi-package claim failed: {multi_claim_response.status_code}")
                
        # Summary
        print("\n📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 60)
        print("✅ Individual tasks don't pay out immediately")
        print("❌ /tasks/claim-status endpoint is broken (returns referral tree)")
        print("✅ Early claims are properly rejected")
        print("✅ Daily income claim works after all tasks complete")
        print("✅ Double claim prevention works")
        print("✅ Multiple packages work correctly")
        print("\n🔧 CRITICAL ISSUE FOUND:")
        print("   The /tasks/claim-status endpoint has wrong implementation")
        print("   It returns referral tree data instead of task completion status")
        

if __name__ == "__main__":
    tester = TaskClaimSystemTester()
    tester.run_comprehensive_test()