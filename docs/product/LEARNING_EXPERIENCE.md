# LEARNING_EXPERIENCE.md — Trải nghiệm học "AI Daily Coach"

> **Product Design Sprint** · Không code, không sửa DB — đây là bản thiết kế trải nghiệm.
> Người thiết kế: Senior Product Designer + UX Researcher + Learning Scientist + AI Education Expert.
> Tài liệu chị em: [AI_DAILY_COACH](./AI_DAILY_COACH.md) · [MICROCOPY_GUIDE](./MICROCOPY_GUIDE.md) ·
> [USER_EMOTION_MAP](./USER_EMOTION_MAP.md) · [FIRST_30_DAYS](./FIRST_30_DAYS.md).

---

## 0. Chân dung người học (thiết kế cho đúng người)

**Chị Hương, 32 tuổi, chuyên viên marketing, TP.HCM.**

- Đi làm 9 tiếng, về nhà lo con. Chỉ rảnh **15–20 phút** buổi tối hoặc lúc chờ.
- Học tiếng Anh 7 năm ở trường nhưng "không nói được câu nào" → **tự ti, sợ sai, sợ quê**.
- Động lực **thực dụng**: đọc email công việc, họp với đối tác, thăng tiến, đi du lịch.
- Đã tải 3 app rồi bỏ. Lý do bỏ: _"Học một mình chán", "Thấy mình dốt", "Bận quá quên mất"_.
- Không thích bị "chơi game trẻ con". Muốn cảm giác **đang tiến bộ thật**, được **một người thầy kiên nhẫn** dìu.

> **Nguyên tắc thiết kế số 1:** Giao diện và lời nói **bằng tiếng Việt** (tiếng Anh chỉ là nội
> dung học). Người mới bắt đầu không nên phải "giải mã" cả giao diện — đó là gánh nặng nhận thức
> thừa (cognitive load) khiến họ bỏ.

## 1. Bốn trụ cột khoa học học tập (mọi màn hình đều phục vụ 4 điều này)

1. **Retrieval practice** — học bằng cách _nhớ lại_, không phải đọc lại. Quiz đặt sớm, không phải để chấm điểm mà để khắc sâu.
2. **Spaced repetition (SRS)** — chống đường quên Ebbinghaus: ôn đúng từ vào đúng ngày.
3. **i+1 & desirable difficulty** — vừa đủ khó để não làm việc, đủ dễ để không nản.
4. **Động lực bền (Self-Determination Theory)** — Tự chủ (họ chọn), Năng lực (thấy mình giỏi lên), Kết nối (Coach đồng hành). **Không dùng phần thưởng rỗng.**

## 2. Bản đồ luồng (từ lúc mở app)

```
Mở app
  ↓  (Coach chào theo tên + nhắc "hôm nay chỉ 5 phút thôi")
Daily Coach            ← trái tim của app: nói chuyện, đề xuất buổi học vừa sức
  ↓
Today's Lesson         ← nói RÕ hôm nay học gì & học xong làm được gì (mục tiêu thật)
  ↓
Flashcard              ← gặp từ mới: nghe – nhìn – hiểu (input i+1)
  ↓
Quiz                   ← nhớ lại (retrieval), không phải thi
  ↓
AI Feedback            ← thầy giải thích khi sai, khen đúng chỗ khi đúng
  ↓
Review (SRS)           ← ôn lại từ cũ tới hạn — nơi việc học "đóng đinh"
  ↓
Session Summary        ← "hôm nay bạn làm được gì" (năng lực), không phải "điểm số"
  ↓
Tomorrow Preview       ← mở vòng lặp (Zeigarnik): "mai gặp lại 3 từ này + 1 điều mới"
```

Mỗi tuần một lần: **Weekly Coach** (xem [AI_DAILY_COACH §3](./AI_DAILY_COACH.md)).

---

## 3. Thiết kế từng màn hình

> Mỗi màn hình mô tả theo 7 lát cắt: **Mục tiêu · Người dùng nghĩ gì · Cảm thấy gì · Điều khiến
> bỏ cuộc · AI giúp tiếp tục thế nào · CTA chính · CTA phụ.** Microcopy đầy đủ ở
> [MICROCOPY_GUIDE](./MICROCOPY_GUIDE.md).

### Màn 0 — Mở app (Cold start, < 3 giây)

