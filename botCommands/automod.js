const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { AutoModConfig } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Configure comprehensive automod settings for the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Check current automod configuration'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('setspam')
        .setDescription('Configure spam detection settings')
        .addIntegerOption(option =>
          option.setName('messages').setDescription('Number of messages').setRequired(true).setMinValue(2).setMaxValue(20))
        .addIntegerOption(option =>
          option.setName('seconds').setDescription('Time window in seconds').setRequired(true).setMinValue(1).setMaxValue(30))
        .addBooleanOption(option =>
          option.setName('automute').setDescription('Auto-mute spammers').setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('setmentionspam')
        .setDescription('Configure mention spam protection')
        .addIntegerOption(option =>
          option.setName('limit').setDescription('Max mentions per message').setRequired(true).setMinValue(1).setMaxValue(20)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('linkfilter')
        .setDescription('Toggle link filtering')
        .addBooleanOption(option =>
          option.setName('enabled').setDescription('Enable link filtering').setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('raidprotection')
        .setDescription('Configure anti-raid settings')
        .addIntegerOption(option =>
          option.setName('joins').setDescription('Member joins threshold').setRequired(true).setMinValue(3).setMaxValue(20))
        .addIntegerOption(option =>
          option.setName('seconds').setDescription('Time window in seconds').setRequired(true).setMinValue(5).setMaxValue(60))
        .addBooleanOption(option =>
          option.setName('autolockdown').setDescription('Auto-lockdown on raid').setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('setactions')
        .setDescription('Configure auto-moderation actions based on warnings')
        .addIntegerOption(option =>
          option.setName('mute').setDescription('Warnings before auto-mute').setRequired(false).setMinValue(1).setMaxValue(10))
        .addIntegerOption(option =>
          option.setName('kick').setDescription('Warnings before auto-kick').setRequired(false).setMinValue(1).setMaxValue(15))
        .addIntegerOption(option =>
          option.setName('ban').setDescription('Warnings before auto-ban').setRequired(false).setMinValue(1).setMaxValue(20)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('duplicates')
        .setDescription('Toggle duplicate message detection')
        .addBooleanOption(option =>
          option.setName('enabled').setDescription('Enable duplicate detection').setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('reset')
        .setDescription('Reset all automod settings to defaults')),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    let config = await AutoModConfig.findOne({ where: { guildId } });
    if (!config) {
      config = await AutoModConfig.create({ guildId });
    }

    if (subcommand === 'status') {
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🛡️ AutoMod Configuration')
        .addFields(
          { 
            name: '📨 Spam Protection', 
            value: `${config.spamEnabled ? '✅ Enabled' : '❌ Disabled'}\nLimit: ${config.spamMessageLimit} messages in ${config.spamTimeWindow / 1000}s\nAuto-mute: ${config.spamMuteEnabled ? 'Yes' : 'No'}`,
            inline: true 
          },
          { 
            name: '👥 Mention Spam', 
            value: `${config.mentionSpamEnabled ? '✅ Enabled' : '❌ Disabled'}\nLimit: ${config.mentionSpamLimit} mentions`,
            inline: true 
          },
          { 
            name: '🔗 Link Filter', 
            value: config.linkFilterEnabled ? '✅ Enabled' : '❌ Disabled',
            inline: true 
          },
          { 
            name: '🚨 Raid Protection', 
            value: `${config.raidProtectionEnabled ? '✅ Enabled' : '❌ Disabled'}\nThreshold: ${config.raidJoinThreshold} joins in ${config.raidTimeWindow / 1000}s\nAuto-lockdown: ${config.autoLockdownOnRaid ? 'Yes' : 'No'}`,
            inline: true 
          },
          { 
            name: '📋 Duplicate Detection', 
            value: config.duplicateMessageEnabled ? '✅ Enabled' : '❌ Disabled',
            inline: true 
          },
          { 
            name: '⚡ Auto-Actions', 
            value: `Auto-warn: ${config.autoWarnEnabled ? 'Yes' : 'No'}\nAuto-mute: ${config.autoMuteThreshold} warns\nAuto-kick: ${config.autoKickThreshold} warns\nAuto-ban: ${config.autoBanThreshold} warns`,
            inline: true 
          }
        )
        .setFooter({ text: 'Use /automod commands to configure these settings' });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'setspam') {
      const messages = interaction.options.getInteger('messages');
      const seconds = interaction.options.getInteger('seconds');
      const automute = interaction.options.getBoolean('automute');

      config.spamEnabled = true;
      config.spamMessageLimit = messages;
      config.spamTimeWindow = seconds * 1000;
      if (automute !== null) config.spamMuteEnabled = automute;
      await config.save();

      return interaction.reply({
        content: `✅ **Spam detection updated!**\n\nUsers sending **${messages} messages** within **${seconds} seconds** will be flagged.\nAuto-mute spammers: ${config.spamMuteEnabled ? '✅ Yes' : '❌ No'}`,
        ephemeral: true,
      });
    }

    if (subcommand === 'setmentionspam') {
      const limit = interaction.options.getInteger('limit');
      config.mentionSpamEnabled = true;
      config.mentionSpamLimit = limit;
      await config.save();

      return interaction.reply({
        content: `✅ **Mention spam protection updated!**\n\nMessages with more than **${limit} mentions** will be deleted.`,
        ephemeral: true,
      });
    }

    if (subcommand === 'linkfilter') {
      const enabled = interaction.options.getBoolean('enabled');
      config.linkFilterEnabled = enabled;
      await config.save();

      return interaction.reply({
        content: `✅ **Link filter ${enabled ? 'enabled' : 'disabled'}!**\n\n${enabled ? 'Discord invites, YouTube, and Spotify links will be blocked.' : 'Users can now post links freely.'}`,
        ephemeral: true,
      });
    }

    if (subcommand === 'raidprotection') {
      const joins = interaction.options.getInteger('joins');
      const seconds = interaction.options.getInteger('seconds');
      const autolockdown = interaction.options.getBoolean('autolockdown');

      config.raidProtectionEnabled = true;
      config.raidJoinThreshold = joins;
      config.raidTimeWindow = seconds * 1000;
      if (autolockdown !== null) config.autoLockdownOnRaid = autolockdown;
      await config.save();

      return interaction.reply({
        content: `✅ **Raid protection updated!**\n\nIf **${joins} members** join within **${seconds} seconds**, a raid alert will be triggered.\nAuto-lockdown: ${config.autoLockdownOnRaid ? '✅ Enabled' : '❌ Disabled'}`,
        ephemeral: true,
      });
    }

    if (subcommand === 'setactions') {
      const mute = interaction.options.getInteger('mute');
      const kick = interaction.options.getInteger('kick');
      const ban = interaction.options.getInteger('ban');

      if (mute !== null) config.autoMuteThreshold = mute;
      if (kick !== null) config.autoKickThreshold = kick;
      if (ban !== null) config.autoBanThreshold = ban;
      await config.save();

      return interaction.reply({
        content: `✅ **Auto-moderation actions updated!**\n\n**Auto-mute:** ${config.autoMuteThreshold} warnings\n**Auto-kick:** ${config.autoKickThreshold} warnings\n**Auto-ban:** ${config.autoBanThreshold} warnings`,
        ephemeral: true,
      });
    }

    if (subcommand === 'duplicates') {
      const enabled = interaction.options.getBoolean('enabled');
      config.duplicateMessageEnabled = enabled;
      await config.save();

      return interaction.reply({
        content: `✅ **Duplicate message detection ${enabled ? 'enabled' : 'disabled'}!**\n\n${enabled ? 'Identical messages will be deleted.' : 'Users can send duplicate messages.'}`,
        ephemeral: true,
      });
    }

    if (subcommand === 'reset') {
      await config.destroy();
      await AutoModConfig.create({ guildId });

      return interaction.reply({
        content: `✅ **AutoMod settings reset to defaults!**\n\nAll automod configurations have been restored to their default values.`,
        ephemeral: true,
      });
    }
  },
};
