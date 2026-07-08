# ROLLBACK_PLAN.md — V1 → V2

> **Chỉ kế hoạch.** Mỗi phase phải **revert được độc lập** mà không mất dữ liệu. Nguyên tắc:
> vì migration là **additive + backfill**, rollback phần lớn = **tắt cờ + bỏ qua bảng mới**; chỉ P6
> (destructive) mới cần khôi phục từ backup. Liên quan: [DATABASE_MIGRATION_PLAN](./DATABASE_MIGRATION_PLAN.md),
> [RISK_ANALYSIS](./RISK_ANALYSIS.md).

---

## 1. Cơ chế an toàn xuyên suốt

- **Feature flag `learningModel=v2`** (mặc định off): rollback tức thời ở tầng ứng dụng = tắt cờ →
  UI/API/AI quay lại đọc V1. Không cần đụng DB.
- **Cột `legacy_*_id`** trên bảng mới: cho phép đối chiếu & xoá đúng dữ liệu đã backfill khi revert.
- **Bảng cũ giữ nguyên** tới P6 → luôn có nguồn V1 để quay về.
- **Backup trước mọi migration destructive** (chỉ P6) + kiểm thử restore trên staging.

## 2. Rollback theo Phase

| Phase                                                                       | Cách revert                                                                                  | Mất dữ liệu?                               | Ghi chú                                                              |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------- |
| **P0** (cờ, ADR)                                                            | Tắt cờ; không có DDL                                                                         | Không                                      | Chỉ cấu hình.                                                        |
| **P1** (`tracks`)                                                           | Tắt cờ v2; (tuỳ) `DROP TABLE tracks` (mới, chỉ chứa dữ liệu backfill từ units)               | Không (units còn nguyên)                   | Có thể để bảng lại vô hại.                                           |
| **P2** (`missions`,`mission_versions`, cột `activities.mission_version_id`) | Tắt cờ; ngừng dual-write; drop bảng mới + set cột null. Nguồn sự thật lại là lessons         | Không (lessons/lesson_versions còn nguyên) | Nếu đã dual-write, đối chiếu để không mất nội dung mới tạo (xem §3). |
| **P3** (`activity.skill`,`activity_vocabulary`)                             | Tắt cờ; drop link table + cột skill. `vocabularies`/SRS **không đụng** nên an toàn tuyệt đối | Không                                      | Cầu vocabulary chỉ là đường vào phụ.                                 |
| **P4** (cutover reads)                                                      | Tắt cờ v2 → UI/API/AI về V1 tức thì                                                          | Không                                      | Revert thuần ứng dụng.                                               |
| **P5** (deprecate)                                                          | Bỏ cờ deprecated; mở lại ghi V1                                                              | Không                                      | V1 vẫn tồn tại.                                                      |
| **P6** (drop V1)                                                            | **Chỉ khôi phục từ backup** (đã destructive)                                                 | Có nếu không backup                        | Vì vậy P6 tách gate riêng, sau soak, có backup + test restore.       |

## 3. Xử lý "dữ liệu tạo mới sau khi cutover" khi phải rollback về V1

- Rủi ro thật sự duy nhất: sau P4, nếu **nội dung mới được tạo chỉ trên Mission** rồi phải quay về V1.
- **Giảm nhẹ:** trong P2–P4 giữ **backfill hai chiều** (mission→lesson) hoặc **freeze authoring** trong
  giai đoạn cutover ngắn; do learning-engine gần như trống và chưa mở authoring public, cửa sổ này rủi ro thấp.
- Nếu cần: script "reverse backfill" dùng `legacy_lesson_id` để tái tạo Lesson từ Mission.

## 4. Điểm không thể quay lui (points of no return)

- Chỉ ở **P6** (drop bảng cũ). Trước P6, **mọi thứ đều revert được bằng cờ**.
- Điều kiện vào P6 (checklist): v2 chạy ổn ≥ 2–4 tuần, parity test xanh, 0 lượt gọi endpoint V1 trong
  log, backup + restore đã diễn tập, ADR contract được duyệt.

## 5. Tiêu chí kích hoạt rollback (rollback triggers)

- Regression daily loop/SRS (bất kỳ) → rollback P3/P4 ngay (tắt cờ).
- Sai lệch parity backfill > ngưỡng (vd > 0 bản ghi lệch) → dừng, sửa backfill, không tiến phase.
- Lỗi 5xx tăng trên endpoint mission/track > ngưỡng → tắt cờ v2.
- P6: bất kỳ nghi ngờ mất dữ liệu → dừng, restore backup.

## 6. Kiểm thử rollback (bắt buộc trước mỗi phase)

- Diễn tập tắt/bật cờ trên staging; xác nhận V1 hoạt động sau tắt cờ.
- Với P1–P3: chạy migration → backfill → **revert** (drop bảng mới) trên staging, xác nhận V1 nguyên vẹn.
- Với P6: full backup → drop → restore → đối chiếu số bản ghi.
