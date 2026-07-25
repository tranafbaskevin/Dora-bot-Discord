const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
require('dotenv').config();

const gachaCommand = require('./src/commands/gacha');
const profileCommand = require('./src/commands/profile');
const teamCommand = require('./src/commands/team');
const battleCommand = require('./src/commands/battle');
const infoCommand = require('./src/commands/info');
const inventoryCommand = require('./src/commands/inventory');
const upgradeCommand = require('./src/commands/upgrade');

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
  upgradeCommand
];

commandsList.forEach(cmd => {
  client.commands.set(cmd.data.name, cmd);
});

// Khi bot online
client.once('clientReady', async () => {
  console.log(`🔥 Bot Dora-Bot online thành công với tên: ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    console.log('⏳ Đang đăng ký Slash Commands với Discord API...');

    const commandsData = commandsList.map(cmd => cmd.data.toJSON());

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commandsData }
    );

    console.log('✅ Đã đăng ký thành công các lệnh: /gacha, /profile, /team, /battle, /info, /inventory, /upgrade');
  } catch (error) {
    console.error('❌ Lỗi đăng ký Slash Commands:', error);
  }
});

// Khi người dùng tương tác Slash Command & Autocomplete
client.on('interactionCreate', async interaction => {
  // Xử lý Gợi ý Tự Động (Autocomplete)
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

  // Xử lý Lệnh Slash Command
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

client.login(process.env.TOKEN);