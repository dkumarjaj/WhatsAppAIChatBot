require('dotenv').config(); // 👈 Add this at the very top
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

// 🔐 Now it safely pulls from the .env file!
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "bot-session"
    }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    takeoverOnConflict: true,
    takeoverTimeoutMs: 30*24*60*60*1000 // 30 days
});

const FILE = "users.json";
const EXPIRY = 24 * 60 * 60 * 1000;

const LANGUAGES = [
  "English (en)", "Hindi (hi)", "Tamil (ta)", "Telugu (te)",
  "Bengali (bn)", "Marathi (mr)", "Gujarati (gu)",
  "Kannada (kn)", "Malayalam (ml)", "Punjabi (pa)",
  "Spanish (es)", "French (fr)", "German (de)",
  "Chinese (zh)", "Arabic (ar)"
];

function isInvalidLanguageInput(text) {
  return text.length > 20 || text.split(" ").length > 1;
}

function sendLanguageOptions(message) {
    return message.reply(
`⚠️ Please select a valid language.

👉 Choose one:

${LANGUAGES.map((l, i) => `${i + 1}. ${l}`).join("\n")}

Example: English or en`
    );
}

function formatTime(ms) {
    let seconds = Math.floor(ms / 1000);

    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;

    const minutes = Math.floor(seconds / 60);
    seconds %= 60;

    let parts = [];

    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    if (seconds > 0) parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);

    return parts.join(" ");
}

// ✅ Safe load
function loadUsers() {
    try {
        if (fs.existsSync(FILE)) {
            const data = fs.readFileSync(FILE, 'utf-8').trim();
            if (!data) return {};
            return JSON.parse(data);
        }
    } catch (e) {
        console.log("⚠️ JSON error, resetting...");
    }
    return {};
}

