const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const db = require('../database/db');
const charactersData = require('../data/characters.json');
const enemiesData = require('../data/enemies.json');
const BattleSession = require('../engine/combat');
const { drawBattleCanvas } = require('../renderer/canvasBattle');
const { createBattleComponents } = require('../ui/battleView');

const battleCommand = new SlashCommandBuilder()
  .setName('battle')
  .setDescription('Bắt đầu trận chiến khiêu chiến Boss theo Map và Độ Khó')
  .addStringOption(opt =>
    opt.setName('enemy')
      .setDescription('Chọn trực tiếp Boss khiêu chiến')
      .setRequired(false)
      .addChoices(
        { name: '🛰️ Herta: Doomsday Beast (Bộ Thiên Tài & Thiện Xạ)', value: 'doomsday_beast' },
        { name: '🛰️ Herta: Voidranger Trampler (Bộ Chim Ưng & Thiện Xạ)', value: 'voidranger_trampler' },
        { name: '🛰️ Herta: Anti-Matter Legionnaire (Bộ Thiện Xạ)', value: 'antimatter_legionnaire' },
        { name: '❄️ Belobog: Automaton Grizzly (Bộ Hiệp Sĩ & Thợ Săn Băng)', value: 'automaton_grizzly' },
        { name: '❄️ Belobog: Cocolia (Bộ Lãng Khách & Hiệp Sĩ)', value: 'cocolia' },
        { name: '❄️ Belobog: Svarog (Bộ Hiệp Sĩ & Thiện Xạ)', value: 'svarog' },
        { name: '⛩️ Xianzhou: Phantylia (Bộ Thiên Tài & Chim Ưng)', value: 'phantylia' },
        { name: '⛩️ Xianzhou: Abundance Deer (Bộ Lãng Khách Âm Thầm)', value: 'abundance_deer' },
        { name: '⛩️ Xianzhou: Aurumaton Gatekeeper (Bộ Chim Ưng & Thợ Săn Băng)', value: 'aurumaton_gatekeeper' }
      )
  )
  .addStringOption(opt =>
    opt.setName('difficulty')
      .setDescription('Chọn Cấp Độ / Độ Khó Boss')
      .setRequired(false)
      .addChoices(
        { name: '🎯 Phù Hợp Level Đội Hình (Equal Level)', value: 'auto' },
        { name: '🟢 Dễ (Lv.20)', value: '20' },
        { name: '🔵 Thường (Lv.40)', value: '40' },
        { name: '🔴 Khó (Lv.60)', value: '60' },
        { name: '🟣 Cực Khó (Lv.80)', value: '80' }
      )
  );

function sendVictoryEmbed(interaction, userId, session) {
  const vData = session.victoryData || {};
  const artifacts = vData.artifacts || [vData.artifact].filter(Boolean);

  const artFields = artifacts.map((relic, idx) => {
    const subLines = (relic.subStats || []).map((s, sIdx) => `   ${sIdx + 1}. **${s.name}**: \`+${s.value}${s.name.includes('%') ? '%' : ''}\``).join('\n');
    return {
      name: `🛡️ DI VẬT MỚI #${idx + 1}: ${relic.setName || 'Di Vật'} (${relic.rarity || 5}★) [${relic.slot || 'Head'}]`,
      value: `🔹 **Chỉ Số Chính**: \`${relic.mainStat || 'ATK%'} +${relic.mainValue || '8.5'}\`\n🔸 **Dòng Buff Chỉ Số Phụ**:\n${subLines || '   1. ATK%: +3.2%'}`,
      inline: false
    };
  });

  const victoryEmbed = new EmbedBuilder()
    .setTitle(`🎉 PHẦN THƯỞNG CHIẾN THẮNG BOSS ${session.enemy.name.toUpperCase()}!`)
    .setColor('#f59e0b')
    .setDescription(`Chúc mừng **<@${userId}>** đã xuất sắc tiêu diệt Boss **${session.enemy.name}** (Lv.${session.enemy.level})!`)
    .addFields(
      { name: '💎 Ngọc Ánh Sao', value: `\`+${vData.jades?.toLocaleString() || 800} Jades\``, inline: true },
      { name: '🌟 EXP Thám Hiểm', value: `\`+${vData.exp || 450} EXP\` ${vData.leveledUp ? `🎉 **LÊN CẤP ${vData.newLevel}!** (+300 Jades)` : ''}`, inline: true },
      { name: '📦 Nguyên Liệu Nâng Cấp Chuyên Biệt', value: `• \`+${vData.charExpBooks || 6}\` Sách EXP Nhân Vật\n• \`+${vData.weaponExpCrystals || 6}\` Tinh Thể Vũ Khí\n• \`+${vData.artifactDust || 12}\` Bụi Di Vật`, inline: false },
      ...artFields
    )
    .setFooter({ text: 'Cả 2 Di vật đã được tự động bảo quản trong Inventory! Dùng /equipment để trang bị.' });

  interaction.followUp({ embeds: [victoryEmbed] }).catch(err => console.error('❌ Lỗi followUp victoryEmbed:', err));
}

