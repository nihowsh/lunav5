const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logModerationAction } = require('./loggingUtils.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(option =>
      option.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for kick').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  
  async execute(interaction) {
    await interaction.deferReply();

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(user.id);

    if (!member) {
      return await interaction.editReply({ content: '❌ User not found in this server' });
    }

    try {
      await member.kick(reason);
      
      // Log the action
      await logModerationAction(interaction.guild, 'Kicked', interaction.user, user, reason);
      
      await interaction.editReply({
        content: `✅ **${user.tag}** has been kicked!\n\n📝 Reason: ${reason}`
      });
    } catch (err) {
      await interaction.editReply({ content: `❌ Error kicking user: ${err.message}` });
    }
  },
};
