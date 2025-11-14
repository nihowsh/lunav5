const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Lock down all channels in the server (removes send permissions)')
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for lockdown')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const reason = interaction.options.getString('reason') || 'Server lockdown initiated';

    await interaction.deferReply();

    try {
      const channels = interaction.guild.channels.cache.filter(c => c.isTextBased());
      let locked = 0;
      let failed = 0;

      for (const [, channel] of channels) {
        try {
          await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: false
          });
          locked++;
        } catch (err) {
          failed++;
        }
      }

      await interaction.editReply({
        content: `🔒 **Server Lockdown Complete**\n\n✅ Locked: **${locked}** channels\n❌ Failed: **${failed}** channels\n📝 Reason: ${reason}`,
      });
    } catch (error) {
      console.error('Lockdown error:', error);
      await interaction.editReply({
        content: '❌ Failed to lockdown server. Make sure I have Administrator permission!',
      });
    }
  },
};
