

const { downloadContentFromMessage, jidDecode } = require("@whiskeysockets/baileys");
const fs = require("fs");
const FileType = require("file-type");
const PhoneNumber = require("awesome-phonenumber");
const groupCache = require("../Client/groupCache");


/**
 * Initialize client utility functions
 * @param {Object} client - Baileys client instance
 * @param {Object} store - Store instance
 * @param {Object} groupCache - NodeCache instance for group metadata
 */
function initializeClientUtils(client, store) {
  
  /**
   * Decode JID to proper format
   * @param {string} jid - JID to decode
   * @returns {string} Decoded JID
   */
  client.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else return jid;
  };

  /**
   * Get name from JID with caching support
   * @param {string} jid - JID to get name for
   * @param {boolean} withoutContact - Whether to exclude contact name
   * @returns {string|Promise<string>} Name or Promise resolving to name
   */
  client.getName = (jid, withoutContact = false) => {
    const id = client.decodeJid(jid);
    withoutContact = client.withoutContact || withoutContact;
    let v;
    
    if (id.endsWith("@g.us")) {
      return new Promise(async (resolve) => {
        try {
          v = store.contacts[id] || {};
          if (!(v.name || v.subject)) {
        
            let groupMetadata = groupCache.get(id);
            if (!groupMetadata) {
              console.log(`Fetching group metadata for: ${id}`);
              groupMetadata = await client.groupMetadata(id);
              groupCache.set(id, groupMetadata);
            } else {
              console.log(`Using cached group metadata for: ${id}`);
            }
            v = groupMetadata || {};
          }
          resolve(v.name || v.subject || PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international"));
        } catch (error) {
          console.error(`Error getting name for ${id}:`, error);
          resolve(PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international"));
        }
      });
    } else {
      v = id === "0@s.whatsapp.net"
        ? { id, name: "WhatsApp" }
        : id === client.decodeJid(client.user.id)
        ? client.user
        : store.contacts[id] || {};
      
      return (withoutContact ? "" : v.name) || v.subject || v.verifiedName || PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international");
    }
  };

  /**
   * Send text message
   * @param {string} jid - JID to send message to
   * @param {string} text - Text content
   * @param {Object} quoted - Quoted message
   * @param {Object} options - Additional options
   * @returns {Promise} Send message promise
   */
  client.sendText = (jid, text, quoted = "", options = {}) => {
    return client.sendMessage(jid, { text: text, ...options }, { quoted });
  };

  /**
   * Download media message to buffer
   * @param {Object} message - Message object containing media
   * @returns {Promise<Buffer>} Downloaded media buffer
   */
  client.downloadMediaMessage = async (message) => {
    try {
      let mime = (message.msg || message).mimetype || '';
      let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
      
      const stream = await downloadContentFromMessage(message, messageType);
      let buffer = Buffer.from([]);
      
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      
      return buffer;
    } catch (error) {
      console.error('Error downloading media message:', error);
      throw error;
    }
  };

  /**
   * Download and save media message to file
   * @param {Object} message - Message object containing media
   * @param {string} filename - Filename to save as
   * @param {boolean} attachExtension - Whether to attach file extension
   * @returns {Promise<string>} Path to saved file
   */
  client.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    try {
      let quoted = message.msg ? message.msg : message;
      let mime = (message.msg || message).mimetype || '';
      let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
      
      const stream = await downloadContentFromMessage(quoted, messageType);
      let buffer = Buffer.from([]);
      
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      
      let type = await FileType.fromBuffer(buffer);
      const trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
      
      // save to file
      await fs.writeFileSync(trueFileName, buffer);
      return trueFileName;
    } catch (error) {
      console.error('Error downloading and saving media message:', error);
      throw error;
    }
  };

 
  /**
   * Manually cache group metadata
   * @param {string} groupJid - Group JID
   * @returns {Promise<Object|null>} Group metadata or null
   */
  client.cacheGroupMetadata = async (groupJid) => {
    try {
      const metadata = await client.groupMetadata(groupJid);
      groupCache.set(groupJid, metadata);
      console.log(`Cached metadata for group: ${groupJid}`);
      return metadata;
    } catch (error) {
      console.error(`Error caching group metadata for ${groupJid}:`, error);
      return null;
    }
  };

  /**
   * Get cached group metadata without API call
   * @param {string} groupJid - Group JID
   * @returns {Object|null} Cached metadata or null
   */
  client.getCachedGroupMetadata = (groupJid) => {
    return groupCache.get(groupJid);
  };

  /**
   * Remove specific group from cache
   * @param {string} groupJid - Group JID
   * @returns {number} Number of deleted keys
   */
  client.clearGroupCache = (groupJid) => {
    return groupCache.del(groupJid);
  };

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  client.getCacheStats = () => {
    return {
      keys: groupCache.keys().length,
      stats: groupCache.getStats()
    };
  };

  /**
   * Enhanced sendMessage with error handling and retries
   * @param {string} jid - JID to send message to
   * @param {Object} content - Message content
   * @param {Object} options - Send options
   * @param {number} retries - Number of retries
   * @returns {Promise} Send message promise
   */
  client.sendMessageWithRetry = async (jid, content, options = {}, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await client.sendMessage(jid, content, options);
      } catch (error) {
        console.error(`Attempt ${i + 1} failed for sending message to ${jid}:`, error);
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
  };

  /**
   * Check if JID is a group
   * @param {string} jid - JID to check
   * @returns {boolean} Whether JID is a group
   */
  client.isGroup = (jid) => {
    return jid.endsWith("@g.us");
  };

  /**
   * Check if JID is a private chat
   * @param {string} jid - JID to check
   * @returns {boolean} Whether JID is a private chat
   */
  client.isPrivateChat = (jid) => {
    return jid.endsWith("@s.whatsapp.net");
  };

  /**
   * Get group admin list with caching
   * @param {string} groupJid - Group JID
   * @returns {Promise<Array>} List of admin JIDs
   */
  client.getGroupAdmins = async (groupJid) => {
    try {
      if (!client.isGroup(groupJid)) return [];
      
      let groupMetadata = groupCache.get(groupJid);
      if (!groupMetadata) {
        groupMetadata = await client.groupMetadata(groupJid);
        groupCache.set(groupJid, groupMetadata);
      }
      
      return groupMetadata.participants.filter(p => p.admin).map(p => p.id);
    } catch (error) {
      console.error(`Error getting group admins for ${groupJid}:`, error);
      return [];
    }
  };

  /**
   * Check if user is group admin
   * @param {string} groupJid - Group JID
   * @param {string} userJid - User JID
   * @returns {Promise<boolean>} Whether user is admin
   */
  client.isGroupAdmin = async (groupJid, userJid) => {
    try {
      const admins = await client.getGroupAdmins(groupJid);
      return admins.includes(userJid);
    } catch (error) {
      console.error(`Error checking admin status for ${userJid} in ${groupJid}:`, error);
      return false;
    }
  };


/**
   * Get full group context with caching and sender info
   * @param {Object} m - Message object
   * @param {string} botNumber - The bot's JID/phone number
   * @returns {Promise<Object>} Group context
   */
  client.getGroupContext = async (m, botNumber) => {
    if (!m.isGroup) {
      return {
        groupMetadata: null,
        groupName: "",
        participants: [],
        groupAdmin: [],
        isBotAdmin: false,
        groupSender: m.sender,
        isAdmin: false,
      };
    }

    try {
      let groupMetadata = groupCache.get(m.chat);
      if (!groupMetadata) {
        groupMetadata = await client.groupMetadata(m.chat);
        groupCache.set(m.chat, groupMetadata);
      }

      const groupName = groupMetadata.subject || "";

      const participants = groupMetadata.participants
        .filter(p => p.pn)
        .map(p => p.pn);

      const groupAdmin = groupMetadata.participants
        .filter(p => p.admin && p.pn)
        .map(p => p.pn);

      const senderJid = client.decodeJid(m.sender);
      const found = groupMetadata.participants.find(p =>
        client.decodeJid(p.id) === senderJid
      );
      const groupSender = found?.pn || m.sender;

      const isBotAdmin = groupAdmin.includes(botNumber);
      const isAdmin = groupAdmin.includes(groupSender);

      return {
        groupMetadata,
        groupName,
        participants,
        groupAdmin,
        isBotAdmin,
        groupSender,
        isAdmin
      };

    } catch (error) {
      console.error("Error getting group context:", error);
      return {
        groupMetadata: null,
        groupName: "",
        participants: [],
        groupAdmin: [],
        isBotAdmin: false,
        groupSender: m.sender,
        isAdmin: false,
      };
    }
  };

  console.log('Client utility functions initialized successfully');
}

module.exports = {
  initializeClientUtils
};