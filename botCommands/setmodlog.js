const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const Sequelize = require('sequelize');

// Database setup
const sequelize = new Sequelize("database", "username", "password", {
  host: "localhost",
  dialect: "sqlite",
  storage: "database.sqlite",
  logging: false
});

const LogSettings = sequelize.define("logSettings", {
  guildId: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  logChannelId: {
    type: Sequelize.STRING,
  },
  logCommands: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  logMessages: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  logMemberActions: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setmodlog')
    .setDescription('Set the moderation/command log channel or configure logging options')
    .addSubcommand(subcommand =>
      subcommand
        .setName('channel')
        .setDescription('Set the logging channel')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('The channel to log to (text channel)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Toggle logging features on/off')
        .addStringOption(option =>
          option
            .setName('feature')
            .setDescription('Which feature to toggle')
            .addChoices(
              { name: 'Commands', value: 'commands' },
              { name: 'Messages (Edit/Delete)', value: 'messages' },
              { name: 'Member Actions', value: 'memberactions' }
            )
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('View current logging configuration')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    try {
      await interaction.deferReply({ ephemeral: false });

      const subcommand = interaction.options.getSubcommand();
      const guildId = interaction.guild.id;

      let logSettings = await LogSettings.findOne({ where: { guildId } });
      if (!logSettings) {
        logSettings = await LogSettings.create({ guildId });
      }

      if (subcommand === 'channel') {
        const channel = interaction.options.getChannel('channel');
        
        // Test if bot can send messages to the channel
        try {
          await channel.send({
            embeds: [new EmbedBuilder()
              .setColor('#00aa00')
              .setTitle('✅ Log Channel Set')
              .setDescription(`This channel will now receive all moderation and command logs.`)
              .setTimestamp()
            ]
          });
        } catch (err) {
          return await interaction.editReply({
            embeds: [new EmbedBuilder()
              .setColor('#ff3333')
              .setTitle('❌ Error')
              .setDescription(`I don't have permission to send messages in ${channel}. Please check channel permissions.`)
            ]
          });
        }

        await logSettings.update({ logChannelId: channel.id });

        return await interaction.editReply({
          embeds: [new EmbedBuilder()
            .setColor('#00aa00')
            .setTitle('✅ Log Channel Updated')
            .addFields(
              { name: 'Channel', value: `${channel}` },
              { name: 'Features Enabled', value: `${logSettings.logCommands ? '✅' : '❌'} Commands\n${logSettings.logMessages ? '✅' : '❌'} Messages\n${logSettings.logMemberActions ? '✅' : '❌'} Member Actions` }
            )
            .setTimestamp()
          ]
        });
      }

      if (subcommand === 'toggle') {
        const feature = interaction.options.getString('feature');
        
        if (feature === 'commands') {
          logSettings.logCommands = !logSettings.logCommands;
          await logSettings.save();
          return await interaction.editReply({
            embeds: [new EmbedBuilder()
              .setColor('#ffaa00')
              .setTitle('⚙️ Command Logging Updated')
              .setDescription(`Command logging is now **${logSettings.logCommands ? 'ENABLED ✅' : 'DISABLED ❌'}**`)
              .setTimestamp()
            ]
          });
        }

        if (feature === 'messages') {
          logSettings.logMessages = !logSettings.logMessages;
          await logSettings.save();
          return await interaction.editReply({
            embeds: [new EmbedBuilder()
              .setColor('#ffaa00')
              .setTitle('⚙️ Message Logging Updated')
              .setDescription(`Message edit/delete logging is now **${logSettings.logMessages ? 'ENABLED ✅' : 'DISABLED ❌'}**`)
              .setTimestamp()
            ]
          });
        }

        if (feature === 'memberactions') {
          logSettings.logMemberActions = !logSettings.logMemberActions;
          await logSettings.save();
          return await interaction.editReply({
            embeds: [new EmbedBuilder()
              .setColor('#ffaa00')
              .setTitle('⚙️ Member Action Logging Updated')
              .setDescription(`Member action logging is now **${logSettings.logMemberActions ? 'ENABLED ✅' : 'DISABLED ❌'}**`)
              .setTimestamp()
            ]
          });
        }
      }

      if (subcommand === 'status') {
        const channel = logSettings.logChannelId ? interaction.guild.channels.cache.get(logSettings.logChannelId) : null;

        return await interaction.editReply({
          embeds: [new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📊 Logging Configuration')
            .addFields(
              { name: 'Log Channel', value: channel ? `${channel}` : '❌ Not Set', inline: false },
              { name: 'Command Logging', value: logSettings.logCommands ? '✅ Enabled' : '❌ Disabled', inline: true },
              { name: 'Message Logging', value: logSettings.logMessages ? '✅ Enabled' : '❌ Disabled', inline: true },
              { name: 'Member Actions', value: logSettings.logMemberActions ? '✅ Enabled' : '❌ Disabled', inline: true }
            )
            .setTimestamp()
          ]
        });
      }
    } catch (err) {
      console.error('setmodlog error:', err);
      return await interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor('#ff3333')
          .setTitle('❌ Error')
          .setDescription(`An error occurred: ${err.message}`)
        ]
      });
    }
  }
};