// Save
function saveUsers(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

let users = loadUsers();

// QR
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

// Ready
client.on('ready', () => {
    console.log('✅ Bot ready');
});


async function getAIReply(text,language) {
    // 👇 CHANGED: Using current active model names
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-pro"];

    for (let m of models) {
        try {
            // Set up the model with native System Instructions
            const model = genAI.getGenerativeModel({ 
                model: m,
                systemInstruction: `You are DevAI, a helpful assistant.

You can answer:
- Education and study questions (school, general knowledge, coding, science, math)
- CSC (Common Service Centre) queries
- Tech support and troubleshooting

Rules:
- If asked your identity, reply exactly: "DevAI Devendra's Clone to help you"
- Do NOT answer personal questions like "how are you", "what are you doing"
- Do NOT answer sexual or inappropriate content
- If question is outside allowed topics, reply:
"⚠️ I only answer Education, CSC, and Tech-related questions."

Reply in ${language || "English"}`
            });

            // // Ensure history roles are strictly 'user' or 'model'
            // const formattedHistory = history.map(msg => {
            //     const validRole = msg.role === "bot" || msg.role === "assistant" ? "model" : "user";
            //     return {
            //         role: validRole,
            //         parts: [{ text: msg.text }]
            //     };
            // });

            // const chat = model.startChat({
            //     history: formattedHistory
            // });

            // Just send the user's text
            // const result = await chat.sendMessage(text);
            const result = await model.generateContent(text);


            return result.response.text();
            
        } catch (err) {
            console.log(`❌ Model ${m} failed`);
            console.error(`🔍 Error Details for ${m}:`, err.message); 
        }
    }

    return "⚠️ AI service temporarily unavailable. \n Please try again later. \n Enter Exit or Normal to switch to normal mode.";
}

// Message handler
const SHORT_LIMIT = 1; // max queries
const SHORT_WINDOW = 24 * 60 * 60 * 1000 
client.on('message', async (message) => {
    const user = message.from;
    const text = message.body.trim().toLowerCase();

    if (message.fromMe) return;


    let userData = users[user];

    // Expiry
 // ⏳ Expiry check (24h reset)
if (userData && Date.now() - userData.lastActive > EXPIRY) {

    console.log("♻️ Resetting user after 24h:", user);

    // Reset instead of delete (cleaner)
     userData.mode = "pending";
    userData.language = "";
    userData.lastActive = Date.now();


    saveUsers(users);

    return message.reply(`👋 Welcome back!

Your session was reset after 24 hours.

Choose mode:\n 1️⃣ Type *ai* or *devai* → DevAI Mode 🤖\n 2️⃣ Type *normal* or *exit* → Normal Chat or exit AI mode 🙂 \n\n🔒 Notice: Chats may be monitored and stored to ensure safe use and prevent abuse. Please follow guidelines and avoid offensive or explicit content.

Type your choice`);
}

    // First time
    if (!userData) {
        users[user] = {
            mode: "pending",
            lastActive: Date.now(),
            language: "",
            history: [],
            queryCount: 0,
    queryResetTime: Date.now()
        };
        saveUsers(users);

        return message.reply(`👋 Welcome!

Choose mode:\n 1️⃣ Type *ai* or *devai* → DevAI Mode 🤖\n 2️⃣ Type *normal* or *exit* → Normal Chat or exit AI mode 🙂 \n\n🔒 Notice: Chats may be monitored and stored to ensure safe use and prevent abuse. Please follow guidelines and avoid offensive or explicit content.

Type your choice`);
    }

    userData.lastActive = Date.now();

    // Mode select
    if (userData.mode === "pending") {
        if (text === "ai" || text === "devai" || text === "aidev" || text === "aidevendra") {
            userData.mode = "ai";
            saveUsers(users);
            if (userData.language === "") {
            userData.language = "pending";
            saveUsers(users);
            return message.reply("🌐 Enter in which language you want to talk with me.");
        }

        // 2. If it is pending, save whatever they just typed
     if (userData.language === "pending") {

    if (isInvalidLanguageInput(text)) {
    return sendLanguageOptions(message);
}

    userData.language = text;
    saveUsers(users);

    return message.reply(`🌐 Language set to: ${userData.language}. You can continue.`);
}
            return message.reply("🤖 AI mode ON");
        }

        if (text === "normal") {
            userData.mode = "normal";
            saveUsers(users);
        }

    }

    // Switch
    if (text === "ai" || text === "devai" || text === "aidev" || text === "aidevendra") {
        userData.mode = "ai";
        saveUsers(users);
        if (userData.language === "") {
            userData.language = "pending";
            saveUsers(users);
            return message.reply("🌐 Enter in which language you want to talk with me.");
        }

        // 2. If it is pending, save whatever they just typed
        if (userData.language === "pending") {
if (isInvalidLanguageInput(text)) {
    return sendLanguageOptions(message);
}

    userData.language = text;
    saveUsers(users);

    return message.reply(`🌐 Language set to: ${userData.language}. You can continue.`);
}
        return message.reply("🤖 AI mode ON");

    }

    if (text === "normal" || text === "exit") {
        userData.mode = "normal";
        saveUsers(users);
    }

    // 🤖 AI MODE

        if (userData.mode === "ai") {
  // 1. If language is empty, set to pending and ask
        if (userData.language === "") {
            userData.language = "pending";
            saveUsers(users);
            return message.reply("🌐 Enter in which language you want to talk with me.");
        }

        // 2. If it is pending, save whatever they just typed
        if (userData.language === "pending") {

   if (isInvalidLanguageInput(text)) {
    return sendLanguageOptions(message);
}

    userData.language = text;
    saveUsers(users);

    return message.reply(`🌐 Language set to: ${userData.language}. You can continue.`);
}
        try {
            const history = userData.history.slice(-6);
            // ⚡ Short rate limit (2 min window)
const now = Date.now();

// remove old timestamps
userData.shortQueries = (userData.shortQueries || []).filter(
    t => now - t < SHORT_WINDOW
);

if (userData.shortQueries.length >= SHORT_LIMIT) {
   const remainingMs = SHORT_WINDOW - (now - userData.shortQueries[0]);
const waitTime = formatTime(remainingMs);

return message.reply(
`⏳ Too many requests!

Try again in ${waitTime}.`
);
}

            const reply = await getAIReply(text, userData.language);

            userData.queryCount += 1;
            userData.shortQueries.push(Date.now());

            userData.history.push({ role: "user", text });
            userData.history.push({ role: "model", text: reply });

            saveUsers(users);

            return message.reply(reply);

        } catch (err) {
            console.log("DETAILED ERROR:", err);
            return message.reply("⚠️ AI error, try later.");
        }
    }

    // NORMAL MODE
    }
);

// Start
client.initialize();
