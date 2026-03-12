"""
Example 1: Basic upload and download
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from shelby import ShelbyClient, ShelbyConfig

ACCOUNT = os.environ.get("SHELBY_ACCOUNT", "0xYourAptosAccountAddress")
API_KEY = os.environ.get("SHELBY_API_KEY")

client = ShelbyClient(ShelbyConfig(api_key=API_KEY))

blob_name = "examples/hello.txt"
content = b"Hello from Python! Shelby decentralized hot storage is live."

print(f"Uploading '{blob_name}' ({len(content)} bytes)...")
info = client.upload(ACCOUNT, blob_name, content)
print(f"  Upload successful!")
print(f"  URL: {info.url}")

print(f"\nDownloading '{blob_name}'...")
downloaded = client.download(ACCOUNT, blob_name)
print(f"  Content: {downloaded.decode()}")

assert downloaded == content
print("\n? Upload and download verified successfully.")
