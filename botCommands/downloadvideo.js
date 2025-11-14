const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const ytDlpExec = require('yt-dlp-exec');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const { spawn } = require('child_process');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit for compression

function spawnPromise(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args);
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

async function downloadFileFromURL(url, outputPath) {
  const writer = require('fs').createWriteStream(outputPath);
  
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  response.data.pipe(writer);
  
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function getRedGifsVideo(url) {
  const match = url.match(/redgifs\.com\/watch\/([a-zA-Z0-9]+)/i);
  if (!match) {
    throw new Error('Invalid RedGifs URL');
  }
  
  const videoId = match[1];
  
  try {
    const tokenResponse = await axios.get('https://api.redgifs.com/v2/auth/temporary', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const token = tokenResponse.data.token;
    
    const videoResponse = await axios.get(`https://api.redgifs.com/v2/gifs/${videoId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const videoData = videoResponse.data.gif;
    const videoUrl = videoData.urls.hd || videoData.urls.sd;
    
    return {
      url: videoUrl,
      duration: videoData.duration,
      thumbnail: videoData.urls.thumbnail
    };
  } catch (error) {
    throw new Error(`RedGifs API error: ${error.message}`);
  }
}

async function downloadVideoYTDLP(url, outputPath) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('Invalid URL: must start with http:// or https://');
  }
  
  try {
    await ytDlpExec(url, {
      output: outputPath,
      format: 'best[ext=mp4]/bestvideo*+bestaudio/best',
      mergeOutputFormat: 'mp4',
      noCheckCertificates: true,
      extractorRetries: 10,
      retries: 15,
      noPlaylist: true,
      extractorArgs: 'youtube:player_client=android',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    const exists = await fs.access(outputPath).then(() => true).catch(() => false);
    if (!exists) {
      throw new Error('Download failed - file not created');
    }
    
    return outputPath;
  } catch (error) {
    throw new Error(`Download failed: ${error.message}`);
  }
}

async function downloadVideo(url, outputPath) {
  if (url.includes('redgifs.com')) {
    const videoData = await getRedGifsVideo(url);
    await downloadFileFromURL(videoData.url, outputPath);
    return outputPath;
  } else {
    return await downloadVideoYTDLP(url, outputPath);
  }
}

async function getVideoDuration(inputPath) {
  const args = [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    inputPath
  ];
  
  const { stdout } = await spawnPromise(ffprobePath, args);
  return parseFloat(stdout.trim());
}

async function compressVideo(inputPath, outputPath, targetSize) {
  const duration = await getVideoDuration(inputPath);
  const targetBitrate = Math.floor((targetSize * 8) / duration / 1000 * 0.9);
  
  const args = [
    '-i', inputPath,
    '-c:v', 'libx264',
    '-b:v', `${targetBitrate}k`,
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    '-y',
    outputPath
  ];
  
  await spawnPromise(ffmpegPath, args);
}

async function getFileSize(filePath) {
  const stats = await fs.stat(filePath);
  return stats.size;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('downloadvideo')
    .setDescription('Download videos from YouTube, TikTok, Instagram, Redgifs, etc.')
    .addStringOption(option =>
      option.setName('link1')
        .setDescription('Video link 1')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('link2')
        .setDescription('Video link 2')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('link3')
        .setDescription('Video link 3')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('link4')
        .setDescription('Video link 4')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('link5')
        .setDescription('Video link 5')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('link6')
        .setDescription('Video link 6')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('link7')
        .setDescription('Video link 7')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('link8')
        .setDescription('Video link 8')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('link9')
        .setDescription('Video link 9')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('link10')
        .setDescription('Video link 10')
        .setRequired(false)),

  async execute(interaction) {
    const links = [];
    for (let i = 1; i <= 10; i++) {
      const link = interaction.options.getString(`link${i}`);
      if (link) links.push(link);
    }

    if (links.length === 0) {
      return await interaction.reply({
        content: '❌ Please provide at least one video link!',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const tempDir = path.join(__dirname, '..', 'temp_videos');
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (err) {}

    let successful = 0;
    let failed = 0;
    const results = [];
    const filesToCleanup = [];
    const successfulVideos = [];

    try {
      for (let i = 0; i < links.length; i++) {
        const url = links[i];
        const videoNum = i + 1;
        const timestamp = Date.now();
        const originalPath = path.join(tempDir, `video_${timestamp}_${videoNum}.mp4`);

        try {
          await interaction.editReply({
            content: `⏳ **Processing video ${videoNum}/${links.length}...**\n\nDownloading from: ${url.substring(0, 50)}...`
          });

          const downloadedPath = await downloadVideo(url, originalPath);
          filesToCleanup.push(downloadedPath);
          
          let finalPath = downloadedPath;
          let fileSize = await getFileSize(downloadedPath);
          let compressed = false;

          if (fileSize > MAX_FILE_SIZE) {
            compressed = true;
            let compressionAttempt = 0;
            let currentInputPath = downloadedPath;
            let targetSize = MAX_FILE_SIZE;
            
            while (fileSize > MAX_FILE_SIZE && compressionAttempt < 5) {
              compressionAttempt++;
              
              await interaction.editReply({
                content: `⏳ **Processing video ${videoNum}/${links.length}...**\n\nFile too large (${(fileSize / 1024 / 1024).toFixed(1)}MB), compressing (attempt ${compressionAttempt})...`
              });

              targetSize = MAX_FILE_SIZE * (0.85 ** compressionAttempt);
              
              const tempCompressedPath = path.join(tempDir, `compressed_${timestamp}_${videoNum}_attempt${compressionAttempt}.mp4`);
              await compressVideo(currentInputPath, tempCompressedPath, targetSize);
              filesToCleanup.push(tempCompressedPath);
              
              finalPath = tempCompressedPath;
              fileSize = await getFileSize(tempCompressedPath);
              currentInputPath = tempCompressedPath;
            }
            
            if (fileSize > MAX_FILE_SIZE) {
              throw new Error(`Unable to compress below 10MB after ${compressionAttempt} attempts. Final size: ${(fileSize / 1024 / 1024).toFixed(1)}MB`);
            }
          }

          if (fileSize > MAX_FILE_SIZE) {
            throw new Error(`File size ${(fileSize / 1024 / 1024).toFixed(1)}MB exceeds limit`);
          }

          const sizeInMB = (fileSize / 1024 / 1024).toFixed(1);
          const compressNote = compressed ? ' (compressed)' : '';
          
          successfulVideos.push({
            path: finalPath,
            size: sizeInMB,
            compressed: compressNote
          });

          successful++;
          results.push(`✅ Video ${videoNum} - ${sizeInMB}MB${compressNote}`);

        } catch (error) {
          console.error(`Download error for video ${videoNum}:`, error);
          failed++;
          results.push(`❌ Video ${videoNum}: ${error.message.substring(0, 50)}`);
        }
      }

      if (successfulVideos.length > 0) {
        await interaction.channel.send({
          files: successfulVideos.map(v => v.path)
        });
      }

      await interaction.editReply({
        content: `🎬 **Download Complete!**\n\n✅ Successful: **${successful}**\n❌ Failed: **${failed}**\n\n${results.join('\n')}`,
      });

    } finally {
      for (const file of filesToCleanup) {
        try {
          await fs.unlink(file);
        } catch (err) {
          console.error(`Failed to delete ${file}:`, err);
        }
      }
      
      try {
        const files = await fs.readdir(tempDir);
        for (const file of files) {
          await fs.unlink(path.join(tempDir, file)).catch(() => {});
        }
        await fs.rmdir(tempDir).catch(() => {});
      } catch (err) {}
    }
  },
};
