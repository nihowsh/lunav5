const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a user by removing the muted role')
    .addUserOption(option =>
      option.setName('user').setDescription('User to unmute').setRequired(true))
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for unmute').setRequired(false))
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
      const muteRole = interaction.guild.roles.cache.find(r => r.name === 'Muted');
      
      if (!muteRole) {
        return await interaction.editReply({ content: '❌ Muted role not found' });
      }

      await member.roles.remove(muteRole, reason);
      await interaction.editReply({
        content: `✅ **${user.tag}** has been unmuted!\n\n📝 Reason: ${reason}`
      });
    } catch (err) {
      await interaction.editReply({ content: `❌ Error unmuting user: ${err.message}` });
    }
  },
};
