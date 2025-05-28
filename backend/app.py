from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO
import logging
from datetime import datetime, timedelta
from network_capture import NetworkCapture
import bcrypt
import re
import uuid
from functools import wraps
from database import init_db, get_user, create_user, update_user_attempts, set_reset_token, get_user_by_token, update_user_password, create_session, delete_session

import smtplib
from email.mime.text import MIMEText

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Replace with a secure key
CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "http://localhost:3000"}})
socketio = SocketIO(app, cors_allowed_origins="http://localhost:3000", manage_session=False)

capture = NetworkCapture(update_interval=0.1)  # 100ms updates
init_db()  # Initialize the database

# Email configuration (replace with your email provider's settings)
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USER = 'your-email@gmail.com'  # Replace with your Gmail address
EMAIL_PASSWORD = 'your-app-password'  # Replace with your Gmail App Password

# Rate limiting for login attempts
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION = timedelta(minutes=15)
RESET_TOKEN_EXPIRY = timedelta(hours=1)
SESSION_TOKEN_EXPIRY = timedelta(minutes=30)

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'message': 'Missing or invalid token'}), 401
        token = auth_header.split(' ')[1]
        user = get_user_by_token(token)
        if not user:
            return jsonify({'message': 'Invalid or expired token'}), 401
        request.user = user  # Attach user to request for use in the endpoint
        return f(*args, **kwargs)
    return decorated

def validate_email(email):
    email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return re.match(email_regex, email) is not None

def validate_password(password):
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'[0-9]', password):
        return False
    if not re.search(r'[^A-Za-z0-9]', password):
        return False
    return True

