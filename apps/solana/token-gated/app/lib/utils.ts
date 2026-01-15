// ============================================================================
// Full Blob Name Construction
// ============================================================================

/**
 * Construct the full blob name bytes used for ACE encryption.
 * Format: "0x" (2 bytes) + owner_aptos_addr (32 bytes) + "/" (1 byte) + blob_name
 */
export function buildFullBlobNameBytes(
  ownerAptosAddrBytes: Uint8Array,
  blobName: string
): Uint8Array {
  const prefix = new TextEncoder().encode("0x");
  const separator = new TextEncoder().encode("/");
  const nameBytes = new TextEncoder().encode(blobName);

  const result = new Uint8Array(
    prefix.length +
      ownerAptosAddrBytes.length +
      separator.length +
      nameBytes.length
  );
  result.set(prefix, 0);
  result.set(ownerAptosAddrBytes, prefix.length);
  result.set(separator, prefix.length + ownerAptosAddrBytes.length);
  result.set(
    nameBytes,
    prefix.length + ownerAptosAddrBytes.length + separator.length
  );

  return result;
}

// ============================================================================
// File Download
// ============================================================================

/**
 * Trigger a file download in the browser.
 */
export function downloadFile(
  data: Uint8Array,
  filename: string,
  mimeType = "application/octet-stream"
): void {
  const blob = new Blob([data as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
