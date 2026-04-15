#!/usr/bin/env python3
"""
Test Delta Exchange API authentication
This script helps debug 401 Unauthorized errors
"""

import hashlib
import hmac
import time
import httpx
import json
import sys

def test_delta_auth(api_key: str, api_secret: str, base_url: str):
    """Test Delta Exchange authentication"""
    
    print(f"Testing Delta Exchange API")
    print(f"Base URL: {base_url}")
    print(f"API Key: {api_key[:10]}...")
    print(f"API Secret: {'*' * len(api_secret)}")
    print("-" * 60)
    
    # Generate signature
    method = "GET"
    path = "/v2/wallet/balances"
    query = ""
    payload = ""
    
    timestamp = str(int(time.time()))
    message = method + timestamp + path + query + payload
    
    print(f"\nSignature Components:")
    print(f"  Method: {method}")
    print(f"  Timestamp: {timestamp}")
    print(f"  Path: {path}")
    print(f"  Query: {query}")
    print(f"  Payload: {payload}")
    print(f"  Message: {message}")
    
    signature = hmac.new(
        api_secret.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    
    print(f"  Signature: {signature}")
    
    # Make request
    headers = {
        'api-key': api_key,
        'timestamp': timestamp,
        'signature': signature,
        'Content-Type': 'application/json',
        'User-Agent': 'CryptoAlgoBot/2.0'
    }
    
    print(f"\nRequest Headers:")
    for k, v in headers.items():
        if k == 'signature':
            print(f"  {k}: {v[:20]}...")
        else:
            print(f"  {k}: {v}")
    
    print(f"\nMaking request to: {base_url}{path}")
    
    try:
        response = httpx.get(
            base_url + path,
            headers=headers,
            timeout=30.0
        )
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"\nResponse Body:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 200:
            print("\n✅ SUCCESS! Authentication working correctly.")
            return True
        else:
            print(f"\n❌ FAILED! Status code: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    print("Delta Exchange API Authentication Test")
    print("=" * 60)
    
    # Get credentials from user
    if len(sys.argv) >= 3:
        api_key = sys.argv[1]
        api_secret = sys.argv[2]
        base_url = sys.argv[3] if len(sys.argv) > 3 else "https://api.india.delta.exchange"
    else:
        print("\nUsage: python test_delta_auth.py <api_key> <api_secret> [base_url]")
        print("\nExample:")
        print("  python test_delta_auth.py YOUR_KEY YOUR_SECRET")
        print("  python test_delta_auth.py YOUR_KEY YOUR_SECRET https://cdn-ind.testnet.deltaex.org")
        sys.exit(1)
    
    success = test_delta_auth(api_key, api_secret, base_url)
    sys.exit(0 if success else 1)
