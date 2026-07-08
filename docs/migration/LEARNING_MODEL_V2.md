# LEARNING_MODEL_V2.md — Migration V1 → V2

> **Architecture Migration Sprint** · Vai trò: Principal Software Architect. **Chỉ phân tích &
> thiết kế — không code, không sửa DB, không tạo migration.** Tài liệu chị em:
> [DATABASE_MIGRATION_PLAN](./DATABASE_MIGRATION_PLAN.md) · [API_MIGRATION_PLAN](./API_MIGRATION_PLAN.md)
> · [UI_MIGRATION_PLAN](./UI_MIGRATION_PLAN.md) · [ROLLBACK_PLAN](./ROLLBACK_PLAN.md) ·
> [RISK_ANALYSIS](./RISK_ANALYSIS.md) · [MIGRATION_BACKLOG](../../MIGRATION_BACKLOG.md).
> Tuân thủ [PROJECT_OS §4/§5](../PROJECT_OS.md) (DB gate & API gate) khi thực thi.

---

## 1. Bối cảnh & hiện trạng (đọc từ code, không suy đoán)

**V1 (thực tế trong `prisma/schema.prisma` + `src/modules/learning`):**

```
Course ─▶ Unit ─▶ Lesson ─▶ LessonVersion ─▶ Activity ─▶ Exercise ─▶ Question ─▶ Choice/Answer
```

- `Course.track` là một **enum** (`CourseTrack`: general/toeic/ielts/business/kids) — **một cột,
  không phải bảng**. (Đây là điểm dễ nhầm với "Track" của V2 — xem §4.)
- `ActivityType` là enum **bước sư phạm** (intro/teach/practice/quiz/review/assessment), **không
  phải kỹ năng**.
- **Vocabulary là module riêng** (`vocabularies`, `user_vocabulary`, `review_history`) — **không
  gắn** vào cây learning-engine. Đây là phần **đang chạy thật** (MVP + SRS + daily loop).

**Sự thật quyết định chiến lược (giảm rủi ro dữ liệu):**

- Cây learning-engine V1 **chưa launch**: không có seed nội dung, `ProgressService` trả **501**
  (DEBT-009), UI `/learn/units|lessons` là placeholder (xem [reports/beta-readiness](../../reports/beta-readiness.md)).
  → **Gần như không có dữ liệu sản xuất trên cây Course/Unit/Lesson.**
- Dữ liệu người dùng thật nằm ở **vocabulary** (user_vocabulary/review_history) — V2 **không tái
  cấu trúc** các bảng này, chỉ **bắc cầu** chúng vào Mission. → Rủi ro mất dữ liệu ≈ thấp.

## 2. Mục tiêu V2

```
Course ─▶ Track ─▶ Mission ─▶ Activity ─▶ Exercise ─▶ Question
```

- **Mission là trung tâm** — đơn vị học có mục tiêu đời thực (xem [product/LEARNING_EXPERIENCE](../product/LEARNING_EXPERIENCE.md)).
- **Vocabulary / Grammar / Listening / Reading / Speaking chỉ là Activity** (kỹ năng) bên trong Mission.
- Giữ nguyên `Exercise → Question → Choice/Answer` (định dạng bài tập không đổi bản chất).

## 3. Nguyên tắc migration (ràng buộc bắt buộc)

1. **Backward compatible** — V1 tiếp tục đọc/chạy trong suốt quá trình.
2. **Không phá dữ liệu hiện có** — chỉ **expand → backfill → contract**; không destructive trước khi hết vòng soak.
3. **Không rewrite** — tái dùng `Exercise/Question/Choice/Answer`, versioning, mappers, envelope API.
4. **Không big bang** — chia phase nhỏ, mỗi phase **tự shippable, tự revert được, xanh CI**.
5. **Gate trước khi đổi** — mỗi thay đổi DB đi qua DB gate (ADR-0004… + impact + migration + rollback); mỗi đổi API đi qua API gate.

