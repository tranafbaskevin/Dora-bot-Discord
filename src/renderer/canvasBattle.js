const { createCanvas } = require('@napi-rs/canvas');

function renderBattleCard(battleSession) {
  const width = 1000;
  const height = 480;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 1. BACKGROUND: Deep Space RPG Battle Field (HSR Dark Sci-Fi Theme)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#090d16');
  bgGrad.addColorStop(0.5, '#111827');
  bgGrad.addColorStop(1, '#05070c');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Background Grid / Cyber Grid lines
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
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

  // 2. TOP CENTER: BOSS HP & WEAKNESS HUD (HSR In-Game Style)
  const enemy = battleSession.enemy;

  // Boss Name
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px DejaVu Sans, Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(enemy.name, 500, 28);

  // Weakness Elements Icons Above HP Bar
  const weaknesses = enemy.weakness || enemy.weaknesses || ['Physical'];
  ctx.font = '13px DejaVu Sans, Arial, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`Weakness: ${weaknesses.join('  ')}`, 500, 46);

  // Boss HP Bar Container (Orange/Red Theme)
  const hpBarX = 260;
  const hpBarY = 54;
  const hpBarW = 480;
  const hpBarH = 18;

  ctx.fillStyle = '#1e1b4b';
  if (ctx.roundRect) ctx.roundRect(hpBarX, hpBarY, hpBarW, hpBarH, 4);
  else ctx.rect(hpBarX, hpBarY, hpBarW, hpBarH);
  ctx.fill();

  const enemyHpPct = Math.max(0, enemy.currentHp / enemy.maxHp);
  const bossHpGrad = ctx.createLinearGradient(hpBarX, 0, hpBarX + hpBarW, 0);
  bossHpGrad.addColorStop(0, '#f97316');
  bossHpGrad.addColorStop(1, '#ef4444');
  ctx.fillStyle = bossHpGrad;
  if (enemyHpPct > 0) {
    if (ctx.roundRect) ctx.roundRect(hpBarX, hpBarY, hpBarW * enemyHpPct, hpBarH, 4);
    else ctx.rect(hpBarX, hpBarY, hpBarW * enemyHpPct, hpBarH);
    ctx.fill();
  }

  ctx.font = 'bold 12px DejaVu Sans, Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${enemy.currentHp.toLocaleString()} / ${enemy.maxHp.toLocaleString()} (${Math.ceil(enemyHpPct * 100)}%)`, 500, 68);

  // 3. PLAYER PARTY SLOTS (4 CHARACTERS AT THE BOTTOM)
  const team = battleSession.team;
  const slotW = 215;
  const slotH = 145;
  const startY = 315;
  const gapX = 230;
  const startX = 40;

  team.forEach((char, idx) => {
    const x = startX + idx * gapX;

    // Card background
    ctx.fillStyle = char.currentHp > 0 ? 'rgba(30, 41, 59, 0.85)' : 'rgba(239, 68, 68, 0.2)';
    ctx.strokeStyle = char.currentHp > 0 ? (char.color || '#3b82f6') : '#ef4444';
    ctx.lineWidth = 2;
    if (ctx.roundRect) ctx.roundRect(x, startY, slotW, slotH, 8);
    else ctx.rect(x, startY, slotW, slotH);
    ctx.fill();
    ctx.stroke();

    // Slot & Character Name
    ctx.textAlign = 'left';
    ctx.font = 'bold 15px DejaVu Sans, Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${char.name}`, x + 12, startY + 24);

    ctx.font = '11px DejaVu Sans, Arial, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Lv.${char.level} | ${char.element}`, x + 12, startY + 40);

    // HP Bar
    const charHpPct = Math.max(0, char.currentHp / char.maxHp);
    const cHpBarX = x + 12;
    const cHpBarY = startY + 50;
    const cHpBarW = 190;
    const cHpBarH = 10;

    ctx.fillStyle = '#0f172a';
    if (ctx.roundRect) ctx.roundRect(cHpBarX, cHpBarY, cHpBarW, cHpBarH, 3);
    else ctx.rect(cHpBarX, cHpBarY, cHpBarW, cHpBarH);
    ctx.fill();

    const charHpGrad = ctx.createLinearGradient(cHpBarX, 0, cHpBarX + cHpBarW, 0);
    charHpGrad.addColorStop(0, '#10b981');
    charHpGrad.addColorStop(1, '#34d399');
    ctx.fillStyle = charHpGrad;
    if (charHpPct > 0) {
      if (ctx.roundRect) ctx.roundRect(cHpBarX, cHpBarY, cHpBarW * charHpPct, cHpBarH, 3);
      else ctx.rect(cHpBarX, cHpBarY, cHpBarW * charHpPct, cHpBarH);
      ctx.fill();
    }

    ctx.font = '10px DejaVu Sans, Arial, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`HP: ${char.currentHp}/${char.maxHp}`, x + 12, startY + 74);

    // Energy / Ultimate Bar (EP 0 - 100)
    const epPct = Math.max(0, Math.min(1, char.ep / char.maxEp));
    const cEpY = startY + 82;
    ctx.fillStyle = '#0f172a';
    if (ctx.roundRect) ctx.roundRect(cHpBarX, cEpY, cHpBarW, cHpBarH, 3);
    else ctx.rect(cHpBarX, cEpY, cHpBarW, cHpBarH);
    ctx.fill();

    const epGrad = ctx.createLinearGradient(cHpBarX, 0, cHpBarX + cHpBarW, 0);
    epGrad.addColorStop(0, '#3b82f6');
    epGrad.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = epGrad;
    if (epPct > 0) {
      if (ctx.roundRect) ctx.roundRect(cHpBarX, cEpY, cHpBarW * epPct, cHpBarH, 3);
      else ctx.rect(cHpBarX, cEpY, cHpBarW * epPct, cHpBarH);
      ctx.fill();
    }

    ctx.font = 'bold 10px DejaVu Sans, Arial, sans-serif';
    ctx.fillStyle = char.ep >= char.maxEp ? '#f59e0b' : '#94a3b8';
    const ultStatus = char.ep >= char.maxEp ? '🌟 TUYỆT KỸ SẴN SÀNG!' : `EP: ${char.ep}/${char.maxEp}`;
    ctx.fillText(ultStatus, x + 12, startY + 106);

    // Shield Badge if shielded
    if (char.shield > 0) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`🛡️ Khiên: +${char.shield}`, x + 12, startY + 122);
    }
  });

  // 4. COMBAT ACTION LOG OVERLAY (MIDDLE CENTER)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  if (ctx.roundRect) ctx.roundRect(40, 100, 920, 195, 8);
  else ctx.rect(40, 100, 920, 195);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.font = 'bold 14px DejaVu Sans, Arial, sans-serif';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('⚔️ NHẬT KÝ CHIẾN ĐẤU (BATTLE LOGS):', 60, 125);

  ctx.font = '13px DejaVu Sans, Arial, sans-serif';
  ctx.fillStyle = '#e2e8f0';

  const logsToShow = battleSession.logs.slice(-6);
  logsToShow.forEach((log, lIdx) => {
    ctx.fillText(log, 60, 150 + lIdx * 22);
  });

  return canvas.toBuffer('image/png');
}

module.exports = {
  renderBattleCard
};
