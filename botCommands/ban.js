const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logModerationAction } = require('./loggingUtils.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(option =>
      option.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for ban').setRequired(false))
    .addIntegerOption(option =>
      option.setName('deletedays').setDescription('Delete messages from this many days (0-7)').setRequired(false).setMinValue(0).setMaxValue(7))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  
  async execute(interaction) {
    await interaction.deferReply();

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteMessageDays = interaction.options.getInteger('deletedays') || 0;

    try {
      await interaction.guild.members.ban(user.id, { reason, deleteMessageSeconds: deleteMessageDays * 86400 });
      
      // Log the action
      await logModerationAction(interaction.guild, 'Banned', interaction.user, user, reason, { 'Messages Deleted': `${deleteMessageDays} days` });
      
      await interaction.editReply({
        content: `✅ **${user.tag}** has been banned!\n\n📝 Reason: ${reason}\n🗑️ Deleted messages from: ${deleteMessageDays} days`
      });
    } catch (err) {
      await interaction.editReply({ content: `❌ Error banning user: ${err.message}` });
    }
  },
};
