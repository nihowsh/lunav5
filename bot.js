const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Web server running");
});
const { Client, GatewayIntentBits, Collection, Partials, EmbedBuilder } = require('discord.js');
const { Client: SelfbotClient } = require('discord.js-selfbot-v13');
const Sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');
const { AttachmentRules: SharedAttachmentRules, AutoModConfig, WordFilter, ScheduledMentions, LogSettings, Warnings } = require('./database');
require('dotenv').config();

// ============== CONFIGURATION ==============
let config = {};
if (fs.existsSync('config.json')) {
  config = JSON.parse(fs.readFileSync('config.json'));
}

const BOT_TOKEN = process.env.BOT_TOKEN || config.token;
const OWNER_ID = process.env.OWNER_ID || null;
const PASSCODE = process.env.PASSCODE || config.passcode;
const HEARTBEAT_CHANNEL = process.env.HEARTBEAT_CHANNEL || 'bot-logs';
const HEARTBEAT_INTERVAL_MS = parseInt(process.env.HEARTBEAT_INTERVAL_MS) || 1000 * 60 * 60 * 3;

// ============== REGULAR BOT ==============
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

// ============== SELFBOT CLIENT (for sending DMs from user account) ==============
let selfbotClient = null;
let currentSelfbotToken = null;

client.commands = new Collection();

// Load slash commands
const commandsPath = path.join(__dirname, 'botCommands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) client.commands.set(command.data.name, command);
  }
}

// ============== DATABASE SETUP ==============
const sequelize = new Sequelize("database", "username", "password", {
  host: "localhost",
  dialect: "sqlite",
  storage: "database.sqlite",
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

// Guild settings for invite threshold and roles
const GuildSettings = sequelize.define("guildSettings", {
  guildId: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  inviteThreshold: {
    type: Sequelize.INTEGER,
    defaultValue: 3,
  },
  inviteRoles: {
    type: Sequelize.JSON,
    defaultValue: {}, // { "3": "roleId1", "5": "roleId2" }
  },
});

// Moderation settings
const ModSettings = sequelize.define("modSettings", {
  guildId: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  automodEnabled: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  spamLimit: {
    type: Sequelize.INTEGER,
    defaultValue: 5,
  },
  spamTime: {
    type: Sequelize.INTEGER,
    defaultValue: 2000, // 2 seconds
  },
  linkBlacklist: {
    type: Sequelize.JSON,
    defaultValue: ["discord.gg", "discordapp.com/invite", "youtube.com", "youtu.be", "spotify.com"],
  },
  mutedRoleId: {
    type: Sequelize.STRING,
  },
  automodLogChannel: {
    type: Sequelize.STRING,
  },
});

sequelize.sync();

// Expose models to client for command access
client.scheduledMentionsModel = ScheduledMentions;

// ============== PERSISTENCE FILES ==============
const inviteCountsFile = path.join(__dirname, 'invite_counts.json');
let inviteCounts = {};
try { inviteCounts = JSON.parse(fs.readFileSync(inviteCountsFile)); } catch (e) { inviteCounts = {}; }

const triggerFile = path.join(__dirname, 'selfbot_trigger.json');
let lastTriggerTimestamp = 0;

// Clear old trigger file on startup to prevent using stale tokens
if (fs.existsSync(triggerFile)) {
  try {
    const data = JSON.parse(fs.readFileSync(triggerFile));
    const now = Date.now();
    const fileAge = now - (data.timestamp || 0);
    // If trigger file is older than 5 minutes, delete it
    if (fileAge > 300000) {
      fs.unlinkSync(triggerFile);
      console.log('🗑️ Cleared old selfbot trigger file');
    }
  } catch (err) {
    // If file is corrupt, delete it
    fs.unlinkSync(triggerFile);
    console.log('🗑️ Cleared corrupt selfbot trigger file');
  }
}

// Global broadcast state variables
global.broadcastInProgress = false;
global.stopBroadcast = false;

// invite cache: map guildId -> Map<code, uses>
client.inviteCache = new Map();

// spam tracker
const messageWindows = new Map();

// ============== UTILITY FUNCTIONS ==============
async function logEvent(guild, text) {
  console.log(text);
  try {
    const channel = guild ? guild.channels.cache.find(ch => ch.name === HEARTBEAT_CHANNEL && ch.isTextBased()) : null;
    if (channel) channel.send(text).catch(() => {});
  } catch (err) { console.error('logEvent error', err); }
}

// Log to moderation/command log channel
async function logToModChannel(guild, embed) {
  try {
    let logSettings = await LogSettings.findOne({ where: { guildId: guild.id } });
    if (!logSettings || !logSettings.logChannelId) return;
    
    const channel = guild.channels.cache.get(logSettings.logChannelId);
    if (!channel || !channel.isTextBased()) return;
    
    await channel.send({ embeds: [embed] }).catch(err => console.error('Failed to send log embed:', err.message));
  } catch (err) { console.error('logToModChannel error:', err); }
}

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============== ERROR HANDLERS ==============
process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (err) => {
  // Suppress the known ClientUserSettingManager bug in selfbot library
  if (err && err.message && err.message.includes('ClientUserSettingManager')) {
    return; // Ignore this specific error
  }
  if (err && err.stack && err.stack.includes('ClientUserSettingManager')) {
    return; // Ignore this specific error
  }
  console.error('Unhandled Rejection:', err);
});

// ============== BOT: READY ==============
client.once('ready', async () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);

  // cache invites for all guilds
  for (const [guildId, guild] of client.guilds.cache) {
    try {
      const invites = await guild.invites.fetch();
      const map = new Map();
      for (const [code, invite] of invites) map.set(code, invite.uses || 0);
      client.inviteCache.set(guildId, map);
      console.log(`Cached invites for guild ${guild.name} (${guildId})`);
    } catch (err) {
      console.error(`Failed to fetch invites for guild ${guildId}:`, err.message);
    }
  }

  // heartbeat
  setInterval(async () => {
    for (const [id, guild] of client.guilds.cache) {
      try {
        await logEvent(guild, `💓 Still alive — ${new Date().toISOString()}`);
      } catch (err) { }
    }
  }, HEARTBEAT_INTERVAL_MS);
});

