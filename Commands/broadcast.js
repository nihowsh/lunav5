module.exports = {
  name: "broadcast",
  description: "Send a message to all users in a specific server using a user token.",
  async run(client, message, args) {
    if (args.length < 3) return message.reply("Usage: <prefix>broadcast <userToken> <serverID> <message>");

    const userToken = args[0];
    const serverId = args[1];
    const broadcastMsg = args.slice(2).join(" ");

    // Write trigger file for selfbot to pick up
    const fs = require('fs');
    const path = require('path');
    const triggerData = {
      userToken: userToken,
      serverId: serverId,
      message: broadcastMsg,
      timestamp: Date.now(),
      requestedBy: message.author.id
    };

    const triggerFile = path.join(__dirname, '..', 'selfbot_trigger.json');
    fs.writeFileSync(triggerFile, JSON.stringify(triggerData, null, 2));

    message.reply(`Broadcast trigger sent. The selfbot will process your request shortly.`);
  }
};
