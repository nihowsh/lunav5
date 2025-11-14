const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize("database", "username", "password", {
  host: "localhost",
  dialect: "sqlite",
  storage: "database.sqlite",
  logging: false
});

const GuildSettings = sequelize.define("guildSettings", {
  guildId: { type: Sequelize.STRING, primaryKey: true },
  inviteThreshold: { type: Sequelize.INTEGER, defaultValue: 3 },
  inviteRoles: { type: Sequelize.JSON, defaultValue: {} },
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setinvitethreshold')
    .setDescription('Set the number of invites required for auto-role')
    .addIntegerOption(option =>
      option.setName('threshold').setDescription('Number of invites required').setRequired(true).setMinValue(1).setMaxValue(1000))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    await interaction.deferReply();

    const threshold = interaction.options.getInteger('threshold');
    const guildId = interaction.guildId;

    try {
      let guildSettings = await GuildSettings.findOne({ where: { guildId } });
      
      if (!guildSettings) {
        guildSettings = await GuildSettings.create({ guildId, inviteThreshold: threshold });
      } else {
        await guildSettings.update({ inviteThreshold: threshold });
      }

      await interaction.editReply({
        content: `✅ Invite threshold updated!\n\n🎯 New threshold: **${threshold} invites**\n\nUsers who invite ${threshold} members will now receive their assigned role.`
      });
    } catch (err) {
      console.error('Error setting invite threshold:', err);
      await interaction.editReply({ content: '❌ Error updating invite threshold' });
    }
  },
};
