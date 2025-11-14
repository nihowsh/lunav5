const {
    Appembed
} = require('kyz');
const fs = require('fs');
let config = {};

if (fs.existsSync('config.json')) {
    config = JSON.parse(fs.readFileSync('config.json'));
}

module.exports = {
    description: 'https://appembed.netlify.app/e?description=Type%20VARping%20to%20get%20the%20ping%20latency%20of%20discord%20to%20the%20host%20back%20to%20discord.&color=%23FF0000&provider=TonyskalYT%27s%20selfbot&author=VARping',
    run: async (client, message, handler, prefix) => {
        const ping = Date.now() - message.createdTimestamp;

        const embed = new Appembed()
            .setAuthor('Pong!')
            .setDescription(`Latency: ${ping}ms`)
            .setColor("#00FF00")
            .setProvider("TonyskalYT's selfbot")
            .build();

        message.channel.send(`${config.longstringoftext} ${embed}`);
    }
};