// ============== BOT: INVITE CACHE MANAGEMENT ==============
client.on('inviteCreate', invite => {
  const guildId = invite.guild.id;
  const map = client.inviteCache.get(guildId) || new Map();
  map.set(invite.code, invite.uses || 0);
  client.inviteCache.set(guildId, map);
});
client.on('inviteDelete', invite => {
  const guildId = invite.guild.id;
  const map = client.inviteCache.get(guildId) || new Map();
  map.delete(invite.code);
  client.inviteCache.set(guildId, map);
});

// ============== BOT: MEMBER JOIN HANDLER ==============
// Anti-raid tracking
if (!global.guildJoinTimestamps) global.guildJoinTimestamps = new Map();

client.on('guildMemberAdd', async member => {
  try {
    const guild = member.guild;
    const accountAgeMs = Date.now() - member.user.createdTimestamp;
    const threeDaysMs = 1000 * 60 * 60 * 24 * 3;
    const isAlt = accountAgeMs < threeDaysMs;

    // Anti-raid detection (configurable)
    let config = await AutoModConfig.findOne({ where: { guildId: guild.id } });
    if (!config) {
      config = await AutoModConfig.create({ guildId: guild.id });
    }

    if (config.raidProtectionEnabled) {
      const now = Date.now();
      const guildJoins = global.guildJoinTimestamps.get(guild.id) || [];
      guildJoins.push(now);
      const recentJoins = guildJoins.filter(t => now - t < config.raidTimeWindow);
      global.guildJoinTimestamps.set(guild.id, recentJoins);
      
      if (recentJoins.length >= config.raidJoinThreshold) {
        await logEvent(guild, `🚨 **RAID ALERT!** ${recentJoins.length} members joined in the last ${config.raidTimeWindow / 1000} seconds!`);
        
        // Auto-lockdown if enabled
        if (config.autoLockdownOnRaid) {
          try {
            const everyoneRole = guild.roles.everyone;
            await logEvent(guild, `🔒 **AUTO-LOCKDOWN ACTIVATED!** Locking all channels due to raid detection.`);
            
            // Lock all text channels by denying SendMessages permission
            let lockedCount = 0;
            for (const channel of guild.channels.cache.values()) {
              if (channel.isTextBased() && channel.permissionsFor(everyoneRole).has('SendMessages')) {
                await channel.permissionOverwrites.edit(everyoneRole, {
                  SendMessages: false,
                }).catch(() => {});
                lockedCount++;
              }
            }
            await logEvent(guild, `🔒 Locked ${lockedCount} channels. Use /unlockdown to restore normal permissions.`);
          } catch (err) {
            console.error('Auto-lockdown error:', err);
            await logEvent(guild, `⚠️ Failed to activate auto-lockdown: ${err.message}`);
          }
        }
      }
    }

    let usedInviterId = null;
    try {
      const newInvites = await guild.invites.fetch();
      const cached = client.inviteCache.get(guild.id) || new Map();
      for (const [code, invite] of newInvites) {
        const prev = cached.get(code) || 0;
        const nowUses = invite.uses || 0;
        if (nowUses > prev) {
          usedInviterId = invite.inviter ? invite.inviter.id : null;
          break;
        }
      }
      const newMap = new Map();
      for (const [code, inv] of newInvites) newMap.set(code, inv.uses || 0);
      client.inviteCache.set(guild.id, newMap);
    } catch (err) {
      console.error('Error fetching invites on guildMemberAdd:', err.message);
    }

    await logEvent(guild, `🟢 Member joined: ${member.user.tag} (ID: ${member.user.id}) ${isAlt ? '[ALT]' : ''}`);

    if (isAlt) {
      console.log(`Ignoring invite count for alt account ${member.user.tag}`);
      return;
    }

    if (usedInviterId) {
      inviteCounts[usedInviterId] = (inviteCounts[usedInviterId] || 0) + 1;
      fs.writeFileSync(inviteCountsFile, JSON.stringify(inviteCounts, null, 2));
      await logEvent(guild, `📈 Invite recorded: Inviter ${usedInviterId} now has ${inviteCounts[usedInviterId]} invites`);

      try {
        // Get guild settings
        let guildSettings = await GuildSettings.findOne({ where: { guildId: guild.id } });
        if (!guildSettings) {
          guildSettings = await GuildSettings.create({ guildId: guild.id });
        }

        const inviteCount = inviteCounts[usedInviterId];
        const inviteRoles = guildSettings.inviteRoles || {};
        
        // Check if this invite count triggers any role
        if (inviteRoles[inviteCount]) {
          const roleId = inviteRoles[inviteCount];
          const role = guild.roles.cache.get(roleId);
          if (!role) {
            await logEvent(guild, `⚠️ Auto-role failed: Role not found for threshold ${inviteCount}`);
          } else {
            const inviter = await guild.members.fetch(usedInviterId).catch(() => null);
            if (inviter && !inviter.roles.cache.has(role.id)) {
              inviter.roles.add(role).then(() => logEvent(guild, `✅ Gave '${role.name}' role to ${inviter.user.tag} (${inviteCount} invites)`)).catch(err => logEvent(guild, `Failed to add role: ${err.message}`));
            }
          }
        }
      } catch (err) { console.error('Auto-role error', err); }
    }
  } catch (err) {
    console.error('guildMemberAdd handler error', err);
  }
});

