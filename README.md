# 🎮 DoraBot Discord - Game RPG Honkai: Star Rail Bot

**DoraBot** là một Discord Bot Game RPG hoàn chỉnh được xây dựng dựa trên thế giới và cơ chế chiến đấu của **Honkai: Star Rail**. Bot sở hữu hệ thống Gacha 50/50 chuẩn tỉ lệ, Bể 28 Nhân Vật phong phú, Quản lý túi đồ & Trang bị (Vũ khí & Di vật 4★/5★), Nâng cấp nhân vật / Vết kích / Cung mệnh E1-E6 / S1-S5, Lưu trữ Đám mây vĩnh viễn, và đặc biệt là **Hệ thống Trận Đấu Canvas UX/UI Widescreen 1920x1080** sống động!

---

## 🎬 HIỆU ỨNG TUYỆT KỸ ULTIMATE ANIMATION MÃN NHÃN

> Trải nghiệm những màn ngắt lượt thi triển Tuyệt Kỹ (Ultimate) với hình ảnh động GIF hoành tráng, mượt mà và trực quan ngay trong kênh chat Discord!

| 💜 **Acheron** - *Slashed Dream Cries in Red* | 🍇 **Kafka** - *Twilight Trill* |
| :---: | :---: |
| ![Acheron Ultimate](assets/gifs/acheron.gif) | ![Kafka Ultimate](assets/gifs/kafka.gif) |

| 🌟 **Seele** - *Butterfly Flurry* | ⚡ **Jing Yuan** - *Lightbringer* |
| :---: | :---: |
| ![Seele Ultimate](assets/gifs/seele.gif) | ![Jing Yuan Ultimate](assets/gifs/jing_yuan.gif) |

---

## 🌐 1. HẠ TẦNG VẬN HÀNH 24/7 & LƯU TRỮ ĐÁM MÂY (ĐÃ HOÀN THÀNH)

- ☁️ **Chạy 24/7/365 Độc Lập**: Triển khai trên **Render Web Service** kết hợp với **UptimeRobot Keep-Alive** (ping 5 phút/lần). Bạn có thể tắt laptop, gập máy hay đi ngủ mà bot vẫn luôn online phản hồi mượt mà!
- 🗄️ **MongoDB Atlas Cloud Persistent Database**: Đã tích hợp hệ thống cơ sở dữ liệu đám mây **MongoDB Atlas**. Toàn bộ tài khoản người chơi, Jades, Cấp thám hiểm, Đội hình, Vũ khí và Di vật được **lưu trữ vĩnh viễn trên Cloud**, không bao giờ bị xóa hay reset khi re-deploy code nữa!
- 👥 **Cô Lập Bộ Nghe Tương Tác (Multi-User Concurrency)**: Bộ nghe sự kiện nút bấm được cô lập 100% theo từng tin nhắn (`i.message.id === response.id`). Hàng chục người chơi có thể gacha, thay đồ và đánh boss song song trong cùng 1 kênh Discord mà không bao giờ bị xung đột hay chặn nhầm.
- 🎬 **Hiệu Ứng Ultimate GIF Động Ngắt Lượt Chống Spam**: Tự động hiển thị và cập nhật ảnh GIF Tuyệt kỹ hoành tráng cho từng nhân vật (Acheron, Kafka, Seele, Jing Yuan, Blade, Silver Wolf, Fu Xuan, Bronya...) trực tiếp trên 1 khung duy nhất để chống rác tin nhắn kênh chat.

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

## 👤 3. BỂ 28 NHÂN VẬT HOÀN CHỈNH TRONG BOT

### 🌟 8 Nhân Vật 5★ (Có GIF Ultimate Động & Banner Riêng biệt):
1. 💜 **Acheron** *(Lightning - Nihility)*: Sát thủ Hư Vô gây Sát thương Lôi diện rộng cực đại. GIF Ult *"Slashed Dream Cries in Red"*.
2. 🍇 **Kafka** *(Lightning - Nihility)*: Chuyên gia DoT Lôi. GIF Ult *"Twilight Trill"* gây Sốc Điện & kích nổ toàn bộ DoT lập tức.
3. ⚔️ **Blade** *(Wind - Destruction)*: Tiêu hao HP để tung các đòn chém Phong càn quét. GIF Ult *"Death Sentence"*.
4. 👾 **Silver Wolf** *(Quantum - Nihility)*: Gắn Điểm Yếu thuộc tính & giảm 45% DEF kẻ địch. GIF Ult *"User Banned"*.
5. 🌸 **Fu Xuan** *(Quantum - Preservation)*: Gánh chịu sát thương, tăng Max HP/Bạo Kích & Hồi máu toàn đội. GIF Ult *"Woes of Many Morphed to One"*.
6. 💜 **Seele** *(Quantum - Hunt)*: Sát thủ Lượng Tử tốc độ cao. GIF Ult *"Butterfly Flurry"*.
7. ⚡ **Jing Yuan** *(Lightning - Erudition)*: Tướng Quan Lôi diện rộng. GIF Ult *"Lightbringer"*.
8. 🌀 **Bronya** *(Wind - Harmony)*: Nhân vật 5★ Thường. Kéo lượt 100% & buff ATK/CRIT DMG toàn đội. GIF Ult *"The Belobog March"*.

