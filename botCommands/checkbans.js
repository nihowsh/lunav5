const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkbans')
    .setDescription('View all banned users in the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const bans = await interaction.guild.bans.fetch();

      if (bans.size === 0) {
        return await interaction.editReply({ content: '✅ No banned users in this server!' });
      }

      let banList = `📋 **Banned Users (${bans.size}):**\n\n`;
      bans.forEach(ban => {
        banList += `• **${ban.user.tag}** (ID: ${ban.user.id})\n  Reason: ${ban.reason || 'No reason'}\n\n`;
      });

      // Discord has a 2000 character limit, so split if needed
      if (banList.length > 2000) {
        await interaction.editReply({ content: banList.slice(0, 2000) + '\n\n... (truncated)' });
      } else {
        await interaction.editReply({ content: banList });
      }
    } catch (err) {
      await interaction.editReply({ content: `❌ Error fetching bans: ${err.message}` });
    }
  },
};
