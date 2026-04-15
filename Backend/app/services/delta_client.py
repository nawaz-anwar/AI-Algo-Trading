import hashlib
import hmac
import time
import httpx
import json
import os
from typing import Optional

class DeltaClient:
    def __init__(self, api_key: str, api_secret: str):
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = os.getenv('DELTA_BASE_URL', 'https://cdn-ind.testnet.deltaex.org')

    def _sign(self, method: str, path: str, query: str = '', payload: str = ''):
        timestamp = str(int(time.time()))
        message = method + timestamp + path + query + payload
        signature = hmac.new(
            self.api_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        return timestamp, signature

    def _headers(self, method: str, path: str, query: str = '', payload: str = ''):
        ts, sig = self._sign(method, path, query, payload)
        return {
            'api-key': self.api_key,
            'timestamp': ts,
            'signature': sig,
            'Content-Type': 'application/json',
            'User-Agent': 'CryptoAlgoBot/2.0'
        }

    def get(self, path: str, params: Optional[dict] = None):
        qs = ('?' + '&'.join(f'{k}={v}' for k, v in params.items())) if params else ''
        r = httpx.get(
            self.base_url + path + qs,
            headers=self._headers('GET', path, qs),
            timeout=30.0
        )
        r.raise_for_status()
        return r.json()

    def post(self, path: str, body: dict):
        payload = json.dumps(body)
        r = httpx.post(
            self.base_url + path,
            content=payload,
            headers=self._headers('POST', path, '', payload),
            timeout=30.0
        )
        r.raise_for_status()
        return r.json()

    def delete(self, path: str, body: dict):
        payload = json.dumps(body)
        r = httpx.request(
            'DELETE',
            self.base_url + path,
            content=payload,
            headers=self._headers('DELETE', path, '', payload),
            timeout=30.0
        )
        r.raise_for_status()
        return r.json()
