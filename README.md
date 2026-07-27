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

## 🌐 1. HẠ TẦNG VẬN HÀNH 24/7 & LƯU TRỮ ĐÁM MÂY VĨNH CỬU

- ☁️ **Chạy 24/7/365 Độc Lập**: Triển khai trên **Render Web Service** kết hợp với **UptimeRobot Keep-Alive** (ping 5 phút/lần). Bạn có thể tắt laptop, gập máy hay đi ngủ mà bot vẫn luôn online phản hồi mượt mà!
- 🗄️ **MongoDB Atlas Cloud Database**: Toàn bộ tài khoản người chơi, Jades, Cấp thám hiểm, Đội hình, Vũ khí và Di vật được **lưu trữ vĩnh viễn trên Cloud**, không bao giờ bị xóa hay reset khi re-deploy code nữa!
- 👥 **Cô Lập Bộ Nghe Tương Tác (Multi-User Concurrency)**: Bộ nghe sự kiện nút bấm được cô lập 100% theo từng tin nhắn (`i.message.id === response.id`). Hàng chục người chơi có thể gacha, thay đồ và đánh boss song song trong cùng 1 kênh Discord mà không bao giờ bị xung đột hay chặn nhầm.
- 🎬 **Hiệu Ứng Ultimate GIF Động Ngắt Lượt Chống Spam**: Tự động hiển thị và cập nhật ảnh GIF Tuyệt kỹ hoành tráng cho từng nhân vật (Acheron, Kafka, Seele, Jing Yuan, Blade, Silver Wolf, Fu Xuan, Bronya...) trực tiếp trên 1 khung duy nhất để chống rác tin nhắn kênh chat.

---

## 🔑 2. HỆ THỐNG MÃ KEYCODE UID ĐỘC NHẤT TOÀN SERVER (OWO STYLE)

- 🔑 **Mã Trang Bị Độc Nhất**: Tất cả Vũ khí (Nón Ánh Sáng) và Thánh Di Vật thu thập được từ `/gacha`, `/battle`, `/hunt` đều có mã Keycode UID duy nhất trên toàn hệ thống (`🆔 #A-1082`, `🆔 #W-5021`).
- 🛡️ **Giới Hạn Trang Bị Độc Quyền 1 Mảnh / 1 Nhân Vật**: Một mảnh Di vật chỉ có thể trang bị cho 1 nhân vật duy nhất. Khi chuyển cho nhân vật B, trang bị sẽ tự động tháo khỏi nhân vật A.
- 📱 **Mobile-Friendly Quick Input**: Người chơi trên điện thoại hay PC đều có thể gõ trực tiếp `/delete #A-1082` hoặc rã nhiều mã `/delete #A-1082 #A-1083 #W-5021` 1 cách siêu tốc.

---

## 🧠 3. SMART FLEXIBLE ORDER PARSER (TỰ ĐỘNG NHẬN DIỆN THỨ TỰ THAM SỐ)

Bot tích hợp bộ phân tích tham số thông minh, người chơi không bao giờ phải nhớ thứ tự nào trước hay sau:
- `/give @User #A-1082` ➡️ **HOẠT ĐỘNG HOÀN HẢO!**
- `/give #A-1082 @User` ➡️ **HOẠT ĐỘNG HOÀN HẢO!**
- `/borrow @User 5000` ➡️ **HOẠT ĐỘNG HOÀN HẢO!**
- `/borrow 5000 @User` ➡️ **HOẠT ĐỘNG HOÀN HẢO!**

---

## 🏦 4. HỆ THỐNG VAY MƯỢN JADES & TỰ ĐỘNG TRẢ NỢ QUA FARM (`/borrow`)

- 🤝 **Thỏa Thuận 2 Chiều**: Người vay phát lệnh `/borrow`, người cho vay nhận thông báo bấm nút **`✅ Đồng Ý`** hoặc **`❌ Từ Chối`**.
- 🔄 **Cơ Chế Trả Nợ Tự Động**: Khi đang có khoản nợ, **toàn bộ Ngọc Ánh Sao (Jades)** mà người vay farm được ở `/battle`, `/hunt`, `/lahoan`... sẽ tự động trích trả cho chủ nợ cho đến khi hoàn trả 100% nợ.
- 🔒 **Khóa Vay Tiếp**: Người đang nợ không thể tiếp tục vay mượn từ bất kỳ ai cho đến khi hết nợ.

