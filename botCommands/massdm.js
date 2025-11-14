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
    .setName('massdm')
    .setDescription('Mass DM all members - requires passcode')
    .addStringOption(opt => opt.setName('passcode').setDescription('Passcode required to use this command').setRequired(true))
    .addStringOption(opt => opt.setName('message').setDescription('Message to send').setRequired(true))
    .addStringOption(opt => opt.setName('attachment').setDescription('Optional attachment URL').setRequired(false)),

  async execute(interaction, client) {
    const passcode = interaction.options.getString('passcode');
    
    // Check passcode FIRST - no exceptions, not even for owner
    if (passcode !== PASSCODE) {
      return await interaction.reply({
        content: '❌ **Invalid passcode!** Access denied.',
        ephemeral: true
      });
    }

    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });

    const member = await guild.members.fetch(interaction.user.id).catch(() => null);
    if (!member) return interaction.reply({ content: 'Could not fetch your member object.', ephemeral: true });

    const content = interaction.options.getString('message');
    const attachment = interaction.options.getString('attachment');

    await interaction.reply({ content: '✅ Starting mass DM. Updates will be posted in this channel.', ephemeral: true });

    // fetch members and DM (skip bots and offline if you prefer)
    await guild.members.fetch();
    const members = guild.members.cache.filter(m => !m.user.bot && m.id !== client.user.id);
    const totalMembers = members.size;
    let sent = 0;
    let failed = 0;
    const startTime = new Date().toLocaleString();
    
    await interaction.channel.send(`📤 Starting mass DM to ${totalMembers} members...`);
    
    let index = 0;
    for (const m of members.values()) {
      index++;
      try {
        const dmPayload = { content };
        if (attachment) dmPayload.files = [attachment];
        await m.send(dmPayload);
        sent++;
      } catch (err) {
        failed++;
      }
      
      // Progress report every 10 members
      if (index % 10 === 0) {
        const progressPercent = Math.round((index / totalMembers) * 100);
        await interaction.channel.send(`📊 **PROGRESS REPORT**\n\n✅ Sent: **${sent}/${totalMembers}** (${progressPercent}%)\n❌ Failed: **${failed}**\n⏰ Time: ${new Date().toLocaleString()}`);
      }
      
      // small delay to reduce rate-limit issues
      await new Promise(r => setTimeout(r, 1000));
    }

    await interaction.channel.send(`✨ **Mass DM Complete!**\n\n📅 Started: ${startTime}\n📅 Finished: ${new Date().toLocaleString()}\n\n✅ Total Sent: **${sent}/${totalMembers}**\n❌ Total Failed: **${failed}**`);
  }
};
