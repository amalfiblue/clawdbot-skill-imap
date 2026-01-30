# IMAP Implementation Notes

## Proton Mail Bridge Specifics

### TLS Configuration
Proton Bridge uses self-signed certificates, so we need to disable TLS verification:
```javascript
tls: { rejectUnauthorized: false }
```

### Default Ports
- IMAP: 1143 (STARTTLS)
- SMTP: 1025 (STARTTLS)

### Authentication
Uses standard username/password auth. The bridge password is generated in the Proton Bridge app, not your account password.

## IMAP Quirks & Considerations

### UIDs vs Sequence Numbers
- Always use UIDs for message identification (more stable)
- Sequence numbers can change when messages are deleted
- Our CLI uses UIDs exclusively

### Message Body Parsing
The current implementation uses a simple text extraction approach. For production use, consider:
- Using a proper MIME parser like `mailparser`
- Handling HTML emails better
- Supporting attachments

### Search Performance
- IMAP search is server-side, which is efficient
- Complex searches might be slower on some servers
- Date searches use IMAP's SINCE/BEFORE which are date-only (not datetime)

### Folder Names
- Folder names can vary between providers
- Some use "INBOX", others "Inbox"
- Special folders (Sent, Drafts, etc.) may have different names
- Use the `folders` command to see what's available

## Error Handling

### Connection Errors
- Check if Proton Bridge is running
- Verify credentials (Bridge app shows the password)
- Ensure no firewall blocking localhost connections

### TLS Errors
If you see TLS verification errors, the `rejectUnauthorized: false` setting should handle it.

### Authentication Errors
- Bridge password is NOT your Proton account password
- Check the Bridge app for the correct password
- Bridge may need to be restarted occasionally

## Performance Tips

### Large Mailboxes
- Use `--limit` to avoid fetching too many messages
- Consider implementing pagination for very large result sets
- The `recent` command sorts by date, which can be slow on large folders

### Search Optimization
- Be specific with search terms
- Use date ranges to narrow results
- Folder-specific searches are faster than searching all folders

## Extensions & Improvements

### Possible Enhancements
- HTML email rendering/extraction
- Attachment download support
- Message threading/conversation view
- Drafts support
- Message flagging/labeling
- Bulk operations (mark as read, move, delete)
- Watch/notification mode

### Security Considerations
- Credentials are passed via environment variables (secure)
- Consider adding keychain/credential store integration
- Audit logs for sent emails
- Rate limiting for bulk operations