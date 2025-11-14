const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nickname')
    .setDescription('Change a user\'s nickname')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to change nickname')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('nickname')
        .setDescription('New nickname (leave empty to reset)')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const nickname = interaction.options.getString('nickname') || null;
    const member = await interaction.guild.members.fetch(targetUser.id);

    if (!member) {
      return await interaction.reply({
        content: '❌ User not found in this server!',
        ephemeral: true
      });
    }

    try {
      const oldNick = member.nickname || member.user.username;
      await member.setNickname(nickname);

      if (nickname) {
        await interaction.reply({
          content: `✅ Changed nickname for ${targetUser}\n**Old:** ${oldNick}\n**New:** ${nickname}`,
        });
      } else {
        await interaction.reply({
          content: `✅ Reset nickname for ${targetUser} (was: ${oldNick})`,
        });
      }
    } catch (error) {
      console.error('Nickname error:', error);
      await interaction.reply({
        content: '❌ Failed to change nickname. User may have higher role than me!',
        ephemeral: true
      });
    }
  },
};
