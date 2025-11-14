const fs = require('fs');
let config = {};

if (fs.existsSync('config.json')) {
    config = JSON.parse(fs.readFileSync('config.json'));
}

module.exports = {
    description: 'https://appembed.netlify.app/e?description=Type%20VARPurge%20%2250%22%20to%20purge%20the%20last%2050%20messages%20in%20the%20channel%20sent%20by%20you&redirect=&provider=TonyskalYTs%20selfbot&author=VARPurge%20(amount)&image=&color=%23FF0000',
    run: async (client, message, handler, prefix) => {
        if (!message.content.toLowerCase().startsWith(`${prefix}purge`)) return;
        let matches = message.content.match(/\d+|"([^"]*)"/g);
        message.react(config.successEmoji).catch(err => message.react('👍').catch(e => console.log(e)));
        let end = false;
        if (matches) {
            let [n] = matches.map(v => v.replace(/"/g));
            await async function() {
                for (let i = -1; i < n; i++) {
                    await message.channel.messages.fetch({
                        limit: 100
                    }).then(async messages => {
                        messages = messages.filter(msg => msg.author.id === `${message.author.id}`);
                        if (messages.size > 0) {
                            try {
                                await messages.first().delete();
                            } catch (error) {
                                i--;
                                console.log(error);
                            }
                        }
                    });
                    if (end) break;
                }
            }();
        }
        if (message.content.toLowerCase() === `${prefix}purgeend`) end = true;
    }
}