- **Mục tiêu:** Đưa người dùng vào buổi học nhanh nhất, hạ ngay nỗi sợ "lại phải học".
- **Nghĩ gì:** _"Mình có 10 phút, làm nhanh cho xong."_ / _"Không biết hôm nay học gì."_
- **Cảm thấy:** Mệt sau giờ làm, hơi ngại, cần được dẫn dắt chứ không muốn tự quyết.
- **Điều khiến bỏ cuộc:** Màn chờ lâu; bắt chọn quá nhiều thứ; thấy "bài tập" là thấy áp lực.
- **AI giúp tiếp tục:** Coach chào ngay bằng tên, **rút gọn quyết định xuống 1 nút**, và hứa
  một cam kết nhỏ ("chỉ 5 phút"). Không menu, không lựa chọn rối.
- **CTA chính:** **"Bắt đầu 5 phút cùng Coach"**
- **CTA phụ:** "Hôm nay mình bận — nhắc lại sau" (hẹn giờ, không bỏ streak — xem [AI_DAILY_COACH §4](./AI_DAILY_COACH.md)).

### Màn 1 — Daily Coach (trái tim của trải nghiệm)

- **Mục tiêu:** Biến việc học thành **một cuộc trò chuyện với người thầy**, không phải mở một
  danh sách bài. Coach đọc tình trạng (đến hạn ôn, streak, điểm yếu) rồi đề xuất buổi hôm nay.
- **Nghĩ gì:** _"Hôm nay học gì? Có nặng không? Mình theo nổi không?"_
- **Cảm thấy:** Muốn được trấn an, muốn thấy hôm nay **nhẹ và có ý nghĩa**.
- **Điều khiến bỏ cuộc:** Nếu Coach chỉ là banner vô hồn ("Bài 12/40") → cảm giác như deadline.
- **AI giúp tiếp tục:** Coach nói **cụ thể & con người**: _"Chào chị Hương. Hôm qua chị nhớ được
  8/10 từ — giỏi lắm. Hôm nay mình học 5 từ về **họp online**, xong chị đọc được câu mời họp bằng
  tiếng Anh. Khoảng 12 phút thôi."_ → gắn với **đời thực** (competence + relevance).
- **CTA chính:** **"Vào học hôm nay"**
- **CTA phụ:** "Hôm nay mình chỉ muốn ôn lại" (tôn trọng tự chủ — cho phép buổi nhẹ).

### Màn 2 — Today's Lesson (khung mục tiêu)

- **Mục tiêu:** Đặt **mục tiêu học được-diễn đạt-bằng-kết-quả** ("học xong làm được gì"), chia
  buổi thành các bước nhỏ nhìn thấy được (giảm cognitive load, tạo cảm giác kiểm soát).
- **Nghĩ gì:** _"Dài không? Bao lâu? Có bao nhiêu phần?"_
- **Cảm thấy:** An tâm khi thấy buổi học **hữu hạn và rõ ràng** (thanh tiến trình 3–4 chặng).
- **Điều khiến bỏ cuộc:** Không biết còn bao lâu → cảm giác vô tận → thoát.
- **AI giúp tiếp tục:** Hiển thị lộ trình rõ: _Học từ → Nhớ lại → Ôn → Tổng kết_, kèm **thời gian
  ước tính thật** ("~12 phút"). Coach nhấn: _"Chỉ 5 từ thôi, không nhồi."_ (chống quá tải).
- **CTA chính:** **"Bắt đầu học từ"**
- **CTA phụ:** "Xem trước 5 từ hôm nay" (giảm bất định cho người lo lắng).

### Màn 3 — Flashcard (gặp từ mới: nghe–nhìn–hiểu)

- **Mục tiêu:** Đưa **input dễ hiểu (i+1)**: từ + phát âm (nghe) + nghĩa tiếng Việt + 1 ví dụ
  đời thực. Chưa bắt sản xuất, chỉ **hiểu & nhận diện**.
- **Nghĩ gì:** _"Từ này đọc sao? Dùng khi nào?"_
- **Cảm thấy:** Tò mò nếu ví dụ gần gũi; ngán nếu chỉ là "từ – nghĩa" khô khan.
- **Điều khiến bỏ cuộc:** Danh sách từ dài; định nghĩa hàn lâm; không có âm thanh → không biết đọc → xấu hổ.
- **AI giúp tiếp tục:** Mỗi từ có **nút nghe** (tự tin phát âm), **ví dụ gắn ngữ cảnh công việc**
  do AI chọn theo mục tiêu người dùng, và mẹo nhớ ngắn khi từ khó. Coach chèn 1 câu động viên
  giữa chừng: _"Được rồi, 3 từ nữa thôi."_
- **CTA chính:** **"Mình hiểu rồi — từ tiếp theo"**
- **CTA phụ:** "Nghe lại" / "Lưu để ôn kỹ" (đánh dấu từ khó → SRS ưu tiên).

