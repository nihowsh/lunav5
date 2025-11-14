const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logModerationAction } = require('./loggingUtils.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete multiple messages from a channel')
    .addIntegerOption(option =>
      option.setName('amount').setDescription('Number of messages to delete').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(option =>
      option.setName('user').setDescription('Delete only messages from this user').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  
  async execute(interaction) {
    await interaction.deferReply();

    const amount = interaction.options.getInteger('amount');
    const user = interaction.options.getUser('user');

    try {
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      
      let toDelete = messages;
      if (user) {
        toDelete = messages.filter(m => m.author.id === user.id).first(amount);
      } else {
        toDelete = messages.first(amount);
      }

      await interaction.channel.bulkDelete(toDelete, true);

      // Log the action
      await logModerationAction(interaction.guild, 'Messages Purged', interaction.user, 'Multiple Users', `${toDelete.length} messages deleted${user ? ` from ${user.tag}` : ''}`, {
        'Channel': `#${interaction.channel.name}`,
        'Amount': toDelete.length,
        'Target User': user ? user.tag : 'All'
      });

      await interaction.editReply({
        content: `✅ Deleted **${toDelete.length}** message(s)${user ? ` from ${user.tag}` : ''}!`
      });
    } catch (err) {
      await interaction.editReply({ content: `❌ Error purging messages: ${err.message}` });
    }
  },
};