def send_email(to_email, subject, body):
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = EMAIL_USER
    msg['To'] = to_email

    try:
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_USER, to_email, msg.as_string())
        logger.info(f"Email sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        raise

def emit_network_data(metrics):
    socketio.emit('network_update', metrics)
    if metrics['anomalies']:
        socketio.emit('new_anomalies', metrics['anomalies'])

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    agree_policy = data.get('agreePolicy', False)

    # Input validation
    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400
    if not validate_email(email):
        return jsonify({'message': 'Invalid email format'}), 400
    if not validate_password(password):
        return jsonify({'message': 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'}), 400
    if not agree_policy:
        return jsonify({'message': 'You must agree to the privacy policy'}), 400
    if get_user(email):
        return jsonify({'message': 'Email already registered'}), 400

    # Hash password and store user
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    create_user(email, hashed_password.decode('utf-8'))

    # Generate a session token
    user = get_user(email)
    token = str(uuid.uuid4())
    expiry = (datetime.now() + SESSION_TOKEN_EXPIRY).isoformat()
    create_session(user['id'], token, expiry)

    return jsonify({'message': 'Signup successful', 'token': token}), 200

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Input validation
    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400

    user = get_user(email)
    if not user:
        return jsonify({'message': 'Invalid credentials'}), 401

    # Check lockout
    if user['locked']:
        lockout_time = datetime.fromisoformat(user['lockout_time']) if user['lockout_time'] else datetime.now()
        if datetime.now() - lockout_time < LOCKOUT_DURATION:
            return jsonify({'message': 'Account locked due to too many failed attempts'}), 403
        else:
            update_user_attempts(email, 0, locked=False)

    # Verify password
    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        failed_attempts = user['failed_attempts'] + 1
        if failed_attempts >= MAX_LOGIN_ATTEMPTS:
            update_user_attempts(email, failed_attempts, locked=True, lockout_time=datetime.now().isoformat())
            return jsonify({'message': 'Account locked due to too many failed attempts'}), 403
        update_user_attempts(email, failed_attempts)
        return jsonify({'message': 'Invalid credentials'}), 401

    # Reset failed attempts on successful login
    update_user_attempts(email, 0)

    # Generate a session token
    token = str(uuid.uuid4())
    expiry = (datetime.now() + SESSION_TOKEN_EXPIRY).isoformat()
    create_session(user['id'], token, expiry)

    return jsonify({'message': 'Login successful', 'token': token}), 200

@app.route('/api/auth/logout', methods=['POST'])
@require_auth
def logout():
    auth_header = request.headers.get('Authorization')
    token = auth_header.split(' ')[1]
    delete_session(token)
    return jsonify({'message': 'Logout successful'}), 200

@app.route('/api/auth/check', methods=['GET'])
def check_auth():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'message': 'Not authenticated'}), 401
    token = auth_header.split(' ')[1]
    user = get_user_by_token(token)
    if user:
        return jsonify({'message': 'Authenticated'}), 200
    return jsonify({'message': 'Not authenticated'}), 401

@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'message': 'Email is required'}), 400
    if not validate_email(email):
        return jsonify({'message': 'Invalid email format'}), 400

    user = get_user(email)
    if not user:
        return jsonify({'message': 'Email not found'}), 404

    # Generate a reset token
    reset_token = str(uuid.uuid4())
    expiry = (datetime.now() + RESET_TOKEN_EXPIRY).isoformat()
    set_reset_token(email, reset_token, expiry)

    # Send email with reset link
    reset_link = f"http://localhost:3000/reset-password?token={reset_token}"
    try:
        send_email(
            email,
            "Password Reset Request",
            f"Click the link below to reset your password:\n\n{reset_link}\n\nThis link will expire in 1 hour."
        )
    except Exception as e:
        return jsonify({'message': 'Failed to send reset email'}), 500

    return jsonify({'message': 'Password reset link sent to your email'}), 200

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')

    if not token or not new_password:
        return jsonify({'message': 'Token and new password are required'}), 400
    if not validate_password(new_password):
        return jsonify({'message': 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'}), 400

    user = get_user_by_token(token)
    if not user:
        return jsonify({'message': 'Invalid or expired token'}), 400

    # Check token expiry
    expiry = datetime.fromisoformat(user['reset_token_expiry']) if user['reset_token_expiry'] else datetime.now()
    if datetime.now() > expiry:
        return jsonify({'message': 'Token has expired'}), 400

    # Update password
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
    update_user_password(user['email'], hashed_password.decode('utf-8'))

    return jsonify({'message': 'Password reset successful'}), 200

@app.route('/api/network/overview', methods=['GET'])
@require_auth
def get_network_overview():
    metrics = capture._get_metrics()
    stats = {
        'devices': len(metrics['devices']),
        'traffic_rate': f"{metrics['traffic_data'][-1]['value']:.2f} Mbps" if metrics['traffic_data'] else "0 Mbps",
        'alert_count': len([a for a in metrics['anomalies'] if a['severity'] in ['high', 'medium']]),
        'anomaly_count': len(metrics['anomalies'])
    }
    return jsonify({
        'stats': stats,
        'traffic_data': metrics['traffic_data'],
        'protocol_distribution': metrics['protocol_distribution'],
        'top_talkers': metrics['top_talkers'],
        'recent_anomalies': metrics['anomalies'],
        'devices': metrics['devices']
    })

@app.route('/api/network/traffic', methods=['GET'])
@require_auth
def get_traffic_data():
    hours = request.args.get('hours', default=24, type=int)
    start_time = (datetime.now() - timedelta(hours=hours)).isoformat()
    metrics = capture._get_metrics()
    filtered_data = [
        data for data in metrics['traffic_data']
        if data['timestamp'] >= start_time
    ]
    return jsonify(filtered_data)

@app.route('/api/network/anomalies', methods=['GET'])
@require_auth
def get_anomalies():
    severity = request.args.get('severity', default=None)
    hours = request.args.get('hours', default=24, type=int)
    start_time = (datetime.now() - timedelta(hours=hours)).isoformat()
    metrics = capture._get_metrics()
    filtered_anomalies = metrics['anomalies']
    if severity:
        filtered_anomalies = [
            a for a in filtered_anomalies if a['severity'] == severity
        ]
    filtered_anomalies = [
        a for a in filtered_anomalies if a['timestamp'] >= start_time
    ]
    return jsonify(filtered_anomalies)

@app.route('/api/network/devices', methods=['GET'])
@require_auth
def get_devices():
    metrics = capture._get_metrics()
    return jsonify(metrics['devices'])

@app.route('/api/network/top-talkers', methods=['GET'])
@require_auth
def get_top_talkers():
    metrics = capture._get_metrics()
    return jsonify(metrics['top_talkers'])

@socketio.on('connect')
def handle_connect(auth):
    token = auth.get('token') if auth else None
    if not token:
        logger.warning("No token provided for Socket.IO connection")
        return False  # Disconnect if no token
    user = get_user_by_token(token)
    if not user:
        logger.warning("Invalid or expired token for Socket.IO connection")
        return False  # Disconnect if token is invalid
    logger.info("Client connected to Socket.IO")
    capture.start_capture(emit_network_data)

@socketio.on('disconnect')
def handle_disconnect():
    logger.info("Client disconnected from Socket.IO")

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)