const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { AttachmentRules } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('attachmentrules')
    .setDescription('Manage attachment rules for channels')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add attachment rule to a channel')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel to apply the rule to')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('phrase')
            .setDescription('Required phrase that must be in messages with attachments')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove attachment rule from a channel')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel to remove the rule from')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all attachment rules in this server')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
      const channel = interaction.options.getChannel('channel');
      const phrase = interaction.options.getString('phrase');

      // Check if rule already exists
      const existingRule = await AttachmentRules.findOne({
        where: {
          guildId: interaction.guild.id,
          channelId: channel.id,
        },
      });

      if (existingRule) {
        existingRule.requiredPhrase = phrase;
        existingRule.enabled = true;
        await existingRule.save();
        return interaction.reply({
          content: `✅ Updated attachment rule for ${channel}!\n\n**Required phrase:** \`${phrase}\`\n\nMessages with attachments that don't contain this phrase will be auto-deleted.`,
          ephemeral: true,
        });
      }

      await AttachmentRules.create({
        guildId: interaction.guild.id,
        channelId: channel.id,
        requiredPhrase: phrase,
        enabled: true,
      });

      return interaction.reply({
        content: `✅ Added attachment rule for ${channel}!\n\n**Required phrase:** \`${phrase}\`\n\nMessages with attachments that don't contain this phrase will be auto-deleted.`,
        ephemeral: true,
      });
    }

    if (subcommand === 'remove') {
      const channel = interaction.options.getChannel('channel');

      const deleted = await AttachmentRules.destroy({
        where: {
          guildId: interaction.guild.id,
          channelId: channel.id,
        },
      });

      if (deleted === 0) {
        return interaction.reply({
          content: `❌ No attachment rule found for ${channel}.`,
          ephemeral: true,
        });
      }

      return interaction.reply({
        content: `✅ Removed attachment rule from ${channel}.`,
        ephemeral: true,
      });
    }

    if (subcommand === 'list') {
      const rules = await AttachmentRules.findAll({
        where: { guildId: interaction.guild.id },
      });

      if (rules.length === 0) {
        return interaction.reply({
          content: '📋 No attachment rules configured in this server.',
          ephemeral: true,
        });
      }

      const rulesList = rules
        .map((rule) => {
          const channel = interaction.guild.channels.cache.get(rule.channelId);
          const channelName = channel ? channel.toString() : `Unknown Channel (${rule.channelId})`;
          const status = rule.enabled ? '✅ Enabled' : '❌ Disabled';
          return `• ${channelName}: \`${rule.requiredPhrase}\` - ${status}`;
        })
        .join('\n');

      return interaction.reply({
        content: `📋 **Attachment Rules**\n\n${rulesList}`,
        ephemeral: true,
      });
    }
  },
};
