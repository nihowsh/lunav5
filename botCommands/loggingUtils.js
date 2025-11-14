const { EmbedBuilder } = require('discord.js');
const Sequelize = require('sequelize');

// Database setup
const sequelize = new Sequelize("database", "username", "password", {
  host: "localhost",
  dialect: "sqlite",
  storage: "database.sqlite",
  logging: false
});

const LogSettings = sequelize.define("logSettings", {
  guildId: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  logChannelId: {
    type: Sequelize.STRING,
  },
  logCommands: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  logMessages: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  logMemberActions: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
});

// Log moderation action to the log channel
async function logModerationAction(guild, action, moderator, target, reason, details = {}) {
  try {
    let logSettings = await LogSettings.findOne({ where: { guildId: guild.id } });
    if (!logSettings || !logSettings.logChannelId || !logSettings.logMemberActions) return;
    
    const channel = guild.channels.cache.get(logSettings.logChannelId);
    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(getActionColor(action))
      .setTitle(`🔨 ${action}`)
      .addFields(
        { name: 'Moderator', value: `${moderator.tag} (${moderator.id})`, inline: true },
        { name: 'Target', value: `${typeof target === 'string' ? target : target.tag || 'Unknown'} (${target.id || 'N/A'})`, inline: true },
        { name: 'Reason', value: reason || 'No reason provided' },
        { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
      );

    // Add custom details
    for (const [key, value] of Object.entries(details)) {
      if (value) embed.addFields({ name: key, value: String(value), inline: false });
    }

    await channel.send({ embeds: [embed] }).catch(err => console.error('Failed to send moderation log:', err.message));
  } catch (err) {
    console.error('logModerationAction error:', err);
  }
}

// Log command execution with more details
async function logCommandAction(guild, commandName, user, channelId, details = {}) {
  try {
    let logSettings = await LogSettings.findOne({ where: { guildId: guild.id } });
    if (!logSettings || !logSettings.logChannelId || !logSettings.logCommands) return;
    
    const channel = guild.channels.cache.get(logSettings.logChannelId);
    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📝 Command Executed')
      .addFields(
        { name: 'Command', value: `\`/${commandName}\`` },
        { name: 'User', value: `${user.tag} (${user.id})` },
        { name: 'Channel', value: `<#${channelId}>` },
        { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
      );

    for (const [key, value] of Object.entries(details)) {
      if (value) embed.addFields({ name: key, value: String(value).substring(0, 1024), inline: false });
    }

    await channel.send({ embeds: [embed] }).catch(err => console.error('Failed to send command log:', err.message));
  } catch (err) {
    console.error('logCommandAction error:', err);
  }
}

function getActionColor(action) {
  const colorMap = {
    'Kicked': '#ff6b6b',
    'Banned': '#ff3333',
    'Unbanned': '#00aa00',
    'Muted': '#ffaa00',
    'Unmuted': '#00aa00',
    'Warned': '#ffaa00',
    'Messages Purged': '#ff9900',
    'Channel Locked': '#ff6b6b',
    'Channel Unlocked': '#00aa00',
    'Slowmode Updated': '#0099ff',
    'Automod Action': '#ff0099',
  };
  return colorMap[action] || '#0099ff';
}

module.exports = {
  logModerationAction,
  logCommandAction,
  LogSettings,
  sequelize
};