### Màn 4 — Quiz (nhớ lại, không phải thi)

- **Mục tiêu:** **Retrieval practice** — ép não _nhớ lại_ để khắc sâu. Định vị là _luyện tập_, không phải _kiểm tra_.
- **Nghĩ gì:** _"Lỡ sai thì sao? Mình mới học mà."_
- **Cảm thấy:** Căng nhẹ (điều tốt cho trí nhớ) nhưng **sợ bị phán xét**.
- **Điều khiến bỏ cuộc:** Chữ "Sai" đỏ chói; điểm thấp; cảm giác bị chấm như hồi đi học → tổn thương.
- **AI giúp tiếp tục:** **Bỏ ngôn ngữ đúng/sai lạnh lùng.** Sai thì Coach nói _"Chưa đúng, nhưng
  gần rồi"_ + đáp án + lý do ngắn. Đúng thì khen **cụ thể** _"Chuẩn! Từ này chị nhớ nhanh hơn hôm
  qua đó."_ Mỗi câu chỉ hỏi thứ vừa học (đảm bảo thắng nhỏ liên tục → competence).
- **CTA chính:** **"Câu tiếp theo"**
- **CTA phụ:** "Mình chưa chắc — xem gợi ý" (giảm sợ sai; gợi ý thay vì đáp án).

### Màn 5 — AI Feedback (người thầy lên tiếng)

- **Mục tiêu:** Biến **lỗi sai thành khoảnh khắc học**, biến **câu đúng thành sự tự tin**. Đây là
  nơi AI thể hiện giá trị "một giáo viên riêng".
- **Nghĩ gì:** _"Tại sao mình sai? Lần sau nhớ kiểu gì?"_
- **Cảm thấy:** Dễ tổn thương nhất toàn phiên. Cần được **trấn an + chỉ đường**, không phải bị chê.
- **Điều khiến bỏ cuộc:** Feedback chung chung ("Sai rồi"), hoặc quá dài/hàn lâm → nản, thấy mình kém.
- **AI giúp tiếp tục:** Giọng thầy giáo, đúng như đề bài yêu cầu:
  > _"Đừng lo. Bạn nhầm từ này là bình thường — rất nhiều người nhầm 'watch' với 'see'. Khác nhau
  > chỗ: **watch** là xem có chủ đích (xem phim), **see** là nhìn thấy. Mình sẽ nhắc lại từ này
  > sau vài ngày nữa nhé."_
  > Feedback luôn: **(1) trấn an → (2) giải thích ngắn, gắn đời thực → (3) hứa ôn lại (khép nỗi lo).**
- **CTA chính:** **"Mình hiểu rồi"**
- **CTA phụ:** "Cho mình ví dụ nữa" (AI sinh thêm ví dụ theo ngữ cảnh của họ).

### Màn 6 — Review / SRS (nơi việc học "đóng đinh")

- **Mục tiêu:** Ôn lại các từ **cũ đã tới hạn** theo lịch spaced repetition — thứ tạo ra ghi nhớ
  dài hạn thật sự. Đây là màn quan trọng nhất về mặt học thuật, dù ít "hào nhoáng".
- **Nghĩ gì:** _"Ủa từ này mình học rồi mà… quên mất."_ (đúng thời điểm vàng để nhớ lại)
- **Cảm thấy:** Vui khi nhận ra mình _vẫn nhớ_; hụt hẫng nhẹ khi quên.
- **Điều khiến bỏ cuộc:** Ôn quá nhiều thẻ một lúc; cảm giác "học hoài không hết"; quên là thấy mình dốt.
- **AI giúp tiếp tục:** Coach **giới hạn số thẻ mỗi ngày** (chống quá tải), và **định nghĩa lại việc
  quên**: _"Quên là một phần của nhớ. Mỗi lần nhớ lại được, trí nhớ của bạn chắc hơn."_ Nút chấm
  không phải Đúng/Sai mà là **"Mình nhớ" / "Nhắc lại sớm"** (không phán xét).
- **CTA chính:** **"Mình nhớ từ này"**
- **CTA phụ:** "Nhắc lại sớm hơn" (SRS đẩy lịch gần lại — người dùng điều khiển độ khó → tự chủ).

### Màn 7 — Session Summary (năng lực, không phải điểm số)

- **Mục tiêu:** Đóng phiên bằng cảm giác **"hôm nay mình tiến bộ thật"** — nhấn _đã làm được gì_,
  không phải _sai bao nhiêu_. Củng cố Competence + gieo lý do quay lại.
