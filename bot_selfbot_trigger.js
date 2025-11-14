// This is a sample Discord bot command using discord.js v14
// It creates a /selfbot command that collects user token, server ID, and message, then writes to selfbot_trigger.json

const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('selfbot')
    .setDescription('Trigger the selfbot broadcast')
    .addStringOption(option =>
      option.setName('usertoken').setDescription('User token for selfbot').setRequired(true))
    .addStringOption(option =>
      option.setName('serverid').setDescription('Server ID to broadcast in').setRequired(true))
    .addStringOption(option =>
      option.setName('message').setDescription('Message to send').setRequired(true)),
  async execute(interaction) {
    const userToken = interaction.options.getString('usertoken');
    const serverId = interaction.options.getString('serverid');
    const message = interaction.options.getString('message');
    // Write trigger file
    fs.writeFileSync('selfbot_trigger.json', JSON.stringify({ userToken, serverId, message, timestamp: Date.now() }, null, 2));
    await interaction.reply('Selfbot trigger written. The selfbot will broadcast your message soon.');
  }
};
