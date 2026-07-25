const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const db = require('../database/db');
const charactersData = require('../data/characters.json');
const enemiesData = require('../data/enemies.json');
const BattleSession = require('../engine/combat');
const { renderBattleCard } = require('../renderer/canvasBattle');
const { createBattleComponents } = require('../ui/battleView');

const battleCommand = new SlashCommandBuilder()
  .setName('battle')
  .setDescription('Bắt đầu trận chiến khiêu chiến Boss theo Map và Độ Khó')
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
    opt.setName('difficulty')
      .setDescription('Chọn Cấp Độ Boss / Độ Khó')
      .setRequired(false)
      .addChoices(
        { name: '🎯 Phù Hợp Level Đội Hình (Equal Level)', value: 'auto' },
        { name: '🟢 Dễ (Lv.20)', value: '20' },
        { name: '🔵 Thường (Lv.40)', value: '40' },
        { name: '🔴 Khó (Lv.60)', value: '60' },
        { name: '🟣 Cực Khó / Siêu Cấp (Lv.80)', value: '80' }
      )
  );

async function startBattleMatch(interaction, enemyId, difficultyOpt = 'auto') {
  try {
    const userId = interaction.user.id;
    const team = db.getUserTeam(userId);
    const teamCharIds = [team.slot1, team.slot2, team.slot3, team.slot4];

    const opts = {};
    if (difficultyOpt !== 'auto') {
      opts.difficultyLevel = parseInt(difficultyOpt, 10);
    }

    const session = new BattleSession(userId, teamCharIds, enemyId, opts);

    const imageBuffer = renderBattleCard(session);
    const attachment = new AttachmentBuilder(imageBuffer, { name: 'battle.png' });
    const remTurns = session.maxTurns - session.turnCount;

    const diffText = difficultyOpt === 'auto'
      ? '🎯 Phù Hợp Đội Hình (Equal Level)'
      : `Lv.${session.enemy.level}`;

    const battleEmbed = new EmbedBuilder()
      .setTitle(`⚔️ KHIÊU CHIẾN: ${session.enemy.name.toUpperCase()} (Lv.${session.enemy.level})`)
      .setColor('#ff4d4d')
      .setImage('attachment://battle.png')
      .setDescription(`📊 **Độ Khó**: **${diffText}** | 👹 **Boss**: **${session.enemy.name}**\n⏳ **VÒNG ĐẤU**: Turn ${session.turnCount} / ${session.maxTurns} (Còn lại **${remTurns}** lượt)\n\n${session.logs.slice(-3).join('\n')}`)
      .setFooter({ text: 'Nhấn nút bên dưới để điều khiển trận đấu!' });

    const battleComponents = createBattleComponents(session);

    // Edit original reply with files
    const msg = await interaction.editReply({
      embeds: [battleEmbed],
      files: [attachment],
      components: battleComponents
    });

    const actionCollector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000
    });

    actionCollector.on('collect', async ai => {
      if (ai.user.id !== userId) {
        return ai.reply({ content: '❌ Bạn không phải người chơi trận này!', ephemeral: true });
      }

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
        const user = db.getUser(userId);
        db.updateUserJades(userId, user.jades + 800);
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

        await ai.channel.send({ embeds: [ultEmbed] }).catch(() => {});
      }

      const newBuffer = renderBattleCard(session);
      const newAttachment = new AttachmentBuilder(newBuffer, { name: 'battle.png' });
      const turnsLeft = session.maxTurns - session.turnCount;

      const newEmbed = new EmbedBuilder()
        .setTitle(`⚔️ KHIÊU CHIẾN: ${session.enemy.name.toUpperCase()} (Lv.${session.enemy.level})`)
        .setColor(session.isFinished ? (session.winner === 'player' ? '#10b981' : '#ef4444') : '#ff4d4d')
        .setImage('attachment://battle.png')
        .setDescription(`📊 **Độ Khó**: **${diffText}** | 👹 **Boss**: **${session.enemy.name}**\n⏳ **VÒNG ĐẤU**: Turn ${session.turnCount} / ${session.maxTurns} (Còn lại **${turnsLeft}** lượt)\n\n${session.logs.slice(-4).join('\n')}`)
        .setFooter({ text: session.isFinished ? 'Trận đấu đã kết thúc!' : 'Lượt của bạn!' });

      const newComponents = session.isFinished ? [] : createBattleComponents(session);

      await interaction.editReply({
        embeds: [newEmbed],
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
  const mapOpt = interaction.options.getString('map');
  const diffOpt = interaction.options.getString('difficulty') || 'auto';

  // Step 1: Reply immediately so Discord never timeouts!
  await interaction.deferReply();

  let selectedMap = mapOpt || 'herta';

  // Step 1 Embed: Select Map
  const mapEmbed = new EmbedBuilder()
    .setTitle('🗺️ CHỌN MAP / KHU VỰC KHIÊU CHIẾN BOSS')
    .setColor('#3b82f6')
    .setDescription('Hãy chọn Map và Độ khó bên dưới để bắt đầu trận chiến:')
    .addFields(
      { name: '🛰️ 1. Trạm Không Gian Herta', value: '• Doomsday Beast *(Bộ Thiên Tài Kim Loại & Bộ Thiện Xạ)*\n• Voidranger: Trampler *(Bộ Chim Ưng & Bộ Thiện Xạ)*\n• Anti-Matter Legionnaire *(Bộ Thiện Xạ)*', inline: false },
      { name: '❄️ 2. Thành Phố Belobog', value: '• Automaton Grizzly *(Bộ Hiệp Sĩ & Bộ Thợ Săn Băng)*\n• Cocolia - Mẫu Thần Dối Tráp *(Bộ Lãng Khách Âm Thầm & Hiệp Sĩ)*\n• Svarog *(Bộ Hiệp Sĩ & Bộ Thiện Xạ)*', inline: false },
      { name: '⛩️ 3. Xianzhou Luofu', value: '• Phantylia *(Bộ Thiên Tài Kim Loại & Chim Ưng)*\n• Abundance Deer *(Bộ Lãng Khách Âm Thầm)*\n• Aurumaton Gatekeeper *(Bộ Chim Ưng & Thợ Săn Băng)*', inline: false }
    )
    .setFooter({ text: 'Bấm nút bên dưới để chọn Map!' });

  const mapButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('map_btn_herta').setLabel('🛰️ Trạm Herta').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('map_btn_belobog').setLabel('❄️ Belobog').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('map_btn_xianzhou').setLabel('⛩️ Xianzhou Luofu').setStyle(ButtonStyle.Danger)
  );

  const msg = await interaction.editReply({
    embeds: [mapEmbed],
    components: [mapButtons]
  });

  const collector = msg.createMessageComponentCollector({
    time: 120000
  });

  collector.on('collect', async i => {
    if (i.user.id !== userId) {
      return i.reply({ content: '❌ Bạn không phải người gọi lệnh này!', ephemeral: true });
    }

    await i.deferUpdate().catch(() => {});

    if (i.customId === 'map_btn_herta') selectedMap = 'herta';
    else if (i.customId === 'map_btn_belobog') selectedMap = 'belobog';
    else if (i.customId === 'map_btn_xianzhou') selectedMap = 'xianzhou';

    // Step 2: Show Boss dropdown AND Difficulty dropdown for selected map!
    const mapBosses = enemiesData.filter(e => e.map === selectedMap);

    const bossOptions = mapBosses.map(b => ({
      label: b.name,
      description: `Rớt: ${b.dropArtifacts.map(id => id.toUpperCase()).join(' & ')}`,
      value: `boss_select_${b.id}`,
      emoji: '👹'
    }));

    const bossMenu = new StringSelectMenuBuilder()
      .setCustomId('battle_boss_menu')
      .setPlaceholder(`Chọn Boss trong Map ${selectedMap.toUpperCase()}...`)
      .addOptions(bossOptions);

    const diffMenu = new StringSelectMenuBuilder()
      .setCustomId('battle_diff_menu')
      .setPlaceholder('Chọn Cấp Độ / Độ Khó Boss...')
      .addOptions(
        { label: '🎯 Phù Hợp Level Đội Hình (Equal Level)', description: 'Lv.Boss tự điều chỉnh theo Level trung bình của Đội hình', value: 'auto', emoji: '🎯' },
        { label: '🟢 Dễ (Lv.20)', description: 'Boss Lv.20 cho Tân thủ', value: '20', emoji: '🟢' },
        { label: '🔵 Thường (Lv.40)', description: 'Boss Lv.40 thử thách trung bình', value: '40', emoji: '🔵' },
        { label: '🔴 Khó (Lv.60)', description: 'Boss Lv.60 đòi hỏi trang bị nâng cao', value: '60', emoji: '🔴' },
        { label: '🟣 Cực Khó / Siêu Cấp (Lv.80)', description: 'Boss Lv.80 dành cho Đội hình Max Cấp', value: '80', emoji: '🟣' }
      );

    const row1 = new ActionRowBuilder().addComponents(bossMenu);
    const row2 = new ActionRowBuilder().addComponents(diffMenu);

    let chosenEnemyId = mapBosses[0].id;
    let chosenDiff = diffOpt;

    const bossEmbed = new EmbedBuilder()
      .setTitle(`👹 VÙNG ĐẤU: ${selectedMap.toUpperCase()} - CHỌN BOSS & ĐỘ KHÓ`)
      .setColor('#f59e0b')
      .setDescription(`Hãy chọn Boss và Cấp độ khiêu chiến bên dưới:\n\n• **Boss được chọn**: **${mapBosses[0].name}**\n• **Độ Khó**: **${chosenDiff === 'auto' ? 'Equal Level (Tự động)' : 'Lv.' + chosenDiff}**`)
      .setFooter({ text: 'Sau khi chọn Boss, trận đấu sẽ lập tức khởi chạy!' });

    await interaction.editReply({ embeds: [bossEmbed], components: [row1, row2] });

    const menuCollector = msg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 120000
    });

    menuCollector.on('collect', async mi => {
      if (mi.user.id !== userId) return;
      await mi.deferUpdate().catch(() => {});

      if (mi.customId === 'battle_boss_menu') {
        chosenEnemyId = mi.values[0].replace('boss_select_', '');
      } else if (mi.customId === 'battle_diff_menu') {
        chosenDiff = mi.values[0];
      }

      menuCollector.stop();
      collector.stop();

      // Launch battle session immediately
      await startBattleMatch(interaction, chosenEnemyId, chosenDiff);
    });
  });
}

module.exports = {
  data: battleCommand,
  execute: executeBattle
};
