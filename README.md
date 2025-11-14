# Discord Bot

A powerful Discord bot with selfbot capabilities, moderation tools, and video downloading features.

## Features

- **Video Downloader**: Download videos from YouTube, Instagram, TikTok, RedGifs and more
  - Automatic compression to under 10MB
  - Batch download multiple videos
- **Moderation Tools**: Ban, kick, mute, warn, and more
- **Server Management**: Role management, channel locking, slowmode
- **Selfbot Commands**: Personal automation commands

## Setup

1. Install Node.js (v16 or higher)

2. Install dependencies:
```bash
npm install
```

3. Create a `config.json` file in the root directory:
```json
{
  "token": "YOUR_BOT_TOKEN_HERE",
  "selfbotToken": "YOUR_SELFBOT_TOKEN_HERE"
}
```

4. Run the bot:
```bash
node bot.js
```

## Required Files

Make sure you upload ALL files and folders to GitHub, including:
- `bot.js` - Main bot file
- `index.js` - Selfbot file
- `database.js` - Database configuration
- `package.json` - Dependencies
- `botCommands/` - All bot command files (entire folder)
- `Commands/` - All selfbot command files (entire folder)

## Configuration

Edit `config.json` to add your Discord bot token and selfbot token.

## Notes

- The database file (`database.sqlite`) will be created automatically on first run
- Make sure to keep your tokens secret and never commit `config.json` to GitHub
