USE crm_bim;

-- 1. Add attachment_url to activities
ALTER TABLE activities ADD COLUMN attachment_url VARCHAR(255) NULL AFTER result;

-- 2. Clear old products
DELETE FROM products;

-- 3. Reset auto increment
ALTER TABLE products AUTO_INCREMENT = 1;

-- 4. Insert new GreenDS Products
INSERT INTO products (name, product_group, ref_price, description) VALUES
-- NHÓM 1 — SẢN PHẨM BIM/CAD CHỦ LỰC
('ARCHICAD', 'bim_chu_luc', 0, 'Sản phẩm chủ lực — phần mềm BIM cho kiến trúc sư, kỹ sư. Hỗ trợ thiết kế 3D, cộng tác nhóm, lập hồ sơ.'),
('Allplan', 'bim_chu_luc', 0, 'Phần mềm BIM của Đức (Nemetschek). Bao phủ concept đến thi công. Thế mạnh: hạ tầng, công trình dân dụng nặng.'),
('ZWCAD', 'bim_chu_luc', 0, 'Giải pháp CAD 2D/3D, tương thích định dạng DWG. Phù hợp khách cần vẽ CAD cơ bản, chi phí thấp.'),

-- NHÓM 2 — ADD-IN MỞ RỘNG CHO ARCHICAD
('CI Tools', 'add_in', 0, 'Bộ add-in tăng năng suất: mô hình hóa, lập hồ sơ, bóc tách khối lượng, cửa sổ/cửa đi tự động.'),
('EPTAR', 'add_in', 0, 'Plugin Reinforcement (cốt thép bê tông) và ArchiTerra (mô hình hóa địa hình 3D).'),

-- NHÓM 3 — NỀN TẢNG CỘNG TÁC ĐỘC LẬP
('BIMcloud', 'cong_tac', 0, 'Nền tảng cộng tác đám mây của Graphisoft — làm việc nhóm thời gian thực (on-premise/cloud).'),
('Catenda', 'cong_tac', 0, 'Nền tảng web quản lý toàn bộ vòng đời dự án (thiết kế → vận hành) qua chuẩn IFC/BCF.'),

-- NHÓM 4 — PHẦN MỀM CHUYÊN DỤNG ĐỘC LẬP
('Solibri Model Checker', 'chuyen_dung', 0, 'Kiểm tra chất lượng mô hình BIM, phát hiện xung đột, tiết kiệm chi phí xây dựng.'),
('Enscape', 'chuyen_dung', 0, 'Render thời gian thực và VR. Tích hợp Archicad, Rhino, SketchUp, Revit...'),
('D5 Render', 'chuyen_dung', 0, 'Render thời gian thực (ray tracing). Kết nối Archicad, 3ds Max, Blender...'),
('Bluebeam', 'chuyen_dung', 0, 'Ghi chú PDF và cộng tác số cho ngành AECO — đồng bộ, lưu trữ dữ liệu tại công trường.'),
('GEO5', 'chuyen_dung', 0, 'Bộ phần mềm địa kỹ thuật, >20 mô-đun: phân tích ổn định, tường chắn, móng, độ lún.');
