SSN encryption configuration

Set a 32-byte AES key in your environment for encrypting borrower SSNs.

Environment variable:
- BORROWER_SSN_ENC_KEY

Accepted formats:
- 32-byte UTF-8 string (length 32)
- 64-character hex string (32 bytes)
- Base64-encoded 32 bytes

Examples:
- Hex: BORROWER_SSN_ENC_KEY=7b6a3d8b2c4f5a6e1d0c9b8a7e6d5c4b3a29181716151413f2e1d0c9b8a7e6d
- Base64 (32 bytes): BORROWER_SSN_ENC_KEY=9j8x0u2w4y6A8C+E/GkMnQ2t5w7z9BDEFGHIJKLMNOQ=

Rotation:
- Deploy the new value, restart the API. Old records remain decryptable as long as the key is unchanged. For rotation with multiple keys, extend src/lib/crypto.ts to try old keys.

Local setup:
- Add to .env.local and restart dev server.


