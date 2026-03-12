"""
Example 2: Multipart upload for large files
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from shelby import ShelbyClient, ShelbyConfig

ACCOUNT = os.environ.get("SHELBY_ACCOUNT", "0xYourAptosAccountAddress")
API_KEY = os.environ.get("SHELBY_API_KEY")

client = ShelbyClient(ShelbyConfig(api_key=API_KEY))

size_mb = 8
data = os.urandom(size_mb * 1024 * 1024)
blob_name = f"examples/synthetic_{size_mb}mb.bin"

print(f"Uploading {size_mb} MB synthetic blob via multipart...")
info = client.upload_multipart(
    account=ACCOUNT,
    blob_name=blob_name,
    data=data,
    part_size=1024 * 1024,
    verbose=True,
)
print(f"\n? Multipart upload complete.")
print(f"  Upload ID: {info.upload_id}")
print(f"  Blob URL : {info.url}")
