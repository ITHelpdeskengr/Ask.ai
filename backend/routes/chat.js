const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Conversation = require('../models/Conversation');
const CalendarEvent = require('../models/CalendarEvent');
const Knowledge = require('../models/Knowledge');
const { SYSTEM_PROMPT } = require('../config/systemPrompt');
const authMiddleware = require('../middleware/authMiddleware');
const googleAuthService = require('../services/googleAuthService');
const googleCalendarService = require('../services/googleCalendarService');
const googleDriveService = require('../services/googleDriveService');

async function processAgentTask(conversation, messageId, message, attachment, history, reqHeaders, userId, userEmail, userName) {
  try {
    const knowledgeCount = await Knowledge.countDocuments();
    const knowledgeContext = `\n\n[USER IDENTITY]: You are currently helping ${userName || 'User'} (${userEmail}).\n\n[KNOWLEDGE RETRIEVAL HIERARCHY]:\n1. Use 'search_internal_knowledge' first. You have ${knowledgeCount} documents in KB.\n2. If results are found, you MUST use 'read_internal_document' for each relevant ID to understand the content.\n3. If not found in KB, check local workspace files and private Google Drive.\n4. If STILL not found, you MUST use 'search_the_web'. Never stop until you have checked the web.\n\n[TRANSPARENCY]: Always state your plan and steps clearly before acting.`;
    const messages = [
      { 
        role: 'system', 
        content: SYSTEM_PROMPT + knowledgeContext
      },
      ...history.slice(-15),
    ];

    if (attachment && attachment.mimeType?.startsWith('image/')) {
      const filePath = path.join(__dirname, '..', attachment.url);
      if (fs.existsSync(filePath)) {
        const base64Image = fs.readFileSync(filePath).toString('base64');
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: message || 'Analyze this image.' },
            { type: 'image_url', image_url: { url: `data:${attachment.mimeType};base64,${base64Image}` } }
          ]
        });
      } else {
        messages.push({ role: 'user', content: message || 'Sent an image (file not found)' });
      }
    } else if (attachment) {
      messages.push({ 
        role: 'user', 
        content: `[User attached a file: ${attachment.originalName}. System path: ${attachment.url}]\n\n${message || ''}` 
      });
    } else {
      messages.push({ role: 'user', content: message });
    }

    const tools = [
      {
        type: "function",
        function: {
          name: "read_safe_workspace_file",
          description: "Reads the text contents of a local file from the user's secure shared computer workspace. Use this to read files like documents, notes, memos if the user asks.",
          parameters: {
            type: "object",
            properties: {
              filename: { type: "string", description: "Name of the file, e.g. 'memos/intro.txt' or 'notes.docx'" }
            },
            required: ["filename"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "list_safe_workspace_files",
          description: "Lists all available files securely stored in the user's shared computer workspace. Use this to see what files exist before trying to read them.",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_internal_knowledge",
          description: "Searches the internal company/system knowledge base for relevant documents. Returns a list of matching document titles and their IDs.",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Keyword or phrase to search for in document titles and content" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "read_internal_document",
          description: "Reads the full content of a document from the internal knowledge base using its ID.",
          parameters: {
            type: "object",
            properties: {
              documentId: { type: "string", description: "The MongoDB _id of the document" }
            },
            required: ["documentId"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_google_drive",
          description: "Searches for relevant documents, notes, or files in the user's private Google Drive.",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "The search query" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "read_google_drive_file",
          description: "Reads the text content of a specific file from Google Drive. Always search for the file first to get its ID.",
          parameters: {
            type: "object",
            properties: {
              fileId: { type: "string", description: "The Google Drive File ID" },
              mimeType: { type: "string", description: "The MIME type of the file" }
            },
            required: ["fileId", "mimeType"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_the_web",
          description: "Searches the public internet for general knowledge, news, or facts. Use this as a fallback if information is not found in the user's private workspace or Drive.",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "The search query" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "send_email",
          description: "Sends an email to someone on behalf of the user. Can optionally send as a different user in the organization (impersonation) if authorized, and can attach a file from the workspace.",
          parameters: {
            type: "object",
            properties: {
              from: { type: "string", description: "Optional: The email address to send from (requires domain-wide delegation). Defaults to current user." },
              to: { type: "string", description: "The recipient email address" },
              subject: { type: "string", description: "Email subject" },
              body: { type: "string", description: "Email text body contents" },
              attachmentFilename: { type: "string", description: "Optional filename to grab from the workspace and attach" }
            },
            required: ["to", "subject", "body"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_calendar_event",
          description: "Creates a new calendar event / meeting / schedule for the user. Use this when the user asks to schedule, book, or create a meeting, appointment, event, or reminder. Always infer reasonable defaults — if no end time is given, assume 1 hour duration. If no date is given, assume today or the next appropriate day.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Title of the event, e.g. 'Team Standup' or 'Dentist Appointment'" },
              startTime: { type: "string", description: "ISO 8601 start time, e.g. '2026-04-07T14:00:00+08:00'" },
              endTime: { type: "string", description: "ISO 8601 end time, e.g. '2026-04-07T15:00:00+08:00'" },
              description: { type: "string", description: "Optional description or agenda for the event" },
              location: { type: "string", description: "Optional location for the event" },
              attendees: {
                type: "array",
                description: "Optional list of attendees",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" }
                  }
                }
              }
            },
            required: ["title", "startTime", "endTime"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "list_calendar_events",
          description: "Lists the user's calendar events. Can filter by 'today', 'week', or a custom date range. Use this to check if the user is free, show their schedule, or find conflicts before booking.",
          parameters: {
            type: "object",
            properties: {
              range: { type: "string", enum: ["today", "week", "all"], description: "Shortcut filter — 'today', 'week' (next 7 days), or 'all' (upcoming)" },
              from: { type: "string", description: "ISO 8601 start date for custom range filter" },
              to: { type: "string", description: "ISO 8601 end date for custom range filter" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "delete_calendar_event",
          description: "Deletes/cancels a calendar event by its ID. Always list events first to get the correct ID before deleting.",
          parameters: {
            type: "object",
            properties: {
              eventId: { type: "string", description: "The MongoDB _id of the event to delete" }
            },
            required: ["eventId"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "generate_image",
          description: "Generates a high-quality AI image based on a descriptive text prompt. Use this to visualize concepts, create artwork, or show the user something visually.",
          parameters: {
            type: "object",
            properties: {
              prompt: { type: "string", description: "A detailed description of the image to generate" }
            },
            required: ["prompt"]
          }
        }
      }
    ];

    let finalAssistantMessage = '';
    let isDone = false;
    let loopCount = 0;
    const workspacePath = path.join(__dirname, '..', '..', 'shared_workspace');

    while (!isDone && loopCount < 15) {
      loopCount++;
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          models: ['google/gemini-2.0-flash-001', 'google/gemini-1.5-flash', 'openai/gpt-4o-mini'],
          messages,
          tools,
          max_tokens: 2048,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'http://localhost:5173',
            'X-Title': 'ASK.ai Chatbot',
            'Content-Type': 'application/json',
          },
          timeout: 45000,
        }
      );

      const responseMessage = response.data.choices[0].message;

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        messages.push(responseMessage);

        for (const call of responseMessage.tool_calls) {
          try {
            const args = JSON.parse(call.function.arguments);
            let toolResult = '';
            
            // (System logging removed)

            if (call.function.name === 'search_internal_knowledge') {
              const query = args.query;
              // Split query into keywords for a more flexible search
              const keywords = query.split(/\s+/).filter(k => k.length > 2);
              let mongoQuery = {};
              
              if (keywords.length > 0) {
                mongoQuery = {
                  $and: keywords.map(k => ({
                    $or: [
                      { title: { $regex: k, $options: 'i' } },
                      { content: { $regex: k, $options: 'i' } }
                    ]
                  }))
                };
              } else {
                mongoQuery = {
                  $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { content: { $regex: query, $options: 'i' } }
                  ]
                };
              }

              const matches = await Knowledge.find(mongoQuery).limit(10).select('title _id');
              
              if (matches.length === 0) {
                toolResult = `No documents found in the internal knowledge base for "${query}". You should try alternative keywords or fall back to 'search_the_web' if this is a general topic.`;
              } else {
                toolResult = `Found ${matches.length} relevant document(s) in Knowledge Base:\n` + 
                  matches.map((m, i) => `${i+1}. "${m.title}" [ID: ${m._id}]`).join('\n') + 
                  "\n\nUse 'read_internal_document' with an ID to see the full content. If this is insufficient, you can ALSO use 'search_the_web' to supplement this information.";
              }
            } else if (call.function.name === 'read_internal_document') {
              const doc = await Knowledge.findById(args.documentId);
              if (!doc) {
                toolResult = "Error: Document not found.";
              } else {
                toolResult = `--- Document: ${doc.title} ---\nContents:\n${doc.content}`;
              }
            } else if (call.function.name === 'read_safe_workspace_file') {
              const filepath = path.join(workspacePath, args.filename);
              if (!filepath.startsWith(workspacePath)) throw new Error('Unsafe boundary navigation detected.');
              if (fs.existsSync(filepath)) {
                toolResult = fs.readFileSync(filepath, 'utf8');
              } else {
                toolResult = `Error: File '${args.filename}' not found in Ask.ai_Workspace.`;
              }
            } else if (call.function.name === 'list_safe_workspace_files') {
              if (fs.existsSync(workspacePath)) {
                const files = fs.readdirSync(workspacePath);
                toolResult = `Available files:\n- ${files.join('\n- ')}`;
              } else {
                toolResult = 'Workspace directory not found or empty.';
              }
            } else if (call.function.name === 'send_email') {
              const gmailToken = reqHeaders['x-google-token'] || reqHeaders['x-gmail-token'] || reqHeaders['authorization']?.replace('Bearer ', '');
              let emailSent = false;
              let attachmentPath = '';
              let cleanFilename = '';

              if (args.attachmentFilename) {
                if (args.attachmentFilename.startsWith('/uploads/')) {
                  attachmentPath = path.join(__dirname, '..', args.attachmentFilename);
                } else {
                  attachmentPath = path.join(workspacePath, args.attachmentFilename);
                }
                if (fs.existsSync(attachmentPath)) {
                  cleanFilename = path.basename(args.attachmentFilename);
                } else {
                  attachmentPath = ''; // File not found, proceed without it
                }
              }
              if (gmailToken) {
                try {
                  const { google } = require('googleapis');
                  const auth = new google.auth.OAuth2();
                  auth.setCredentials({ access_token: gmailToken });
                  const gmail = google.gmail({ version: 'v1', auth });

                  const boundary = 'ask_ai_boundary_' + Date.now().toString(16);
                  let msgParts = [`To: ${args.to}`, `Subject: ${args.subject}`, `MIME-Version: 1.0`, `Content-Type: multipart/mixed; boundary="${boundary}"`, ``, `--${boundary}`, `Content-Type: text/plain; charset="utf-8"`, `Content-Transfer-Encoding: 7bit`, ``, args.body];

                  if (attachmentPath) {
                    const fileData = fs.readFileSync(attachmentPath).toString('base64');
                    msgParts = msgParts.concat(['', `--${boundary}`, `Content-Type: application/octet-stream; name="${cleanFilename}"`, `Content-Disposition: attachment; filename="${cleanFilename}"`, `Content-Transfer-Encoding: base64`, ``, fileData]);
                  }
                  msgParts.push('', `--${boundary}--`, '');
                  const raw = Buffer.from(msgParts.join('\r\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                  await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
                  emailSent = true;
                  toolResult = "Email sent successfully via your personal Gmail account!";
                } catch (gmailErr) {
                  console.error('Gmail OAuth token send failed', gmailErr.message);
                }
              }

              // Method 2: System Delegation (Domain-Wide Delegation)
              if (!emailSent && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
                const targetSubject = args.from || userEmail;
                if (targetSubject) {
                  try {
                    console.log(`[AGENT] Attempting delegated send as: ${targetSubject}`);
                    const gmail = googleAuthService.getGmailClient(targetSubject);

                    const boundary = 'ask_ai_delegated_boundary_' + Date.now().toString(16);
                    let msgParts = [
                      `From: ${targetSubject}`,
                      `To: ${args.to}`,
                      `Subject: ${args.subject}`,
                      `MIME-Version: 1.0`,
                      `Content-Type: multipart/mixed; boundary="${boundary}"`,
                      ``,
                      `--${boundary}`,
                      `Content-Type: text/plain; charset="utf-8"`,
                      `Content-Transfer-Encoding: 7bit`,
                      ``,
                      args.body
                    ];

                  if (attachmentPath) {
                    const fileData = fs.readFileSync(attachmentPath).toString('base64');
                    msgParts = msgParts.concat(['', `--${boundary}`, `Content-Type: application/octet-stream; name="${cleanFilename}"`, `Content-Disposition: attachment; filename="${cleanFilename}"`, `Content-Transfer-Encoding: base64`, ``, fileData]);
                  }
                  msgParts.push('', `--${boundary}--`, '');
                  const raw = Buffer.from(msgParts.join('\r\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                  
                  await gmail.users.messages.send({ userId: targetSubject, requestBody: { raw } });
                  emailSent = true;
                  toolResult = `Email sent successfully! (Authorized via System Delegation as ${targetSubject})`;
                } catch (delegationErr) {
                  console.error('Domain-Wide Delegation failed', delegationErr.response?.data || delegationErr.message);
                  // Continue to next fallback
                }
              }
            }

              if (!emailSent) {
                // Method 2: System Email Fallback (Nodemailer)
                const nodemailer = require('nodemailer');
                const transporter = nodemailer.createTransport({
                  service: 'gmail',
                  auth: { 
                    user: process.env.EMAIL_USER || '', 
                    pass: process.env.EMAIL_PASS || '' 
                  },
                });

                // Check if configured
                const isConfigured = process.env.EMAIL_USER && !process.env.EMAIL_USER.includes('your.email');

                if (isConfigured) {
                  try {
                    const mailOptions = {
                      from: `"${process.env.APP_NAME || 'ASK.ai Assistant'}" <${process.env.EMAIL_USER}>`,
                      to: args.to,
                      subject: args.subject,
                      text: args.body,
                    };
                    if (attachmentPath) {
                      mailOptions.attachments = [{ filename: cleanFilename, path: attachmentPath }];
                    }
                    await transporter.sendMail(mailOptions);
                    toolResult = "Email sent successfully via standard system service!";
                  } catch (mailErr) {
                    toolResult = `ERROR: Failed to send via system email: ${mailErr.message}`;
                  }
                } else {
                  // Final Fallback: Demo Mode
                  toolResult = `[DEMO MODE] I don't have Gmail access or System credentials, but I would have sent an email to ${args.to} with subject "${args.subject}". ${attachmentPath ? 'Attachment: ' + cleanFilename : ''}`;
                }
              }
            } else if (call.function.name === 'create_calendar_event') {
              // Priority: Google Calendar API
              const googleToken = reqHeaders['x-google-token'] || reqHeaders['authorization']?.replace('Bearer ', '');
              let eventCreated = false;

              if (googleToken || (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && userEmail)) {
                try {
                  const calendar = googleCalendarService.getClient(googleToken, userEmail);
                  const gRes = await calendar.events.insert({
                    calendarId: 'primary',
                    requestBody: {
                      summary: args.title,
                      description: args.description || '',
                      location: args.location || '',
                      start: { dateTime: new Date(args.startTime).toISOString() },
                      end: { dateTime: new Date(args.endTime).toISOString() },
                      attendees: (args.attendees || []).map(a => ({ email: a }))
                    }
                  });
                  eventCreated = true;
                  toolResult = `Calendar event created successfully in Google Calendar!\n- Title: ${args.title}\n- ID: ${gRes.data.id}`;
                } catch (gErr) {
                  console.error('[AGENT GOOGLE CALENDAR CREATE ERROR]', gErr.message);
                }
              }

              if (!eventCreated) {
                // Fallback: Local MongoDB
                const event = new CalendarEvent({
                  title: args.title,
                  description: args.description || '',
                  startTime: new Date(args.startTime),
                  endTime: new Date(args.endTime),
                  location: args.location || '',
                  attendees: args.attendees || [],
                  userId: userId,
                  userEmail: userEmail || 'user@askai.app',
                });
                await event.save();
                toolResult = `Calendar event created locally (Google sync unavailable):\n- Title: ${args.title}\n- Start: ${new Date(args.startTime).toLocaleString()}\n- ID: ${event._id}`;
              }
            } else if (call.function.name === 'list_calendar_events') {
              const googleToken = reqHeaders['x-google-token'] || reqHeaders['authorization']?.replace('Bearer ', '');
              let eventsFound = false;

              if (googleToken || (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && userEmail)) {
                try {
                  const calendar = googleCalendarService.getClient(googleToken, userEmail);
                  
                  let timeMin = new Date().toISOString();
                  let timeMax = undefined;

                  if (args.range === 'today') {
                    const start = new Date(); start.setHours(0,0,0,0);
                    timeMin = start.toISOString();
                    const end = new Date(start); end.setDate(end.getDate() + 1);
                    timeMax = end.toISOString();
                  } else if (args.range === 'week') {
                    const start = new Date(); start.setHours(0,0,0,0);
                    timeMin = start.toISOString();
                    const end = new Date(start); end.setDate(end.getDate() + 7);
                    timeMax = end.toISOString();
                  } else if (args.from || args.to) {
                    if (args.from) timeMin = new Date(args.from).toISOString();
                    if (args.to) timeMax = new Date(args.to).toISOString();
                  }

                  const gRes = await calendar.events.list({
                    calendarId: 'primary',
                    timeMin,
                    timeMax,
                    singleEvents: true,
                    orderBy: 'startTime',
                    maxResults: 15
                  });

                  const items = gRes.data.items || [];
                  if (items.length > 0) {
                    toolResult = `Found ${items.length} Google Calendar event(s):\n` + items.map((e, i) => 
                      `${i+1}. "${e.summary}" — ${new Date(e.start.dateTime || e.start.date).toLocaleString()} to ${new Date(e.end.dateTime || e.end.date).toLocaleString()}${e.location ? ' @ ' + e.location : ''} [ID: ${e.id}]`
                    ).join('\n');
                    eventsFound = true;
                  }
                } catch (gErr) {
                  console.error('[AGENT GOOGLE CALENDAR LIST ERROR]', gErr.message);
                }
              }

              if (!eventsFound) {
                // Fallback: Local MongoDB
                const query = { userId: userId };
                const now = new Date();
                if (args.range === 'today') {
                  const start = new Date(); start.setHours(0,0,0,0);
                  const end = new Date(start); end.setDate(end.getDate() + 1);
                  query.startTime = { $gte: start, $lt: end };
                } else if (args.range === 'week') {
                  const start = new Date(); start.setHours(0,0,0,0);
                  const end = new Date(start); end.setDate(end.getDate() + 7);
                  query.startTime = { $gte: start, $lt: end };
                } else if (args.from || args.to) {
                  if (args.from) query.startTime = { $gte: new Date(args.from) };
                  if (args.to) query.endTime = { ...query.endTime, $lte: new Date(args.to) };
                } else {
                  query.startTime = { $gte: now };
                }
                const events = await CalendarEvent.find(query).sort({ startTime: 1 }).limit(30);
                if (events.length === 0) {
                  toolResult = 'No events found in local or Google calendar for the requested time range.';
                } else {
                  toolResult = `Found ${events.length} local event(s):\n` + events.map((e, i) => 
                    `${i+1}. [ID: ${e._id}] "${e.title}" — ${new Date(e.startTime).toLocaleString()} to ${new Date(e.endTime).toLocaleString()}${e.location ? ' @ ' + e.location : ''}`
                  ).join('\n');
                }
              }
            } else if (call.function.name === 'delete_calendar_event') {
              const deleted = await CalendarEvent.findOneAndDelete({ _id: args.eventId, userId: userId });
              if (deleted) {
                toolResult = `Event "${deleted.title}" has been deleted/cancelled successfully.`;
              } else {
                toolResult = `Error: Event not found or you don't have permission to delete it.`;
              }
            } else if (call.function.name === 'search_google_drive') {
              const googleToken = reqHeaders['x-google-token'] || reqHeaders['authorization']?.replace('Bearer ', '');
              if (!googleToken) {
                toolResult = "Error: Google Drive access not authorized. Ask user to connect Google account.";
              } else {
                const files = await googleDriveService.searchFiles(googleToken, args.query);
                if (files.length === 0) {
                  toolResult = `No files found in Google Drive for query: "${args.query}"`;
                } else {
                  toolResult = `Found ${files.length} file(s) in Google Drive:\n` + files.map(f => `- ${f.name} [ID: ${f.id}, MIME: ${f.mimeType}]`).join('\n');
                }
              }
            } else if (call.function.name === 'read_google_drive_file') {
              const googleToken = reqHeaders['x-google-token'] || reqHeaders['authorization']?.replace('Bearer ', '');
              if (!googleToken) {
                toolResult = "Error: Google Drive access not authorized.";
              } else {
                toolResult = await googleDriveService.getFileContent(googleToken, args.fileId, args.mimeType);
              }
            } else if (call.function.name === 'generate_image') {
              try {
                const seed = Math.floor(Math.random() * 1000000);
                const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(args.prompt)}?width=1024&height=1024&seed=${seed}&model=flux`;
                toolResult = `Generated Image: \n\n![${args.prompt}](${imageUrl})`;
              } catch (err) {
                toolResult = `Image generation failed: ${err.message}`;
              }
            } else if (call.function.name === 'search_the_web') {
              try {
                // Try Tavily API first
                if (process.env.TAVILY_API_KEY) {
                  const searchResponse = await axios.post('https://api.tavily.com/search', {
                    api_key: process.env.TAVILY_API_KEY,
                    query: args.query,
                    search_depth: "basic",
                    max_results: 5
                  });
                  const results = searchResponse.data.results || [];
                  if (results.length === 0) {
                    toolResult = `[WEB SEARCH] No results found on the web for "${args.query}".`;
                  } else {
                    toolResult = `[WEB SEARCH RESULTS for "${args.query}"]\n` + 
                                 results.map(r => `Title: ${r.title}\nContent: ${r.content}\nSource: ${r.url}`).join('\n\n---\n\n');
                  }
                } else {
                  // Fallback: Free Web Search using DuckDuckGo HTML
                  const searchRes = await axios.get('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(args.query), {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                  });
                  const matches = [...searchRes.data.matchAll(/<a class="result__snippet[^>]*>(.*?)<\/a>/gi)];
                  const snippets = matches.map(m => m[1].replace(/<\/?[^>]+(>|$)/g, ""));
                  
                  if (snippets.length === 0) {
                    toolResult = `[FREE WEB SEARCH] No results found on the web for "${args.query}".`;
                  } else {
                    toolResult = `[FREE WEB SEARCH RESULTS for "${args.query}"]\n` + 
                                 snippets.slice(0, 5).map((s, i) => `Result ${i+1}:\n${s}`).join('\n\n---\n\n');
                  }
                }
              } catch (err) {
                toolResult = `Web search failed: ${err.message}`;
              }
            } else {
              toolResult = `Error: Unknown tool ${call.function.name}`;
            }

            messages.push({
              role: 'tool',
              name: call.function.name,
              content: toolResult,
              tool_call_id: call.id
            });
            
            // (Tool result logging removed)
            
          } catch (e) {
             messages.push({ role: 'tool', name: call.function.name, content: `Error: ${e.message}`, tool_call_id: call.id });
             // (Error logging removed)
          }
        }
      } else {
        finalAssistantMessage = responseMessage.content;
        isDone = true;
      }
    }

    const assistantMessage = finalAssistantMessage || "I encountered an error trying to process that action or reached my background loop limit.";

    let cov = await Conversation.findById(conversation._id);
    cov.messages.push({ role: 'assistant', content: assistantMessage });
    if (cov.messages.length > 150) cov.messages = cov.messages.slice(-150);
    cov.status = 'idle';
    await cov.save();

  } catch (err) {
    console.error('[OPENROUTER ERROR]', err.response?.data || err.message);
    
    let errorMsg = `AI Error: ${err.response?.data?.error?.message || err.message}`;
    if (!process.env.OPENROUTER_API_KEY || err.response?.status === 401) {
      errorMsg = `Hello! I'm ASK.ai. 🤖\n\nI'm in **demo mode** because your OpenRouter API key is missing or invalid.\n\nPlease check your \`.env\` file.`;
    }

    try {
      let cov = await Conversation.findById(conversation._id);
      cov.messages.push({ 
        role: 'assistant', 
        content: errorMsg,
        metadata: { isError: true } 
      });
      cov.status = 'idle';
      await cov.save();
    } catch (saveErr) {
      console.warn('[DB Error saving fallback msg]', saveErr);
    }
  }
}

// POST /api/chat/message
router.post('/message', authMiddleware, async (req, res) => {
  const { message, sessionId, attachment, history = [] } = req.body;

  if (!message && !attachment) {
    return res.status(400).json({ error: 'message or attachment is required' });
  }

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    let conversation = await Conversation.findOne({ sessionId, userId: req.user.id });
    if (!conversation) {
      conversation = new Conversation({ sessionId, userId: req.user.id });
    }
    
    // Save user message and enter processing mode
    conversation.messages.push({ role: 'user', content: message || '', attachment });
    conversation.status = 'processing';
    await conversation.save();

    // 202 Accepted (Processing in background)
    res.status(202).json({
      status: 'processing',
      sessionId,
      timestamp: new Date().toISOString(),
    });

    // Fire off async agent task
    processAgentTask(conversation, 'sys', message, attachment, history, req.headers, req.user.id, req.user.email, req.user.name).catch(console.error);

  } catch (err) {
    res.status(500).json({ error: `Internal Error: ${err.message}` });
  }
});

// GET /api/chat/history/:sessionId
router.get('/history/:sessionId', authMiddleware, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ 
      sessionId: req.params.sessionId,
      userId: req.user.id 
    });
    res.json({ 
      messages: conversation?.messages || [], 
      title: conversation?.title || 'New Conversation',
      status: conversation?.status || 'idle'
    });
  } catch (err) {
    res.json({ messages: [], title: 'New Conversation', status: 'idle' });
  }
});

// GET /api/chat/conversations
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const conversations = await Conversation.find({ 
      isActive: true,
      userId: req.user.id 
    })
      .select('sessionId title updatedAt createdAt status')
      .sort({ updatedAt: -1 })
      .limit(20);
    res.json({ conversations });
  } catch (err) {
    res.json({ conversations: [] });
  }
});

// DELETE /api/chat/:sessionId
router.delete('/:sessionId', authMiddleware, async (req, res) => {
  try {
    await Conversation.findOneAndUpdate(
      { sessionId: req.params.sessionId, userId: req.user.id },
      { isActive: false }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

module.exports = router;