## 4. Ánh xạ thực thể V1 → V2 (quyết định thiết kế cốt lõi)

| V1                                | V2                                       | Quan hệ                     | Ghi chú thiết kế                                                                 |
| --------------------------------- | ---------------------------------------- | --------------------------- | -------------------------------------------------------------------------------- |
| `Course`                          | `Course`                                 | giữ nguyên                  | Đỉnh cây không đổi.                                                              |
| `Unit`                            | **`Track`** (bảng mới)                   | Course 1─* Track            | Track = **phân đoạn cấu trúc** của Course (thay chỗ Unit).                       |
| `Lesson`                          | **`Mission`** (bảng mới)                 | Track 1─* Mission           | Mission = **đơn vị học trung tâm** (thay chỗ Lesson).                            |
| `LessonVersion`                   | **`MissionVersion`**                     | Mission 1─* MissionVersion  | Giữ nguyên mô hình versioning (snapshot bất biến).                               |
| `Activity` (bước sư phạm)         | **`Activity`** (kỹ năng)                 | MissionVersion 1─* Activity | **Đổi ngữ nghĩa:** thêm `skill` (vocabulary/grammar/listening/reading/speaking). |
| `Exercise/Question/Choice/Answer` | **giữ nguyên**                           | Activity 1─* Exercise …     | Không đổi cấu trúc.                                                              |
| `Vocabulary` (module rời)         | **Activity kiểu `vocabulary`** (bắc cầu) | Activity _─_ Vocabulary     | Qua **link table** `activity_vocabulary`; **không đụng** bảng vocabulary/SRS.    |
| `LessonDependency`                | `MissionDependency`                      | Mission graph               | Copy sang bảng mission-based.                                                    |
| `LessonTag`/`LessonObjective`     | `MissionTag`/`MissionObjective`          | join                        | Copy tương ứng.                                                                  |
| `LearningPathStep.lesson`         | thêm `mission` (PathStepType `mission`)  | path                        | Mở rộng enum, giữ `lesson` trong thời gian soak.                                 |

### 4.1 Xử lý va chạm tên "Track"

- `CourseTrack` (enum: toeic/ielts/business/kids) là **dòng sản phẩm** — **KHÁC** với `Track`
  (bảng, phân đoạn trong Course). Để tránh nhầm:
  - Giữ nguyên enum `CourseTrack` trên `Course` (không đổi để không phá V1).
  - Đề xuất **đổi tên enum → `ProductLine`/`ExamCategory`** ở một phase dọn dẹp **về sau** (low
    priority, gate riêng) — không làm trong migration lõi.

### 4.2 Ngữ nghĩa Activity mới

- Thêm enum `ActivitySkill { vocabulary, grammar, listening, reading, speaking }`.
- Giữ `ActivityType` (intro/teach/practice/quiz/review/assessment) như **vai trò sư phạm** (phụ).
- Một **Mission** = tập hợp có thứ tự các **Activity** thuộc nhiều **skill**; đó là cách "Vocabulary,
  Grammar, Listening, Reading, Speaking chỉ là Activity".

### 4.3 Bắc cầu Vocabulary (không rewrite, không đụng SRS)

- Thêm link table `activity_vocabulary(activity_id, vocabulary_id, sort_order)`.
- Một Activity `skill=vocabulary` trỏ tới một tập từ có sẵn (theo tag/CEFR hoặc danh sách).
- **Daily loop + SRS + user_vocabulary/review_history giữ nguyên** — chỉ có thêm một _đường vào_
  từ Mission. Trải nghiệm học hiện tại không gãy.

## 5. Chiến lược Migration — Expand / Backfill / Contract (theo Phase)

> Mỗi phase: **shippable độc lập · xanh CI · có rollback riêng** (xem [ROLLBACK_PLAN](./ROLLBACK_PLAN.md)).
> Chi tiết DDL/backfill: [DATABASE_MIGRATION_PLAN](./DATABASE_MIGRATION_PLAN.md).

