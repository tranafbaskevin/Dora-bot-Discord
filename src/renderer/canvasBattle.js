const { createCanvas } = require('@napi-rs/canvas');

function renderBattleCard(battleSession) {
  const width = 1000;
  const height = 520;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 1. BACKGROUND: Dark Sci-Fi Cyber Grid (HSR Style)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#090d16');
  bgGrad.addColorStop(0.5, '#111827');
  bgGrad.addColorStop(1, '#05070c');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Background Cyber Grid lines
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const enemy = battleSession.enemy;
  const team = battleSession.team;
  const activeChar = team.find(c => c.currentHp > 0) || team[0];

  // 2. TOP BANNER: ACTIVE TURN INDICATOR & TURN COUNTER
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(0, 0, width, 38);
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, width, 38);

  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText(`⏳ VÒNG ĐẤU: Turn ${battleSession.turnCount} / ${battleSession.maxTurns} (Còn ${battleSession.maxTurns - battleSession.turnCount} lượt)`, 20, 24);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`👉 ĐANG ĐẾN LƯỢT: ${activeChar ? activeChar.name.toUpperCase() : 'PHE TA'}`, 980, 24);

  // 3. BOSS HUD (TOP CENTER)
  // Boss Name & Level
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#ef4444';
  ctx.fillText(`👹 BOSS: ${enemy.name.toUpperCase()} (Lv.${enemy.level})`, 500, 70);

  // Weaknesses
  const weaknesses = enemy.weakness || enemy.weaknesses || ['Physical'];
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`Điểm Yếu: [ ${weaknesses.join(' • ')} ]`, 500, 92);

  // Boss HP Bar Container
  const hpBarX = 220;
  const hpBarY = 102;
  const hpBarW = 560;
  const hpBarH = 22;

  ctx.fillStyle = '#1e1b4b';
  if (ctx.roundRect) ctx.roundRect(hpBarX, hpBarY, hpBarW, hpBarH, 4);
  else ctx.rect(hpBarX, hpBarY, hpBarW, hpBarH);
  ctx.fill();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const enemyHpPct = Math.max(0, enemy.currentHp / enemy.maxHp);
  const bossHpGrad = ctx.createLinearGradient(hpBarX, 0, hpBarX + hpBarW, 0);
  bossHpGrad.addColorStop(0, '#f97316');
  bossHpGrad.addColorStop(1, '#ef4444');
  ctx.fillStyle = bossHpGrad;
  if (enemyHpPct > 0) {
    if (ctx.roundRect) ctx.roundRect(hpBarX + 1, hpBarY + 1, (hpBarW - 2) * enemyHpPct, hpBarH - 2, 3);
    else ctx.rect(hpBarX + 1, hpBarY + 1, (hpBarW - 2) * enemyHpPct, hpBarH - 2);
    ctx.fill();
  }

  // Boss HP Text
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`❤️ HP BOSS: ${enemy.currentHp.toLocaleString()} / ${enemy.maxHp.toLocaleString()} (${Math.ceil(enemyHpPct * 100)}%)`, 500, 118);

  // 4. COMBAT ACTION LOG OVERLAY (MIDDLE)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  if (ctx.roundRect) ctx.roundRect(30, 138, 940, 185, 8);
  else ctx.rect(30, 138, 940, 185);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('📜 NHẬT KÝ CHIẾN ĐẤU (BATTLE LOGS):', 50, 162);

  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#f1f5f9';

  const logsToShow = battleSession.logs.slice(-5);
  logsToShow.forEach((log, lIdx) => {
    ctx.fillText(log, 50, 188 + lIdx * 24);
  });

  // 5. PLAYER PARTY CARDS (BOTTOM - 4 SLOTS)
  const slotW = 222;
  const slotH = 170;
  const startY = 335;
  const gapX = 236;
  const startX = 30;

  team.forEach((char, idx) => {
    const x = startX + idx * gapX;
    const isCurrentTurnChar = (char === activeChar && char.currentHp > 0);

    // Card background
    ctx.fillStyle = char.currentHp > 0 ? 'rgba(30, 41, 59, 0.95)' : 'rgba(239, 68, 68, 0.25)';
    ctx.strokeStyle = isCurrentTurnChar ? '#f59e0b' : (char.currentHp > 0 ? (char.color || '#3b82f6') : '#ef4444');
    ctx.lineWidth = isCurrentTurnChar ? 3 : 1.5;

    if (ctx.roundRect) ctx.roundRect(x, startY, slotW, slotH, 8);
    else ctx.rect(x, startY, slotW, slotH);
    ctx.fill();
    ctx.stroke();

    // Turn Banner badge if active turn!
    if (isCurrentTurnChar) {
      ctx.fillStyle = '#f59e0b';
      if (ctx.roundRect) ctx.roundRect(x, startY, slotW, 22, [8, 8, 0, 0]);
      else ctx.rect(x, startY, slotW, 22);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText('⚡ DANG HANH DONG', x + slotW / 2, startY + 15);
    }

    // Character Name & Level
    const nameY = isCurrentTurnChar ? startY + 40 : startY + 25;
    ctx.textAlign = 'left';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${char.name}`, x + 10, nameY);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Lv.${char.level} | ${char.element}`, x + 10, nameY + 16);

    // HP Bar Container
    const charHpPct = Math.max(0, char.currentHp / char.maxHp);
    const cHpBarX = x + 10;
    const cHpBarY = nameY + 26;
    const cHpBarW = 202;
    const cHpBarH = 12;

    ctx.fillStyle = '#0f172a';
    if (ctx.roundRect) ctx.roundRect(cHpBarX, cHpBarY, cHpBarW, cHpBarH, 3);
    else ctx.rect(cHpBarX, cHpBarY, cHpBarW, cHpBarH);
    ctx.fill();

    const charHpGrad = ctx.createLinearGradient(cHpBarX, 0, cHpBarX + cHpBarW, 0);
    charHpGrad.addColorStop(0, '#10b981');
    charHpGrad.addColorStop(1, '#34d399');
    ctx.fillStyle = charHpGrad;
    if (charHpPct > 0) {
      if (ctx.roundRect) ctx.roundRect(cHpBarX + 1, cHpBarY + 1, (cHpBarW - 2) * charHpPct, cHpBarH - 2, 2);
      else ctx.rect(cHpBarX + 1, cHpBarY + 1, (cHpBarW - 2) * charHpPct, cHpBarH - 2);
      ctx.fill();
    }

    // HP Text
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`❤️ HP: ${char.currentHp} / ${char.maxHp}`, x + 12, cHpBarY + 24);

    // Energy / EP Bar Container (CurrentEnergy / MaxEnergy)
    const curEnergy = char.currentEnergy || 0;
    const maxEnergy = char.maxEnergy || 120;
    const epPct = Math.max(0, Math.min(1, curEnergy / maxEnergy));
    const cEpY = cHpBarY + 30;

    ctx.fillStyle = '#0f172a';
    if (ctx.roundRect) ctx.roundRect(cHpBarX, cEpY, cHpBarW, cHpBarH, 3);
    else ctx.rect(cHpBarX, cEpY, cHpBarW, cHpBarH);
    ctx.fill();

    const epGrad = ctx.createLinearGradient(cHpBarX, 0, cHpBarX + cHpBarW, 0);
    epGrad.addColorStop(0, '#3b82f6');
    epGrad.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = epGrad;
    if (epPct > 0) {
      if (ctx.roundRect) ctx.roundRect(cHpBarX + 1, cEpY + 1, (cHpBarW - 2) * epPct, cHpBarH - 2, 2);
      else ctx.rect(cHpBarX + 1, cEpY + 1, (cHpBarW - 2) * epPct, cHpBarH - 2);
      ctx.fill();
    }

    // EP / Mana Text
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = curEnergy >= maxEnergy ? '#f59e0b' : '#38bdf8';
    const ultStatus = curEnergy >= maxEnergy
      ? `🌟 ULT SẴN SÀNG! (${curEnergy}/${maxEnergy})`
      : `⚡ EP: ${curEnergy} / ${maxEnergy}`;
    ctx.fillText(ultStatus, x + 12, cEpY + 24);

    // Shield Badge if shielded
    if (char.shield > 0) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`🛡️ Khiên: +${char.shield}`, x + 12, cEpY + 38);
    }
  });

  return canvas.toBuffer('image/png');
}

module.exports = {
  renderBattleCard
};