---

## ⚔️ 5. HỆ THỐNG NGUYÊN TỐ, KHẮC CHẾ ĐIỂM YẾU & DÒNG BUFF THUỘC TÍNH

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

## 🎲 6. CÁC DÒNG BUFF CHỈ SỐ NGẪU NHIÊN 100% TRÊN VŨ KHÍ & DI VẬT

Mọi Vũ Khí & Thánh Di Vật (4★ / 5★) khi nhận được đều được hệ thống tự động sinh ngẫu nhiên **1 Dòng Chỉ Số Chính (Mainstat)** và **4 Dòng Buff Chỉ Số Phụ (Substats)** cả về loại chỉ số lẫn con số % cộng thêm:

### 🎲 Danh Sách 12 Dòng Buff Chỉ Số Phụ Ngẫu Nhiên:
1. ⚔️ **ATK%** *(Tỷ lệ Tấn Công)*: Tăng % lực đánh tổng cho nhân vật gây sát thương.
2. 🗡️ **ATK cố định**: Chỉ số Tấn công cộng thẳng vào chỉ số gốc.
3. 🎯 **CRIT Rate%** *(Tỷ lệ Bạo Kích)*: Tăng cơ hội gây đòn đánh Bạo Kích nhân sát thương.
4. 💥 **CRIT DMG%** *(Sát Thương Bạo Kích)*: Tăng nhân lực sát thương khi kích hoạt bạo kích.
5. ⚡ **SPD** *(Tốc Độ)*: Giúp nhân vật hành động trước và gia tăng số lượt đi trong trận.
6. ❤️ **HP%** *(Tỷ lệ Máu)*: Tăng % sinh lực tối đa cho nhân vật (đặc biệt là Blade, Fu Xuan, Lynx).
7. 🩺 **HP cố định**: Chỉ số Máu cộng thẳng vào sinh lực gốc.
8. 🛡️ **DEF%** *(Tỷ lệ Phòng Thủ)*: Tăng % giáp và độ dày của Khiên tạo ra (March 7th, Fu Xuan).
9. 🧱 **DEF cố định**: Chỉ số Phòng thủ cộng thẳng.
10. 🔮 **Hồi EP%** *(Energy Recovery)*: Hồi năng lượng giúp nhân vật nạp Tuyệt Kỹ ngắt lượt cực nhanh.
11. 🔨 **Tấn Công Phá Vỡ%** *(Break Effect)*: Tăng sát thương phá cản và sát thương nổ khi đánh bể thanh Điểm Yếu của Boss.
12. 💚 **Tăng Hồi Máu%** *(Outgoing Healing)*: Tăng lượng máu trị liệu cho nhân vật Trù Phú (Natasha, Lynx, Gallagher).

---

## 👤 7. BỂ 28 NHÂN VẬT HOÀN CHỈNH TRONG BOT

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

## 🛡️ 8. BẢNG THÁNH DI VẬT (ARTIFACT SETS) & NHÂN VẬT PHÙ HỢP

Khi chiến thắng Boss ở `/battle` hoặc săn quái ở `/hunt`, người chơi nhận được Di Vật (4★ / 5★). Dưới đây là các bộ Di Vật và nhân vật tối ưu nhất:

