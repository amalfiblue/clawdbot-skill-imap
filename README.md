# 📧 Clawdbot IMAP Skill

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0-brightgreen)](https://nodejs.org/)
[![npm version](https://img.shields.io/badge/npm-v0.1.0-blue)](https://www.npmjs.com/package/clawdbot-skill-imap)

A Clawdbot skill for reading, searching, and sending email via IMAP/SMTP that works with any standard mail server including Proton Mail Bridge.

## ✨ Features

- 📂 **Folder listing** — Browse your mailbox structure
- 🔍 **Email search** — Find emails by sender, subject, date, and content
- 📖 **Read emails** — View email content and headers
- 📤 **Send emails** — Compose and send messages via SMTP
- 🔧 **JSON output** — Machine-readable format for automation
- 🔒 **Proton Mail Bridge support** — Works seamlessly with encrypted Proton Mail
- 🌐 **Universal IMAP** — Compatible with Gmail, Outlook, Yahoo, and any IMAP server

## 🚀 Quick Start

1. **Install the skill:**
   ```bash
   git clone https://github.com/amalfiblue/clawdbot-skill-imap.git
   cd clawdbot-skill-imap
   npm install
   ```

2. **Configure your credentials:**
   ```bash
   export IMAP_USER=your@email.com
   export IMAP_PASS=your_password
   export IMAP_HOST=imap.gmail.com
   export IMAP_PORT=993
   ```

3. **Test the connection:**
   ```bash
   node scripts/imapcli.mjs folders
   ```

## 📖 Commands Reference

### List Folders
```bash
# Show all mailbox folders
node scripts/imapcli.mjs folders
node scripts/imapcli.mjs folders --json
```

### Recent Emails
```bash
# List 10 most recent emails from INBOX
node scripts/imapcli.mjs recent

# List 20 emails from specific folder
node scripts/imapcli.mjs recent --limit 20 --folder "Sent"

# JSON output for automation
node scripts/imapcli.mjs recent --json
```

### Search Emails
```bash
# Search by text content
node scripts/imapcli.mjs search "meeting"

# Search by sender
node scripts/imapcli.mjs search --from "john@example.com"

# Search by subject and date
node scripts/imapcli.mjs search --subject "invoice" --after "2024-01-01"

# Complex search with multiple criteria
node scripts/imapcli.mjs search --before "2024-12-31" --folder "Archive"
```

### Read Email
```bash
# Read email by ID
node scripts/imapcli.mjs read 12345
```

### Send Email
```bash
# Simple email
node scripts/imapcli.mjs send --to "user@example.com" --subject "Test" --body "Hello world"

# Email with body from file
node scripts/imapcli.mjs send --to "user@example.com" --subject "Report" --body-file ./report.txt
```

## ⚙️ Configuration

Configure via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `IMAP_HOST` | `127.0.0.1` | IMAP server hostname |
| `IMAP_PORT` | `1143` | IMAP server port |
| `IMAP_USER` | *required* | Email username/address |
| `IMAP_PASS` | *required* | Email password or app password |
| `SMTP_HOST` | `127.0.0.1` | SMTP server hostname |
| `SMTP_PORT` | `1025` | SMTP server port |
| `SMTP_USER` | `$IMAP_USER` | SMTP username (defaults to IMAP user) |
| `SMTP_PASS` | `$IMAP_PASS` | SMTP password (defaults to IMAP pass) |

## 🔒 Proton Mail Bridge Setup

Proton Mail users need to use [Proton Mail Bridge](https://proton.me/mail/bridge) for IMAP/SMTP access:

1. **Install and start Proton Mail Bridge**
2. **Configure the skill for Bridge:**
   ```bash
   export IMAP_HOST=127.0.0.1
   export IMAP_PORT=1143
   export IMAP_USER=your@protonmail.com
   export IMAP_PASS=your_bridge_password
   export SMTP_HOST=127.0.0.1
   export SMTP_PORT=1025
   ```

3. **Test connection:**
   ```bash
   node scripts/imapcli.mjs recent
   ```

**Note:** Bridge runs locally and uses self-signed certificates. TLS verification is automatically disabled for localhost connections.

## 🤖 Clawdbot Integration

This skill integrates seamlessly with Clawdbot. See `SKILL.md` for the skill definition.

### Environment Setup
Configure your Clawdbot environment with your email credentials:
```bash
# In your Clawdbot .env file
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your@gmail.com
IMAP_PASS=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### Usage in Clawdbot
Once installed, Clawdbot can automatically use this skill when you ask about email:
- "Check my recent emails"
- "Search for emails from john@company.com"
- "Send an email to my team about the meeting"

## 🤝 Contributing

We welcome contributions! This is the first email skill on ClawdHub, and we're excited to make it even better.

- 🐛 **Found a bug?** Open an issue
- 💡 **Have an idea?** Start a discussion
- 🔧 **Want to contribute?** Submit a pull request

Please check existing issues and PRs before creating new ones.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

**Created by [Amalfiblue](https://github.com/amalfiblue)**

---

*The first email skill for Clawdbot! 🎉*