| Phase  | Tên                                     | Nội dung chính                                                                                                         | Trạng thái V1                  |
| ------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **P0** | Chuẩn bị                                | ADR-0004; đóng băng hợp đồng; bật cờ tính năng `learningModel=v2` (mặc định off)                                       | V1 chạy 100%                   |
| **P1** | **Thêm Track**                          | Bảng `tracks` (additive) + backfill 1 Track/Unit + dual-read                                                           | V1 vẫn đọc Unit                |
| **P2** | **Thêm Mission**                        | Bảng `missions` + `mission_versions` + backfill từ Lesson/LessonVersion; Activity thêm `mission_version_id` (nullable) | V1 vẫn đọc Lesson              |
| **P3** | **Activity = kỹ năng + cầu Vocabulary** | enum `ActivitySkill`; link `activity_vocabulary`; trỏ cây nội dung sang MissionVersion                                 | V1 song song                   |
| **P4** | **Cutover reads**                       | API `/v2` (tracks/missions) + UI Mission-centric + AI generator sinh Mission; bật cờ v2 cho nội bộ → beta              | V1 read còn nhưng "deprecated" |
| **P5** | **Deprecate Lesson/Unit**               | Ngừng ghi Unit/Lesson; đánh dấu deprecated; theo dõi soak                                                              | V1 read-only                   |
| **P6** | **Contract (tương lai, gate riêng)**    | Sau vòng soak an toàn: drop `units`/`lessons`(+version) & endpoint v1; đổi tên enum                                    | V1 gỡ bỏ                       |

**Vì sao thứ tự này an toàn:** cấu trúc mới được **thêm cạnh** cấu trúc cũ và **backfill** từ cũ,
consumers chuyển dần sau cờ tính năng, và **chỉ xoá cũ sau khi mới đã chứng minh** (P6). Không có
thời điểm nào hệ thống "mất" khả năng đọc dữ liệu.

## 6. Trả lời 8 câu hỏi tác động (tổng hợp — chi tiết ở các doc chuyên đề)

| #   | Hạng mục            | Ảnh hưởng                                                                                                                                                                                                                                                         | Mức            | Tài liệu chi tiết                                       |
| --- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------- |
| 1   | **Modules**         | `learning` (nặng), `vocabulary` (cầu nối), `daily-loop` (đổi consumer Lesson→Mission), `ai` (generator sinh Mission), `lib` (pagination dùng chung)                                                                                                               | Cao (learning) | §7 dưới                                                 |
| 2   | **Database**        | +`tracks`,`missions`,`mission_versions`,`mission_dependencies`,`mission_tags`,`mission_objectives`,`activity_vocabulary`; +cột `activity.mission_version_id`,`activity.skill`; +enum `ActivitySkill`, giá trị `PathStepType.mission`; deprecate `units`/`lessons` | Cao            | [DATABASE_MIGRATION_PLAN](./DATABASE_MIGRATION_PLAN.md) |
| 3   | **API**             | +`/v1/tracks`,`/v1/missions` (hoặc `/v2/*`); `activities` chuyển sang mission-scoped; `progress` theo mission; `units`/`lessons` deprecated                                                                                                                       | Cao            | [API_MIGRATION_PLAN](./API_MIGRATION_PLAN.md)           |
| 4   | **Learning Engine** | domain entities (+Track,+Mission, đổi Activity), services (course/lesson→track/mission), repositories, mappers, container; hiện thực Progress theo mission                                                                                                        | Cao            | §7                                                      |
| 5   | **UI**              | `/learn` explorer, `units/[id]`→`tracks/[id]`, `lessons/[id]`→`missions/[id]`, player theo mission, nav                                                                                                                                                           | Trung          | [UI_MIGRATION_PLAN](./UI_MIGRATION_PLAN.md)             |
| 6   | **AI Engine**       | `LessonGeneratorService`→ sinh Mission/Activity; prompt templates + output schema đổi; `ContentValidator` kiểm cấu trúc mission; models/ai_usage_logs **không đổi**                                                                                               | Trung          | §8                                                      |
| 7   | **Authentication**  | **Không đổi cấu trúc** (Supabase/RBAC/middleware). Chỉ thêm permission nội dung: `content.track.*`,`content.mission.*` (và `ai.generate` đã ghi nợ). Prefix route bảo vệ giữ nguyên                                                                               | Thấp           | §9                                                      |
| 8   | **Testing**         | unit (Track/Mission domain + mappers), integration (backfill idempotent + dual-read parity V1↔V2), contract (API v1↔v2), regression (daily loop + SRS **không đổi**), AI golden (sinh đúng schema mission)                                                        | Trung-Cao      | [RISK_ANALYSIS §5](./RISK_ANALYSIS.md)                  |

