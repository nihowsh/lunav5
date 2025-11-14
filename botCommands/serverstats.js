const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverstats')
    .setDescription('View and compare server statistics and analytics')
    .addSubcommand(subcommand =>
      subcommand
        .setName('current')
        .setDescription('View stats for your current server')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('other')
        .setDescription('View stats for any server by ID or invite link')
        .addStringOption(option =>
          option
            .setName('serverid')
            .setDescription('Server ID or invite link')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('compare')
        .setDescription('Compare two or more servers by their stats')
        .addStringOption(option =>
          option
            .setName('server1')
            .setDescription('First server ID')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('server2')
            .setDescription('Second server ID')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('server3')
            .setDescription('Third server ID (optional)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('compare-current')
        .setDescription('Compare current server with another')
        .addStringOption(option =>
          option
            .setName('server')
            .setDescription('Server ID to compare with')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog),

  async execute(interaction, client) {
    try {
      await interaction.deferReply({ ephemeral: false });

      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'current') {
        const stats = await getServerStats(interaction.guild, client);
        const embeds = createStatsEmbeds(stats);
        return await interaction.editReply({ embeds });
      }

      if (subcommand === 'other') {
        const input = interaction.options.getString('serverid');
        let guild = null;

        try {
          guild = await client.guilds.fetch(input);
        } catch (err) {
          try {
            const invite = await client.fetchInvite(input).catch(() => null);
            guild = invite ? invite.guild : null;
          } catch (err2) {}
        }

        if (!guild) {
          return await interaction.editReply({
            embeds: [new EmbedBuilder()
              .setColor('#ff3333')
              .setTitle('❌ Server Not Found')
              .setDescription(`Could not find server with ID or invite: \`${input}\`\n\nMake sure the bot is in the server or the invite is valid.`)
            ]
          });
        }

        const stats = await getServerStats(guild, client);
        const embeds = createStatsEmbeds(stats);
        return await interaction.editReply({ embeds });
      }

      if (subcommand === 'compare') {
        const server1Id = interaction.options.getString('server1');
        const server2Id = interaction.options.getString('server2');
        const server3Id = interaction.options.getString('server3');

        const servers = [];
        const serverIds = [server1Id, server2Id];
        if (server3Id) serverIds.push(server3Id);

        for (const serverId of serverIds) {
          try {
            const guild = await client.guilds.fetch(serverId);
            const stats = await getServerStats(guild, client);
            servers.push(stats);
          } catch (err) {
            return await interaction.editReply({
              embeds: [new EmbedBuilder()
                .setColor('#ff3333')
                .setTitle('❌ Server Not Found')
                .setDescription(`Could not find server: \`${serverId}\``)
              ]
            });
          }
        }

        const compareEmbeds = createComparisonEmbeds(servers);
        return await interaction.editReply({ embeds: compareEmbeds });
      }

      if (subcommand === 'compare-current') {
        const otherId = interaction.options.getString('server');
        
        let otherGuild = null;
        try {
          otherGuild = await client.guilds.fetch(otherId);
        } catch (err) {
          return await interaction.editReply({
            embeds: [new EmbedBuilder()
              .setColor('#ff3333')
              .setTitle('❌ Server Not Found')
              .setDescription(`Could not find server: \`${otherId}\``)
            ]
          });
        }

        const currentStats = await getServerStats(interaction.guild, client);
        const otherStats = await getServerStats(otherGuild, client);
        
        const compareEmbeds = createComparisonEmbeds([currentStats, otherStats]);
        return await interaction.editReply({ embeds: compareEmbeds });
      }
    } catch (err) {
      console.error('serverstats error:', err);
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

// Get server statistics
async function getServerStats(guild, client) {
  await guild.members.fetch().catch(() => {});
  const members = guild.members.cache;
  const channels = guild.channels.cache;
  const roles = guild.roles.cache;
  const bans = await guild.bans.fetch().catch(() => []);

  const totalMembers = members.size;
  const botMembers = members.filter(m => m.user.bot).size;
  const userMembers = totalMembers - botMembers;
  const onlineMembers = members.filter(m => m.presence?.status && m.presence.status !== 'offline').size;
  const idleMembers = members.filter(m => m.presence?.status === 'idle').size;
  const doNotDisturbMembers = members.filter(m => m.presence?.status === 'dnd').size;
  const offlineMembers = totalMembers - onlineMembers;

  const totalChannels = channels.size;
  const textChannels = channels.filter(c => c.isTextBased && c.isTextBased()).size;
  const voiceChannels = channels.filter(c => c.isVoiceBased && c.isVoiceBased()).size;
  const categoryChannels = channels.filter(c => c.type === 4).size; // ChannelType.GuildCategory = 4

  const totalRoles = roles.size;
  const customRoles = roles.filter(r => r.name !== '@everyone').size;

  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const recentMembers = members.filter(m => m.joinedTimestamp > sevenDaysAgo).size;

  let activityLevel = '🟢 Very Active';
  if (onlineMembers < totalMembers * 0.1) activityLevel = '🔴 Inactive';
  else if (onlineMembers < totalMembers * 0.3) activityLevel = '🟡 Low Activity';
  else if (onlineMembers < totalMembers * 0.6) activityLevel = '🟢 Active';
  else activityLevel = '🟢 Very Active';

  const topRoles = roles
    .filter(r => r.name !== '@everyone')
    .sort((a, b) => b.members.size - a.members.size)
    .first(10);

  const topMembers = members
    .filter(m => !m.user.bot)
    .sort((a, b) => (b.joinedTimestamp || 0) - (a.joinedTimestamp || 0))
    .first(10);

  return {
    guildId: guild.id,
    guildName: guild.name,
    guildIcon: guild.iconURL({ dynamic: true, size: 256 }),
    ownerId: guild.ownerId,
    createdTimestamp: guild.createdTimestamp,
    totalMembers,
    botMembers,
    userMembers,
    onlineMembers,
    idleMembers,
    doNotDisturbMembers,
    offlineMembers,
    totalChannels,
    textChannels,
    voiceChannels,
    categoryChannels,
    totalRoles,
    customRoles,
    bannedCount: bans.size,
    recentMembers,
    activityLevel,
    topRoles,
    topMembers,
    features: guild.features.length > 0 ? guild.features.join(', ') : 'None',
    premiumTier: guild.premiumTier,
    premiumSubscriptionCount: guild.premiumSubscriptionCount,
    verificationLevel: guild.verificationLevel
  };
}

// Create stats embeds for single server
function createStatsEmbeds(stats) {
  const guildCreated = Math.floor(stats.createdTimestamp / 1000);

  const mainEmbed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`📊 ${stats.guildName} - Server Statistics`)
    .setThumbnail(stats.guildIcon)
    .addFields(
      { name: '👥 Members', value: `**Total:** ${stats.totalMembers} (${stats.userMembers} users, ${stats.botMembers} bots)\n**Online:** ${stats.onlineMembers} | **Idle:** ${stats.idleMembers} | **DND:** ${stats.doNotDisturbMembers} | **Offline:** ${stats.offlineMembers}\n**Activity:** ${stats.activityLevel}\n**Joined (7d):** ${stats.recentMembers}` },
      
      { name: '💬 Channels', value: `**Total:** ${stats.totalChannels}\n**Text:** ${stats.textChannels} | **Voice:** ${stats.voiceChannels} | **Categories:** ${stats.categoryChannels}` },
      
      { name: '👑 Roles', value: `**Total:** ${stats.totalRoles} | **Custom:** ${stats.customRoles}`, inline: true },
      { name: '🚫 Moderation', value: `**Banned:** ${stats.bannedCount}`, inline: true },
      { name: '⏸️ Boost', value: `**Level ${stats.premiumTier}** (${stats.premiumSubscriptionCount} boosts)`, inline: true },
      
      { name: 'Server ID', value: `\`${stats.guildId}\`` },
      { name: 'Owner', value: `<@${stats.ownerId}>`, inline: true },
      { name: 'Created', value: `<t:${guildCreated}:R>`, inline: true },
      { name: 'Verification', value: `Level ${stats.verificationLevel}`, inline: true },
      { name: 'Features', value: stats.features.substring(0, 1024) || 'None' }
    )
    .setFooter({ text: `Stats as of now` })
    .setTimestamp();

  const topMembersEmbed = new EmbedBuilder()
    .setColor('#9900ff')
    .setTitle('📜 Most Recent Members')
    .setDescription(stats.topMembers.length > 0 ? stats.topMembers.map((m, i) => 
      `${i + 1}. ${m.user.tag} - Joined <t:${Math.floor(m.joinedTimestamp / 1000)}:R>`
    ).join('\n') : 'No members found')
    .setFooter({ text: 'Last 10 members to join' });

  const roleDistributionEmbed = new EmbedBuilder()
    .setColor('#ff9900')
    .setTitle('🎨 Top 10 Roles by Member Count')
    .setDescription(stats.topRoles.length > 0 ? stats.topRoles.map((r, i) => 
      `${i + 1}. ${r} - ${r.members.size} members`
    ).join('\n') : 'No roles found')
    .setFooter({ text: 'Excluding @everyone role' });

  return [mainEmbed, topMembersEmbed, roleDistributionEmbed];
}

// Create comparison embeds for multiple servers
function createComparisonEmbeds(serverStats) {
  if (serverStats.length < 2) {
    return [new EmbedBuilder()
      .setColor('#ff3333')
      .setTitle('❌ Not Enough Servers')
      .setDescription('Need at least 2 servers to compare')
    ];
  }

  const comparisonEmbed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle(`📊 Server Comparison (${serverStats.length} servers)`)
    .addFields(
      { name: '━━━━━━━━━━━━━━━ SERVER NAMES ━━━━━━━━━━━━━━━', value: '\u200b' },
      ...serverStats.map(s => ({
        name: s.guildName,
        value: `\`${s.guildId}\``,
        inline: true
      })),

      { name: '━━━━━━━━━━━━━━━ MEMBER COUNTS ━━━━━━━━━━━━━━━', value: '\u200b' },
      { name: 'Total Members', value: serverStats.map(s => `**${s.totalMembers}**`).join(' | ') },
      { name: 'Users', value: serverStats.map(s => `**${s.userMembers}**`).join(' | ') },
      { name: 'Bots', value: serverStats.map(s => `**${s.botMembers}**`).join(' | ') },
      { name: 'Online', value: serverStats.map(s => `**${s.onlineMembers}**`).join(' | ') },
      { name: 'Activity Level', value: serverStats.map(s => s.activityLevel).join(' | ') },

      { name: '━━━━━━━━━━━━━━━ RECENT JOINS ━━━━━━━━━━━━━━━', value: '\u200b' },
      { name: 'Last 7 Days', value: serverStats.map(s => `**${s.recentMembers}**`).join(' | ') },

      { name: '━━━━━━━━━━━━━━━ CHANNEL COUNTS ━━━━━━━━━━━━━━━', value: '\u200b' },
      { name: 'Total Channels', value: serverStats.map(s => `**${s.totalChannels}**`).join(' | ') },
      { name: 'Text Channels', value: serverStats.map(s => `**${s.textChannels}**`).join(' | ') },
      { name: 'Voice Channels', value: serverStats.map(s => `**${s.voiceChannels}**`).join(' | ') },

      { name: '━━━━━━━━━━━━━━━ ROLE COUNTS ━━━━━━━━━━━━━━━', value: '\u200b' },
      { name: 'Total Roles', value: serverStats.map(s => `**${s.totalRoles}**`).join(' | ') },
      { name: 'Custom Roles', value: serverStats.map(s => `**${s.customRoles}**`).join(' | ') },

      { name: '━━━━━━━━━━━━━━━ MODERATION ━━━━━━━━━━━━━━━', value: '\u200b' },
      { name: 'Banned Members', value: serverStats.map(s => `**${s.bannedCount}**`).join(' | ') },

      { name: '━━━━━━━━━━━━━━━ BOOST INFO ━━━━━━━━━━━━━━━', value: '\u200b' },
      { name: 'Boost Level', value: serverStats.map(s => `**${s.premiumTier}**`).join(' | ') },
      { name: 'Boosts', value: serverStats.map(s => `**${s.premiumSubscriptionCount}**`).join(' | ') }
    )
    .setTimestamp();

  // Create detailed comparison
  const detailEmbeds = serverStats.map((stats, idx) => {
    const guildCreated = Math.floor(stats.createdTimestamp / 1000);
    
    return new EmbedBuilder()
      .setColor(`#${Math.floor(Math.random()*16777215).toString(16)}`)
      .setTitle(`${idx + 1}. ${stats.guildName}`)
      .setThumbnail(stats.guildIcon)
      .addFields(
        { name: 'Server ID', value: `\`${stats.guildId}\`` },
        { name: 'Owner', value: `<@${stats.ownerId}>` },
        { name: 'Created', value: `<t:${guildCreated}:R>` },
        { name: '━━━━━━━━━━━━━ MEMBERS ━━━━━━━━━━━', value: '\u200b' },
        { name: 'Total', value: String(stats.totalMembers), inline: true },
        { name: 'Users', value: String(stats.userMembers), inline: true },
        { name: 'Bots', value: String(stats.botMembers), inline: true },
        { name: 'Online', value: String(stats.onlineMembers), inline: true },
        { name: 'Idle', value: String(stats.idleMembers), inline: true },
        { name: 'Offline', value: String(stats.offlineMembers), inline: true },
        { name: '━━━━━━━━━━━━━ CHANNELS ━━━━━━━━━━━', value: '\u200b' },
        { name: 'Total', value: String(stats.totalChannels), inline: true },
        { name: 'Text', value: String(stats.textChannels), inline: true },
        { name: 'Voice', value: String(stats.voiceChannels), inline: true },
        { name: 'Categories', value: String(stats.categoryChannels), inline: true },
        { name: '━━━━━━━━━━━━━ ROLES ━━━━━━━━━━━', value: '\u200b' },
        { name: 'Total', value: String(stats.totalRoles), inline: true },
        { name: 'Custom', value: String(stats.customRoles), inline: true },
        { name: 'Banned', value: String(stats.bannedCount), inline: true },
        { name: 'Activity', value: stats.activityLevel, inline: true },
        { name: 'Recent (7d)', value: String(stats.recentMembers), inline: true },
        { name: 'Boost Level', value: String(stats.premiumTier), inline: true }
      );
  });

  return [comparisonEmbed, ...detailEmbeds];
}
