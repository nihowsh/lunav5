const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logModerationAction } = require('./loggingUtils.js');
const { Warnings } = require('../database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption(option =>
      option.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for warning').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  
  async execute(interaction) {
    await interaction.deferReply();

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    try {
      // Save warning to database
      await Warnings.create({
        userId: user.id,
        guildId: interaction.guild.id,
        reason: reason,
        moderatorId: interaction.user.id,
      });

      let dmSent = false;
      await user.send({
        content: `⚠️ **You have been warned in ${interaction.guild.name}**\n\n📝 Reason: ${reason}\n\nPlease follow the server rules.`
      }).then(() => { dmSent = true; }).catch(() => {});

      // Log the action
      await logModerationAction(interaction.guild, 'Warned', interaction.user, user, reason, { 'DM Sent': dmSent ? 'Yes' : 'No' });

      const warnCount = await Warnings.count({
        where: {
          userId: user.id,
          guildId: interaction.guild.id,
        },
      });

      await interaction.editReply({
        content: `✅ **${user.tag}** has been warned!\n\n📝 Reason: ${reason}\n⚠️ Total warnings: **${warnCount}**\n\n${dmSent ? '📬 DM sent to user' : '⚠️ Could not send DM'}`
      });
    } catch (err) {
      await interaction.editReply({ content: `❌ Error warning user: ${err.message}` });
    }
  },
};
