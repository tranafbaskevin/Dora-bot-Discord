const { createCanvas, loadImage } = require('@napi-rs/canvas');

async function drawBattleCanvas(battleState) {
  const width = 1000;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Helper for rounded rects
  function drawRoundedRect(x, y, w, h, r) {
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.beginPath();
      ctx.rect(x, y, w, h);
    }
  }

  // 1. Dark Futuristic Sci-Fi Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#090d16');
  bgGrad.addColorStop(0.5, '#0f172a');
  bgGrad.addColorStop(1, '#050811');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Background Grid Overlay
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.05)';
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

  const { team, enemy, currentActor, turn, maxTurns, sp, maxSp, logs } = battleState;

  // ----------------------------------------------------
  // 2. TOP CENTER BOSS HUD
  // ----------------------------------------------------
  ctx.save();
  const bossHudX = 220;
  const bossHudY = 15;
  const bossHudW = 560;

  // Boss Container Background
  drawRoundedRect(bossHudX, bossHudY, bossHudW, 90, 12);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Boss Name & Level
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Sans-Serif';
  ctx.fillText(`👹 ${enemy.name.toUpperCase()} (Lv.${enemy.level})`, bossHudX + 15, bossHudY + 28);

  // Elemental Weaknesses
  const weaknesses = enemy.weaknesses || enemy.weakness || ['Fire', 'Quantum'];
  ctx.font = '12px Sans-Serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Điểm Yếu:', bossHudX + 380, bossHudY + 26);
  ctx.fillStyle = '#ef4444';
  ctx.fillText(weaknesses.join(' • '), bossHudX + 445, bossHudY + 26);

  // Boss Toughness Bar (Break Bar)
  const toughnessPct = Math.max(0, Math.min(1, (enemy.toughness || 100) / (enemy.maxToughness || 100)));
  drawRoundedRect(bossHudX + 15, bossHudY + 38, bossHudW - 30, 8, 4);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fill();
  if (toughnessPct > 0) {
    drawRoundedRect(bossHudX + 15, bossHudY + 38, (bossHudW - 30) * toughnessPct, 8, 4);
    ctx.fillStyle = '#cbd5e1';
    ctx.fill();
  }

  // Boss HP Bar
  const hpPct = Math.max(0, Math.min(1, enemy.currentHp / enemy.maxHp));
  drawRoundedRect(bossHudX + 15, bossHudY + 52, bossHudW - 30, 20, 6);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fill();

  if (hpPct > 0) {
    drawRoundedRect(bossHudX + 15, bossHudY + 52, (bossHudW - 30) * hpPct, 20, 6);
    const hpGrad = ctx.createLinearGradient(bossHudX, 0, bossHudX + bossHudW, 0);
    hpGrad.addColorStop(0, '#dc2626');
    hpGrad.addColorStop(1, '#f87171');
    ctx.fillStyle = hpGrad;
    ctx.fill();
  }

  // Boss HP Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Sans-Serif';
  ctx.textAlign = 'center';
  ctx.fillText(`❤️ HP BOSS: ${enemy.currentHp.toLocaleString()} / ${enemy.maxHp.toLocaleString()} (${Math.ceil(hpPct * 100)}%)`, bossHudX + bossHudW / 2, bossHudY + 66);
  ctx.textAlign = 'left';
  ctx.restore();

  // ----------------------------------------------------
  // 3. LEFT VERTICAL ACTION ORDER BAR (AV TURN ORDER LIST)
  // ----------------------------------------------------
  ctx.save();
  const avX = 20;
  const avY = 20;
  const avW = 160;
  const avH = 560;

  drawRoundedRect(avX, avY, avW, avH, 12);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Header Title
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px Sans-Serif';
  ctx.fillText('⚡ LƯỢT ĐẤU (AV)', avX + 15, avY + 25);

  // Vertical Connecting Line
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(avX + 40, avY + 45);
  ctx.lineTo(avX + 40, avY + avH - 20);
  ctx.stroke();

  // Build Turn Actors List
  const turnActors = [...team.filter(c => c.isAlive)];
  if (enemy.isAlive) turnActors.push(enemy);
  turnActors.sort((a, b) => (a.actionValue || 0) - (b.actionValue || 0));

  let actorY = avY + 50;
  for (let idx = 0; idx < Math.min(6, turnActors.length); idx++) {
    const act = turnActors[idx];
    const isCurrent = currentActor && (currentActor.id === act.id || currentActor.name === act.name);

    ctx.save();
    if (isCurrent) {
      drawRoundedRect(avX + 10, actorY - 5, avW - 20, 60, 8);
      ctx.fillStyle = 'rgba(234, 179, 8, 0.2)';
      ctx.fill();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Avatar Circle
    ctx.beginPath();
    ctx.arc(avX + 40, actorY + 25, 20, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = act.id === enemy.id ? '#ef4444' : '#3b82f6';
    ctx.fillRect(avX + 20, actorY + 5, 40, 40);

    if (act.icon) {
      try {
        const img = await loadImage(act.icon);
        ctx.drawImage(img, avX + 20, actorY + 5, 40, 40);
      } catch (err) {}
    }
    ctx.restore();

    // Name & Action Value
    ctx.fillStyle = isCurrent ? '#fde047' : '#ffffff';
    ctx.font = isCurrent ? 'bold 12px Sans-Serif' : '11px Sans-Serif';
    ctx.fillText(act.name.length > 10 ? act.name.substring(0, 9) + '..' : act.name, avX + 70, actorY + 22);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Sans-Serif';
    ctx.fillText(`AV ${act.actionValue || 100}`, avX + 70, actorY + 38);

    actorY += 80;
  }
  ctx.restore();

  // ----------------------------------------------------
  // 4. CENTER TRANSPARENT COMBAT BATTLE LOG OVERLAY
  // ----------------------------------------------------
  ctx.save();
  const logX = 200;
  const logY = 120;
  const logW = 780;
  const logH = 310;

  drawRoundedRect(logX, logY, logW, logH, 12);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Battle Turn & SP Header
  ctx.fillStyle = '#eab308';
  ctx.font = 'bold 14px Sans-Serif';
  ctx.fillText(`⚔️ VÒNG ĐẤU: ${turn} / ${maxTurns}`, logX + 20, logY + 30);

  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`✨ Điểm Chiến Kỹ (SP): ${sp} / ${maxSp}`, logX + 560, logY + 30);

  // Active Turn Banner
  if (currentActor) {
    drawRoundedRect(logX + 20, logY + 45, logW - 40, 32, 6);
    ctx.fillStyle = currentActor.id === enemy.id ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)';
    ctx.fill();
    ctx.strokeStyle = currentActor.id === enemy.id ? '#ef4444' : '#10b981';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Sans-Serif';
    ctx.fillText(`👉 ĐANG ĐẾN LƯỢT: ${currentActor.name.toUpperCase()} (Tốc độ: ${currentActor.speed || 100})`, logX + 35, logY + 66);
  }

  // Combat Log Dòng Tin
  const recentLogs = logs.slice(-5);
  let logTextY = logY + 115;

  recentLogs.forEach(line => {
    let cleanLine = line.replace(/\*\*/g, '').replace(/__/g, '');
    ctx.font = '13px Sans-Serif';

    if (cleanLine.includes('TUYỆT KỸ') || cleanLine.includes('CHÍ MẠNG')) {
      ctx.fillStyle = '#facc15';
    } else if (cleanLine.includes('gây') || cleanLine.includes('sát thương')) {
      ctx.fillStyle = '#f87171';
    } else if (cleanLine.includes('hồi') || cleanLine.includes('khiên')) {
      ctx.fillStyle = '#4ade80';
    } else {
      ctx.fillStyle = '#cbd5e1';
    }

    ctx.fillText(cleanLine, logX + 25, logTextY);
    logTextY += 38;
  });
  ctx.restore();

  // ----------------------------------------------------
  // 5. BOTTOM 4 TEAM CHARACTER STATUS CARDS
  // ----------------------------------------------------
  ctx.save();
  const cardW = 185;
  const cardH = 120;
  const startX = 200;
  const cardY = 460;
  const gap = 13;

  for (let i = 0; i < team.length; i++) {
    const char = team[i];
    const x = startX + i * (cardW + gap);
    const isCurrent = currentActor && currentActor.id === char.id;

    // Card Container
    drawRoundedRect(x, cardY, cardW, cardH, 10);
    ctx.fillStyle = isCurrent ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.85)';
    ctx.fill();
    ctx.strokeStyle = isCurrent ? '#eab308' : (char.isAlive ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.6)');
    ctx.lineWidth = isCurrent ? 2.5 : 1;
    ctx.stroke();

    // Active Glow Halo
    if (isCurrent) {
      ctx.fillStyle = '#eab308';
      ctx.font = 'bold 10px Sans-Serif';
      ctx.fillText('⚡ ĐANG HÀNH ĐỘNG', x + 42, cardY + 15);
    }

    // Avatar Circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + 28, cardY + 45, 18, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = char.isAlive ? '#3b82f6' : '#64748b';
    ctx.fillRect(x + 10, cardY + 27, 36, 36);

    if (char.icon) {
      try {
        const img = await loadImage(char.icon);
        ctx.drawImage(img, x + 10, cardY + 27, 36, 36);
      } catch (err) {}
    }
    ctx.restore();

    // Name & Level
    ctx.fillStyle = char.isAlive ? '#ffffff' : '#94a3b8';
    ctx.font = 'bold 12px Sans-Serif';
    ctx.fillText(`${char.name.length > 9 ? char.name.substring(0, 8) + '..' : char.name}`, x + 52, cardY + 42);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Sans-Serif';
    ctx.fillText(`Lv.${char.level} • E${char.eidolon}`, x + 52, cardY + 56);

    // HP Bar
    const charHpPct = Math.max(0, Math.min(1, char.currentHp / char.maxHp));
    drawRoundedRect(x + 10, cardY + 68, cardW - 20, 16, 4);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();

    if (charHpPct > 0) {
      drawRoundedRect(x + 10, cardY + 68, (cardW - 20) * charHpPct, 16, 4);
      ctx.fillStyle = charHpPct > 0.3 ? '#22c55e' : '#ef4444';
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Sans-Serif';
    ctx.fillText(`❤️ ${char.currentHp}/${char.maxHp}`, x + 18, cardY + 80);

    // EP Energy Bar
    const charEpPct = Math.max(0, Math.min(1, char.currentEnergy / char.maxEnergy));
    drawRoundedRect(x + 10, cardY + 92, cardW - 20, 14, 4);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();

    if (charEpPct > 0) {
      drawRoundedRect(x + 10, cardY + 92, (cardW - 20) * charEpPct, 14, 4);
      ctx.fillStyle = charEpPct >= 1.0 ? '#a855f7' : '#3b82f6';
      ctx.fill();
    }

    ctx.fillStyle = charEpPct >= 1.0 ? '#fde047' : '#ffffff';
    ctx.font = 'bold 9px Sans-Serif';
    ctx.fillText(charEpPct >= 1.0 ? '🌟 ULT SẴN SÀNG!' : `⚡ EP: ${char.currentEnergy}/${char.maxEnergy}`, x + 18, cardY + 103);
  }
  ctx.restore();

  return canvas.toBuffer('image/png');
}

module.exports = {
  drawBattleCanvas
};
