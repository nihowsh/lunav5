const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let config = {};
if (fs.existsSync(path.join(__dirname, '..', 'config.json'))) {
  config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json')));
}

const PASSCODE = process.env.PASSCODE || config.passcode || 'Bella@294';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stopbroadcast')
    .setDescription('Stop an ongoing selfbot broadcast')
    .addStringOption(option =>
      option.setName('passcode').setDescription('Passcode required to use this command').setRequired(true)),
  
  async execute(interaction) {
    const passcode = interaction.options.getString('passcode');
    
    // Check passcode - no exceptions, not even for owner
    if (passcode !== PASSCODE) {
      return await interaction.reply({
        content: '❌ **Invalid passcode!** Access denied.',
        ephemeral: true
      });
    }
    
    if (!global.broadcastInProgress) {
      return await interaction.reply({
        content: '❌ No broadcast is currently running.',
        ephemeral: true
      });
    }

    global.stopBroadcast = true;

    await interaction.reply({
      content: '⛔ Stopping broadcast... The current message being sent will complete, then the broadcast will stop.',
      ephemeral: true
    });
  },
};