### ⭐ 20 Nhân Vật 4★ (Tỷ Lệ Xuất Hiện Phong Phú Khi Quay Gacha):
9. 🦊 **Tingyun** *(Lightning - Harmony)*: Buff Tấn Công & Hồi 50 Năng Lượng cho đồng đội.
10. 🏹 **Yukong** *(Imaginary - Harmony)*: Buff Tỷ lệ Bạo Kích & Sát thương Bạo Kích toàn đội.
11. 📜 **Hanya** *(Physical - Harmony)*: Trạng thái Trọng Tải giúp hồi Điểm Chiến Kỹ (SP) và Tốc độ.
12. 👓 **Pela** *(Ice - Nihility)*: Tuyệt Kỹ giảm 40% DEF toàn bộ kẻ địch.
13. 🎭 **Sampo** *(Wind - Nihility)*: Gây hiệu ứng Bào Mòn (Wind Shear DoT) & tăng sát thương DoT nhận vào.
14. 🥊 **Luka** *(Physical - Nihility)*: Đấm bốc gây hiệu ứng Chảy Máu (Bleed DoT).
15. 🎆 **Guinaifen** *(Fire - Nihility)*: Thiêu Đốt & tăng sát thương kẻ địch gánh chịu.
16. 🎸 **Serval** *(Lightning - Erudition)*: Sát thương Lôi diện rộng & duy trì Sốc Điện.
17. 🀄 **Qingque** *(Quantum - Erudition)*: Rút quẻ Mạt Chược nổ Sát thương Lượng Tử.
18. 🔨 **Herta** *(Ice - Erudition)*: *"Kuru Kuru~"* Xoay búa Băng diện rộng.
19. 🐔 **Sushang** *(Physical - Hunt)*: Gọi Gà Trống khổng lồ giáng đòn Vật Lý dồn dập.
20. 🧸 **Hook** *(Fire - Destruction)*: Thủ lĩnh Băng Mót nổ Sát thương Hỏa & Thiêu Đốt.
21. ⚡ **Arlan** *(Lightning - Destruction)*: Đổi HP bản thân lấy Sát thương Lôi.
22. 🗡️ **Xueyi** *(Quantum - Destruction)*: Bào thanh Điểm Yếu & đòn đánh tăng cường Lượng Tử.
23. 🧹 **Misha** *(Ice - Destruction)*: Đóng băng kẻ địch dồn dập.
24. 🐱 **Lynx** *(Quantum - Abundance)*: Hồi máu toàn đội & giải toàn bộ hiệu ứng xấu.
25. 🍷 **Gallagher** *(Fire - Abundance)*: Hồi máu theo đòn đánh của đồng đội.
26. 🌪️ **Dan Heng** *(Wind - Hunt)*: Tiên phong Phong gây thêm sát thương khi địch bị làm chậm.
27. ❄️ **March 7th** *(Ice - Preservation)*: Tạo Khiên kiên cố & Đóng Băng diện rộng.
28. 🩺 **Natasha** *(Physical - Abundance)*: Bác sĩ Trù Phú hồi máu toàn bộ đồng đội.

---

## 🎲 4. HỆ THỐNG GACHA 50/50 CHUẨN VÀ BANNER DỰ ÁN

Lệnh `/gacha` hỗ trợ quay đơn (Roll 1), quay max 10 (Roll 10) và Đổi Banner trực tiếp:
- 🌟 **50% Win Rate-Up**: Ra đúng nhân vật 5★ của Banner đó (Acheron / Kafka / Blade / Silver Wolf / Fu Xuan / Seele / Jing Yuan).
- 🔴 **50% Lệch Rate (Thua 50/50)**: **CHỈ LỆCH RA NHÂN VẬT 5★ THƯỜNG (Bronya)**. Không bao giờ lệch sang nhân vật 5★ giới hạn của Banner khác!
- 🛡️ **Bảo Hiểm 100%**: Nếu thua 50/50 ở lần 5★ đầu tiên, lần 5★ tiếp theo chắc chắn 100% ra đúng nhân vật Banner!

---

## 👹 5. DANH SÁCH BOSS & PHẦN THƯỞNG CHIẾN THẮNG CHUYÊN BIỆT

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
| **Abundance Deer** *(Hươu Trù Phú)* | ⛩️ Xianzhou | 📘 Chuyên Farm Sách EXP | 700 | **22** | 4 | 10 | `Bộ Lãng Khách Âm Thầm` |
| **Aurumaton Gatekeeper** *(Kim Nhân)* | ⛩️ Xianzhou | 🔮 Bụi Di Vật & Tinh Thể | 800 | 5 | 12 | **25** | `Bộ Chim Ưng` & `Bộ Thợ Săn` |

---

## 📜 Danh Sách 10 Lệnh Slash Commands (`/`)

| Lệnh Slash | Mô Tả Chức Năng |
| :--- | :--- |
| **`/gacha`** | Quay Banner Acheron, Kafka, Blade, Silver Wolf, Fu Xuan, Seele, Jing Yuan & Nón Ánh Sáng 36+ |
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
