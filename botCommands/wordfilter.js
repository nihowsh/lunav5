const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { WordFilter } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wordfilter')
    .setDescription('Manage word filter/blacklist')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a word/phrase to the blacklist')
        .addStringOption(option =>
          option
            .setName('word')
            .setDescription('Word or phrase to filter')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('action')
            .setDescription('Action to take when word is detected')
            .setRequired(true)
            .addChoices(
              { name: 'Delete message only', value: 'delete' },
              { name: 'Delete and warn user', value: 'warn' },
              { name: 'Delete and auto-mute', value: 'mute' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a word/phrase from the blacklist')
        .addStringOption(option =>
          option
            .setName('word')
            .setDescription('Word or phrase to remove')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all filtered words in this server')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('clear')
        .setDescription('Clear all filtered words from this server')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
      const word = interaction.options.getString('word').toLowerCase();
      const action = interaction.options.getString('action');

      const existingFilter = await WordFilter.findOne({
        where: {
          guildId: interaction.guild.id,
          word: word,
        },
      });

      if (existingFilter) {
        existingFilter.action = action;
        existingFilter.enabled = true;
        await existingFilter.save();
        return interaction.reply({
          content: `✅ Updated word filter!\n\n**Word:** \`${word}\`\n**Action:** ${action}\n\nMessages containing this word will be ${action === 'delete' ? 'deleted' : action === 'warn' ? 'deleted and user warned' : 'deleted and user muted'}.`,
          ephemeral: true,
        });
      }

      await WordFilter.create({
        guildId: interaction.guild.id,
        word: word,
        action: action,
        enabled: true,
      });

      return interaction.reply({
        content: `✅ Added word to filter!\n\n**Word:** \`${word}\`\n**Action:** ${action}\n\nMessages containing this word will now be ${action === 'delete' ? 'deleted' : action === 'warn' ? 'deleted and user warned' : 'deleted and user muted'}.`,
        ephemeral: true,
      });
    }

    if (subcommand === 'remove') {
      const word = interaction.options.getString('word').toLowerCase();

      const deleted = await WordFilter.destroy({
        where: {
          guildId: interaction.guild.id,
          word: word,
        },
      });

      if (deleted === 0) {
        return interaction.reply({
          content: `❌ Word \`${word}\` is not in the filter list.`,
          ephemeral: true,
        });
      }

      return interaction.reply({
        content: `✅ Removed \`${word}\` from the filter.`,
        ephemeral: true,
      });
    }

    if (subcommand === 'list') {
      const filters = await WordFilter.findAll({
        where: { guildId: interaction.guild.id, enabled: true },
      });

      if (filters.length === 0) {
        return interaction.reply({
          content: '📋 No filtered words configured in this server.',
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🚫 Word Filter List')
        .setDescription(filters.map((f, i) => `${i + 1}. \`${f.word}\` - Action: **${f.action}**`).join('\n'))
        .setFooter({ text: `Total: ${filters.length} filtered words` });

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    if (subcommand === 'clear') {
      const deleted = await WordFilter.destroy({
        where: { guildId: interaction.guild.id },
      });

      return interaction.reply({
        content: `✅ Cleared ${deleted} filtered word${deleted !== 1 ? 's' : ''} from this server.`,
        ephemeral: true,
      });
    }
  },
};
