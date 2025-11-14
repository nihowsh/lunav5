const fs = require('fs');
let config = {};

if (fs.existsSync('config.json')) {
    config = JSON.parse(fs.readFileSync('config.json'));
}

module.exports = {
    description: 'https://appembed.netlify.app/e?description=Type%20VARinfo%20%40Ronald%20for%20example.%20if%20Ronald%20is%20pinged%20it%20will%20get%20the%20userinfo%20of%20Ronald.%20&redirect=&provider=TonyskalYTs%20selfbot&author=VARINFO%20%28user%29&image=&color=%23FF0000',
    run: async (client, message, handler, prefix) => {
        if (message.content.toLowerCase().startsWith(`${prefix}info`)) {
            message.react(config.successEmoji).catch(err => message.react('👍').catch(e => console.log(e)));

            let user = message.mentions.users.first();
            if (!user) {
                const args = message.content.slice(prefix.length).trim().split(/ +/);
                const userId = args[1];

                user = await client.users.fetch(userId).catch(err => {
                    console.error(err);
                    return null;
                });

                if (!user) {
                    message.reply("User not found.");
                    return;
                }
            }

            user.fetch().then(() => {
                thingy = ("`");
                let ms = client.guilds.cache.filter(guild => guild.members.cache.has(user.id));
                let premiumGuildSince = user.premiumGuildSince ? new Date(user.premiumGuildSince).toString() : 'null';
                let premiumSince = user.premiumSince ? new Date(user.premiumSince).toString() : 'null';
                let channel = message.channel;
                let bio = (`${user.bio ? `${user.bio}` : `null`}`);
                let HexAccentColor = (`${user.hexAccentColor ? `${user.hexAccentColor}` : `None`}`);
                let HexThemeColor = (`${user.hexThemeColor ? `${user.hexThemeColor}` : `None`}`);
                let NitroType = (`${user.nitroType ? `${user.nitroType}` : `Poor`}`);
                let MutualServers = (`${ms.map(guild => `${thingy}${guild.name}${thingy}`).join(`**, **`)}`);
                let Banner = (`${user.bannerURL ? `${user.bannerURL({dynamic: true })}${user.bannerURL({dynamic: true }) !== null ? `?size=1024&quot` : ``}` : `poor nerd has no nitro :skull:`}`);
                let pfp = (`${user.displayAvatarURL ? `${user.displayAvatarURL({dynamic: true })}` : `}null`}`);
                channel.messages.fetch({
                    limit: 100
                }).then(messages => {
                    let userMessages = messages.filter(msg => msg.author.id === user.id);
                    let messageCount = userMessages.size;

                    message.reply(`⏁ info on **${user.tag}** ||${user.id}||
>>> _ _          
**Bio:**
${bio}

            **Created:** ${thingy}${user.createdAt}${thingy}
            **Recent messages sent in this channel:** ${thingy}${messageCount}${thingy}
          
            **HexAccentColor:** ${thingy}${HexAccentColor}${thingy}
            **Hex Theme Color:** ${thingy}${HexThemeColor}${thingy}
            **Nitro Type:** ${thingy}${NitroType}${thingy}
            **Nitro Guild Member Since:** ${thingy}${premiumGuildSince}${thingy}
            **Nitro Since:** ${thingy}${premiumSince}${thingy}

**Mutual Servers:**
 ${MutualServers}

**Banner:** ${Banner}
**Profile Picture:** ${pfp}
            `)
                });
            }).catch(console.error);
        }
    }
}