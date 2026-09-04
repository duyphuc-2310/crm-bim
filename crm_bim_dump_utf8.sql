-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: crm_bim
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activities`
--

DROP TABLE IF EXISTS `activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `deal_id` int(11) DEFAULT NULL,
  `contact_id` int(11) NOT NULL,
  `activity_type` enum('goi_dien','gap_mat','demo','gui_bao_gia','email','zalo','khac') NOT NULL DEFAULT 'khac',
  `activity_date` datetime NOT NULL DEFAULT current_timestamp(),
  `content` text NOT NULL,
  `result` text DEFAULT NULL COMMENT 'Kết quả cuộc trao đổi',
  `attachment_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `deal_id` (`deal_id`),
  KEY `contact_id` (`contact_id`),
  CONSTRAINT `activities_ibfk_1` FOREIGN KEY (`deal_id`) REFERENCES `deals` (`id`) ON DELETE CASCADE,
  CONSTRAINT `activities_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activities`
--

LOCK TABLES `activities` WRITE;
/*!40000 ALTER TABLE `activities` DISABLE KEYS */;
INSERT INTO `activities` VALUES (1,1,1,'gap_mat','2026-08-27 14:11:46','Gặp mặt lần đầu tại văn phòng khách hàng. Giới thiệu tổng quan ArchiCAD 27.','Khách hàng rất quan tâm, yêu cầu demo chi tiết workflow thiết kế nhà phố.',NULL,'2026-09-03 07:11:46'),(2,1,1,'demo','2026-08-31 14:11:46','Demo ArchiCAD 27 - workflow thiết kế và xuất bản vẽ 2D/3D.','Demo thành công. Khách hấn tượng tính năng GDL và quản lý layer. Yêu cầu báo giá.',NULL,'2026-09-03 07:11:46'),(3,2,2,'goi_dien','2026-08-29 14:11:46','Gọi điện giới thiệu Solibri Model Checker cho công trình đang triển khai.','Khách hàng có dự án cần kiểm tra IFC. Hẹn gặp.',NULL,'2026-09-03 07:11:46'),(4,2,2,'gap_mat','2026-09-01 14:11:46','Gặp mặt trực tiếp, giới thiệu Solibri. Chạy demo với file IFC của dự án thực tế.','Ấn tượng mạnh. Yêu cầu báo giá cho 2 license.',NULL,'2026-09-03 07:11:46'),(5,2,2,'gui_bao_gia','2026-09-02 14:11:46','Gửi báo giá chính thức Solibri 2 license qua email.','Khách confirm nhận. Đang trình lãnh đạo.',NULL,'2026-09-03 07:11:46'),(6,5,5,'goi_dien','2026-08-30 14:11:46','Gọi điện tư vấn MEP Modeler cho workflow thiết kế M&E.','Khách có nhu cầu rõ ràng. Hẹn demo tuần tới.',NULL,'2026-09-03 07:11:46'),(7,6,6,'gap_mat','2026-08-24 14:11:46','Gặp mặt giám đốc kỹ thuật, trình bày giải pháp BIM tổng thể.','Deal lớn. Khách muốn ArchiCAD + EcoDesigner cho đội KTS 8 người.',NULL,'2026-09-03 07:11:46'),(8,6,6,'gui_bao_gia','2026-08-28 14:11:46','Gửi báo giá gói 8 license ArchiCAD + EcoDesigner.','Khách phản hồi muốn giảm giá ~15%.',NULL,'2026-09-03 07:11:46'),(9,6,6,'goi_dien','2026-09-02 14:11:46','Gọi điện đàm phán giá. Đề xuất phương án trả góp.','Đang chờ quyết định cuối. Cần gặp mặt chốt trong 3 ngày tới.',NULL,'2026-09-03 07:11:46');
/*!40000 ALTER TABLE `activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `company` varchar(200) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `org_type` enum('kts_doc_lap','cty_thiet_ke','cong_ty_vua','tong_thau','chu_dau_tu','co_quan_nha_nuoc','khac') NOT NULL DEFAULT 'khac',
  `bim_maturity` enum('0_chua_biet','1_nghe_qua','2_dang_tim_hieu','3_dang_dung','4_chuyen_sau') NOT NULL DEFAULT '0_chua_biet',
  `address` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
