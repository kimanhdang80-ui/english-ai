# MIGRATION_BACKLOG.md — Learning Model V1 → V2

> Bản kế hoạch thực thi (Architecture Migration Sprint · chỉ thiết kế, chưa code). Tổng hợp công
> việc theo **Phase**, kèm ước lượng **số file ảnh hưởng · số migration · mức rủi ro · thời gian**.
> Chi tiết: [docs/migration/](./docs/migration/) — [LEARNING_MODEL_V2](./docs/migration/LEARNING_MODEL_V2.md),
> [DATABASE](./docs/migration/DATABASE_MIGRATION_PLAN.md), [API](./docs/migration/API_MIGRATION_PLAN.md),
> [UI](./docs/migration/UI_MIGRATION_PLAN.md), [ROLLBACK](./docs/migration/ROLLBACK_PLAN.md),
> [RISK](./docs/migration/RISK_ANALYSIS.md).

---

## 0. Tóm tắt điều hành

- **Chiến lược:** Expand → Backfill → Contract, sau **feature flag**, chia 6 phase — backward
  compatible, không big bang, không rewrite, không phá dữ liệu.
- **Rủi ro tổng:** **Trung bình.** Nhẹ hoá vì cây learning-engine V1 gần như trống; nặng nhất ở P2
  (backfill), P3 (skill + cầu vocabulary), P6 (drop — tách gate riêng, tương lai).
- **Đường tới hạn (P1–P5):** ước lượng **~5–8 tuần** (1 kỹ sư), hoặc ~3–5 tuần nếu 2 kỹ sư song song
  một phần. **P6 (contract)** làm sau vòng soak ≥ 2–4 tuần.
- **Tổng file ảnh hưởng (P1–P6):** **~45–60 file** code + **~15–20** tài liệu/spec.
- **Tổng migration:** **~6–7** (4–5 additive trong đường tới hạn; 2 destructive ở P6).

## 1. Ước lượng theo Phase

| Phase  | Tên                                                                                     | File ảnh hưởng (ước)                                                           | Migration   | Rủi ro        | Thời gian (ước)     |
| ------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------- | ------------- | ------------------- |
| **P0** | Chuẩn bị (ADR-0004, cờ, provision DB/staging, CI Postgres)                              | ~6 (env/flag/CI/docs)                                                          | 0           | Thấp          | 3–5 ngày            |
| **P1** | Thêm **Track** (bảng + backfill + dual-read)                                            | ~10 (schema, learning module, api tracks, mapper, test)                        | 1 (M1)      | Thấp          | 4–6 ngày            |
| **P2** | Thêm **Mission** + MissionVersion (+ activity.mission_version_id, deps/tags/objectives) | ~14 (schema, repos, services, api missions, mapper, backfill, test)            | 2 (M2, M2b) | **Trung–Cao** | 8–12 ngày           |
| **P3** | **Activity=skill** + cầu **Vocabulary** (activity_vocabulary)                           | ~10 (schema, activity mapper/service, daily-loop source, test)                 | 1 (M3)      | Trung         | 5–8 ngày            |
| **P4** | **Cutover reads**: API `/v2` + UI Mission-centric + AI generator + Progress             | ~18 (api v2, ui routes/components, ai generator/templates/validator, progress) | 0 (DB)      | **Trung–Cao** | 8–12 ngày           |
| **P5** | **Deprecate** Unit/Lesson (flags, headers, docs)                                        | ~8 (schema comments, api headers, docs)                                        | 1 (M4)      | Thấp          | 2–4 ngày            |
| **P6** | **Contract** (drop V1 + rename enum) — _tương lai, gate riêng_                          | ~10 (schema, api removal, docs)                                                | 2 (M5, M6)  | **Cao**       | 4–6 ngày (sau soak) |

> Ước lượng theo _ngày làm việc lý tưởng_; cộng buffer 20–30% cho review/QA/gate theo Project OS.

## 2. Chi tiết công việc (checklist theo Phase)

### P0 — Chuẩn bị

- [ ] ADR-0004 (mô hình V2 + chiến lược migration) — DB gate mở đầu.
- [ ] Feature flag `learningModel=v2` (mặc định off).
- [ ] **Provision Postgres + staging** (đóng phần DEBT-004) và **Postgres CI + integration test job** (DEBT-012) — _tiền đề bắt buộc_.
- [ ] Đóng băng hợp đồng API/schema mục tiêu (từ các doc migration).

### P1 — Track

- [ ] DB gate M1: ADR/Impact/Migration/Rollback cho `tracks`.
- [ ] `tracks` (additive) + backfill từ `units` (idempotent, `legacy_unit_id`).
- [ ] Learning module: `Track` entity, `TrackService`, repo/mapper; container wire (sau cờ).
- [ ] API `GET /tracks`, `/tracks/{id}` (giữ `/units`).
- [ ] Test: unit (mapper/service), integration (backfill parity units↔tracks), rollback drill.

### P2 — Mission

