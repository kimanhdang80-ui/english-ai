# USER_EMOTION_MAP.md — Bản đồ cảm xúc người học

> Product Design Sprint · Không code. Lập bản đồ **cảm xúc** của người học đi làm, mới bắt đầu,
> qua từng khoảnh khắc — để thiết kế nơi nào cần nâng đỡ. Kèm điểm rơi (drop-off) & cách AI cứu.
> Xem luồng: [LEARNING_EXPERIENCE](./LEARNING_EXPERIENCE.md) · Coach: [AI_DAILY_COACH](./AI_DAILY_COACH.md).

---

## 1. Sự thật cảm xúc nền (điều ít ai nói ra)

Người Việt đi làm mới học lại tiếng Anh thường mang theo **"vết thương tiếng Anh"**:

- **Xấu hổ** vì "học 7 năm mà không nói được" → sợ bị lộ ra là mình kém.
- **Sợ sai** hằn sâu từ lớp học cũ (bị gọi lên bảng, bị chê phát âm).
- **Tự nghi ngờ:** "Chắc mình không có năng khiếu."
- **Mệt & tội lỗi:** muốn học nhưng hết pin sau giờ làm, rồi tự trách vì bỏ bê.

> **Hệ quả thiết kế:** Đối thủ lớn nhất **không phải sự lười**, mà là **nỗi sợ và sự mệt**. Mọi
> khoảnh khắc phải hạ sợ, giảm gánh, và trả về cảm giác "mình làm được".

## 2. Cung cảm xúc lý tưởng trong một buổi (15 phút)

```
Cảm xúc
  cao │                                   ✦ (Session Summary: tự hào)
      │                         ╭─────────╯
      │              ╭──────────╯ (Quiz đúng: "mình nhớ!")
trung │   ╭──────────╯
      │───╯ (Mở app: ngại/mệt)      ╲__╱  ← hõm nhỏ ở AI Feedback (sai)
  thấp│                              (được đỡ dậy ngay)
      └───────────────────────────────────────────────► thời gian
       Mở   Coach  Flashcard  Quiz  Feedback  Review  Summary  Tomorrow
```

**Ý đồ:** bắt đầu từ trạng thái thấp (mệt/ngại) → nâng dần bằng thắng nhỏ → cho phép **một hõm
cảm xúc có kiểm soát** ở Feedback (sai là bình thường) → **luôn kết ở đỉnh** (Summary: tự hào).
Kết thúc ở đỉnh là điều quyết định việc họ quay lại (peak-end rule).

## 3. Bản đồ cảm xúc theo màn hình

| Màn                    | Cảm xúc chủ đạo            | Cường độ  | Điều họ thầm nghĩ        | Nguy cơ rơi                  | AI đỡ thế nào                                 |
| ---------------------- | -------------------------- | --------- | ------------------------ | ---------------------------- | --------------------------------------------- |
| **Mở app**             | Mệt, ngại, do dự           | Thấp      | "Học cho xong đi"        | Lười mở; thấy áp lực → thoát | Cam kết nhỏ "5 phút", 1 nút duy nhất          |
| **Daily Coach**        | Cần được dẫn               | Trung     | "Hôm nay nặng không?"    | Cảm giác deadline            | Chào theo tên + buổi vừa sức + lý do đời thực |
| **Today's Lesson**     | Muốn kiểm soát             | Trung     | "Bao lâu? Mấy phần?"     | Sợ vô tận                    | Lộ trình rõ + thời gian thật + "chỉ 5 từ"     |
| **Flashcard**          | Tò mò / hoặc ngán          | Trung     | "Từ này dùng khi nào?"   | Khô khan, không biết đọc     | Nút nghe + ví dụ công việc + mẹo nhớ          |
| **Quiz**               | Hồi hộp, sợ sai            | Trung-cao | "Lỡ sai thì sao?"        | Sợ bị chấm → bỏ              | Định vị "luyện tập"; gợi ý thay vì phán       |
| **AI Feedback (sai)**  | **Dễ tổn thương nhất**     | Hõm       | "Mình lại kém rồi"       | **Điểm rơi số 1**            | Trấn an → giải thích đời thực → hứa ôn lại    |
| **AI Feedback (đúng)** | Tự hào chớm                | Cao       | "Mình nhớ được!"         | (ít)                         | Khen **tiến bộ cụ thể**, không suông          |
| **Review/SRS**         | Vui khi nhớ / hụt khi quên | Trung     | "Ủa học rồi mà…"         | Quá tải; quên → tự ti        | Giới hạn thẻ + định nghĩa lại "quên"          |
| **Session Summary**    | Tự hào, nhẹ nhõm           | **Đỉnh**  | "Vậy là mình có tiến"    | Nếu chỉ thấy điểm → hụt      | Kể chuyện tiến bộ + kết quả đời thực          |
| **Tomorrow Preview**   | Tò mò, an tâm              | Cao       | "Mai đáng quay lại chứ?" | Kết cụt → quên               | Hé lộ cụ thể + chốt giờ nhắc                  |

