const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlockdown')
    .setDescription('Remove lockdown from all channels (restore send permissions)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const channels = interaction.guild.channels.cache.filter(c => c.isTextBased());
      let unlocked = 0;
      let failed = 0;

      for (const [, channel] of channels) {
        try {
          await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: null
          });
          unlocked++;
        } catch (err) {
          failed++;
        }
      }

      await interaction.editReply({
        content: `🔓 **Server Unlocked**\n\n✅ Unlocked: **${unlocked}** channels\n❌ Failed: **${failed}** channels`,
      });
    } catch (error) {
      console.error('Unlockdown error:', error);
      await interaction.editReply({
        content: '❌ Failed to unlock server. Make sure I have Administrator permission!',
      });
    }
  },
};
