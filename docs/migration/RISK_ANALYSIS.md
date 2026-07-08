# RISK_ANALYSIS.md — Migration V1 → V2

> **Chỉ phân tích.** Rủi ro kỹ thuật/dữ liệu/sản phẩm/vận hành của migration Learning Model, kèm
> khả năng xảy ra × tác động, và giảm nhẹ. Liên quan: [ROLLBACK_PLAN](./ROLLBACK_PLAN.md),
> [DATABASE_MIGRATION_PLAN](./DATABASE_MIGRATION_PLAN.md), [MIGRATION_BACKLOG](../../MIGRATION_BACKLOG.md).

---

## 1. Bối cảnh rủi ro (quan trọng)

- **Điểm nhẹ hoá lớn nhất:** cây learning-engine V1 **chưa launch** (không seed, Progress 501, UI
  placeholder) → **rủi ro mất dữ liệu nội dung ≈ thấp**.
- **Điểm nhạy cảm nhất:** dữ liệu học thật (`user_vocabulary`, `review_history`) + **daily loop/SRS**.
  V2 **không tái cấu trúc** các bảng này (chỉ thêm link `activity_vocabulary`) → rủi ro trực tiếp thấp,
  nhưng **mọi thay đổi consumer phải không gây regression** cho vòng học đang chạy.

## 2. Sổ rủi ro

| ID    | Rủi ro                                                                         | Loại         | K.năng | T.động | Điểm    | Giảm nhẹ                                                                                                     |
| ----- | ------------------------------------------------------------------------------ | ------------ | ------ | ------ | ------- | ------------------------------------------------------------------------------------------------------------ |
| MR-01 | Regression **daily loop/SRS** khi đổi consumer Lesson→Mission                  | tech/product | Trung  | Cao    | **Cao** | Giữ nguyên `LessonSourcePort`; regression test daily loop + SRS trước P4; feature flag                       |
| MR-02 | **Backfill lệch/nhân đôi** (units→tracks, lessons→missions)                    | data         | Trung  | Cao    | **Cao** | Idempotent qua `legacy_*_id`; reconciliation count; parity test; chạy batched trên staging trước             |
| MR-03 | **Suy luận `skill` sai** khi backfill Activity (P3)                            | data/quality | Cao    | Trung  | **Cao** | Mặc định + cờ "cần review thủ công"; không dựa vào skill cho grading; QA nội dung                            |
| MR-04 | **Va chạm tên Track** (enum CourseTrack vs bảng Track) gây nhầm lẫn dev/API    | tech/clarity | Cao    | Thấp   | Trung   | Tài liệu rõ ([LEARNING_MODEL_V2 §4.1]); đổi tên enum hoãn sang P6                                            |
| MR-05 | **Cầu Vocabulary** làm lộ/nhân đôi trạng thái SRS                              | data         | Thấp   | Cao    | Trung   | Link table chỉ tham chiếu; **không** đọc/ghi user_vocabulary qua Mission; SRS vẫn là nguồn sự thật           |
| MR-06 | **AI generator** sinh sai cấu trúc Mission (thiếu activity/answer-key)         | ai/quality   | Trung  | Trung  | Trung   | ContentValidator luật mission; golden test; human review trước publish (AI_ENGINE §6)                        |
| MR-07 | **Phá client** khi đổi `activities` sang missionVersionId                      | api          | Thấp   | Trung  | Thấp    | Ship `/v2/activities`; giữ v1 tới P6; chưa có consumer ngoài                                                 |
| MR-08 | **Scope creep**: migration kéo theo "làm luôn" authoring/progress/gamification | process      | Cao    | Trung  | Trung   | Giới hạn scope theo phase; Progress hiện thực **tối thiểu** (mission) đóng DEBT-009, phần còn lại ra backlog |
| MR-09 | **Không có DB sống** để kiểm backfill (DEBT-004)                               | ops          | Cao    | Trung  | Trung   | Provision Postgres + staging trước P1; migration là thiết kế cho tới khi có DB                               |
| MR-10 | **Downtime/khoá bảng** khi backfill lớn                                        | ops          | Thấp   | Trung  | Thấp    | Backfill batched, ngoài giờ; bảng gần trống nên nhanh                                                        |
| MR-11 | **Mất link route cũ** (SEO/bookmark) khi đổi units/lessons→tracks/missions     | product      | Trung  | Thấp   | Thấp    | Redirect tạm cũ→mới trong soak (P4–P6)                                                                       |
| MR-12 | **Rối versioning** (LessonVersion vs MissionVersion song song)                 | tech         | Trung  | Trung  | Trung   | Một nguồn sự thật (mission) sau P2; cột legacy để truy vết; test parity version                              |

## 3. Rủi ro theo Phase (nóng nhất)

- **P2 (Mission + backfill):** MR-02, MR-12 — nhiều dữ liệu/quan hệ nhất. → gate kỹ, reconciliation.
- **P3 (skill + vocab bridge):** MR-03, MR-05 — ngữ nghĩa + dữ liệu học thật. → không đụng SRS, QA skill.
- **P4 (cutover):** MR-01, MR-07 — consumer đổi nguồn. → regression + flag + `/v2`.
- **P6 (contract):** destructive — rủi ro cao nhất về dữ liệu. → gate riêng, backup, sau soak.

## 4. Rủi ro nếu KHÔNG migrate (đối chứng)

- Hai cấu trúc song song (learning-engine trống + vocabulary rời) tiếp tục phân mảnh; khó thêm
  Grammar/Listening/Reading/Speaking một cách nhất quán; AI generator không có "đích" thống nhất.
  → Migration là **đầu tư giảm nợ cấu trúc**, nên làm **trước khi** có nhiều nội dung/người dùng.

## 5. Testing cần bổ sung (câu hỏi #8)

| Loại                           | Nội dung                                                                                                                       | Phase     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | --------- |
| **Unit**                       | Track/Mission/MissionVersion domain + mappers; Activity.skill; ContentValidator mission                                        | P1–P3     |
| **Integration (cần Postgres)** | Backfill **idempotent** (chạy 2 lần không nhân đôi); reconciliation count units↔tracks, lessons↔missions; parity dữ liệu V1↔V2 | P1–P3     |
| **Contract**                   | API v1 vẫn đúng envelope; API v2 (tracks/missions/activities) đúng shape; không lộ answer-key                                  | P1–P4     |
| **Regression**                 | **Daily loop + SRS + vocabulary không đổi hành vi** (chạy lại bộ test hiện có + E2E)                                           | mỗi phase |
| **AI golden**                  | Generator sinh Mission hợp lệ theo schema (đủ activity/đúng skill/answer-key)                                                  | P4        |
| **Rollback drills**            | Tắt cờ → V1 chạy; migrate→backfill→revert trên staging; P6 backup→restore                                                      | mỗi phase |

Đóng luôn khoảng trống hiện tại: **DEBT-012** (Postgres + integration tests trong CI) là **tiền đề**
cho migration — cần làm ở P0/P1.

## 6. Giả định & phụ thuộc

- Có Postgres + staging trước P1 (phụ thuộc DEBT-004).
- Authoring nội dung learning-engine chưa mở public → cửa sổ cutover rủi ro thấp.
- Không có consumer API bên thứ ba → deprecation nội bộ là đủ.
