# 🎮 DoraBot Discord - Game RPG Honkai: Star Rail Bot (Phiên Bản Nâng Cấp V5.0)

**DoraBot** là một Discord Bot Game RPG hoàn chỉnh được xây dựng dựa trên thế giới và cơ chế chiến đấu của **Honkai: Star Rail**. Bot sở hữu hệ thống Gacha 50/50 chuẩn tỉ lệ, Bể 28 Nhân Vật phong phú, Hệ thống Mã Keycode UID Độc Nhất Toàn Server cho Vũ khí & Di vật, Phân trang Nút bấm OwO Style (`◀` `[Trang X/Y]` `▶`), Vay mượn Jades & Tự động trích nợ khi farm, Thách đấu PVP Turn-based, Săn quái thường `/hunt` và Rã đồ siêu tốc `/delete` chuẩn Mobile UX!

---

## 🎬 HIỆU ỨNG TUYỆT KỸ ULTIMATE ANIMATION MÃN NHÃN

> Trải nghiệm những màn ngắt lượt thi triển Tuyệt Kỹ (Ultimate) với hình ảnh động GIF hoành tráng, mượt mà và trực quan ngay trong kênh chat Discord!

| 💜 **Acheron** - *Slashed Dream Cries in Red* | 🍇 **Kafka** - *Twilight Trill* |
| :---: | :---: |
| ![Acheron Ultimate](assets/gifs/acheron.gif) | ![Kafka Ultimate](assets/gifs/kafka.gif) |

| ⚔️ **Blade** - *Death Sentence* | 👾 **Silver Wolf** - *User Banned* |
| :---: | :---: |
| ![Blade Ultimate](assets/gifs/blade.gif) | ![Silver Wolf Ultimate](assets/gifs/silver_wolf.gif) |

---

## 🔑 1. HỆ THỐNG MÃ KEYCODE UID ĐỘC NHẤT TOÀN SERVER (OWO STYLE)

- 🔑 **Mã Trang Bị Độc Nhất**: Tất cả Vũ khí (Nón Ánh Sáng) và Thánh Di Vật thu thập được từ `/gacha`, `/battle`, `/hunt` đều có mã Keycode UID duy nhất trên toàn hệ thống (`🆔 #A-1082`, `🆔 #W-5021`).
- 🛡️ **Giới Hạn Trang Bị Độc Quyền 1 Mảnh / 1 Nhân Vật**: Một mảnh Di vật chỉ có thể trang bị cho 1 nhân vật duy nhất. Khi chuyển cho nhân vật B, trang bị sẽ tự động tháo khỏi nhân vật A.
- 📱 **Mobile-Friendly Quick Input**: Người chơi trên điện thoại hay PC đều có thể gõ trực tiếp `/delete #A-1082` hoặc rã nhiều mã `/delete #A-1082 #A-1083 #W-5021` 1 cách siêu tốc.

---

## 🧠 2. SMART FLEXIBLE ORDER PARSER (TỰ ĐỘNG NHẬN DIỆN THỨ TỰ THAM SỐ)

Bot tích hợp bộ phân tích tham số thông minh, người chơi không bao giờ phải nhớ thứ tự nào trước hay sau:
- `/give @User #A-1082` ➡️ **HOẠT ĐỘNG HOÀN HẢO!**
- `/give #A-1082 @User` ➡️ **HOẠT ĐỘNG HOÀN HẢO!**
- `/borrow @User 5000` ➡️ **HOẠT ĐỘNG HOÀN HẢO!**
- `/borrow 5000 @User` ➡️ **HOẠT ĐỘNG HOÀN HẢO!**

---

## 🏦 3. HỆ THỐNG VAY MƯỢN JADES & TỰ ĐỘNG TRẢ NỢ QUA FARM (`/borrow`)

