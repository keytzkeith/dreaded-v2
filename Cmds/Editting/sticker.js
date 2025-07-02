const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');

module.exports = async (context) => {
  const { client, m, packname, author } = context;

  const quotedMessage = m.msg?.contextInfo?.quotedMessage;
  if (!quotedMessage) {
    m.reply('Quote an image or a short video.');
    return;
  }

  let media;
  if (quotedMessage.imageMessage) {
    media = quotedMessage.imageMessage;
  } else if (quotedMessage.videoMessage) {
    media = quotedMessage.videoMessage;
  } else {
    m.reply('That is neither an image nor a short video!');
    return;
  }

  const result = await client.downloadAndSaveMediaMessage(media);

  let stickerResult = new Sticker(result, {
    pack: packname,
    author: author,
    type: StickerTypes.FULL,
    categories: ["🤩", "🎉"],
    id: "12345",
    quality: 70,
    background: "transparent",
  });

  const Buffer = await stickerResult.toBuffer();
  client.sendMessage(m.chat, { sticker: Buffer }, { quoted: m });
};