async function startBattleMatch(interaction, enemyId, difficultyOpt = 'auto') {
  try {
    const userId = interaction.user.id;

    let difficultyNum = 60;
    if (difficultyOpt !== 'auto') {
      difficultyNum = parseInt(difficultyOpt, 10) || 60;
    } else {
      const userInv = db.getUserInventory(userId);
      const avgLvl = Math.round(userInv.reduce((acc, c) => acc + (c.level || 1), 0) / Math.max(1, userInv.length));
      difficultyNum = Math.min(80, Math.max(20, avgLvl + 2));
    }

    const session = new BattleSession(userId, enemyId, difficultyNum);

    const imageBuffer = await drawBattleCanvas(session);
    const attachment = new AttachmentBuilder(imageBuffer, { name: 'battle.png' });
    const remTurns = session.maxTurns - session.turn;

    const diffText = difficultyOpt === 'auto'
      ? `🎯 Equal Level (Lv.${session.enemy.level})`
      : `Lv.${session.enemy.level}`;

    const headerText = session.isFinished
      ? (session.winner === 'player' ? `🎉 **BẠN ĐÃ CHIẾN THẮNG KẺ ĐỊCH ${session.enemy.name.toUpperCase()}!**` : `💀 **TRẬN ĐẤU KẾT THÚC!**`)
      : `⚔️ **KHIÊU CHIẾN: ${session.enemy.name.toUpperCase()} (Lv.${session.enemy.level})** | 📊 Độ Khó: **${diffText}** | ⏳ VÒNG ĐẤU: **Turn ${session.turn}/${session.maxTurns}** *(Còn lại ${remTurns} lượt)*`;

    const battleComponents = session.isFinished ? [] : createBattleComponents(session);

    await interaction.editReply({
      content: headerText,
      files: [attachment],
      components: battleComponents
    });

    if (session.isFinished && session.winner === 'player') {
      sendVictoryEmbed(interaction, userId, session);
      return;
    }

    const actionCollector = interaction.channel.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000
    });

    actionCollector.on('collect', async ai => {
      if (ai.user.id !== userId) return;
      await ai.deferUpdate().catch(() => {});

      const customId = ai.customId;
      let usedUltChar = null;

      if (customId === 'battle_basic') session.executeBasicAttack();
      else if (customId === 'battle_skill') session.executeSkill();
      else if (customId.startsWith('battle_ult_')) {
        const slot = parseInt(customId.replace('battle_ult_', ''), 10);
        usedUltChar = session.team.find(c => c.slot === slot);
        session.executeUltimate(slot);
      }

      if (session.isFinished && session.winner === 'player') {
        sendVictoryEmbed(interaction, userId, session);
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

        await interaction.followUp({ embeds: [ultEmbed] }).catch(() => {});
      }

      const newBuffer = await drawBattleCanvas(session);
      const newAttachment = new AttachmentBuilder(newBuffer, { name: 'battle.png' });
      const turnsLeft = session.maxTurns - session.turn;

      const updatedText = session.isFinished
        ? (session.winner === 'player' ? `🎉 **BẠN ĐÃ CHIẾN THẮNG KẺ ĐỊCH ${session.enemy.name.toUpperCase()}!**` : `💀 **TRẬN ĐẤU KẾT THÚC!**`)
        : `⚔️ **KHIÊU CHIẾN: ${session.enemy.name.toUpperCase()} (Lv.${session.enemy.level})** | 📊 Độ Khó: **${diffText}** | ⏳ VÒNG ĐẤU: **Turn ${session.turn}/${session.maxTurns}** *(Còn lại ${turnsLeft} lượt)*`;

      const newComponents = session.isFinished ? [] : createBattleComponents(session);

      await interaction.editReply({
        content: updatedText,
        files: [newAttachment],
        components: newComponents
      }).catch(err => console.error('❌ Lỗi editReply battle action:', err));

      if (session.isFinished) actionCollector.stop();
    });
  } catch (err) {
    console.error('❌ Lỗi startBattleMatch:', err);
    await interaction.followUp({ content: '⚠️ Đã xảy ra lỗi khi khởi tạo trận đấu. Vui lòng thử lại!', ephemeral: true }).catch(() => {});
  }
}