// Helper function to add warning and check for auto-actions
async function addWarningAndCheckActions(guild, user, reason) {
  try {
    await Warnings.create({
      userId: user.id,
      guildId: guild.id,
      reason: reason,
      moderatorId: client.user.id,
      timestamp: new Date(),
    });

    const warnCount = await Warnings.count({
      where: { guildId: guild.id, userId: user.id },
    });

    const config = await AutoModConfig.findOne({ where: { guildId: guild.id } });
    if (!config) return warnCount;

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return warnCount;

    if (warnCount >= config.autoBanThreshold) {
      await member.ban({ reason: `Auto-ban: ${warnCount} warnings` }).catch(() => {});
      await logEvent(guild, `🔨 Auto-banned ${user.tag} (${warnCount} warnings)`);
    } else if (warnCount >= config.autoKickThreshold) {
      await member.kick(`Auto-kick: ${warnCount} warnings`).catch(() => {});
      await logEvent(guild, `👢 Auto-kicked ${user.tag} (${warnCount} warnings)`);
    } else if (warnCount >= config.autoMuteThreshold) {
      const muteRole = guild.roles.cache.find(r => r.name === 'Muted');
      if (muteRole) {
        await member.roles.add(muteRole).catch(() => {});
        await logEvent(guild, `🔇 Auto-muted ${user.tag} (${warnCount} warnings)`);
      }
    }

    return warnCount;
  } catch (err) {
    console.error('addWarningAndCheckActions error:', err);
    return 0;
  }
}

