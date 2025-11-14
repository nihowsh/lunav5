const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modrules')
    .setDescription('Display all available moderation commands'),
  
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🚫 Moderation Commands')
      .setDescription('All available moderation commands for server management')
      .addFields(
        { name: '👤 User Management', value: '`/kick` - Kick a user\n`/ban` - Ban a user\n`/unban` - Unban a user\n`/mute` - Mute a user\n`/unmute` - Unmute a user\n`/warn` - Warn a user' },
        { name: '💬 Message Management', value: '`/purge` - Delete multiple messages\n`/slowmode` - Set channel slowmode' },
        { name: '🔒 Channel Management', value: '`/lock` - Lock a channel\n`/unlock` - Unlock a channel' },
        { name: '📊 Moderation Info', value: '`/checkbans` - View all banned users\n`/automod` - Configure automod' },
        { name: '🎯 Invite Management', value: '`/setinvitethreshold` - Set invite requirement\n`/manageinviteroles` - Add/remove roles for invites' },
        { name: '📌 Requirements', value: 'All commands require appropriate permissions:\n• Kick/Ban = Ban Members\n• Mute = Moderate Members\n• Purge/Lock = Manage Messages/Channels' }
      )
      .setFooter({ text: 'Use /[command] --help for more info' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
