# Shelby Python HTTP Client

A lightweight Python client for the [Shelby Protocol](https://shelby.xyz) decentralized hot storage network. Built entirely on the [Shelby RPC HTTP API](https://docs.shelby.xyz/apis/rpc/shelbynet) — no extra dependencies beyond `requests`.

## Features

| Feature | Description |
|---|---|
| Simple upload | Single `PUT` for files under 5 MB |
| Multipart upload | Chunked upload for large files (auto-splits into 1 MB parts) |
| Auto-detection | `upload_file()` picks simple vs multipart automatically |
| Byte-range download | Read arbitrary slices — ideal for AI pipelines and streaming |
| Session support | Decrement micropayment channel sessions |

## Installation
```bash
pip install requests
```

## Quick Start
```python
from shelby import ShelbyClient, ShelbyConfig

client = ShelbyClient(ShelbyConfig(api_key="aptoslabs_..."))

# Upload
info = client.upload("0xYourAccount", "data/hello.txt", b"Hello, Shelby!")
print(info.url)

# Download
data = client.download("0xYourAccount", "data/hello.txt")
print(data.decode())
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SHELBY_ACCOUNT` | Yes | Your Aptos account address |
| `SHELBY_API_KEY` | Recommended | Avoids rate limits |

## Examples
```bash
# Basic upload and download
python examples/01_basic_upload_download.py

# Multipart upload (8 MB synthetic blob)
python examples/02_multipart_upload.py

# Byte-range download
python examples/03_byte_range_download.py
```

## API Reference

| Method | Description |
|---|---|
| `upload(account, blob_name, data)` | Upload bytes in a single PUT |
| `upload_multipart(account, blob_name, data, part_size, verbose)` | Chunked multipart upload |
| `upload_file(account, blob_name, file_path, verbose)` | Upload from file path |
| `download(account, blob_name, byte_range?)` | Download blob, returns `bytes` |
| `download_to_file(account, blob_name, output_path)` | Download and save to disk |
| `use_session(session_id)` | Consume a micropayment session chunkset |

## Related

- [Shelby TypeScript SDK](https://docs.shelby.xyz/sdks/typescript)
- [shelby-quickstart](https://github.com/shelby/shelby-quickstart)
- [Shelby Docs](https://docs.shelby.xyz)
