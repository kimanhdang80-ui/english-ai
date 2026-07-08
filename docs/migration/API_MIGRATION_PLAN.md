# API_MIGRATION_PLAN.md — V1 → V2

> **Chỉ kế hoạch — không code.** Mọi thay đổi hợp đồng đi qua **API gate** ([PROJECT_OS §5](../PROJECT_OS.md):
> cập nhật spec/`docs/API.md` trước → review consumer → cập nhật docs → mới implement). Giữ **envelope**
> hiện có (`ok/okPage/fail/handleError`, `requestId`, `STATUS_BY_CODE`). Liên quan:
> [LEARNING_MODEL_V2](./LEARNING_MODEL_V2.md), [UI_MIGRATION_PLAN](./UI_MIGRATION_PLAN.md).

---

## 1. Nguyên tắc

- **Additive trước, breaking sau.** Thêm endpoint mới, giữ endpoint cũ chạy → deprecate → xoá (P6).
- **Không đổi envelope/paging/error** — chỉ đổi _resource_ và _cây quan hệ_.
- **Versioning:** đường đọc mission-centric là **thay đổi hình dạng** → đưa dưới **`/api/v1/*` mới
  (tracks/missions)** cho phần thuần thêm; phần **đổi ngữ nghĩa** của `activities` (từ
  `lessonVersionId` sang `missionVersionId`) ship dưới **`/api/v2/activities`** để không phá client cũ.

## 2. Hiện trạng endpoint (V1)

`GET /api/v1/courses`,`/courses/{id}`,`/units`,`/lessons`,`/activities?lessonVersionId`,
`/exercises?activityId`,`/questions?exerciseId`,`POST /progress` (501), + vocabulary endpoints.
Đọc công khai; answer-key không bao giờ trả về (D-0020).

## 3. Bản đồ thay đổi endpoint

| V1                                | V2                                    | Hành động               | Ghi chú                                            |
| --------------------------------- | ------------------------------------- | ----------------------- | -------------------------------------------------- |
| `GET /courses`                    | `GET /courses`                        | **giữ**                 | Có thể thêm `?include=tracks`.                     |
| `GET /units?courseId`             | `GET /tracks?courseId`                | **thêm mới** (P1)       | `units` deprecated (P5), xoá (P6).                 |
| `GET /lessons?unitId`             | `GET /missions?trackId`               | **thêm mới** (P2)       | `lessons` deprecated (P5).                         |
| `GET /lessons?...skill`           | `GET /missions?...&skill`             | thêm filter skill       | skill lọc theo Activity trong mission.             |
| `GET /activities?lessonVersionId` | `GET /v2/activities?missionVersionId` | **/v2 (breaking)** (P3) | v1 `activities` giữ tới P6; trả thêm `skill`.      |
| `GET /exercises?activityId`       | **giữ**                               | không đổi               | cây con không đổi.                                 |
| `GET /questions?exerciseId`       | **giữ**                               | không đổi               | choices only, no answer key.                       |
| `POST /progress` (501)            | `POST /progress` (mission-based)      | **hiện thực** (P4)      | body theo `missionId`/`activityId`; đóng DEBT-009. |
| —                                 | `GET /missions/{id}`                  | **thêm mới** (P2)       | chi tiết mission + activities (skill).             |
| —                                 | `GET /tracks/{id}`                    | **thêm mới** (P1)       | chi tiết track + missions.                         |

## 4. Hợp đồng mới (mô tả, chưa implement)

- **`GET /api/v1/tracks?courseId&status&page&pageSize`** → `okPage(Track[])`.
  `Track = { id, courseId, title, description?, status, sortOrder }`.
- **`GET /api/v1/tracks/{id}`** → `ok(TrackDetail)` gồm `missions: MissionSummary[]`.
- **`GET /api/v1/missions?trackId&status&primarySkillId&skill&page&pageSize`** → `okPage(Mission[])`.
  `Mission = { id, trackId, slug, title, summary?, estimatedMinutes, xpReward, status, sortOrder }`.
- **`GET /api/v1/missions/{id}`** → `ok(MissionDetail)` gồm `activities: Activity[]` với
  `Activity = { id, skill, type, title?, instructions?, sortOrder }` (+ `vocabularyRef` nếu skill=vocabulary).
- **`GET /api/v2/activities?missionVersionId`** → như `activities` cũ nhưng trả thêm `skill`, đọc theo
  `mission_version_id`.
- **`POST /api/v1/progress`** (mission): `{ missionId, activityId?, status, score? }` → `ok(ProgressState)`.

> **Bảo toàn quy tắc:** không trả answer-key; auth như hiện tại (read công khai, ghi tiến độ cần user).

## 5. Cửa sổ deprecation

| Endpoint cũ                      | Bắt đầu deprecate            | Xoá (P6)            | Tín hiệu                                          |
| -------------------------------- | ---------------------------- | ------------------- | ------------------------------------------------- |
| `/units`,`/lessons`              | P5                           | sau soak ≥ 2–4 tuần | header `Deprecation` + `Sunset`; ghi log lượt gọi |
| `/v1/activities?lessonVersionId` | P3 (khi có `/v2/activities`) | P6                  | doc + header cảnh báo                             |

- **Client nội bộ (UI/SDK)** chuyển trong P4; **không có consumer ngoài** (chưa mở API public) →
  rủi ro phá vỡ bên thứ ba ≈ 0. Vẫn giữ cửa sổ để đúng quy trình.

## 6. Tài liệu & OpenAPI

- Cập nhật **`docs/API.md`** + spec trước khi implement (API gate). Đánh dấu endpoint V1 là
  `deprecated 🚫` với ngày sunset; thêm bảng V2.
- Nếu có OpenAPI/SDK sinh tự động (ROADMAP), regenerate sau mỗi phase; SDK giữ cả hai bộ tới P6.

## 7. Ảnh hưởng tới các doc/consumer khác

- `docs/API.md` (bảng learning-engine §), `SYSTEM_ARCHITECTURE.md` (sơ đồ), `specs/**` (nếu có spec
  mission tương lai). Vocabulary endpoints **không đổi**.
