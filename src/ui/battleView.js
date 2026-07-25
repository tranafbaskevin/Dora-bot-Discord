const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

function createBattleComponents(battleSession) {
  const rows = [];

  // Row 1: Basic Attack & Skill Buttons
  const mainRow = new ActionRowBuilder();

  const isPlayerTurn = !battleSession.isFinished && battleSession.currentActor !== battleSession.enemy;

  mainRow.addComponents(
    new ButtonBuilder()
      .setCustomId('battle_basic')
      .setLabel('🗡️ Đánh Thường')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!isPlayerTurn)
  );

  mainRow.addComponents(
    new ButtonBuilder()
      .setCustomId('battle_skill')
      .setLabel(`💥 Chiến Kỹ (${battleSession.currentActor?.skills?.skill?.name || 'Skill'})`)
      .setStyle(ButtonStyle.Success)
      .setDisabled(!isPlayerTurn || battleSession.sp < 1)
  );

  rows.push(mainRow);

  // Row 2: Ultimate Buttons for characters with full energy
  const ultRow = new ActionRowBuilder();
  let hasUlt = false;

  battleSession.team.forEach(char => {
    if (char.isAlive && char.currentEnergy >= char.maxEnergy) {
      hasUlt = true;
      ultRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`battle_ult_${char.slot}`)
          .setLabel(`🌟 ULT: ${char.name}`)
          .setStyle(ButtonStyle.Danger)
          .setDisabled(battleSession.isFinished)
      );
    }
  });

  if (hasUlt) {
    rows.push(ultRow);
  }

  return rows;
}

module.exports = { createBattleComponents };
