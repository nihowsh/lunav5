const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server')
    .addStringOption(option =>
      option.setName('userid').setDescription('User ID to unban').setRequired(true))
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for unban').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  
  async execute(interaction) {
    await interaction.deferReply();

    const userId = interaction.options.getString('userid');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    try {
      await interaction.guild.bans.remove(userId, reason);
      await interaction.editReply({
        content: `✅ User **${userId}** has been unbanned!\n\n📝 Reason: ${reason}`
      });
    } catch (err) {
      await interaction.editReply({ content: `❌ Error unbanning user: ${err.message}` });
    }
  },
};
