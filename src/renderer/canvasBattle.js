const { createCanvas } = require('@napi-rs/canvas');

function renderBattleCard(battleSession) {
  const canvas = createCanvas(1000, 562);
  const ctx = canvas.getContext('2d');

  // 1. Dark Space Battlefield Background (16:9 HD)
  const bgGrad = ctx.createLinearGradient(0, 0, 1000, 562);
  bgGrad.addColorStop(0, '#060712');
  bgGrad.addColorStop(0.4, '#101428');
  bgGrad.addColorStop(1, '#080a18');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1000, 562);

  // Background Nebula Accents
  ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
  ctx.beginPath();
  ctx.arc(800, 200, 300, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(236, 72, 153, 0.05)';
  ctx.beginPath();
  ctx.arc(200, 400, 250, 0, Math.PI * 2);
  ctx.fill();

  // Outer Screen Frame
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 998, 560);

  // 2. TOP CENTER: BOSS HP & WEAKNESS HUD (HSR In-Game Style)
  const enemy = battleSession.enemy;

  // Boss Name
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px DejaVu Sans, Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(enemy.name, 500, 28);

  // Weakness Elements Icons Above HP Bar
  ctx.font = '13px DejaVu Sans, Arial, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`Weakness: ${enemy.weaknesses.join('  ')}`, 500, 46);

  // Boss HP Bar Container (Orange/Red Theme)
  const hpBarX = 260;
  const hpBarY = 54;
  const hpBarW = 480;
  const hpBarH = 18;

  ctx.fillStyle = '#1e1b4b';
  ctx.roundRect(hpBarX, hpBarY, hpBarW, hpBarH, 4);
  ctx.fill();

  const enemyHpPct = Math.max(0, enemy.currentHp / enemy.maxHp);
  const bossHpGrad = ctx.createLinearGradient(hpBarX, 0, hpBarX + hpBarW, 0);
  bossHpGrad.addColorStop(0, '#f97316');
  bossHpGrad.addColorStop(1, '#ef4444');
  ctx.fillStyle = bossHpGrad;
  if (enemyHpPct > 0) {
    ctx.roundRect(hpBarX, hpBarY, Math.floor(hpBarW * enemyHpPct), hpBarH, 4);
    ctx.fill();
  }

  // Boss HP Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px DejaVu Sans, Arial, sans-serif';
  ctx.fillText(`${Math.round(enemyHpPct * 100)}%  (${enemy.currentHp.toLocaleString()} / ${enemy.maxHp.toLocaleString()} HP)`, 500, hpBarY + 14);

  // 3. TOP-LEFT: VERTICAL TURN QUEUE (Action Value List)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.roundRect(15, 15, 75, 240, 8);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.roundRect(15, 15, 75, 240, 8);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = 'bold 11px DejaVu Sans, Arial, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('ACTION', 52, 32);

  // Sort queue by action value
  const allActors = [...battleSession.team.filter(c => c.isAlive), enemy].sort((a, b) => a.actionValue - b.actionValue);

  allActors.slice(0, 4).forEach((actor, idx) => {
    const itemY = 48 + idx * 46;
    const isCurrent = battleSession.currentActor === actor;

    ctx.fillStyle = isCurrent ? (actor === enemy ? '#ef4444' : '#0284c7') : '#1e293b';
    ctx.beginPath();
    ctx.arc(52, itemY + 16, 17, 0, Math.PI * 2);
    ctx.fill();

    if (isCurrent) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px DejaVu Sans, Arial, sans-serif';
    ctx.fillText(actor.name.charAt(0), 52, itemY + 21);
  });

  // 4. BOTTOM-RIGHT: SKILL POINTS & ACTION STATUS
  ctx.textAlign = 'right';
  ctx.font = 'bold 18px DejaVu Sans, Arial, sans-serif';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(`⭐ Skill Points: ${battleSession.sp} / ${battleSession.maxSp}`, 970, 420);

  const isEnemyTurn = battleSession.currentActor === enemy;
  ctx.font = '14px DejaVu Sans, Arial, sans-serif';
  ctx.fillStyle = isEnemyTurn ? '#f87171' : '#38bdf8';
  ctx.fillText(isEnemyTurn ? '👹 Kẻ địch đang tấn công...' : `⚡ Lượt của: ${battleSession.currentActor.name}`, 970, 442);

  // 5. BOTTOM PARTY HUD (4 Character Slots)
  const partyY = 460;
  const slotW = 225;
  const gap = 15;
  const startX = 20;

  battleSession.team.forEach((char, idx) => {
    const x = startX + idx * (slotW + gap);
    const isCurrentTurn = battleSession.currentActor === char;

    // Slot Background Card
    ctx.fillStyle = char.isAlive
      ? (isCurrentTurn ? 'rgba(14, 116, 144, 0.45)' : 'rgba(15, 23, 42, 0.75)')
      : 'rgba(15, 23, 42, 0.3)';
    ctx.roundRect(x, partyY, slotW, 85, 8);
    ctx.fill();

    ctx.strokeStyle = isCurrentTurn ? '#38bdf8' : (char.isAlive ? '#334155' : '#1e293b');
    ctx.lineWidth = isCurrentTurn ? 2.5 : 1;
    ctx.roundRect(x, partyY, slotW, 85, 8);
    ctx.stroke();

    // Circular Avatar Frame (Left Side of Slot)
    const avatarX = x + 32;
    const avatarY = partyY + 42;
    const isUltReady = char.currentEnergy >= char.maxEnergy && char.isAlive;

    // Outer Energy Ring around avatar
    ctx.strokeStyle = isUltReady ? '#f59e0b' : '#0284c7';
    ctx.lineWidth = isUltReady ? 3.5 : 2;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, 25, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = char.isAlive ? (char.color || '#3b82f6') : '#334155';
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px DejaVu Sans, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(char.name.charAt(0), avatarX, avatarY + 6);

    // Character Details (Right Side of Slot)
    ctx.textAlign = 'left';
    ctx.font = 'bold 15px DejaVu Sans, Arial, sans-serif';
    ctx.fillStyle = char.isAlive ? '#ffffff' : '#64748b';
    ctx.fillText(char.name, x + 68, partyY + 26);

    ctx.font = '11px DejaVu Sans, Arial, sans-serif';
    ctx.fillStyle = char.color || '#38bdf8';
    ctx.fillText(`${char.element} • ${char.path}`, x + 68, partyY + 42);

    // HP Line Gauge
    const charHpPct = Math.max(0, char.currentHp / char.maxHp);
    const hpBarW = 140;
    const hpBarY = partyY + 48;

    ctx.fillStyle = '#0f172a';
    ctx.roundRect(x + 68, hpBarY, hpBarW, 10, 3);
    ctx.fill();

    ctx.fillStyle = char.isAlive ? (charHpPct < 0.3 ? '#ef4444' : '#06b6d4') : '#334155';
    if (charHpPct > 0) {
      ctx.roundRect(x + 68, hpBarY, Math.floor(hpBarW * charHpPct), 10, 3);
      ctx.fill();
    }

    // Numeric HP / Shield / Ult Badge
    ctx.font = 'bold 11px DejaVu Sans, Arial, sans-serif';
    if (isUltReady) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`🌟 ULT READY  (${char.currentHp} HP)`, x + 68, partyY + 74);
    } else if (char.shield > 0) {
      ctx.fillStyle = '#60a5fa';
      ctx.fillText(`🛡️ +${char.shield} Shield (${char.currentHp} HP)`, x + 68, partyY + 74);
    } else {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`${char.currentHp} / ${char.maxHp} HP`, x + 68, partyY + 74);
    }
  });

  return canvas.toBuffer('image/png');
}

module.exports = { renderBattleCard };
