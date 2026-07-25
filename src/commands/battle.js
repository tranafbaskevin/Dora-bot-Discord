const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ComponentType } = require('discord.js');
const db = require('../database/db');
const charactersData = require('../data/characters.json');
const enemiesData = require('../data/enemies.json');
const BattleSession = require('../engine/combat');
const { renderBattleCard } = require('../renderer/canvasBattle');
const { createBattleComponents } = require('../ui/battleView');

const battleCommand = new SlashCommandBuilder()
  .setName('battle')
  .setDescription('Bắt đầu trận chiến theo lượt (Turn-based RPG)')
  .addStringOption(opt =>
    opt.setName('map')
      .setDescription('Chọn Map / Khu vực khiêu chiến')
      .setRequired(false)
      .addChoices(
        { name: '🛰️ Trạm Không Gian Herta', value: 'herta' },
        { name: '❄️ Thành Phố Belobog', value: 'belobog' },
        { name: '⛩️ Xianzhou Luofu', value: 'xianzhou' }
      )
  )
  .addStringOption(opt =>
    opt.setName('enemy')
      .setDescription('Chọn Boss / Quái vật')
      .setRequired(false)
      .addChoices(
        { name: 'Doomsday Beast (Rớt: Bộ Thiên Tài Kim Loại & Thiện Xạ)', value: 'doomsday_beast' },
        { name: 'Voidranger: Trampler (Rớt: Bộ Chim Ưng & Thiện Xạ)', value: 'voidranger_trampler' },
        { name: 'Automaton Grizzly (Rớt: Bộ Hiệp Sĩ & Thợ Săn Băng)', value: 'automaton_grizzly' },
        { name: 'Cocolia (Rớt: Bộ Lãng Khách Âm Thầm & Hiệp Sĩ)', value: 'cocolia' },
        { name: 'Svarog (Rớt: Bộ Hiệp Sĩ & Thiện Xạ)', value: 'svarog' },
        { name: 'Phantylia (Rớt: Bộ Thiên Tài Kim Loại & Chim Ưng)', value: 'phantylia' },
        { name: 'Abundance Deer (Rớt: Bộ Lãng Khách Âm Thầm)', value: 'abundance_deer' },
        { name: 'Aurumaton Gatekeeper (Rớt: Bộ Chim Ưng & Thợ Săn Băng)', value: 'aurumaton_gatekeeper' }
      )
  )
  .addStringOption(opt =>
    opt.setName('difficulty')
      .setDescription('Chọn Cấp Độ Boss')
      .setRequired(false)
      .addChoices(
        { name: '🎯 Phù Hợp Level Đội Hình (Tự Động Equal Level)', value: 'auto' },
        { name: '🟢 Dễ (Lv.20)', value: '20' },
        { name: '🔵 Thường (Lv.40)', value: '40' },
        { name: '🔴 Khó (Lv.60)', value: '60' },
        { name: '🟣 Cực Khó / Siêu Cấp (Lv.80)', value: '80' }
      )
  );

async function executeBattle(interaction) {
  const selectedMap = interaction.options.getString('map') || 'herta';
  const enemyId = interaction.options.getString('enemy') || 'doomsday_beast';
  const difficultyOpt = interaction.options.getString('difficulty') || 'auto';

  const team = db.getUserTeam(interaction.user.id);
  const teamCharIds = [team.slot1, team.slot2, team.slot3, team.slot4];

  const opts = {};
  if (difficultyOpt !== 'auto') {
    opts.difficultyLevel = parseInt(difficultyOpt, 10);
  }

  const session = new BattleSession(interaction.user.id, teamCharIds, enemyId, opts);

  // Render initial image
  const imageBuffer = renderBattleCard(session);
  const attachment = new AttachmentBuilder(imageBuffer, { name: 'battle.png' });

  const remainingTurns = session.maxTurns - session.turnCount;

  const embed = new EmbedBuilder()
    .setTitle(`⚔️ KHIÊU CHIẾN: ${session.enemy.name} (Lv.${session.enemy.level})`)
    .setColor('#ff4d4d')
    .setImage('attachment://battle.png')
    .setDescription(`⏳ **VÒNG ĐẤU**: Turn ${session.turnCount} / ${session.maxTurns} (Còn lại **${remainingTurns}** lượt)\n\n${session.logs.slice(-3).join('\n')}`)
    .setFooter({ text: 'Nhấn nút bên dưới để chọn hành động!' });

  const components = createBattleComponents(session);

  const response = await interaction.reply({
    embeds: [embed],
    files: [attachment],
    components: components,
    fetchReply: true
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 300000
  });

  collector.on('collect', async i => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: '❌ Bạn không phải là người tham gia trận đấu này!', ephemeral: true });
    }

    await i.deferUpdate().catch(() => {});

    const customId = i.customId;
    let usedUltChar = null;

    if (customId === 'battle_basic') {
      session.executeBasicAttack();
    } else if (customId === 'battle_skill') {
      session.executeSkill();
    } else if (customId.startsWith('battle_ult_')) {
      const slot = parseInt(customId.replace('battle_ult_', ''), 10);
      usedUltChar = session.team.find(c => c.slot === slot);
      session.executeUltimate(slot);
    }

    if (session.isFinished && session.winner === 'player') {
      const user = db.getUser(interaction.user.id);
      const rewardJades = 800;
      db.updateUserJades(interaction.user.id, user.jades + rewardJades);
    }

    if (usedUltChar) {
      const charInfo = charactersData.find(c => c.id === usedUltChar.id) || usedUltChar;
      const ultName = charInfo.skills?.ultimate?.name || 'Tuyệt Kỹ';
      const ultGifUrl = charInfo.ultGif || 'https://media.giphy.com/media/L2X2a7N03XgYnJ0sCq/giphy.gif';

      const ultEmbed = new EmbedBuilder()
        .setTitle(`🌟 TUYỆT KỸ: ${charInfo.name.toUpperCase()} - "${ultName.toUpperCase()}"!`)
        .setColor(charInfo.color || '#f59e0b')
        .setImage(ultGifUrl)
        .setDescription(`✨ **${charInfo.name}** giáng đòn Tuyệt kỹ ngắt lượt hoành tráng!`);

      await i.channel.send({ embeds: [ultEmbed] }).catch(() => {});
    }

    const newBuffer = renderBattleCard(session);
    const newAttachment = new AttachmentBuilder(newBuffer, { name: 'battle.png' });
    const remTurns = session.maxTurns - session.turnCount;

    const newEmbed = new EmbedBuilder()
      .setTitle(`⚔️ KHIÊU CHIẾN: ${session.enemy.name} (Lv.${session.enemy.level})`)
      .setColor(session.isFinished ? (session.winner === 'player' ? '#10b981' : '#ef4444') : '#ff4d4d')
      .setImage('attachment://battle.png')
      .setDescription(`⏳ **VÒNG ĐẤU**: Turn ${session.turnCount} / ${session.maxTurns} (Còn lại **${remTurns}** lượt)\n\n${session.logs.slice(-4).join('\n')}`)
      .setFooter({ text: session.isFinished ? 'Trận đấu đã kết thúc!' : 'Lượt của bạn!' });

    const newComponents = session.isFinished ? [] : createBattleComponents(session);

    await i.editReply({
      embeds: [newEmbed],
      files: [newAttachment],
      components: newComponents
    }).catch(() => {});

    if (session.isFinished) {
      collector.stop();
    }
  });

  collector.on('end', () => {});
}

module.exports = {
  data: battleCommand,
  execute: executeBattle
};
