const {
  proto,
  getContentType,
  jidDecode
} = require("@whiskeysockets/baileys");
const { readFileSync } = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../dreaded.jpg");
const kali = readFileSync(filePath);

async function smsg(conn, m) {
  if (!m) return m;
  let M = proto.WebMessageInfo;

  if (m.key) {
    m.id = m.key.id;
    m.isBaileys = m.id.startsWith("BAE5") && m.id.length === 16;
    m.chat = m.key.remoteJid;
    m.fromMe = m.key.fromMe;
    m.isGroup = m.chat.endsWith("@g.us");

    let rawSender = (m.fromMe && conn.user.id) || m.participant || m.key.participant || m.chat || "";
    m.sender = rawSender;

    if (m.isGroup) {
      try {
        const metadata = await conn.groupMetadata(m.chat);
        const found = metadata.participants.find(p => p.id === rawSender);
        if (found && found.pn) m.sender = found.pn;
        if (m.key?.participant) m.participant = found?.pn || rawSender;
      } catch {
        m.participant = rawSender;
      }
    }
  }

  if (m.message) {
    m.mtype = getContentType(m.message);
    m.msg = m.mtype === "viewOnceMessage"
      ? (m.message[m.mtype]?.message[getContentType(m.message[m.mtype].message)])
      : m.message[m.mtype];

    m.body =
      m.message?.conversation ||
      m.msg?.caption ||
      m.msg?.text ||
      (m.mtype === "listResponseMessage" && m.msg?.singleSelectReply?.selectedRowId) ||
      (m.mtype === "buttonsResponseMessage" && m.msg?.selectedButtonId) ||
      (m.mtype === "viewOnceMessage" && m.msg?.caption) ||
      m.text;

    let quoted = (m.quoted = m.msg?.contextInfo?.quotedMessage || null);
    m.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];

    if (m.quoted) {
      let type = getContentType(quoted);
      m.quoted = m.quoted[type];

      if (["productMessage"].includes(type)) {
        type = getContentType(m.quoted);
        m.quoted = m.quoted[type];
      }

      if (typeof m.quoted === "string") {
        m.quoted = { text: m.quoted };
      }

      m.quoted.mtype = type;
      m.quoted.id = m.msg.contextInfo.stanzaId;
      m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat;
      m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith("BAE5") && m.quoted.id.length === 16 : false;
      m.quoted.sender = conn.decodeJid(m.msg.contextInfo.participant);
      m.quoted.fromMe = m.quoted.sender === conn.decodeJid(conn.user.id);
      m.quoted.text =
        m.quoted.text ||
        m.quoted.caption ||
        m.quoted.conversation ||
        m.quoted.contentText ||
        m.quoted.selectedDisplayText ||
        m.quoted.title ||
        "";
      m.quoted.mentionedJid = m.msg.contextInfo.mentionedJid || [];

      m.getQuotedObj = m.getQuotedMessage = async () => {
        if (!m.quoted.id) return false;
        return m.quoted;
      };

      let vM = (m.quoted.fakeObj = M.fromObject({
        key: {
          remoteJid: m.quoted.chat,
          fromMe: m.quoted.fromMe,
          id: m.quoted.id,
        },
        message: quoted,
        ...(m.isGroup ? { participant: m.quoted.sender } : {}),
      }));

      m.quoted.delete = () => conn.sendMessage(m.quoted.chat, { delete: vM.key });
      m.quoted.copyNForward = (jid, forceForward = false, options = {}) =>
        conn.copyNForward(jid, vM, forceForward, options);
      m.quoted.download = () => conn.downloadMediaMessage(m.quoted);
    }
  }

  if (m.msg?.url) m.download = () => conn.downloadMediaMessage(m.msg);
  m.text =
    m.msg?.text ||
    m.msg?.caption ||
    m.message?.conversation ||
    m.msg?.contentText ||
    m.msg?.selectedDisplayText ||
    m.msg?.title ||
    "";

  m.reply = (text, chatId = m.chat, options = {}) => {
    return conn.sendMessage(
      chatId,
      {
        text,
        contextInfo: {
          externalAdReply: {
            title: "DREADED V2",
            body: m.pushName,
            previewType: "PHOTO",
            thumbnailUrl: "https://telegra.ph/file/c75efecf7f0aef851fc02.jpg",
            thumbnail: kali,
            sourceUrl: "https://github.com/Fortunatusmokaya/dreaded-v2"
          }
        }
      },
      { quoted: m, ...options }
    );
  };

  m.copy = () => exports.smsg(conn, M.fromObject(M.toObject(m)));
  m.copyNForward = (jid = m.chat, forceForward = false, options = {}) =>
    conn.copyNForward(jid, m, forceForward, options);

  return m;
}

module.exports = { smsg };