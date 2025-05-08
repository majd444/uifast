from flask import Flask, request, redirect, url_for, jsonify
import requests
import json
import os
import base64
import sqlite3
import datetime

# Try to import psycopg2, but don't fail if it's not available
try:
    import psycopg2
    import psycopg2.extras
    PSYCOPG2_AVAILABLE = True
except ImportError:
    print("psycopg2 not available, falling back to SQLite for local development")
    PSYCOPG2_AVAILABLE = False
from oauthlib.oauth2 import WebApplicationClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Google OAuth2 configuration
CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI")
AUTH_URL = "https://accounts.google.com/o/oauth2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
SCOPE = ["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/calendar.events"]

# OpenRouter API configuration
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")

# Database configuration
DATABASE_URL = os.environ.get("DATABASE_URL")

# For local testing, use SQLite as fallback
DB_PATH = os.path.join(os.path.dirname(__file__), 'tokens.db')

# Parse individual database credentials
DB_USERNAME = os.environ.get("database_username")
DB_PASSWORD = os.environ.get("database_password")
DB_HOST = os.environ.get("database_host")
DB_PORT = os.environ.get("database_port")
DB_NAME = os.environ.get("database_name")

client = WebApplicationClient(CLIENT_ID)

# Database connection function
def get_db_connection():
    # First try PostgreSQL if DATABASE_URL is available and psycopg2 is installed
    if PSYCOPG2_AVAILABLE and DATABASE_URL:
        try:
            conn = psycopg2.connect(DATABASE_URL)
            conn.autocommit = False
            print("Connected to PostgreSQL database using DATABASE_URL")
            return conn
        except Exception as e:
            print(f"PostgreSQL connection error with DATABASE_URL: {e}")
            # Fall back to individual credentials
            if DB_USERNAME and DB_PASSWORD and DB_HOST and DB_PORT and DB_NAME:
                try:
                    conn = psycopg2.connect(
                        user=DB_USERNAME,
                        password=DB_PASSWORD,
                        host=DB_HOST,
                        port=DB_PORT,
                        database=DB_NAME
                    )
                    conn.autocommit = False
                    print("Connected to PostgreSQL database using individual credentials")
                    return conn
                except Exception as e:
                    print(f"PostgreSQL connection error with individual credentials: {e}")
    elif not PSYCOPG2_AVAILABLE and (DATABASE_URL or (DB_USERNAME and DB_HOST)):
        print("PostgreSQL credentials found but psycopg2 is not installed. Falling back to SQLite.")
    
    # Fall back to SQLite for local testing
    try:
        print("Using SQLite for local development/testing")
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        print(f"SQLite connection error: {e}")
        return None

