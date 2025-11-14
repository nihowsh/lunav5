const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ServerTemplates } = require('../database.js');

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('saveclone')
    .setDescription('Clone and save server template with a code')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Name for this template')
        .setRequired(true))
    .addBooleanOption(option =>
      option.setName('roles')
        .setDescription('Clone roles? (default: true)')
        .setRequired(false))
    .addBooleanOption(option =>
      option.setName('channels')
        .setDescription('Clone channels? (default: true)')
        .setRequired(false))
    .addBooleanOption(option =>
      option.setName('categories')
        .setDescription('Clone categories? (default: true)')
        .setRequired(false))
    .addBooleanOption(option =>
      option.setName('emojis')
        .setDescription('Clone emojis? (default: false)')
        .setRequired(false))
    .addBooleanOption(option =>
      option.setName('messages')
        .setDescription('Clone messages from channels? (default: false)')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('message_limit')
        .setDescription('Max messages per channel to clone (default: 50, max: 100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const name = interaction.options.getString('name');
    const cloneRoles = interaction.options.getBoolean('roles') ?? true;
    const cloneChannels = interaction.options.getBoolean('channels') ?? true;
    const cloneCategories = interaction.options.getBoolean('categories') ?? true;
    const cloneEmojis = interaction.options.getBoolean('emojis') ?? false;
    const cloneMessages = interaction.options.getBoolean('messages') ?? false;
    const messageLimit = Math.max(1, Math.min(interaction.options.getInteger('message_limit') ?? 50, 100));

    await interaction.deferReply();

    try {
      const guild = interaction.guild;
      const templateData = {
        name: name,
        icon: guild.iconURL({ dynamic: true, size: 1024 }),
        roles: [],
        categories: [],
        channels: [],
        emojis: [],
        messages: [],
      };

      // Clone roles
      if (cloneRoles) {
        const roles = guild.roles.cache
          .filter(r => r.name !== '@everyone' && !r.managed)
          .sort((a, b) => a.position - b.position);
        
        for (const [, role] of roles) {
          templateData.roles.push({
            name: role.name,
            color: role.color,
            hoist: role.hoist,
            mentionable: role.mentionable,
            permissions: role.permissions.bitfield.toString(),
            position: role.position,
          });
        }
      }

      // Clone categories and channels
      if (cloneCategories || cloneChannels) {
        const categories = guild.channels.cache.filter(c => c.type === 4).sort((a, b) => a.position - b.position);
        
        for (const [, category] of categories) {
          if (cloneCategories) {
            const categoryData = {
              name: category.name,
              position: category.position,
              permissions: category.permissionOverwrites.cache.map(p => {
                // For roles, save role name instead of ID for mapping
                const target = p.type === 0 ? guild.roles.cache.get(p.id) : null;
                return {
                  targetId: p.id,
                  targetName: target ? target.name : null,
                  type: p.type, // 0 = role, 1 = user
                  allow: p.allow.bitfield.toString(),
                  deny: p.deny.bitfield.toString(),
                };
              }),
              channels: [],
            };

            if (cloneChannels) {
              const channelsInCategory = guild.channels.cache
                .filter(c => c.parentId === category.id)
                .sort((a, b) => a.position - b.position);

              for (const [, channel] of channelsInCategory) {
                categoryData.channels.push({
                  name: channel.name,
                  type: channel.type,
                  topic: channel.topic || '',
                  nsfw: channel.nsfw || false,
                  rateLimitPerUser: channel.rateLimitPerUser || 0,
                  position: channel.position,
                  permissions: channel.permissionOverwrites.cache.map(p => {
                    const target = p.type === 0 ? guild.roles.cache.get(p.id) : null;
                    return {
                      targetId: p.id,
                      targetName: target ? target.name : null,
                      type: p.type,
                      allow: p.allow.bitfield.toString(),
                      deny: p.deny.bitfield.toString(),
                    };
                  }),
                });
              }
            }

            templateData.categories.push(categoryData);
          }
        }

        // Clone channels without category
        if (cloneChannels) {
          const channelsWithoutCategory = guild.channels.cache
            .filter(c => !c.parentId && c.type !== 4)
            .sort((a, b) => a.position - b.position);

          for (const [, channel] of channelsWithoutCategory) {
            templateData.channels.push({
              name: channel.name,
              type: channel.type,
              topic: channel.topic || '',
              nsfw: channel.nsfw || false,
              rateLimitPerUser: channel.rateLimitPerUser || 0,
              position: channel.position,
              permissions: channel.permissionOverwrites.cache.map(p => {
                const target = p.type === 0 ? guild.roles.cache.get(p.id) : null;
                return {
                  targetId: p.id,
                  targetName: target ? target.name : null,
                  type: p.type,
                  allow: p.allow.bitfield.toString(),
                  deny: p.deny.bitfield.toString(),
                };
              }),
            });
          }
        }
      }

      // Clone emojis
      if (cloneEmojis) {
        const emojis = guild.emojis.cache.filter(e => !e.managed);
        for (const [, emoji] of emojis) {
          templateData.emojis.push({
            name: emoji.name,
            url: emoji.url,
          });
        }
      }

      // Clone messages from text channels
      if (cloneMessages) {
        await interaction.editReply({ content: `⏳ Cloning messages from channels... This may take a while.` });
        
        const textChannels = guild.channels.cache.filter(c => c.isTextBased() && c.type === 0);
        let totalMessages = 0;
        
        for (const [, channel] of textChannels) {
          try {
            const messages = await channel.messages.fetch({ limit: messageLimit });
            const channelMessages = [];
            
            for (const [, msg] of messages) {
              const messageData = {
                content: msg.content || '',
                username: msg.author.username,
                avatarURL: msg.author.displayAvatarURL({ dynamic: true }),
                embeds: msg.embeds.map(e => e.toJSON()),
                attachments: msg.attachments.map(a => ({
                  name: a.name,
                  url: a.url,
                  contentType: a.contentType,
                  size: a.size,
                })),
                timestamp: msg.createdTimestamp,
              };
              
              channelMessages.push(messageData);
              totalMessages++;
            }
            
            if (channelMessages.length > 0) {
              const parentCategory = channel.parent ? channel.parent.name : null;
              templateData.messages.push({
                channelName: channel.name,
                categoryName: parentCategory,
                channelId: channel.id,
                messages: channelMessages.reverse(),
              });
            }
          } catch (err) {
            console.error(`Failed to fetch messages from ${channel.name}:`, err);
          }
        }
        
        await interaction.editReply({ content: `⏳ Cloned ${totalMessages} messages. Saving template...` });
      }

      // Generate unique code
      let code;
      let exists = true;
      while (exists) {
        code = generateCode();
        const existing = await ServerTemplates.findOne({ where: { code } });
        exists = existing !== null;
      }

      // Save to database
      await ServerTemplates.create({
        code: code,
        name: name,
        creatorId: interaction.user.id,
        data: JSON.stringify(templateData),
      });

      const summary = [];
      if (cloneRoles) summary.push(`✅ ${templateData.roles.length} roles`);
      if (cloneCategories) summary.push(`✅ ${templateData.categories.length} categories`);
      if (cloneChannels) summary.push(`✅ ${templateData.channels.length + templateData.categories.reduce((a, c) => a + c.channels.length, 0)} channels`);
      if (cloneEmojis) summary.push(`✅ ${templateData.emojis.length} emojis`);
      if (cloneMessages) {
        const totalMsgs = templateData.messages.reduce((sum, ch) => sum + ch.messages.length, 0);
        summary.push(`✅ ${totalMsgs} messages from ${templateData.messages.length} channels`);
      }

      await interaction.editReply({
        content: `🎉 **Server Template Saved!**\n\n**Template Name:** ${name}\n**Code:** \`${code}\`\n\n${summary.join('\n')}\n\n💡 Use \`/loadclone code:${code}\` to apply this template to any server!`,
      });
    } catch (error) {
      console.error('Save clone error:', error);
      await interaction.editReply({
        content: '❌ Failed to save server template! ' + error.message,
      });
    }
  },
};