- 🤝 **Thỏa Thuận 2 Chiều**: Người vay phát lệnh `/borrow`, người cho vay nhận thông báo bấm nút **`✅ Đồng Ý`** hoặc **`❌ Từ Chối`**.
- 🔄 **Cơ Chế Trả Nợ Tự Động**: Khi đang có khoản nợ, **toàn bộ Ngọc Ánh Sao (Jades)** mà người vay farm được ở `/battle`, `/hunt`, `/lahoan`... sẽ tự động trích trả cho chủ nợ cho đến khi hoàn trả 100% nợ.
- 🔒 **Khóa Vay Tiếp**: Người đang nợ không thể tiếp tục vay mượn từ bất kỳ ai cho đến khi hết nợ.

---

## 📜 4. DANH SÁCH 15 LỆNH SLASH COMMANDS (`/`)

| Lệnh Slash | Mô Tả Chức Năng Chi Tiết |
| :--- | :--- |
| **`/equipment`** | Quản lý trang bị: Chọn Nhân vật ➡️ Chọn Slot (`Head`/`Hands`/`Body`/`Feet`) ➡️ Chọn theo Mã Keycode độc nhất |
| **`/inventory`** | Xem Kho Nhân Vật, Kho Vũ Khí (S1-S5) và Kho Di Vật với phân trang OwO Style (`◀` `▶`) kèm Mã Keycode |
| **`/delete`** | Phân rã trang bị rác siêu tốc theo mã Keycode (`/delete #A-1082 #W-5021`) nhận Bụi Di Vật & Tinh Thể |
| **`/give`** | Tặng Vũ Khí hoặc Thánh Di Vật theo mã Keycode cho người chơi khác (Cấm tặng nhân vật/nguyên liệu) |
| **`/borrow`** | Vay mượn Ngọc Ánh Sao (Jades) bạn bè kèm cơ chế Tự động trích Jades cày được để trả nợ |
| **`/hunt`** | Săn quái thường cày EXP, Jades, Sách, Tinh thể, Bụi và nhặt phôi Thánh Di Vật mới |
| **`/pvp`** | Thách đấu PVP đội hình theo lượt між 2 người chơi trong Server |
| **`/gacha`** | Quay Banner Acheron, Kafka, Blade, Silver Wolf, Fu Xuan, Seele, Jing Yuan & Banner Vũ Khí 36+ |
| **`/battle`** | Khiêu chiến 9 Boss (Herta, Belobog, Xianzhou) nhận 2 Di vật 4★/5★ & Thưởng chuyên biệt |
| **`/upgrade`** | Nâng cấp Level Nhân Vật, Vũ Khí, Kỹ Năng (Đánh Thường/Skill/Ult), Cường hóa Di vật (+15) |
| **`/team`** | Xếp đội hình 4 Nhân vật ra trận và xem Chỉ số thực tế |
| **`/profile`** | Xem Thẻ Thông Tin Người Chơi, Cấp Thám Hiểm & Vật liệu tích lũy |
| **`/lahoan`** | Khiêu chiến Tháp Sảnh Đường Hư Vô 10 Tầng nhận hàng ngàn Jades |
| **`/info`** | Thư viện tra cứu Nhân vật, Vũ khí & Di vật phân trang OwO Style (`◀` `▶`) |
| **`/admin`** | Lệnh Admin cấp tài nguyên test game cho bản thân hoặc người chơi khác (`/admin giveall @target`) |

---

## 🌐 5. HẠ TẦNG VẬN HÀNH 24/7 & LƯU TRỮ ĐÁM MÂY

- ☁️ **Chạy 24/7/365 Độc Lập**: Triển khai trên **Render Web Service** kết hợp với **UptimeRobot Keep-Alive** (ping 5 phút/lần).
- 🗄️ **MongoDB Atlas Cloud Database**: Lưu trữ vĩnh viễn dữ liệu người chơi, Jades, Cấp thám hiểm, Đội hình, Vũ khí và Di vật.
- 🔒 **Auto-Migration Dữ Liệu**: Tự động nâng cấp dữ liệu cũ, cấp mã Keycode UID và giữ an toàn vĩnh viễn 100% tài sản người chơi.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Bot

```bash
# 1. Cài đặt các thư viện
npm install

# 2. Khởi chạy Bot Discord
node index.js
```
