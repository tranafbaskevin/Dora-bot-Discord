# 🎮 DoraBot Discord - Game RPG Honkai: Star Rail Bot

**DoraBot** là một Discord Bot Game RPG hoàn chỉnh được xây dựng dựa trên thế giới và cơ chế chiến đấu của **Honkai: Star Rail**. Bot sở hữu hệ thống Gacha 50/50 chuẩn tỉ lệ, Quản lý túi đồ & Trang bị (Vũ khí & Di vật 4★/5★), Nâng cấp nhân vật / Vết kích / Cung mệnh S1-S5, Lưu trữ Đám mây vĩnh viễn, và đặc biệt là **Hệ thống Trận Đấu Canvas UX/UI Widescreen 1920x1080** sống động!

---

## 🌐 1. HẠ TẦNG VẬN HÀNH 24/7 & LƯU TRỮ ĐÁM MÂY (ĐÃ HOÀN THÀNH)

- ☁️ **Chạy 24/7/365 Độc Lập**: Triển khai trên **Render Web Service** kết hợp với **UptimeRobot Keep-Alive** (ping 5 phút/lần). Bạn có thể tắt laptop, gập máy hay đi ngủ mà bot vẫn luôn online phản hồi mượt mà!
- 🗄️ **MongoDB Atlas Cloud Persistent Database**: Đã tích hợp hệ thống cơ sở dữ liệu đám mây **MongoDB Atlas**. Toàn bộ tài khoản người chơi, Jades, Cấp thám hiểm, Đội hình, Vũ khí và Di vật được **lưu trữ vĩnh viễn trên Cloud**, không bao giờ bị xóa hay reset khi re-deploy code nữa!
- 👥 **Cô Lập Bộ Nghe Tương Tác (Multi-User Concurrency)**: Bộ nghe sự kiện nút bấm được cô lập 100% theo từng tin nhắn (`i.message.id === response.id`). Hàng chục người chơi có thể gacha, thay đồ và đánh boss song song trong cùng 1 kênh Discord mà không bao giờ bị xung đột hay chặn nhầm.
- 🎬 **Hiệu Ứng Ultimate GIF Động Ngắt Lượt**: Tự động hiển thị và cập nhật ảnh GIF Tuyệt kỹ hoành tráng cho từng nhân vật (Seele, Bronya, Jing Yuan...) trực tiếp trên 1 khung duy nhất để chống rác tin nhắn.

---

## ⚔️ 2. HỆ THỐNG NGUYÊN TỐ, KHẮC CHẾ ĐIỂM YẾU & DÒNG BUFF THUỘC TÍNH

Trận đấu mô phỏng chính xác hệ thống 7 thuộc tính nguyên tố và cơ chế **Phá Vỡ Điểm Yếu (Weakness Break)** của Honkai: Star Rail:

### 🌈 7 Thuộc Tính Nguyên Tố & Hiệu Ứng Phá Vỡ Điểm Yếu:
1. ⚔️ **Vật Lý (Physical)**: Khi Phá Vỡ Điểm Yếu, gây Sát thương Vật lý và gắn hiệu ứng **Chảy Máu (Bleed)** gây sát thương DoT theo % HP tối đa của địch.
2. 🔥 **Hỏa (Fire)**: Khi Phá Vỡ Điểm Yếu, gây Sát thương Hỏa và gắn hiệu ứng **Thiêu Đốt (Burn)** thiêu rụi sinh lực kẻ địch ở đầu mỗi lượt.
3. ❄️ **Băng (Ice)**: Khi Phá Vỡ Điểm Yếu, gây Sát thương Băng và gắn hiệu ứng **Đóng Băng (Freeze)** khiến kẻ địch bỏ lỡ 1 lượt hành động.
4. ⚡ **Lôi (Lightning)**: Khi Phá Vỡ Điểm Yếu, gây Sát thương Lôi và gắn hiệu ứng **Sốc Điện (Shock)** gây sát thương Lôi liên tục.
5. 🌪️ **Phong (Wind)**: Khi Phá Vỡ Điểm Yếu, gây Sát thương Phong và gắn hiệu ứng **Bào Mòn (Wind Shear)** cộng dồn tối đa 5 tầng sát thương DoT.
6. 🌌 **Lượng Tử (Quantum)**: Khi Phá Vỡ Điểm Yếu, gây Sát thương Lượng Tử và gắn hiệu ứng **Trói Buộc (Entanglement)** hoãn lượt hành động và nổ sát thương lớn khi kết thúc lượt.
7. 🌟 **Số Ảo (Imaginary)**: Khi Phá Vỡ Điểm Yếu, gây Sát thương Số Ảo và gắn hiệu ứng **Giam Cầm (Imprisonment)** giảm Tốc độ và đẩy lùi lượt đi của địch.

### 🎲 Dòng Buff Tăng Sát Thương Thuộc Tính (Elemental DMG% Boost):
Mỗi nhân vật và trang bị có thể sở hữu các dòng Buff gia tăng % Sát thương thuộc tính chuyên biệt:
- `Physical DMG%` | `Fire DMG%` | `Ice DMG%` | `Lightning DMG%` | `Wind DMG%` | `Quantum DMG%` | `Imaginary DMG%`.

