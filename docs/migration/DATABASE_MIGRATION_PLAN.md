# DATABASE_MIGRATION_PLAN.md — V1 → V2

> **Chỉ kế hoạch — KHÔNG tạo migration, KHÔNG sửa `schema.prisma`, KHÔNG chạy DB.** Đây là bản
> thiết kế để một sprint sau thực thi qua **DB gate** ([PROJECT_OS §4](../PROJECT_OS.md): ADR +
> Impact + Migration + Rollback cho _mỗi_ thay đổi). Ánh xạ thực thể: [LEARNING_MODEL_V2](./LEARNING_MODEL_V2.md).
> Rollback từng phase: [ROLLBACK_PLAN](./ROLLBACK_PLAN.md).

---

## 1. Chiến lược: Expand → Backfill → Contract

Mọi thay đổi **cộng thêm (additive)** trước; dữ liệu cũ được **backfill** sang cấu trúc mới; chỉ
**xoá cũ (contract)** sau vòng soak (P6). Không có migration destructive nào chạy trước P6.

**Bối cảnh dữ liệu (giảm rủi ro):** cây `courses/units/lessons/…` hiện **trống hoặc gần trống**
(chưa seed, Progress 501). Dữ liệu thật là `vocabularies`,`user_vocabulary`,`review_history` — **V2
không thay đổi các bảng này**, chỉ thêm link `activity_vocabulary`. → backfill nhẹ, rủi ro thấp.

## 2. Bảng/cột thay đổi (tổng quan)

**Thêm mới (bảng):** `tracks`, `missions`, `mission_versions`, `mission_dependencies`,
`mission_tags`, `mission_objectives`, `activity_vocabulary`.
**Sửa (thêm cột, nullable/additive):** `activities.mission_version_id` (FK, nullable), `activities.skill`
(enum, nullable → default sau backfill).
**Enum:** thêm `ActivitySkill{vocabulary,grammar,listening,reading,speaking}`; thêm giá trị
`PathStepType.mission`; (P6) đổi tên `CourseTrack`→`ProductLine` (deferred).
**Deprecate (P5) → Drop (P6):** `units`, `lessons`, `lesson_versions`, `lesson_dependencies`,
`lesson_tags`, `lesson_objectives`, endpoint v1 tương ứng.

> Mỗi bảng mới theo convention hiện có: UUID PK, `snake_case` @@map, `created_at/updated_at`,
> `deleted_at` (soft-delete) cho bảng nội dung, index `(parent_id, sort_order)`, onDelete Cascade
> cho con thuộc sở hữu / SetNull cho tham chiếu log.

## 3. Kế hoạch theo Phase (mỗi phase = 1 migration additive, có gate riêng)

### P1 — Thêm `tracks` (M1)

- **DDL (mô tả, không viết):** `tracks(id, course_id FK→courses ON DELETE CASCADE, title,
description?, status ContentStatus, sort_order, created_at, updated_at, deleted_at)`,
  index `(course_id, sort_order)`, `(status)`.
- **Backfill:** với mỗi `unit` hiện có → tạo 1 `track` tương ứng (cùng title/sort/status), lưu ánh
  xạ `unit_id→track_id` (bảng tạm hoặc cột `tracks.legacy_unit_id` nullable để truy vết & rollback).
- **Backward compat:** `units` giữ nguyên; đọc song song. Không có FK nào từ cũ trỏ sang mới.
- **Idempotent:** backfill kiểm tra tồn tại theo `legacy_unit_id` trước khi tạo.

### P2 — Thêm `missions` + `mission_versions` (M2)

- **DDL:** `missions(id, track_id FK→tracks CASCADE, slug unique, title, summary?, primary_skill_id?,
cefr_level_id?, difficulty_id?, status, estimated_minutes, xp_reward, sort_order, is_ai_generated,
current_version_id? unique, created_at, updated_at, deleted_at, legacy_lesson_id? )`, các index
  gương theo `lessons`.
  `mission_versions(id, mission_id FK CASCADE, version_number, status, notes?, published_at?,
timestamps, legacy_lesson_version_id?)`, `@@unique(mission_id, version_number)`.
- **Thêm cột:** `activities.mission_version_id` (FK→mission_versions, **nullable**) — song song với
  `lesson_version_id` (giữ nguyên).
- **Backfill:** mỗi `lesson`→`mission` (track_id lấy từ ánh xạ P1); mỗi `lesson_version`→`mission_version`;
  set `missions.current_version_id`; **copy** `activities.mission_version_id` từ lesson_version tương ứng
  (không xoá `lesson_version_id`). Backfill `mission_dependencies`/`mission_tags`/`mission_objectives`
  từ bảng lesson_* (M2b nếu tách nhỏ).
