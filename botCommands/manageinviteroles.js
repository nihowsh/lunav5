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
    .setName('manageinviteroles')
    .setDescription('Add or remove roles for invite thresholds')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a role for a specific invite threshold')
        .addIntegerOption(option =>
          option.setName('threshold').setDescription('Invite count to trigger role').setRequired(true).setMinValue(1).setMaxValue(1000))
        .addRoleOption(option =>
          option.setName('role').setDescription('Role to give at this threshold').setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a role from a specific invite threshold')
        .addIntegerOption(option =>
          option.setName('threshold').setDescription('Invite count to remove').setRequired(true).setMinValue(1).setMaxValue(1000)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all invite threshold roles'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    try {
      let guildSettings = await GuildSettings.findOne({ where: { guildId } });
      if (!guildSettings) {
        guildSettings = await GuildSettings.create({ guildId });
      }

      let inviteRoles = guildSettings.inviteRoles || {};

      if (subcommand === 'add') {
        const threshold = interaction.options.getInteger('threshold');
        const role = interaction.options.getRole('role');

        inviteRoles[threshold] = role.id;
        await guildSettings.update({ inviteRoles });

        await interaction.editReply({
          content: `✅ Role added!\n\n🎯 Threshold: **${threshold} invites**\n👤 Role: **${role.name}**\n\nUsers reaching ${threshold} invites will receive the ${role.name} role.`
        });
      } else if (subcommand === 'remove') {
        const threshold = interaction.options.getInteger('threshold');

        if (!inviteRoles[threshold]) {
          return await interaction.editReply({ content: `❌ No role set for threshold ${threshold}` });
        }

        delete inviteRoles[threshold];
        await guildSettings.update({ inviteRoles });

        await interaction.editReply({
          content: `✅ Role removed!\n\n🎯 Threshold: **${threshold} invites**\n\nNo role will be given at this threshold anymore.`
        });
      } else if (subcommand === 'list') {
        if (Object.keys(inviteRoles).length === 0) {
          return await interaction.editReply({ content: '❌ No invite threshold roles configured.' });
        }

        let list = '📋 **Invite Threshold Roles:**\n\n';
        for (const [threshold, roleId] of Object.entries(inviteRoles)) {
          const role = interaction.guild.roles.cache.get(roleId);
          const roleName = role ? role.name : '(Role deleted)';
          list += `• **${threshold} invites** → ${roleName}\n`;
        }

        await interaction.editReply({ content: list });
      }
    } catch (err) {
      console.error('Error managing invite roles:', err);
      await interaction.editReply({ content: '❌ Error managing invite roles' });
    }
  },
};