- [ ] DB gate M2/M2b.
- [ ] `missions`,`mission_versions`,`mission_dependencies/tags/objectives`; `activities.mission_version_id` (nullable).
- [ ] Backfill lessons→missions, lesson_versions→mission_versions, deps/tags/objectives; set current_version.
- [ ] `MissionService` (+ Progress theo mission — đóng DEBT-009 mức tối thiểu); `lesson-service`→wrapper deprecated.
- [ ] API `GET /missions`,`/missions/{id}`.
- [ ] Test: parity lessons↔missions, version parity, idempotent backfill; regression.

### P3 — Activity = skill + cầu Vocabulary

- [ ] DB gate M3.
- [ ] enum `ActivitySkill`; `activities.skill`; `activity_vocabulary` link.
- [ ] Backfill suy luận `skill` (+ cờ review thủ công); daily-loop source lấy activity vocabulary của mission.
- [ ] Test: **regression daily loop + SRS (không đổi)**; link vocab không đụng user_vocabulary.

### P4 — Cutover reads

- [ ] API `/v2/activities?missionVersionId`; hiện thực `POST /progress` (mission).
- [ ] UI: `/learn` (track→mission), `tracks/[id]`, `missions/[id]`, `missions/[id]/play`; `learn/today` đổi nguồn; redirect route cũ.
- [ ] AI: `LessonGeneratorService`→Mission; prompt templates mission; ContentValidator mission luật.
- [ ] Bật cờ v2 nội bộ→beta. Test: contract v1↔v2, AI golden, regression, redirect.

### P5 — Deprecate

- [ ] DB gate M4 (flags/comments). Header `Deprecation`/`Sunset` cho `/units`,`/lessons`.
- [ ] Ngừng ghi Unit/Lesson; cờ v2 mặc định on; theo dõi log lượt gọi V1 = 0.

### P6 — Contract (tương lai, gate riêng)

- [ ] Điều kiện: v2 ổn ≥ 2–4 tuần, parity xanh, 0 lượt gọi V1, backup+restore diễn tập, ADR contract duyệt.
- [ ] DB gate M5/M6: drop lesson_*/units/lessons + `activities.lesson_version_id`; rename `CourseTrack→ProductLine`.

## 3. Tổng hợp ước lượng

| Chỉ số                              | Giá trị (ước)                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **File code ảnh hưởng**             | ~45–60 (learning ~14, api ~10, ui ~12, ai ~5, daily-loop ~3, lib/shared ~2, tests ~10+)                |
| **File tài liệu/spec**              | ~15–20 (API.md, DATABASE.md, SYSTEM_ARCHITECTURE.md, DECISIONS.md, ADR-0004…, specs mission tương lai) |
| **Số migration**                    | ~6–7 (M1, M2, M2b, M3, M4 additive · M5, M6 destructive ở P6)                                          |
| **Số ADR mới**                      | ≥2 (ADR-0004 mô hình/chiến lược; ADR-0005 contract/drop ở P6)                                          |
| **Mức rủi ro tổng**                 | Trung bình (P2/P3/P4 nóng; P6 cao — cô lập)                                                            |
| **Thời gian đường tới hạn (P1–P5)** | ~5–8 tuần (1 kỹ sư) + buffer 20–30%                                                                    |
| **Thời gian P6**                    | ~1 tuần, sau soak ≥ 2–4 tuần                                                                           |
| **Nợ kỹ thuật đóng kèm**            | DEBT-009 (Progress), một phần DEBT-004/012 (DB+CI), tiền đề cho DEBT-014 (AI sinh mission)             |

## 4. Phụ thuộc & thứ tự bắt buộc

1. **P0 trước tất cả** — không backfill/verify được nếu chưa có DB + CI Postgres (DEBT-004/012).
2. P1 → P2 → P3 tuyến tính (Mission cần Track; skill/bridge cần Activity dưới Mission).
3. P4 chỉ sau khi P1–P3 xanh + backfill parity đạt.
4. **P6 tuyệt đối sau soak** — không nằm trong đường tới hạn ra mắt v2.

## 5. Không làm trong migration này (chống scope creep)

- Authoring UI đầy đủ cho Track/Mission (chỉ đủ để tạo/seed nội dung thử).
- Gamification/streak/achievement mới (đã có bản thiết kế sản phẩm riêng ở `docs/product/`).
- Grammar/Listening/Reading/Speaking **nội dung thật** — V2 chỉ mở _khung_ Activity cho chúng.
- Đổi tên enum `CourseTrack` (hoãn tới P6).

---

**Kết luận:** Đây là một migration **an toàn để thực hiện sớm** — cấu trúc mới thêm cạnh cấu trúc cũ,
backfill từ dữ liệu (gần như trống) của learning-engine, dữ liệu học thật (vocabulary/SRS) không bị
tái cấu trúc, và mọi bước revert được bằng feature flag cho tới P6. Khuyến nghị khởi động **P0 ngay
sau khi provision database** (vốn đã là blocker beta độc lập).