INSERT INTO `contacts` VALUES (1,'Nguyễn Văn Minh','Công ty CP Kiến trúc Xanh','0901234567','minh.nguyen@kientrucxanh.vn','cong_ty_vua','2_dang_tim_hieu',NULL,'Đang nghiên cứu chuyển đổi từ AutoCAD sang BIM. Quan tâm ArchiCAD.','2026-09-03 07:11:46','2026-09-03 07:11:46'),(2,'Trần Thị Lan','Tổng công ty Xây dựng Số 1','0912345678','lan.tran@xaydungso1.vn','tong_thau','3_dang_dung',NULL,'Đã dùng Revit, muốn so sánh với ArchiCAD. Dự án 5000 tỷ.','2026-09-03 07:11:46','2026-09-03 07:11:46'),(3,'Lê Hoàng Phúc','Văn phòng KTS Phúc','0923456789','phuc.le@ktsphuc.com','kts_doc_lap','1_nghe_qua',NULL,'KTS tự do, thiết kế nhà dân dụng, muốn nâng cấp workflow.','2026-09-03 07:11:46','2026-09-03 07:11:46'),(4,'Phạm Quốc Hùng','Ban QLDA Đô thị TP.HCM','0934567890','hung.pham@bqlda.hochiminhcity.gov.vn','co_quan_nha_nuoc','0_chua_biet',NULL,'Đơn vị quản lý nhà nước, đang tìm giải pháp kiểm soát chất lượng BIM.','2026-09-03 07:11:46','2026-09-03 07:11:46'),(5,'Đỗ Thị Hương','Công ty TNHH Thiết kế MEP','0945678901','huong.do@mep-design.vn','cong_ty_vua','3_dang_dung',NULL,'Chuyên thiết kế MEP, quan tâm MEP Modeler và BIMcloud.','2026-09-03 07:11:46','2026-09-03 07:11:46'),(6,'Vũ Đình Trường','Tập đoàn Địa ốc Bình Dương','0956789012','truong.vu@bdrealty.vn','chu_dau_tu','1_nghe_qua',NULL,'Chủ đầu tư dự án lớn, muốn yêu cầu nhà thầu nộp mô hình BIM.','2026-09-03 07:11:46','2026-09-03 07:11:46'),(7,'Võ Duy Phúc','Công ty kiến trúc','0974450423','phucvod@gmail.com','tong_thau','0_chua_biet','','','2026-09-03 07:14:02','2026-09-03 07:14:02');
/*!40000 ALTER TABLE `contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deals`
--

DROP TABLE IF EXISTS `deals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `contact_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `estimated_value` decimal(15,0) DEFAULT 0,
  `stage` tinyint(4) NOT NULL DEFAULT 1 COMMENT '1=Mới, 2=Khảo sát, 3=Đề xuất, 4=Demo, 5=Báo giá, 6=Đàm phán, 7=Chốt',
  `status` enum('open','won','lost') NOT NULL DEFAULT 'open',
  `next_followup_date` date DEFAULT NULL,
  `probability` tinyint(4) DEFAULT 10 COMMENT 'Xác suất chốt 0-100%',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `contact_id` (`contact_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `deals_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `deals_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deals`
--

LOCK TABLES `deals` WRITE;
/*!40000 ALTER TABLE `deals` DISABLE KEYS */;
INSERT INTO `deals` VALUES (1,'ArchiCAD 27 - Kiến trúc Xanh (5 license)',1,NULL,225000000,3,'open','2026-09-06',40,'Đã demo lần 1, khách hàng hài lòng. Cần gửi báo giá chi tiết.','2026-09-03 07:11:46','2026-09-03 07:32:55'),(2,'Solibri - Tổng công ty XD Số 1',2,NULL,35000000,5,'open','2026-09-04',70,'Đã gửi báo giá. Đang chờ phê duyệt nội bộ. Cần follow-up gấp.','2026-09-03 07:11:46','2026-09-03 07:11:46'),(3,'ArchiCAD - KTS Phúc (1 license)',3,NULL,45000000,2,'open','2026-09-10',25,'Khách hàng đang tìm hiểu. Cần hẹn demo.','2026-09-03 07:11:46','2026-09-03 07:11:46'),(4,'Solibri - Ban QLDA Đô thị',4,NULL,105000000,1,'open','2026-09-17',15,'Mới tiếp cận qua hội thảo BIM. Cần khảo sát nhu cầu.','2026-09-03 07:11:46','2026-09-03 07:11:46'),(5,'MEP Modeler + BIMcloud - MEP Design',5,NULL,82000000,4,'open','2026-09-03',55,'Demo đã lên lịch hôm nay! Quan trọng.','2026-09-03 07:11:46','2026-09-03 07:11:46'),(6,'ArchiCAD + EcoDesigner - Tập đoàn BĐS BD',6,NULL,180000000,6,'open','2026-09-05',80,'Đang đàm phán giá. Khách muốn mua gói cho 8 người dùng.','2026-09-03 07:11:46','2026-09-03 07:11:46');
/*!40000 ALTER TABLE `deals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `followups`
--

DROP TABLE IF EXISTS `followups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `followups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `deal_id` int(11) DEFAULT NULL,
  `contact_id` int(11) NOT NULL,
  `due_date` date NOT NULL,
  `content` text NOT NULL,
  `status` enum('pending','done','overdue') NOT NULL DEFAULT 'pending',
  `priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `deal_id` (`deal_id`),
  KEY `contact_id` (`contact_id`),
  CONSTRAINT `followups_ibfk_1` FOREIGN KEY (`deal_id`) REFERENCES `deals` (`id`) ON DELETE CASCADE,
  CONSTRAINT `followups_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `followups`
--

LOCK TABLES `followups` WRITE;
/*!40000 ALTER TABLE `followups` DISABLE KEYS */;
INSERT INTO `followups` VALUES (1,2,2,'2026-09-03','Gọi điện hỏi thăm tình trạng phê duyệt báo giá Solibri. Deal 70% xác suất chốt!','pending','high','2026-09-03 07:11:46','2026-09-03 07:11:46'),(2,5,5,'2026-09-03','Demo MEP Modeler theo lịch đã hẹn. Chuẩn bị file demo M&E thực tế.','pending','high','2026-09-03 07:11:46','2026-09-03 07:11:46'),(3,6,6,'2026-09-05','Gặp mặt chốt deal ArchiCAD + EcoDesigner. Chuẩn bị hợp đồng và phương án trả góp.','pending','high','2026-09-03 07:11:46','2026-09-03 07:11:46'),(4,1,1,'2026-09-06','Gửi báo giá chi tiết 5 license ArchiCAD 27 kèm gói training.','pending','medium','2026-09-03 07:11:46','2026-09-03 07:11:46'),(5,3,3,'2026-09-10','Hẹn lịch demo ArchiCAD cho KTS Phúc. Nhắn qua Zalo.','pending','medium','2026-09-03 07:11:46','2026-09-03 07:11:46'),(6,4,4,'2026-09-17','Gửi tài liệu giới thiệu Solibri và case study dự án công trình công.','pending','low','2026-09-03 07:11:46','2026-09-03 07:11:46'),(7,1,1,'2026-09-02','Follow-up sau demo - hỏi phản hồi. (Quá hạn!)','done','high','2026-09-03 07:11:46','2026-09-03 07:15:17');
/*!40000 ALTER TABLE `followups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `product_group` enum('bim_chu_luc','add_in','cong_tac','chuyen_dung') NOT NULL DEFAULT 'bim_chu_luc',
  `ref_price` decimal(15,0) DEFAULT 0,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'ARCHICAD','bim_chu_luc',0,'Sản phẩm chủ lực — phần mềm BIM cho kiến trúc sư, kỹ sư. Hỗ trợ thiết kế 3D, cộng tác nhóm, lập hồ sơ.','2026-09-03 07:33:07','2026-09-03 07:33:07'),(2,'Allplan','bim_chu_luc',0,'Phần mềm BIM của Đức (Nemetschek). Bao phủ concept đến thi công. Thế mạnh: hạ tầng, công trình dân dụng nặng.','2026-09-03 07:33:07','2026-09-03 07:33:07'),(3,'ZWCAD','bim_chu_luc',0,'Giải pháp CAD 2D/3D, tương thích định dạng DWG. Phù hợp khách cần vẽ CAD cơ bản, chi phí thấp.','2026-09-03 07:33:07','2026-09-03 07:33:07'),(4,'CI Tools','add_in',0,'Bộ add-in tăng năng suất: mô hình hóa, lập hồ sơ, bóc tách khối lượng, cửa sổ/cửa đi tự động.','2026-09-03 07:33:07','2026-09-03 07:33:07'),(5,'EPTAR','add_in',0,'Plugin Reinforcement (cốt thép bê tông) và ArchiTerra (mô hình hóa địa hình 3D).','2026-09-03 07:33:07','2026-09-03 07:33:07'),(6,'BIMcloud','cong_tac',0,'Nền tảng cộng tác đám mây của Graphisoft — làm việc nhóm thời gian thực (on-premise/cloud).','2026-09-03 07:33:07','2026-09-03 07:33:07'),(7,'Catenda','cong_tac',0,'Nền tảng web quản lý toàn bộ vòng đời dự án (thiết kế → vận hành) qua chuẩn IFC/BCF.','2026-09-03 07:33:07','2026-09-03 07:33:07'),(8,'Solibri Model Checker','chuyen_dung',0,'Kiểm tra chất lượng mô hình BIM, phát hiện xung đột, tiết kiệm chi phí xây dựng.','2026-09-03 07:33:07','2026-09-03 07:33:07'),(9,'Enscape','chuyen_dung',0,'Render thời gian thực và VR. Tích hợp Archicad, Rhino, SketchUp, Revit...','2026-09-03 07:33:07','2026-09-03 07:33:07'),(10,'D5 Render','chuyen_dung',0,'Render thời gian thực (ray tracing). Kết nối Archicad, 3ds Max, Blender...','2026-09-03 07:33:07','2026-09-03 07:33:07'),(11,'Bluebeam','chuyen_dung',0,'Ghi chú PDF và cộng tác số cho ngành AECO — đồng bộ, lưu trữ dữ liệu tại công trường.','2026-09-03 07:33:07','2026-09-03 07:33:07'),(12,'GEO5','chuyen_dung',0,'Bộ phần mềm địa kỹ thuật, >20 mô-đun: phân tích ổn định, tường chắn, móng, độ lún.','2026-09-03 07:33:07','2026-09-03 07:33:07');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings` (
  `key` varchar(100) NOT NULL,
  `value` text NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES ('monthly_target','500000000','2026-09-03 07:51:17'),('silent_deal_days','7','2026-09-03 07:51:17'),('theme','dark','2026-09-03 07:51:17');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-03 15:47:29