## 4. Các điểm rơi (drop-off) & thiết kế cứu

| #   | Điểm rơi                       | Vì sao rơi                     | Cứu bằng thiết kế                                                           |
| --- | ------------------------------ | ------------------------------ | --------------------------------------------------------------------------- |
| D1  | **Không mở app** (ngoài phiên) | Mệt, quên, không có cue        | Nhắc đúng giờ + đúng giọng; cam kết "5 phút"; thói quen neo vào 1 thời điểm |
| D2  | **Mở rồi thoát ở Coach**       | Thấy nặng/áp lực               | Buổi nhẹ luôn sẵn; 1 nút; lời hứa ngắn gọn                                  |
| D3  | **Bỏ giữa Flashcard**          | Danh sách dài, khô             | Giới hạn 5 từ; tiến trình nhìn thấy; động viên giữa chừng                   |
| D4  | **Bỏ ở Quiz vì sợ sai**        | Sang chấn "bị chấm"            | Bỏ Đúng/Sai lạnh; cho "xem gợi ý"; khung "luyện tập"                        |
| D5  | **Sụp ở Feedback khi sai**     | Tự ti bùng lên                 | Công thức trấn-an→giải-thích→hứa-ôn; không bao giờ để treo ở cảm giác kém   |
| D6  | **Nản ở Review vì quên nhiều** | "Học mãi không nhớ"            | Giới hạn thẻ/ngày; "quên là một phần của nhớ"; nút không phán xét           |
| D7  | **Mất chuỗi rồi bỏ hẳn**       | Hiệu ứng "what-the-hell"       | Ngày nghỉ an toàn; win-back không trách; "quan trọng là quay lại"           |
| D8  | **Tuần trôi vô hình**          | Không thấy tiến bộ lớn         | Weekly Coach kể chuyện tiến bộ + đặt mục tiêu mới                           |
| D9  | **Chững ở tuần 2–3** (dip)     | Mới lạ đã hết, kết quả chưa rõ | Cột mốc đời thực đúng lúc (đọc được email); đổi chủ đề theo mục tiêu        |

## 5. Ba khoảnh khắc cảm xúc phải "thắng" cho được

1. **Lần sai đầu tiên (Feedback):** Nếu ở đây họ thấy an toàn thay vì xấu hổ → họ tin app này khác.
   → Đầu tư mạnh vào giọng Feedback (xem [MICROCOPY_GUIDE §3.5](./MICROCOPY_GUIDE.md)).
2. **Lần SRS trả về từ cũ (ngày 3–4):** Cảm giác _"mình vẫn nhớ!"_ là bằng chứng năng lực đầu tiên
   → chứng minh phương pháp hiệu quả → tin tưởng.
3. **Kết buổi (Summary):** Kết ở đỉnh tự hào, gắn đời thực → quyết định họ có quay lại mai.

## 6. Từ cảm xúc → hành vi (vì sao điều này giữ chân)

- **An toàn tâm lý** (không bị phán xét) → dám sai → dám luyện → **học nhiều hơn**.
- **Bằng chứng năng lực** (SRS trả về, đọc được câu thật) → tin "mình làm được" → **quay lại**.
- **Tự chủ** (được chọn buổi nhẹ/chủ đề) → cảm giác sở hữu → **gắn bó**.
- **Kết nối với Coach** (được gọi tên, được nhớ) → bớt cô đơn → **không bỏ giữa chừng**.
- **Kết thúc mở** (Tomorrow Preview) → tò mò chưa khép → **lý do cho ngày mai**.

## 7. Nguyên tắc thiết kế cảm xúc (đưa vào mọi màn)

1. **Không bao giờ để người dùng treo ở cảm giác "mình kém".** Mọi hõm phải có tay đỡ ngay sau đó.
2. **Kết mọi phiên ở đỉnh.** (peak-end rule)
3. **Bình thường hoá lỗi & quên** như một phần tự nhiên của việc học.
4. **Công nhận nỗ lực trước kết quả.** Xuất hiện đều quan trọng hơn điểm cao.
5. **Giảm sợ bằng cách giảm rủi ro xã hội:** không xếp hạng, không so sánh, không "công khai điểm".
6. **Tôn trọng sự mệt:** luôn có đường ra nhẹ; đề xuất nghỉ khi cần — nghỉ đúng cách cũng là giữ nhịp.
