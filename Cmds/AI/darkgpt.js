module.exports = async (context) => {
    const { client, m, text } = context;

    try {
        if (!text) {
            return m.reply("I am darkgpt, I can respond to anything — even the darkest thoughts. What do you want ?");
        }

        const msg = encodeURIComponent(text);
        const response = await fetch(`http://darkgpt.dreaded.site:3800/api/venice?text=${msg}`);

        const result = await response.json();

        if (!result.response) {
            return m.reply('I did not get any result');
        }

        await m.reply(result.response);

    } catch (e) {
        m.reply('An error occurred while communicating with the Venice API:\n' + e);
    }
};