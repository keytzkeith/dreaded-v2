const middleware = require('../../utility/botUtil/middleware');

module.exports = async (context) => {
    await middleware(context, async () => {
        const { client, m, args, participants, text } = context;

        await client.sendMessage(
            m.chat,
            { 
                text: text ? text : '☞︎︎︎ TAGGED ☜︎︎︎', 
                mentions: participants 
            },
            { quoted: m }
        );
    });
}