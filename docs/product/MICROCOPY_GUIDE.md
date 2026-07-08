# MICROCOPY_GUIDE.md — Giọng nói của "Cô Mai"

> Product Design Sprint · Không code. Kim chỉ nam viết chữ trong app: **nói như một người thầy
> kiên nhẫn**, không như một cái máy chấm điểm. Persona: [AI_DAILY_COACH §2](./AI_DAILY_COACH.md).
> Ngôn ngữ giao diện: **tiếng Việt** (nội dung học là tiếng Anh).

---

## 1. Nguyên tắc giọng điệu (voice principles)

1. **Ấm, không sến.** Như thầy cô thật: gần gũi nhưng tôn trọng.
2. **Cụ thể, không chung chung.** "Chị nhớ nhanh hơn hôm qua" > "Giỏi lắm".
3. **Khen nỗ lực & tiến bộ, không khen trí thông minh.** (Growth mindset – Dweck)
4. **Bình thường hoá lỗi sai.** Sai là một bước của việc học, không phải thất bại.
5. **Luôn có bước tiếp theo.** Không bao giờ để người dùng "treo" trong cảm giác kém.
6. **Ngắn.** Người bận đọc lướt. Một ý một câu.
7. **Xưng hô:** Coach xưng **"mình"**, gọi người dùng bằng **tên** (hoặc bạn/anh/chị theo khai báo).

## 2. Quy tắc "Không dùng → Hãy dùng"

| ❌ Không dùng                | ✅ Hãy dùng (giọng thầy)                                              |
| ---------------------------- | --------------------------------------------------------------------- |
| "Correct." / "Đúng."         | "Chuẩn rồi! Câu này chị chắc ghê."                                    |
| "Wrong." / "Sai."            | "Chưa đúng, nhưng gần rồi. Để mình chỉ nhé."                          |
| "Incorrect answer."          | "Câu này hơi khó — nhiều người cũng nhầm."                            |
| "You failed." / "Điểm: 4/10" | "Hôm nay chị nhớ được 6 từ. Mai mình ôn tiếp 4 từ còn lại."           |
| "Try again."                 | "Thử lại nhẹ nhàng nhé, không vội."                                   |
| "Streak lost!"               | "Không sao đâu — quan trọng là chị quay lại. Bắt đầu lại từ hôm nay." |
| "You must review 30 cards."  | "Hôm nay có vài từ tới hạn ôn. Mình làm 5 thẻ trước nhé?"             |
| "Level: Beginner"            | "Chị đang ở những bước đầu — đúng chỗ để bắt đầu."                    |
| "Complete the lesson."       | "Còn 2 bước nữa là xong buổi hôm nay."                                |
| "No data." (màn trống)       | "Chưa có gì ở đây. Học buổi đầu tiên để bắt đầu nhé."                 |

## 3. Thư viện microcopy theo màn hình

> Định dạng: **[bối cảnh]** → chuỗi hiển thị. `{ten}`, `{n}`, `{tu}`, `{cauViDu}` là biến.

### 3.1 Mở app & Daily Coach

- **[Chào buổi tối, có streak]** "Chào buổi tối, {ten}. {n} ngày liền rồi đấy — mình tự hào về chị. Hôm nay nhẹ thôi nhé?"
- **[Chào, ngày thường]** "Chào {ten}. Hôm nay mình học 5 từ về **{chuDe}**, xong chị {ketQuaDoiThuc}. Khoảng {phut} phút."
- **[Quay lại sau khi vắng 1 ngày]** "Mừng chị quay lại. Hôm qua nghỉ cũng tốt — hôm nay mình đi tiếp nhẹ nhàng nhé."
- **[Nút bắt đầu]** CTA chính: "Vào học hôm nay" · CTA phụ: "Hôm nay mình chỉ muốn ôn lại"
- **[Đề xuất buổi nhẹ khi mệt]** "Trông hôm nay chị bận. Mình làm buổi 5 phút thôi — giữ nhịp là được."

### 3.2 Today's Lesson (khung mục tiêu)