---

## 👤 3. THÔNG TIN CÁC NHÂN VẬT ĐÃ RA MẮT TRONG BOT

### 🌟 Nhân Vật 5★:
1. 💜 **Seele** *(Quantum - Hunt)*: Sát thủ Lượng Tử đơn mục tiêu tốc độ cao. Tuyệt kỹ **"Butterfly Flurry"** đi kèm hiệu ứng GIF đòn chém bóng đêm hoành tráng.
2. ⚡ **Jing Yuan** *(Lightning - Erudition)*: Tướng Quân Lôi diện rộng. Tuyệt kỹ **"Lightbringer"** triệu hồi Thần Quân giáng sấm sét càn quét toàn sân.
3. 🌀 **Bronya** *(Wind - Harmony)*: Thủ Lĩnh Đội Băng Tuyết. Kỹ năng kéo lượt 100% cho đồng đội và Tuyệt kỹ **"The Belobog March"** tăng mạnh ATK & CRIT DMG toàn đội.

### ⭐ Nhân Vật 4★:
4. 🌪️ **Dan Heng** *(Wind - Hunt)*: Tiên phong Săn Bắn thuộc tính Phong, gây thêm sát thương khi kẻ địch bị làm chậm.
5. ❄️ **March 7th** *(Ice - Preservation)*: Thiếu nữ Băng Tuyết tạo Khiên phòng thủ kiên cố và Tuyệt kỹ gây Đóng Băng diện rộng.
6. 🩺 **Natasha** *(Physical - Abundance)*: Bác sĩ Trù Phú hồi máu đơn thể và trị liệu sinh lực cho toàn bộ đồng đội.

---

## 👹 4. DANH SÁCH BOSS & PHẦN THƯỞNG CHIẾN THẮNG CHUYÊN BIỆT

Mỗi khi hạ gục Boss ở lệnh `/battle`, người chơi sẽ nhận được **chuẩn 2 món Di Vật (4★ / 5★ theo Cấp Thám Hiểm)** cùng các phần thưởng tài nguyên chuyên biệt:

| Tên Boss | Bản Đồ | Thiên Hướng Phần Thưởng | Jades | Sách EXP | Tinh Thể Vũ Khí | Bụi Di Vật | Bộ Di Vật Rớt Chính |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Doomsday Beast** *(Quái Thú Diệt Vong)* | 🛰️ Herta | 💎 Siêu Nhiều Jades | **1,200** | 4 | 4 | 8 | `Bộ Thiên Tài` & `Bộ Thiện Xạ` |
| **Voidranger: Trampler** *(Kẻ Lang Thang)* | 🛰️ Herta | 📘 Chuyên Farm Sách EXP | 600 | **16** | 4 | 8 | `Bộ Chim Ưng` & `Bộ Thiện Xạ` |
| **Anti-Matter Legionnaire** *(Lĩnh Chủ)* | 🛰️ Herta | ⚔️ Chuyên Farm Tinh Thể Vũ Khí | 600 | 4 | **16** | 8 | `Bộ Thiện Xạ Trường Hoang` |
| **Automaton Grizzly** *(Gấu Máy Tự Động)* | ❄️ Belobog | 🔮 Chuyên Farm Bụi Di Vật | 600 | 4 | 4 | **28** | `Bộ Hiệp Sĩ` & `Bộ Thợ Săn` |
| **Cocolia** *(Mẫu Thần Dối Tráp)* | ❄️ Belobog | 🌟 Trùm Belobog (Đa Năng) | **1,500** | **10** | **10** | **20** | `Bộ Lãng Khách` & `Bộ Hiệp Sĩ` |
| **Svarog** *(Thủ Vệ Robot)* | ❄️ Belobog | ⚔️ Tinh Thể Vũ Khí & Jades | 800 | 5 | **14** | 10 | `Bộ Hiệp Sĩ` & `Bộ Thiện Xạ` |
| **Phantylia** *(Tai Họa Huyễn Lung)* | ⛩️ Xianzhou | 💎 Trùm Cuối (Max Jades & Bụi) | **1,800** | 8 | 8 | **36** | `Bộ Thiên Tài` & `Bộ Chim Ưng` |
| **Abundance Deer** *(Hươu Trù Phú)* | ⛩️ Xianzhou | 📘 Siêu Cấp Sách EXP | 700 | **22** | 4 | 10 | `Bộ Lãng Khách Âm Thầm` |
| **Aurumaton Gatekeeper** *(Kim Nhân)* | ⛩️ Xianzhou | 🔮 Bụi Di Vật & Tinh Thể | 800 | 5 | 12 | **25** | `Bộ Chim Ưng` & `Bộ Thợ Săn` |

---

## ⚔️ 5. BỂ VŨ KHÍ NÓN ÁNH SÁNG VĨNH CỬU (36+ VŨ KHÍ) & DÒNG NỘI TẠI

