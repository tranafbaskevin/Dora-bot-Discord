# 🎮 DoraBot Discord - Game RPG Honkai: Star Rail Bot

**DoraBot** là một Discord Bot Game RPG hoàn chỉnh được xây dựng dựa trên thế giới và cơ chế chiến đấu của **Honkai: Star Rail**. Bot sở hữu hệ thống Gacha 50/50 chuẩn tỉ lệ, Quản lý túi đồ & 5 ô Trang bị (Vũ khí & Di vật), Nâng cấp nhân vật / Vết kích / Cung mệnh S1-S5, và đặc biệt là **Hệ thống Trận Đấu Canvas UX/UI Dọc** sống động!

---

## 🌟 Tính Năng Nổi Bật

- 🎰 **Hệ Thống Gacha 50/50 Chuẩn Rate**: Tích lũy Pity 90 lượt, Bảo hiểm 50/50, Thăng cấp Cung mệnh (E0 -> E6) cho Nhân vật và Tích Chồng (S1 -> S5) cho Vũ khí!
- 🛡️ **Quản Lý Trang Bị `/equipment`**: Giao diện chọn Nhân vật tương tác 1 Ô Vũ Khí & 4 Ô Thánh Di Vật 5★ từ kho đồ.
- 🗡️ **Nâng Cấp Nhân Vật & Kỹ Năng `/upgrade`**: Tăng cấp Cấp độ Nhân vật (Lv.1 -> 80), Level Vũ khí (Lv.1 -> 80), Cường hóa Di vật (+15), và Nâng Cấp Kỹ Năng (*Đánh Thường Lv.1->6, Chiến Kỹ & Ultimate Lv.1->10*).
- ⚔️ **Trận Đấu Canvas UX/UI Dọc `/battle`**:
  - **Left AV Bar**: Thanh Tốc độ xếp hàng lượt đánh chuyên nghiệp.
  - **Top Boss HUD**: Máu Boss thực tế, % HP, Thanh Kháng Thể (Toughness) & Bộ icon Thuộc tính Điểm yếu.
  - **Bottom 4 Team Status Cards**: Avatar tròn, Máu HP, Năng lượng EP, Viền Vàng phát sáng **`⚡ ĐANG HÀNH ĐỘNG`** và hiệu ứng **`🌟 ULT SẴN SÀNG!`**.
- 🏆 **Chế Độ Tháp Sảnh Đường Hư Vô `/lahoan`**: Khiêu chiến 10 Tầng Sảnh Đường Hư Vô nhận hàng nghìn Stellar Jades và phần thưởng giá trị.
- 👑 **Lệnh Admin Cheat `/admin giveall`**: Dành riêng cho Quản Trị Viên Server test game không giới hạn.

---

## 📜 Danh Sách 10 Lệnh Slash Commands (`/`)

| Lệnh Slash | Mô Tả Chức Năng |
| :--- | :--- |
| **`/gacha`** | Quay Banner Nón Ánh Sáng & Nhân Vật (Nút Roll 1, Roll Max 10, Đổi Banner) |
| **`/equipment`** | Quản lý & Thay đổi 1 Ô Vũ Khí + 4 Ô Thánh Di Vật cho từng Nhân vật |
| **`/battle`** | Khiêu chiến 9 Boss (Herta, Belobog, Xianzhou) theo Cấp Độ / Equal Level |
| **`/inventory`** | Xem Kho Nhân Vật, Kho Nón Ánh Sáng (S1-S5), và Phân tách rác 3★ |
| **`/upgrade`** | Nâng cấp Level Nhân Vật, Level Vũ Khí, Kỹ Năng (Đánh Thường/Skill/Ult), Cường hóa Di vật |
| **`/team`** | Xếp đội hình 4 Nhân vật ra trận và xem Chỉ số tổng |
| **`/profile`** | Xem Thẻ Thông Tin Người Chơi, Cấp Thám Hiểm & Vật liệu |
| **`/lahoan`** | Khiêu chiến Tháp Sảnh Đường Hư Vô 10 Tầng |
| **`/info`** | Xem Thư viện Chỉ số Chi tiết của tất cả Nhân vật & Boss |
| **`/admin`** | Lệnh Admin trao Nguyên thạch & Vật liệu không giới hạn (Admin Server) |

---

## 🛠️ Công Nghệ Sử Dụng

- **Core**: Node.js `v18+`
- **Discord API**: `discord.js` `v14`
- **Graphics & UI Rendering**: `@napi-rs/canvas`
- **Database**: File JSON Database (`database.json`) tự động tạo & đồng bộ nguyên tử

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Bot

### 1. Yêu cầu hệ thống
- Node.js `v18.0.0` trở lên

### 2. Cài đặt các thư viện phụ thuộc
```bash
npm install
```

### 3. Cấu hình file `.env`
Tạo file `.env` tại thư mục gốc dự án và điền Token Bot của bạn:
```env
DISCORD_TOKEN=Token_Bot_Discord_Cua_Ban
CLIENT_ID=ID_Ung_Dung_Bot_Cua_Ban
```

### 4. Khởi động Bot
```bash
node index.js
```

---

## 📤 Hướng Dẫn Push Code Lên GitHub

Do GitHub đã ngừng hỗ trợ mật khẩu HTTPS thông thường, bạn cần sử dụng **Personal Access Token (PAT)** khi Push code:

### Cách 1: Push trực tiếp bằng Personal Access Token (PAT)
```bash
git push https://<YOUR_GITHUB_PAT_TOKEN>@github.com/tranafbaskevin/Dora-bot-Discord.git main
```

### Cách 2: Đổi URL Remote sang SSH (Khuyên dùng)
```bash
git remote set-url origin git@github.com:tranafbaskevin/Dora-bot-Discord.git
git push origin main
```