- **[Tiêu đề]** "Hôm nay: {chuDe}"
- **[Lời hứa kết quả]** "Học xong buổi này, chị {ketQuaDoiThuc} (ví dụ: đọc được câu mời họp)."
- **[Trấn an độ dài]** "Chỉ {n} từ mới thôi — mình không nhồi đâu."
- **[Các bước]** "Buổi hôm nay: Học từ → Nhớ lại → Ôn từ cũ → Tổng kết."

### 3.3 Flashcard

- **[Nhắc nghe]** "Bấm loa để nghe cách đọc nhé."
- **[Ví dụ đời thực]** "Trong công việc: '{cauViDu}'"
- **[Mẹo nhớ từ khó]** "Mẹo nhỏ: {meoNho}"
- **[Động viên giữa chừng]** "Được rồi — 3 từ nữa là xong phần này."
- **[CTA]** chính: "Mình hiểu rồi" · phụ: "Nghe lại" / "Lưu để ôn kỹ"

### 3.4 Quiz (định vị: luyện tập, không phải thi)

- **[Mở quiz]** "Giờ mình thử nhớ lại nhé — sai cũng không sao, đây là lúc để học."
- **[Đúng — cơ bản]** "Chuẩn!"
- **[Đúng — có tiến bộ]** "Chuẩn rồi! Từ này chị nhớ nhanh hơn lần trước đó."
- **[Đúng — từng khó]** "Tuyệt! Từ '{tu}' từng làm khó chị mà giờ nhớ ngon rồi."
- **[Chưa đúng — trấn an]** "Chưa đúng, nhưng gần rồi. Đáp án là **{dapAn}**."
- **[Chưa đúng — nhầm phổ biến]** "Đừng lo, nhầm từ này là bình thường. Rất nhiều người cũng nhầm."
- **[CTA]** chính: "Câu tiếp theo" · phụ: "Mình chưa chắc — xem gợi ý"

### 3.5 AI Feedback (khoảnh khắc dạy)

Cấu trúc chuẩn 3 nhịp: **Trấn an → Giải thích ngắn (đời thực) → Hứa ôn lại.**

- **[Mẫu đầy đủ]**
  > "Đừng lo. Bạn nhầm từ này là bình thường.
  > **watch** là xem có chủ đích (xem phim), còn **see** là tình cờ nhìn thấy.
  > Mình sẽ nhắc lại từ này sau vài ngày nữa nhé."
- **[Khi đúng, cần củng cố]** "Chính xác. Chị dùng '{tu}' đúng ngữ cảnh luôn — đây là cách người bản xứ hay nói."
- **[CTA]** chính: "Mình hiểu rồi" · phụ: "Cho mình ví dụ nữa"

### 3.6 Review / SRS

- **[Mở ôn]** "Vài từ cũ tới hạn ôn rồi. Nhớ lại được là trí nhớ chắc thêm một bậc."
- **[Trước khi lật]** "Chị thử nhớ nghĩa trước khi xem đáp án nhé."
- **[Nút chấm]** "Mình nhớ" · "Nhắc lại sớm hơn" (KHÔNG dùng Đúng/Sai)
- **[Khi quên]** "Quên là một phần của nhớ. Lần sau gặp lại, chị sẽ nhớ chắc hơn — mình hẹn sớm nhé."
- **[Khi vẫn nhớ]** "Vẫn nhớ nè! Từ này đang đi vào trí nhớ dài hạn của chị đấy."
- **[Giới hạn để không quá tải]** "Hôm nay tạm đủ rồi. Ôn ít mà đều tốt hơn nhiều mà nản."

### 3.7 Session Summary (năng lực > điểm số)

- **[Mở]** "Xong rồi! Cùng xem hôm nay chị làm được gì nhé."
- **[Kể chuyện tiến bộ]** "Hôm nay: {nMoi} từ mới, nhớ lại {nOn} từ cũ. Giờ chị đọc được câu: '{cauLamDuoc}'."
- **[Công nhận thời gian]** "{phut} phút rất đáng — chị vừa tiến thêm một bước."
- **[Khi có thành tựu]** "Cột mốc mới: {tenThanhTuu} — {yNghiaDoiThuc}."
- **[CTA]** chính: "Xem ngày mai học gì" · phụ: "Chia sẻ tiến bộ"

