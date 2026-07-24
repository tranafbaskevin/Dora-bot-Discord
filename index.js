const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// 🔹 Tạo command /ping
const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Test bot')
].map(cmd => cmd.toJSON());

// 🔹 Khi bot ready
client.once('clientReady', async () => {
  console.log(`🔥 Bot online: ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    console.log('⏳ Đang đăng ký slash command...');

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    console.log('✅ Đã đăng ký /ping');
  } catch (error) {
    console.error(error);
  }
});

// 🔹 Khi user dùng slash command
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('pong 🏓');
  }
});

client.login(process.env.TOKEN);