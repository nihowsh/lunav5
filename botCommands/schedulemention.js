const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('schedulemention')
    .setDescription('Schedule automatic @everyone mentions')
    .setDefaultMemberPermissions(PermissionFlagsBits.MentionEveryone)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add scheduled mention to a channel')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel to send mentions in')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('interval')
            .setDescription('Interval in hours (default: 2)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(24)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove scheduled mention from a channel')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel to remove scheduled mentions from')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all scheduled mentions in this server')
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    
    // Get ScheduledMentions model from bot.js
    const { sequelize } = require('sequelize');
    const ScheduledMentions = client.scheduledMentionsModel;
    
    if (!ScheduledMentions) {
      return interaction.reply({
        content: '❌ Scheduled mentions feature is not available.',
        ephemeral: true,
      });
    }

    if (subcommand === 'add') {
      const channel = interaction.options.getChannel('channel');
      const interval = interaction.options.getInteger('interval') || 2;

      // Check if schedule already exists
      const existingSchedule = await ScheduledMentions.findOne({
        where: {
          guildId: interaction.guild.id,
          channelId: channel.id,
        },
      });

      if (existingSchedule) {
        existingSchedule.intervalHours = interval;
        existingSchedule.enabled = true;
        existingSchedule.lastMentionTime = null;
        await existingSchedule.save();
        return interaction.reply({
          content: `✅ Updated scheduled mention for ${channel}!\n\n**Interval:** Every ${interval} hour${interval > 1 ? 's' : ''}\n\n@everyone will be mentioned and immediately deleted every ${interval} hours.`,
          ephemeral: true,
        });
      }

      await ScheduledMentions.create({
        guildId: interaction.guild.id,
        channelId: channel.id,
        intervalHours: interval,
        enabled: true,
      });

      return interaction.reply({
        content: `✅ Added scheduled mention for ${channel}!\n\n**Interval:** Every ${interval} hour${interval > 1 ? 's' : ''}\n\n@everyone will be mentioned and immediately deleted every ${interval} hours.`,
        ephemeral: true,
      });
    }

    if (subcommand === 'remove') {
      const channel = interaction.options.getChannel('channel');

      const deleted = await ScheduledMentions.destroy({
        where: {
          guildId: interaction.guild.id,
          channelId: channel.id,
        },
      });

      if (deleted === 0) {
        return interaction.reply({
          content: `❌ No scheduled mention found for ${channel}.`,
          ephemeral: true,
        });
      }

      return interaction.reply({
        content: `✅ Removed scheduled mention from ${channel}.`,
        ephemeral: true,
      });
    }

    if (subcommand === 'list') {
      const schedules = await ScheduledMentions.findAll({
        where: { guildId: interaction.guild.id },
      });

      if (schedules.length === 0) {
        return interaction.reply({
          content: '📋 No scheduled mentions configured in this server.',
          ephemeral: true,
        });
      }

      const schedulesList = schedules
        .map((schedule) => {
          const channel = interaction.guild.channels.cache.get(schedule.channelId);
          const channelName = channel ? channel.toString() : `Unknown Channel (${schedule.channelId})`;
          const status = schedule.enabled ? '✅ Enabled' : '❌ Disabled';
          const lastMention = schedule.lastMentionTime 
            ? `Last: <t:${Math.floor(new Date(schedule.lastMentionTime).getTime() / 1000)}:R>`
            : 'Never sent';
          return `• ${channelName}: Every ${schedule.intervalHours}h - ${status} - ${lastMention}`;
        })
        .join('\n');

      return interaction.reply({
        content: `📋 **Scheduled Mentions**\n\n${schedulesList}`,
        ephemeral: true,
      });
    }
  },
};
