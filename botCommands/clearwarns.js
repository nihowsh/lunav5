const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { Warnings } = require('../database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarns')
    .setDescription('Clear all warnings for a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to clear warnings')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');

    try {
      const deleted = await Warnings.destroy({
        where: {
          userId: targetUser.id,
          guildId: interaction.guild.id,
        },
      });

      if (deleted === 0) {
        return await interaction.reply({
          content: `ℹ️ ${targetUser.tag} has no warnings to clear!`,
          ephemeral: true
        });
      }

      await interaction.reply({
        content: `✅ Cleared **${deleted}** warning(s) for ${targetUser.tag}`,
      });
    } catch (error) {
      console.error('Clear warnings error:', error);
      await interaction.reply({
        content: '❌ Failed to clear warnings!',
        ephemeral: true
      });
    }
  },
};
