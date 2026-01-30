#!/usr/bin/env node

import { Command } from 'commander';
import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import { format } from 'util';

const program = new Command();

// Configuration with defaults
const CONFIG = {
  IMAP_HOST: process.env.IMAP_HOST || '127.0.0.1',
  IMAP_PORT: parseInt(process.env.IMAP_PORT || '1143'),
  IMAP_USER: process.env.IMAP_USER,
  IMAP_PASS: process.env.IMAP_PASS,
  SMTP_HOST: process.env.SMTP_HOST || '127.0.0.1',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '1025'),
  SMTP_USER: process.env.SMTP_USER || process.env.IMAP_USER,
  SMTP_PASS: process.env.SMTP_PASS || process.env.IMAP_PASS,
};

// Utility functions
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatOutput(data, jsonFlag) {
  if (jsonFlag) {
    return JSON.stringify(data, null, 2);
  }
  return data;
}

function parseDate(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date)) {
    throw new Error(`Invalid date format: ${dateStr}. Use YYYY-MM-DD format.`);
  }
  return date;
}

// IMAP Connection helper
async function createImapClient() {
  if (!CONFIG.IMAP_USER || !CONFIG.IMAP_PASS) {
    throw new Error('IMAP credentials not provided. Set IMAP_USER and IMAP_PASS environment variables.');
  }

  const client = new ImapFlow({
    host: CONFIG.IMAP_HOST,
    port: CONFIG.IMAP_PORT,
    secure: false, // Use STARTTLS
    auth: {
      user: CONFIG.IMAP_USER,
      pass: CONFIG.IMAP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // For Proton Bridge self-signed certs
    },
    logger: false, // Suppress verbose debug logging
  });

  await client.connect();
  return client;
}

// SMTP Connection helper
async function createSmtpClient() {
  if (!CONFIG.SMTP_USER || !CONFIG.SMTP_PASS) {
    throw new Error('SMTP credentials not provided. Set SMTP_USER and SMTP_PASS environment variables.');
  }

  const transporter = nodemailer.createTransporter({
    host: CONFIG.SMTP_HOST,
    port: CONFIG.SMTP_PORT,
    secure: false, // Use STARTTLS
    auth: {
      user: CONFIG.SMTP_USER,
      pass: CONFIG.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // For Proton Bridge self-signed certs
    },
  });

  return transporter;
}

// Commands

