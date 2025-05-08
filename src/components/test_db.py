#!/usr/bin/env python3
"""
Database integration test script for UIFast project.
This script tests the database connection and token storage functionality
without running the full Flask server.
"""

import os
import json
import sqlite3
import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# For local testing, use SQLite
DB_PATH = os.path.join(os.path.dirname(__file__), 'tokens.db')

def get_db_connection():
    """Create a database connection to the SQLite database."""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def init_db():
    """Initialize the database with the tokens table."""
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            # Create tokens table if it doesn't exist
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
            conn.commit()
            print("✅ Database initialized successfully")
            return True
        except Exception as e:
            print(f"❌ Database initialization error: {e}")
            return False
        finally:
            conn.close()
    else:
        print("❌ Failed to initialize database - no connection")
        return False

def save_token(user_id, provider, token_data):
    """Save a token to the database."""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        # Convert token_data to JSON string
        token_data_str = json.dumps(token_data)
        # Current timestamp
        now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
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
            print(f"✅ Updated token for user '{user_id}' and provider '{provider}'")
        else:
            # Insert new token
            cursor.execute(
                "INSERT INTO tokens (user_id, provider, token_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                (user_id, provider, token_data_str, now, now)
            )
            print(f"✅ Inserted new token for user '{user_id}' and provider '{provider}'")
        
        conn.commit()
        return True
    except Exception as e:
        print(f"❌ Error saving token: {e}")
        return False
    finally:
        conn.close()

def get_token(user_id, provider):
    """Retrieve a token from the database."""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT token_data FROM tokens WHERE user_id = ? AND provider = ?",
            (user_id, provider)
        )
        result = cursor.fetchone()
        
        if result:
            # Parse JSON string back to dictionary
            token_data = json.loads(result['token_data'])
            print(f"✅ Retrieved token for user '{user_id}' and provider '{provider}'")
            return token_data
        print(f"⚠️ No token found for user '{user_id}' and provider '{provider}'")
        return None
    except Exception as e:
        print(f"❌ Error getting token: {e}")
        return None
    finally:
        conn.close()

def list_tokens():
    """List all tokens in the database."""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id, provider, created_at, updated_at FROM tokens")
        tokens = cursor.fetchall()
        
        if tokens:
            print("\n=== Tokens in Database ===")
            for token in tokens:
                print(f"User: {token['user_id']}, Provider: {token['provider']}")
                print(f"  Created: {token['created_at']}, Updated: {token['updated_at']}")
            print("========================\n")
        else:
            print("⚠️ No tokens found in database")
        
        return tokens
    except Exception as e:
        print(f"❌ Error listing tokens: {e}")
        return None
    finally:
        conn.close()

def test_database():
    """Run a series of tests on the database functionality."""
    print("\n=== Database Integration Test ===")
    
    # Initialize database
    if not init_db():
        print("❌ Database initialization failed, aborting tests")
        return False
    
    # Test connection
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            conn.close()
            print("✅ Database connection test passed")
        except Exception as e:
            print(f"❌ Database connection test failed: {e}")
            return False
    else:
        print("❌ Database connection test failed")
        return False
    
    # Test token operations
    test_user = "test_user"
    test_provider = "google"
    test_token = {
        "access_token": "ya29.test-token",
        "refresh_token": "1//test-refresh-token",
        "token_type": "Bearer",
        "expires_in": 3599,
        "scope": "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.send",
        "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ.test-id-token"
    }
    
    # Save token
    if not save_token(test_user, test_provider, test_token):
        print("❌ Token save test failed")
        return False
    
    # Retrieve token
    retrieved_token = get_token(test_user, test_provider)
    if not retrieved_token:
        print("❌ Token retrieval test failed")
        return False
    
    # Verify token data
    if retrieved_token.get("access_token") == test_token["access_token"]:
        print("✅ Token data verification test passed")
    else:
        print("❌ Token data verification test failed")
        return False
    
    # Update token
    updated_token = test_token.copy()
    updated_token["access_token"] = "ya29.updated-test-token"
    if not save_token(test_user, test_provider, updated_token):
        print("❌ Token update test failed")
        return False
    
    # Verify update
    retrieved_updated = get_token(test_user, test_provider)
    if retrieved_updated and retrieved_updated.get("access_token") == updated_token["access_token"]:
        print("✅ Token update verification test passed")
    else:
        print("❌ Token update verification test failed")
        return False
    
    # List all tokens
    list_tokens()
    
    print("✅ All database tests passed successfully!")
    print("=== Test Complete ===\n")
    return True

if __name__ == "__main__":
    # Run the database tests
    test_database()
    
    # Instructions for Sevalla deployment
    print("\n=== Sevalla Deployment Instructions ===")
    print("1. In the Sevalla dashboard, add the DATABASE_URL environment variable")
    print("   Format: postgresql://username:password@hostname:port/uifast_db")
    print("2. Update the MCP server code to use psycopg2 with the DATABASE_URL")
    print("3. Deploy the updated code to Sevalla")
    print("4. Test the database connection with the /test-db endpoint")
    print("=====================================\n")
