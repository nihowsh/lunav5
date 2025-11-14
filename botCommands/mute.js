const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logModerationAction } = require('./loggingUtils.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a user by giving them the muted role')
    .addUserOption(option =>
      option.setName('user').setDescription('User to mute').setRequired(true))
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for mute').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  
  async execute(interaction) {
    await interaction.deferReply();

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(user.id);

    if (!member) {
      return await interaction.editReply({ content: '❌ User not found in this server' });
    }

    try {
      // Find or create muted role
      let muteRole = interaction.guild.roles.cache.find(r => r.name === 'Muted');
      
      if (!muteRole) {
        muteRole = await interaction.guild.roles.create({
          name: 'Muted',
          permissions: [],
          reason: 'Muted role for moderation'
        });
      }

      await member.roles.add(muteRole, reason);
      
      // Log the action
      await logModerationAction(interaction.guild, 'Muted', interaction.user, user, reason);
      
      await interaction.editReply({
        content: `✅ **${user.tag}** has been muted!\n\n📝 Reason: ${reason}`
      });
    } catch (err) {
      await interaction.editReply({ content: `❌ Error muting user: ${err.message}` });
    }
  },
};