// List folders
program
  .command('folders')
  .description('List all mailbox folders')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const client = await createImapClient();
      
      // Use the correct ImapFlow list method
      const folders = await client.list();
      
      await client.logout();
      
      if (options.json) {
        console.log(JSON.stringify(folders, null, 2));
      } else {
        console.log('Available Folders:');
        folders.forEach(folder => {
          let specialFlag = '';
          if (folder.specialUse) {
            if (Array.isArray(folder.specialUse)) {
              specialFlag = ` (${folder.specialUse.join(', ')})`;
            } else {
              specialFlag = ` (${folder.specialUse})`;
            }
          }
          console.log(`  ${folder.path}${specialFlag}`);
        });
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

// Recent emails
program
  .command('recent')
  .description('List recent emails')
  .option('--limit <number>', 'Number of emails to fetch', '10')
  .option('--folder <name>', 'Folder to search in', 'INBOX')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const client = await createImapClient();
      const limit = parseInt(options.limit);
      
      // Get mailbox lock for ImapFlow
      const lock = await client.getMailboxLock(options.folder);
      
      const messages = client.fetch('1:*', { 
        uid: true,
        envelope: true,
        bodyStructure: true,
        flags: true,
        internalDate: true,
      }, {
        uid: true
      });
      
      const emails = [];
      for await (const message of messages) {
        emails.push({
          uid: message.uid,
          subject: message.envelope.subject || '(no subject)',
          from: message.envelope.from?.[0] ? 
            `${message.envelope.from[0].name || ''} <${message.envelope.from[0].address}>`.trim() :
            '(unknown sender)',
          date: message.envelope.date || message.internalDate,
          flags: message.flags,
          size: message.size || 0,
        });
      }
      
      // Sort by date (newest first) and limit
      emails.sort((a, b) => new Date(b.date) - new Date(a.date));
      const recentEmails = emails.slice(0, limit);
      
      // Release the lock
      lock.release();
      
      await client.logout();
      
      if (options.json) {
        console.log(JSON.stringify(recentEmails, null, 2));
      } else {
        console.log(`Recent ${limit} emails from ${options.folder}:`);
        recentEmails.forEach((email, i) => {
          const date = new Date(email.date).toLocaleDateString();
          const unread = (Array.isArray(email.flags) && email.flags.includes('\\Seen')) ? '' : '[UNREAD] ';
          console.log(`${i + 1}. ${unread}UID:${email.uid} - ${email.subject}`);
          console.log(`   From: ${email.from}`);
          console.log(`   Date: ${date}`);
          console.log('');
        });
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

// Search emails
program
  .command('search')
  .argument('[query]', 'Search query (searches subject and body)')
  .description('Search emails with various filters')
  .option('--from <email>', 'Filter by sender email')
  .option('--subject <text>', 'Filter by subject')
  .option('--after <date>', 'Filter emails after date (YYYY-MM-DD)')
  .option('--before <date>', 'Filter emails before date (YYYY-MM-DD)')
  .option('--folder <name>', 'Folder to search in', 'INBOX')
  .option('--limit <number>', 'Maximum number of results', '50')
  .option('--json', 'Output as JSON')
  .action(async (query, options) => {
    try {
      const client = await createImapClient();
      const limit = parseInt(options.limit);
      
      // Get mailbox lock for ImapFlow
      const lock = await client.getMailboxLock(options.folder);
      
      // Build search criteria
      const searchCriteria = [];
      
      if (query) {
        searchCriteria.push({ or: [
          { subject: query },
          { body: query }
        ]});
      }
      
      if (options.from) {
        searchCriteria.push({ from: options.from });
      }
      
      if (options.subject) {
        searchCriteria.push({ subject: options.subject });
      }
      
      if (options.after) {
        const afterDate = parseDate(options.after);
        searchCriteria.push({ since: afterDate });
      }
      
      if (options.before) {
        const beforeDate = parseDate(options.before);
        searchCriteria.push({ before: beforeDate });
      }
      
      // If no criteria provided, search for all messages
      const finalCriteria = searchCriteria.length > 0 ? { and: searchCriteria } : { all: true };
      
      const searchResults = await client.search(finalCriteria);
        
        if (searchResults.length === 0) {
          lock.release();
          await client.logout();
          if (options.json) {
            console.log('[]');
          } else {
            console.log('No emails found matching the search criteria.');
          }
          return;
        }
        
        // Fetch details for found messages (limited)
        const uidsToFetch = searchResults.slice(0, limit);
        const messages = client.fetch(uidsToFetch, { 
          uid: true,
          envelope: true,
          flags: true,
          internalDate: true,
        }, {
          uid: true
        });
        
        const emails = [];
        for await (const message of messages) {
          emails.push({
            uid: message.uid,
            subject: message.envelope.subject || '(no subject)',
            from: message.envelope.from?.[0] ? 
              `${message.envelope.from[0].name || ''} <${message.envelope.from[0].address}>`.trim() :
              '(unknown sender)',
            date: message.envelope.date || message.internalDate,
            flags: message.flags,
          });
        }
        
        // Sort by date (newest first)
        emails.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Release the lock
        lock.release();
        
        await client.logout();
      
      if (options.json) {
        console.log(JSON.stringify(emails, null, 2));
      } else {
        console.log(`Found ${searchResults.length} emails (showing first ${emails.length}):`);
        emails.forEach((email, i) => {
          const date = new Date(email.date).toLocaleDateString();
          const unread = (Array.isArray(email.flags) && email.flags.includes('\\Seen')) ? '' : '[UNREAD] ';
          console.log(`${i + 1}. ${unread}UID:${email.uid} - ${email.subject}`);
          console.log(`   From: ${email.from}`);
          console.log(`   Date: ${date}`);
          console.log('');
        });
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

// Read specific email
program
  .command('read')
  .argument('<uid>', 'Email UID to read')
  .description('Read a specific email by UID')
  .option('--folder <name>', 'Folder containing the email', 'INBOX')
  .option('--json', 'Output as JSON')
  .action(async (uid, options) => {
    try {
      const client = await createImapClient();
      const messageUid = parseInt(uid);
      
      // Get mailbox lock for ImapFlow
      const lock = await client.getMailboxLock(options.folder);
      
      let email = null;
      
      // Fetch the message
      const messages = client.fetch(messageUid, {
        uid: true,
        envelope: true,
        bodyStructure: true,
        flags: true,
        internalDate: true,
      }, {
        uid: true
      });
      
      for await (const message of messages) {
        // Simple body extraction - try to get text/plain part
        let textBody = '(Body content not available)';
        
        try {
          // Try to download the first text part
          const textPart = client.download(messageUid, '1.TEXT', { uid: true });
          let textContent = '';
          for await (const chunk of textPart) {
            textContent += chunk;
          }
          textBody = textContent.trim() || '(Empty body)';
        } catch (e) {
          try {
            // Fallback: try part 1
            const textPart = client.download(messageUid, '1', { uid: true });
            let textContent = '';
            for await (const chunk of textPart) {
              textContent += chunk;
            }
            textBody = textContent.trim() || '(Empty body)';
          } catch (e2) {
            textBody = '(Body extraction failed - complex content structure)';
          }
        }
        
        email = {
          uid: message.uid,
          subject: message.envelope.subject || '(no subject)',
          from: message.envelope.from?.[0] ? 
            `${message.envelope.from[0].name || ''} <${message.envelope.from[0].address}>`.trim() :
            '(unknown sender)',
          to: message.envelope.to?.map(addr => 
            `${addr.name || ''} <${addr.address}>`.trim()
          ) || [],
          cc: message.envelope.cc?.map(addr => 
            `${addr.name || ''} <${addr.address}>`.trim()
          ) || [],
          date: message.envelope.date || message.internalDate,
          flags: message.flags,
          messageId: message.envelope.messageId,
          body: textBody,
        };
        break; // Only process first (should be only) message
      }
      
      // Release the lock
      lock.release();
      
      await client.logout();
      
      if (!email) {
        throw new Error(`Email with UID ${uid} not found in folder ${options.folder}`);
      }
      
      if (options.json) {
        console.log(JSON.stringify(email, null, 2));
      } else {
        console.log('='.repeat(60));
        console.log(`Subject: ${email.subject}`);
        console.log(`From: ${email.from}`);
        console.log(`To: ${email.to.join(', ')}`);
        if (email.cc.length > 0) {
          console.log(`CC: ${email.cc.join(', ')}`);
        }
        console.log(`Date: ${new Date(email.date).toLocaleString()}`);
        console.log(`UID: ${email.uid}`);
        console.log(`Flags: ${Array.isArray(email.flags) ? email.flags.join(', ') : email.flags || 'None'}`);
        console.log('='.repeat(60));
        console.log();
        console.log(email.body);
        console.log();
        console.log('='.repeat(60));
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

// Send email
program
  .command('send')
  .description('Send an email via SMTP')
  .requiredOption('--to <email>', 'Recipient email address')
  .requiredOption('--subject <text>', 'Email subject')
  .option('--body <text>', 'Email body text')
  .option('--body-file <path>', 'Read body from file')
  .option('--cc <emails>', 'CC recipients (comma-separated)')
  .option('--bcc <emails>', 'BCC recipients (comma-separated)')
  .action(async (options) => {
    try {
      let bodyText = options.body || '';
      
      if (options.bodyFile) {
        try {
          bodyText = await fs.readFile(options.bodyFile, 'utf-8');
        } catch (error) {
          throw new Error(`Failed to read body file: ${error.message}`);
        }
      }
      
      if (!bodyText) {
        throw new Error('Email body is required. Use --body or --body-file option.');
      }
      
      const transporter = await createSmtpClient();
      
      const mailOptions = {
        from: CONFIG.SMTP_USER,
        to: options.to,
        subject: options.subject,
        text: bodyText,
      };
      
      if (options.cc) {
        mailOptions.cc = options.cc;
      }
      
      if (options.bcc) {
        mailOptions.bcc = options.bcc;
      }
      
      const info = await transporter.sendMail(mailOptions);
      
      console.log('Email sent successfully!');
      console.log(`Message ID: ${info.messageId}`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      
    } catch (error) {
      console.error('Error sending email:', error.message);
      process.exit(1);
    }
  });

// Global error handling
program.configureOutput({
  writeErr: (str) => process.stderr.write(str)
});

program
  .name('imapcli')
  .description('IMAP/SMTP CLI tool for reading and sending email')
  .version('1.0.0');

program.parse();