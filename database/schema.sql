DROP DATABASE IF EXISTS crm_bim;
-- ============================================
-- CRM Quản Lý Deal BIM - MySQL Schema
-- Import vào phpMyAdmin để tạo CSDL
-- ============================================

CREATE DATABASE IF NOT EXISTS crm_bim CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crm_bim;

-- ============================================
-- Bảng Sản phẩm (Products)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    product_group ENUM('bim_chu_luc','add_in','cong_tac','chuyen_dung') NOT NULL DEFAULT 'bim_chu_luc',
    ref_price DECIMAL(15,0) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Bảng Khách hàng (Contacts)
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    company VARCHAR(200),
    phone VARCHAR(20),
    email VARCHAR(100),
    org_type ENUM('KTS_doc_lap','cong_ty_vua','tong_thau','chu_dau_tu','co_quan_nha_nuoc','khac') NOT NULL DEFAULT 'khac',
    bim_maturity ENUM('0_chua_biet','1_nghe_qua','2_dang_tim_hieu','3_dang_dung','4_chuyen_sau') NOT NULL DEFAULT '0_chua_biet',
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Bảng Cơ hội bán hàng (Deals)
-- ============================================
CREATE TABLE IF NOT EXISTS deals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    contact_id INT NOT NULL,
    estimated_value DECIMAL(15,0) DEFAULT 0,
    stage TINYINT NOT NULL DEFAULT 1 COMMENT '1=Mới, 2=Khảo sát, 3=Đề xuất, 4=Demo, 5=Báo giá, 6=Đàm phán, 7=Chốt',
    status ENUM('open','won','lost') NOT NULL DEFAULT 'open',
    next_followup_date DATE,
    probability TINYINT DEFAULT 10 COMMENT 'Xác suất chốt 0-100%',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Bảng Chi tiết Sản phẩm trong Deal (Deal_Products)
-- ============================================
CREATE TABLE IF NOT EXISTS deal_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    deal_id INT NOT NULL,
    product_id INT NOT NULL,
    price DECIMAL(15,0) DEFAULT 0,
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Bảng Hoạt động (Activities)
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    deal_id INT,
    contact_id INT NOT NULL,
    activity_type ENUM('goi_dien','gap_mat','demo','gui_bao_gia','email','zalo','khac') NOT NULL DEFAULT 'khac',
    activity_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    content TEXT NOT NULL,
    result TEXT COMMENT 'Kết quả cuộc trao đổi',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Bảng Nhắc việc (Followups)
-- ============================================
CREATE TABLE IF NOT EXISTS followups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    deal_id INT,
    contact_id INT NOT NULL,
    due_date DATE NOT NULL,
    content TEXT NOT NULL,
    status ENUM('pending','done','overdue') NOT NULL DEFAULT 'pending',
    priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Dữ liệu mẫu - Sản phẩm
-- ============================================
INSERT INTO products (name, product_group, ref_price, description) VALUES
('ArchiCAD 27', 'bim_chu_luc', 45000000, 'Phần mềm BIM thiết kế kiến trúc hàng đầu của Graphisoft'),
('Solibri Model Checker', 'cong_tac', 35000000, 'Kiểm tra chất lượng mô hình BIM, phát hiện xung đột'),
('GEO5', 'chuyen_dung', 28000000, 'Phần mềm địa kỹ thuật - thiết kế móng, tường chắn'),
('BIMx', 'add_in', 8000000, 'Xem mô hình BIM 3D trên mobile/tablet'),
('ARCHICAD BIMcloud', 'cong_tac', 60000000, 'Nền tảng cộng tác BIM theo thời gian thực'),
('EcoDesigner STAR', 'add_in', 15000000, 'Phân tích năng lượng tòa nhà tích hợp ArchiCAD'),
('MEP Modeler', 'add_in', 22000000, 'Thiết kế hệ thống M&E tích hợp trong ArchiCAD'),
('Solibri Office', 'cong_tac', 25000000, 'Quản lý và theo dõi tuân thủ quy chuẩn BIM');

