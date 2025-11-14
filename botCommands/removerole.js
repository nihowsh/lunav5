const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('Remove a role from a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to remove role from')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Role to remove')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const member = await interaction.guild.members.fetch(targetUser.id);

    if (!member) {
      return await interaction.reply({
        content: '❌ User not found in this server!',
        ephemeral: true
      });
    }

    if (!member.roles.cache.has(role.id)) {
      return await interaction.reply({
        content: `❌ ${targetUser.tag} doesn't have the ${role.name} role!`,
        ephemeral: true
      });
    }

    try {
      await member.roles.remove(role);
      await interaction.reply({
        content: `✅ Removed ${role} from ${targetUser.tag}`,
      });
    } catch (error) {
      console.error('Remove role error:', error);
      await interaction.reply({
        content: '❌ Failed to remove role. Role may be higher than my highest role!',
        ephemeral: true
      });
    }
  },
};
