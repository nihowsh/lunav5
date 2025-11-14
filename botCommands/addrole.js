const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addrole')
    .setDescription('Add a role to a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to add role to')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Role to add')
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

    if (member.roles.cache.has(role.id)) {
      return await interaction.reply({
        content: `❌ ${targetUser.tag} already has the ${role.name} role!`,
        ephemeral: true
      });
    }

    try {
      await member.roles.add(role);
      await interaction.reply({
        content: `✅ Added ${role} to ${targetUser.tag}`,
      });
    } catch (error) {
      console.error('Add role error:', error);
      await interaction.reply({
        content: '❌ Failed to add role. Role may be higher than my highest role!',
        ephemeral: true
      });
    }
  },
};
