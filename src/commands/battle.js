const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ComponentType } = require('discord.js');
const db = require('../database/db');
const charactersData = require('../data/characters.json');
const BattleSession = require('../engine/combat');
const { renderBattleCard } = require('../renderer/canvasBattle');
const { createBattleComponents } = require('../ui/battleView');

const battleCommand = new SlashCommandBuilder()
  .setName('battle')
  .setDescription('Bắt đầu trận chiến theo lượt (Turn-based RPG)')
  .addStringOption(opt =>
    opt.setName('enemy')
      .setDescription('Chọn Boss / Quái vật muốn khiêu chiến')
      .setRequired(false)
      .addChoices(
        { name: 'Doomsday Beast (Weekly Boss)', value: 'doomsday_beast' },
        { name: 'Automaton Grizzly (Elite Monster)', value: 'automaton_grizzly' },
        { name: 'Voidranger: Trampler (Normal Monster)', value: 'voidranger_trampler' }
      )
  );

async function executeBattle(interaction) {
  const enemyId = interaction.options.getString('enemy') || 'doomsday_beast';
  const team = db.getUserTeam(interaction.user.id);
  const teamCharIds = [team.slot1, team.slot2, team.slot3, team.slot4];

  // Initialize Battle Session
  const session = new BattleSession(teamCharIds, enemyId);

  // Render initial image
  const imageBuffer = renderBattleCard(session);
  const attachment = new AttachmentBuilder(imageBuffer, { name: 'battle.png' });

  const embed = new EmbedBuilder()
    .setTitle(`⚔️ TRẬN ĐẤU KHIÊU CHIẾN - ${session.enemy.name}`)
    .setColor('#ff4d4d')
    .setImage('attachment://battle.png')
    .setDescription(session.logs.slice(-3).join('\n'))
    .setFooter({ text: 'Nhấn nút bên dưới để chọn hành động!' });

  const components = createBattleComponents(session);

  const response = await interaction.reply({
    embeds: [embed],
    files: [attachment],
    components: components,
    fetchReply: true
  });

  // Collector for Discord Buttons (5 minutes timeout)
  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 300000
  });

  collector.on('collect', async i => {
    // Only original user can play
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: '❌ Bạn không phải là người tham gia trận đấu này!', ephemeral: true });
    }

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

    // Check reward on victory
    if (session.isFinished && session.winner === 'player') {
      const user = db.getUser(interaction.user.id);
      const rewardJades = 800;
      db.updateUserJades(interaction.user.id, user.jades + rewardJades);
      session.logs.push(`🎁 **Phần thưởng chiến thắng**: +${rewardJades} Nguyên thạch!`);
    }

    // If Ultimate was triggered, send GIF Animation Cut-in message
    if (usedUltChar) {
      const charInfo = charactersData.find(c => c.id === usedUltChar.id) || usedUltChar;
      const ultName = charInfo.skills?.ultimate?.name || 'Tuyệt Kỹ';
      const ultGifUrl = charInfo.ultGif || 'https://media.giphy.com/media/L2X2a7N03XgYnJ0sCq/giphy.gif';

      const ultEmbed = new EmbedBuilder()
        .setTitle(`🌟 TUYỆT KỸ: ${charInfo.name.toUpperCase()} - "${ultName.toUpperCase()}"!`)
        .setColor(charInfo.color || '#f59e0b')
        .setImage(ultGifUrl)
        .setDescription(`✨ **${charInfo.name}** giáng đòn Tuyệt kỹ ngắt lượt hoành tráng!`);

      await i.channel.send({ embeds: [ultEmbed] });
    }

    // Render updated Canvas
    const newBuffer = renderBattleCard(session);
    const newAttachment = new AttachmentBuilder(newBuffer, { name: 'battle.png' });

    const newEmbed = new EmbedBuilder()
      .setTitle(`⚔️ TRẬN ĐẤU KHIÊU CHIẾN - ${session.enemy.name}`)
      .setColor(session.isFinished ? (session.winner === 'player' ? '#10b981' : '#ef4444') : '#ff4d4d')
      .setImage('attachment://battle.png')
      .setDescription(session.logs.slice(-4).join('\n'))
      .setFooter({ text: session.isFinished ? 'Trận đấu đã kết thúc!' : 'Lượt của bạn!' });

    const newComponents = session.isFinished ? [] : createBattleComponents(session);

    await i.update({
      embeds: [newEmbed],
      files: [newAttachment],
      components: newComponents
    });

    if (session.isFinished) {
      collector.stop();
    }
  });

  collector.on('end', () => {
    // Clean up or disable buttons if timed out
  });
}

module.exports = {
  data: battleCommand,
  execute: executeBattle
};