-- ============================================
-- Dữ liệu mẫu - Khách hàng
-- ============================================
INSERT INTO contacts (name, company, phone, email, org_type, bim_maturity, notes) VALUES
('Nguyễn Văn Minh', 'Công ty CP Kiến trúc Xanh', '0901234567', 'minh.nguyen@kientrucxanh.vn', 'cong_ty_vua', '2_dang_tim_hieu', 'Đang nghiên cứu chuyển đổi từ AutoCAD sang BIM. Quan tâm ArchiCAD.'),
('Trần Thị Lan', 'Tổng công ty Xây dựng Số 1', '0912345678', 'lan.tran@xaydungso1.vn', 'tong_thau', '3_dang_dung', 'Đã dùng Revit, muốn so sánh với ArchiCAD. Dự án 5000 tỷ.'),
('Lê Hoàng Phúc', 'Văn phòng KTS Phúc', '0923456789', 'phuc.le@ktsphuc.com', 'KTS_doc_lap', '1_nghe_qua', 'KTS tự do, thiết kế nhà dân dụng, muốn nâng cấp workflow.'),
('Phạm Quốc Hùng', 'Ban QLDA Đô thị TP.HCM', '0934567890', 'hung.pham@bqlda.hochiminhcity.gov.vn', 'co_quan_nha_nuoc', '0_chua_biet', 'Đơn vị quản lý nhà nước, đang tìm giải pháp kiểm soát chất lượng BIM.'),
('Đỗ Thị Hương', 'Công ty TNHH Thiết kế MEP', '0945678901', 'huong.do@mep-design.vn', 'cong_ty_vua', '3_dang_dung', 'Chuyên thiết kế MEP, quan tâm MEP Modeler và BIMcloud.'),
('Vũ Đình Trường', 'Tập đoàn Địa ốc Bình Dương', '0956789012', 'truong.vu@bdrealty.vn', 'chu_dau_tu', '1_nghe_qua', 'Chủ đầu tư dự án lớn, muốn yêu cầu nhà thầu nộp mô hình BIM.');

-- ============================================
-- Dữ liệu mẫu - Deals
-- ============================================
INSERT INTO deals (title, contact_id, product_id, estimated_value, stage, status, next_followup_date, probability, notes) VALUES
('ArchiCAD 27 - Kiến trúc Xanh (5 license)', 1, 1, 225000000, 3, 'open', DATE_ADD(CURDATE(), INTERVAL 3 DAY), 40, 'Đã demo lần 1, khách hàng hài lòng. Cần gửi báo giá chi tiết.'),
('Solibri - Tổng công ty XD Số 1', 2, 2, 35000000, 5, 'open', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 70, 'Đã gửi báo giá. Đang chờ phê duyệt nội bộ. Cần follow-up gấp.'),
('ArchiCAD - KTS Phúc (1 license)', 3, 1, 45000000, 2, 'open', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 25, 'Khách hàng đang tìm hiểu. Cần hẹn demo.'),
('Solibri - Ban QLDA Đô thị', 4, 2, 105000000, 1, 'open', DATE_ADD(CURDATE(), INTERVAL 14 DAY), 15, 'Mới tiếp cận qua hội thảo BIM. Cần khảo sát nhu cầu.'),
('MEP Modeler + BIMcloud - MEP Design', 5, 7, 82000000, 4, 'open', CURDATE(), 55, 'Demo đã lên lịch hôm nay! Quan trọng.'),
('ArchiCAD + EcoDesigner - Tập đoàn BĐS BD', 6, 6, 180000000, 6, 'open', DATE_ADD(CURDATE(), INTERVAL 2 DAY), 80, 'Đang đàm phán giá. Khách muốn mua gói cho 8 người dùng.');

