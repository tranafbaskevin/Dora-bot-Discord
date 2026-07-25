const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const db = require('../database/db');
const charactersData = require('../data/characters.json');
const BattleSession = require('../engine/combat');
const { renderBattleCard } = require('../renderer/canvasBattle');
const { createBattleComponents } = require('../ui/battleView');

const lahoanCommand = new SlashCommandBuilder()
  .setName('lahoan')
  .setDescription('Thử thách Sảnh Đường Lãng Quên (Memory of Chaos 36 Tầng)')
  .addIntegerOption(opt =>
    opt.setName('floor')
      .setDescription('Chọn Tầng La Hoàn (Tầng 1 -> 36)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(36)
  );

async function executeLaHoan(interaction) {
  const floor = interaction.options.getInteger('floor');
  const user = db.getUser(interaction.user.id);

  // Level requirements for floors
  let reqLevel = 5;
  if (floor > 10) reqLevel = 20;
  if (floor > 20) reqLevel = 35;
  if (floor > 30) reqLevel = 50;

  if (user.player_level < reqLevel) {
    return interaction.reply({
      content: `⚠️ Cấp Thám Hiểm của bạn quá thấp! (Yêu cầu **Cấp Thám Hiểm Lv.${reqLevel}** để khiêu chiến Tầng ${floor}, cấp hiện tại của bạn là Lv.${user.player_level}).`,
      ephemeral: true
    });
  }

  // Buff Selection Prompt Embed
  const buffEmbed = new EmbedBuilder()
    .setTitle(`🏛️ SẢNH ĐƯỜNG LÃNG QUÊN - TẦNG ${floor} / 36`)
    .setColor('#a855f7')
    .setDescription(`Trước khi vào trận đấu Tầng ${floor}, hãy chọn **1 TRONG 3 BUFF ĐẶC BIỆT** bên dưới để cường hóa sức mạnh cho toàn đội!`)
    .addFields(
      { name: '⚔️ Buff 1: Vệt Cắt Chí Mạng', value: 'Tăng **+40% CRIT Rate** & **+80% CRIT DMG** cho toàn đội!', inline: false },
      { name: '🌟 Buff 2: Khai Phá Bão Tố', value: 'Tăng **+60% Sát thương Tuyệt Kỹ** & Hồi EP liên tục!', inline: false },
      { name: '🛡️ Buff 3: Chiến Thuật Bền Bỉ', value: 'Hồi **+2 Điểm SP** mỗi lượt & Tạo Khiên 1,200 HP bảo vệ!', inline: false }
    )
    .setFooter({ text: 'Nhấp chọn nút Buff bên dưới để vào trận đấu!' });

  const buffButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('lahoan_buff_1').setLabel('⚔️ Buff Chí Mạng').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('lahoan_buff_2').setLabel('🌟 Buff Tuyệt Kỹ').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('lahoan_buff_3').setLabel('🛡️ Buff Khiên & SP').setStyle(ButtonStyle.Danger)
  );

  const response = await interaction.reply({
    embeds: [buffEmbed],
    components: [buffButtons],
    fetchReply: true
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60000
  });

  collector.on('collect', async i => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: '❌ Bạn không phải là người sở hữu lượt khiêu chiến này!', ephemeral: true });
    }

    await i.deferUpdate().catch(() => {});

    let chosenBuff = 'crit';
    let buffName = 'Vệt Cắt Chí Mạng (+40% CRIT)';
    if (i.customId === 'lahoan_buff_2') {
      chosenBuff = 'ult';
      buffName = 'Khai Phá Bão Tố (+60% Ult DMG)';
    } else if (i.customId === 'lahoan_buff_3') {
      chosenBuff = 'sp';
      buffName = 'Chiến Thuật Bền Bỉ (+2 SP & Shield)';
    }

    const team = db.getUserTeam(interaction.user.id);
    const teamCharIds = [team.slot1, team.slot2, team.slot3, team.slot4];

    // Floor scaling: floor 1 to 36
    const enemyId = floor % 3 === 0 ? 'doomsday_beast' : (floor % 2 === 0 ? 'automaton_grizzly' : 'voidranger_trampler');
    const session = new BattleSession(interaction.user.id, teamCharIds, enemyId);

    // Apply Floor multiplier
    const floorScale = 1.0 + (floor - 1) * 0.12;
    session.enemy.maxHp = Math.floor(session.enemy.maxHp * floorScale);
    session.enemy.currentHp = session.enemy.maxHp;
    session.enemy.atk = Math.floor(session.enemy.atk * floorScale);

    // Apply Selected Buff to team
    session.team.forEach(char => {
      if (chosenBuff === 'crit') {
        char.atk = Math.floor(char.atk * 1.4);
      } else if (chosenBuff === 'ult') {
        char.currentEnergy = char.maxEnergy; // Start with full Ult energy!
      } else if (chosenBuff === 'sp') {
        char.shield += 1200;
        session.sp = 5;
      }
    });

    session.logs.unshift(`🏛️ **SẢNH ĐƯỜNG LÃNG QUÊN TẦNG ${floor}** - Tải Buff: **${buffName}**!`);

    const imageBuffer = renderBattleCard(session);
    const attachment = new AttachmentBuilder(imageBuffer, { name: 'battle.png' });

    const battleEmbed = new EmbedBuilder()
      .setTitle(`🏛️ SẢNH ĐƯỜNG LÃNG QUÊN TẦNG ${floor} / 36`)
      .setColor('#a855f7')
      .setImage('attachment://battle.png')
      .setDescription(session.logs.slice(-3).join('\n'))
      .setFooter({ text: 'Nhấn nút bên dưới để điều khiển trận đấu!' });

    const components = createBattleComponents(session);

    await i.editReply({
      embeds: [battleEmbed],
      files: [attachment],
      components: components
    });

    // Battle action collector
    const battleCollector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000
    });

    battleCollector.on('collect', async bi => {
      if (bi.user.id !== interaction.user.id) return;
      await bi.deferUpdate().catch(() => {});

      const customId = bi.customId;
      let usedUltChar = null;

      if (customId === 'battle_basic') session.executeBasicAttack();
      else if (customId === 'battle_skill') session.executeSkill();
      else if (customId.startsWith('battle_ult_')) {
        const slot = parseInt(customId.replace('battle_ult_', ''), 10);
        usedUltChar = session.team.find(c => c.slot === slot);
        session.executeUltimate(slot);
      }

      if (session.isFinished && session.winner === 'player') {
        const rewardJades = 200 + floor * 50;
        db.updateUserJades(interaction.user.id, user.jades + rewardJades);
        session.logs.push(`🎁 **PHẦN THƯỞNG VƯỢT TẦNG ${floor}**: +${rewardJades} Nguyên thạch (Stellar Jade)!`);
      }

      const newBuffer = renderBattleCard(session);
      const newAttachment = new AttachmentBuilder(newBuffer, { name: 'battle.png' });

      const newEmbed = new EmbedBuilder()
        .setTitle(`🏛️ SẢNH ĐƯỜNG LÃNG QUÊN TẦNG ${floor} / 36`)
        .setColor(session.isFinished ? (session.winner === 'player' ? '#10b981' : '#ef4444') : '#a855f7')
        .setImage('attachment://battle.png')
        .setDescription(session.logs.slice(-4).join('\n'))
        .setFooter({ text: session.isFinished ? 'Trận đấu kết thúc!' : 'Lượt của bạn!' });

      const newComponents = session.isFinished ? [] : createBattleComponents(session);

      await bi.editReply({
        embeds: [newEmbed],
        files: [newAttachment],
        components: newComponents
      }).catch(() => {});

      if (session.isFinished) battleCollector.stop();
    });

    collector.stop();
  });
}

module.exports = {
  data: lahoanCommand,
  execute: executeLaHoan
};
