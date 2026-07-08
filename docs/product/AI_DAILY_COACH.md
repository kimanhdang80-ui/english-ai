# AI_DAILY_COACH.md — Hệ thống "Người thầy AI"

> Product Design Sprint · Không code. Thiết kế **hệ AI đồng hành**: Daily Coach, Weekly Coach,
> Session Summary, Streak, Achievement — tất cả phục vụ **việc học**, không phải trò chơi.
> Xem luồng màn hình ở [LEARNING_EXPERIENCE](./LEARNING_EXPERIENCE.md); giọng nói ở [MICROCOPY_GUIDE](./MICROCOPY_GUIDE.md).

---

## 1. Vì sao cần "Coach", không chỉ "app bài tập"

Người học một mình bỏ cuộc vì **cô đơn, mất phương hướng, và tự ti**. Yếu tố giữ chân mạnh nhất
không phải nội dung — mà là cảm giác **có một người thầy kiên nhẫn để ý tới mình**. AI Daily Coach
biến app từ "danh sách bài" thành "một người đồng hành biết mình đang ở đâu, hôm nay nên làm gì,
và tin rằng mình sẽ giỏi lên".

3 vai trò tâm lý Coach đảm nhận (theo Self-Determination Theory):

- **Relatedness (kết nối):** "Có người biết mình, gọi tên mình, nhớ hôm qua mình học gì."
- **Competence (năng lực):** "Người này chỉ cho mình thấy mình đang tiến bộ thật."
- **Autonomy (tự chủ):** "Người này gợi ý nhưng không ép; mình vẫn được chọn."

## 2. Coach persona — "Cô Mai"

> Một cái tên và tính cách cố định giúp người dùng gắn bó (relatedness). Đề xuất tên: **Mai**.

| Thuộc tính    | Mô tả                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------- |
| Vai           | Giáo viên tiếng Anh người Việt, kiên nhẫn, ấm áp, **từng học tiếng Anh muộn nên hiểu nỗi khổ**. |
| Giọng         | Xưng "mình", gọi người dùng bằng tên hoặc "bạn/chị/anh". Bình tĩnh, cụ thể, không hoa mỹ.       |
| Luôn làm      | Khen **nỗ lực & tiến bộ cụ thể**; bình thường hoá lỗi sai; gắn bài học với đời thực.            |
| Không bao giờ | Chê bai, mỉa mai, dùng "Sai/Đúng" cụt lủn, nói kiểu robot, tạo áp lực điểm số.                  |
| Câu cửa miệng | _"Từ từ thôi, mình đi cùng bạn."_ · _"Quên là chuyện thường, mình nhắc lại sau."_               |

**Ranh giới an toàn (AI Education Expert):** Coach **không bịa** — mọi giải thích bám vào nghĩa/ví
dụ đã có; không phán "trình độ" nặng nề; không so sánh người dùng với người khác; luôn kèm lời hứa
ôn lại khi người dùng sai (khép nỗi lo).

## 3. Daily Coach — "bộ não" quyết định mỗi ngày

Daily Coach là màn đầu tiên mỗi ngày ([LEARNING_EXPERIENCE §3, Màn 1](./LEARNING_EXPERIENCE.md)).
Nó **đọc trạng thái → quyết định buổi học → nói bằng giọng người**.

### 3.1 Đầu vào Coach "đọc" (tín hiệu học tập, không phải điểm)

- Số từ **tới hạn ôn** hôm nay (SRS).
- **Điểm yếu**: từ hay quên, dạng câu hay sai.
- **Nhịp thói quen**: streak, giờ hay học, hôm qua học hay nghỉ.
- **Mục tiêu người dùng** (công việc/du lịch/giao tiếp) → chọn chủ đề từ vựng liên quan.
- **Quỹ thời gian** khai báo (15–20 phút) → cắt độ dài buổi cho vừa.

### 3.2 Đầu ra Coach quyết định

- **Độ dài buổi**: mặc định ~12 phút; ngày mệt/nghỉ lâu → đề xuất "buổi nhẹ 5 phút".
- **Tỷ lệ mới/cũ**: ưu tiên ôn (SRS) trước, thêm ít từ mới (chống quá tải).
- **Chủ đề**: gắn mục tiêu đời thực ("từ vựng họp online").
- **Lời mở đầu**: cá nhân hoá theo hôm qua ("chị nhớ 8/10 từ — giỏi lắm").

