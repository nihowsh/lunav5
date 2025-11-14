const fs = require("fs");
const path = require('path');
const { Client } = require('discord.js-selfbot-v13');
const Discord = require('discord.js-selfbot-v13');
const { Appembed } = require('kyz');
const Sequelize = require('sequelize');

let config = {};

if (fs.existsSync('config.json')) {
    config = JSON.parse(fs.readFileSync('config.json'));
}

const client = new Client({
        checkUpdate: false
});
const authorizedUsers = new Map();

client.commands = new Discord.Collection();
const commands = fs.readdirSync("./Commands").filter(file => file.endsWith(".js"));
for (file of commands) {
  const commandName = file.split(".")[0]
  const command = require(`./Commands/${commandName}`)
  client.commands.set(commandName, command)
}

MyID = ("null");

client.on('ready', async () => {
    const userPrefix = await Prefix.findOne({
      where: { userId: client.user.id },
    });
    const prefix = userPrefix ? userPrefix.prefix : "";
    MyID = client.user.id;
    authorizedUsers.set(MyID, true);
    console.log(`%cWelcome to TonyskalYT's selfbot script!
    
Name:`, 'color: green; font-weight: bold');
  console.log(`%c${client.user.username}`, 'color: red; font-weight: bold');
  console.log(`%cID:`, 'color: green; font-weight: bold');
  console.log(`%c${MyID}
  `, 'color: red; font-weight: bold');
  
  console.log(`%cTo set your prefix say "SetPrefix (some one letter prefix here)" and to get your prefix say "What's my prefix?"
  
To access a list of your installed commands and how to use them say ${prefix}cmds!`, 'color: green; font-weight: bold');

if (!userPrefix) {
  console.log(`Set a prefix by typing in any discord channel: "SetPrefix !" for example.`)
}
  })

