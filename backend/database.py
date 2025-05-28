import sqlite3
from datetime import datetime

def init_db():
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    # Users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            failed_attempts INTEGER DEFAULT 0,
            locked BOOLEAN DEFAULT 0,
            lockout_time TEXT,
            reset_token TEXT,
            reset_token_expiry TEXT
        )
    ''')
    # Sessions table
    c.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL,
            expiry TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    conn.commit()
    conn.close()

def get_user(email):
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = c.fetchone()
    conn.close()
    if user:
        return {
            'id': user[0],
            'email': user[1],
            'password': user[2],
            'failed_attempts': user[3],
            'locked': bool(user[4]),
            'lockout_time': user[5],
            'reset_token': user[6],
            'reset_token_expiry': user[7]
        }
    return None

def get_user_by_id(user_id):
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = c.fetchone()
    conn.close()
    if user:
        return {
            'id': user[0],
            'email': user[1],
            'password': user[2],
            'failed_attempts': user[3],
            'locked': bool(user[4]),
            'lockout_time': user[5],
            'reset_token': user[6],
            'reset_token_expiry': user[7]
        }
    return None

def get_user_by_token(token):
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('SELECT user_id, expiry FROM sessions WHERE token = ?', (token,))
    session = c.fetchone()
    if session:
        user_id, expiry = session
        expiry_dt = datetime.fromisoformat(expiry)
        if datetime.now() > expiry_dt:
            c.execute('DELETE FROM sessions WHERE token = ?', (token,))
            conn.commit()
            conn.close()
            return None
        user = get_user_by_id(user_id)
        conn.close()
        return user
    conn.close()
    return None

def create_user(email, hashed_password):
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('INSERT INTO users (email, password) VALUES (?, ?)', (email, hashed_password))
    conn.commit()
    conn.close()

def create_session(user_id, token, expiry):
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('INSERT INTO sessions (user_id, token, expiry) VALUES (?, ?, ?)', (user_id, token, expiry))
    conn.commit()
    conn.close()

def delete_session(token):
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('DELETE FROM sessions WHERE token = ?', (token,))
    conn.commit()
    conn.close()

def update_user_attempts(email, failed_attempts, locked=False, lockout_time=None):
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    if lockout_time:
        c.execute('UPDATE users SET failed_attempts = ?, locked = ?, lockout_time = ? WHERE email = ?',
                  (failed_attempts, int(locked), lockout_time, email))
    else:
        c.execute('UPDATE users SET failed_attempts = ?, locked = ?, lockout_time = NULL WHERE email = ?',
                  (failed_attempts, int(locked), email))
    conn.commit()
    conn.close()

def set_reset_token(email, token, expiry):
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
              (token, expiry, email))
    conn.commit()
    conn.close()

def update_user_password(email, hashed_password):
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE email = ?',
              (hashed_password, email))
    conn.commit()
    conn.close()