### 3.8 Tomorrow Preview

- **[Hé lộ]** "Mai mình gặp lại {n} từ hôm nay + học thêm {chuDeMai}."
- **[Chốt thói quen]** "Chị hay học lúc {gio}. Mình nhắc nhẹ nhé?"
- **[CTA]** chính: "Nhắc mình lúc {gio} mai" · phụ: "Để mình tự chủ động"

### 3.9 Streak & Achievement

- **[Streak có ý nghĩa]** "{n} ngày đều — chị đã học {tong} từ và nhớ chắc {nho} từ."
- **[Ngày nghỉ an toàn]** "Hôm nay chị nghỉ cũng không sao — mình giữ chuỗi giúp. Mai gặp lại nhé."
- **[Mất chuỗi — không trách]** "Không sao đâu. Chuỗi dài không quan trọng bằng việc chị quay lại. Mình bắt đầu lại từ hôm nay."
- **[Trao thành tựu]** "🎉 {tenThanhTuu}! {yNghiaDoiThuc}. Đây là điều chị tự làm được đấy."

### 3.10 Nhắc nhở & Win-back (thông báo)

- **[Nhắc nhẹ, đúng giờ]** "Đến giờ 5 phút tiếng Anh rồi, {ten}. Hôm nay nhẹ thôi nhé."
- **[Vắng 1 ngày]** "Hôm nay mình học 5 phút thôi cũng được — giữ nhịp là chính."
- **[Vắng 3 ngày — win back]** "Mình vẫn ở đây, {ten}. Không cần học nhiều — mình bắt đầu lại thật nhẹ nhé?"
- **[Không bao giờ]** doạ "sắp mất chuỗi!", "bạn sẽ quên hết!", spam nhiều lần/ngày.

### 3.11 Màn trống / Lỗi (empty & error states)

- **[Chưa có từ nào]** "Chưa có từ nào ở đây. Học buổi đầu tiên để bắt đầu bộ từ của chị nhé."
- **[Không có gì để ôn]** "Hôm nay không có từ tới hạn — chị đang theo lịch rất tốt. Học từ mới nhé?"
- **[Mất mạng]** "Có vẻ mạng đang chập chờn. Mình chờ chị chút nhé — tiến độ không mất đâu."
- **[AI chưa sẵn]** "Phần giải thích đang bận chút. Đây là gợi ý nhanh trước đã nhé." (fallback êm)

## 4. Checklist trước khi viết bất kỳ dòng chữ nào

- [ ] Có nói như **con người/giáo viên** không? (đọc to lên nghe có "máy" không)
- [ ] Có **cụ thể** không? (tránh "Tốt lắm" chung chung)
- [ ] Nếu là lỗi/sai: đã **trấn an + chỉ đường + hứa ôn lại** chưa?
- [ ] Có **bước tiếp theo rõ ràng** không?
- [ ] Có ngắn không? (một ý/câu; bỏ chữ thừa)
- [ ] Có vô tình **phán xét/áp lực điểm số** không?
- [ ] Tiếng Việt tự nhiên chưa? (không dịch cứng từ tiếng Anh)

## 5. Bảng thuật ngữ (nhất quán toàn app)

| Khái niệm            | Từ dùng trong app               | Tránh                                    |
| -------------------- | ------------------------------- | ---------------------------------------- |
| Buổi học hằng ngày   | "buổi học hôm nay"              | "bài tập", "nhiệm vụ"                    |
| Ôn spaced repetition | "ôn lại", "nhắc lại"            | "kiểm tra", "test"                       |
| Chấm thẻ nhớ         | "Mình nhớ" / "Nhắc lại sớm hơn" | "Đúng" / "Sai"                           |
| Từ đã nhớ chắc       | "nhớ chắc"                      | "mastered", "hoàn thành"                 |
| Người thầy AI        | "Mai" / "Coach"                 | "bot", "hệ thống", "AI" (khi trò chuyện) |
| Chuỗi ngày học       | "chuỗi ngày đều"                | "streak" (trong câu tiếng Việt)          |
