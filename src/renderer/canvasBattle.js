const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');

async function drawBattleCanvas(battleState) {
  const width = 1920;
  const height = 1080;
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

  // 1. Draw HSR Wanted Posters Background Image (assets/battle_bg.jpg)
  const bgPath = path.join(__dirname, '../../assets/battle_bg.jpg');
  let bgLoaded = false;
  if (fs.existsSync(bgPath)) {
    try {
      const bgImg = await loadImage(bgPath);
      ctx.drawImage(bgImg, 0, 0, width, height);
      bgLoaded = true;
    } catch (err) {}
  }

  if (!bgLoaded) {
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#060913');
    bgGrad.addColorStop(0.5, '#0b1329');
    bgGrad.addColorStop(1, '#03050c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // Dark Sci-Fi Glassmorphism Overlay Tint
  ctx.fillStyle = 'rgba(10, 15, 30, 0.72)';
  ctx.fillRect(0, 0, width, height);

  // Background Sci-Fi Grid Overlay
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
  ctx.lineWidth = 1.5;
  for (let x = 0; x < width; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const { team, enemy, currentActor, turn, maxTurns, sp, maxSp, logs } = battleState;

  // ----------------------------------------------------
  // 2. TOP CENTER BOSS HUD (WITH BOSS AVATAR PORTRAIT)
  // ----------------------------------------------------
  ctx.save();
  const bossHudX = 380;
  const bossHudY = 30;
  const bossHudW = 1510;

  // Boss Container Background
  drawRoundedRect(bossHudX, bossHudY, bossHudW, 160, 16);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Boss Avatar Portrait (Radius 50px, Size 100x100px)
  ctx.save();
  ctx.beginPath();
  ctx.arc(bossHudX + 75, bossHudY + 80, 50, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = '#ef4444';
  ctx.fillRect(bossHudX + 25, bossHudY + 30, 100, 100);

  if (enemy.icon) {
    try {
      const bossIconPath = enemy.icon.startsWith('http') ? enemy.icon : path.join(__dirname, '../../', enemy.icon);
      const bossImg = await loadImage(bossIconPath);
      ctx.drawImage(bossImg, bossHudX + 25, bossHudY + 30, 100, 100);
    } catch (err) {}
  }
  ctx.restore();

  // Boss Name & Level
  const nameStartX = bossHudX + 145;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(`👹 ${enemy.name.toUpperCase()} (Lv.${enemy.level})`, nameStartX, bossHudY + 48);

  // Elemental Weaknesses
  const weaknesses = enemy.weaknesses || enemy.weakness || ['Fire', 'Quantum'];
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Điểm Yếu:', bossHudX + bossHudW - 380, bossHudY + 46);
  ctx.fillStyle = '#ef4444';
  ctx.fillText(weaknesses.join(' • '), bossHudX + bossHudW - 260, bossHudY + 46);

  // Boss Toughness Bar (Break Bar)
  const toughnessPct = Math.max(0, Math.min(1, (enemy.toughness || 100) / (enemy.maxToughness || 100)));
  drawRoundedRect(nameStartX, bossHudY + 65, bossHudW - 175, 14, 7);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fill();
  if (toughnessPct > 0) {
    drawRoundedRect(nameStartX, bossHudY + 65, (bossHudW - 175) * toughnessPct, 14, 7);
    ctx.fillStyle = '#cbd5e1';
    ctx.fill();
  }

  // Boss HP Bar
  const hpPct = Math.max(0, Math.min(1, enemy.currentHp / enemy.maxHp));
  drawRoundedRect(nameStartX, bossHudY + 90, bossHudW - 175, 42, 10);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fill();

  if (hpPct > 0) {
    drawRoundedRect(nameStartX, bossHudY + 90, (bossHudW - 175) * hpPct, 42, 10);
    const hpGrad = ctx.createLinearGradient(nameStartX, 0, bossHudX + bossHudW, 0);
    hpGrad.addColorStop(0, '#dc2626');
    hpGrad.addColorStop(1, '#f87171');
    ctx.fillStyle = hpGrad;
    ctx.fill();
  }

  // Boss HP Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`❤️ HP BOSS: ${enemy.currentHp.toLocaleString()} / ${enemy.maxHp.toLocaleString()} (${Math.ceil(hpPct * 100)}%)`, nameStartX + (bossHudW - 175) / 2, bossHudY + 120);
  ctx.textAlign = 'left';
  ctx.restore();

  // ----------------------------------------------------
  // 3. LEFT VERTICAL ACTION VALUE TURN ORDER BAR
  // ----------------------------------------------------
  ctx.save();
  const avX = 30;
  const avY = 30;
  const avW = 320;
  const avH = 1020;

  drawRoundedRect(avX, avY, avW, avH, 18);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Header Title
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('⚡ LƯỢT ĐẤU (AV)', avX + 25, avY + 48);

  // Vertical Line
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(avX + 70, avY + 75);
  ctx.lineTo(avX + 70, avY + avH - 30);
  ctx.stroke();

  // Build Turn Actors List
  const turnActors = [...team.filter(c => c.isAlive)];
  if (enemy.isAlive) turnActors.push(enemy);
  turnActors.sort((a, b) => (a.actionValue || 0) - (b.actionValue || 0));

  let actorY = avY + 85;
  for (let idx = 0; idx < Math.min(6, turnActors.length); idx++) {
    const act = turnActors[idx];
    const isCurrent = currentActor && (currentActor.id === act.id || currentActor.name === act.name);

    ctx.save();
    if (isCurrent) {
      drawRoundedRect(avX + 12, actorY - 8, avW - 24, 120, 14);
      ctx.fillStyle = 'rgba(234, 179, 8, 0.28)';
      ctx.fill();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3.5;
      ctx.stroke();
    }

    // AVATAR CIRCLE (Radius 45px, Size 90x90px)
    ctx.beginPath();
    ctx.arc(avX + 65, actorY + 52, 45, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = act.id === enemy.id ? '#ef4444' : '#3b82f6';
    ctx.fillRect(avX + 20, actorY + 7, 90, 90);

    if (act.icon) {
      try {
        const iconPath = act.icon.startsWith('http') ? act.icon : path.join(__dirname, '../../', act.icon);
        const img = await loadImage(iconPath);
        ctx.drawImage(img, avX + 20, actorY + 7, 90, 90);
      } catch (err) {}
    }
    ctx.restore();

    // Name & AV Text
    ctx.fillStyle = isCurrent ? '#fde047' : '#ffffff';
    ctx.font = isCurrent ? 'bold 22px sans-serif' : 'bold 19px sans-serif';
    ctx.fillText(act.name.length > 10 ? act.name.substring(0, 9) + '..' : act.name, avX + 125, actorY + 48);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText(`AV ${act.actionValue || 100}`, avX + 125, actorY + 76);

    actorY += 150;
  }
  ctx.restore();

  // ----------------------------------------------------
  // 4. CENTER TRANSPARENT COMBAT BATTLE LOG OVERLAY
  // ----------------------------------------------------
  ctx.save();
  const logX = 380;
  const logY = 210;
  const logW = 1510;
  const logH = 590;

  drawRoundedRect(logX, logY, logW, logH, 18);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Header Title
  ctx.fillStyle = '#eab308';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`⚔️ VÒNG ĐẤU: ${turn} / ${maxTurns}`, logX + 35, logY + 48);

  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`✨ Điểm Chiến Kỹ (SP): ${sp} / ${maxSp}`, logX + logW - 380, logY + 48);

  // Active Turn Banner
  if (currentActor) {
    drawRoundedRect(logX + 30, logY + 70, logW - 60, 56, 10);
    ctx.fillStyle = currentActor.id === enemy.id ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)';
    ctx.fill();
    ctx.strokeStyle = currentActor.id === enemy.id ? '#ef4444' : '#10b981';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`👉 ĐANG ĐẾN LƯỢT: ${currentActor.name.toUpperCase()} (Tốc độ: ${currentActor.speed || 100})`, logX + 55, logY + 106);
  }

  // Combat Log Dòng Tin
  const recentLogs = logs.slice(-5);
  let logTextY = logY + 180;

  recentLogs.forEach(line => {
    let cleanLine = line.replace(/\*\*/g, '').replace(/__/g, '');
    ctx.font = 'bold 23px sans-serif';

    if (cleanLine.includes('TUYỆT KỸ') || cleanLine.includes('CHÍ MẠNG')) {
      ctx.fillStyle = '#facc15';
    } else if (cleanLine.includes('gây') || cleanLine.includes('sát thương')) {
      ctx.fillStyle = '#f87171';
    } else if (cleanLine.includes('hồi') || cleanLine.includes('khiên')) {
      ctx.fillStyle = '#4ade80';
    } else {
      ctx.fillStyle = '#cbd5e1';
    }

    ctx.fillText(cleanLine, logX + 40, logTextY);
    logTextY += 75;
  });
  ctx.restore();

  // ----------------------------------------------------
  // 5. BOTTOM 4 TEAM CHARACTER STATUS CARDS
  // ----------------------------------------------------
  ctx.save();
  const cardW = 360;
  const cardH = 230;
  const startX = 380;
  const cardY = 820;
  const gap = 23;

  for (let i = 0; i < team.length; i++) {
    const char = team[i];
    const x = startX + i * (cardW + gap);
    const isCurrent = currentActor && currentActor.id === char.id;

    // Card Container
    drawRoundedRect(x, cardY, cardW, cardH, 16);
    ctx.fillStyle = isCurrent ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.90)';
    ctx.fill();
    ctx.strokeStyle = isCurrent ? '#eab308' : (char.isAlive ? 'rgba(59, 130, 246, 0.5)' : 'rgba(239, 68, 68, 0.6)');
    ctx.lineWidth = isCurrent ? 3.5 : 1.5;
    ctx.stroke();

    // Active Glow Banner
    if (isCurrent) {
      ctx.fillStyle = '#eab308';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('⚡ ĐANG HÀNH ĐỘNG', x + 140, cardY + 26);
    }

    // AVATAR CIRCLE (Radius 52px, Size 104x104px)
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + 68, cardY + 70, 52, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = char.isAlive ? '#3b82f6' : '#64748b';
    ctx.fillRect(x + 16, cardY + 18, 104, 104);

    if (char.icon) {
      try {
        const iconPath = char.icon.startsWith('http') ? char.icon : path.join(__dirname, '../../', char.icon);
        const img = await loadImage(iconPath);
        ctx.drawImage(img, x + 16, cardY + 18, 104, 104);
      } catch (err) {}
    }
    ctx.restore();

    // Name & Level
    ctx.fillStyle = char.isAlive ? '#ffffff' : '#94a3b8';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`${char.name.length > 8 ? char.name.substring(0, 7) + '..' : char.name}`, x + 135, cardY + 65);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`Lv.${char.level} • E${char.eidolon}`, x + 135, cardY + 95);

    // HP Bar
    const charHpPct = Math.max(0, Math.min(1, char.currentHp / char.maxHp));
    drawRoundedRect(x + 20, cardY + 132, cardW - 40, 32, 8);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fill();

    if (charHpPct > 0) {
      drawRoundedRect(x + 20, cardY + 132, (cardW - 40) * charHpPct, 32, 8);
      ctx.fillStyle = charHpPct > 0.3 ? '#22c55e' : '#ef4444';
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`❤️ ${char.currentHp}/${char.maxHp}`, x + 35, cardY + 155);

    // EP Energy Bar
    const charEpPct = Math.max(0, Math.min(1, char.currentEnergy / char.maxEnergy));
    drawRoundedRect(x + 20, cardY + 174, cardW - 40, 28, 6);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fill();

    if (charEpPct > 0) {
      drawRoundedRect(x + 20, cardY + 174, (cardW - 40) * charEpPct, 28, 6);
      ctx.fillStyle = charEpPct >= 1.0 ? '#a855f7' : '#3b82f6';
      ctx.fill();
    }

    ctx.fillStyle = charEpPct >= 1.0 ? '#fde047' : '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(charEpPct >= 1.0 ? '🌟 ULT SẴN SÀNG!' : `⚡ EP: ${char.currentEnergy}/${char.maxEnergy}`, x + 35, cardY + 194);
  }
  ctx.restore();

  return canvas.toBuffer('image/png');
}

module.exports = {
  drawBattleCanvas
};
