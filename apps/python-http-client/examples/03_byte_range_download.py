"""
Example 3: Byte-range download (partial reads)
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from shelby import ShelbyClient, ShelbyConfig

ACCOUNT = os.environ.get("SHELBY_ACCOUNT", "0xYourAptosAccountAddress")
API_KEY = os.environ.get("SHELBY_API_KEY")

client = ShelbyClient(ShelbyConfig(api_key=API_KEY))

blob_name = "examples/structured_data.txt"
records = [f"record_{i:04d}: value={i * 3.14159:.4f}\n" for i in range(100)]
content = "".join(records).encode()

print(f"Uploading {len(content):,} bytes...")
client.upload(ACCOUNT, blob_name, content)

print("Downloading first 256 bytes...")
first_chunk = client.download(ACCOUNT, blob_name, byte_range=(0, 255))
print(f"  {first_chunk.decode()[:80]}...")

print("Downloading bytes 512-1023...")
middle_chunk = client.download(ACCOUNT, blob_name, byte_range=(512, 1023))
print(f"  {middle_chunk.decode()[:80]}...")

full = client.download(ACCOUNT, blob_name)
assert full[0:256] == first_chunk
assert full[512:1024] == middle_chunk
print("\n? Byte-range reads verified.")