// ============== BOT: MODERATION FILTERS ==============
client.on('messageCreate', async message => {
  try {
    if (!message.guild) return;
    if (message.author.bot) return;

    const member = message.member;
    const isOwner = (OWNER_ID && message.author.id === OWNER_ID) || member.roles.cache.some(r => r.name === 'Owner');
    if (isOwner) return;

    const now = Date.now();

    let config = await AutoModConfig.findOne({ where: { guildId: message.guild.id } });
    if (!config) {
      config = await AutoModConfig.create({ guildId: message.guild.id });
    }

    // Check attachment rules
    if (message.attachments.size > 0) {
      const rule = await SharedAttachmentRules.findOne({
        where: {
          guildId: message.guild.id,
          channelId: message.channel.id,
          enabled: true,
        },
      });

      if (rule) {
        const hasRequiredPhrase = message.content.toLowerCase().includes(rule.requiredPhrase.toLowerCase());
        if (!hasRequiredPhrase) {
          try {
            await message.delete();
            await message.channel.send(`${message.author}, your message was deleted because attachments in this channel must include the phrase: \`${rule.requiredPhrase}\``).then(msg => {
              setTimeout(() => msg.delete().catch(() => {}), 10000);
            });
            await logEvent(message.guild, `📎 Deleted attachment from ${message.author.tag} in ${message.channel.name}: Missing required phrase "${rule.requiredPhrase}"`);
          } catch (err) {
            console.error('Failed to delete attachment rule violation:', err);
          }
          return;
        }
      }
    }

    // Word filter check
    const wordFilters = await WordFilter.findAll({
      where: { guildId: message.guild.id, enabled: true },
    });

    for (const filter of wordFilters) {
      if (message.content.toLowerCase().includes(filter.word.toLowerCase())) {
        await message.delete().catch(() => {});
        
        if (filter.action === 'warn') {
          const warnCount = await addWarningAndCheckActions(message.guild, message.author, `Used filtered word: ${filter.word}`);
          await message.channel.send(`${message.author}, you have been warned for using a filtered word. (Warning ${warnCount})`).then(msg => {
            setTimeout(() => msg.delete().catch(() => {}), 10000);
          });
        } else if (filter.action === 'mute') {
          const muteRole = message.guild.roles.cache.find(r => r.name === 'Muted');
          if (muteRole) {
            await member.roles.add(muteRole).catch(() => {});
            await logEvent(message.guild, `🔇 Muted ${message.author.tag} for using filtered word: ${filter.word}`);
          }
        }
        
        await logEvent(message.guild, `🚫 Deleted message from ${message.author.tag} containing filtered word: ${filter.word}`);
        return;
      }
    }

    // @everyone spam
    if (message.mentions.everyone) {
      await message.delete().catch(() => {});
      await logEvent(message.guild, `🚫 Deleted @everyone message from ${message.author.tag}`);
      return;
    }

    // Link filtering (configurable)
    if (config.linkFilterEnabled) {
      const linkRegex = /(discord\.gg|discordapp\.com\/invite|youtube\.com|youtu\.be|spotify\.com|https?:\/\/)/i;
      if (linkRegex.test(message.content)) {
        await message.delete().catch(() => {});
        await logEvent(message.guild, `🔗 Deleted link message from ${message.author.tag}: ${message.content}`);
        return;
      }
    }

    // Spam detection (configurable)
    if (config.spamEnabled) {
      const window = messageWindows.get(message.author.id) || [];
      window.push(now);
      const cutoff = now - config.spamTimeWindow;
      const recent = window.filter(t => t > cutoff);
      messageWindows.set(message.author.id, recent);
      
      if (recent.length >= config.spamMessageLimit) {
        try {
          const fetched = await message.channel.messages.fetch({ limit: 20 });
          const userMsgs = fetched.filter(m => m.author.id === message.author.id && Date.now() - m.createdTimestamp < config.spamTimeWindow);
          for (const m of userMsgs.values()) await m.delete().catch(() => {});
        } catch (err) { }
        
        if (config.spamMuteEnabled) {
          const muteRole = message.guild.roles.cache.find(r => r.name === 'Muted');
          if (muteRole) {
            await member.roles.add(muteRole).catch(() => {});
            await logEvent(message.guild, `🔇 Auto-muted ${message.author.tag} for spamming`);
            setTimeout(async () => {
              await member.roles.remove(muteRole).catch(() => {});
            }, config.spamMuteDuration);
          }
        }
        
        await logEvent(message.guild, `💨 Anti-spam: Deleted messages from ${message.author.tag}`);
        return;
      }
    }

    // Duplicate message detection (configurable)
    if (config.duplicateMessageEnabled) {
      if (!global.userLastMessages) global.userLastMessages = new Map();
      const userLastMsg = global.userLastMessages.get(message.author.id);
      if (userLastMsg && userLastMsg.content === message.content && userLastMsg.content.length > 10) {
        const timeDiff = now - userLastMsg.timestamp;
        if (timeDiff < 30000) {
          await message.delete().catch(() => {});
          await logEvent(message.guild, `📋 Duplicate message deleted from ${message.author.tag}`);
          return;
        }
      }
      global.userLastMessages.set(message.author.id, { content: message.content, timestamp: now });
    }

    // Emoji spam detection
    const emojiCount = (message.content.match(/<a?:\w+:\d+>/g) || []).length;
    if (emojiCount > 10) {
      await message.delete().catch(() => {});
      await logEvent(message.guild, `😀 Emoji spam deleted from ${message.author.tag} (${emojiCount} custom emojis)`);
      return;
    }

    // Caps lock filter
    if (message.content.length > 10) {
      const letters = message.content.replace(/[^a-zA-Z]/g, '');
      if (letters.length > 10) {
        const capsCount = (message.content.match(/[A-Z]/g) || []).length;
        const capsPercentage = (capsCount / letters.length) * 100;
        if (capsPercentage > 70) {
          await message.delete().catch(() => {});
          await logEvent(message.guild, `🔠 Excessive caps deleted from ${message.author.tag}`);
          return;
        }
      }
    }

    // Mention spam protection (configurable)
    if (config.mentionSpamEnabled && message.mentions.users.size > config.mentionSpamLimit) {
      await message.delete().catch(() => {});
      await logEvent(message.guild, `👥 Mention spam deleted from ${message.author.tag} (${message.mentions.users.size} mentions)`);
      return;
    }
  } catch (err) { console.error('messageCreate filter error', err); }
});