## 7. Chi tiết Learning Engine (module `src/modules/learning`)

- **domain/entities.ts:** thêm `Track`, `Mission`, `MissionVersion`; `Activity` thêm `skill`;
  giữ `Course`. `Lesson`/`Unit` **giữ lại** (deprecated) tới P6.
- **application/ports.ts + services:** thêm `TrackService`, `MissionService`; `course-service`
  trỏ Track; `lesson-service` → wrapper deprecated gọi `MissionService`; **hiện thực
  `ProgressService`** theo Mission (đóng DEBT-009 trong dòng migration).
- **infrastructure/repositories.ts + mappers.ts:** repo cho tracks/missions/mission_versions; mapper
  mission↔dto; **dual-read** (đọc được cả Lesson cũ và Mission mới trong P1–P4).
- **infrastructure/container.ts:** wire service mới; giữ service cũ sau cờ tính năng.
- **daily-loop:** `LessonSourcePort`/`VocabularyLessonSource` bổ sung khả năng lấy Activity
  `skill=vocabulary` của Mission; **giao diện port giữ nguyên** để daily loop không gãy.

## 8. Chi tiết AI Engine (module `src/modules/ai`)

- `LessonGeneratorService` → sinh **Mission** (tập Activity đa kỹ năng) thay vì Lesson đơn.
- Prompt templates (`config/prompt-templates.ts`): thêm template sinh Mission + per-skill Activity;
  **prompts vẫn là data** (không hard-code).
- `ContentValidator`: thêm luật kiểm cấu trúc Mission (đủ activity, đúng skill, answer-key hợp lệ).
- **Không đổi:** `models.ts`, provider chain, `ai_usage_logs` — độc lập với mô hình nội dung.

## 9. Authentication (khẳng định phạm vi)

- **Không đổi**: Supabase Auth, middleware 2 lớp, `requireUser/requirePermission`, bảng identity/RBAC.
- **Chỉ thêm dữ liệu permission** (seed): `content.track.manage`, `content.mission.manage`,
  `content.mission.publish` — vì RBAC là _data-driven_, đây **không phải** đổi code auth.
- Prefix route bảo vệ (`/learn`,`/dashboard`,…) giữ nguyên; endpoint mới nằm trong `/api/v1` (public
  read) + admin (authoring) như hiện tại.

## 10. Định nghĩa "Migration Done"

- [ ] Toàn bộ P1–P5 đã ship, mỗi phase xanh CI + có rollback đã kiểm thử.
- [ ] V2 (Track/Mission/Activity-skill) phục vụ 100% read của UI + AI; V1 read còn nhưng deprecated.
- [ ] Daily loop + SRS + vocabulary **không có regression** (bằng chứng test).
- [ ] Backfill **idempotent**, parity V1↔V2 được kiểm bằng test.
- [ ] Progress hiện thực theo Mission (DEBT-009 đóng trong dòng này).
- [ ] P6 (drop V1) lên lịch **sau** vòng soak, qua gate riêng — không nằm trong đường tới hạn.
