# Discord Bot Setup & Deployment Guide

## Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file** (already created, just update it):
   ```
   BOT_TOKEN=your_bot_token_here
   ```

3. **Run the bot locally:**
   ```bash
   npm start
   ```

## Hosting on Render

1. **Push to GitHub:**
   - Create a new GitHub repository
   - Push all files to GitHub
   - Make sure `.env` and `node_modules/` are in `.gitignore` (already done)

2. **Create a New Web Service on Render:**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Fill in the settings:
     - **Name:** `discord-bot` (or any name)
     - **Runtime:** Node
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`

3. **Add Environment Variables:**
   - In Render dashboard, go to your service
   - Click "Environment" (on the left sidebar)
   - Add a new environment variable:
     - **Key:** `BOT_TOKEN`
     - **Value:** Your Discord bot token

4. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically deploy and keep your bot running 24/7

## Discord Bot Token

To get your bot token:
1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Go to "Bot" → Click "Add Bot"
4. Under "TOKEN", click "Copy" to copy your token
5. Add it to the `.env` file (local) or Render environment variables

## Using the `/selfbot` Command

In any Discord server where the bot is a member:
```
/selfbot usertoken: [user_token] serverid: [server_id] message: [your_message]
```

This will trigger the selfbot to broadcast your message to all users in the specified server.

---

**Files included:**
- `bot.js` - Main bot file
- `botCommands/selfbot.js` - Selfbot command
- `.env` - Environment variables (update with your token)
- `package.json` - Dependencies and scripts
- `.gitignore` - Files to ignore in GitHub
