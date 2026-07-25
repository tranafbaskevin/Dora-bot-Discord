const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const db = require('../database/db');
const charactersData = require('../data/characters.json');
const enemiesData = require('../data/enemies.json');
const BattleSession = require('../engine/combat');
const { renderBattleCard } = require('../renderer/canvasBattle');
const { createBattleComponents } = require('../ui/battleView');

const battleCommand = new SlashCommandBuilder()
  .setName('battle')
  .setDescription('Bắt đầu trận chiến khiêu chiến Boss theo Map và Độ Khó');

async function executeBattle(interaction) {
  const userId = interaction.user.id;

  // Step 1: Map Selection Embed
  const mapEmbed = new EmbedBuilder()
    .setTitle('🗺️ CHỌN MAP / KHU VỰC KHIÊU CHIẾN BOSS')
    .setColor('#3b82f6')
    .setDescription('Hãy chọn 1 trong 3 Vùng đất bên dưới để xem danh sách Boss độc quyền của khu vực đó:')
    .addFields(
      { name: '🛰️ 1. Trạm Không Gian Herta', value: '• Doomsday Beast *(Bộ Thiên Tài Kim Loại & Bộ Thiện Xạ)*\n• Voidranger: Trampler *(Bộ Chim Ưng & Bộ Thiện Xạ)*\n• Anti-Matter Legionnaire *(Bộ Thiện Xạ)*', inline: false },
      { name: '❄️ 2. Thành Phố Belobog', value: '• Automaton Grizzly *(Bộ Hiệp Sĩ & Bộ Thợ Săn Băng)*\n• Cocolia - Mẫu Thần Dối Tráp *(Bộ Lãng Khách Âm Thầm & Hiệp Sĩ)*\n• Svarog *(Bộ Hiệp Sĩ & Bộ Thiện Xạ)*', inline: false },
      { name: '⛩️ 3. Xianzhou Luofu', value: '• Phantylia *(Bộ Thiên Tài Kim Loại & Chim Ưng)*\n• Abundance Deer *(Bộ Lãng Khách Âm Thầm)*\n• Aurumaton Gatekeeper *(Bộ Chim Ưng & Thợ Săn Băng)*', inline: false }
    )
    .setFooter({ text: 'Chọn nút bên dưới để chọn Map!' });

  const mapButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('map_btn_herta').setLabel('🛰️ Trạm Herta').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('map_btn_belobog').setLabel('❄️ Belobog').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('map_btn_xianzhou').setLabel('⛩️ Xianzhou Luofu').setStyle(ButtonStyle.Danger)
  );

  const response = await interaction.reply({
    embeds: [mapEmbed],
    components: [mapButtons],
    fetchReply: true
  });

  const collector = response.createMessageComponentCollector({
    time: 120000
  });

  collector.on('collect', async i => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: '❌ Bạn không phải là người gọi lệnh này!', ephemeral: true });
    }

    let mapId = 'herta';
    if (i.customId === 'map_btn_belobog') mapId = 'belobog';
    else if (i.customId === 'map_btn_xianzhou') mapId = 'xianzhou';

    // Step 2: Filter ONLY bosses belonging to the selected map!
    const mapBosses = enemiesData.filter(e => e.map === mapId);

    const bossOptions = mapBosses.map(b => ({
      label: b.name,
      description: `Rớt: ${b.dropArtifacts.map(id => id.toUpperCase()).join(' & ')}`,
      value: `boss_select_${b.id}`,
      emoji: '👹'
    }));

    const bossMenu = new StringSelectMenuBuilder()
      .setCustomId('battle_boss_menu')
      .setPlaceholder(`Chọn Boss trong Map ${mapId.toUpperCase()}...`)
      .addOptions(bossOptions);

    const bossRow = new ActionRowBuilder().addComponents(bossMenu);

    const bossEmbed = new EmbedBuilder()
      .setTitle(`👹 VÙNG ĐẤT: ${mapId.toUpperCase()} - CHỌN BOSS KHIÊU CHIẾN`)
      .setColor('#f59e0b')
      .setDescription('Chọn 1 Boss bên dưới để khiêu chiến và farm Di vật tương ứng:');

    await i.update({ embeds: [bossEmbed], components: [bossRow] });

    // Step 3: Handle Boss selection
    const bossCollector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 120000
    });

    bossCollector.on('collect', async bi => {
      if (bi.user.id !== interaction.user.id) return;

      const chosenEnemyId = bi.values[0].replace('boss_select_', '');
      const team = db.getUserTeam(userId);
      const teamCharIds = [team.slot1, team.slot2, team.slot3, team.slot4];

      // Launch Battle Session with Equal Level Matchmaking
      const session = new BattleSession(userId, teamCharIds, chosenEnemyId);

      const imageBuffer = renderBattleCard(session);
      const attachment = new AttachmentBuilder(imageBuffer, { name: 'battle.png' });
      const remTurns = session.maxTurns - session.turnCount;

      const battleEmbed = new EmbedBuilder()
        .setTitle(`⚔️ KHIÊU CHIẾN: ${session.enemy.name} (Lv.${session.enemy.level})`)
        .setColor('#ff4d4d')
        .setImage('attachment://battle.png')
        .setDescription(`⏳ **VÒNG ĐẤU**: Turn ${session.turnCount} / ${session.maxTurns} (Còn lại **${remTurns}** lượt)\n\n${session.logs.slice(-3).join('\n')}`)
        .setFooter({ text: 'Nhấn nút bên dưới để điều khiển trận đấu!' });

      const battleComponents = createBattleComponents(session);

      await bi.update({
        embeds: [battleEmbed],
        files: [attachment],
        components: battleComponents
      });

      // Battle action collector
      const actionCollector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000
      });

      actionCollector.on('collect', async ai => {
        if (ai.user.id !== interaction.user.id) return;
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
          .setTitle(`⚔️ KHIÊU CHIẾN: ${session.enemy.name} (Lv.${session.enemy.level})`)
          .setColor(session.isFinished ? (session.winner === 'player' ? '#10b981' : '#ef4444') : '#ff4d4d')
          .setImage('attachment://battle.png')
          .setDescription(`⏳ **VÒNG ĐẤU**: Turn ${session.turnCount} / ${session.maxTurns} (Còn lại **${turnsLeft}** lượt)\n\n${session.logs.slice(-4).join('\n')}`)
          .setFooter({ text: session.isFinished ? 'Trận đấu đã kết thúc!' : 'Lượt của bạn!' });

        const newComponents = session.isFinished ? [] : createBattleComponents(session);

        await ai.editReply({
          embeds: [newEmbed],
          files: [newAttachment],
          components: newComponents
        }).catch(() => {});

        if (session.isFinished) actionCollector.stop();
      });

      bossCollector.stop();
    });

    collector.stop();
  });
}

module.exports = {
  data: battleCommand,
  execute: executeBattle
};