| Bộ Thánh Di Vật | Hiệu Ứng Bộ Trang Bị | Nhân Vật Phù Hợp Nhất |
| :--- | :--- | :--- |
| 🌌 **Bộ Thiên Tài Trường Sân Ga** *(Genius of Brilliant Stars)* | • **2 Món**: Tăng +10% Sát Thương Lượng Tử.<br>• **4 Món**: Bỏ qua 10% DEF kẻ địch (bỏ qua 20% DEF nếu địch có Điểm Yếu Lượng Tử). | **Seele**, **Silver Wolf**, **Qingque**, **Fu Xuan**, **Xueyi** |
| 🦅 **Bộ Chim Ưng Tháp Hoang** *(Eagle of Twilight Line)* | • **2 Món**: Tăng +10% Sát Thương Phong.<br>• **4 Món**: Sau khi dùng Tuyệt Kỹ, hành động của bản thân được Ưu Tiên Hành Động +25%. | **Blade**, **Bronya**, **Sampo**, **Dan Heng** |
| 🌾 **Bộ Thiện Xạ Trường Hoang** *(Musketeer of Wild Wheat)* | • **2 Món**: Tăng +12% ATK.<br>• **4 Món**: Tăng +6% Tốc Độ (SPD) và +10% Sát thương Đánh Thường. | **Tingyun**, **Yukong**, **Hanya**, **Sushang**, **Arlan**, **Natasha** |
| 🏰 **Bộ Hiệp Sĩ Giáo Đường** *(Knight of Purity Palace)* | • **2 Món**: Tăng +15% DEF.<br>• **4 Món**: Tăng +20% Lượng Hấp Thụ Sát Thương của Khiên do bản thân tạo ra. | **Fu Xuan**, **March 7th**, **Gepard** |
| ❄️ **Bộ Thợ Săn Băng Tuyết** *(Hunter of Glacial Forest)* | • **2 Món**: Tăng +10% Sát Thương Băng.<br>• **4 Món**: Sau khi dùng Tuyệt Kỹ, Sát Thương Bạo Kích (CRIT DMG) tăng +25% trong 2 lượt. | **Herta**, **Pela**, **Misha** |
| ☁️ **Bộ Lãng Khách Âm Thầm** *(Passerby of Wandering Cloud)* | • **2 Món**: Tăng +10% Lượng Hồi Máu.<br>• **4 Món**: Ngay khi vào trận, hồi phục ngay +1 Điểm Chiến Kỹ (SP) cho toàn đội. | **Natasha**, **Lynx**, **Gallagher** |

---

## ⚔️ 9. BỂ VŨ KHÍ NÓN ÁNH SÁNG VĨNH CỬU (36+ VŨ KHÍ) & DÒNG NỘI TẠI CHUYÊN BIỆT

Banner Vũ Khí Vĩnh Cửu (`/gacha` -> Banner Vũ Khí) bao gồm 36+ Nón Ánh Sáng độc đáo cho 7 Vận Mệnh. Mọi Vũ Khí nhận được đều có **Dòng Nội Tại Đặc Biệt** cố định:

