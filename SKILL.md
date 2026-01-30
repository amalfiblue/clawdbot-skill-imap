---
name: imap
description: Read, search, and send email via IMAP/SMTP. Use when you need to check email from non-Gmail accounts (Proton Mail, Outlook via IMAP, any standard mail server). Supports Proton Mail Bridge on localhost.
---

# IMAP Email Skill

A CLI tool for reading, searching, and sending email via IMAP/SMTP. Designed to work with Proton Mail Bridge and any standard IMAP server.

## Usage

The skill provides the `imapcli` command with the following operations:

```bash
# List mailbox folders
node scripts/imapcli.mjs folders

# List recent emails (default: 10 from INBOX)
node scripts/imapcli.mjs recent
node scripts/imapcli.mjs recent --limit 20 --folder "Sent"

# Search emails
node scripts/imapcli.mjs search "meeting"
node scripts/imapcli.mjs search --from "john@example.com"
node scripts/imapcli.mjs search --subject "invoice" --after "2024-01-01"
node scripts/imapcli.mjs search --before "2024-12-31" --folder "Archive"

# Read specific email
node scripts/imapcli.mjs read 12345

# Send email
node scripts/imapcli.mjs send --to "user@example.com" --subject "Test" --body "Hello world"
node scripts/imapcli.mjs send --to "user@example.com" --subject "Report" --body-file ./report.txt

# Output as JSON for machine parsing
node scripts/imapcli.mjs folders --json
node scripts/imapcli.mjs recent --json
```

## Configuration

Configure via environment variables or CLI flags:

### IMAP Settings
- `IMAP_HOST` (default: 127.0.0.1)
- `IMAP_PORT` (default: 1143)
- `IMAP_USER`
- `IMAP_PASS`

### SMTP Settings  
- `SMTP_HOST` (default: 127.0.0.1)
- `SMTP_PORT` (default: 1025)
- `SMTP_USER` (defaults to IMAP_USER)
- `SMTP_PASS` (defaults to IMAP_PASS)

## Proton Mail Bridge

For Proton Mail via Bridge (localhost only):
- IMAP: 127.0.0.1:1143
- SMTP: 127.0.0.1:1025
- Uses self-signed certificates (TLS verification disabled)
- Requires Proton Bridge running locally

## Examples

Check recent emails:
```bash
IMAP_USER=your@protonmail.com IMAP_PASS=your_bridge_password node scripts/imapcli.mjs recent
```

Search for emails from a specific sender:
```bash
IMAP_USER=your@protonmail.com IMAP_PASS=your_bridge_password node scripts/imapcli.mjs search --from "important@company.com"
```

Send an email:
```bash
SMTP_USER=your@protonmail.com SMTP_PASS=your_bridge_password node scripts/imapcli.mjs send --to "friend@gmail.com" --subject "Hello" --body "How are you?"
```