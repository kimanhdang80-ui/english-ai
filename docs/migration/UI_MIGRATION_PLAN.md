# UI_MIGRATION_PLAN.md — V1 → V2

> **Chỉ kế hoạch — không code.** Thay đổi UI theo mô hình Mission-centric, đằng sau **cờ tính năng**
> `learningModel=v2`. Bám trải nghiệm ở [product/LEARNING_EXPERIENCE](../product/LEARNING_EXPERIENCE.md).
> Liên quan: [API_MIGRATION_PLAN](./API_MIGRATION_PLAN.md), [LEARNING_MODEL_V2](./LEARNING_MODEL_V2.md).

---

## 1. Hiện trạng UI (V1)

| Route/Component                              | Trạng thái  | Vai trò                    |
| -------------------------------------------- | ----------- | -------------------------- |
| `app/(dashboard)/learn/page.tsx`             | placeholder | "explorer" học             |
| `learn/units/[unitId]/page.tsx`              | placeholder | danh sách lesson theo unit |
| `learn/lessons/[lessonId]/page.tsx`          | placeholder | chi tiết lesson            |
| `learn/lessons/[lessonId]/play/page.tsx`     | placeholder | chơi lesson                |
| `learn/today/page.tsx`                       | **thật**    | daily loop (study→quiz)    |
| `components/learn/learning-player-shell.tsx` | shell       | khung player               |
| `components/daily/daily-lesson-player.tsx`   | **thật**    | player daily               |
| `(dashboard)/layout.tsx` NAV                 | thật        | điều hướng                 |

> Phần lớn explorer/unit/lesson là **placeholder** → chi phí đổi thấp; `learn/today` + daily player là
> phần thật cần giữ không gãy.

## 2. Bản đồ route mới

| V1 route                         | V2 route                           | Hành động                                         | Phase |
| -------------------------------- | ---------------------------------- | ------------------------------------------------- | ----- |
| `/learn`                         | `/learn`                           | đổi nội dung: liệt kê **Track → Mission**         | P4    |
| `/learn/units/[unitId]`          | `/learn/tracks/[trackId]`          | route mới; unit route redirect→track (soak)       | P4    |
| `/learn/lessons/[lessonId]`      | `/learn/missions/[missionId]`      | route mới; lesson route redirect→mission          | P4    |
| `/learn/lessons/[lessonId]/play` | `/learn/missions/[missionId]/play` | route mới (Mission player)                        | P4    |
| `/learn/today`                   | `/learn/today`                     | **giữ**; nguồn đổi sang Mission (port giữ nguyên) | P4    |

- **Redirect tạm** từ route cũ → mới trong vòng soak (P4–P6) để link cũ không chết.

## 3. Component đổi / thêm

- **Đổi:** `learning-player-shell` (hỗ trợ Mission gồm nhiều Activity đa kỹ năng); NAV trong
  `layout.tsx` (nhãn "Lessons"→"Missions" nếu có).
- **Thêm:** `TrackList`, `MissionList`, `MissionCard`, `MissionPlayer` (điều phối Activity theo skill:
  tái dùng `flashcard-session` cho `vocabulary`, `quiz-session` cho quiz…).
- **Giữ nguyên (không gãy):** `daily-lesson-player`, `flashcard-session`, `quiz-session`,
  `add-to-learning-button`, toàn bộ vocabulary UI — Mission player **tái dùng** các component này cho
  Activity tương ứng (không rewrite).

## 4. Chiến lược an toàn UI

- **Feature flag** `learningModel=v2`: UI đọc v2 khi bật; mặc định off tới khi API v2 xanh (P4).
- **Không phá daily loop:** `learn/today` chỉ đổi _nguồn dữ liệu_ (Mission có Activity `vocabulary`),
  giữ nguyên component + trải nghiệm đã tinh chỉnh ở [reports/ux-walkthrough](../../reports/ux-walkthrough.md).
- **A11y/UX kế thừa:** giữ các cải tiến đã làm (feedback quiz có chữ + aria-live, "Back to dashboard",
  copy người mới). Mission player phải đạt cùng chuẩn.
- **Empty states:** dùng microcopy tiếng Việt theo [product/MICROCOPY_GUIDE](../product/MICROCOPY_GUIDE.md).

## 5. Thứ tự triển khai UI (trong P4)

1. Thêm route/track/mission list (đọc API v2) sau cờ off → QA nội bộ.
2. Mission player tái dùng session components; kiểm parity với lesson player cũ.
3. Chuyển `learn/today` sang nguồn Mission (port không đổi) → regression daily loop.
4. Bật cờ v2 nội bộ → beta; thêm redirect route cũ→mới.
5. P5: ẩn/deprecate route unit/lesson; P6: xoá sau soak.

## 6. Ảnh hưởng tài liệu UI

- `docs/UI_GUIDELINE.md` (thêm mẫu Mission/Track), `docs/product/LEARNING_EXPERIENCE.md` (đã dùng
  "Mission" — nhất quán). Không đổi design system/tokens.