### 🌟 Nón Ánh Sáng 5★ (Thập Đại Thần Binh):
1. **In the Night (Trong Đêm Tối)** [Săn Bắn]: Tăng +18% CRIT Rate. Mỗi 10 SPD > 100 tăng +6% Sát thương Đánh Thường/Chiến Kỹ & +12% CRIT DMG Tuyệt Kỹ. *(Phù hợp: Seele, Sushang, Dan Heng)*
2. **Before Dawn (Trước Bình Minh)** [Tri Thức]: Tăng +36% CRIT DMG & +18% Sát thương Chiến Kỹ/Tuyệt Kỹ. Trạng thái 'Mộng Thân' tăng +48% Đòn Tăng Cường. *(Phù hợp: Jing Yuan, Qingque, Serval, Herta)*
3. **But the Battle Isn't Over (Cuộc Chiến Chưa Nguôi)** [Hòa Hợp]: Tăng +10% Hồi EP. Hồi +1 SP khi dùng Ult lên đồng đội. Tăng +30% ATK cho đồng đội tiếp theo. *(Phù hợp: Bronya, Tingyun, Yukong, Hanya)*
4. **Moment of Victory (Thời Khắc Chiến Thắng)** [Bảo Hộ]: Tăng +24% DEF và +24% Kháng Khống Chế. Thu hút kẻ địch tấn công & tăng thêm +24% DEF khi bị đánh. *(Phù hợp: Fu Xuan, March 7th, Gepard)*
5. **Time Waits for No One (Thời Gian Không Chờ Ai)** [Trù Phú]: Tăng +18% HP tối đa & +12% Lượng Hồi Máu. Gây thêm Sát thương thuộc tính theo lượng trị liệu. *(Phù hợp: Natasha, Lynx, Gallagher)*
6. **Sleep Like the Dead (Giấc Ngủ Tựa Chết)** [Săn Bắn]: Tăng +30% CRIT DMG. Khi đòn đánh không bạo kích, tăng +36% CRIT Rate trong 1 lượt. *(Phù hợp: Seele, Sushang)*
7. **Night on the Milky Way (Đêm Trên Dải Ngân Hà)** [Tri Thức]: Tăng +9% ATK với mỗi kẻ địch trên sân. Tăng +30% Sát thương khi có kẻ địch bị Phá Vỡ Điểm Yếu. *(Phù hợp: Jing Yuan, Qingque, Herta)*
8. **Something Irreplaceable (Vật Phẩm Không Thể Thay Thế)** [Hủy Diệt]: Tăng +24% ATK. Khi tiêu diệt kẻ địch hoặc bị đánh, hồi 8% HP & tăng +24% Sát thương. *(Phù hợp: Blade, Arlan, Hook, Xueyi, Misha)*
9. **On the Fall of an Aeon (Sự Sụp Đổ Của Aeon)** [Hủy Diệt]: Mỗi đòn đánh tăng +8% ATK (tối đa 4 cộng dồn). Phá Vỡ Điểm Yếu tăng +12% Sát thương trong 2 lượt. *(Phù hợp: Blade, Hook, Xueyi)*
10. **Patience Is All You Need (Chỉ Cần Kiên Nhẫn)** [Hư Vô]: Tăng +24% Sát thương gây ra. Tăng +4.8% SPD mỗi đòn đánh & thiêu đốt/sốc điện kẻ địch. *(Phù hợp: Acheron, Kafka, Silver Wolf, Pela, Sampo, Luka, Guinaifen)*

### ⭐ Nón Ánh Sáng 4★ (16 Vũ Khí Tiêu Chuẩn):
- **Only Silence Remains (Chỉ Còn Lại Chốn Lặng Yên)** [Săn Bắn]: Tăng +24% ATK & +12% CRIT Rate khi có ≤ 2 kẻ địch.
- **Swordplay (Luận Kiếm)** [Săn Bắn]: Đánh liên tục cùng 1 mục tiêu tăng +8% Sát thương/đòn (tối đa 5 lần).
- **River Flows in Spring (Suối Mùa Xuân)** [Săn Bắn]: Tăng +8% SPD & +12% Sát thương (mất khi chịu sát thương).
- **The Birth of the Self (Sự Ra Đời Của Bản Thể)** [Tri Thức]: Tăng +24% Sát thương đòn Tăng Cường (+24% nếu HP địch < 50%).
- **Geniuses' Repose (Sự Nghỉ Ngơi Của Thiên Tài)** [Tri Thức]: Tăng +16% ATK & +24% CRIT DMG khi hạ gục kẻ địch.
- **Make the World Clamor (Hãy Làm Thế Giới Ồ Ạt)** [Tri Thức]: Vào trận tự hồi +20 EP & tăng +32% Sát thương Tuyệt Kỹ.
- **Day One of My New Life (Ngày Đầu Tiên Cuộc Sống Mới)** [Bảo Hộ]: Tăng +16% DEF & giảm 8% Sát thương gánh chịu toàn đội.
- **Landau's Choice (Sự Lựa Chọn Của Landau)** [Bảo Hộ]: Tăng khả năng bị đánh & giảm 16% Sát thương gánh chịu.
- **Trend of the Universal Market (Xu Hướng Thị Trường)** [Bảo Hộ]: Tăng +16% DEF & thiêu đốt kẻ địch khi bị tấn công.
- **Shared Feeling (Cùng Dốc Lòng)** [Trù Phú]: Tăng +10% Lượng Hồi Máu & hồi +2 EP cho toàn đội khi dùng Skill.
- **Post-Op Conversation (Trò Chuyện Sau Phẫu Thuật)** [Trù Phú]: Tăng +8% Hồi EP & +12% Lượng Hồi Máu khi dùng Ult.
- **Perfect Timing (Thời Điểm Thích Hợp)** [Trù Phú]: Tăng +16% Kháng Hiệu Ứng & tăng Hồi Máu dựa trên Kháng Hiệu Ứng.
- **Past and Future (Quá Khứ và Tương Lai)** [Hòa Hợp]: Sau khi dùng Skill, tăng +16% Sát thương cho đồng đội hành động kế tiếp.
- **Planetary Rendezvous (Điểm Hẹn Hành Tinh)** [Hòa Hợp]: Tăng +12% Sát thương cho đồng đội cùng thuộc tính.
- **Eyes of the Prey (Ánh Mắt Con Mồi)** [Hư Vô]: Tăng +20% Chính Xác Hiệu Ứng & +24% Sát Thương DoT.
- **A Secret Vow (Lời Thề Thầm Kín)** [Hủy Diệt]: Tăng +20% Sát thương (+20% nếu HP% địch cao hơn bản thân).

