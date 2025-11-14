const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode for a channel')
    .addIntegerOption(option =>
      option.setName('delay').setDescription('Delay in seconds (0 to disable)').setRequired(true).setMinValue(0).setMaxValue(21600))
    .addChannelOption(option =>
      option.setName('channel').setDescription('Channel to set slowmode').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  
  async execute(interaction) {
    await interaction.deferReply();

    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const delay = interaction.options.getInteger('delay');

    try {
      await channel.setRateLimitPerUser(delay);
      
      if (delay === 0) {
        await interaction.editReply({
          content: `✅ Slowmode disabled in ${channel}!`
        });
      } else {
        await interaction.editReply({
          content: `✅ Slowmode set to **${delay} seconds** in ${channel}!`
        });
      }
    } catch (err) {
      await interaction.editReply({ content: `❌ Error setting slowmode: ${err.message}` });
    }
  },
};
