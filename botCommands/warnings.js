const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Warnings } = require('../database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View warnings for a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to check warnings')
        .setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');

    try {
      const warnings = await Warnings.findAll({
        where: {
          userId: targetUser.id,
          guildId: interaction.guild.id,
        },
        order: [['timestamp', 'DESC']],
      });

      if (warnings.length === 0) {
        return await interaction.reply({
          content: `✅ ${targetUser.tag} has no warnings!`,
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle(`⚠️ Warnings for ${targetUser.tag}`)
        .setThumbnail(targetUser.displayAvatarURL())
        .setDescription(`Total warnings: **${warnings.length}**`)
        .setTimestamp();

      warnings.slice(0, 10).forEach((warn, index) => {
        const date = new Date(warn.timestamp).toLocaleDateString();
        embed.addFields({
          name: `Warning #${warnings.length - index}`,
          value: `**Reason:** ${warn.reason}\n**Moderator:** <@${warn.moderatorId}>\n**Date:** ${date}`,
          inline: false
        });
      });

      if (warnings.length > 10) {
        embed.setFooter({ text: `Showing 10 of ${warnings.length} warnings` });
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Warnings check error:', error);
      await interaction.reply({
        content: '❌ Failed to retrieve warnings!',
        ephemeral: true
      });
    }
  },
};