### ⚪ Nón Ánh Sáng 3★ (10 Vũ Khí Tân Thủ):
- *Arrows, Darting Arrow, Adversary, Cornucopia, Fine Fruit, Passkey, Meshing Cogs, Amber, Defense, Collapsing Sky*.

---

## 👹 10. DANH SÁCH BOSS & PHẦN THƯỞNG CHIẾN THẮNG CHUYÊN BIỆT

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

## 📜 11. DANH SÁCH 15 LỆNH SLASH COMMANDS (`/`)

| Lệnh Slash | Mô Tả Chức Năng Chi Tiết |
| :--- | :--- |
| **`/equipment`** | Quản lý trang bị: Chọn Nhân vật ➡️ Chọn Slot (`Head`/`Hands`/`Body`/`Feet`) ➡️ Chọn theo Mã Keycode độc nhất |
| **`/inventory`** | Xem Kho Nhân Vật, Kho Vũ Khí (S1-S5) và Kho Di Vật với phân trang OwO Style (`◀` `▶`) kèm Mã Keycode |
| **`/delete`** | Phân rã trang bị rác siêu tốc theo mã Keycode (`/delete #A-1082 #W-5021`) nhận Bụi Di Vật & Tinh Thể |
| **`/give`** | Tặng Vũ Khí hoặc Thánh Di Vật theo mã Keycode cho người chơi khác (Cấm tặng nhân vật/nguyên liệu) |
| **`/borrow`** | Vay mượn Ngọc Ánh Sao (Jades) bạn bè kèm cơ chế Tự động trích Jades cày được để trả nợ |
| **`/hunt`** | Săn quái thường cày EXP, Jades, Sách, Tinh thể, Bụi và nhặt phôi Thánh Di Vật mới |
| **`/pvp`** | Thách đấu PVP đội hình theo lượt giữa 2 người chơi trong Server |
| **`/gacha`** | Quay Banner Acheron, Kafka, Blade, Silver Wolf, Fu Xuan, Seele, Jing Yuan & Banner Vũ Khí 36+ |
| **`/battle`** | Khiêu chiến 9 Boss (Herta, Belobog, Xianzhou) nhận 2 Di vật 4★/5★ & Thưởng chuyên biệt |
| **`/upgrade`** | Nâng cấp Level Nhân Vật, Vũ Khí, Kỹ Năng (Đánh Thường/Skill/Ult), Cường hóa Di vật (+15) |
| **`/team`** | Xếp đội hình 4 Nhân vật ra trận và xem Chỉ số thực tế |
| **`/profile`** | Xem Thẻ Thông Tin Người Chơi, Cấp Thám Hiểm & Vật liệu tích lũy |
| **`/lahoan`** | Khiêu chiến Tháp Sảnh Đường Hư Vô 10 Tầng nhận hàng ngàn Jades |
| **`/info`** | Thư viện tra cứu Nhân vật, Vũ khí & Di vật phân trang OwO Style (`◀` `▶`) |
| **`/admin`** | Lệnh Admin cấp tài nguyên test game cho bản thân hoặc người chơi khác (`/admin giveall @target`) |

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Bot

```bash
# 1. Cài đặt các thư viện
npm install

# 2. Khởi chạy Bot Discord
node index.js
```
