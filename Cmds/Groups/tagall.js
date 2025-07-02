const middleware = require('../../utility/botUtil/middleware');

module.exports = async (context) => {
    await middleware(context, async () => {
        const { client, m, args, participants, text } = context;

        let txt = `Tagged by ${m.pushName}.\n\nMessage:- ${text ? text : 'No Message!'}\n\n`; 
        
        for (let mem of participants) { 
            txt += `📧 @${mem.split('@')[0]}\n`; 
        } 

        await client.sendMessage(m.chat, {
            text: txt,
            mentions: participants
        }, { quoted: m });
    });
}