const sequelize = new Sequelize("database", "username", "password", {
    host: "localhost",
    dialect: "sqlite",
    storage: "selfbot_database.sqlite",
    logging: false
  });
  
  const Prefix = sequelize.define("prefix", {
    userId: {
      type: Sequelize.STRING,
      primaryKey: true,
    },
    prefix: {
      type: Sequelize.STRING,
    },
  });
  
  client.on("messageCreate", async message => {
    if (!authorizedUsers.has(message.author.id)) return;
    const userPrefix = await Prefix.findOne({
      where: { userId: client.user.id },
    });
    const prefix = userPrefix ? userPrefix.prefix : "";
    if (message.content.toLowerCase().startsWith(prefix)) {
      const handler = message.content.slice(prefix.length).trim().split(/ +/g);
      const commandName = handler.shift().toLowerCase();
      const command = client.commands.get(commandName);
      if (!command) return;
      command.run(client, message, handler, prefix, config.token, client.user.id, "Discord", "Util", "AutoDelete", "thingy", "xToken");
    } else {
      return void(0);
    }
  });

  sequelize.sync();
  
  client.on("messageCreate", async (message) => {
    if (message.content.toLowerCase().startsWith("setprefix ")) {
      if (message.author.id === MyID) {
        const prefix = message.content.split(" ")[1];
        if (prefix.length !== 1) {
          const setPrefixError1 = new Appembed()
          .setAuthor(`Error!`)
          .setDescription(`Prefix must be ONE character long!`)
          .setProvider("TonyskalYTs selfbot")
          .setColor("#FF0000")
          .build();

          return message.reply(`${config.longstringoftext} ${setPrefixError1}`);
        }
        if (prefix.match(/[a-zA-Z]/)) {
          const setPrefixError2 = new Appembed()
          .setAuthor(`Error!`)
          .setDescription(`Your prefix cannot be a letter!s`)
          .setProvider("TonyskalYTs selfbot")
          .setColor("#FF0000")
          .build();

          return message.reply(`${config.longstringoftext} ${setPrefixError2}`);
        }
        defaultPrefix = prefix;
        const userPrefix = await Prefix.findOrCreate({
          where: { userId: message.author.id },
          defaults: { prefix: prefix },
        });
        await userPrefix[0].update({ prefix });
        const setPrefixSuccess = new Appembed()
        .setAuthor(`Success!`)
        .setDescription(`Your prefix has been set to ${prefix}`)
        .setProvider("TonyskalYTs selfbot")
        .setColor("#00FF00")
        .build();

        message.reply(`${config.longstringoftext} ${setPrefixSuccess}`);
      } else {
        const userPrefix = await Prefix.findOne({
          where: { userId: message.author.id },
        });
        const prefix = userPrefix ? userPrefix.prefix : defaultPrefix;
      }
    }
  });
  
  client.on("messageCreate", async (message) => {
    const userId = message.author.id;
    if (userId === MyID) {
      if (message.content.toLowerCase().startsWith("what's my prefix?")) {
        const userPrefix = await Prefix.findOne({
          where: { userId: message.author.id },
        });

        if (!userPrefix) {
          const whatsMyPrefixEmbedFail = new Appembed()
          .setAuthor(`Error!`)
          .setDescription(`Prefix not found!\n\nSet a prefix by saying "SetPrefix !" for example, your prefix can be any 1 special character.`)
          .setProvider("TonyskalYTs selfbot")
          .setColor("#FF0000")
          .build();

          message.reply(`${config.longstringoftext} ${whatsMyPrefixEmbedFail}`)
        } else {
        const whatsMyPrefixEmbedSuccess = new Appembed()
        .setAuthor(`Your prefix is:`)
        .setDescription(`${userPrefix.prefix}\n\nIf you want to change your prefix, type "SetPrefix !" for example, your prefix can be any 1 special character.`)
        .setProvider("TonyskalYTs selfbot")
        .setColor("#00FF00")
        .build();
        message.reply(`${config.longstringoftext} ${whatsMyPrefixEmbedSuccess}`)
      }
      }
    }
  });

  client.on("messageCreate", async message => {
    if (message.author.id !== MyID) return
    const userPrefix = await Prefix.findOne({
      where: { userId: MyID },
    });
    const prefix = userPrefix ? userPrefix.prefix : "";
  
    if (message.content.startsWith(`${prefix}aa`)) {
      if (message.author.id !== client.user.id) return;
      const user = message.mentions.users.first();
      if (user === undefined) {
        message.reply("Please mention a user to authorize");
        return
      }
      
      authorizedUsers.set(user.id, true);
      message.reply(`<@${user.id}> has been authorized.`);
    }
  
    if (message.content.startsWith(`${prefix}ra`)) {
      if (message.author.id !== client.user.id) return;
      const user = message.mentions.users.first();
      if (user === undefined) {
        message.reply("Please mention a user to reomove authorization");
        return
      }
      const removed = authorizedUsers.delete(user.id);
      
      if (removed) {
        message.reply(`<@${user.id}> has been removed from authorized users.`);
      } else {
        message.reply(`<@${user.id}> is not an authorized user.`);
      }
    }
  });

  const LC = () => {
    if (!fs.existsSync('./Commands')) {
      console.log('Commands directory not found, returning empty array');
      return [];
    }
    const commandFiles = fs.readdirSync('./Commands').filter(file => file.endsWith('.js'));
  
    const commands = [];
  
    for (const file of commandFiles) {
      const command = require(`./Commands/${file}`);
      commands.push(command);
    }
  
    return commands;
  };
  
  const GLA = () => {
    const commands = LC();
    const linksArray = commands.map(command => command.description);
  
    return linksArray;
  };

  const cmds = GLA();
  
  const reactions = ['⬅️', '➡️'];
  
  client.on('messageCreate', async (message) => {
    try {
    if (!message.author.id === MyID) return;
    const userPrefix = await Prefix.findOne({
      where: { userId: MyID },
    });
    const prefix = userPrefix ? userPrefix.prefix : "";
    if (message.content.toLowerCase().startsWith(`${prefix}cmds`)) {
      if (message.author.id !== MyID) return;
      const total = cmds.length;
      let i = 0;
      let sentMsg;
      const sendCmdMessage = async () => {
        try {
        const userPrefix = await Prefix.findOne({
          where: { userId: MyID },
        });
        const uPrefix = userPrefix ? userPrefix.prefix : "";
        message.channel.send(`${config.longstringoftext} https://appembed.netlify.app/e?description=Total%20downloaded%20commands%3A%20${total}&color=%23FF0000&author=Made%20by%20TonyskalYT%20since%20Febuary%202023.
  ${cmds[i].replace(/VAR/g, uPrefix)}`).then(msg => {
          sentMsg = msg;
          for (const reaction of reactions) {
            sentMsg.react(reaction);
          }
          const filter = (reaction, user) => {
            return reactions.includes(reaction.emoji.name) && user.id !== client.user.id;
          };
          const collector = sentMsg.createReactionCollector(filter, { time: 60000 });
          collector.on('messageReactionRemove', async (reaction, user) => {
            if (user.id === client.user.id) return;
            reaction.users.remove(user.id);
            if (reaction.emoji.name === '⬅️') {
              i = (i - 1 + cmds.length) % cmds.length;
            } else if (reaction.emoji.name === '➡️') {
              i = (i + 1) % cmds.length;
            }
            const userPrefix = await Prefix.findOne({
              where: { userId: MyID },
            });
            const uPrefix = userPrefix ? userPrefix.prefix : "";
            sentMsg.edit(`${config.longstringoftext} https://appembed.netlify.app/e?description=Total%20Public%20commands%3A%20${total}&color=%23FF0000&author=Made%20by%20TonyskalYT%20since%20Febuary%202023.
  ${cmds[i].replace(/VAR/g, uPrefix)}`).then(() => {
              if (reaction.count > 1) {
                sentMsg.react(reaction.emoji);
              }
            });
          });
          collector.on('end', () => {
            try {
            sentMsg.reactions.removeAll().catch(error => console.error('Failed to remove reactions: ', error));
            } catch (err) {
              console.error(err)
            }
          });
        });
        } catch (err) {
          return console.error(err)
        }
      }
      sendCmdMessage();
  
      client.on('messageReactionRemove', async (reaction, user) => {
        if (!reactions.includes(reaction.emoji.name) || !sentMsg || reaction.message.id !== sentMsg.id && user.id === MyID) {
          return;
        }
        if (reaction.emoji.name === '⬅️') {
          i = (i - 1 + cmds.length) % cmds.length;
        } else if (reaction.emoji.name === '➡️') {
          i = (i + 1) % cmds.length;
        }
        const userPrefix = await Prefix.findOne({
          where: { userId: MyID },
        });
        const uPrefix = userPrefix ? userPrefix.prefix : "";
      sentMsg.edit(`${config.longstringoftext} https://appembed.netlify.app/e?description=Total%20Public%20commands%3A%20${total}&color=%23FF0000&author=Made%20by%20TonyskalYT%20since%20Febuary%202023.
  ${cmds[i].replace(/VAR/g, uPrefix)}`).then(() => {
          sentMsg.react(reaction.emoji);
        });
      });
  
      client.on('messageReactionAdd', async (reaction, user) => {
        if (!reactions.includes(reaction.emoji.name) || !sentMsg || reaction.message.id !== sentMsg.id && user.id === MyID) {
          return;
        }
        if (user.id === MyID) return;
        if (reaction.emoji.name === '⬅️') {
          i = (i - 1 + cmds.length) % cmds.length;
        } else if (reaction.emoji.name === '➡️') {
          i = (i + 1) % cmds.length;
        }
        const userPrefix = await Prefix.findOne({
          where: { userId: MyID },
        });
        const uPrefix = userPrefix ? userPrefix.prefix : "";
      sentMsg.edit(`${config.longstringoftext} https://appembed.netlify.app/e?description=Total%20Public%20commands%3A%20${total}&color=%23FF0000&author=Made%20by%20TonyskalYT%20since%20Febuary%202023.
  ${cmds[i].replace(/VAR/g, uPrefix)}`).then(() => {
          sentMsg.react(reaction.emoji);
        });
      });
    }
  } catch (err) {
    void(0)
  }
  });

const triggerFile = path.join(__dirname, 'selfbot_trigger.json');
let lastTriggerTimestamp = 0;

function watchSelfbotTrigger() {
  setInterval(async () => {
    if (!fs.existsSync(triggerFile)) return;
    try {
      const data = JSON.parse(fs.readFileSync(triggerFile));
      if (!data.userToken || !data.serverId || !data.message) return;
      if (data.timestamp && data.timestamp <= lastTriggerTimestamp) return;
      lastTriggerTimestamp = data.timestamp;
      // Run broadcast
      const guild = client.guilds.cache.get(data.serverId);
      if (!guild) {
        console.log('Server not found for broadcast trigger.');
        return;
      }
      await guild.members.fetch();
      let sent = 0;
      let failed = 0;
      for (const [id, member] of guild.members.cache) {
        if (member.user.bot || member.user.id === client.user.id) continue;
        try {
          await member.send(data.message);
          sent++;
        } catch (err) {
          failed++;
        }
      }
      console.log(`Selfbot broadcast finished. Sent: ${sent}, Failed: ${failed}`);
    } catch (err) {
      // Ignore parse errors
    }
  }, 5000); // Check every 5 seconds
}

watchSelfbotTrigger();

client.login(config.token)