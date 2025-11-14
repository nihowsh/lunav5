const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Delete and recreate this channel (clears all messages)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const channel = interaction.channel;

    if (!channel.isTextBased()) {
      return await interaction.reply({
        content: '❌ This command only works in text channels!',
        ephemeral: true
      });
    }

    await interaction.reply({
      content: '💣 **Nuking channel in 3 seconds...**',
      ephemeral: false
    });

    setTimeout(async () => {
      try {
        const position = channel.position;
        const parent = channel.parent;
        const name = channel.name;
        const topic = channel.topic;
        const nsfw = channel.nsfw;
        const rateLimitPerUser = channel.rateLimitPerUser;
        const permissionOverwrites = channel.permissionOverwrites.cache;

        const newChannel = await channel.clone({
          name: name,
          topic: topic,
          nsfw: nsfw,
          rateLimitPerUser: rateLimitPerUser,
          parent: parent,
          position: position,
          permissionOverwrites: permissionOverwrites,
        });

        await channel.delete();

        await newChannel.send({
          content: `💥 **Channel nuked successfully!**\n\nNuked by: ${interaction.user}\nAll previous messages have been deleted.`
        });
      } catch (error) {
        console.error('Nuke error:', error);
      }
    }, 3000);
  },
};
