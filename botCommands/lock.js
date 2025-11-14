const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logModerationAction } = require('./loggingUtils.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock a channel so only staff can message')
    .addChannelOption(option =>
      option.setName('channel').setDescription('Channel to lock').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  
  async execute(interaction) {
    await interaction.deferReply();

    const channel = interaction.options.getChannel('channel') || interaction.channel;

    try {
      await channel.permissionOverwrites.create(interaction.guild.roles.everyone, {
        SendMessages: false,
        AddReactions: false
      });

      // Log the action
      await logModerationAction(interaction.guild, 'Channel Locked', interaction.user, 'System', 'Channel locked', { 'Channel': channel.name });

      await interaction.editReply({
        content: `🔒 Channel **${channel.name}** has been locked!`
      });
    } catch (err) {
      await interaction.editReply({ content: `❌ Error locking channel: ${err.message}` });
    }
  },
};