- **Nghĩ gì:** _"Vậy là xong. Mình có khá hơn không?"_
- **Cảm thấy:** Muốn được công nhận nỗ lực; muốn thấy con số có ý nghĩa với đời thực.
- **Điều khiến bỏ cuộc (dài hạn):** Nếu tổng kết chỉ là "7/10 điểm" → cảm giác bị chấm, không thấy tiến bộ.
- **AI giúp tiếp tục:** Tổng kết kể **câu chuyện tiến bộ**: _"Hôm nay chị học 5 từ mới, nhớ lại 8
  từ cũ, và giờ chị đọc được câu: 'Can we reschedule the meeting?'. 12 phút rất đáng."_ Kèm **streak
  gắn với việc học** (xem [AI_DAILY_COACH §4](./AI_DAILY_COACH.md)) và **1 thành tựu có ý nghĩa** nếu đạt.
- **CTA chính:** **"Xem ngày mai học gì"** (dẫn thẳng sang Tomorrow Preview — mở vòng lặp)
- **CTA phụ:** "Chia sẻ tiến bộ" (tự hào lành mạnh, tuỳ chọn, không ép).

### Màn 8 — Tomorrow Preview (mở vòng lặp cho ngày mai)

- **Mục tiêu:** Tạo **open loop (hiệu ứng Zeigarnik)** + **implementation intention** (hẹn giờ +
  bối cảnh) để tăng khả năng quay lại — trụ cột của việc hình thành thói quen.
- **Nghĩ gì:** _"Mai học gì? Có đáng quay lại không?"_
- **Cảm thấy:** Tò mò nhẹ, an tâm vì thấy ngày mai **cũng nhẹ** và **liền mạch** với hôm nay.
- **Điều khiến bỏ cuộc:** Kết thúc cụt lủn ("Hẹn gặp lại") → không có lý do cụ thể để quay lại.
- **AI giúp tiếp tục:** Coach hé lộ cụ thể: _"Mai mình gặp lại 3 từ hôm nay + học cách nói giờ giấc
  cuộc họp. Chị hay học lúc 9 giờ tối — mình nhắc nhẹ nhé?"_ → chốt **thời điểm + lý do**.
- **CTA chính:** **"Nhắc mình lúc 9h tối mai"** (đặt cue thói quen)
- **CTA phụ:** "Để mình tự chủ động" (tôn trọng người không thích thông báo).

---

## 4. Nguyên tắc thiết kế xuyên suốt (design principles)

1. **Một buổi = một chiến thắng nhỏ.** Luôn kết thúc ở cảm giác "mình làm được", không phải "mình còn kém".
2. **Giảm quyết định.** Người mệt sau giờ làm không muốn chọn. Coach chọn giùm, người dùng vẫn có quyền đổi.
3. **Native-language scaffolding.** Giao diện & giải thích bằng tiếng Việt; rút dần khi trình độ lên (xem [FIRST_30_DAYS](./FIRST_30_DAYS.md)).
4. **Chống quá tải.** Giới hạn từ mới/ngày và thẻ ôn/ngày. Thà ít mà đều.
5. **Sai là an toàn.** Không "đỏ", không "điểm liệt". Lỗi = dữ liệu để dạy, và luôn kèm lời hứa ôn lại.
6. **Gắn với đời thực.** Mỗi buổi trả lời được câu "học cái này để làm gì" (email, họp, du lịch).
7. **Gamification chỉ phục vụ học.** Streak = tính nhất quán, Achievement = cột mốc năng lực — không huy hiệu rỗng (xem [AI_DAILY_COACH §4–5](./AI_DAILY_COACH.md)).
8. **Kết thúc mở.** Mỗi phiên gieo hạt cho phiên sau (Tomorrow Preview).

## 5. Khoảnh khắc "aha" cần thiết kế cho được

- **Ngày 1:** _"Ồ, chỉ 10 phút mà mình đọc được một câu thật."_ → kích hoạt (activation).
- **Ngày 3–4:** _"Từ hôm trước mình vẫn nhớ!"_ (SRS trả về) → bằng chứng năng lực.
- **Ngày 7:** _"Mình đã học liền 1 tuần — chưa app nào mình theo được vậy."_ → bản sắc mới.
- **Ngày 21–30:** _"Mình đọc được email tiếng Anh của sếp mà không hoảng."_ → giá trị đời thực → giữ chân.

Chi tiết cung đường 30 ngày: [FIRST_30_DAYS](./FIRST_30_DAYS.md). Bản đồ cảm xúc: [USER_EMOTION_MAP](./USER_EMOTION_MAP.md).