# Initialize database
def init_db():
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            
            # Check if we're using PostgreSQL or SQLite
            if PSYCOPG2_AVAILABLE and isinstance(conn, psycopg2.extensions.connection):
                # PostgreSQL table creation
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS tokens (
                        id SERIAL PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        provider TEXT NOT NULL,
                        token_data JSONB NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, provider)
                    )
                """)
                print("PostgreSQL database initialized successfully")
            else:
                # SQLite table creation
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS tokens (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        provider TEXT NOT NULL,
                        token_data TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, provider)
                    )
                ''')
                print("SQLite database initialized successfully")
                
            conn.commit()
        except Exception as e:
            print(f"Database initialization error: {e}")
        finally:
            conn.close()
    else:
        print("Failed to initialize database - no connection")

# Initialize database on startup
init_db()

# Helper functions for token storage
def save_token(user_id, provider, token_data):
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        # Convert token_data to JSON string
        token_data_str = json.dumps(token_data)
        # Current timestamp
        now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Check if we're using PostgreSQL or SQLite
        if isinstance(conn, psycopg2.extensions.connection):
            # PostgreSQL operations
            # Check if token already exists
            cursor.execute(
                "SELECT id FROM tokens WHERE user_id = %s AND provider = %s", 
                (user_id, provider)
            )
            existing = cursor.fetchone()
            
            if existing:
                # Update existing token
                cursor.execute(
                    "UPDATE tokens SET token_data = %s, updated_at = %s WHERE user_id = %s AND provider = %s",
                    (token_data_str, now, user_id, provider)
                )
            else:
                # Insert new token
                cursor.execute(
                    "INSERT INTO tokens (user_id, provider, token_data, created_at, updated_at) VALUES (%s, %s, %s, %s, %s)",
                    (user_id, provider, token_data_str, now, now)
                )
        else:
            # SQLite operations
            # Check if token already exists
            cursor.execute(
                "SELECT id FROM tokens WHERE user_id = ? AND provider = ?", 
                (user_id, provider)
            )
            existing = cursor.fetchone()
            
            if existing:
                # Update existing token
                cursor.execute(
                    "UPDATE tokens SET token_data = ?, updated_at = ? WHERE user_id = ? AND provider = ?",
                    (token_data_str, now, user_id, provider)
                )
            else:
                # Insert new token
                cursor.execute(
                    "INSERT INTO tokens (user_id, provider, token_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                    (user_id, provider, token_data_str, now, now)
                )
        
        conn.commit()
        return True
    except Exception as e:
        print(f"Error saving token: {e}")
        return False
    finally:
        conn.close()

def get_token(user_id, provider):
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        
        # Check if we're using PostgreSQL or SQLite
        if isinstance(conn, psycopg2.extensions.connection):
            # PostgreSQL operations
            cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
            cursor.execute(
                "SELECT token_data FROM tokens WHERE user_id = %s AND provider = %s",
                (user_id, provider)
            )
        else:
            # SQLite operations
            cursor.execute(
                "SELECT token_data FROM tokens WHERE user_id = ? AND provider = ?",
                (user_id, provider)
            )
            
        result = cursor.fetchone()
        
        if result:
            # Parse JSON string back to dictionary
            return json.loads(result['token_data'])
        return None
    except Exception as e:
        print(f"Error getting token: {e}")
        return None
    finally:
        conn.close()

# Start OAuth2 flow
@app.route("/authorize/<provider>")
def authorize(provider):
    if provider == "google":
        auth_uri = client.prepare_request_uri(AUTH_URL, redirect_uri=REDIRECT_URI, scope=SCOPE)
        return redirect(auth_uri)
    else:
        return jsonify({"error": f"Provider {provider} not supported"}), 400

# OAuth2 callback
@app.route("/auth/google/callback")
def google_callback():
    # Get the authorization code from the request
    code = request.args.get("code")
    
    # Prepare the token request
    token_request_body = client.prepare_token_request(
        TOKEN_URL, authorization_response=request.url, redirect_url=REDIRECT_URI, code=code
    )
    
    # Exchange the authorization code for tokens
    token_response = requests.post(
        token_request_body[0],
        headers=token_request_body[1],
        data=token_request_body[2],
        auth=(CLIENT_ID, CLIENT_SECRET)
    )
    
    # Parse the token response
    client.parse_request_body_response(json.dumps(token_response.json()))
    
    # For demo purposes, using a fixed user_id - in production use real user authentication
    user_id = "demo_user"
    
    # Save the token to the database
    token_data = token_response.json()
    if save_token(user_id, "google", token_data):
        return jsonify({"success": True, "message": "Authentication successful"})
    else:
        return jsonify({"success": False, "message": "Failed to save authentication token"}), 500

# Tool: Send email
@app.route("/tools/send-email", methods=["POST"])
def send_email():
    # Get request data
    data = request.json
    to = data.get("to")
    subject = data.get("subject")
    body = data.get("body")
    user_id = data.get("user_id", "demo_user")  # In production, get from authentication
    
    # Get user token from database
    token_data = get_token(user_id, "google")
    if not token_data:
        return jsonify({"error": "Not authenticated"}), 401
    
    # Create Gmail API message (simplified)
    email_content = f"To: {to}\nSubject: {subject}\n\n{body}"
    message = {
        "raw": base64.urlsafe_b64encode(email_content.encode()).decode()
    }
    
    # Call Gmail API
    response = requests.post(
        "https://www.googleapis.com/gmail/v1/users/me/messages/send",
        headers={"Authorization": f"Bearer {token_data['access_token']}"},
        json=message
    )
    
    if response.status_code == 200:
        return jsonify({"success": True, "message": "Email sent successfully"})
    else:
        return jsonify({"error": "Failed to send email", "details": response.text}), response.status_code

# Tool: Create calendar event
@app.route("/tools/create-event", methods=["POST"])
def create_event():
    # Get request data
    data = request.json
    summary = data.get("summary")
    start_time = data.get("start_time")
    end_time = data.get("end_time")
    description = data.get("description", "")
    location = data.get("location", "")
    user_id = data.get("user_id", "demo_user")  # In production, get from authentication
    
    # Get user token from database
    token_data = get_token(user_id, "google")
    if not token_data:
        return jsonify({"error": "Not authenticated"}), 401
    
    # Create Calendar API event
    event = {
        "summary": summary,
        "location": location,
        "description": description,
        "start": {"dateTime": start_time, "timeZone": "America/New_York"},
        "end": {"dateTime": end_time, "timeZone": "America/New_York"}
    }
    
    # Call Calendar API
    response = requests.post(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        headers={"Authorization": f"Bearer {token_data['access_token']}"},
        json=event
    )
    
    if response.status_code == 200:
        return jsonify({"success": True, "event": response.json()})
    else:
        return jsonify({"error": "Failed to create event", "details": response.text}), response.status_code

# Test database connection
@app.route("/test-db")
def test_db():
    conn = get_db_connection()
    if conn:
        try:
            # Test if we can execute a query
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            
            # Determine database type
            if PSYCOPG2_AVAILABLE and isinstance(conn, psycopg2.extensions.connection):
                db_type = "PostgreSQL (Sevalla)"
                db_info = {
                    "host": conn.info.host,
                    "port": conn.info.port,
                    "dbname": conn.info.dbname,
                    "user": conn.info.user
                }
            else:
                db_type = "SQLite (local)"
                db_info = {"path": DB_PATH}
                
            conn.close()
            return jsonify({
                "success": True, 
                "message": "Database connection successful",
                "database_type": db_type,
                "database_info": db_info
            })
        except Exception as e:
            return jsonify({"success": False, "message": f"Database connection error: {str(e)}"}), 500
    else:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

# Health check endpoint
@app.route("/health")
def health_check():
    return jsonify({"status": "healthy"})

if __name__ == "__main__":
    # Use port 5001 to avoid conflicts with port 3000 (Next.js) and 5000 (common default)
    port = int(os.environ.get("BACKEND_PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)