// ============== BOT: INTERACTION HANDLING ==============
client.on('interactionCreate', async interaction => {
  try {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    
    // Log command execution
    if (interaction.guild) {
      try {
        let logSettings = await LogSettings.findOne({ where: { guildId: interaction.guild.id } });
        if (logSettings && logSettings.logChannelId && logSettings.logCommands) {
          const { EmbedBuilder } = require('discord.js');
          const logEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📝 Command Executed')
            .addFields(
              { name: 'Command', value: `\`/${interaction.commandName}\`` },
              { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})` },
              { name: 'Channel', value: `${interaction.channel.name} (${interaction.channelId})` },
              { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
            );
          await logToModChannel(interaction.guild, logEmbed);
        }
      } catch (err) { console.error('Command logging error:', err); }
    }
    
    await command.execute(interaction, client);
  } catch (err) {
    console.error('interactionCreate error', err);
  }
});

// ============== BOT: MESSAGE UPDATE (EDIT) HANDLER ==============
client.on('messageUpdate', async (oldMessage, newMessage) => {
  try {
    if (!newMessage.guild) return;
    if (newMessage.author.bot) return;
    if (oldMessage.content === newMessage.content) return;
    
    let logSettings = await LogSettings.findOne({ where: { guildId: newMessage.guild.id } });
    if (!logSettings || !logSettings.logChannelId || !logSettings.logMessages) return;
    
    const { EmbedBuilder } = require('discord.js');
    const logEmbed = new EmbedBuilder()
      .setColor('#ffaa00')
      .setTitle('✏️ Message Edited')
      .addFields(
        { name: 'User', value: `${newMessage.author.tag} (${newMessage.author.id})` },
        { name: 'Channel', value: `${newMessage.channel.name} (${newMessage.channelId})` },
        { name: 'Old Content', value: oldMessage.content.substring(0, 1024) || '*(empty)*' },
        { name: 'New Content', value: newMessage.content.substring(0, 1024) || '*(empty)*' },
        { name: 'Message Link', value: `[Jump to message](${newMessage.url})` },
        { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
      );
    
    await logToModChannel(newMessage.guild, logEmbed);
  } catch (err) { console.error('messageUpdate handler error:', err); }
});

// ============== BOT: MESSAGE DELETE HANDLER ==============
client.on('messageDelete', async message => {
  try {
    if (!message.guild) return;
    if (message.author && message.author.bot) return;
    
    let logSettings = await LogSettings.findOne({ where: { guildId: message.guild.id } });
    if (!logSettings || !logSettings.logChannelId || !logSettings.logMessages) return;
    
    const { EmbedBuilder } = require('discord.js');
    const logEmbed = new EmbedBuilder()
      .setColor('#ff3333')
      .setTitle('🗑️ Message Deleted')
      .addFields(
        { name: 'User', value: message.author ? `${message.author.tag} (${message.author.id})` : 'Unknown User' },
        { name: 'Channel', value: `${message.channel.name} (${message.channelId})` },
        { name: 'Content', value: message.content.substring(0, 1024) || '*(empty/embed)*' },
        { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
      );
    
    await logToModChannel(message.guild, logEmbed);
  } catch (err) { console.error('messageDelete handler error:', err); }
});

// ============== BOT: TRIGGER WATCHER FOR MASS DM ==============
function watchSelfbotTrigger() {
  setInterval(async () => {
    if (!fs.existsSync(triggerFile)) return;
    try {
      const data = JSON.parse(fs.readFileSync(triggerFile));
      if (!data.serverId || !data.message || !data.userToken) return;
      if (data.timestamp && data.timestamp <= lastTriggerTimestamp) return;
      
      // Helper function to send message to both console and channel
      const sendUpdate = async (message) => {
        console.log(message);
        if (data.channelId) {
          try {
            const channel = await client.channels.fetch(data.channelId);
            if (channel) await channel.send(message);
          } catch (err) {
            console.log(`⚠️ Could not send update to channel: ${err.message}`);
          }
        }
      };
      
      // Only process triggers from the last 10 minutes (prevent old triggers)
      const triggerAge = Date.now() - data.timestamp;
      if (triggerAge > 600000) {
        console.log('⚠️ Ignoring old selfbot trigger (>10 minutes old)');
        fs.unlinkSync(triggerFile);
        return;
      }
      
      lastTriggerTimestamp = data.timestamp;
      
      // Create or reuse selfbot client with the provided token
      if (!selfbotClient || currentSelfbotToken !== data.userToken) {
        currentSelfbotToken = data.userToken;
        selfbotClient = new SelfbotClient({ 
          checkUpdate: false,
          partials: ['USER', 'CHANNEL', 'GUILD_MEMBER', 'MESSAGE']
        });
        
        // Suppress errors
        selfbotClient.on('error', () => {});
        
        let loginSuccess = false;
        
        try {
          await selfbotClient.login(data.userToken);
          loginSuccess = true;
          await sendUpdate(`✅ Selfbot logged in as ${selfbotClient.user.tag}`);
        } catch (err) {
          await sendUpdate(`❌ **Failed to login selfbot:** ${err.message}\n\nPlease check that your user token is valid and try again.`);
          fs.unlinkSync(triggerFile);
          return;
        }
        
        if (loginSuccess) {
          // Wait for guilds to properly load - increased timeout
          await sendUpdate('⏳ Waiting for guilds to load...');
          await sleep(8000); // 8 seconds for full initialization
          
          await sendUpdate(`📊 Selfbot has access to ${selfbotClient.guilds.cache.size} servers`);
          
          if (selfbotClient.guilds.cache.size === 0) {
            await sendUpdate('⚠️ No servers loaded yet, waiting another 5 seconds...');
            await sleep(5000);
            await sendUpdate(`📊 Now has access to ${selfbotClient.guilds.cache.size} servers`);
          }
        }
      }
      
      const guild = selfbotClient.guilds.cache.get(data.serverId);
      if (!guild) {
        const availableServers = Array.from(selfbotClient.guilds.cache.values()).map(g => `${g.name} (${g.id})`).join('\n');
        await sendUpdate(`❌ **Server not found for broadcast!**\n\n**Server ID provided:** ${data.serverId}\n\n**Available servers:**\n${availableServers || 'None'}\n\nPlease check the server ID and try again.`);
        fs.unlinkSync(triggerFile);
        return;
      }
      await guild.members.fetch();
      
      const members = Array.from(guild.members.cache.values()).filter(
        m => !m.user.bot && m.user.id !== selfbotClient.user.id
      );
      
      let sent = 0;
      let failed = 0;
      const startTime = new Date().toLocaleString();
      const totalMembers = members.length;
      
      global.broadcastInProgress = true;
      global.stopBroadcast = false;
      
      await sendUpdate(`📤 Starting broadcast to ${totalMembers} members...`);
      
      for (let i = 0; i < members.length; i++) {
        // Check if stop was requested
        if (global.stopBroadcast) {
          const stopMsg = `⛔ **Broadcast stopped by user!**\n\n✅ Messages sent before stop: **${sent}/${totalMembers}**\n❌ Messages failed: **${failed}**`;
          await sendUpdate(stopMsg);
          global.broadcastInProgress = false;
          global.stopBroadcast = false;
          break;
        }
        
        const member = members[i];
        try {
          await member.send(data.message);
          sent++;
        } catch (err) {
          failed++;
        }
        
        // Progress report and cooldown every 10 DMs
        if ((i + 1) % 10 === 0) {
          const progressPercent = Math.round(((i + 1) / totalMembers) * 100);
          const progressMsg = `📊 **PROGRESS REPORT - Batch ${Math.ceil((i + 1) / 10)}**\n\n✅ Sent: **${sent}/${totalMembers}** (${progressPercent}%)\n❌ Failed: **${failed}**\n⏰ Time: ${new Date().toLocaleString()}`;
          
          await sendUpdate(progressMsg);
          
          // Wait 3-8 minutes after every 10 DMs (but not after the last batch)
          if (i + 1 < members.length) {
            const cooldownMs = getRandomDelay(180000, 480000);
            const cooldownMin = Math.round(cooldownMs / 60000);
            await sendUpdate(`⏳ Waiting ${cooldownMin} minutes before next batch...`);
            await sleep(cooldownMs);
          }
        } else {
          // Random delay of 12-35 seconds between each DM
          const delayMs = getRandomDelay(12000, 35000);
          await sleep(delayMs);
        }
      }
      
      global.broadcastInProgress = false;
      const finalMsg = `✨ **Broadcast Complete!**\n\n📅 Started: ${startTime}\n📅 Finished: ${new Date().toLocaleString()}\n\n✅ Total Sent: **${sent}/${totalMembers}**\n❌ Total Failed: **${failed}**`;
      
      await sendUpdate(finalMsg);
      fs.unlinkSync(triggerFile);
    } catch (err) {
      console.error('Trigger watcher error:', err);
      global.broadcastInProgress = false;
    }
  }, 5000);
}

watchSelfbotTrigger();

// ============== SCHEDULED MENTIONS ==============
function checkScheduledMentions() {
  setInterval(async () => {
    try {
      const schedules = await ScheduledMentions.findAll({
        where: { enabled: true },
      });

      for (const schedule of schedules) {
        const now = new Date();
        const lastMention = schedule.lastMentionTime ? new Date(schedule.lastMentionTime) : null;
        
        // Check if it's time to send a mention
        const shouldSend = !lastMention || 
          (now - lastMention) >= (schedule.intervalHours * 60 * 60 * 1000);

        if (shouldSend) {
          try {
            const channel = await client.channels.fetch(schedule.channelId);
            if (channel && channel.isTextBased()) {
              const message = await channel.send('@everyone');
              // Delete the message immediately
              setTimeout(async () => {
                try {
                  await message.delete();
                } catch (err) {
                  console.error('Failed to delete scheduled mention:', err);
                }
              }, 100);

              // Update last mention time
              schedule.lastMentionTime = now;
              await schedule.save();

              console.log(`📢 Sent scheduled mention in ${channel.name} (Guild: ${schedule.guildId})`);
            }
          } catch (err) {
            console.error('Failed to send scheduled mention:', err);
          }
        }
      }
    } catch (err) {
      console.error('Scheduled mentions checker error:', err);
    }
  }, 60000); // Check every minute
}

checkScheduledMentions();

// ============== LOGIN ==============
client.login(BOT_TOKEN).catch(err => console.error('Failed to login:', err));