Banner Vũ Khí Vĩnh Cửu (`/gacha` -> Banner Vũ Khí) bao gồm 36+ Nón Ánh Sáng độc đáo cho 7 Vận Mệnh. Mọi Vũ Khí nhận được đều có **Dòng Nội Tại Đặc Biệt** cố định kèm **4 Dòng Buff Chỉ Số % Ngẫu Nhiên 100%**!

### 🌟 Nón Ánh Sáng 5★ (Thập Đại Thần Binh):
1. **In the Night (Trong Đêm Tối)** [Săn Bắn]: Tăng +18% CRIT Rate. Mỗi 10 SPD > 100 tăng +6% Sát thương Đánh Thường/Chiến Kỹ & +12% CRIT DMG Tuyệt Kỹ.
2. **Before Dawn (Trước Bình Minh)** [Tri Thức]: Tăng +36% CRIT DMG & +18% Sát thương Chiến Kỹ/Tuyệt Kỹ. Trạng thái 'Mộng Thân' tăng +48% Đòn Tăng Cường.
3. **But the Battle Isn't Over (Cuộc Chiến Chưa Nguôi)** [Hòa Hợp]: Tăng +10% Hồi EP. Hồi +1 SP khi dùng Ult lên đồng đội. Tăng +30% ATK cho đồng đội tiếp theo.
4. **Moment of Victory (Thời Khắc Chiến Thắng)** [Bảo Hộ]: Tăng +24% DEF và +24% Kháng Khống Chế. Thu hút kẻ địch tấn công & tăng thêm +24% DEF khi bị đánh.
5. **Time Waits for No One (Thời Gian Không Chờ Ai)** [Trù Phú]: Tăng +18% HP tối đa & +12% Lượng Hồi Máu. Gây thêm Sát thương thuộc tính theo lượng trị liệu.
6. **Sleep Like the Dead (Giấc Ngủ Tựa Chết)** [Săn Bắn]: Tăng +30% CRIT DMG. Khi đòn đánh không bạo kích, tăng +36% CRIT Rate trong 1 lượt.
7. **Night on the Milky Way (Đêm Trên Dải Ngân Hà)** [Tri Thức]: Tăng +9% ATK với mỗi kẻ địch trên sân. Tăng +30% Sát thương khi có kẻ địch bị Phá Vỡ Điểm Yếu.
8. **Something Irreplaceable (Vật Phẩm Không Thể Thay Thế)** [Hủy Diệt]: Tăng +24% ATK. Khi tiêu diệt kẻ địch hoặc bị đánh, hồi 8% HP & tăng +24% Sát thương.
9. **On the Fall of an Aeon (Sự Sụp Đổ Của Aeon)** [Hủy Diệt]: Mỗi đòn đánh tăng +8% ATK (tối đa 4 cộng dồn). Phá Vỡ Điểm Yếu tăng +12% Sát thương trong 2 lượt.
10. **Patience Is All You Need (Chỉ Cần Kiên Nhẫn)** [Hư Vô]: Tăng +24% Sát thương gây ra. Tăng +4.8% SPD mỗi đòn đánh & thiêu đốt/sốc điện kẻ địch.

---

## 📜 Danh Sách 10 Lệnh Slash Commands (`/`)

| Lệnh Slash | Mô Tả Chức Năng |
| :--- | :--- |
| **`/gacha`** | Quay Banner Nón Ánh Sáng Vĩnh Cửu 36+ & Banner Nhân Vật (Roll 1, Roll Max 10, Đổi Banner) |
| **`/equipment`** | Quản lý & Thay đổi 1 Ô Vũ Khí + 4 Ô Thánh Di Vật cho từng Nhân vật |
| **`/battle`** | Khiêu chiến 9 Boss (Herta, Belobog, Xianzhou) nhận 2 Di vật 4★/5★ & Thưởng chuyên biệt |
| **`/inventory`** | Xem Kho Nhân Vật, Kho Nón Ánh Sáng (S1-S5), và Phân tách rác 3★ |
| **`/upgrade`** | Nâng cấp Level Nhân Vật, Level Vũ Khí, Kỹ Năng (Đánh Thường/Skill/Ult), Cường hóa Di vật |
| **`/team`** | Xếp đội hình 4 Nhân vật ra trận và xem Chỉ số tổng |
| **`/profile`** | Xem Thẻ Thông Tin Người Chơi, Cấp Thám Hiểm & Vật liệu |
| **`/lahoan`** | Khiêu chiến Tháp Sảnh Đường Hư Vô 10 Tầng |
| **`/info`** | Xem Thư viện Chỉ số Chi tiết của tất cả Nhân vật, Boss & 36+ Vũ Khí |
| **`/admin`** | Lệnh Admin trao Nguyên thạch & Vật liệu cho bản thân hoặc người chơi khác (`/admin giveall [target]`) |

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Bot

```bash
# 1. Cài đặt các thư viện
npm install

# 2. Chạy bot khởi động
node index.js
```
