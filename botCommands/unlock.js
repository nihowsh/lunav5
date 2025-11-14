const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logModerationAction } = require('./loggingUtils.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a channel')
    .addChannelOption(option =>
      option.setName('channel').setDescription('Channel to unlock').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  
  async execute(interaction) {
    await interaction.deferReply();

    const channel = interaction.options.getChannel('channel') || interaction.channel;

    try {
      await channel.permissionOverwrites.create(interaction.guild.roles.everyone, {
        SendMessages: null,
        AddReactions: null
      });

      // Log the action
      await logModerationAction(interaction.guild, 'Channel Unlocked', interaction.user, 'System', 'Channel unlocked', { 'Channel': channel.name });

      await interaction.editReply({
        content: `🔓 Channel **${channel.name}** has been unlocked!`
      });
    } catch (err) {
      await interaction.editReply({ content: `❌ Error unlocking channel: ${err.message}` });
    }
  },
};
