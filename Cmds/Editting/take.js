const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');

module.exports = async (context) => {
  const { client, m, pushname } = context;

  const quotedMessage = m.msg?.contextInfo?.quotedMessage;
  if (!quotedMessage) {
    m.reply('Quote an image, a short video or a sticker to change watermark.');
    return;
  }

  let media;
  if (quotedMessage.imageMessage) {
    media = quotedMessage.imageMessage;
  } else if (quotedMessage.videoMessage) {
    media = quotedMessage.videoMessage;
  } else if (quotedMessage.stickerMessage) {
    media = quotedMessage.stickerMessage;
  } else {
    m.reply('This is neither a sticker, image nor a video...');
    return;
  }

  const result = await client.downloadAndSaveMediaMessage(media);

  const stickerResult = new Sticker(result, {
    pack: pushname,
    author: pushname,
    type: StickerTypes.FULL,
    categories: ["🤩", "🎉"],
    id: "12345",
    quality: 70,
    background: "transparent",
  });

  const Buffer = await stickerResult.toBuffer();
  client.sendMessage(m.chat, { sticker: Buffer }, { quoted: m });
};