async function executeBattle(interaction) {
  const userId = interaction.user.id;
  const enemyOpt = interaction.options.getString('enemy');
  const diffOpt = interaction.options.getString('difficulty') || 'auto';

  await interaction.deferReply();

  if (enemyOpt) {
    return startBattleMatch(interaction, enemyOpt, diffOpt);
  }

  let currentEnemyId = 'doomsday_beast';
  let currentDiff = diffOpt;

  function buildSetupEmbed() {
    const chosenEnemy = enemiesData.find(e => e.id === currentEnemyId) || enemiesData[0];
    const diffLabel = currentDiff === 'auto'
      ? '🎯 Phù Hợp Level Đội Hình (Equal Level Matchmaking)'
      : `Lv.${currentDiff}`;

    const r = chosenEnemy.rewards || { jades: 800, charExpBooks: 6, weaponExpCrystals: 6, artifactDust: 12 };

    return new EmbedBuilder()
      .setTitle('⚔️ THIẾT LẬP KHIÊU CHIẾN BOSS TRẬN ĐẤU')
      .setColor('#3b82f6')
      .setDescription('Chọn Boss và Độ Khó từ các menu bên dưới, sau đó bấm nút **🚀 BẮT ĐẦU TRẬN ĐẤU** để vào trận!')
      .addFields(
        { name: '👹 Boss Được Chọn', value: `**${chosenEnemy.name}**\n• Rớt: **${chosenEnemy.dropArtifacts.map(a => a.toUpperCase()).join(' & ')}**`, inline: true },
        { name: '🎁 Thưởng Chuyên Biệt', value: `• **${r.jades}** Jades\n• **+${r.charExpBooks}** Sách EXP | **+${r.weaponExpCrystals}** Tinh Thể\n• **+${r.artifactDust}** Bụi Di Vật`, inline: true },
        { name: '📊 Độ Khó / Level', value: `**${diffLabel}**`, inline: false }
      )
      .setFooter({ text: 'Thoải mái tùy chỉnh Boss và Độ khó trước khi bấm Bắt Đầu!' });
  }

  const bossOptions = enemiesData.map(b => {
    let mapEmoji = '🛰️';
    if (b.map === 'belobog') mapEmoji = '❄️';
    else if (b.map === 'xianzhou') mapEmoji = '⛩️';

    return {
      label: `${mapEmoji} ${b.name}`,
      description: `Rớt: ${b.dropArtifacts.map(id => id.toUpperCase()).join(' & ')}`,
      value: `boss_opt_${b.id}`
    };
  });

  const bossMenu = new StringSelectMenuBuilder()
    .setCustomId('setup_boss_menu')
    .setPlaceholder('1. Chọn Boss Khiêu Chiến...')
    .addOptions(bossOptions);

  const diffMenu = new StringSelectMenuBuilder()
    .setCustomId('setup_diff_menu')
    .setPlaceholder('2. Chọn Cấp Độ / Độ Khó...')
    .addOptions(
      { label: '🎯 Phù Hợp Level Đội Hình (Equal Level)', description: 'Lv.Boss tự điều chỉnh theo Level Đội Hình (+2 Lv)', value: 'diff_auto', emoji: '🎯' },
      { label: '🟢 Dễ (Lv.20)', description: 'Boss Lv.20 cho Tân thủ', value: 'diff_20', emoji: '🟢' },
      { label: '🔵 Thường (Lv.40)', description: 'Boss Lv.40 thử thách trung bình', value: 'diff_40', emoji: '🔵' },
      { label: '🔴 Khó (Lv.60)', description: 'Boss Lv.60 đòi hỏi trang bị nâng cao', value: 'diff_60', emoji: '🔴' },
      { label: '🟣 Cực Khó / Siêu Cấp (Lv.80)', description: 'Boss Lv.80 dành cho Đội hình Max Cấp', value: 'diff_80', emoji: '🟣' }
    );

  const startBtn = new ButtonBuilder()
    .setCustomId('setup_start_battle')
    .setLabel('🚀 BẮT ĐẦU TRẬN ĐẤU')
    .setStyle(ButtonStyle.Success);

  const row1 = new ActionRowBuilder().addComponents(bossMenu);
  const row2 = new ActionRowBuilder().addComponents(diffMenu);
  const row3 = new ActionRowBuilder().addComponents(startBtn);

  await interaction.editReply({
    embeds: [buildSetupEmbed()],
    components: [row1, row2, row3]
  });

  const collector = interaction.channel.createMessageComponentCollector({
    time: 180000
  });

  collector.on('collect', async i => {
    if (i.user.id !== userId) {
      return i.reply({ content: '❌ Bạn không phải người gọi lệnh này!', ephemeral: true });
    }

    await i.deferUpdate().catch(() => {});

    if (i.customId === 'setup_boss_menu') {
      currentEnemyId = i.values[0].replace('boss_opt_', '');
      await interaction.editReply({ embeds: [buildSetupEmbed()], components: [row1, row2, row3] });
    } else if (i.customId === 'setup_diff_menu') {
      currentDiff = i.values[0].replace('diff_', '');
      await interaction.editReply({ embeds: [buildSetupEmbed()], components: [row1, row2, row3] });
    } else if (i.customId === 'setup_start_battle') {
      collector.stop();
      await startBattleMatch(interaction, currentEnemyId, currentDiff);
    }
  });
}

module.exports = {
  data: battleCommand,
  execute: executeBattle
};
