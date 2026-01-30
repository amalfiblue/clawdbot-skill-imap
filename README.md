# Clawdbot IMAP Skill

A CLI tool for reading, searching, and sending email via IMAP/SMTP. Designed to work with Proton Mail Bridge and any standard IMAP server.

## Installation

Install globally via npm:

```bash
npm install -g clawdbot-skill-imap
```

Or run locally:

```bash
git clone https://github.com/clawdbot/imap-skill.git
cd imap-skill
npm install
```

## Usage

The skill provides the `imapcli` command:

```bash
# List mailbox folders
imapcli folders

# List recent emails (default: 10 from INBOX)
imapcli recent
imapcli recent --limit 20 --folder "Sent"

# Search emails
imapcli search "meeting"
imapcli search --from "john@example.com"
imapcli search --subject "invoice" --after "2024-01-01"

# Read specific email
imapcli read 12345

# Send email
imapcli send --to "user@example.com" --subject "Test" --body "Hello world"

# Output as JSON for machine parsing
imapcli folders --json
imapcli recent --json
```

## Configuration

Configure via environment variables:

### IMAP Settings
- `IMAP_HOST` (default: 127.0.0.1)
- `IMAP_PORT` (default: 1143)
- `IMAP_USER` (required)
- `IMAP_PASS` (required)

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

## Example

```bash
IMAP_USER=your@protonmail.com IMAP_PASS=your_bridge_password imapcli recent
```

## License

MIT