- **Dual-write:** từ P2, authoring service ghi **cả** cây cũ và mới (sau cờ) HOẶC ghi mới + backfill
  incremental. Đề xuất: ghi **mới** là nguồn sự thật, giữ cũ read-only (vì cũ gần như trống).

### P3 — `ActivitySkill` + cầu `activity_vocabulary` (M3)

- **Enum:** thêm `ActivitySkill`; thêm cột `activities.skill` (nullable). Backfill `skill` theo suy
  luận từ `ExerciseType`/`ActivityType` hiện có (vd exercise `flashcard`→`vocabulary`,
  `listening`→`listening`), phần còn lại để null/`vocabulary` mặc định + đánh dấu review thủ công.
- **Link table:** `activity_vocabulary(id, activity_id FK CASCADE, vocabulary_id FK→vocabularies
RESTRICT, sort_order, created_at)`, `@@unique(activity_id, vocabulary_id)`, index `(activity_id, sort_order)`.
  → **Không sửa** `vocabularies`/`user_vocabulary`/`review_history`.
- **Backward compat:** daily loop/SRS đọc vocabulary như cũ; link chỉ là _đường vào_ từ Mission.

### P4 — Cutover reads (không đổi schema)

- Không migration DB (thuần code/API/UI/AI + bật cờ). Xem [API_MIGRATION_PLAN](./API_MIGRATION_PLAN.md),
  [UI_MIGRATION_PLAN](./UI_MIGRATION_PLAN.md).

### P5 — Deprecate (M4, không destructive)

- Đánh dấu `units/lessons/lesson_*` **deprecated** (comment schema + ngừng ghi). Có thể thêm cột/۰
  trigger cảnh báo ghi mới (tuỳ chọn). **Không drop.** Bật cờ v2 mặc định on.

### P6 — Contract (M5–M6, destructive — GATE RIÊNG, tương lai)

- Sau vòng soak (đề xuất ≥ 2–4 tuần vận hành v2 ổn định): drop `lesson_dependencies/tags/objectives`,
  `activities.lesson_version_id`, `lesson_versions`, `lessons`, `units`; drop cột `legacy_*`; đổi tên
  enum `CourseTrack→ProductLine`. **Hai pha (expand/contract) cho mỗi drop.** Mỗi drop có backup + rollback.

## 4. Nguyên tắc backfill an toàn

- **Idempotent** (chạy lại không nhân đôi) nhờ cột `legacy_*_id` + kiểm tra tồn tại.
- **Batched** (theo lô) để không khoá bảng lâu.
- **Đối chiếu (reconciliation):** sau mỗi backfill, đếm `count(units)==count(tracks legacy)`, tương
  tự lessons↔missions; log chênh lệch. Test tích hợp kiểm parity (xem [RISK_ANALYSIS §5](./RISK_ANALYSIS.md)).
- **Cột truy vết `legacy_*_id`** cho phép rollback & audit; drop ở P6.

## 5. Ước lượng migration

| Migration                                                                   | Phase | Loại            | Rủi ro                 |
| --------------------------------------------------------------------------- | ----- | --------------- | ---------------------- |
| M1 `tracks` + backfill                                                      | P1    | additive        | Thấp                   |
| M2 `missions`+`mission_versions`+`activities.mission_version_id` + backfill | P2    | additive        | Trung                  |
| M2b `mission_dependencies/tags/objectives` + backfill                       | P2    | additive        | Thấp                   |
| M3 `ActivitySkill`+`activities.skill`+`activity_vocabulary`                 | P3    | additive        | Trung (suy luận skill) |
| M4 deprecate flags                                                          | P5    | additive/none   | Thấp                   |
| M5 drop `activities.lesson_version_id`+lesson_* con                         | P6    | **destructive** | Cao                    |
| M6 drop `lessons/units/lesson_versions` + rename enum                       | P6    | **destructive** | Cao                    |

**Tổng: ~6–7 migration** (4–5 additive trong đường tới hạn P1–P5; 2 destructive ở P6 tương lai).

## 6. Ràng buộc môi trường (hiện tại)

- **Chưa có DB sống** trong môi trường build (DEBT-004): mọi migration ở đây là **thiết kế**; khi
  thực thi cần Postgres + `prisma migrate deploy` + backfill script (tsx) chạy sau migrate.
- Áp dụng gate: mỗi migration kèm **ADR** (bắt đầu ADR-0004 cho P1), Impact, Rollback trước khi viết.
