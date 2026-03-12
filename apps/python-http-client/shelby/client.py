"""
Shelby Protocol - Python HTTP Client
A lightweight Python client for the Shelby decentralized hot storage network.

Shelby API base: https://api.shelbynet.shelby.xyz/shelby
Docs: https://docs.shelby.xyz
"""

import math
import os
from dataclasses import dataclass
from typing import Optional

import requests

SHELBYNET_BASE_URL = "https://api.shelbynet.shelby.xyz/shelby"
DEFAULT_PART_SIZE = 1_048_576  # 1 MB (Shelby default)


@dataclass
class ShelbyConfig:
    """Configuration for the Shelby client."""
    base_url: str = SHELBYNET_BASE_URL
    api_key: Optional[str] = None
    timeout: int = 60

    @property
    def headers(self) -> dict:
        h = {}
        if self.api_key:
            h["Authorization"] = f"Bearer {self.api_key}"
        return h


@dataclass
class BlobInfo:
    """Metadata returned after a successful upload."""
    account: str
    blob_name: str
    size: int
    upload_id: Optional[str] = None

    @property
    def url(self) -> str:
        return f"{SHELBYNET_BASE_URL}/v1/blobs/{self.account}/{self.blob_name}"


class ShelbyError(Exception):
    """Raised when a Shelby API call fails."""
    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code


class ShelbyClient:
    """
    Python HTTP client for the Shelby Protocol RPC API.

    Example:
        client = ShelbyClient(ShelbyConfig(api_key="aptoslabs_..."))
        info = client.upload("0xYourAccount", "data/hello.txt", b"Hello, Shelby!")
        data = client.download("0xYourAccount", "data/hello.txt")
    """

    def __init__(self, config: Optional[ShelbyConfig] = None):
        self.config = config or ShelbyConfig(
            api_key=os.environ.get("SHELBY_API_KEY")
        )
        self.session = requests.Session()
        self.session.headers.update(self.config.headers)

    def upload(self, account: str, blob_name: str, data: bytes) -> BlobInfo:
        """Upload a blob in a single PUT request. Suitable for files under 5 MB."""
        url = f"{self.config.base_url}/v1/blobs/{account}/{blob_name}"
        headers = {"Content-Length": str(len(data))}
        resp = self.session.put(url, data=data, headers=headers, timeout=self.config.timeout)
        if resp.status_code not in (200, 204):
            raise ShelbyError(f"Upload failed: {resp.status_code} {resp.text}", status_code=resp.status_code)
        return BlobInfo(account=account, blob_name=blob_name, size=len(data))

    def upload_multipart(self, account: str, blob_name: str, data: bytes, part_size: int = DEFAULT_PART_SIZE, verbose: bool = False) -> BlobInfo:
        """Upload a large blob using multipart upload. Auto-chunks the data."""
        upload_id = self._start_multipart(account, blob_name, part_size)
        if verbose:
            print(f"[shelby] Started multipart upload: {upload_id}")
        total_parts = math.ceil(len(data) / part_size)
        for idx in range(total_parts):
            chunk = data[idx * part_size: (idx + 1) * part_size]
            self._upload_part(upload_id, idx, chunk)
            if verbose:
                print(f"[shelby] Uploaded part {idx + 1}/{total_parts} ({len(chunk)} bytes)")
        self._complete_multipart(upload_id)
        if verbose:
            print(f"[shelby] Multipart upload complete: {blob_name}")
        return BlobInfo(account=account, blob_name=blob_name, size=len(data), upload_id=upload_id)

    def _start_multipart(self, account: str, blob_name: str, part_size: int) -> str:
        url = f"{self.config.base_url}/v1/multipart-uploads"
        payload = {"rawAccount": account, "rawBlobName": blob_name, "rawPartSize": part_size}
        resp = self.session.post(url, json=payload, timeout=self.config.timeout)
        if resp.status_code != 200:
            raise ShelbyError(f"Failed to start multipart upload: {resp.status_code} {resp.text}", status_code=resp.status_code)
        return resp.json()["uploadId"]

    def _upload_part(self, upload_id: str, part_idx: int, chunk: bytes) -> None:
        url = f"{self.config.base_url}/v1/multipart-uploads/{upload_id}/parts/{part_idx}"
        resp = self.session.put(url, data=chunk, timeout=self.config.timeout)
        if resp.status_code != 200:
            raise ShelbyError(f"Failed to upload part {part_idx}: {resp.status_code} {resp.text}", status_code=resp.status_code)

    def _complete_multipart(self, upload_id: str) -> None:
        url = f"{self.config.base_url}/v1/multipart-uploads/{upload_id}/complete"
        resp = self.session.post(url, timeout=self.config.timeout)
        if resp.status_code != 200:
            raise ShelbyError(f"Failed to complete multipart upload: {resp.status_code} {resp.text}", status_code=resp.status_code)

    def upload_file(self, account: str, blob_name: str, file_path: str, multipart_threshold: int = 5 * 1024 * 1024, verbose: bool = False) -> BlobInfo:
        """Upload a local file. Auto-selects simple vs multipart based on size."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        with open(file_path, "rb") as f:
            data = f.read()
        if verbose:
            print(f"[shelby] Uploading {file_path} ({len(data):,} bytes) -> {blob_name}")
        if len(data) > multipart_threshold:
            return self.upload_multipart(account, blob_name, data, verbose=verbose)
        return self.upload(account, blob_name, data)

    def download(self, account: str, blob_name: str, byte_range: Optional[tuple] = None) -> bytes:
        """Download a blob. Optionally specify a (start, end) byte range."""
        url = f"{self.config.base_url}/v1/blobs/{account}/{blob_name}"
        headers = {}
        if byte_range is not None:
            headers["Range"] = f"bytes={byte_range[0]}-{byte_range[1]}"
        resp = self.session.get(url, headers=headers, timeout=self.config.timeout)
        if resp.status_code not in (200, 206):
            raise ShelbyError(f"Download failed: {resp.status_code} {resp.text}", status_code=resp.status_code)
        return resp.content

    def download_to_file(self, account: str, blob_name: str, output_path: str, byte_range: Optional[tuple] = None) -> int:
        """Download a blob and save to a local file. Returns bytes written."""
        data = self.download(account, blob_name, byte_range=byte_range)
        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(data)
        return len(data)

    def use_session(self, session_id: str) -> bool:
        """Consume one chunkset from a micropayment session."""
        url = f"{self.config.base_url}/v1/sessions/{session_id}/use"
        resp = self.session.post(url, timeout=self.config.timeout)
        if resp.status_code == 200:
            return True
        elif resp.status_code == 402:
            raise ShelbyError("Session exhausted or insufficient balance.", status_code=402)
        elif resp.status_code == 404:
            raise ShelbyError(f"Session not found: {session_id}", status_code=404)
        raise ShelbyError(f"use_session failed: {resp.status_code} {resp.text}", status_code=resp.status_code)
