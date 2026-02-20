import requests
import sys
import json
from datetime import datetime
import base64
import os

class GrowVaultAPITester:
    def __init__(self, base_url="https://elite-mlm-portal.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = None
        self.test_user_referral_code = None
        self.failed_tests = []
        self.passed_tests = []

    def log_test_result(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            self.passed_tests.append(name)
            print(f"✅ {name} - PASSED {details}")
        else:
            self.failed_tests.append({"test": name, "details": details})
            print(f"❌ {name} - FAILED {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, auth_required=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if auth_required and self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        elif auth_required and self.admin_token and 'admin' in name.lower():
            test_headers['Authorization'] = f'Bearer {self.admin_token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2) if isinstance(data, dict) else str(data)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_detail = response.json() if response.content else response.text
                    details += f", Response: {error_detail}"
                except:
                    details += f", Response: {response.text[:100]}"
            
            self.log_test_result(name, success, details)
            
            if success and response.content:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            return success, {}

        except requests.exceptions.Timeout:
            self.log_test_result(name, False, "Timeout - API not responding")
            return False, {}
        except requests.exceptions.ConnectionError:
            self.log_test_result(name, False, "Connection Error - Backend not accessible")
            return False, {}
        except Exception as e:
            self.log_test_result(name, False, f"Error: {str(e)}")
            return False, {}

    def generate_mock_base64_image(self):
        """Generate a small mock base64 image for testing"""
        # Small 1x1 pixel PNG in base64
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "moneypower15@gmail.com", "password": "Adminpowerssa15"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_user_signup(self):
        """Test user signup"""
        timestamp = datetime.now().strftime('%H%M%S%f')
        test_email = f"test_user_{timestamp}@test.com"
        
        success, response = self.run_test(
            "User Signup",
            "POST",
            "auth/signup",
            200,
            data={
                "email": test_email,
                "password": "TestPass123!",
                "full_name": f"Test User {timestamp}",
                "referral_code": None
            }
        )
        if success and 'token' in response and 'user' in response:
            self.token = response['token']
            self.test_user_id = response['user']['id']
            self.test_user_referral_code = response['user']['referral_code']
            print(f"   User created - ID: {self.test_user_id}, Ref Code: {self.test_user_referral_code}")
            return True
        return False

    def test_user_login(self, email="test_login@test.com", password="TestPass123!"):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        return success

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200,
            auth_required=True
        )
        return success

    def test_kyc_upload(self):
        """Test KYC upload"""
        mock_image = self.generate_mock_base64_image()
        
        success, response = self.run_test(
            "KYC Upload",
            "POST",
            "kyc/upload",
            200,
            data={
                "id_card_base64": mock_image,
                "selfie_base64": mock_image
            },
            auth_required=True
        )
        return success

    def test_kyc_status(self):
        """Test KYC status"""
        success, response = self.run_test(
            "Get KYC Status",
            "GET",
            "kyc/status",
            200,
            auth_required=True
        )
        return success

    def test_sponsor_inquiry(self):
        """Test sponsor inquiry submission"""
        timestamp = datetime.now().strftime('%H%M%S')
        
        success, response = self.run_test(
            "Sponsor Inquiry",
            "POST",
            "sponsor/inquiry",
            200,
            data={
                "name": f"Sponsor {timestamp}",
                "email": f"sponsor_{timestamp}@test.com",
                "country": "United States",
                "promo_link": "https://example.com/promo",
                "budget": "$10,000"
            }
        )
        return success

    def test_settings_endpoints(self):
        """Test settings endpoints"""
        banner_success, _ = self.run_test(
            "Get Banner Settings",
            "GET",
            "settings/banner",
            200
        )
        
        binance_success, _ = self.run_test(
            "Get Binance Settings",
            "GET",
            "settings/binance",
            200
        )
        
        return banner_success and binance_success

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        if not self.admin_token:
            print("❌ Admin token not available, skipping admin tests")
            return False

        # Test admin users endpoint
        users_success, _ = self.run_test(
            "Admin - Get All Users",
            "GET",
            "admin/users",
            200,
            auth_required=True
        )

        # Test admin KYC endpoint
        kyc_success, _ = self.run_test(
            "Admin - Get Pending KYC",
            "GET",
            "admin/kyc/pending",
            200,
            auth_required=True
        )

        # Test admin tasks endpoint
        tasks_success, _ = self.run_test(
            "Admin - Get Tasks",
            "GET",
            "admin/tasks",
            200,
            auth_required=True
        )

        # Test admin inquiries endpoint
        inquiries_success, _ = self.run_test(
            "Admin - Get Inquiries",
            "GET",
            "admin/inquiries",
            200,
            auth_required=True
        )

        # Test admin pending transactions
        trans_success, _ = self.run_test(
            "Admin - Get Pending Transactions",
            "GET",
            "admin/transactions/pending",
            200,
            auth_required=True
        )

        return all([users_success, kyc_success, tasks_success, inquiries_success, trans_success])

    def test_task_management(self):
        """Test task creation and deletion"""
        if not self.admin_token:
            return False

        # Create task
        create_success, response = self.run_test(
            "Admin - Create Task",
            "POST",
            "admin/tasks/create",
            200,
            data={
                "title": "Test YouTube Task",
                "url": "https://youtube.com/test",
                "task_type": "youtube"
            },
            auth_required=True
        )
        
        if not create_success:
            return False
            
        task_id = response.get('task', {}).get('id')
        if not task_id:
            self.log_test_result("Task Creation - Get Task ID", False, "No task ID returned")
            return False

        # Test get daily tasks
        daily_tasks_success, _ = self.run_test(
            "Get Daily Tasks",
            "GET",
            "tasks/daily",
            200,
            auth_required=True
        )

        # Delete task
        delete_success, _ = self.run_test(
            "Admin - Delete Task",
            "DELETE",
            f"admin/tasks/{task_id}",
            200,
            auth_required=True
        )

        return create_success and daily_tasks_success and delete_success

    def test_package_flow(self):
        """Test package purchase flow"""
        mock_image = self.generate_mock_base64_image()
        
        # Test package purchase
        purchase_success, response = self.run_test(
            "Package Purchase",
            "POST",
            "packages/purchase",
            200,
            data={
                "amount": 25,
                "transaction_id": f"TEST_TRANS_{datetime.now().strftime('%H%M%S')}",
                "screenshot_base64": mock_image
            },
            auth_required=True
        )

        # Test get my packages
        packages_success, _ = self.run_test(
            "Get My Packages",
            "GET",
            "packages/mine",
            200,
            auth_required=True
        )

        return purchase_success and packages_success

    def test_referral_system(self):
        """Test referral endpoints"""
        # Test referral stats
        stats_success, _ = self.run_test(
            "Get Referral Stats",
            "GET",
            "referrals/stats",
            200,
            auth_required=True
        )

        # Test referral tree
        tree_success, _ = self.run_test(
            "Get Referral Tree",
            "GET",
            "referrals/tree",
            200,
            auth_required=True
        )

        return stats_success and tree_success

    def test_transaction_history(self):
        """Test transaction history"""
        success, _ = self.run_test(
            "Get Transaction History",
            "GET",
            "transactions/history",
            200,
            auth_required=True
        )
        return success

def main():
    print("🚀 Starting GrowVault API Testing...\n")
    
    tester = GrowVaultAPITester()
    
    # Test basic connectivity
    print("=" * 60)
    print("PHASE 1: BASIC CONNECTIVITY & PUBLIC ENDPOINTS")
    print("=" * 60)
    
    # Test public endpoints
    settings_ok = tester.test_settings_endpoints()
    inquiry_ok = tester.test_sponsor_inquiry()
    
    # Test authentication
    print("\n" + "=" * 60)
    print("PHASE 2: AUTHENTICATION")
    print("=" * 60)
    
    admin_login_ok = tester.test_admin_login()
    user_signup_ok = tester.test_user_signup()
    
    if not user_signup_ok:
        print("❌ User signup failed, cannot proceed with user tests")
        print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
        return 1
    
    user_me_ok = tester.test_get_me()
    
    # Test user flows
    print("\n" + "=" * 60)
    print("PHASE 3: USER FUNCTIONALITY")
    print("=" * 60)
    
    kyc_upload_ok = tester.test_kyc_upload()
    kyc_status_ok = tester.test_kyc_status()
    package_flow_ok = tester.test_package_flow()
    referral_ok = tester.test_referral_system()
    transaction_history_ok = tester.test_transaction_history()
    
    # Test admin flows
    print("\n" + "=" * 60)
    print("PHASE 4: ADMIN FUNCTIONALITY")
    print("=" * 60)
    
    admin_endpoints_ok = tester.test_admin_endpoints()
    task_management_ok = tester.test_task_management()
    
    # Summary
    print("\n" + "=" * 80)
    print("FINAL TEST SUMMARY")
    print("=" * 80)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"📊 Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ FAILED TESTS ({len(tester.failed_tests)}):")
        for failed_test in tester.failed_tests:
            print(f"   - {failed_test['test']}: {failed_test['details']}")
    
    if tester.passed_tests:
        print(f"\n✅ PASSED TESTS ({len(tester.passed_tests)}):")
        for passed_test in tester.passed_tests[:5]:  # Show first 5
            print(f"   - {passed_test}")
        if len(tester.passed_tests) > 5:
            print(f"   ... and {len(tester.passed_tests) - 5} more")
    
    # Critical analysis
    critical_failures = [test for test in tester.failed_tests if any(keyword in test['test'].lower() for keyword in ['login', 'signup', 'admin', 'connectivity'])]
    if critical_failures:
        print(f"\n🚨 CRITICAL ISSUES FOUND ({len(critical_failures)}):")
        for failure in critical_failures:
            print(f"   - {failure['test']}: {failure['details']}")
        return 1
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    exit_code = main()
    print(f"\n🏁 Testing completed with exit code: {exit_code}")
    sys.exit(exit_code)