# 🎮 Dora-Bot - Discord Turn-Based RPG (Honkai: Star Rail Style)

Game Turn-Based RPG chơi trực tiếp trên Discord với giao diện đồ họa **Canvas 800x480**, hệ thống **HSR Combat Engine (Action Value, SP, Ultimate Interrupt)**, hệ thống **Gacha Pity chuẩn** và **Database SQLite**.

---

## 🌟 Tính năng Nổi bật

1. **⚔️ Turn-Based Combat Engine (HSR Style)**:
   - Hệ thống **Tốc độ (Speed & Action Value)** quyết định lượt đánh.
   - Điểm **Chiến Kỹ (Skill Points - SP)** tích luỹ & tiêu hao chung toàn đội.
   - **Tuyệt Kỹ (Ultimate Interrupt)**: Thi triển chiêu Ultimate ngắt lượt bất kỳ lúc nào khi tích đủ 100% Năng lượng.
   - Hồi máu (Healer) & Tạo khiên (Shielder) bảo vệ đồng đội.
2. **🎨 Visual Battle Renderer (Canvas)**:
   - Gửi ảnh 800x480px realtime cập nhật thanh HP Boss, SP, thanh Năng lượng, Khiên và lượt đánh của từng nhân vật.
3. **✨ Gacha & Pity System**:
   - Bước nhảy không gian quay nhân vật 5★ (Seele, Jing Yuan, Bronya) và 4★ (Dan Heng, March 7th, Natasha).
   - Bảo hiểm Pity 90 lượt cho 5★ và 10 lượt cho 4★. Hệ thống Tinh Hồn (Eidolons E0 -> E6).
4. **🛡️ Squad Builder**:
   - Xếp đội hình 4 nhân vật từ kho nhân vật đã sở hữu.

---

## 🚀 Hướng dẫn Cấu hình & Chạy Bot

### 1. Thêm Discord Bot Token vào `.env`
Mở file `.env` trong dự án `dora-bot` và điền Bot Token của bạn từ [Discord Developer Portal](https://discord.com/developers/applications):

```env
TOKEN=token_bot_discord_cua_ban_tai_day
```

### 2. Khởi chạy Bot
Chạy lệnh sau tại thư mục `dora-bot`:

```bash
node index.js
```

---

## 📜 Danh sách Slash Commands

- `/gacha pull [amount]` - Quay nhân vật (1 lượt = 160 Nguyên thạch, 10 lượt = 1600 Nguyên thạch).
- `/profile` - Xem số dư Nguyên thạch, Pity counter và danh sách nhân vật/Tinh hồn đã sở hữu.
- `/team view` - Xem đội hình 4 nhân vật hiện tại.
- `/team set [slot1] [slot2] [slot3] [slot4]` - Xếp 4 nhân vật vào đội hình.
- `/battle [enemy]` - Bắt đầu trận chiến Turn-based với Boss / Quái vật bằng nút bấm Discord.