### 3.3 Ba chế độ buổi học (Coach tự chọn, người dùng đổi được)

| Chế độ              | Khi nào                    | Nội dung                     | Vì sao                         |
| ------------------- | -------------------------- | ---------------------------- | ------------------------------ |
| **Buổi đều** (~12') | Ngày bình thường           | 5 từ mới + ôn tới hạn + quiz | Nhịp chuẩn, vừa sức            |
| **Buổi nhẹ** (~5')  | Mệt / bận / vừa nghỉ dài   | Chỉ ôn 5–7 thẻ, 0 từ mới     | Giữ thói quen > nhồi kiến thức |
| **Buổi vá** (~8')   | Có nhiều điểm yếu tồn đọng | Ôn tập trung từ hay quên     | Retrieval nhắm đúng lỗ hổng    |

> **Quy tắc vàng:** thà một buổi nhẹ mỗi ngày còn hơn một buổi nặng rồi bỏ. Coach **luôn có đường
> ra nhẹ nhàng** để người bận không bỏ hẳn (bảo vệ thói quen).

## 4. Streak — thiết kế cho _tính nhất quán_, không phải nghiện

Streak dễ trở thành áp lực độc hại ("mất chuỗi là bỏ luôn"). Thiết kế lại để nó phục vụ **thói
quen học đều**, đúng yêu cầu "không gamification chỉ để vui":

- **Streak đếm ngày _có học thật_** (hoàn thành buổi nhẹ cũng tính) → thưởng cho việc xuất hiện, không cho việc cày.
- **"Ngày nghỉ an toàn" (streak freeze) mỗi tuần 1 lần**, tự động: nghỉ 1 ngày không mất chuỗi.
  Coach nói: _"Hôm nay bạn nghỉ cũng không sao — mình giữ chuỗi giúp bạn. Mai gặp lại nhé."_ → **loại bỏ nỗi sợ mất trắng** (lý do bỏ cuộc kinh điển).
- **Khi lỡ mất chuỗi:** không đổ lỗi. _"Không sao đâu. Điều quan trọng không phải chuỗi dài, mà là
  bạn quay lại. Mình bắt đầu lại từ hôm nay."_ → tránh hiệu ứng "what-the-hell" (bỏ luôn vì đã lỡ).
- **Ý nghĩa hoá con số:** thay vì "🔥 12", thêm câu năng lực: _"12 ngày đều — bạn đã học 47 từ và
  nhớ được 39."_ Streak gắn với **kết quả học**, không phải điểm rỗng.

## 5. Achievement — cột mốc _năng lực_, không phải huy hiệu rỗng

Mỗi thành tựu phải trả lời được: _"Cái này chứng minh mình làm được điều gì bằng tiếng Anh?"_

| Thành tựu          | Điều kiện (gắn học)                               | Thông điệp (đời thực)                                            |
| ------------------ | ------------------------------------------------- | ---------------------------------------------------------------- |
| **Câu đầu tiên**   | Ghép đúng 1 câu hoàn chỉnh                        | _"Bạn vừa nói được câu tiếng Anh đầu tiên: 'Nice to meet you.'"_ |
| **50 từ khắc sâu** | 50 từ đạt trạng thái "nhớ dài hạn" (SRS mastered) | _"50 từ này giờ là của bạn — đủ để chào hỏi & hỏi đường."_       |
| **Người kiên trì** | Học đủ 7 ngày (kể cả buổi nhẹ)                    | _"1 tuần đều đặn — đây là điều khó nhất, và bạn đã làm được."_   |
| **Đọc được email** | Hoàn thành cụm chủ đề công việc                   | _"Bạn vừa đủ vốn từ để đọc một email mời họp cơ bản."_           |
| **Vượt điểm yếu**  | Một từ hay quên chuyển sang "nhớ chắc"            | _"Từ 'schedule' từng làm khó bạn — giờ bạn nhớ chắc rồi."_       |

Nguyên tắc: **không** có huy hiệu cho "mở app", "bấm nút", "điểm danh" — chỉ trao khi có **bằng
chứng học được**. Thành tựu xuất hiện trong Session Summary, kèm ví dụ đời thực.

## 6. Weekly Coach — nhìn lại & định hướng (mỗi tuần 1 lần)

Cuối tuần (hoặc sau 7 buổi), Coach mở một **buổi tổng kết tuần** ngắn (~2 phút, đọc là chính):

- **Mục tiêu:** Cho người dùng thấy **bức tranh lớn** (tiến bộ tuần), củng cố bản sắc "mình là
  người đang học đều", và cùng đặt mục tiêu tuần tới (autonomy).
- **Người dùng nghĩ:** _"Một tuần rồi, mình có thật sự khá hơn không?"_
- **Người dùng cảm thấy:** Cần được công nhận; dễ tự nghi ngờ nếu không thấy bằng chứng.
- **Điều khiến bỏ cuộc:** Nếu tuần trôi qua vô hình → mất động lực dài hạn.
- **AI giúp:** Coach kể chuyện tiến bộ bằng **con số có nghĩa + 1 khoảnh khắc cụ thể**:
  > _"Tuần này chị học 6 buổi, thêm 22 từ, và nhớ chắc 18 từ. Nhớ hôm thứ Ba chị suýt bỏ cuộc với
  > từ 'colleague' không? Giờ chị nhớ nó rồi đấy. Tuần sau mình thử học cách nói về công việc của
  > mình bằng tiếng Anh nhé — chị thấy sao?"_
- **CTA chính:** **"Đặt mục tiêu tuần tới"** (chọn 1 chủ đề đời thực).
- **CTA phụ:** "Xem lại các từ tuần này".

**Nội dung Weekly Coach gồm:** tiến bộ (từ mới/nhớ chắc), tính đều (mấy ngày học), 1 điểm mạnh
được nêu tên, 1 điểm yếu sẽ được ôn tuần tới, và 1 lựa chọn hướng đi (tự chủ). Tuyệt đối **không**
xếp hạng so với người khác.

## 7. Bản đồ can thiệp của Coach (khi nào Coach nói gì)

| Thời điểm      | Trạng thái người dùng | Coach làm gì (phục vụ học)                                   |
| -------------- | --------------------- | ------------------------------------------------------------ |
| Mở app         | Bình thường           | Chào theo tên + đề xuất buổi vừa sức                         |
| Giữa Flashcard | Có dấu hiệu chững     | Động viên ngắn: "3 từ nữa thôi"                              |
| Trả lời sai    | Dễ tổn thương         | Trấn an → giải thích ngắn → hứa ôn lại                       |
| Trả lời đúng   | Cần củng cố           | Khen **cụ thể tiến bộ**, không khen suông                    |
| Ôn từ hay quên | Quên lần nữa          | Bình thường hoá + mẹo nhớ + hẹn ôn sớm hơn                   |
| Kết phiên      | Vừa hoàn thành        | Kể chuyện tiến bộ (Session Summary)                          |
| Vắng 1 ngày    | Nguy cơ rơi           | Nhắc nhẹ, không trách; đề xuất buổi 5 phút                   |
| Vắng 3+ ngày   | Nguy cơ bỏ            | Win-back ấm áp: "Mình vẫn ở đây. Bắt đầu lại nhẹ nhàng nhé?" |
| Đạt cột mốc    | Cần công nhận         | Trao Achievement gắn đời thực                                |
| Cuối tuần      | Cần nhìn lại          | Weekly Coach                                                 |

Chi tiết lời nói cho từng ô: [MICROCOPY_GUIDE](./MICROCOPY_GUIDE.md). Cảm xúc tương ứng:
[USER_EMOTION_MAP](./USER_EMOTION_MAP.md).

## 8. Nguyên tắc đạo đức & giữ chân lành mạnh

- **Không dark patterns:** không doạ mất mát, không ép thông báo, không "combo sắp mất".
- **Tôn trọng thời gian:** buổi học _ngắn hơn_ khi người dùng bận; Coach chủ động đề xuất nghỉ khi cần.
- **Trung thực về tiến bộ:** không thổi phồng; con số phản ánh học thật.
- **Riêng tư:** lời nhắc và dữ liệu chỉ để phục vụ việc học của chính người dùng.
