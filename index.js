const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const http = require('http');
require('dotenv').config();

const db = require('./src/database/db');
const botToken = process.env.TOKEN || process.env.DISCORD_TOKEN;

// Simple HTTP Keep-Alive Server for Render Free Web Service & Cloud Hosting
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('DoraBot is online 24/7!');
}).listen(PORT, () => {
  console.log(`🌐 HTTP Keep-Alive Server đang chạy tại port ${PORT}`);
});

// Global Error Handlers (Prevents Bot Process from Crashing!)
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err, origin) => {
  console.error('⚠️ Uncaught Exception:', err, 'origin:', origin);
});

const gachaCommand = require('./src/commands/gacha');
const profileCommand = require('./src/commands/profile');
const teamCommand = require('./src/commands/team');
const battleCommand = require('./src/commands/battle');
const infoCommand = require('./src/commands/info');
const inventoryCommand = require('./src/commands/inventory');
const upgradeCommand = require('./src/commands/upgrade');
const lahoanCommand = require('./src/commands/lahoan');
const adminCommand = require('./src/commands/admin');
const equipmentCommand = require('./src/commands/equipment');
const deleteCommand = require('./src/commands/delete');
const giveCommand = require('./src/commands/give');
const borrowCommand = require('./src/commands/borrow');
const huntCommand = require('./src/commands/hunt');
const pvpCommand = require('./src/commands/pvp');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

const commandsList = [
  gachaCommand,
  profileCommand,
  teamCommand,
  battleCommand,
  infoCommand,
  inventoryCommand,
  upgradeCommand,
  lahoanCommand,
  adminCommand,
  equipmentCommand,
  deleteCommand,
  giveCommand,
  borrowCommand,
  huntCommand,
  pvpCommand
];

commandsList.forEach(cmd => {
  client.commands.set(cmd.data.name, cmd);
});

// Khi bot online
client.once('ready', async () => {
  console.log(`🔥 Bot Dora-Bot online thành công với tên: ${client.user.tag}`);

  // Tự động cập nhật Avatar cho DoraBot
  const avatarPath = require('path').join(__dirname, 'assets/dora_avatar.png');
  if (require('fs').existsSync(avatarPath)) {
    try {
      await client.user.setAvatar(avatarPath);
      console.log('🖼️ Đã tự động cập nhật Avatar mới cho DoraBot thành công!');
    } catch (err) {
      console.log('ℹ️ Avatar hiện tại đã được đồng bộ hoặc bị giới hạn thời gian cập nhật của Discord.');
    }
  }

  if (!botToken) {
    console.error('❌ KHÔNG TÌM THẤY BOT TOKEN TRONG BIẾN MÔI TRƯỜNG (TOKEN hoặc DISCORD_TOKEN)!');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(botToken);

  try {
    console.log('⏳ Đang đăng ký Slash Commands với Discord API...');

    const commandsData = commandsList.map(cmd => cmd.data.toJSON());

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commandsData }
    );

    console.log('✅ Đã đăng ký thành công 15 lệnh Slash Commands!');
  } catch (error) {
    console.error('❌ Lỗi đăng ký Slash Commands:', error);
  }
});

// Khi người dùng tương tác Slash Command & Autocomplete
client.on('interactionCreate', async interaction => {
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (command && command.autocomplete) {
      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.error('❌ Lỗi Autocomplete:', error);
      }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Lỗi khi thực thi lệnh /${interaction.commandName}:`, error);
    const errorMsg = '⚠️ Đã xảy ra lỗi khi thực thi lệnh này!';
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMsg, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMsg, ephemeral: true });
    }
  }
});

// Start Database & Login
async function startBot() {
  await db.initDatabase();
  if (botToken) {
    client.login(botToken);
  } else {
    console.error('❌ Không thể đăng nhập Discord vì thiếu TOKEN!');
  }
}

startBot();