-- ============================================
-- Dữ liệu mẫu - Activities
-- ============================================
INSERT INTO activities (deal_id, contact_id, activity_type, activity_date, content, result) VALUES
(1, 1, 'gap_mat', DATE_SUB(NOW(), INTERVAL 7 DAY), 'Gặp mặt lần đầu tại văn phòng khách hàng. Giới thiệu tổng quan ArchiCAD 27.', 'Khách hàng rất quan tâm, yêu cầu demo chi tiết workflow thiết kế nhà phố.'),
(1, 1, 'demo', DATE_SUB(NOW(), INTERVAL 3 DAY), 'Demo ArchiCAD 27 - workflow thiết kế và xuất bản vẽ 2D/3D.', 'Demo thành công. Khách hấn tượng tính năng GDL và quản lý layer. Yêu cầu báo giá.'),
(2, 2, 'goi_dien', DATE_SUB(NOW(), INTERVAL 5 DAY), 'Gọi điện giới thiệu Solibri Model Checker cho công trình đang triển khai.', 'Khách hàng có dự án cần kiểm tra IFC. Hẹn gặp.'),
(2, 2, 'gap_mat', DATE_SUB(NOW(), INTERVAL 2 DAY), 'Gặp mặt trực tiếp, giới thiệu Solibri. Chạy demo với file IFC của dự án thực tế.', 'Ấn tượng mạnh. Yêu cầu báo giá cho 2 license.'),
(2, 2, 'gui_bao_gia', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Gửi báo giá chính thức Solibri 2 license qua email.', 'Khách confirm nhận. Đang trình lãnh đạo.'),
(5, 5, 'goi_dien', DATE_SUB(NOW(), INTERVAL 4 DAY), 'Gọi điện tư vấn MEP Modeler cho workflow thiết kế M&E.', 'Khách có nhu cầu rõ ràng. Hẹn demo tuần tới.'),
(6, 6, 'gap_mat', DATE_SUB(NOW(), INTERVAL 10 DAY), 'Gặp mặt giám đốc kỹ thuật, trình bày giải pháp BIM tổng thể.', 'Deal lớn. Khách muốn ArchiCAD + EcoDesigner cho đội KTS 8 người.'),
(6, 6, 'gui_bao_gia', DATE_SUB(NOW(), INTERVAL 6 DAY), 'Gửi báo giá gói 8 license ArchiCAD + EcoDesigner.', 'Khách phản hồi muốn giảm giá ~15%.'),
(6, 6, 'goi_dien', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Gọi điện đàm phán giá. Đề xuất phương án trả góp.', 'Đang chờ quyết định cuối. Cần gặp mặt chốt trong 3 ngày tới.');

-- ============================================
-- Dữ liệu mẫu - Followups
-- ============================================
INSERT INTO followups (deal_id, contact_id, due_date, content, status, priority) VALUES
(2, 2, CURDATE(), 'Gọi điện hỏi thăm tình trạng phê duyệt báo giá Solibri. Deal 70% xác suất chốt!', 'pending', 'high'),
(5, 5, CURDATE(), 'Demo MEP Modeler theo lịch đã hẹn. Chuẩn bị file demo M&E thực tế.', 'pending', 'high'),
(6, 6, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'Gặp mặt chốt deal ArchiCAD + EcoDesigner. Chuẩn bị hợp đồng và phương án trả góp.', 'pending', 'high'),
(1, 1, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'Gửi báo giá chi tiết 5 license ArchiCAD 27 kèm gói training.', 'pending', 'medium'),
(3, 3, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'Hẹn lịch demo ArchiCAD cho KTS Phúc. Nhắn qua Zalo.', 'pending', 'medium'),
(4, 4, DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'Gửi tài liệu giới thiệu Solibri và case study dự án công trình công.', 'pending', 'low'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Follow-up sau demo - hỏi phản hồi. (Quá hạn!)', 'overdue', 'high');
