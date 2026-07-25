const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/db');
const charactersData = require('../data/characters.json');

const gachaCommand = new SlashCommandBuilder()
  .setName('gacha')
  .setDescription('Bước nhảy không gian / Cầu nguyện gacha nhân vật & vũ khí')
  .addIntegerOption(opt =>
    opt.setName('amount')
      .setDescription('Số lượt quay (1 - 10 lượt)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(10)
  )
  .addStringOption(opt =>
    opt.setName('banner')
      .setDescription('Chọn Banner Gacha')
      .setRequired(false)
      .addChoices(
        { name: '🌟 Banner Nhân Vật - Bước Nhảy Cánh Bướm (Seele 5★)', value: 'character' },
        { name: '⚔️ Banner Vũ Khí - Nón Ánh Sáng 5★ (Brilliant Fixation)', value: 'weapon' }
      )
  );

function handleGachaPull(discordId, requestedAmount, bannerType) {
  const user = db.getUser(discordId);
  const singleCost = 160;

  // Calculate max affordable rolls if requested exceeds balance
  const maxAffordable = Math.floor(user.jades / singleCost);

  if (maxAffordable <= 0) {
    return { success: false, message: `❌ Bạn không đủ Nguyên Thạch/Stellar Jade! (Cần ít nhất 160, bạn có ${user.jades.toLocaleString()}).` };
  }

  // Auto-adjust to max affordable if requested > maxAffordable
  const actualAmount = Math.min(requestedAmount, maxAffordable);
  const totalCost = actualAmount * singleCost;

  let currentPity5 = user.pity_5star;
  let currentPity4 = user.pity_4star;
  const results = [];
  let trashCount = 0;

  const chars5Star = charactersData.filter(c => c.rarity === 5);
  const chars4Star = charactersData.filter(c => c.rarity === 4);

  const weapons5Star = [
    { name: 'Nón Ánh Sáng 5★: In the Night (Seele)', rarity: 5, type: 'weapon' },
    { name: 'Nón Ánh Sáng 5★: Before Dawn (Jing Yuan)', rarity: 5, type: 'weapon' },
    { name: 'Nón Ánh Sáng 5★: Something Irreplaceable', rarity: 5, type: 'weapon' }
  ];

  const weapons4Star = [
    { name: 'Nón Ánh Sáng 4★: Only Silence Remains', rarity: 4, type: 'weapon' },
    { name: 'Nón Ánh Sáng 4★: Shared Feeling', rarity: 4, type: 'weapon' },
    { name: 'Nón Ánh Sáng 4★: Swordplay', rarity: 4, type: 'weapon' }
  ];

  for (let i = 0; i < actualAmount; i++) {
    currentPity5++;
    currentPity4++;

    let pulledRarity = 3;
    let item = null;

    // Hard Pity 5-Star (90) or 0.6% chance
    if (currentPity5 >= 90 || Math.random() < 0.006 + Math.max(0, currentPity5 - 74) * 0.06) {
      pulledRarity = 5;
      if (bannerType === 'weapon') {
        item = weapons5Star[Math.floor(Math.random() * weapons5Star.length)];
      } else {
        item = { type: 'char', ...chars5Star[Math.floor(Math.random() * chars5Star.length)] };
      }
      currentPity5 = 0;
    }
    // Hard Pity 4-Star (10) or 5.1% chance
    else if (currentPity4 >= 10 || Math.random() < 0.051) {
      pulledRarity = 4;
      if (bannerType === 'weapon') {
        item = weapons4Star[Math.floor(Math.random() * weapons4Star.length)];
      } else {
        item = { type: 'char', ...chars4Star[Math.floor(Math.random() * chars4Star.length)] };
      }
      currentPity4 = 0;
    } else {
      pulledRarity = 3;
      trashCount++;
    }

    if (item) {
      if (item.type === 'char') {
        const invResult = db.addCharacter(discordId, item.id);
        results.push({
          item,
          rarity: pulledRarity,
          isNew: invResult.isNew,
          eidolon: invResult.eidolon
        });
      } else {
        results.push({
          item,
          rarity: pulledRarity,
          name: item.name
        });
      }
    } else {
      results.push({
        name: '⚪ Nón Ánh Sáng 3★ Rác',
        rarity: 3
      });
    }
  }

  // Deduct Currency & Update Pity & Add Trash items
  db.updateUserJades(discordId, user.jades - totalCost);
  db.updatePity(discordId, currentPity5, currentPity4);
  if (trashCount > 0) {
    db.addTrashItems(discordId, trashCount);
  }

  return {
    success: true,
    actualAmount,
    requestedAmount,
    adjusted: actualAmount < requestedAmount,
    results,
    remainingJades: user.jades - totalCost,
    pity5: currentPity5,
    pity4: currentPity4,
    trashCount
  };
}

async function executeGacha(interaction) {
  const requestedAmount = interaction.options.getInteger('amount');
  const bannerType = interaction.options.getString('banner') || 'character';

  const res = handleGachaPull(interaction.user.id, requestedAmount, bannerType);

  if (!res.success) {
    return interaction.reply({ content: res.message, ephemeral: true });
  }

  const bannerTitle = bannerType === 'weapon'
    ? '⚔️ BƯỚC NHẢY NÓN ÁNH SÁNG (Brilliant Fixation)'
    : '🌟 BƯỚC NHẢY CÁNH BƯỚM (Seele 5★ Event Banner)';

  const autoNotice = res.adjusted
    ? `\n⚠️ *Bạn yêu cầu ${res.requestedAmount} lượt nhưng chỉ đủ Nguyên thạch quay **${res.actualAmount} lượt** (đã tự động quay tối đa).*`
    : '';

  const embed = new EmbedBuilder()
    .setTitle(`✨ KẾT QUẢ GACHA (${res.actualAmount} LƯỢT)`)
    .setColor('#ffd700')
    .setDescription(`**${bannerTitle}**${autoNotice}\n\n💎 **Nguyên thạch còn lại**: **${res.remainingJades.toLocaleString()}** | 🎯 **Pity 5★**: **${res.pity5}/90**`)
    .setFooter({ text: `Người quay: ${interaction.user.username} | Dùng /inventory recycle để phân tách món 3★!` });

  let resultLines = [];
  res.results.forEach((r, idx) => {
    if (r.rarity === 5) {
      if (r.item && r.item.type === 'char') {
        const status = r.isNew ? '🆕 [MỚI!]' : `✨ [Tinh Hồn E${r.eidolon}]`;
        resultLines.push(`\`${idx + 1}.\` 🌟🌟🌟🌟🌟 **${r.item.name}** (${r.item.element}) - ${status}`);
      } else {
        resultLines.push(`\`${idx + 1}.\` 🌟🌟🌟🌟🌟 **${r.name}** ⚔️`);
      }
    } else if (r.rarity === 4) {
      if (r.item && r.item.type === 'char') {
        const status = r.isNew ? '🆕 [MỚI!]' : `🟣 [Tinh Hồn E${r.eidolon}]`;
        resultLines.push(`\`${idx + 1}.\` ⭐⭐⭐⭐ **${r.item.name}** (${r.item.element}) - ${status}`);
      } else {
        resultLines.push(`\`${idx + 1}.\` ⭐⭐⭐⭐ **${r.name}** ⚔️`);
      }
    } else {
      resultLines.push(`\`${idx + 1}.\` ⚪ 3★ Nón Ánh Sáng Rác (Đã lưu vào Túi đồ)`);
    }
  });

  embed.addFields({ name: '🎁 Vật phẩm thu được:', value: resultLines.join('\n') });

  await interaction.reply({ embeds: [embed] });
}

module.exports = {
  data: gachaCommand,
  execute: executeGacha
};
