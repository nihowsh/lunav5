const fs = require('fs');
let config = {};

if (fs.existsSync('config.json')) {
    config = JSON.parse(fs.readFileSync('config.json'));
}

let end = false;
module.exports = {
    description: '',
    run: async (client, message, handler, prefix, MyID) => {
        if (message.author.id !== client.user.id) return;
        let matches = message.content.match(/\d+|"([^"]*)"/g);
        message.react(config.successEmoji).catch(err => message.react('👍').catch(e => console.log(e)));
        if (matches) {
            let [n, args2, waitval] = matches.map(v => v.replace(/"/g, ""));
            for (let i = 0; i < n; i++) {
                message.channel.send(args2);
                if (end) break;
                await new Promise(wait => setTimeout(wait, +waitval || 0));
            }
        }
        if (message.content.toLowerCase() === `${prefix}loopend`) {
            end = true;
        }
    }
};