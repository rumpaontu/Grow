from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import base64
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

JWT_SECRET = os.environ.get('JWT_SECRET', 'growvault_secret_key_2024')
JWT_ALGORITHM = 'HS256'
ADMIN_EMAIL = 'moneypower15@gmail.com'
ADMIN_PASSWORD = 'Adminpowerssa15'

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class UserSignup(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    referral_code: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class KYCUpload(BaseModel):
    id_card_base64: str
    selfie_base64: str

class PackagePurchase(BaseModel):
    amount: int
    transaction_id: str
    screenshot_base64: str

class TaskComplete(BaseModel):
    task_id: str

class SponsorInquiryModel(BaseModel):
    name: str
    email: EmailStr
    country: str
    promo_link: str
    budget: str

class TaskCreate(BaseModel):
    title: str
    url: str
    task_type: str

class BannerUpdate(BaseModel):
    banner_base64: str

class BinanceAddressUpdate(BaseModel):
    binance_address: str

class UserUpdate(BaseModel):
    balance: Optional[float] = None
    banned: Optional[bool] = None

class KYCAction(BaseModel):
    user_id: str
    action: str

class WithdrawalRequest(BaseModel):
    amount: float
    binance_address: str

class WithdrawalAction(BaseModel):
    withdrawal_id: str
    action: str

class MinWithdrawalUpdate(BaseModel):
    min_withdrawal_amount: float

class NotificationCreate(BaseModel):
    title: str
    message: str
    user_id: Optional[str] = None

class NotificationRead(BaseModel):
    notification_id: str

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

def generate_referral_code():
    return str(uuid.uuid4())[:8].upper()

async def calculate_referral_bonuses(user_id: str, amount: float, bonus_type: str):
    user = await db.users.find_one({'id': user_id}, {'_id': 0})
    if not user or not user.get('referred_by'):
        return
    
    referrer = await db.users.find_one({'referral_code': user['referred_by']}, {'_id': 0})
    if not referrer:
        return
    
    if bonus_type == 'instant':
        level1_bonus = amount * 0.05
        await db.users.update_one(
            {'id': referrer['id']},
            {'$inc': {'balance': level1_bonus}}
        )
        await db.transactions.insert_one({
            'id': str(uuid.uuid4()),
            'user_id': referrer['id'],
            'type': 'referral_bonus_l1',
            'amount': level1_bonus,
            'status': 'completed',
            'created_at': datetime.now(timezone.utc).isoformat()
        })
        
        if referrer.get('referred_by'):
            level2_referrer = await db.users.find_one({'referral_code': referrer['referred_by']}, {'_id': 0})
            if level2_referrer:
                level2_bonus = amount * 0.02
                await db.users.update_one(
                    {'id': level2_referrer['id']},
                    {'$inc': {'balance': level2_bonus}}
                )
                await db.transactions.insert_one({
                    'id': str(uuid.uuid4()),
                    'user_id': level2_referrer['id'],
                    'type': 'referral_bonus_l2',
                    'amount': level2_bonus,
                    'status': 'completed',
                    'created_at': datetime.now(timezone.utc).isoformat()
                })
    
    elif bonus_type == 'daily':
        level1_bonus = amount * 0.05
        await db.users.update_one(
            {'id': referrer['id']},
            {'$inc': {'balance': level1_bonus}}
        )
        await db.transactions.insert_one({
            'id': str(uuid.uuid4()),
            'user_id': referrer['id'],
            'type': 'daily_referral_bonus_l1',
            'amount': level1_bonus,
            'status': 'completed',
            'created_at': datetime.now(timezone.utc).isoformat()
        })
        
        if referrer.get('referred_by'):
            level2_referrer = await db.users.find_one({'referral_code': referrer['referred_by']}, {'_id': 0})
            if level2_referrer:
                level2_bonus = amount * 0.02
                await db.users.update_one(
                    {'id': level2_referrer['id']},
                    {'$inc': {'balance': level2_bonus}}
                )
                await db.transactions.insert_one({
                    'id': str(uuid.uuid4()),
                    'user_id': level2_referrer['id'],
                    'type': 'daily_referral_bonus_l2',
                    'amount': level2_bonus,
                    'status': 'completed',
                    'created_at': datetime.now(timezone.utc).isoformat()
                })

async def check_milestone_bonuses(user_id: str):
    level1_refs = await db.users.count_documents({'referred_by': await get_user_referral_code(user_id)})
    
    if level1_refs >= 20:
        already_awarded = await db.transactions.find_one({
            'user_id': user_id,
            'type': 'milestone_bonus_20_refs'
        })
        
        if not already_awarded:
            await db.users.update_one(
                {'id': user_id},
                {'$inc': {'balance': 50}}
            )
            await db.transactions.insert_one({
                'id': str(uuid.uuid4()),
                'user_id': user_id,
                'type': 'milestone_bonus_20_refs',
                'amount': 50,
                'status': 'completed',
                'created_at': datetime.now(timezone.utc).isoformat()
            })

async def get_user_referral_code(user_id: str):
    user = await db.users.find_one({'id': user_id}, {'_id': 0})
    return user.get('referral_code') if user else None

async def daily_task_reset():
    logger.info('Running daily task reset')
    try:
        today = datetime.now(timezone.utc).date().isoformat()
        await db.task_completions.delete_many({'date': {'$ne': today}})
        logger.info('Daily tasks reset completed')
    except Exception as e:
        logger.error(f'Error in daily task reset: {e}')

async def process_daily_income():
    logger.info('Processing daily income for active packages')
    try:
        active_packages = await db.packages.find({'is_active': True, 'days_remaining': {'$gt': 0}}).to_list(None)
        
        for package in active_packages:
            user_id = package['user_id']
            today = datetime.now(timezone.utc).date().isoformat()
            
            task_completed = await db.task_completions.find_one({
                'user_id': user_id,
                'date': today
            })
            
            if task_completed:
                daily_income = package['daily_income']
                
                await db.users.update_one(
                    {'id': user_id},
                    {'$inc': {'balance': daily_income}}
                )
                
                await db.packages.update_one(
                    {'id': package['id']},
                    {'$inc': {'days_remaining': -1}}
                )
                
                if package['days_remaining'] - 1 <= 0:
                    await db.packages.update_one(
                        {'id': package['id']},
                        {'$set': {'is_active': False}}
                    )
                
                await db.transactions.insert_one({
                    'id': str(uuid.uuid4()),
                    'user_id': user_id,
                    'type': 'daily_income',
                    'amount': daily_income,
                    'status': 'completed',
                    'created_at': datetime.now(timezone.utc).isoformat()
                })
                
                await calculate_referral_bonuses(user_id, daily_income, 'daily')
        
        logger.info(f'Processed daily income for {len(active_packages)} packages')
    except Exception as e:
        logger.error(f'Error processing daily income: {e}')

@api_router.post('/auth/signup')
async def signup(data: UserSignup):
    existing_user = await db.users.find_one({'email': data.email}, {'_id': 0})
    if existing_user:
        raise HTTPException(status_code=400, detail='Email already registered')
    
    hashed_password = bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user_id = str(uuid.uuid4())
    referral_code = generate_referral_code()
    
    user_doc = {
        'id': user_id,
        'email': data.email,
        'password': hashed_password,
        'full_name': data.full_name,
        'role': 'user',
        'referral_code': referral_code,
        'referred_by': data.referral_code,
        'balance': 0,
        'kyc_status': 'pending',
        'kyc_id_card': None,
        'kyc_selfie': None,
        'banned': False,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, data.email, 'user')
    
    return {
        'token': token,
        'user': {
            'id': user_id,
            'email': data.email,
            'full_name': data.full_name,
            'role': 'user',
            'referral_code': referral_code,
            'kyc_status': 'pending'
        }
    }

@api_router.post('/auth/login')
async def login(data: UserLogin):
    if data.email == ADMIN_EMAIL and data.password == ADMIN_PASSWORD:
        admin_id = 'admin_id'
        token = create_token(admin_id, ADMIN_EMAIL, 'admin')
        return {
            'token': token,
            'user': {
                'id': admin_id,
                'email': ADMIN_EMAIL,
                'full_name': 'Admin',
                'role': 'admin'
            }
        }
    
    user = await db.users.find_one({'email': data.email}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=401, detail='Invalid credentials')
    
    if not bcrypt.checkpw(data.password.encode('utf-8'), user['password'].encode('utf-8')):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    
    if user.get('banned'):
        raise HTTPException(status_code=403, detail='Account banned')
    
    token = create_token(user['id'], user['email'], user['role'])
    
    return {
        'token': token,
        'user': {
            'id': user['id'],
            'email': user['email'],
            'full_name': user['full_name'],
            'role': user['role'],
            'referral_code': user['referral_code'],
            'kyc_status': user['kyc_status'],
            'balance': user['balance']
        }
    }

@api_router.get('/auth/me')
async def get_me(payload: dict = Depends(verify_token)):
    if payload['role'] == 'admin':
        return {
            'id': 'admin_id',
            'email': ADMIN_EMAIL,
            'full_name': 'Admin',
            'role': 'admin'
        }
    
    user = await db.users.find_one({'id': payload['user_id']}, {'_id': 0, 'password': 0})
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    
    return user

@api_router.post('/kyc/upload')
async def upload_kyc(data: KYCUpload, payload: dict = Depends(verify_token)):
    if payload['role'] == 'admin':
        raise HTTPException(status_code=403, detail='Admin cannot submit KYC')
    
    await db.users.update_one(
        {'id': payload['user_id']},
        {'$set': {
            'kyc_id_card': data.id_card_base64,
            'kyc_selfie': data.selfie_base64,
            'kyc_status': 'under_review'
        }}
    )
    
    return {'message': 'KYC documents uploaded successfully', 'kyc_status': 'under_review'}

@api_router.get('/kyc/status')
async def get_kyc_status(payload: dict = Depends(verify_token)):
    user = await db.users.find_one({'id': payload['user_id']}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    
    return {'kyc_status': user.get('kyc_status', 'pending')}

@api_router.post('/packages/purchase')
async def purchase_package(data: PackagePurchase, payload: dict = Depends(verify_token)):
    if payload['role'] == 'admin':
        raise HTTPException(status_code=403, detail='Admin cannot purchase packages')
    
    user = await db.users.find_one({'id': payload['user_id']}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    
    if user['kyc_status'] != 'approved':
        raise HTTPException(status_code=403, detail='KYC must be approved before purchasing packages')
    
    if data.amount not in [25, 60]:
        raise HTTPException(status_code=400, detail='Invalid package amount')
    
    daily_income = 1 if data.amount == 25 else 2.5
    
    transaction_doc = {
        'id': str(uuid.uuid4()),
        'user_id': payload['user_id'],
        'type': 'package_purchase',
        'amount': data.amount,
        'status': 'pending',
        'transaction_id': data.transaction_id,
        'screenshot': data.screenshot_base64,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.transactions.insert_one(transaction_doc)
    
    return {'message': 'Package purchase request submitted. Awaiting admin approval.', 'transaction_id': transaction_doc['id']}

@api_router.get('/packages/mine')
async def get_my_packages(payload: dict = Depends(verify_token)):
    packages = await db.packages.find({'user_id': payload['user_id']}, {'_id': 0}).to_list(None)
    return {'packages': packages}

@api_router.get('/tasks/daily')
async def get_daily_tasks(payload: dict = Depends(verify_token)):
    tasks = await db.tasks.find({}, {'_id': 0}).to_list(None)
    
    today = datetime.now(timezone.utc).date().isoformat()
    completed_tasks = await db.task_completions.find({
        'user_id': payload['user_id'],
        'date': today
    }, {'_id': 0}).to_list(None)
    
    completed_task_ids = [tc['task_id'] for tc in completed_tasks]
    
    for task in tasks:
        task['completed'] = task['id'] in completed_task_ids
    
    return {'tasks': tasks}

@api_router.post('/tasks/complete')
async def complete_task(data: TaskComplete, payload: dict = Depends(verify_token)):
    task = await db.tasks.find_one({'id': data.task_id}, {'_id': 0})
    if not task:
        raise HTTPException(status_code=404, detail='Task not found')
    
    today = datetime.now(timezone.utc).date().isoformat()
    
    existing_completion = await db.task_completions.find_one({
        'user_id': payload['user_id'],
        'task_id': data.task_id,
        'date': today
    })
    
    if existing_completion:
        raise HTTPException(status_code=400, detail='Task already completed today')
    
    completion_doc = {
        'id': str(uuid.uuid4()),
        'user_id': payload['user_id'],
        'task_id': data.task_id,
        'date': today,
        'completed_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.task_completions.insert_one(completion_doc)
    
    active_packages = await db.packages.find({
        'user_id': payload['user_id'],
        'is_active': True,
        'days_remaining': {'$gt': 0}
    }).to_list(None)
    
    total_daily_income = 0
    for package in active_packages:
        total_daily_income += package['daily_income']
        
        await db.packages.update_one(
            {'id': package['id']},
            {'$inc': {'days_remaining': -1}}
        )
        
        if package['days_remaining'] - 1 <= 0:
            await db.packages.update_one(
                {'id': package['id']},
                {'$set': {'is_active': False}}
            )
    
    if total_daily_income > 0:
        await db.users.update_one(
            {'id': payload['user_id']},
            {'$inc': {'balance': total_daily_income}}
        )
        
        await db.transactions.insert_one({
            'id': str(uuid.uuid4()),
            'user_id': payload['user_id'],
            'type': 'daily_income',
            'amount': total_daily_income,
            'status': 'completed',
            'created_at': datetime.now(timezone.utc).isoformat()
        })
        
        await calculate_referral_bonuses(payload['user_id'], total_daily_income, 'daily')
        
        await db.notifications.insert_one({
            'id': str(uuid.uuid4()),
            'title': 'Task Completed!',
            'message': f'You earned ${total_daily_income:.2f} from completing your daily task. Keep up the great work!',
            'user_id': payload['user_id'],
            'is_read': False,
            'read_by': [],
            'created_at': datetime.now(timezone.utc).isoformat()
        })
    
    return {
        'message': 'Task completed successfully!',
        'daily_income_added': total_daily_income,
        'balance_updated': True
    }

@api_router.get('/referrals/tree')
async def get_referral_tree(payload: dict = Depends(verify_token)):
    user = await db.users.find_one({'id': payload['user_id']}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    
    level1_refs = await db.users.find(
        {'referred_by': user['referral_code']},
        {'_id': 0, 'id': 1, 'full_name': 1, 'email': 1, 'balance': 1, 'created_at': 1, 'referral_code': 1}
    ).to_list(None)
    
    level2_refs = []
    for l1_ref in level1_refs:
        l2_refs = await db.users.find(
            {'referred_by': l1_ref['referral_code']},
            {'_id': 0, 'id': 1, 'full_name': 1, 'email': 1, 'balance': 1, 'created_at': 1}
        ).to_list(None)
        level2_refs.extend(l2_refs)
    
    return {
        'level1': level1_refs,
        'level2': level2_refs
    }

@api_router.get('/referrals/stats')
async def get_referral_stats(payload: dict = Depends(verify_token)):
    user = await db.users.find_one({'id': payload['user_id']}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    
    level1_count = await db.users.count_documents({'referred_by': user['referral_code']})
    
    level1_refs = await db.users.find({'referred_by': user['referral_code']}, {'_id': 0, 'referral_code': 1}).to_list(None)
    level2_count = 0
    for l1_ref in level1_refs:
        count = await db.users.count_documents({'referred_by': l1_ref['referral_code']})
        level2_count += count
    
    return {
        'level1_count': level1_count,
        'level2_count': level2_count
    }

@api_router.post('/transactions/deposit')
async def submit_deposit(data: PackagePurchase, payload: dict = Depends(verify_token)):
    return await purchase_package(data, payload)

@api_router.get('/transactions/history')
async def get_transaction_history(payload: dict = Depends(verify_token)):
    transactions = await db.transactions.find({'user_id': payload['user_id']}, {'_id': 0}).sort('created_at', -1).to_list(None)
    return {'transactions': transactions}

@api_router.post('/sponsor/inquiry')
async def submit_sponsor_inquiry(data: SponsorInquiryModel):
    inquiry_doc = {
        'id': str(uuid.uuid4()),
        'name': data.name,
        'email': data.email,
        'country': data.country,
        'promo_link': data.promo_link,
        'budget': data.budget,
        'status': 'new',
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.sponsor_inquiries.insert_one(inquiry_doc)
    
    return {'message': 'Inquiry submitted successfully'}

@api_router.get('/settings/banner')
async def get_banner():
    settings = await db.settings.find_one({'key': 'banner'}, {'_id': 0})
    if settings:
        return {'banner_url': settings.get('value')}
    return {'banner_url': None}

@api_router.get('/settings/binance')
async def get_binance_address():
    settings = await db.settings.find_one({'key': 'binance_address'}, {'_id': 0})
    if settings:
        return {'binance_address': settings.get('value')}
    return {'binance_address': 'TBD'}

@api_router.get('/settings/min-withdrawal')
async def get_min_withdrawal():
    settings = await db.settings.find_one({'key': 'min_withdrawal_amount'}, {'_id': 0})
    if settings:
        return {'min_withdrawal_amount': settings.get('value', 5)}
    return {'min_withdrawal_amount': 5}

@api_router.post('/withdrawals/request')
async def request_withdrawal(data: WithdrawalRequest, payload: dict = Depends(verify_token)):
    if payload['role'] == 'admin':
        raise HTTPException(status_code=403, detail='Admin cannot request withdrawal')
    
    user = await db.users.find_one({'id': payload['user_id']}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    
    if user['kyc_status'] != 'approved':
        raise HTTPException(status_code=403, detail='KYC must be approved before withdrawal')
    
    min_withdrawal_settings = await db.settings.find_one({'key': 'min_withdrawal_amount'}, {'_id': 0})
    min_withdrawal = min_withdrawal_settings.get('value', 5) if min_withdrawal_settings else 5
    
    if data.amount < min_withdrawal:
        raise HTTPException(status_code=400, detail=f'Minimum withdrawal amount is ${min_withdrawal}')
    
    if user['balance'] < data.amount:
        raise HTTPException(status_code=400, detail='Insufficient balance')
    
    pending_withdrawals = await db.withdrawals.find({
        'user_id': payload['user_id'],
        'status': 'pending'
    }).to_list(None)
    
    if pending_withdrawals:
        raise HTTPException(status_code=400, detail='You have a pending withdrawal request. Please wait for approval.')
    
    withdrawal_doc = {
        'id': str(uuid.uuid4()),
        'user_id': payload['user_id'],
        'amount': data.amount,
        'binance_address': data.binance_address,
        'status': 'pending',
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.withdrawals.insert_one(withdrawal_doc)
    
    return {
        'message': 'Withdrawal request submitted successfully. Awaiting admin approval.',
        'withdrawal_id': withdrawal_doc['id']
    }

@api_router.get('/withdrawals/mine')
async def get_my_withdrawals(payload: dict = Depends(verify_token)):
    withdrawals = await db.withdrawals.find(
        {'user_id': payload['user_id']},
        {'_id': 0}
    ).sort('created_at', -1).to_list(None)
    return {'withdrawals': withdrawals}

@api_router.get('/notifications/mine')
async def get_my_notifications(payload: dict = Depends(verify_token)):
    if payload['role'] == 'admin':
        raise HTTPException(status_code=403, detail='Admin cannot view user notifications')
    
    notifications = await db.notifications.find(
        {'$or': [
            {'user_id': payload['user_id']},
            {'user_id': None}
        ]},
        {'_id': 0}
    ).sort('created_at', -1).to_list(None)
    
    return {'notifications': notifications}

@api_router.get('/notifications/unread-count')
async def get_unread_count(payload: dict = Depends(verify_token)):
    if payload['role'] == 'admin':
        return {'unread_count': 0}
    
    count = await db.notifications.count_documents({
        '$or': [
            {'user_id': payload['user_id'], 'is_read': False},
            {'user_id': None, 'is_read': False}
        ]
    })
    
    return {'unread_count': count}

@api_router.post('/notifications/mark-read')
async def mark_notification_read(data: NotificationRead, payload: dict = Depends(verify_token)):
    if payload['role'] == 'admin':
        raise HTTPException(status_code=403, detail='Admin cannot mark notifications as read')
    
    notification = await db.notifications.find_one({'id': data.notification_id}, {'_id': 0})
    if not notification:
        raise HTTPException(status_code=404, detail='Notification not found')
    
    if notification.get('user_id') and notification['user_id'] != payload['user_id']:
        raise HTTPException(status_code=403, detail='Cannot mark other user notifications as read')
    
    if 'read_by' not in notification:
        notification['read_by'] = []
    
    if payload['user_id'] not in notification['read_by']:
        await db.notifications.update_one(
            {'id': data.notification_id},
            {'$addToSet': {'read_by': payload['user_id']}}
        )
    
    return {'message': 'Notification marked as read'}

@api_router.get('/admin/users')
async def get_all_users(payload: dict = Depends(verify_token)):
    if payload['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    users = await db.users.find({}, {'_id': 0, 'password': 0}).to_list(None)
    return {'users': users}

@api_router.post('/admin/users/{user_id}/update')
async def update_user(user_id: str, data: UserUpdate, payload: dict = Depends(verify_token)):
    if payload['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    update_data = {}
    if data.balance is not None:
        update_data['balance'] = data.balance
    if data.banned is not None:
        update_data['banned'] = data.banned
    
    if update_data:
        await db.users.update_one({'id': user_id}, {'$set': update_data})
    
    return {'message': 'User updated successfully'}

@api_router.get('/admin/kyc/pending')
async def get_pending_kyc(payload: dict = Depends(verify_token)):
    if payload['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    users = await db.users.find(
        {'kyc_status': 'under_review'},
        {'_id': 0, 'password': 0}
    ).to_list(None)
    
    return {'users': users}

@api_router.post('/admin/kyc/action')
async def kyc_action(data: KYCAction, payload: dict = Depends(verify_token)):
    if payload['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    if data.action not in ['approve', 'reject']:
        raise HTTPException(status_code=400, detail='Invalid action')
    
    new_status = 'approved' if data.action == 'approve' else 'rejected'
    
    await db.users.update_one(
        {'id': data.user_id},
        {'$set': {'kyc_status': new_status}}
    )
    
    return {'message': f'KYC {data.action}d successfully'}

@api_router.get('/admin/tasks')
async def get_all_tasks(payload: dict = Depends(verify_token)):
    if payload['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    tasks = await db.tasks.find({}, {'_id': 0}).to_list(None)
    return {'tasks': tasks}

@api_router.post('/admin/tasks/create')
async def create_task(data: TaskCreate, payload: dict = Depends(verify_token)):
    if payload['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    task_doc = {
        'id': str(uuid.uuid4()),
        'title': data.title,
        'url': data.url,
        'task_type': data.task_type,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.tasks.insert_one(task_doc)
    
    return {'message': 'Task created successfully', 'task': {
        'id': task_doc['id'],
        'title': task_doc['title'],
        'url': task_doc['url'],
        'task_type': task_doc['task_type'],
        'created_at': task_doc['created_at']
    }}

@api_router.delete('/admin/tasks/{task_id}')
async def delete_task(task_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    await db.tasks.delete_one({'id': task_id})
    await db.task_completions.delete_many({'task_id': task_id})
    
    return {'message': 'Task deleted successfully'}

@api_router.post('/admin/banner/upload')
async def upload_banner(data: BannerUpdate, payload: dict = Depends(verify_token)):
    if payload['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    await db.settings.update_one(
        {'key': 'banner'},
        {'$set': {'value': data.banner_base64}},
        upsert=True
    )
    
    return {'message': 'Banner uploaded successfully'}

@api_router.post('/admin/settings/binance')
async def update_binance_address(data: BinanceAddressUpdate, payload: dict = Depends(verify_token)):
    if payload['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    await db.settings.update_one(
        {'key': 'binance_address'},
        {'$set': {'value': data.binance_address}},
        upsert=True
    )
    
    return {'message': 'Binance address updated successfully'}

@api_router.post('/admin/settings/min-withdrawal')
async def update_min_withdrawal(data: MinWithdrawalUpdate, payload: dict = Depends(verify_token)):
    if payload['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    if data.min_withdrawal_amount < 0:
        raise HTTPException(status_code=400, detail='Minimum withdrawal amount must be positive')
    
    await db.settings.update_one(
        {'key': 'min_withdrawal_amount'},
        {'$set': {'value': data.min_withdrawal_amount}},
        upsert=True
    )
    
    return {'message': 'Minimum withdrawal amount updated successfully'}

@api_router.post('/admin/notifications/create')
async def create_notification(data: NotificationCreate, payload: dict = Depends(verify_token)):
    if payload['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    notification_doc = {
        'id': str(uuid.uuid4()),
        'title': data.title,
        'message': data.message,
        'user_id': data.user_id,
        'is_read': False,
        'read_by': [],
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.notifications.insert_one(notification_doc)
    
    if data.user_id:
        return {'message': f'Notification sent to user successfully'}
    else:
        return {'message': 'Notification broadcast to all users successfully'}

@api_router.get('/admin/notifications/all')
async def get_all_notifications(payload: dict = Depends(verify_token)):
    if payload['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    notifications = await db.notifications.find({}, {'_id': 0}).sort('created_at', -1).to_list(None)
    
    for notif in notifications:
        if notif.get('user_id'):
            user = await db.users.find_one({'id': notif['user_id']}, {'_id': 0})
            if user:
                notif['user_name'] = user.get('full_name')
                notif['user_email'] = user.get('email')
        else:
            notif['user_name'] = 'All Users'
            notif['user_email'] = 'Broadcast'
    
    return {'notifications': notifications}

@api_router.delete('/admin/notifications/{notification_id}')
async def delete_notification(notification_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    await db.notifications.delete_one({'id': notification_id})
    
    return {'message': 'Notification deleted successfully'}

@api_router.get('/admin/withdrawals/pending')
async def get_pending_withdrawals(payload: dict = Depends(verify_token)):
    if payload['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    withdrawals = await db.withdrawals.find(
        {'status': 'pending'},
        {'_id': 0}
    ).sort('created_at', -1).to_list(None)
    
    for withdrawal in withdrawals:
        user = await db.users.find_one({'id': withdrawal['user_id']}, {'_id': 0})
        if user:
            withdrawal['user_name'] = user.get('full_name')
            withdrawal['user_email'] = user.get('email')
    
    return {'withdrawals': withdrawals}

@api_router.get('/admin/withdrawals/all')
async def get_all_withdrawals(payload: dict = Depends(verify_token)):
    if payload['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    withdrawals = await db.withdrawals.find({}, {'_id': 0}).sort('created_at', -1).to_list(None)
    
    for withdrawal in withdrawals:
        user = await db.users.find_one({'id': withdrawal['user_id']}, {'_id': 0})
        if user:
            withdrawal['user_name'] = user.get('full_name')
            withdrawal['user_email'] = user.get('email')
    
    return {'withdrawals': withdrawals}

@api_router.post('/admin/withdrawals/action')
async def withdrawal_action(data: WithdrawalAction, payload: dict = Depends(verify_token)):
    if payload['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    if data.action not in ['approve', 'reject']:
        raise HTTPException(status_code=400, detail='Invalid action')
    
    withdrawal = await db.withdrawals.find_one({'id': data.withdrawal_id}, {'_id': 0})
    if not withdrawal:
        raise HTTPException(status_code=404, detail='Withdrawal not found')
    
    if withdrawal['status'] != 'pending':
        raise HTTPException(status_code=400, detail='Withdrawal already processed')
    
    if data.action == 'approve':
        user = await db.users.find_one({'id': withdrawal['user_id']}, {'_id': 0})
        if not user:
            raise HTTPException(status_code=404, detail='User not found')
        
        if user['balance'] < withdrawal['amount']:
            raise HTTPException(status_code=400, detail='User has insufficient balance')
        
        await db.users.update_one(
            {'id': withdrawal['user_id']},
            {'$inc': {'balance': -withdrawal['amount']}}
        )
        
        await db.withdrawals.update_one(
            {'id': data.withdrawal_id},
            {'$set': {
                'status': 'approved',
                'processed_at': datetime.now(timezone.utc).isoformat()
            }}
        )
        
        await db.transactions.insert_one({
            'id': str(uuid.uuid4()),
            'user_id': withdrawal['user_id'],
            'type': 'withdrawal',
            'amount': -withdrawal['amount'],
            'status': 'completed',
            'created_at': datetime.now(timezone.utc).isoformat()
        })
        
        return {'message': 'Withdrawal approved and processed successfully'}
    
    else:
        await db.withdrawals.update_one(
            {'id': data.withdrawal_id},
            {'$set': {
                'status': 'rejected',
                'processed_at': datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {'message': 'Withdrawal rejected'}

@api_router.get('/admin/inquiries')
async def get_sponsor_inquiries(payload: dict = Depends(verify_token)):
    if payload['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    inquiries = await db.sponsor_inquiries.find({}, {'_id': 0}).sort('created_at', -1).to_list(None)
    return {'inquiries': inquiries}

@api_router.get('/admin/transactions/pending')
async def get_pending_transactions(payload: dict = Depends(verify_token)):
    if payload['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    transactions = await db.transactions.find(
        {'type': 'package_purchase', 'status': 'pending'},
        {'_id': 0}
    ).to_list(None)
    
    return {'transactions': transactions}

@api_router.post('/admin/transactions/{transaction_id}/approve')
async def approve_transaction(transaction_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    transaction = await db.transactions.find_one({'id': transaction_id}, {'_id': 0})
    if not transaction:
        raise HTTPException(status_code=404, detail='Transaction not found')
    
    if transaction['status'] != 'pending':
        raise HTTPException(status_code=400, detail='Transaction already processed')
    
    amount = transaction['amount']
    daily_income = 1 if amount == 25 else 2.5
    
    package_doc = {
        'id': str(uuid.uuid4()),
        'user_id': transaction['user_id'],
        'amount': amount,
        'daily_income': daily_income,
        'days_remaining': 60,
        'is_active': True,
        'start_date': datetime.now(timezone.utc).isoformat(),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.packages.insert_one(package_doc)
    
    await db.transactions.update_one(
        {'id': transaction_id},
        {'$set': {'status': 'approved'}}
    )
    
    await calculate_referral_bonuses(transaction['user_id'], amount, 'instant')
    
    await check_milestone_bonuses(transaction['user_id'])
    
    user_packages = await db.packages.find(
        {'user_id': transaction['user_id'], 'status': {'$ne': 'rejected'}}
    ).to_list(None)
    
    small_packages = sum(1 for p in user_packages if p['amount'] == 25)
    big_packages = sum(1 for p in user_packages if p['amount'] == 60)
    
    if small_packages >= 10:
        already_awarded = await db.transactions.find_one({
            'user_id': transaction['user_id'],
            'type': 'loan_bonus_10_small'
        })
        if not already_awarded:
            await db.users.update_one(
                {'id': transaction['user_id']},
                {'$inc': {'balance': 100}}
            )
            await db.transactions.insert_one({
                'id': str(uuid.uuid4()),
                'user_id': transaction['user_id'],
                'type': 'loan_bonus_10_small',
                'amount': 100,
                'status': 'completed',
                'created_at': datetime.now(timezone.utc).isoformat()
            })
    
    if big_packages >= 10:
        already_awarded = await db.transactions.find_one({
            'user_id': transaction['user_id'],
            'type': 'loan_bonus_10_big'
        })
        if not already_awarded:
            await db.users.update_one(
                {'id': transaction['user_id']},
                {'$inc': {'balance': 500}}
            )
            await db.transactions.insert_one({
                'id': str(uuid.uuid4()),
                'user_id': transaction['user_id'],
                'type': 'loan_bonus_10_big',
                'amount': 500,
                'status': 'completed',
                'created_at': datetime.now(timezone.utc).isoformat()
            })
    
    await db.notifications.insert_one({
        'id': str(uuid.uuid4()),
        'title': 'Deposit Approved!',
        'message': f'Your ${amount} deposit has been approved. Your package is now active and earning ${daily_income}/day for 60 days!',
        'user_id': transaction['user_id'],
        'is_read': False,
        'read_by': [],
        'created_at': datetime.now(timezone.utc).isoformat()
    })
    
    return {'message': 'Transaction approved and package activated'}

@api_router.post('/admin/transactions/{transaction_id}/reject')
async def reject_transaction(transaction_id: str, payload: dict = Depends(verify_token)):
    if payload['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    
    await db.transactions.update_one(
        {'id': transaction_id},
        {'$set': {'status': 'rejected'}}
    )
    
    return {'message': 'Transaction rejected'}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

scheduler = AsyncIOScheduler()
scheduler.add_job(daily_task_reset, 'cron', hour=0, minute=0)
scheduler.add_job(process_daily_income, 'cron', hour=0, minute=5)

@app.on_event("startup")
async def startup_event():
    scheduler.start()
    logger.info('Scheduler started')

@app.on_event("shutdown")
async def shutdown_db_client():
    scheduler.shutdown()
    client.close()
