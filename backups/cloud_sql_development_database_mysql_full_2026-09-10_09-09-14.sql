-- ==============================================================================
-- Nano Circumcision Clinic Management System
-- MySQL / MariaDB DATABASE FULL BACKUP DUMP
-- Tanggal Ekspor : 2026-09-10T09:09:14.543Z
-- Diekspor Oleh  : admin@nanocircumcision.com
-- Mode Backup    : FULL
-- Target RDBMS   : MySQL 5.7+, MySQL 8.0+, MariaDB 10+, phpMyAdmin, MySQL Workbench
-- ==============================================================================

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- --------------------------------------------------------
-- BAGIAN 1: STRUKTUR TABEL & INDEX MYSQL (DDL)
-- --------------------------------------------------------

-- ==============================================================================
-- NANO CIRCUMCISION CLINIC MANAGEMENT SYSTEM
-- MySQL & MariaDB Compatible Database Schema DDL
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10+, phpMyAdmin & MySQL Workbench
-- ==============================================================================

-- 1. Master Table: Users & Staff Authentication
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'staff',
  `phone` varchar(50) DEFAULT NULL,
  `password_hash` text DEFAULT NULL,
  `permissions` text DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_users_uid` (`uid`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Master Table: Guardians / Orang Tua / Wali
DROP TABLE IF EXISTS `guardians`;
CREATE TABLE IF NOT EXISTS `guardians` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `father_name` varchar(255) DEFAULT NULL,
  `mother_name` varchar(255) DEFAULT NULL,
  `guardian_name` varchar(255) DEFAULT NULL,
  `relationship` varchar(100) NOT NULL DEFAULT 'Orang Tua',
  `phone` varchar(50) NOT NULL,
  `alternate_phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_guardians_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Master Table: Patients / Pasien Khitan
DROP TABLE IF EXISTS `patients`;
CREATE TABLE IF NOT EXISTS `patients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rm_number` varchar(100) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `nickname` varchar(100) DEFAULT NULL,
  `nik` varchar(50) DEFAULT NULL,
  `gender` varchar(20) NOT NULL DEFAULT 'Laki-laki',
  `birth_place` varchar(150) DEFAULT NULL,
  `birth_date` varchar(50) NOT NULL,
  `age_years` int(11) NOT NULL DEFAULT 0,
  `age_months` int(11) NOT NULL DEFAULT 0,
  `address` text DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `school` varchar(255) DEFAULT NULL,
  `grade` varchar(50) DEFAULT NULL,
  `weight_kg` varchar(20) DEFAULT NULL,
  `height_cm` varchar(20) DEFAULT NULL,
  `allergies` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `guardian_id` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_patients_rm_number` (`rm_number`),
  KEY `idx_patients_guardian_id` (`guardian_id`),
  KEY `idx_patients_full_name` (`full_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Master Table: Patient Categories (REGULER, VIP, dll)
DROP TABLE IF EXISTS `patient_categories`;
CREATE TABLE IF NOT EXISTS `patient_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_patient_categories_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Master Table: Circumcision Packages (Paket Layanan Khitan)
DROP TABLE IF EXISTS `circumcision_packages`;
CREATE TABLE IF NOT EXISTS `circumcision_packages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `duration_minutes` int(11) NOT NULL DEFAULT 45,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_packages_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Master Table: Package Prices per Category
DROP TABLE IF EXISTS `package_prices`;
CREATE TABLE IF NOT EXISTS `package_prices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `package_id` int(11) NOT NULL,
  `patient_category_id` int(11) NOT NULL,
  `price` int(11) NOT NULL,
  `effective_from` varchar(50) NOT NULL,
  `effective_until` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_package_prices_package_id` (`package_id`),
  KEY `idx_package_prices_category_id` (`patient_category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Master Table: Circumcision Methods (Metode Tindakan Khitan)
DROP TABLE IF EXISTS `circumcision_methods`;
CREATE TABLE IF NOT EXISTS `circumcision_methods` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Master Table: Doctors (Dokter Operator Khitan)
DROP TABLE IF EXISTS `doctors`;
CREATE TABLE IF NOT EXISTS `doctors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `title` varchar(50) NOT NULL DEFAULT 'dr.',
  `specialty` varchar(150) NOT NULL DEFAULT 'Dokter Operator Khitan',
  `description` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `sip_number` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_doctors_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Doctor Schedules
DROP TABLE IF EXISTS `doctor_schedules`;
CREATE TABLE IF NOT EXISTS `doctor_schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `doctor_id` int(11) NOT NULL,
  `day_of_week` varchar(50) NOT NULL,
  `start_time` varchar(20) NOT NULL,
  `end_time` varchar(20) NOT NULL,
  `max_capacity` int(11) NOT NULL DEFAULT 10,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_schedules_doctor_id` (`doctor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Doctor Fee Rules
DROP TABLE IF EXISTS `doctor_fee_rules`;
CREATE TABLE IF NOT EXISTS `doctor_fee_rules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `doctor_id` int(11) NOT NULL,
  `package_id` int(11) NOT NULL,
  `patient_category_id` int(11) NOT NULL,
  `fee_amount` int(11) NOT NULL,
  `effective_date` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_fee_rules_doctor` (`doctor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Bookings Table (Form Booking Khitan)
DROP TABLE IF EXISTS `bookings`;
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_number` varchar(100) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `guardian_id` int(11) NOT NULL,
  `patient_category_id` int(11) DEFAULT NULL,
  `package_id` int(11) DEFAULT NULL,
  `doctor_id` int(11) DEFAULT NULL,
  `booking_date` varchar(50) NOT NULL,
  `booking_time` varchar(20) NOT NULL,
  `method_type` varchar(150) DEFAULT 'Klem Nano Sealer',
  `anesthesia_type` varchar(150) DEFAULT 'Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)',
  `package_price_snapshot` int(11) NOT NULL,
  `discount_amount` int(11) NOT NULL DEFAULT 0,
  `total_amount` int(11) NOT NULL,
  `dp_amount` int(11) NOT NULL DEFAULT 0,
  `remaining_amount` int(11) NOT NULL DEFAULT 0,
  `patient_source` varchar(100) NOT NULL DEFAULT 'Walk-in',
  `closing_staff_id` int(11) DEFAULT NULL,
  `closing_staff_name` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'BOOKED',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_bookings_number` (`booking_number`),
  KEY `idx_bookings_patient` (`patient_id`),
  KEY `idx_bookings_date` (`booking_date`),
  KEY `idx_bookings_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Booking Status History
DROP TABLE IF EXISTS `booking_status_history`;
CREATE TABLE IF NOT EXISTS `booking_status_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL,
  `changed_by` varchar(150) NOT NULL DEFAULT 'Staff',
  `notes` text DEFAULT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_history_booking` (`booking_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Queues Table (Antrean Harian Tindakan)
DROP TABLE IF EXISTS `queues`;
CREATE TABLE IF NOT EXISTS `queues` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `queue_number` varchar(50) NOT NULL,
  `queue_date` varchar(50) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'WAITING',
  `arrived_at` varchar(20) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_queues_date` (`queue_date`),
  KEY `idx_queues_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Circumcision Procedures (Pelaksanaan Tindakan Medis)
DROP TABLE IF EXISTS `circumcision_procedures`;
CREATE TABLE IF NOT EXISTS `circumcision_procedures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `procedure_number` varchar(100) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `doctor_name_snapshot` varchar(255) DEFAULT NULL,
  `assistant_staff_id` int(11) DEFAULT NULL,
  `assistant_staff_name` varchar(255) DEFAULT NULL,
  `procedure_date` varchar(50) NOT NULL,
  `procedure_time` varchar(20) NOT NULL,
  `method_type` varchar(150) NOT NULL DEFAULT 'Klem Nano Sealer',
  `anesthesia_type` varchar(150) DEFAULT 'Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)',
  `pre_condition` text DEFAULT NULL,
  `procedure_notes` text DEFAULT NULL,
  `post_condition` text DEFAULT NULL,
  `care_instructions` text DEFAULT NULL,
  `control_date` varchar(50) DEFAULT NULL,
  `additional_notes` text DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'WAITING',
  `checklist_data` text DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_procedures_number` (`procedure_number`),
  KEY `idx_procedures_patient` (`patient_id`),
  KEY `idx_procedures_date` (`procedure_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Informed Consents (Surat Persetujuan Tindakan Medis)
DROP TABLE IF EXISTS `informed_consents`;
CREATE TABLE IF NOT EXISTS `informed_consents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `procedure_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `guardian_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `consent_date` varchar(50) NOT NULL,
  `consent_time` varchar(20) NOT NULL,
  `is_approved` tinyint(1) NOT NULL DEFAULT 1,
  `guardian_signature` longtext DEFAULT NULL,
  `guardian_signer_name` varchar(255) NOT NULL,
  `guardian_nik` varchar(50) DEFAULT NULL,
  `doctor_signature` longtext DEFAULT NULL,
  `doctor_signer_name` varchar(255) NOT NULL,
  `witness_name` varchar(255) DEFAULT NULL,
  `witness_signature` longtext DEFAULT NULL,
  `emergency_contact` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `signed_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_consents_procedure` (`procedure_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Certificates (Sertifikat Keberanian Khitan)
DROP TABLE IF EXISTS `certificates`;
CREATE TABLE IF NOT EXISTS `certificates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `certificate_number` varchar(100) NOT NULL,
  `procedure_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `issue_date` varchar(50) NOT NULL,
  `custom_title` varchar(255) DEFAULT 'Sertifikat Keberanian Khitan',
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_certificates_number` (`certificate_number`),
  KEY `idx_certificates_patient` (`patient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Invoices (Faktur Pembayaran Kasir)
DROP TABLE IF EXISTS `invoices`;
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(100) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `invoice_date` varchar(50) NOT NULL,
  `package_amount` int(11) NOT NULL,
  `discount_amount` int(11) NOT NULL DEFAULT 0,
  `adjustment_amount` int(11) NOT NULL DEFAULT 0,
  `total_amount` int(11) NOT NULL,
  `paid_amount` int(11) NOT NULL DEFAULT 0,
  `balance_amount` int(11) NOT NULL DEFAULT 0,
  `status` varchar(50) NOT NULL DEFAULT 'UNPAID',
  `cashier_staff_id` int(11) DEFAULT NULL,
  `cashier_staff_name` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_invoices_number` (`invoice_number`),
  KEY `idx_invoices_booking` (`booking_id`),
  KEY `idx_invoices_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Payments (Catatan Transaksi Penerimaan Kasir)
DROP TABLE IF EXISTS `payments`;
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_id` int(11) NOT NULL,
  `payment_number` varchar(100) NOT NULL,
  `payment_date` varchar(50) NOT NULL,
  `payment_time` varchar(20) NOT NULL,
  `amount` int(11) NOT NULL,
  `payment_method` varchar(100) NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `cashier_staff_id` int(11) DEFAULT NULL,
  `cashier_staff_name` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_payments_number` (`payment_number`),
  KEY `idx_payments_invoice` (`invoice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Doctor Fee Transactions
DROP TABLE IF EXISTS `doctor_fee_transactions`;
CREATE TABLE IF NOT EXISTS `doctor_fee_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fee_number` varchar(100) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `procedure_id` int(11) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `fee_amount` int(11) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'PENDING',
  `paid_date` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_doctor_fees_number` (`fee_number`),
  KEY `idx_doctor_fees_doctor` (`doctor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Expense Categories & Transactions (Beban Biaya Klinik)
DROP TABLE IF EXISTS `expense_categories`;
CREATE TABLE IF NOT EXISTS `expense_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_expense_cat_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `expense_transactions`;
CREATE TABLE IF NOT EXISTS `expense_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `expense_number` varchar(100) NOT NULL,
  `category_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `amount` int(11) NOT NULL,
  `expense_date` varchar(50) NOT NULL,
  `expense_time` varchar(20) DEFAULT NULL,
  `payment_method` varchar(100) NOT NULL DEFAULT 'Cash',
  `receipt_image_url` text DEFAULT NULL,
  `approved_by` varchar(150) DEFAULT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `staff_name` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_expenses_number` (`expense_number`),
  KEY `idx_expenses_category` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Follow Ups (Kontrol & Pemantauan Pasca Khitan)
DROP TABLE IF EXISTS `follow_ups`;
CREATE TABLE IF NOT EXISTS `follow_ups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `procedure_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `scheduled_date` varchar(50) NOT NULL,
  `actual_date` varchar(50) DEFAULT NULL,
  `day_number` int(11) NOT NULL DEFAULT 1,
  `channel` varchar(100) NOT NULL DEFAULT 'WhatsApp',
  `wound_condition` text DEFAULT NULL,
  `healing_progress` text DEFAULT NULL,
  `pain_level` varchar(50) DEFAULT NULL,
  `swelling_status` varchar(50) DEFAULT NULL,
  `photo_urls` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'PENDING',
  `contacted_by` varchar(150) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_followups_procedure` (`procedure_id`),
  KEY `idx_followups_patient` (`patient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Products & Stock Inventory (Alat Medis, Obat, Celana Sunat)
DROP TABLE IF EXISTS `products`;
CREATE TABLE IF NOT EXISTS `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sku` varchar(100) NOT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'Medis',
  `unit` varchar(50) NOT NULL DEFAULT 'Pcs',
  `purchase_price` int(11) NOT NULL DEFAULT 0,
  `selling_price` int(11) NOT NULL DEFAULT 0,
  `current_stock` int(11) NOT NULL DEFAULT 0,
  `min_stock_alert` int(11) NOT NULL DEFAULT 5,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_products_sku` (`sku`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `package_included_items`;
CREATE TABLE IF NOT EXISTS `package_included_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `package_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pkg_items_pkg` (`package_id`),
  KEY `idx_pkg_items_prod` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `stock_movements`;
CREATE TABLE IF NOT EXISTS `stock_movements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `movement_number` varchar(100) NOT NULL,
  `product_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `quantity` int(11) NOT NULL,
  `previous_stock` int(11) NOT NULL,
  `new_stock` int(11) NOT NULL,
  `reason` text DEFAULT NULL,
  `reference_id` varchar(100) DEFAULT NULL,
  `performed_by` varchar(150) NOT NULL DEFAULT 'Staff',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_stock_movements_number` (`movement_number`),
  KEY `idx_stock_mov_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `transaction_items`;
CREATE TABLE IF NOT EXISTS `transaction_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_name_snapshot` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` int(11) NOT NULL,
  `total_price` int(11) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_trans_items_invoice` (`invoice_id`),
  KEY `idx_trans_items_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. Employees & Payroll Management (SDM & Penggajian)
DROP TABLE IF EXISTS `employees`;
CREATE TABLE IF NOT EXISTS `employees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` varchar(100) NOT NULL DEFAULT 'Perawat Asisten',
  `specialty` varchar(150) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `join_date` varchar(50) NOT NULL,
  `base_salary` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_employees_code` (`employee_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `employee_fee_rules`;
CREATE TABLE IF NOT EXISTS `employee_fee_rules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) NOT NULL,
  `action_type` varchar(100) NOT NULL DEFAULT 'ASSISTANT_KHITAN',
  `fee_amount` int(11) NOT NULL DEFAULT 0,
  `effective_date` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_emp_fee_rules_emp` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `employee_fee_transactions`;
CREATE TABLE IF NOT EXISTS `employee_fee_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fee_number` varchar(100) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `procedure_id` int(11) DEFAULT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `action_type` varchar(100) NOT NULL DEFAULT 'ASSISTANT_KHITAN',
  `fee_amount` int(11) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'PENDING',
  `paid_date` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_emp_fee_trans_num` (`fee_number`),
  KEY `idx_emp_fee_trans_emp` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `payrolls`;
CREATE TABLE IF NOT EXISTS `payrolls` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payroll_number` varchar(100) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `period_month` int(11) NOT NULL,
  `period_year` int(11) NOT NULL,
  `base_salary` int(11) NOT NULL DEFAULT 0,
  `fee_total` int(11) NOT NULL DEFAULT 0,
  `bonus_amount` int(11) NOT NULL DEFAULT 0,
  `deduction_amount` int(11) NOT NULL DEFAULT 0,
  `net_salary` int(11) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'DRAFT',
  `payment_method` varchar(50) DEFAULT 'Transfer',
  `paid_at` datetime DEFAULT NULL,
  `paid_by` varchar(150) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_payrolls_number` (`payroll_number`),
  KEY `idx_payrolls_emp` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. Audit Logs & Clinic Settings
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `action` varchar(100) NOT NULL,
  `entity` varchar(100) NOT NULL,
  `entity_id` varchar(100) NOT NULL,
  `performed_by` varchar(150) NOT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(100) DEFAULT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `clinic_settings`;
CREATE TABLE IF NOT EXISTS `clinic_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clinic_name` varchar(255) NOT NULL,
  `tagline` text DEFAULT NULL,
  `address` text DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `logo_url` text DEFAULT NULL,
  `invoice_header` text DEFAULT NULL,
  `invoice_footer` text DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------
-- BAGIAN 2: DATA INSERTION MYSQL (DML)
-- --------------------------------------------------------

-- Dumping data untuk tabel `clinic_settings` (1 baris)
LOCK TABLES `clinic_settings` WRITE;
/*!40000 ALTER TABLE `clinic_settings` DISABLE KEYS */;
INSERT INTO `clinic_settings` (`id`, `clinic_name`, `tagline`, `address`, `phone`, `email`, `website`, `logo_url`, `invoice_header`, `invoice_footer`, `invoice_paper_default`, `default_doctor_fee_type`, `updated_at`) VALUES (1, 'NANO CIRCUMCISION CLINIC', 'Pusat Khitan Modern, Aman & Nyaman Tanpa Jahit', 'RUKO KHAYANGAN RECIDENCE RB_16  BURNEH BANGKALAN MADURA', '0812-8888-9999', 'NanoCirumcision@gmail.com', 'www.nanocircumcision.com', NULL, 'Terima kasih telah mempercayakan tindakan khitan putra tercinta kepada tim medis Nano Circumcision.', 'Dokumen ini sah dan diterbitkan secara digital oleh PT Nano Circumcision Management System.', 'A4', 'FIXED', '2026-09-04 16:07:18');
/*!40000 ALTER TABLE `clinic_settings` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `users` (5 baris)
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` (`id`, `uid`, `email`, `full_name`, `role`, `phone`, `password_hash`, `permissions`, `last_login`, `is_active`, `created_at`) VALUES (1, 'user-owner', 'owner@nanocircumcision.com', 'H. Rian Gunawan, S.E. (Owner / Super Admin)', 'owner', '0811-2233-4455', '43a0d17178a9d26c9e0fe9a74b0b45e38d32f27aed887a008a54bf6e033bf7b9', '["dashboard.view","patients.view","patients.create","patients.edit","patients.delete","bookings.view","bookings.create","bookings.edit","bookings.cancel","procedures.view","procedures.edit","procedures.complete","products.view","products.create","products.edit","products.adjust_stock","cashier.view","cashier.payment","cashier.void","doctor_fees.view","doctor_fees.manage","employees.view","employees.manage","payroll.view","payroll.manage","expenses.view","expenses.manage","reports.view","reports.export","master.view","master.manage","users.view","users.manage","audit.view","settings.manage"]', NULL, 1, '2026-09-04 01:30:56');
INSERT INTO `users` (`id`, `uid`, `email`, `full_name`, `role`, `phone`, `password_hash`, `permissions`, `last_login`, `is_active`, `created_at`) VALUES (3, 'user-staff', 'staff@nanocircumcision.com', 'Dina Safitri (Front Office & Kasir)', 'staff', '0813-9876-5432', '10176e7b7b24d317acfcf8d2064cfd2f24e154f7b5a96603077d5ef813d6a6b6', '["dashboard.view","patients.view","patients.create","bookings.view","bookings.create","bookings.edit","cashier.view","cashier.payment","products.view","followups.view","followups.edit"]', NULL, 1, '2026-09-04 01:30:56');
INSERT INTO `users` (`id`, `uid`, `email`, `full_name`, `role`, `phone`, `password_hash`, `permissions`, `last_login`, `is_active`, `created_at`) VALUES (4, 'user-doctor', 'dokter@nanocircumcision.com', 'dr. Bambang Irawan, Sp.B (Dokter Operator Khitan)', 'doctor', '0812-7777-8888', 'b3959dee9b178b030c2b8373da55a04ab3adb318edeb178953ff8b77301a360a', '["dashboard.view","patients.view","procedures.view","procedures.edit","procedures.complete","doctor_fees.view"]', '2026-09-05 14:05:13', 1, '2026-09-04 01:30:56');
INSERT INTO `users` (`id`, `uid`, `email`, `full_name`, `role`, `phone`, `password_hash`, `permissions`, `last_login`, `is_active`, `created_at`) VALUES (2, 'user-admin', 'admin@nanocircumcision.com', 'Siti Rahmawati, S.Kep (Admin Operasional)', 'admin', '0812-3456-7890', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', '["dashboard.view","patients.view","patients.create","patients.edit","bookings.view","bookings.create","bookings.edit","bookings.cancel","procedures.view","procedures.edit","procedures.complete","products.view","products.create","products.edit","products.adjust_stock","cashier.view","cashier.payment","doctor_fees.view","employees.view","payroll.view","expenses.view","expenses.manage","reports.view","master.view","settings.manage"]', '2026-09-10 08:00:12', 1, '2026-09-04 01:30:56');
INSERT INTO `users` (`id`, `uid`, `email`, `full_name`, `role`, `phone`, `password_hash`, `permissions`, `last_login`, `is_active`, `created_at`) VALUES (5, 'user-mtqjfimf', 'dika@gmail.com', 'Novian Tri Andhika', 'admin', '', 'dfa2ff914d8a9586450aa638ba5999b14a0aa95d625207ac1c31678b5e5ac623', '[]', '2026-09-10 09:05:32', 1, '2026-09-07 01:04:15');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `guardians` (5 baris)
LOCK TABLES `guardians` WRITE;
/*!40000 ALTER TABLE `guardians` DISABLE KEYS */;
INSERT INTO `guardians` (`id`, `name`, `father_name`, `mother_name`, `guardian_name`, `relationship`, `phone`, `alternate_phone`, `address`, `notes`, `created_at`) VALUES (1, 'iswatun hasanah', 'iswatun hasanah', '', 'iswatun hasanah', 'Ibu Kandung', '085857105734', '', 'dsn. kandang  rt / banteyan. kecamatan kelampis, RT/RW: ibu rumah tangga', '', '2026-09-06 14:38:06');
INSERT INTO `guardians` (`id`, `name`, `father_name`, `mother_name`, `guardian_name`, `relationship`, `phone`, `alternate_phone`, `address`, `notes`, `created_at`) VALUES (2, 'Hanan. Ibu : Qurrotul Ainy', 'Hanan. Ibu : Qurrotul Ainy', 'Qurrotul Ainy', 'Hanan. Ibu : Qurrotul Ainy', 'Ayah Kandung', '085733286618', '', 'kmp. Jaya sumber no  rt/rw / desa Pesanggrahan kec Kwanyar, RT/RW: ASN', '', '2026-09-07 05:37:42');
INSERT INTO `guardians` (`id`, `name`, `father_name`, `mother_name`, `guardian_name`, `relationship`, `phone`, `alternate_phone`, `address`, `notes`, `created_at`) VALUES (3, 'Hanan. Ibu : Qurrotul Ainy', 'Hanan. Ibu : Qurrotul Ainy', 'Qurrotul Ainy', 'Hanan. Ibu : Qurrotul Ainy', 'Ayah Kandung', '085733286618', '', 'kmp. Jaya sumber no  rt/rw / desa Pesanggrahan kec Kwanyar, RT/RW: ASN', '', '2026-09-07 10:02:27');
INSERT INTO `guardians` (`id`, `name`, `father_name`, `mother_name`, `guardian_name`, `relationship`, `phone`, `alternate_phone`, `address`, `notes`, `created_at`) VALUES (5, 'M. Sodik', 'M. Sodik', '', 'M. Sodik', 'Ayah Kandung', '085784582370', '', 'tedungan socah, RT/RW: swasta', '', '2026-09-10 03:51:55');
INSERT INTO `guardians` (`id`, `name`, `father_name`, `mother_name`, `guardian_name`, `relationship`, `phone`, `alternate_phone`, `address`, `notes`, `created_at`) VALUES (4, 'WAHYU ', 'WAHYU ', 'Yuli', 'WAHYU ', 'Ayah Kandung', '085257361205', '', 'Dsn Baruk Lajing Arosbaya, ', '', '2026-09-10 02:14:06');
/*!40000 ALTER TABLE `guardians` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `patients` (5 baris)
LOCK TABLES `patients` WRITE;
/*!40000 ALTER TABLE `patients` DISABLE KEYS */;
INSERT INTO `patients` (`id`, `rm_number`, `full_name`, `nickname`, `nik`, `gender`, `birth_place`, `birth_date`, `age_years`, `age_months`, `address`, `phone`, `school`, `grade`, `weight_kg`, `height_cm`, `allergies`, `notes`, `guardian_id`, `is_active`, `is_deleted`, `deleted_at`, `deleted_by`, `created_at`) VALUES (1, 'RM-2026-000001', 'izzam alvaro', 'izzam', '', 'Laki-laki', 'Bangkalan', '2023-10-11', 2, 11, 'dsn. kandang  rt / banteyan. kecamatan kelampis, RT/RW: ibu rumah tangga', '085857105734', 'belum sekolah', '', '', '', '', 'Tgl Daftar: agustus • Usia Anak: tahun • Hobi & Minat Anak: blum ada • Prestasi Yang Pernah diraih Anak: belum ada • Rencana Tgl Sunat: october • Request Jam: siang • Cabang: bangkalan • Akun IG: queen ana safira • Request Metode: glans pro bipolar pen sealer vip • Paket:  • Agama: islam • nb: untuk pasien yang sudah daftar di mohon di konfirmasi ulang sebelum H- tindakan sunat (khitan)', 1, 1, 0, NULL, NULL, '2026-09-06 14:38:07');
INSERT INTO `patients` (`id`, `rm_number`, `full_name`, `nickname`, `nik`, `gender`, `birth_place`, `birth_date`, `age_years`, `age_months`, `address`, `phone`, `school`, `grade`, `weight_kg`, `height_cm`, `allergies`, `notes`, `guardian_id`, `is_active`, `is_deleted`, `deleted_at`, `deleted_by`, `created_at`) VALUES (3, 'RM-2026-000003', 'Muhammad Orhan Ghazi El Hanan', 'Muhammad', '', 'Laki-laki', 'Bangkalan', '2025-03-15', 1, 6, 'kmp. Jaya sumber no  rt/rw / desa Pesanggrahan kec Kwanyar, RT/RW: ASN', '085733286618', '-', '', '', '', 'Fimosis', 'Tgl Daftar: Sep • Usia Anak: bulan • Rencana Tgl Sunat: September • Request Jam: . • Cabang: Bangkalan • Sumber informasi Sunat: teman • Akun IG: Qa_ainy • Request Metode: glans pro bipolar pem sealer • Paket: vip • Agama: islam', 3, 1, 0, NULL, NULL, '2026-09-07 10:02:27');
INSERT INTO `patients` (`id`, `rm_number`, `full_name`, `nickname`, `nik`, `gender`, `birth_place`, `birth_date`, `age_years`, `age_months`, `address`, `phone`, `school`, `grade`, `weight_kg`, `height_cm`, `allergies`, `notes`, `guardian_id`, `is_active`, `is_deleted`, `deleted_at`, `deleted_by`, `created_at`) VALUES (2, 'RM-2026-000002', 'Muhammad Orhan Ghazi El Hanan', 'Muhammad', '', 'Laki-laki', 'Bangkalan', '2025-03-15', 1, 6, 'kmp. Jaya sumber no  rt/rw / desa Pesanggrahan kec Kwanyar, RT/RW: ASN', '085733286618', '', '', '', '', '', 'Tgl Daftar: Sep • Usia Anak: bulan • Rencana Tgl Sunat: September • Request Jam: . • Cabang: Bangkalan • Sumber informasi Sunat: teman • Akun IG: Qa_ainy • Request Metode: glans pro bipolar pem sealer • Paket: vip • Agama: islam\n[Diarsipkan: Dihapus oleh admin oleh Administrator Klinik]', 2, 1, 1, '2026-09-09 01:17:26', 'Administrator Klinik', '2026-09-07 05:37:42');
INSERT INTO `patients` (`id`, `rm_number`, `full_name`, `nickname`, `nik`, `gender`, `birth_place`, `birth_date`, `age_years`, `age_months`, `address`, `phone`, `school`, `grade`, `weight_kg`, `height_cm`, `allergies`, `notes`, `guardian_id`, `is_active`, `is_deleted`, `deleted_at`, `deleted_by`, `created_at`) VALUES (5, 'RM-2026-000005', 'Gilang Shodiq ramadhan', 'Gilang', '', 'Laki-laki', 'Bangkalan', '2018-05-27', 8, 4, 'tedungan socah, RT/RW: swasta', '085784582370', 'kelas 2 SDN 01 socah', 'kelas 2', '', '', '', 'Tgl Daftar: 29 juni 2026 • Usia Anak: 8 tahun • Hobi & Minat Anak: main • Rencana Tgl Sunat: 2026-07-03 • Request Jam: 08:00 • Cabang: bangkalan • Sumber Info: teman • Request Metode: nano klamp reguler • Paket: Reg • Agama: islam • Diskon/Voucher: Rp 350', 5, 1, 0, NULL, NULL, '2026-09-10 03:51:55');
INSERT INTO `patients` (`id`, `rm_number`, `full_name`, `nickname`, `nik`, `gender`, `birth_place`, `birth_date`, `age_years`, `age_months`, `address`, `phone`, `school`, `grade`, `weight_kg`, `height_cm`, `allergies`, `notes`, `guardian_id`, `is_active`, `is_deleted`, `deleted_at`, `deleted_by`, `created_at`) VALUES (4, 'RM-2026-000004', 'AL GHIFARI DAVIANSYAH', 'AL', '', 'Laki-laki', 'Bangkalan', '2024-08-14', 2, 1, 'Dsn Baruk Lajing Arosbaya, ', '085257361205', 'klas  SDN LAJING', '', '', '', 'Tidak ada', 'Tgl Daftar: // • Usia Anak: TH  BULN • Hobi & Minat Anak: NANGIS,game • Rencana Tgl Sunat: SEPTEMBER • Request Jam:  • Cabang: bangkalan • Sumber Info: teman • Request Metode:  • Paket:  • Agama: Islam • nb: untuk pasien yang sudah daftar di mohon di konfirmasi ulang sebelum H- tindakan sunat (khitan)', 4, 1, 0, NULL, NULL, '2026-09-10 02:14:06');
/*!40000 ALTER TABLE `patients` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `patient_categories` (2 baris)
LOCK TABLES `patient_categories` WRITE;
/*!40000 ALTER TABLE `patient_categories` DISABLE KEYS */;
INSERT INTO `patient_categories` (`id`, `code`, `name`, `description`, `is_default`, `is_active`) VALUES (1, 'REGULER', 'Pasien Reguler', 'Layanan khitan standar ruang tindakan utama', 1, 1);
INSERT INTO `patient_categories` (`id`, `code`, `name`, `description`, `is_default`, `is_active`) VALUES (2, 'VIP', 'Pasien VIP', 'Layanan khitan private room, snack luxury & prioritas penanganan', 0, 1);
/*!40000 ALTER TABLE `patient_categories` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `circumcision_packages` (2 baris)
LOCK TABLES `circumcision_packages` WRITE;
/*!40000 ALTER TABLE `circumcision_packages` DISABLE KEYS */;
INSERT INTO `circumcision_packages` (`id`, `code`, `name`, `description`, `duration_minutes`, `is_active`, `created_at`) VALUES (2, 'PKT-SUPER-RING', 'Metode Glans Pro Bipolar Pensealer', 'Teknologi bipolar pensil pemotong dan sealer presisi tanpa jahitan, tanpa perban, penyembuhan ultra-cepat.', 40, 1, '2026-09-03 04:39:20');
INSERT INTO `circumcision_packages` (`id`, `code`, `name`, `description`, `duration_minutes`, `is_active`, `created_at`) VALUES (1, 'PKT-NANO-SEALER', 'Metode Tindakan Nano Klemp', 'Metode khitan modern menggunakan klem steril dan perekat luka bedah (sealer) tanpa perban/jahitan.', 45, 1, '2026-09-03 04:39:20');
/*!40000 ALTER TABLE `circumcision_packages` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `package_prices` (8 baris)
LOCK TABLES `package_prices` WRITE;
/*!40000 ALTER TABLE `package_prices` DISABLE KEYS */;
INSERT INTO `package_prices` (`id`, `package_id`, `patient_category_id`, `price`, `effective_from`, `effective_until`, `is_active`) VALUES (2, 2, 1, 1500000, '2026-01-01', '2026-09-05', 0);
INSERT INTO `package_prices` (`id`, `package_id`, `patient_category_id`, `price`, `effective_from`, `effective_until`, `is_active`) VALUES (6, 2, 2, 2100000, '2026-01-01', '2026-09-05', 0);
INSERT INTO `package_prices` (`id`, `package_id`, `patient_category_id`, `price`, `effective_from`, `effective_until`, `is_active`) VALUES (9, 2, 1, 2400000, '2026-09-05', NULL, 1);
INSERT INTO `package_prices` (`id`, `package_id`, `patient_category_id`, `price`, `effective_from`, `effective_until`, `is_active`) VALUES (10, 2, 2, 2700000, '2026-09-05', NULL, 1);
INSERT INTO `package_prices` (`id`, `package_id`, `patient_category_id`, `price`, `effective_from`, `effective_until`, `is_active`) VALUES (1, 1, 1, 1800000, '2026-01-01', '2026-09-05', 0);
INSERT INTO `package_prices` (`id`, `package_id`, `patient_category_id`, `price`, `effective_from`, `effective_until`, `is_active`) VALUES (5, 1, 2, 2400000, '2026-01-01', '2026-09-05', 0);
INSERT INTO `package_prices` (`id`, `package_id`, `patient_category_id`, `price`, `effective_from`, `effective_until`, `is_active`) VALUES (11, 1, 1, 1600000, '2026-09-05', NULL, 1);
INSERT INTO `package_prices` (`id`, `package_id`, `patient_category_id`, `price`, `effective_from`, `effective_until`, `is_active`) VALUES (12, 1, 2, 1800000, '2026-09-05', NULL, 1);
/*!40000 ALTER TABLE `package_prices` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `circumcision_methods` (2 baris)
LOCK TABLES `circumcision_methods` WRITE;
/*!40000 ALTER TABLE `circumcision_methods` DISABLE KEYS */;
INSERT INTO `circumcision_methods` (`id`, `name`, `description`, `notes`, `is_active`, `is_deleted`, `created_at`, `updated_at`) VALUES (2, 'Metode Glans Pro Bipolar Pensealer', 'Teknologi bipolar pensil pemotong dan sealer presisi tanpa jahitan, tanpa perban, penyembuhan ultra-cepat.', 'Teknologi unggulan dengan hemostatis prima, aman bagi anak aktif, luka steril bebas basah.', 1, 0, '2026-09-04 16:26:47', '2026-09-05 02:31:50');
INSERT INTO `circumcision_methods` (`id`, `name`, `description`, `notes`, `is_active`, `is_deleted`, `created_at`, `updated_at`) VALUES (1, 'Metode Tindakan Nano Klemp', 'Metode khitan modern menggunakan klem steril dan perekat luka bedah (sealer) tanpa perban/jahitan.', 'Minim nyeri, luka cepat kering, anak bisa langsung beraktivitas normal dan mandi.', 1, 0, '2026-09-04 16:26:47', '2026-09-05 02:32:06');
/*!40000 ALTER TABLE `circumcision_methods` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `doctors` (2 baris)
LOCK TABLES `doctors` WRITE;
/*!40000 ALTER TABLE `doctors` DISABLE KEYS */;
INSERT INTO `doctors` (`id`, `code`, `name`, `title`, `specialty`, `description`, `notes`, `phone`, `email`, `sip_number`, `is_active`, `is_deleted`, `created_at`) VALUES (1, 'DOC-001', 'dr. Muhammad Ali gufron', 'dr.', 'Dokter Spesialis Bedah & Operator Khitan Senior', '', '', '0812-1111-2222', 'Gufron@nanocircumcision.com', 'SIP.440/123/DISKES/2023', 1, 0, '2026-09-03 04:39:20');
INSERT INTO `doctors` (`id`, `code`, `name`, `title`, `specialty`, `description`, `notes`, `phone`, `email`, `sip_number`, `is_active`, `is_deleted`, `created_at`) VALUES (3, 'DOC-003', 'dr. Natsir Albukaoni', 'dr.', 'Dokter Operator Khitan Ramah Anak', '', '', '0815-5555-6666', 'Natsir@nanocircumcision.com', 'SIP.440/789/DISKES/2024', 1, 0, '2026-09-03 04:39:20');
/*!40000 ALTER TABLE `doctors` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `doctor_schedules` (14 baris)
LOCK TABLES `doctor_schedules` WRITE;
/*!40000 ALTER TABLE `doctor_schedules` DISABLE KEYS */;
INSERT INTO `doctor_schedules` (`id`, `doctor_id`, `day_of_week`, `start_time`, `end_time`, `max_capacity`, `is_active`) VALUES (1, 1, 'Senin', '08:00', '16:00', 12, 1);
INSERT INTO `doctor_schedules` (`id`, `doctor_id`, `day_of_week`, `start_time`, `end_time`, `max_capacity`, `is_active`) VALUES (2, 1, 'Selasa', '08:00', '16:00', 12, 1);
INSERT INTO `doctor_schedules` (`id`, `doctor_id`, `day_of_week`, `start_time`, `end_time`, `max_capacity`, `is_active`) VALUES (3, 1, 'Rabu', '08:00', '16:00', 12, 1);
INSERT INTO `doctor_schedules` (`id`, `doctor_id`, `day_of_week`, `start_time`, `end_time`, `max_capacity`, `is_active`) VALUES (4, 1, 'Kamis', '08:00', '16:00', 12, 1);
INSERT INTO `doctor_schedules` (`id`, `doctor_id`, `day_of_week`, `start_time`, `end_time`, `max_capacity`, `is_active`) VALUES (5, 1, 'Jumat', '08:00', '16:00', 12, 1);
INSERT INTO `doctor_schedules` (`id`, `doctor_id`, `day_of_week`, `start_time`, `end_time`, `max_capacity`, `is_active`) VALUES (6, 1, 'Sabtu', '08:00', '16:00', 12, 1);
INSERT INTO `doctor_schedules` (`id`, `doctor_id`, `day_of_week`, `start_time`, `end_time`, `max_capacity`, `is_active`) VALUES (7, 1, 'Minggu', '08:00', '16:00', 12, 1);
INSERT INTO `doctor_schedules` (`id`, `doctor_id`, `day_of_week`, `start_time`, `end_time`, `max_capacity`, `is_active`) VALUES (15, 3, 'Senin', '08:00', '16:00', 12, 1);
INSERT INTO `doctor_schedules` (`id`, `doctor_id`, `day_of_week`, `start_time`, `end_time`, `max_capacity`, `is_active`) VALUES (16, 3, 'Selasa', '08:00', '16:00', 12, 1);
INSERT INTO `doctor_schedules` (`id`, `doctor_id`, `day_of_week`, `start_time`, `end_time`, `max_capacity`, `is_active`) VALUES (17, 3, 'Rabu', '08:00', '16:00', 12, 1);
INSERT INTO `doctor_schedules` (`id`, `doctor_id`, `day_of_week`, `start_time`, `end_time`, `max_capacity`, `is_active`) VALUES (18, 3, 'Kamis', '08:00', '16:00', 12, 1);
INSERT INTO `doctor_schedules` (`id`, `doctor_id`, `day_of_week`, `start_time`, `end_time`, `max_capacity`, `is_active`) VALUES (19, 3, 'Jumat', '08:00', '16:00', 12, 1);
INSERT INTO `doctor_schedules` (`id`, `doctor_id`, `day_of_week`, `start_time`, `end_time`, `max_capacity`, `is_active`) VALUES (20, 3, 'Sabtu', '08:00', '16:00', 12, 1);
INSERT INTO `doctor_schedules` (`id`, `doctor_id`, `day_of_week`, `start_time`, `end_time`, `max_capacity`, `is_active`) VALUES (21, 3, 'Minggu', '08:00', '16:00', 12, 1);
/*!40000 ALTER TABLE `doctor_schedules` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `doctor_fee_rules` (8 baris)
LOCK TABLES `doctor_fee_rules` WRITE;
/*!40000 ALTER TABLE `doctor_fee_rules` DISABLE KEYS */;
INSERT INTO `doctor_fee_rules` (`id`, `doctor_id`, `package_id`, `patient_category_id`, `fee_amount`, `effective_date`, `is_active`) VALUES (2, 1, 1, 2, 450000, '2026-01-01', 1);
INSERT INTO `doctor_fee_rules` (`id`, `doctor_id`, `package_id`, `patient_category_id`, `fee_amount`, `effective_date`, `is_active`) VALUES (5, 3, 1, 1, 250000, '2026-01-01', 1);
INSERT INTO `doctor_fee_rules` (`id`, `doctor_id`, `package_id`, `patient_category_id`, `fee_amount`, `effective_date`, `is_active`) VALUES (6, 3, 1, 2, 380000, '2026-01-01', 1);
INSERT INTO `doctor_fee_rules` (`id`, `doctor_id`, `package_id`, `patient_category_id`, `fee_amount`, `effective_date`, `is_active`) VALUES (8, 1, 2, 2, 450000, '2026-01-01', 1);
INSERT INTO `doctor_fee_rules` (`id`, `doctor_id`, `package_id`, `patient_category_id`, `fee_amount`, `effective_date`, `is_active`) VALUES (12, 3, 2, 2, 380000, '2026-01-01', 1);
INSERT INTO `doctor_fee_rules` (`id`, `doctor_id`, `package_id`, `patient_category_id`, `fee_amount`, `effective_date`, `is_active`) VALUES (1, 1, 1, 1, 300000, '2026-01-01', 0);
INSERT INTO `doctor_fee_rules` (`id`, `doctor_id`, `package_id`, `patient_category_id`, `fee_amount`, `effective_date`, `is_active`) VALUES (7, 1, 2, 1, 300000, '2026-01-01', 0);
INSERT INTO `doctor_fee_rules` (`id`, `doctor_id`, `package_id`, `patient_category_id`, `fee_amount`, `effective_date`, `is_active`) VALUES (11, 3, 2, 1, 250000, '2026-01-01', 0);
/*!40000 ALTER TABLE `doctor_fee_rules` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `bookings` (5 baris)
LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` (`id`, `booking_number`, `patient_id`, `guardian_id`, `patient_category_id`, `package_id`, `doctor_id`, `booking_date`, `booking_time`, `method_type`, `anesthesia_type`, `package_price_snapshot`, `discount_amount`, `total_amount`, `dp_amount`, `remaining_amount`, `patient_source`, `closing_staff_id`, `closing_staff_name`, `notes`, `status`, `created_at`) VALUES (1, 'BOOK-20260906-0001', 1, 1, 2, 2, 3, '2026-10-12', '08:38', 'glans pro bipolar pen sealer vip', 'Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)', 2700000, 0, 2700000, 0, 0, 'WhatsApp / Chat Pendaftaran', NULL, 'Administrator Klinik', 'Tgl Daftar: agustus • Usia Anak: tahun • Hobi & Minat Anak: blum ada • Prestasi Yang Pernah diraih Anak: belum ada • Rencana Tgl Sunat: october • Request Jam: siang • Cabang: bangkalan • Akun IG: queen ana safira • Request Metode: glans pro bipolar pen sealer vip • Paket:  • Agama: islam • nb: untuk pasien yang sudah daftar di mohon di konfirmasi ulang sebelum H- tindakan sunat (khitan)', 'CONFIRMED', '2026-09-06 14:38:07');
INSERT INTO `bookings` (`id`, `booking_number`, `patient_id`, `guardian_id`, `patient_category_id`, `package_id`, `doctor_id`, `booking_date`, `booking_time`, `method_type`, `anesthesia_type`, `package_price_snapshot`, `discount_amount`, `total_amount`, `dp_amount`, `remaining_amount`, `patient_source`, `closing_staff_id`, `closing_staff_name`, `notes`, `status`, `created_at`) VALUES (2, 'BOOK-20260907-0002', 2, 2, 2, 2, 1, '2026-09-07', '16:00', 'glans pro bipolar pem sealer', 'Bius Kombinasi (FNI + Injeksi)', 2700000, 0, 2700000, 0, 0, 'WhatsApp / Chat Pendaftaran', NULL, 'Administrator Klinik', 'Tgl Daftar: Sep • Usia Anak: bulan • Rencana Tgl Sunat: September • Request Jam: . • Cabang: Bangkalan • Sumber informasi Sunat: teman • Akun IG: Qa_ainy • Request Metode: glans pro bipolar pem sealer • Paket: vip • Agama: islam', 'COMPLETED', '2026-09-07 05:37:42');
INSERT INTO `bookings` (`id`, `booking_number`, `patient_id`, `guardian_id`, `patient_category_id`, `package_id`, `doctor_id`, `booking_date`, `booking_time`, `method_type`, `anesthesia_type`, `package_price_snapshot`, `discount_amount`, `total_amount`, `dp_amount`, `remaining_amount`, `patient_source`, `closing_staff_id`, `closing_staff_name`, `notes`, `status`, `created_at`) VALUES (5, 'BOOK-20260910-0005', 5, 5, 1, 1, 1, '2026-07-03', '08:00', 'Metode Tindakan Nano Klemp', 'Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)', 1600000, 350000, 1250000, 0, 0, 'Datang Langsung (Walk-in)', 5, 'Novian Tri Andhika', 'Tgl Daftar: 29 juni 2026 • Usia Anak: 8 tahun • Hobi & Minat Anak: main • Rencana Tgl Sunat: 2026-07-03 • Request Jam: 08:00 • Cabang: bangkalan • Sumber Info: teman • Request Metode: nano klamp reguler • Paket: Reg • Agama: islam • Diskon/Voucher: Rp 350', 'COMPLETED', '2026-09-10 03:51:56');
INSERT INTO `bookings` (`id`, `booking_number`, `patient_id`, `guardian_id`, `patient_category_id`, `package_id`, `doctor_id`, `booking_date`, `booking_time`, `method_type`, `anesthesia_type`, `package_price_snapshot`, `discount_amount`, `total_amount`, `dp_amount`, `remaining_amount`, `patient_source`, `closing_staff_id`, `closing_staff_name`, `notes`, `status`, `created_at`) VALUES (3, 'BOOK-20260907-0003', 3, 3, 2, 2, 1, '2026-09-07', '17:02', 'glans pro bipolar pem sealer', 'Bius Kombinasi (FNI + Injeksi)', 2700000, 0, 2700000, 0, 0, 'WhatsApp / Chat Pendaftaran', NULL, 'Administrator Klinik', 'Tgl Daftar: Sep • Usia Anak: bulan • Rencana Tgl Sunat: September • Request Jam: . • Cabang: Bangkalan • Sumber informasi Sunat: teman • Akun IG: Qa_ainy • Request Metode: glans pro bipolar pem sealer • Paket: vip • Agama: islam', 'COMPLETED', '2026-09-07 10:02:28');
INSERT INTO `bookings` (`id`, `booking_number`, `patient_id`, `guardian_id`, `patient_category_id`, `package_id`, `doctor_id`, `booking_date`, `booking_time`, `method_type`, `anesthesia_type`, `package_price_snapshot`, `discount_amount`, `total_amount`, `dp_amount`, `remaining_amount`, `patient_source`, `closing_staff_id`, `closing_staff_name`, `notes`, `status`, `created_at`) VALUES (4, 'BOOK-20260910-0004', 4, 4, 2, 2, 3, '2026-09-10', '08:00', 'Metode Glans Pro Bipolar Pensealer', 'Bius Kombinasi (FNI + Injeksi)', 2700000, 0, 2700000, 0, 0, 'Datang Langsung (Walk-in)', 5, 'Novian Tri Andhika', 'Tgl Daftar: // • Usia Anak: TH  BULN • Hobi & Minat Anak: NANGIS,game • Rencana Tgl Sunat: SEPTEMBER • Request Jam:  • Cabang: bangkalan • Sumber Info: teman • Request Metode:  • Paket:  • Agama: Islam • nb: untuk pasien yang sudah daftar di mohon di konfirmasi ulang sebelum H- tindakan sunat (khitan)', 'COMPLETED', '2026-09-10 02:14:06');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `booking_status_history` (15 baris)
LOCK TABLES `booking_status_history` WRITE;
/*!40000 ALTER TABLE `booking_status_history` DISABLE KEYS */;
INSERT INTO `booking_status_history` (`id`, `booking_id`, `status`, `changed_by`, `notes`, `timestamp`) VALUES (1, 1, 'BOOKED', 'Administrator Klinik', 'Booking otomatis dari pendaftaran pasien baru (Rencana Tindakan: 2026-10-12 siang, Metode: glans pro bipolar pen sealer vip)', '2026-09-06 14:38:07');
INSERT INTO `booking_status_history` (`id`, `booking_id`, `status`, `changed_by`, `notes`, `timestamp`) VALUES (2, 1, 'ARRIVED', 'Administrator Klinik', 'Pasien check-in, nomor antrean K-001', '2026-09-06 14:39:13');
INSERT INTO `booking_status_history` (`id`, `booking_id`, `status`, `changed_by`, `notes`, `timestamp`) VALUES (3, 1, 'COMPLETED', 'Administrator Klinik', 'Tindakan khitan selesai oleh dr. Natsir Albukaoni & asisten Novian Tri Andhika', '2026-09-06 14:41:23');
INSERT INTO `booking_status_history` (`id`, `booking_id`, `status`, `changed_by`, `notes`, `timestamp`) VALUES (4, 2, 'BOOKED', 'Administrator Klinik', 'Booking otomatis dari pendaftaran pasien baru (Rencana Tindakan: 2026-09-07 16:00, Metode: glans pro bipolar pem sealer)', '2026-09-07 05:37:43');
INSERT INTO `booking_status_history` (`id`, `booking_id`, `status`, `changed_by`, `notes`, `timestamp`) VALUES (5, 2, 'ARRIVED', 'Administrator Klinik', 'Pasien check-in, nomor antrean K-001', '2026-09-07 05:38:05');
INSERT INTO `booking_status_history` (`id`, `booking_id`, `status`, `changed_by`, `notes`, `timestamp`) VALUES (6, 2, 'COMPLETED', 'Administrator Klinik', 'Tindakan khitan selesai oleh dr. Muhammad Ali gufron & asisten Ns. Athour , S.Kep', '2026-09-07 05:38:42');
INSERT INTO `booking_status_history` (`id`, `booking_id`, `status`, `changed_by`, `notes`, `timestamp`) VALUES (7, 3, 'BOOKED', 'Administrator Klinik', 'Booking otomatis dari pendaftaran pasien baru (Rencana Tindakan: 2026-09-07 17:02, Metode: glans pro bipolar pem sealer)', '2026-09-07 10:02:28');
INSERT INTO `booking_status_history` (`id`, `booking_id`, `status`, `changed_by`, `notes`, `timestamp`) VALUES (8, 3, 'ARRIVED', 'Administrator Klinik', 'Pasien check-in, nomor antrean K-002', '2026-09-07 10:02:56');
INSERT INTO `booking_status_history` (`id`, `booking_id`, `status`, `changed_by`, `notes`, `timestamp`) VALUES (9, 3, 'COMPLETED', 'Administrator Klinik', 'Tindakan khitan selesai oleh dr. Muhammad Ali gufron & asisten Ns. Athour , S.Kep', '2026-09-07 10:03:55');
INSERT INTO `booking_status_history` (`id`, `booking_id`, `status`, `changed_by`, `notes`, `timestamp`) VALUES (10, 4, 'BOOKED', 'Administrator Klinik', 'Booking otomatis dari pendaftaran pasien baru (Rencana Tindakan: 2026-09-10 08:00, Metode: Metode Glans Pro Bipolar Pensealer)', '2026-09-10 02:14:06');
INSERT INTO `booking_status_history` (`id`, `booking_id`, `status`, `changed_by`, `notes`, `timestamp`) VALUES (11, 4, 'ARRIVED', 'Administrator Klinik', 'Pasien check-in, nomor antrean K-001', '2026-09-10 02:14:20');
INSERT INTO `booking_status_history` (`id`, `booking_id`, `status`, `changed_by`, `notes`, `timestamp`) VALUES (12, 4, 'COMPLETED', 'Administrator Klinik', 'Tindakan khitan selesai oleh dr. Natsir Albukaoni & asisten Ns. Athour , S.Kep, Novian Tri Andhika', '2026-09-10 02:15:25');
INSERT INTO `booking_status_history` (`id`, `booking_id`, `status`, `changed_by`, `notes`, `timestamp`) VALUES (13, 5, 'BOOKED', 'Administrator Klinik', 'Booking otomatis dari pendaftaran pasien baru (Rencana Tindakan: 2026-07-03 08:00, Metode: Metode Tindakan Nano Klemp)', '2026-09-10 03:51:56');
INSERT INTO `booking_status_history` (`id`, `booking_id`, `status`, `changed_by`, `notes`, `timestamp`) VALUES (14, 5, 'ARRIVED', 'Administrator Klinik', 'Pasien check-in, nomor antrean K-002', '2026-09-10 03:52:14');
INSERT INTO `booking_status_history` (`id`, `booking_id`, `status`, `changed_by`, `notes`, `timestamp`) VALUES (15, 5, 'COMPLETED', 'Administrator Klinik', 'Tindakan khitan selesai oleh dr. Muhammad Ali gufron & asisten Novian Tri Andhika', '2026-09-10 03:52:49');
/*!40000 ALTER TABLE `booking_status_history` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `queues` (5 baris)
LOCK TABLES `queues` WRITE;
/*!40000 ALTER TABLE `queues` DISABLE KEYS */;
INSERT INTO `queues` (`id`, `queue_number`, `queue_date`, `booking_id`, `patient_id`, `doctor_id`, `status`, `arrived_at`, `created_at`) VALUES (1, 'K-001', '2026-09-06', 1, 1, 3, 'COMPLETED', '14:39', '2026-09-06 14:39:13');
INSERT INTO `queues` (`id`, `queue_number`, `queue_date`, `booking_id`, `patient_id`, `doctor_id`, `status`, `arrived_at`, `created_at`) VALUES (2, 'K-001', '2026-09-07', 2, 2, 1, 'COMPLETED', '05:38', '2026-09-07 05:38:05');
INSERT INTO `queues` (`id`, `queue_number`, `queue_date`, `booking_id`, `patient_id`, `doctor_id`, `status`, `arrived_at`, `created_at`) VALUES (3, 'K-002', '2026-09-07', 3, 3, 1, 'COMPLETED', '10:02', '2026-09-07 10:02:56');
INSERT INTO `queues` (`id`, `queue_number`, `queue_date`, `booking_id`, `patient_id`, `doctor_id`, `status`, `arrived_at`, `created_at`) VALUES (4, 'K-001', '2026-09-10', 4, 4, 3, 'COMPLETED', '02:14', '2026-09-10 02:14:20');
INSERT INTO `queues` (`id`, `queue_number`, `queue_date`, `booking_id`, `patient_id`, `doctor_id`, `status`, `arrived_at`, `created_at`) VALUES (5, 'K-002', '2026-09-10', 5, 5, 1, 'COMPLETED', '03:52', '2026-09-10 03:52:14');
/*!40000 ALTER TABLE `queues` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `circumcision_procedures` (5 baris)
LOCK TABLES `circumcision_procedures` WRITE;
/*!40000 ALTER TABLE `circumcision_procedures` DISABLE KEYS */;
INSERT INTO `circumcision_procedures` (`id`, `procedure_number`, `booking_id`, `patient_id`, `doctor_id`, `doctor_name_snapshot`, `assistant_staff_id`, `assistant_staff_name`, `procedure_date`, `procedure_time`, `method_type`, `anesthesia_type`, `pre_condition`, `procedure_notes`, `post_condition`, `care_instructions`, `control_date`, `additional_notes`, `status`, `checklist_data`, `created_at`, `completed_at`) VALUES (4, 'PROC-20260910-001', 4, 4, 3, 'dr. Natsir Albukaoni', 1, 'Ns. Athour , S.Kep, Novian Tri Andhika', '2026-09-10', '08:00', 'Metode Glans Pro Bipolar Pensealer', 'Bius Kombinasi ( FNI + injeksi)', 'Anatomi normal, preputium mobile, tidak ada kelainan bawaan.', 'Anestesi blok cincin tanpa jarum suntik, insisi presisi hemostatis baik, aplikasi sealer medis steril.', 'Luka tertutup rapi, sirkulasi glans baik, tidak ada pendarahan aktif.', 'Boleh mandi setelah 24 jam dengan celana khitan khusus. Minum obat analgetik dan antibiotik teratur.', '2026-09-11', '', 'COMPLETED', '{"identityVerified":true,"guardianVerified":true,"packageConfirmed":true,"consentSigned":true,"procedureDone":true,"notesFilled":true,"careGiven":true,"controlScheduled":true,"assistantStaffIds":[1,5]}', '2026-09-10 02:14:20', '2026-09-10 02:15:25');
INSERT INTO `circumcision_procedures` (`id`, `procedure_number`, `booking_id`, `patient_id`, `doctor_id`, `doctor_name_snapshot`, `assistant_staff_id`, `assistant_staff_name`, `procedure_date`, `procedure_time`, `method_type`, `anesthesia_type`, `pre_condition`, `procedure_notes`, `post_condition`, `care_instructions`, `control_date`, `additional_notes`, `status`, `checklist_data`, `created_at`, `completed_at`) VALUES (1, 'PROC-20260906-001', 1, 1, 3, 'dr. Natsir Albukaoni', 5, 'Novian Tri Andhika', '2026-09-06', '08:38', 'glans pro bipolar pen sealer vip', 'Bius Kombinasi ( FNI + injeksi)', 'Anatomi normal, preputium mobile, tidak ada kelainan bawaan.', 'Anestesi blok cincin tanpa jarum suntik, insisi presisi hemostatis baik, aplikasi sealer medis steril.', 'Luka tertutup rapi, sirkulasi glans baik, tidak ada pendarahan aktif.', 'Boleh mandi setelah 6 jam dengan celana khitan khusus. Minum obat analgetik dan antibiotik teratur.', '2026-09-09', '', 'COMPLETED', '{"identityVerified":true,"guardianVerified":true,"packageConfirmed":true,"consentSigned":true,"procedureDone":true,"notesFilled":true,"careGiven":true,"controlScheduled":true}', '2026-09-06 14:39:14', '2026-09-06 14:41:23');
INSERT INTO `circumcision_procedures` (`id`, `procedure_number`, `booking_id`, `patient_id`, `doctor_id`, `doctor_name_snapshot`, `assistant_staff_id`, `assistant_staff_name`, `procedure_date`, `procedure_time`, `method_type`, `anesthesia_type`, `pre_condition`, `procedure_notes`, `post_condition`, `care_instructions`, `control_date`, `additional_notes`, `status`, `checklist_data`, `created_at`, `completed_at`) VALUES (2, 'PROC-20260907-001', 2, 2, 1, 'dr. Muhammad Ali gufron', 1, 'Ns. Athour , S.Kep', '2026-09-07', '16:00', 'glans pro bipolar pem sealer', 'Bius Kombinasi ( FNI + injeksi)', 'Anatomi normal, preputium mobile, tidak ada kelainan bawaan.', 'Anestesi blok cincin tanpa jarum suntik, insisi presisi hemostatis baik, aplikasi sealer medis steril.', 'Luka tertutup rapi, sirkulasi glans baik, tidak ada pendarahan aktif.', 'Boleh mandi setelah 24 jam dengan celana khitan khusus. Minum obat analgetik dan antibiotik teratur.', '2026-09-09', '', 'COMPLETED', '{"identityVerified":true,"guardianVerified":true,"packageConfirmed":true,"consentSigned":true,"procedureDone":true,"notesFilled":true,"careGiven":true,"controlScheduled":true}', '2026-09-07 05:38:05', '2026-09-07 05:38:42');
INSERT INTO `circumcision_procedures` (`id`, `procedure_number`, `booking_id`, `patient_id`, `doctor_id`, `doctor_name_snapshot`, `assistant_staff_id`, `assistant_staff_name`, `procedure_date`, `procedure_time`, `method_type`, `anesthesia_type`, `pre_condition`, `procedure_notes`, `post_condition`, `care_instructions`, `control_date`, `additional_notes`, `status`, `checklist_data`, `created_at`, `completed_at`) VALUES (5, 'PROC-20260910-002', 5, 5, 1, 'dr. Muhammad Ali gufron', 5, 'Novian Tri Andhika', '2026-09-10', '08:00', 'Metode Tindakan Nano Klemp', 'Bius Kombinasi ( FNI + injeksi)', 'Anatomi normal, preputium mobile, tidak ada kelainan bawaan.', 'Anestesi blok cincin tanpa jarum suntik, insisi presisi hemostatis baik, aplikasi sealer medis steril.', 'Luka tertutup rapi, sirkulasi glans baik, tidak ada pendarahan aktif.', 'Boleh mandi setelah 24 jam dengan celana khitan khusus. Minum obat analgetik dan antibiotik teratur.', '2026-09-09', '', 'COMPLETED', '{"identityVerified":true,"guardianVerified":true,"packageConfirmed":true,"consentSigned":true,"procedureDone":true,"notesFilled":true,"careGiven":true,"controlScheduled":true,"assistantStaffIds":[5]}', '2026-09-10 03:52:14', '2026-09-10 03:52:49');
INSERT INTO `circumcision_procedures` (`id`, `procedure_number`, `booking_id`, `patient_id`, `doctor_id`, `doctor_name_snapshot`, `assistant_staff_id`, `assistant_staff_name`, `procedure_date`, `procedure_time`, `method_type`, `anesthesia_type`, `pre_condition`, `procedure_notes`, `post_condition`, `care_instructions`, `control_date`, `additional_notes`, `status`, `checklist_data`, `created_at`, `completed_at`) VALUES (3, 'PROC-20260907-002', 3, 3, 1, 'dr. Muhammad Ali gufron', 1, 'Ns. Athour , S.Kep', '2026-09-07', '17:02', 'glans pro bipolar pem sealer', 'Bius Kombinasi ( FNI + injeksi)', 'Anatomi normal, preputium mobile, tidak ada kelainan bawaan.hanya ada indikasi fimosis', 'Anestesi blok cincin tanpa jarum suntik, insisi presisi hemostatis baik, aplikasi sealer medis steril.', 'Luka tertutup rapi, sirkulasi glans baik, tidak ada pendarahan aktif.', 'Boleh mandi setelah 24 jam dengan celana khitan khusus. Minum obat analgetik dan antibiotik teratur.', '2026-09-09', '', 'COMPLETED', '{"identityVerified":true,"guardianVerified":true,"packageConfirmed":true,"consentSigned":true,"procedureDone":true,"notesFilled":true,"careGiven":true,"controlScheduled":true}', '2026-09-07 10:02:56', '2026-09-07 10:03:55');
/*!40000 ALTER TABLE `circumcision_procedures` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `certificates` (5 baris)
LOCK TABLES `certificates` WRITE;
/*!40000 ALTER TABLE `certificates` DISABLE KEYS */;
INSERT INTO `certificates` (`id`, `certificate_number`, `procedure_id`, `patient_id`, `doctor_id`, `issue_date`, `title`, `content`, `created_at`) VALUES (1, 'CERT-2026-000001', 1, 1, 3, '2026-09-06', 'SERTIFIKAT KHITAN NANO CIRCUMCISION', 'Diberikan kepada Ananda izzam alvaro (No. RM: RM-2026-000001) atas keberanian dan kesuksesannya menjalani tindakan khitan modern bersama dr. Natsir Albukaoni.', '2026-09-06 14:41:24');
INSERT INTO `certificates` (`id`, `certificate_number`, `procedure_id`, `patient_id`, `doctor_id`, `issue_date`, `title`, `content`, `created_at`) VALUES (2, 'CERT-2026-000002', 2, 2, 1, '2026-09-07', 'SERTIFIKAT KHITAN NANO CIRCUMCISION', 'Diberikan kepada Ananda Muhammad Orhan Ghazi El Hanan (No. RM: RM-2026-000002) atas keberanian dan kesuksesannya menjalani tindakan khitan modern bersama dr. Muhammad Ali gufron.', '2026-09-07 05:38:43');
INSERT INTO `certificates` (`id`, `certificate_number`, `procedure_id`, `patient_id`, `doctor_id`, `issue_date`, `title`, `content`, `created_at`) VALUES (3, 'CERT-2026-000003', 3, 3, 1, '2026-09-07', 'SERTIFIKAT KHITAN NANO CIRCUMCISION', 'Diberikan kepada Ananda Muhammad Orhan Ghazi El Hanan (No. RM: RM-2026-000003) atas keberanian dan kesuksesannya menjalani tindakan khitan modern bersama dr. Muhammad Ali gufron.', '2026-09-07 10:03:56');
INSERT INTO `certificates` (`id`, `certificate_number`, `procedure_id`, `patient_id`, `doctor_id`, `issue_date`, `title`, `content`, `created_at`) VALUES (4, 'CERT-2026-000004', 4, 4, 3, '2026-09-10', 'SERTIFIKAT KHITAN NANO CIRCUMCISION', 'Diberikan kepada Ananda AL GHIFARI DAVIANSYAH (No. RM: RM-2026-000004) atas keberanian dan kesuksesannya menjalani tindakan khitan modern bersama dr. Natsir Albukaoni.', '2026-09-10 02:15:26');
INSERT INTO `certificates` (`id`, `certificate_number`, `procedure_id`, `patient_id`, `doctor_id`, `issue_date`, `title`, `content`, `created_at`) VALUES (5, 'CERT-2026-000005', 5, 5, 1, '2026-09-10', 'SERTIFIKAT KHITAN NANO CIRCUMCISION', 'Diberikan kepada Ananda Gilang Shodiq ramadhan (No. RM: RM-2026-000005) atas keberanian dan kesuksesannya menjalani tindakan khitan modern bersama dr. Muhammad Ali gufron.', '2026-09-10 03:52:50');
/*!40000 ALTER TABLE `certificates` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `invoices` (5 baris)
LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` (`id`, `invoice_number`, `booking_id`, `patient_id`, `doctor_id`, `invoice_date`, `subtotal`, `discount`, `total_amount`, `paid_amount`, `remaining_amount`, `status`, `void_reason`, `voided_at`, `voided_by`, `notes`, `created_at`) VALUES (1, 'INV-20260906-0001', 1, 1, 3, '2026-10-12', 2700000, 0, 2700000, 2700000, 0, 'PAID', NULL, NULL, NULL, 'Invoice otomatis dari booking pendaftaran izzam alvaro', '2026-09-06 14:38:07');
INSERT INTO `invoices` (`id`, `invoice_number`, `booking_id`, `patient_id`, `doctor_id`, `invoice_date`, `subtotal`, `discount`, `total_amount`, `paid_amount`, `remaining_amount`, `status`, `void_reason`, `voided_at`, `voided_by`, `notes`, `created_at`) VALUES (2, 'INV-20260907-0002', 2, 2, 1, '2026-09-07', 2700000, 0, 2700000, 2700000, 0, 'PAID', NULL, NULL, NULL, 'Invoice otomatis dari booking pendaftaran Muhammad Orhan Ghazi El Hanan', '2026-09-07 05:37:43');
INSERT INTO `invoices` (`id`, `invoice_number`, `booking_id`, `patient_id`, `doctor_id`, `invoice_date`, `subtotal`, `discount`, `total_amount`, `paid_amount`, `remaining_amount`, `status`, `void_reason`, `voided_at`, `voided_by`, `notes`, `created_at`) VALUES (3, 'INV-20260907-0003', 3, 3, 1, '2026-09-07', 2700000, 0, 2700000, 2700000, 0, 'PAID', NULL, NULL, NULL, 'Invoice otomatis dari booking pendaftaran Muhammad Orhan Ghazi El Hanan', '2026-09-07 10:02:28');
INSERT INTO `invoices` (`id`, `invoice_number`, `booking_id`, `patient_id`, `doctor_id`, `invoice_date`, `subtotal`, `discount`, `total_amount`, `paid_amount`, `remaining_amount`, `status`, `void_reason`, `voided_at`, `voided_by`, `notes`, `created_at`) VALUES (4, 'INV-20260910-0004', 4, 4, 3, '2026-09-10', 2700000, 0, 2700000, 2700000, 0, 'PAID', NULL, NULL, NULL, 'Invoice otomatis dari booking pendaftaran AL GHIFARI DAVIANSYAH', '2026-09-10 02:14:06');
INSERT INTO `invoices` (`id`, `invoice_number`, `booking_id`, `patient_id`, `doctor_id`, `invoice_date`, `subtotal`, `discount`, `total_amount`, `paid_amount`, `remaining_amount`, `status`, `void_reason`, `voided_at`, `voided_by`, `notes`, `created_at`) VALUES (5, 'INV-20260910-0005', 5, 5, 1, '2026-07-03', 1600000, 350000, 1250000, 1250000, 0, 'PAID', NULL, NULL, NULL, 'Invoice otomatis dari booking pendaftaran Gilang Shodiq ramadhan', '2026-09-10 03:51:56');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `payments` (5 baris)
LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` (`id`, `payment_number`, `invoice_id`, `payment_date`, `amount`, `payment_method`, `payment_type`, `reference_number`, `notes`, `received_by`, `created_at`) VALUES (1, 'PAY-20260906-0001-5332', 1, '2026-09-06', 2700000, 'CASH', 'FULL_PAYMENT', '', '', 'Administrator Klinik', '2026-09-06 14:41:35');
INSERT INTO `payments` (`id`, `payment_number`, `invoice_id`, `payment_date`, `amount`, `payment_method`, `payment_type`, `reference_number`, `notes`, `received_by`, `created_at`) VALUES (2, 'PAY-20260907-0002-8375', 2, '2026-09-07', 2700000, 'CASH', 'FULL_PAYMENT', '', '', 'Administrator Klinik', '2026-09-07 05:38:48');
INSERT INTO `payments` (`id`, `payment_number`, `invoice_id`, `payment_date`, `amount`, `payment_method`, `payment_type`, `reference_number`, `notes`, `received_by`, `created_at`) VALUES (3, 'PAY-20260907-0003-7886', 3, '2026-09-07', 2700000, 'CASH', 'FULL_PAYMENT', '', '', 'Administrator Klinik', '2026-09-07 10:04:27');
INSERT INTO `payments` (`id`, `payment_number`, `invoice_id`, `payment_date`, `amount`, `payment_method`, `payment_type`, `reference_number`, `notes`, `received_by`, `created_at`) VALUES (4, 'PAY-20260910-0004-4687', 4, '2026-09-10', 2700000, 'QRIS', 'FULL_PAYMENT', '', '', 'Administrator Klinik', '2026-09-10 02:15:34');
INSERT INTO `payments` (`id`, `payment_number`, `invoice_id`, `payment_date`, `amount`, `payment_method`, `payment_type`, `reference_number`, `notes`, `received_by`, `created_at`) VALUES (5, 'PAY-20260910-0005-9771', 5, '2026-09-10', 1250000, 'CASH', 'FULL_PAYMENT', '', '', 'Administrator Klinik', '2026-09-10 03:52:59');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `doctor_fee_transactions` (5 baris)
LOCK TABLES `doctor_fee_transactions` WRITE;
/*!40000 ALTER TABLE `doctor_fee_transactions` DISABLE KEYS */;
INSERT INTO `doctor_fee_transactions` (`id`, `fee_number`, `doctor_id`, `patient_id`, `booking_id`, `procedure_id`, `invoice_id`, `package_id`, `patient_category_id`, `fee_amount`, `fee_date`, `status`, `approved_at`, `paid_at`, `notes`, `created_at`) VALUES (1, 'FEE-20260906-0001', 3, 1, 1, 1, 1, 2, 2, 380000, '2026-09-06', 'APPROVED', '2026-09-07 05:33:39', NULL, 'Fee tindakan khitan untuk izzam alvaro (dr. Natsir Albukaoni)', '2026-09-06 14:41:24');
INSERT INTO `doctor_fee_transactions` (`id`, `fee_number`, `doctor_id`, `patient_id`, `booking_id`, `procedure_id`, `invoice_id`, `package_id`, `patient_category_id`, `fee_amount`, `fee_date`, `status`, `approved_at`, `paid_at`, `notes`, `created_at`) VALUES (2, 'FEE-20260907-0002', 1, 2, 2, 2, 2, 2, 2, 450000, '2026-09-07', 'APPROVED', '2026-09-07 10:07:33', NULL, 'Fee tindakan khitan untuk Muhammad Orhan Ghazi El Hanan (dr. Muhammad Ali gufron)', '2026-09-07 05:38:42');
INSERT INTO `doctor_fee_transactions` (`id`, `fee_number`, `doctor_id`, `patient_id`, `booking_id`, `procedure_id`, `invoice_id`, `package_id`, `patient_category_id`, `fee_amount`, `fee_date`, `status`, `approved_at`, `paid_at`, `notes`, `created_at`) VALUES (3, 'FEE-20260907-0003', 1, 3, 3, 3, 3, 2, 2, 450000, '2026-09-07', 'APPROVED', '2026-09-07 10:07:35', NULL, 'Fee tindakan khitan untuk Muhammad Orhan Ghazi El Hanan (dr. Muhammad Ali gufron)', '2026-09-07 10:03:55');
INSERT INTO `doctor_fee_transactions` (`id`, `fee_number`, `doctor_id`, `patient_id`, `booking_id`, `procedure_id`, `invoice_id`, `package_id`, `patient_category_id`, `fee_amount`, `fee_date`, `status`, `approved_at`, `paid_at`, `notes`, `created_at`) VALUES (4, 'FEE-20260910-0004', 3, 4, 4, 4, 4, 2, 2, 380000, '2026-09-10', 'PENDING', NULL, NULL, 'Fee tindakan khitan untuk AL GHIFARI DAVIANSYAH (dr. Natsir Albukaoni)', '2026-09-10 02:15:26');
INSERT INTO `doctor_fee_transactions` (`id`, `fee_number`, `doctor_id`, `patient_id`, `booking_id`, `procedure_id`, `invoice_id`, `package_id`, `patient_category_id`, `fee_amount`, `fee_date`, `status`, `approved_at`, `paid_at`, `notes`, `created_at`) VALUES (5, 'FEE-20260910-0005', 1, 5, 5, 5, 5, 1, 1, 250000, '2026-09-10', 'PENDING', NULL, NULL, 'Fee tindakan khitan untuk Gilang Shodiq ramadhan (dr. Muhammad Ali gufron)', '2026-09-10 03:52:50');
/*!40000 ALTER TABLE `doctor_fee_transactions` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `expense_categories` (12 baris)
LOCK TABLES `expense_categories` WRITE;
/*!40000 ALTER TABLE `expense_categories` DISABLE KEYS */;
INSERT INTO `expense_categories` (`id`, `name`, `description`, `is_default`) VALUES (1, 'Fee Dokter', 'Beban pengeluaran kompensasi / fee dokter pelaksana tindakan', 1);
INSERT INTO `expense_categories` (`id`, `name`, `description`, `is_default`) VALUES (2, 'Pembelian Obat', 'Pengadaan obat anestesi, analgetik, dan salep perawatan luka', 1);
INSERT INTO `expense_categories` (`id`, `name`, `description`, `is_default`) VALUES (3, 'Alat Khitan', 'Pengadaan klem steril, ring, sealer, dan blade cauter', 1);
INSERT INTO `expense_categories` (`id`, `name`, `description`, `is_default`) VALUES (4, 'Perlengkapan', 'Kain kasa, handscoon steril, apron disposable, kassa alkohol', 1);
INSERT INTO `expense_categories` (`id`, `name`, `description`, `is_default`) VALUES (5, 'Gaji Staff', 'Gaji bulanan perawat asisten tindakan dan staff administrasi', 1);
INSERT INTO `expense_categories` (`id`, `name`, `description`, `is_default`) VALUES (6, 'Listrik & Air', 'Tagihan utilitas gedung klinik', 1);
INSERT INTO `expense_categories` (`id`, `name`, `description`, `is_default`) VALUES (7, 'Internet & Software', 'Koneksi internet dan server operasional', 1);
INSERT INTO `expense_categories` (`id`, `name`, `description`, `is_default`) VALUES (8, 'Sewa Tempat', 'Sewa ruko / klinik cabang', 1);
INSERT INTO `expense_categories` (`id`, `name`, `description`, `is_default`) VALUES (9, 'Marketing & Ads', 'Iklan Instagram, TikTok, Meta Ads & Google Ads', 1);
INSERT INTO `expense_categories` (`id`, `name`, `description`, `is_default`) VALUES (10, 'Transportasi', 'Bensin dan operasional logistik', 1);
INSERT INTO `expense_categories` (`id`, `name`, `description`, `is_default`) VALUES (11, 'Operasional Klinik', 'Snack pasien, kebersihan, tisu, dan perlengkapan harian', 1);
INSERT INTO `expense_categories` (`id`, `name`, `description`, `is_default`) VALUES (12, 'Lainnya', 'Pengeluaran rupa-rupa tidak terduga', 1);
/*!40000 ALTER TABLE `expense_categories` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `expense_transactions` (4 baris)
LOCK TABLES `expense_transactions` WRITE;
/*!40000 ALTER TABLE `expense_transactions` DISABLE KEYS */;
INSERT INTO `expense_transactions` (`id`, `transaction_number`, `expense_date`, `category_id`, `category_name`, `description`, `amount`, `payment_method`, `receipt_url`, `created_by`, `status`, `created_at`) VALUES (1, 'EXP-20260901-0001', '2026-09-01', 3, 'Alat Khitan', 'Restock 20 Set Klem Nano & Ring Steril Disposable', 3500000, 'TRANSFER', NULL, 'Admin', 'PAID', '2026-09-03 04:39:49');
INSERT INTO `expense_transactions` (`id`, `transaction_number`, `expense_date`, `category_id`, `category_name`, `description`, `amount`, `payment_method`, `receipt_url`, `created_by`, `status`, `created_at`) VALUES (2, 'EXP-20260901-0002', '2026-09-01', 2, 'Pembelian Obat', 'Pengadaan Ampul Anestesi Lokal & Salep Antibiotik Khusus', 1800000, 'TRANSFER', NULL, 'Admin', 'PAID', '2026-09-03 04:39:49');
INSERT INTO `expense_transactions` (`id`, `transaction_number`, `expense_date`, `category_id`, `category_name`, `description`, `amount`, `payment_method`, `receipt_url`, `created_by`, `status`, `created_at`) VALUES (3, 'EXP-20260902-0003', '2026-09-02', 9, 'Marketing & Ads', 'Iklan Meta & Instagram Story Kampanye Khitan Liburan', 1200000, 'DEBIT', NULL, 'Admin', 'PAID', '2026-09-03 04:39:49');
INSERT INTO `expense_transactions` (`id`, `transaction_number`, `expense_date`, `category_id`, `category_name`, `description`, `amount`, `payment_method`, `receipt_url`, `created_by`, `status`, `created_at`) VALUES (4, 'EXP-20260902-0004', '2026-09-02', 11, 'Operasional Klinik', 'Paket Snack Box Pasien VIP & Goodie Bag Anak', 650000, 'CASH', NULL, 'Staff', 'PAID', '2026-09-03 04:39:49');
/*!40000 ALTER TABLE `expense_transactions` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `follow_ups` (16 baris)
LOCK TABLES `follow_ups` WRITE;
/*!40000 ALTER TABLE `follow_ups` DISABLE KEYS */;
INSERT INTO `follow_ups` (`id`, `booking_id`, `procedure_id`, `patient_id`, `follow_up_type`, `scheduled_date`, `contact_date`, `staff_name`, `patient_condition`, `notes`, `status`, `created_at`) VALUES (2, 1, 1, 1, 'H+3', '2026-09-09', '2026-09-10', 'Administrator Klinik', NULL, 'Pemeriksaan pengeringan luka, kebersihan celana khitan, dan nafsu makan. [Notifikasi WA terkirim 10/9/2026]', 'CONTACTED', '2026-09-06 14:41:24');
INSERT INTO `follow_ups` (`id`, `booking_id`, `procedure_id`, `patient_id`, `follow_up_type`, `scheduled_date`, `contact_date`, `staff_name`, `patient_condition`, `notes`, `status`, `created_at`) VALUES (5, 2, 2, 2, 'H+3', '2026-09-10', '2026-09-10', 'Administrator Klinik', NULL, 'Pemeriksaan pengeringan luka, kebersihan celana khitan, dan nafsu makan.', 'CONTACTED', '2026-09-07 05:38:43');
INSERT INTO `follow_ups` (`id`, `booking_id`, `procedure_id`, `patient_id`, `follow_up_type`, `scheduled_date`, `contact_date`, `staff_name`, `patient_condition`, `notes`, `status`, `created_at`) VALUES (8, 3, 3, 3, 'H+3', '2026-09-10', '2026-09-10', 'Administrator Klinik', NULL, 'Pemeriksaan pengeringan luka, kebersihan celana khitan, dan nafsu makan.', 'CONTACTED', '2026-09-07 10:03:56');
INSERT INTO `follow_ups` (`id`, `booking_id`, `procedure_id`, `patient_id`, `follow_up_type`, `scheduled_date`, `contact_date`, `staff_name`, `patient_condition`, `notes`, `status`, `created_at`) VALUES (1, 1, 1, 1, 'H+1', '2026-09-07', '2026-09-10', 'Administrator Klinik', NULL, 'Konfirmasi rasa nyeri, pendarahan, dan kemampuan buang air kecil pasca 24 jam. [Notifikasi WA terkirim 10/9/2026]', 'CONTACTED', '2026-09-06 14:41:24');
INSERT INTO `follow_ups` (`id`, `booking_id`, `procedure_id`, `patient_id`, `follow_up_type`, `scheduled_date`, `contact_date`, `staff_name`, `patient_condition`, `notes`, `status`, `created_at`) VALUES (4, 2, 2, 2, 'H+1', '2026-09-08', '2026-09-10', 'Administrator Klinik', NULL, 'Konfirmasi rasa nyeri, pendarahan, dan kemampuan buang air kecil pasca 24 jam. [Notifikasi WA terkirim 10/9/2026]', 'CONTACTED', '2026-09-07 05:38:43');
INSERT INTO `follow_ups` (`id`, `booking_id`, `procedure_id`, `patient_id`, `follow_up_type`, `scheduled_date`, `contact_date`, `staff_name`, `patient_condition`, `notes`, `status`, `created_at`) VALUES (7, 3, 3, 3, 'H+1', '2026-09-08', '2026-09-10', 'Administrator Klinik', NULL, 'Konfirmasi rasa nyeri, pendarahan, dan kemampuan buang air kecil pasca 24 jam. [Notifikasi WA terkirim 10/9/2026]', 'CONTACTED', '2026-09-07 10:03:56');
INSERT INTO `follow_ups` (`id`, `booking_id`, `procedure_id`, `patient_id`, `follow_up_type`, `scheduled_date`, `contact_date`, `staff_name`, `patient_condition`, `notes`, `status`, `created_at`) VALUES (10, 4, 4, 4, 'H+1', '2026-09-11', '2026-09-10', 'Administrator Klinik', NULL, 'Konfirmasi rasa nyeri, pendarahan, dan kemampuan buang air kecil pasca 24 jam pertama. [Notifikasi WA terkirim 10/9/2026]', 'CONTACTED', '2026-09-10 02:15:26');
INSERT INTO `follow_ups` (`id`, `booking_id`, `procedure_id`, `patient_id`, `follow_up_type`, `scheduled_date`, `contact_date`, `staff_name`, `patient_condition`, `notes`, `status`, `created_at`) VALUES (3, 1, 1, 1, 'H+7', '2026-09-13', '2026-09-10', 'Administrator Klinik', NULL, 'Evaluasi kesembuhan total dan pelepasan pelindung sealer/ring. [Notifikasi WA terkirim 10/9/2026]', 'CONTACTED', '2026-09-06 14:41:24');
INSERT INTO `follow_ups` (`id`, `booking_id`, `procedure_id`, `patient_id`, `follow_up_type`, `scheduled_date`, `contact_date`, `staff_name`, `patient_condition`, `notes`, `status`, `created_at`) VALUES (11, 4, 4, 4, 'H+3', '2026-09-13', '2026-09-10', 'Administrator Klinik', NULL, 'Pemeriksaan pengeringan luka sealer, kebersihan celana khitan, dan perkembangan anak. [Notifikasi WA terkirim 10/9/2026]', 'CONTACTED', '2026-09-10 02:15:26');
INSERT INTO `follow_ups` (`id`, `booking_id`, `procedure_id`, `patient_id`, `follow_up_type`, `scheduled_date`, `contact_date`, `staff_name`, `patient_condition`, `notes`, `status`, `created_at`) VALUES (6, 2, 2, 2, 'H+7', '2026-09-14', '2026-09-10', 'Administrator Klinik', NULL, 'Evaluasi kesembuhan total dan pelepasan pelindung sealer/ring. [Notifikasi WA terkirim 10/9/2026]', 'CONTACTED', '2026-09-07 05:38:43');
INSERT INTO `follow_ups` (`id`, `booking_id`, `procedure_id`, `patient_id`, `follow_up_type`, `scheduled_date`, `contact_date`, `staff_name`, `patient_condition`, `notes`, `status`, `created_at`) VALUES (9, 3, 3, 3, 'H+7', '2026-09-14', '2026-09-10', 'Administrator Klinik', NULL, 'Evaluasi kesembuhan total dan pelepasan pelindung sealer/ring. [Notifikasi WA terkirim 10/9/2026]', 'CONTACTED', '2026-09-07 10:03:56');
INSERT INTO `follow_ups` (`id`, `booking_id`, `procedure_id`, `patient_id`, `follow_up_type`, `scheduled_date`, `contact_date`, `staff_name`, `patient_condition`, `notes`, `status`, `created_at`) VALUES (12, 4, 4, 4, 'H+7', '2026-09-17', '2026-09-10', 'Administrator Klinik', NULL, 'Follow up chat WA menanyakan perkembangan penyembuhan (Metode Glans Pro Bipolar selesai tanpa kontrol lepas alat). [Notifikasi WA terkirim 10/9/2026]', 'CONTACTED', '2026-09-10 02:15:26');
INSERT INTO `follow_ups` (`id`, `booking_id`, `procedure_id`, `patient_id`, `follow_up_type`, `scheduled_date`, `contact_date`, `staff_name`, `patient_condition`, `notes`, `status`, `created_at`) VALUES (13, 5, 5, 5, 'H+1', '2026-09-11', NULL, NULL, NULL, 'Konfirmasi rasa nyeri, pendarahan, dan kemampuan buang air kecil pasca 24 jam pertama.', 'PENDING', '2026-09-10 03:52:50');
INSERT INTO `follow_ups` (`id`, `booking_id`, `procedure_id`, `patient_id`, `follow_up_type`, `scheduled_date`, `contact_date`, `staff_name`, `patient_condition`, `notes`, `status`, `created_at`) VALUES (14, 5, 5, 5, 'H+3', '2026-09-13', NULL, NULL, NULL, 'Pemeriksaan kebersihan alat klem, persiapan kontrol lepas alat (H+5), dan kenyamanan anak.', 'PENDING', '2026-09-10 03:52:50');
INSERT INTO `follow_ups` (`id`, `booking_id`, `procedure_id`, `patient_id`, `follow_up_type`, `scheduled_date`, `contact_date`, `staff_name`, `patient_condition`, `notes`, `status`, `created_at`) VALUES (15, 5, 5, 5, 'H+5', '2026-09-15', NULL, NULL, NULL, 'Pemberitahuan kontrol lepas alat Nanoklemp di klinik (5 hari pasca tindakan).', 'PENDING', '2026-09-10 03:52:50');
INSERT INTO `follow_ups` (`id`, `booking_id`, `procedure_id`, `patient_id`, `follow_up_type`, `scheduled_date`, `contact_date`, `staff_name`, `patient_condition`, `notes`, `status`, `created_at`) VALUES (16, 5, 5, 5, 'H+7', '2026-09-17', NULL, NULL, NULL, 'Follow up chat WA evaluasi kesembuhan total pasca pelepasan alat klem di klinik.', 'PENDING', '2026-09-10 03:52:50');
/*!40000 ALTER TABLE `follow_ups` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `products` (14 baris)
LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` (`id`, `sku`, `name`, `category`, `unit`, `sell_price`, `cost_price`, `stock`, `min_stock`, `is_active`, `description`, `created_at`) VALUES (3, 'PRD-CLN-002', 'Celana Sunat Karakter Hero Premium', 'CELANA_SUNAT', 'pcs', 65000, 28000, 60, 15, 1, 'Celana sunat motif superhero pelindung tahan benturan', '2026-09-03 05:02:55');
INSERT INTO `products` (`id`, `sku`, `name`, `category`, `unit`, `sell_price`, `cost_price`, `stock`, `min_stock`, `is_active`, `description`, `created_at`) VALUES (7, 'PRD-MNN-002', 'Robot Action Figure Transformers Mini', 'MAINAN', 'pcs', 45000, 20000, 40, 10, 1, 'Mainan robotik favorit anak untuk motivasi setelah tindakan', '2026-09-03 05:02:55');
INSERT INTO `products` (`id`, `sku`, `name`, `category`, `unit`, `sell_price`, `cost_price`, `stock`, `min_stock`, `is_active`, `description`, `created_at`) VALUES (9, 'PRD-OTH-001', 'Kasa Steril & Waterproof Dressing Pack', 'LAINNYA', 'box', 40000, 18000, 45, 10, 1, 'Kasa pembalut steril tahan air khusus khitan', '2026-09-03 05:02:55');
INSERT INTO `products` (`id`, `sku`, `name`, `category`, `unit`, `sell_price`, `cost_price`, `stock`, `min_stock`, `is_active`, `description`, `created_at`) VALUES (10, 'PRD-TTS-143', 'Obat Tetes ( Antibiotic luar)', 'OBAT_TETES', 'tube', 90000, 25000, 20, 10, 1, '', '2026-09-05 01:15:02');
INSERT INTO `products` (`id`, `sku`, `name`, `category`, `unit`, `sell_price`, `cost_price`, `stock`, `min_stock`, `is_active`, `description`, `created_at`) VALUES (12, 'PRD-CLN-559', 'Paket Celana Sunat (3pcs 100k)', 'CELANA_SUNAT', 'paket', 100000, 75000, 20, 10, 1, '', '2026-09-05 01:17:05');
INSERT INTO `products` (`id`, `sku`, `name`, `category`, `unit`, `sell_price`, `cost_price`, `stock`, `min_stock`, `is_active`, `description`, `created_at`) VALUES (13, 'PRD-CLN-797', 'Celana Sunat Ecer', 'CELANA_SUNAT', 'pcs', 35000, 25000, 20, 10, 1, '', '2026-09-05 01:17:41');
INSERT INTO `products` (`id`, `sku`, `name`, `category`, `unit`, `sell_price`, `cost_price`, `stock`, `min_stock`, `is_active`, `description`, `created_at`) VALUES (1, 'PRD-TTS-001', 'Obat Tetes Khitan Spesial (Nano Drops)', 'OBAT_TETES', 'botol', 90000, 25000, 46, 10, 1, 'Obat tetes pemulihan luka khitan cepat kering dan anti-lengket', '2026-09-03 05:02:55');
INSERT INTO `products` (`id`, `sku`, `name`, `category`, `unit`, `sell_price`, `cost_price`, `stock`, `min_stock`, `is_active`, `description`, `created_at`) VALUES (14, 'PRD-OBT-292', 'Paket Obat Kapsul', 'OBAT', 'paket', 250000, 100000, 20, 10, 1, 'Paket obat pil ', '2026-09-06 14:34:53');
INSERT INTO `products` (`id`, `sku`, `name`, `category`, `unit`, `sell_price`, `cost_price`, `stock`, `min_stock`, `is_active`, `description`, `created_at`) VALUES (2, 'PRD-CLN-001', 'Celana Sunat Pelindung Tempurung Super', 'CELANA_SUNAT', 'pcs', 50000, 20000, 91, 20, 1, 'Celana sunat ergonomis dengan kubah pelindung berventilasi udara', '2026-09-03 05:02:55');
INSERT INTO `products` (`id`, `sku`, `name`, `category`, `unit`, `sell_price`, `cost_price`, `stock`, `min_stock`, `is_active`, `description`, `created_at`) VALUES (4, 'PRD-OBT-001', 'Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik)', 'OBAT', 'paket', 200000, 90000, 75, 15, 1, 'Paket obat minum pereda nyeri dan pencegah infeksi ramah anak', '2026-09-03 05:02:55');
INSERT INTO `products` (`id`, `sku`, `name`, `category`, `unit`, `sell_price`, `cost_price`, `stock`, `min_stock`, `is_active`, `description`, `created_at`) VALUES (11, 'PRD-OTH-954', 'GodiieBag Nano Special Edition', 'LAINNYA', 'box', 50000, 25000, 15, 10, 1, '', '2026-09-05 01:16:01');
INSERT INTO `products` (`id`, `sku`, `name`, `category`, `unit`, `sell_price`, `cost_price`, `stock`, `min_stock`, `is_active`, `description`, `created_at`) VALUES (8, 'PRD-AKS-001', 'Sertifikat', 'AKSESORIS', 'pcs', 30000, 12000, 55, 15, 1, 'Medali kehormatan berlogo klinik untuk kenang-kenangan', '2026-09-03 05:02:55');
INSERT INTO `products` (`id`, `sku`, `name`, `category`, `unit`, `sell_price`, `cost_price`, `stock`, `min_stock`, `is_active`, `description`, `created_at`) VALUES (5, 'PRD-OBT-002', 'Obat Spray (Antiseptic)', 'LAINNYA', 'tube', 75000, 35000, 35, 10, 1, 'Salep gel steril untuk mempercepat epitelisasi jaringan luka khitan', '2026-09-03 05:02:55');
INSERT INTO `products` (`id`, `sku`, `name`, `category`, `unit`, `sell_price`, `cost_price`, `stock`, `min_stock`, `is_active`, `description`, `created_at`) VALUES (6, 'PRD-MNN-001', 'Mobil Diecast Sport Hadiah Anak Berani', 'MAINAN', 'pcs', 35000, 15000, 0, 10, 1, 'Mainan hadiah pereda cemas dan apresiasi anak berani khitan', '2026-09-03 05:02:55');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `package_included_items` (24 baris)
LOCK TABLES `package_included_items` WRITE;
/*!40000 ALTER TABLE `package_included_items` DISABLE KEYS */;
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (1, 2, 1, 2, 1, 1, 'Termasuk dalam Paket Reguler: 1 pcs Celana Sunat', '2026-09-03 05:03:01');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (3, 1, 1, 2, 1, 1, 'Termasuk dalam Paket Reguler: 1 pcs Celana Sunat', '2026-09-03 05:03:01');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (5, 2, 1, 4, 1, 1, 'Termasuk dalam Paket Reguler: 1 paket Obat Oral Standar', '2026-09-03 05:03:01');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (7, 1, 1, 4, 1, 1, 'Termasuk dalam Paket Reguler: 1 paket Obat Oral Standar', '2026-09-03 05:03:01');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (9, 2, 2, 2, 2, 1, 'Termasuk dalam Paket VIP: 2 pcs Celana Sunat Pelindung', '2026-09-03 05:03:01');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (11, 1, 2, 2, 2, 1, 'Termasuk dalam Paket VIP: 2 pcs Celana Sunat Pelindung', '2026-09-03 05:03:01');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (13, 2, 2, 4, 1, 1, 'Termasuk dalam Paket VIP: 1 paket Obat Oral Standar', '2026-09-03 05:03:01');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (15, 1, 2, 4, 1, 1, 'Termasuk dalam Paket VIP: 1 paket Obat Oral Standar', '2026-09-03 05:03:01');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (17, 2, 1, 8, 1, 1, '', '2026-09-04 16:44:17');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (18, 1, 1, 11, 1, 1, '', '2026-09-05 03:34:17');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (19, 1, 1, 6, 1, 1, '', '2026-09-05 03:34:27');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (20, 1, 1, 8, 1, 1, '', '2026-09-05 03:34:42');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (22, 1, 1, 5, 1, 1, '', '2026-09-05 03:35:31');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (24, 1, 2, 11, 1, 1, '', '2026-09-05 03:35:52');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (23, 1, 2, 1, 1, 1, '', '2026-09-05 03:35:46');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (25, 1, 2, 8, 1, 1, '', '2026-09-05 03:35:58');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (21, 1, 2, 5, 1, 1, '', '2026-09-05 03:35:22');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (26, 2, 1, 11, 1, 1, '', '2026-09-05 03:37:45');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (27, 2, 1, 6, 1, 1, '', '2026-09-05 03:37:54');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (28, 2, 1, 5, 1, 1, '', '2026-09-05 03:38:03');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (29, 2, 2, 8, 1, 1, '', '2026-09-05 03:38:15');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (30, 2, 2, 11, 1, 1, '', '2026-09-05 03:38:30');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (31, 2, 2, 5, 1, 1, '', '2026-09-05 03:38:42');
INSERT INTO `package_included_items` (`id`, `package_id`, `patient_category_id`, `product_id`, `quantity`, `is_included`, `notes`, `created_at`) VALUES (32, 2, 2, 1, 1, 1, '', '2026-09-05 03:38:50');
/*!40000 ALTER TABLE `package_included_items` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `stock_movements` (45 baris)
LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (1, 'STK-INIT-PRD-TTS-001', 1, 'IN', 50, 0, 50, 45000, 90000, 'RESTOCK', NULL, 'Saldo awal master stok klinik', 'Apoteker / Admin', '2026-09-03 05:03:04');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (2, 'STK-INIT-PRD-CLN-001', 2, 'IN', 100, 0, 100, 20000, 50000, 'RESTOCK', NULL, 'Saldo awal master stok klinik', 'Apoteker / Admin', '2026-09-03 05:03:04');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (3, 'STK-INIT-PRD-CLN-002', 3, 'IN', 60, 0, 60, 28000, 65000, 'RESTOCK', NULL, 'Saldo awal master stok klinik', 'Apoteker / Admin', '2026-09-03 05:03:04');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (4, 'STK-INIT-PRD-OBT-001', 4, 'IN', 80, 0, 80, 55000, 120000, 'RESTOCK', NULL, 'Saldo awal master stok klinik', 'Apoteker / Admin', '2026-09-03 05:03:04');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (5, 'STK-INIT-PRD-OBT-002', 5, 'IN', 40, 0, 40, 35000, 75000, 'RESTOCK', NULL, 'Saldo awal master stok klinik', 'Apoteker / Admin', '2026-09-03 05:03:04');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (6, 'STK-INIT-PRD-MNN-001', 6, 'IN', 50, 0, 50, 15000, 35000, 'RESTOCK', NULL, 'Saldo awal master stok klinik', 'Apoteker / Admin', '2026-09-03 05:03:04');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (7, 'STK-INIT-PRD-MNN-002', 7, 'IN', 40, 0, 40, 20000, 45000, 'RESTOCK', NULL, 'Saldo awal master stok klinik', 'Apoteker / Admin', '2026-09-03 05:03:04');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (8, 'STK-INIT-PRD-AKS-001', 8, 'IN', 60, 0, 60, 12000, 30000, 'RESTOCK', NULL, 'Saldo awal master stok klinik', 'Apoteker / Admin', '2026-09-03 05:03:04');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (9, 'STK-INIT-PRD-OTH-001', 9, 'IN', 45, 0, 45, 18000, 40000, 'RESTOCK', NULL, 'Saldo awal master stok klinik', 'Apoteker / Admin', '2026-09-03 05:03:04');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (10, 'STK-20260905-8372', 10, 'IN', 20, 0, 20, 25000, 90000, 'RESTOCK', NULL, 'Saldo stok awal saat produk baru didaftarkan', 'Administrator Klinik', '2026-09-05 01:15:02');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (11, 'STK-20260905-6673', 11, 'IN', 20, 0, 20, 25000, 50000, 'RESTOCK', NULL, 'Saldo stok awal saat produk baru didaftarkan', 'Administrator Klinik', '2026-09-05 01:16:01');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (12, 'STK-20260905-4364', 12, 'IN', 20, 0, 20, 75000, 100000, 'RESTOCK', NULL, 'Saldo stok awal saat produk baru didaftarkan', 'Administrator Klinik', '2026-09-05 01:17:05');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (13, 'STK-20260905-1685', 13, 'IN', 20, 0, 20, 25000, 35000, 'RESTOCK', NULL, 'Saldo stok awal saat produk baru didaftarkan', 'Administrator Klinik', '2026-09-05 01:17:41');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (45, 'STK-20260906-6928', 14, 'IN', 20, 0, 20, 100000, 250000, 'RESTOCK', NULL, 'Saldo stok awal saat produk baru didaftarkan', 'Administrator Klinik', '2026-09-06 14:34:54');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (46, 'STK-20260906-8305', 1, 'OUT', -1, 50, 49, 25000, 0, 'PROCEDURE_INCLUDED', 1, '[INCLUDED] Obat Tetes Khitan Spesial (Nano Drops) (1 botol) - Pasien izzam alvaro', 'Administrator Klinik', '2026-09-06 14:41:24');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (47, 'STK-20260906-3417', 2, 'OUT', -2, 100, 98, 20000, 0, 'PROCEDURE_INCLUDED', 1, '[INCLUDED] Celana Sunat Pelindung Tempurung Super (2 pcs) - Pasien izzam alvaro', 'Administrator Klinik', '2026-09-06 14:41:25');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (48, 'STK-20260906-1569', 4, 'OUT', -1, 80, 79, 90000, 0, 'PROCEDURE_INCLUDED', 1, '[INCLUDED] Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik) (1 paket) - Pasien izzam alvaro', 'Administrator Klinik', '2026-09-06 14:41:25');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (49, 'STK-20260906-9422', 8, 'OUT', -1, 60, 59, 12000, 0, 'PROCEDURE_INCLUDED', 1, '[INCLUDED] Sertifikat (1 pcs) - Pasien izzam alvaro', 'Administrator Klinik', '2026-09-06 14:41:25');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (50, 'STK-20260906-7783', 11, 'OUT', -1, 20, 19, 25000, 0, 'PROCEDURE_INCLUDED', 1, '[INCLUDED] GodiieBag Nano Special Edition (1 box) - Pasien izzam alvaro', 'Administrator Klinik', '2026-09-06 14:41:25');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (51, 'STK-20260906-4691', 5, 'OUT', -1, 40, 39, 35000, 0, 'PROCEDURE_INCLUDED', 1, '[INCLUDED] Obat Spray (Antiseptic) (1 tube) - Pasien izzam alvaro', 'Administrator Klinik', '2026-09-06 14:41:25');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (52, 'STK-20260907-7806', 2, 'OUT', -2, 98, 96, 20000, 0, 'PROCEDURE_INCLUDED', 2, '[INCLUDED] Celana Sunat Pelindung Tempurung Super (2 pcs) - Pasien Muhammad Orhan Ghazi El Hanan', 'Administrator Klinik', '2026-09-07 05:38:43');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (53, 'STK-20260907-1868', 4, 'OUT', -1, 79, 78, 90000, 0, 'PROCEDURE_INCLUDED', 2, '[INCLUDED] Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik) (1 paket) - Pasien Muhammad Orhan Ghazi El Hanan', 'Administrator Klinik', '2026-09-07 05:38:43');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (54, 'STK-20260907-5632', 8, 'OUT', -1, 59, 58, 12000, 0, 'PROCEDURE_INCLUDED', 2, '[INCLUDED] Sertifikat (1 pcs) - Pasien Muhammad Orhan Ghazi El Hanan', 'Administrator Klinik', '2026-09-07 05:38:44');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (55, 'STK-20260907-5390', 11, 'OUT', -1, 19, 18, 25000, 0, 'PROCEDURE_INCLUDED', 2, '[INCLUDED] GodiieBag Nano Special Edition (1 box) - Pasien Muhammad Orhan Ghazi El Hanan', 'Administrator Klinik', '2026-09-07 05:38:44');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (56, 'STK-20260907-4511', 5, 'OUT', -1, 39, 38, 35000, 0, 'PROCEDURE_INCLUDED', 2, '[INCLUDED] Obat Spray (Antiseptic) (1 tube) - Pasien Muhammad Orhan Ghazi El Hanan', 'Administrator Klinik', '2026-09-07 05:38:44');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (57, 'STK-20260907-9288', 1, 'OUT', -1, 49, 48, 25000, 0, 'PROCEDURE_INCLUDED', 2, '[INCLUDED] Obat Tetes Khitan Spesial (Nano Drops) (1 botol) - Pasien Muhammad Orhan Ghazi El Hanan', 'Administrator Klinik', '2026-09-07 05:38:44');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (58, 'STK-20260907-2101', 2, 'OUT', -2, 96, 94, 20000, 0, 'PROCEDURE_INCLUDED', 3, '[INCLUDED] Celana Sunat Pelindung Tempurung Super (2 pcs) - Pasien Muhammad Orhan Ghazi El Hanan', 'Administrator Klinik', '2026-09-07 10:03:56');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (59, 'STK-20260907-3052', 4, 'OUT', -1, 78, 77, 90000, 0, 'PROCEDURE_INCLUDED', 3, '[INCLUDED] Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik) (1 paket) - Pasien Muhammad Orhan Ghazi El Hanan', 'Administrator Klinik', '2026-09-07 10:03:56');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (60, 'STK-20260907-6881', 8, 'OUT', -1, 58, 57, 12000, 0, 'PROCEDURE_INCLUDED', 3, '[INCLUDED] Sertifikat (1 pcs) - Pasien Muhammad Orhan Ghazi El Hanan', 'Administrator Klinik', '2026-09-07 10:03:57');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (61, 'STK-20260907-2832', 11, 'OUT', -1, 18, 17, 25000, 0, 'PROCEDURE_INCLUDED', 3, '[INCLUDED] GodiieBag Nano Special Edition (1 box) - Pasien Muhammad Orhan Ghazi El Hanan', 'Administrator Klinik', '2026-09-07 10:03:57');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (62, 'STK-20260907-6448', 5, 'OUT', -1, 38, 37, 35000, 0, 'PROCEDURE_INCLUDED', 3, '[INCLUDED] Obat Spray (Antiseptic) (1 tube) - Pasien Muhammad Orhan Ghazi El Hanan', 'Administrator Klinik', '2026-09-07 10:03:57');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (63, 'STK-20260907-2546', 1, 'OUT', -1, 48, 47, 25000, 0, 'PROCEDURE_INCLUDED', 3, '[INCLUDED] Obat Tetes Khitan Spesial (Nano Drops) (1 botol) - Pasien Muhammad Orhan Ghazi El Hanan', 'Administrator Klinik', '2026-09-07 10:03:57');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (64, 'STK-20260910-6031', 2, 'OUT', -2, 94, 92, 20000, 0, 'PROCEDURE_INCLUDED', 4, '[INCLUDED] Celana Sunat Pelindung Tempurung Super (2 pcs) - Pasien AL GHIFARI DAVIANSYAH', 'Administrator Klinik', '2026-09-10 02:15:27');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (65, 'STK-20260910-3449', 4, 'OUT', -1, 77, 76, 90000, 0, 'PROCEDURE_INCLUDED', 4, '[INCLUDED] Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik) (1 paket) - Pasien AL GHIFARI DAVIANSYAH', 'Administrator Klinik', '2026-09-10 02:15:27');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (66, 'STK-20260910-4443', 8, 'OUT', -1, 57, 56, 12000, 0, 'PROCEDURE_INCLUDED', 4, '[INCLUDED] Sertifikat (1 pcs) - Pasien AL GHIFARI DAVIANSYAH', 'Administrator Klinik', '2026-09-10 02:15:27');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (67, 'STK-20260910-9350', 11, 'OUT', -1, 17, 16, 25000, 0, 'PROCEDURE_INCLUDED', 4, '[INCLUDED] GodiieBag Nano Special Edition (1 box) - Pasien AL GHIFARI DAVIANSYAH', 'Administrator Klinik', '2026-09-10 02:15:27');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (68, 'STK-20260910-9834', 5, 'OUT', -1, 37, 36, 35000, 0, 'PROCEDURE_INCLUDED', 4, '[INCLUDED] Obat Spray (Antiseptic) (1 tube) - Pasien AL GHIFARI DAVIANSYAH', 'Administrator Klinik', '2026-09-10 02:15:27');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (69, 'STK-20260910-5787', 1, 'OUT', -1, 47, 46, 25000, 0, 'PROCEDURE_INCLUDED', 4, '[INCLUDED] Obat Tetes Khitan Spesial (Nano Drops) (1 botol) - Pasien AL GHIFARI DAVIANSYAH', 'Administrator Klinik', '2026-09-10 02:15:28');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (70, 'STK-20260910-9504', 2, 'OUT', -1, 92, 91, 20000, 0, 'PROCEDURE_INCLUDED', 5, '[INCLUDED] Celana Sunat Pelindung Tempurung Super (1 pcs) - Pasien Gilang Shodiq ramadhan', 'Administrator Klinik', '2026-09-10 03:52:50');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (71, 'STK-20260910-2178', 4, 'OUT', -1, 76, 75, 90000, 0, 'PROCEDURE_INCLUDED', 5, '[INCLUDED] Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik) (1 paket) - Pasien Gilang Shodiq ramadhan', 'Administrator Klinik', '2026-09-10 03:52:51');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (72, 'STK-20260910-7526', 11, 'OUT', -1, 16, 15, 25000, 0, 'PROCEDURE_INCLUDED', 5, '[INCLUDED] GodiieBag Nano Special Edition (1 box) - Pasien Gilang Shodiq ramadhan', 'Administrator Klinik', '2026-09-10 03:52:51');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (73, 'STK-20260910-9768', 6, 'OUT', -1, 50, 49, 15000, 0, 'PROCEDURE_INCLUDED', 5, '[INCLUDED] Mobil Diecast Sport Hadiah Anak Berani (1 pcs) - Pasien Gilang Shodiq ramadhan', 'Administrator Klinik', '2026-09-10 03:52:51');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (74, 'STK-20260910-1323', 8, 'OUT', -1, 56, 55, 12000, 0, 'PROCEDURE_INCLUDED', 5, '[INCLUDED] Sertifikat (1 pcs) - Pasien Gilang Shodiq ramadhan', 'Administrator Klinik', '2026-09-10 03:52:51');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (75, 'STK-20260910-5448', 5, 'OUT', -1, 36, 35, 35000, 0, 'PROCEDURE_INCLUDED', 5, '[INCLUDED] Obat Spray (Antiseptic) (1 tube) - Pasien Gilang Shodiq ramadhan', 'Administrator Klinik', '2026-09-10 03:52:51');
INSERT INTO `stock_movements` (`id`, `movement_number`, `product_id`, `movement_type`, `quantity`, `previous_stock`, `current_stock`, `unit_cost`, `unit_price`, `reference_type`, `reference_id`, `notes`, `performed_by`, `created_at`) VALUES (76, 'STK-20260910-8394', 6, 'OUT', -49, 49, 0, 15000, 35000, 'ADJUSTMENT', NULL, 'Restock / penerimaan barang baru dari supplier', 'Administrator Klinik', '2026-09-10 03:55:25');
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `transaction_items` (30 baris)
LOCK TABLES `transaction_items` WRITE;
/*!40000 ALTER TABLE `transaction_items` DISABLE KEYS */;
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (6, 1, 1, 1, 1, 'PRD-TTS-001', 'Obat Tetes Khitan Spesial (Nano Drops)', 'OBAT_TETES', 'INCLUDED', 1, 25000, 0, 0, 0, 1, '2026-09-06 14:41:23', 'Termasuk dalam paket khitan', '2026-09-06 14:39:19');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (1, 1, 1, 1, 2, 'PRD-CLN-001', 'Celana Sunat Pelindung Tempurung Super', 'CELANA_SUNAT', 'INCLUDED', 2, 20000, 0, 0, 0, 1, '2026-09-06 14:41:23', 'Termasuk dalam Paket VIP: 2 pcs Celana Sunat Pelindung', '2026-09-06 14:39:18');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (2, 1, 1, 1, 4, 'PRD-OBT-001', 'Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik)', 'OBAT', 'INCLUDED', 1, 90000, 0, 0, 0, 1, '2026-09-06 14:41:23', 'Termasuk dalam Paket VIP: 1 paket Obat Oral Standar', '2026-09-06 14:39:19');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (3, 1, 1, 1, 8, 'PRD-AKS-001', 'Sertifikat', 'AKSESORIS', 'INCLUDED', 1, 12000, 0, 0, 0, 1, '2026-09-06 14:41:23', 'Termasuk dalam paket khitan', '2026-09-06 14:39:19');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (4, 1, 1, 1, 11, 'PRD-OTH-954', 'GodiieBag Nano Special Edition', 'LAINNYA', 'INCLUDED', 1, 25000, 0, 0, 0, 1, '2026-09-06 14:41:23', 'Termasuk dalam paket khitan', '2026-09-06 14:39:19');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (5, 1, 1, 1, 5, 'PRD-OBT-002', 'Obat Spray (Antiseptic)', 'LAINNYA', 'INCLUDED', 1, 35000, 0, 0, 0, 1, '2026-09-06 14:41:23', 'Termasuk dalam paket khitan', '2026-09-06 14:39:19');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (7, 2, 2, 2, 2, 'PRD-CLN-001', 'Celana Sunat Pelindung Tempurung Super', 'CELANA_SUNAT', 'INCLUDED', 2, 20000, 0, 0, 0, 1, '2026-09-07 05:38:42', 'Termasuk dalam Paket VIP: 2 pcs Celana Sunat Pelindung', '2026-09-07 05:38:09');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (8, 2, 2, 2, 4, 'PRD-OBT-001', 'Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik)', 'OBAT', 'INCLUDED', 1, 90000, 0, 0, 0, 1, '2026-09-07 05:38:42', 'Termasuk dalam Paket VIP: 1 paket Obat Oral Standar', '2026-09-07 05:38:09');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (9, 2, 2, 2, 8, 'PRD-AKS-001', 'Sertifikat', 'AKSESORIS', 'INCLUDED', 1, 12000, 0, 0, 0, 1, '2026-09-07 05:38:42', 'Termasuk dalam paket khitan', '2026-09-07 05:38:09');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (10, 2, 2, 2, 11, 'PRD-OTH-954', 'GodiieBag Nano Special Edition', 'LAINNYA', 'INCLUDED', 1, 25000, 0, 0, 0, 1, '2026-09-07 05:38:42', 'Termasuk dalam paket khitan', '2026-09-07 05:38:09');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (11, 2, 2, 2, 5, 'PRD-OBT-002', 'Obat Spray (Antiseptic)', 'LAINNYA', 'INCLUDED', 1, 35000, 0, 0, 0, 1, '2026-09-07 05:38:42', 'Termasuk dalam paket khitan', '2026-09-07 05:38:09');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (12, 2, 2, 2, 1, 'PRD-TTS-001', 'Obat Tetes Khitan Spesial (Nano Drops)', 'OBAT_TETES', 'INCLUDED', 1, 25000, 0, 0, 0, 1, '2026-09-07 05:38:42', 'Termasuk dalam paket khitan', '2026-09-07 05:38:09');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (13, 3, 3, 3, 2, 'PRD-CLN-001', 'Celana Sunat Pelindung Tempurung Super', 'CELANA_SUNAT', 'INCLUDED', 2, 20000, 0, 0, 0, 1, '2026-09-07 10:03:55', 'Termasuk dalam Paket VIP: 2 pcs Celana Sunat Pelindung', '2026-09-07 10:03:03');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (14, 3, 3, 3, 4, 'PRD-OBT-001', 'Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik)', 'OBAT', 'INCLUDED', 1, 90000, 0, 0, 0, 1, '2026-09-07 10:03:55', 'Termasuk dalam Paket VIP: 1 paket Obat Oral Standar', '2026-09-07 10:03:03');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (15, 3, 3, 3, 8, 'PRD-AKS-001', 'Sertifikat', 'AKSESORIS', 'INCLUDED', 1, 12000, 0, 0, 0, 1, '2026-09-07 10:03:55', 'Termasuk dalam paket khitan', '2026-09-07 10:03:03');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (16, 3, 3, 3, 11, 'PRD-OTH-954', 'GodiieBag Nano Special Edition', 'LAINNYA', 'INCLUDED', 1, 25000, 0, 0, 0, 1, '2026-09-07 10:03:55', 'Termasuk dalam paket khitan', '2026-09-07 10:03:03');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (17, 3, 3, 3, 5, 'PRD-OBT-002', 'Obat Spray (Antiseptic)', 'LAINNYA', 'INCLUDED', 1, 35000, 0, 0, 0, 1, '2026-09-07 10:03:55', 'Termasuk dalam paket khitan', '2026-09-07 10:03:03');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (18, 3, 3, 3, 1, 'PRD-TTS-001', 'Obat Tetes Khitan Spesial (Nano Drops)', 'OBAT_TETES', 'INCLUDED', 1, 25000, 0, 0, 0, 1, '2026-09-07 10:03:55', 'Termasuk dalam paket khitan', '2026-09-07 10:03:03');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (19, 4, 4, 4, 2, 'PRD-CLN-001', 'Celana Sunat Pelindung Tempurung Super', 'CELANA_SUNAT', 'INCLUDED', 2, 20000, 0, 0, 0, 1, '2026-09-10 02:15:25', 'Termasuk dalam Paket VIP: 2 pcs Celana Sunat Pelindung', '2026-09-10 02:14:26');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (20, 4, 4, 4, 4, 'PRD-OBT-001', 'Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik)', 'OBAT', 'INCLUDED', 1, 90000, 0, 0, 0, 1, '2026-09-10 02:15:25', 'Termasuk dalam Paket VIP: 1 paket Obat Oral Standar', '2026-09-10 02:14:26');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (21, 4, 4, 4, 8, 'PRD-AKS-001', 'Sertifikat', 'AKSESORIS', 'INCLUDED', 1, 12000, 0, 0, 0, 1, '2026-09-10 02:15:25', 'Termasuk dalam paket khitan', '2026-09-10 02:14:26');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (22, 4, 4, 4, 11, 'PRD-OTH-954', 'GodiieBag Nano Special Edition', 'LAINNYA', 'INCLUDED', 1, 25000, 0, 0, 0, 1, '2026-09-10 02:15:25', 'Termasuk dalam paket khitan', '2026-09-10 02:14:26');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (23, 4, 4, 4, 5, 'PRD-OBT-002', 'Obat Spray (Antiseptic)', 'LAINNYA', 'INCLUDED', 1, 35000, 0, 0, 0, 1, '2026-09-10 02:15:25', 'Termasuk dalam paket khitan', '2026-09-10 02:14:26');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (24, 4, 4, 4, 1, 'PRD-TTS-001', 'Obat Tetes Khitan Spesial (Nano Drops)', 'OBAT_TETES', 'INCLUDED', 1, 25000, 0, 0, 0, 1, '2026-09-10 02:15:25', 'Termasuk dalam paket khitan', '2026-09-10 02:14:26');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (25, 5, 5, 5, 2, 'PRD-CLN-001', 'Celana Sunat Pelindung Tempurung Super', 'CELANA_SUNAT', 'INCLUDED', 1, 20000, 0, 0, 0, 1, '2026-09-10 03:52:49', 'Termasuk dalam Paket Reguler: 1 pcs Celana Sunat', '2026-09-10 03:52:18');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (26, 5, 5, 5, 4, 'PRD-OBT-001', 'Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik)', 'OBAT', 'INCLUDED', 1, 90000, 0, 0, 0, 1, '2026-09-10 03:52:49', 'Termasuk dalam Paket Reguler: 1 paket Obat Oral Standar', '2026-09-10 03:52:18');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (27, 5, 5, 5, 11, 'PRD-OTH-954', 'GodiieBag Nano Special Edition', 'LAINNYA', 'INCLUDED', 1, 25000, 0, 0, 0, 1, '2026-09-10 03:52:49', 'Termasuk dalam paket khitan', '2026-09-10 03:52:18');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (28, 5, 5, 5, 6, 'PRD-MNN-001', 'Mobil Diecast Sport Hadiah Anak Berani', 'MAINAN', 'INCLUDED', 1, 15000, 0, 0, 0, 1, '2026-09-10 03:52:49', 'Termasuk dalam paket khitan', '2026-09-10 03:52:18');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (29, 5, 5, 5, 8, 'PRD-AKS-001', 'Sertifikat', 'AKSESORIS', 'INCLUDED', 1, 12000, 0, 0, 0, 1, '2026-09-10 03:52:49', 'Termasuk dalam paket khitan', '2026-09-10 03:52:18');
INSERT INTO `transaction_items` (`id`, `booking_id`, `procedure_id`, `invoice_id`, `product_id`, `product_sku`, `product_name`, `category`, `item_type`, `quantity`, `cost_price_snapshot`, `sell_price_snapshot`, `discount_amount`, `total_amount`, `is_stock_deducted`, `deducted_at`, `notes`, `created_at`) VALUES (30, 5, 5, 5, 5, 'PRD-OBT-002', 'Obat Spray (Antiseptic)', 'LAINNYA', 'INCLUDED', 1, 35000, 0, 0, 0, 1, '2026-09-10 03:52:49', 'Termasuk dalam paket khitan', '2026-09-10 03:52:18');
/*!40000 ALTER TABLE `transaction_items` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `employees` (4 baris)
LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` (`id`, `employee_code`, `name`, `position`, `phone`, `email`, `start_date`, `basic_salary`, `default_patient_fee`, `closing_fee_per_patient`, `overtime_hourly_rate`, `is_active`, `is_deleted`, `description`, `notes`, `created_at`) VALUES (2, 'EMP-002', 'Ns. Tri Wahyuni, A.Md.Kep', 'Perawat Khitan & Asisten Medis', '0813-4455-6677', 'tri.wahyuni@nanocircumcision.com', '2024-03-01', 3200000, 20000, 25000, 35000, 0, 1, NULL, 'Asisten tindakan dan penanggung jawab sterilisasi instrumen', '2026-09-04 01:30:56');
INSERT INTO `employees` (`id`, `employee_code`, `name`, `position`, `phone`, `email`, `start_date`, `basic_salary`, `default_patient_fee`, `closing_fee_per_patient`, `overtime_hourly_rate`, `is_active`, `is_deleted`, `description`, `notes`, `created_at`) VALUES (4, 'EMP-004', 'Budi Santoso', 'Teknisi Logistik & Sterilisasi', '0815-6677-8899', 'budi.santoso@nanocircumcision.com', '2024-05-01', 2800000, 5000, 25000, 35000, 0, 1, NULL, 'Pengelolaan inventaris obat, klem, dan sterilisasi', '2026-09-04 01:30:56');
INSERT INTO `employees` (`id`, `employee_code`, `name`, `position`, `phone`, `email`, `start_date`, `basic_salary`, `default_patient_fee`, `closing_fee_per_patient`, `overtime_hourly_rate`, `is_active`, `is_deleted`, `description`, `notes`, `created_at`) VALUES (5, 'EMP-005', 'Novian Tri Andhika', 'Administrasi & Logistik', '085331309822', '', '2026-09-04', 1800000, 20000, 30000, 15000, 1, 0, '', '', '2026-09-04 01:44:04');
INSERT INTO `employees` (`id`, `employee_code`, `name`, `position`, `phone`, `email`, `start_date`, `basic_salary`, `default_patient_fee`, `closing_fee_per_patient`, `overtime_hourly_rate`, `is_active`, `is_deleted`, `description`, `notes`, `created_at`) VALUES (1, 'EMP-001', 'Ns. Athour , S.Kep', 'Perawat Khitan & Asisten Medis Utama', '0812-3344-5566', 'ahmad.fauzi@nanocircumcision.com', '2024-01-15', 2000000, 25000, 30000, 15000, 1, 0, '', 'Asisten tindakan khitan senior bersertifikat', '2026-09-04 01:30:56');
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `employee_fee_transactions` (6 baris)
LOCK TABLES `employee_fee_transactions` WRITE;
/*!40000 ALTER TABLE `employee_fee_transactions` DISABLE KEYS */;
INSERT INTO `employee_fee_transactions` (`id`, `fee_number`, `employee_id`, `employee_name`, `patient_id`, `patient_rm`, `patient_name`, `booking_id`, `procedure_id`, `procedure_date`, `fee_amount`, `status`, `payroll_id`, `paid_at`, `notes`, `created_at`) VALUES (3, 'EFEE-20260907-0003', 1, 'Ns. Athour , S.Kep', 3, 'RM-2026-000003', 'Muhammad Orhan Ghazi El Hanan', 3, 3, '2026-09-07', 25000, 'INCLUDED_IN_PAYROLL', 12, NULL, 'Fee asisten tindakan khitan pasien Muhammad Orhan Ghazi El Hanan (RM-2026-000003)', '2026-09-07 10:03:56');
INSERT INTO `employee_fee_transactions` (`id`, `fee_number`, `employee_id`, `employee_name`, `patient_id`, `patient_rm`, `patient_name`, `booking_id`, `procedure_id`, `procedure_date`, `fee_amount`, `status`, `payroll_id`, `paid_at`, `notes`, `created_at`) VALUES (2, 'EFEE-20260907-0002', 1, 'Ns. Athour , S.Kep', 2, 'RM-2026-000002', 'Muhammad Orhan Ghazi El Hanan', 2, 2, '2026-09-07', 25000, 'INCLUDED_IN_PAYROLL', 12, NULL, 'Fee asisten tindakan khitan pasien Muhammad Orhan Ghazi El Hanan (RM-2026-000002)', '2026-09-07 05:38:43');
INSERT INTO `employee_fee_transactions` (`id`, `fee_number`, `employee_id`, `employee_name`, `patient_id`, `patient_rm`, `patient_name`, `booking_id`, `procedure_id`, `procedure_date`, `fee_amount`, `status`, `payroll_id`, `paid_at`, `notes`, `created_at`) VALUES (4, 'EFEE-20260910-0001', 1, 'Ns. Athour , S.Kep', 4, 'RM-2026-000004', 'AL GHIFARI DAVIANSYAH', 4, 4, '2026-09-10', 25000, 'PENDING', NULL, NULL, 'Fee asisten tindakan khitan pasien AL GHIFARI DAVIANSYAH (RM-2026-000004)', '2026-09-10 02:15:26');
INSERT INTO `employee_fee_transactions` (`id`, `fee_number`, `employee_id`, `employee_name`, `patient_id`, `patient_rm`, `patient_name`, `booking_id`, `procedure_id`, `procedure_date`, `fee_amount`, `status`, `payroll_id`, `paid_at`, `notes`, `created_at`) VALUES (5, 'EFEE-20260910-0002', 5, 'Novian Tri Andhika', 4, 'RM-2026-000004', 'AL GHIFARI DAVIANSYAH', 4, 4, '2026-09-10', 20000, 'PENDING', NULL, NULL, 'Fee asisten tindakan khitan pasien AL GHIFARI DAVIANSYAH (RM-2026-000004)', '2026-09-10 02:15:26');
INSERT INTO `employee_fee_transactions` (`id`, `fee_number`, `employee_id`, `employee_name`, `patient_id`, `patient_rm`, `patient_name`, `booking_id`, `procedure_id`, `procedure_date`, `fee_amount`, `status`, `payroll_id`, `paid_at`, `notes`, `created_at`) VALUES (6, 'EFEE-20260910-0003', 5, 'Novian Tri Andhika', 5, 'RM-2026-000005', 'Gilang Shodiq ramadhan', 5, 5, '2026-09-10', 20000, 'PENDING', NULL, NULL, 'Fee asisten tindakan khitan pasien Gilang Shodiq ramadhan (RM-2026-000005)', '2026-09-10 03:52:50');
INSERT INTO `employee_fee_transactions` (`id`, `fee_number`, `employee_id`, `employee_name`, `patient_id`, `patient_rm`, `patient_name`, `booking_id`, `procedure_id`, `procedure_date`, `fee_amount`, `status`, `payroll_id`, `paid_at`, `notes`, `created_at`) VALUES (1, 'EFEE-20260906-0001', 5, 'Novian Tri Andhika', 1, 'RM-2026-000001', 'izzam alvaro', 1, 1, '2026-09-06', 20000, 'INCLUDED_IN_PAYROLL', 11, NULL, 'Fee asisten tindakan khitan pasien izzam alvaro (RM-2026-000001)', '2026-09-06 14:41:24');
/*!40000 ALTER TABLE `employee_fee_transactions` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `payrolls` (2 baris)
LOCK TABLES `payrolls` WRITE;
/*!40000 ALTER TABLE `payrolls` DISABLE KEYS */;
INSERT INTO `payrolls` (`id`, `payroll_number`, `employee_id`, `employee_name`, `period_month`, `period_year`, `payment_date`, `basic_salary`, `patient_fee_total`, `patient_count`, `closing_patient_count`, `closing_fee_per_patient`, `closing_fee_total`, `overtime_hours`, `overtime_hourly_rate`, `overtime_total`, `bonus_amount`, `deduction_amount`, `net_salary`, `payment_method`, `status`, `notes`, `paid_at`, `processed_by`, `created_at`) VALUES (11, 'PAYROLL-202609-003', 5, 'Novian Tri Andhika', '2026-09', 2026, '2026-09-07', 1800000, 20000, 1, 0, 25000, 0, 0, 35000, 0, 0, 0, 1820000, 'TRANSFER', 'DRAFT', 'Penggajian periode 2026-09', NULL, 'Administrator Nano Circumcision', '2026-09-07 10:41:21');
INSERT INTO `payrolls` (`id`, `payroll_number`, `employee_id`, `employee_name`, `period_month`, `period_year`, `payment_date`, `basic_salary`, `patient_fee_total`, `patient_count`, `closing_patient_count`, `closing_fee_per_patient`, `closing_fee_total`, `overtime_hours`, `overtime_hourly_rate`, `overtime_total`, `bonus_amount`, `deduction_amount`, `net_salary`, `payment_method`, `status`, `notes`, `paid_at`, `processed_by`, `created_at`) VALUES (12, 'PAYROLL-202609-004', 1, 'Ns. Athour , S.Kep', '2026-09', 2026, '2026-09-07', 2000000, 50000, 2, 2, 30000, 60000, 4, 15000, 60000, 0, 0, 2170000, 'TRANSFER', 'DRAFT', 'Penggajian periode 2026-09', NULL, 'Administrator Nano Circumcision', '2026-09-07 10:41:21');
/*!40000 ALTER TABLE `payrolls` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data untuk tabel `audit_logs` (239 baris)
LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (1, 'CREATE', 'PATIENT', 'RM-2026-000006', 'admin@nanocircumcision.com', 'Pasien baru: Roxy Febrian ', '2026-09-03 04:53:25');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (2, 'CREATE', 'BOOKING', 'BOOK-20260903-0005', 'admin@nanocircumcision.com', 'Booking baru pasien 6 total Rp 2400000', '2026-09-03 04:54:22');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (3, 'CHECKIN', 'QUEUE', 'K-001', 'admin@nanocircumcision.com', 'Pasien antrean K-001', '2026-09-03 04:54:29');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (4, 'PAYMENT', 'INVOICE', 'INV-20260903-0005', 'admin@nanocircumcision.com', 'Pembayaran Rp 2.400.000, sisa Rp 0', '2026-09-03 04:56:28');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (5, 'CREATE', 'EMPLOYEE', 'EMP-005', 'admin@nanocircumcision.com', 'Karyawan baru: Novian Tri Andhika (Administrasi & Logistik)', '2026-09-04 01:44:04');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (6, 'LOGOUT', 'USER', 'admin', 'admin@nanocircumcision.com', 'Pengguna keluar sistem', '2026-09-04 01:45:48');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (7, 'LOGOUT', 'USER', 'admin', 'admin@nanocircumcision.com', 'Pengguna keluar sistem', '2026-09-04 01:45:50');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (8, 'UPDATE_STATUS', 'DOCTOR_FEE', '1', 'admin@nanocircumcision.com', 'Status diubah menjadi PAID', '2026-09-04 02:03:38');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (9, 'PAYMENT', 'INVOICE', 'INV-20260902-0004', 'admin@nanocircumcision.com', 'Pembayaran Rp 1.500.000, sisa Rp 0', '2026-09-04 02:03:49');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (10, 'PAYMENT', 'INVOICE', 'INV-20260902-0003', 'admin@nanocircumcision.com', 'Pembayaran Rp 1.100.000, sisa Rp 0', '2026-09-04 02:03:54');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (11, 'PAYMENT', 'INVOICE', 'INV-20260902-0002', 'admin@nanocircumcision.com', 'Pembayaran Rp 1.300.000, sisa Rp 0', '2026-09-04 02:03:58');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (12, 'LOGOUT', 'USER', 'admin', 'admin@nanocircumcision.com', 'Pengguna keluar sistem', '2026-09-04 08:43:50');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (13, 'LOGOUT', 'USER', 'admin', 'admin@nanocircumcision.com', 'Pengguna keluar sistem', '2026-09-04 15:58:26');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (14, 'CREATE', 'BOOKING', 'BOOK-20260904-0006', 'admin@nanocircumcision.com', 'Booking baru pasien 3 total Rp 2400000', '2026-09-04 15:59:37');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (15, 'CHECKIN', 'QUEUE', 'K-001', 'admin@nanocircumcision.com', 'Pasien antrean K-001', '2026-09-04 15:59:44');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (16, 'CHECKIN', 'QUEUE', 'K-002', 'admin@nanocircumcision.com', 'Pasien antrean K-002', '2026-09-04 16:00:19');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (17, 'CHECKIN', 'QUEUE', 'K-003', 'admin@nanocircumcision.com', 'Pasien antrean K-003', '2026-09-04 16:00:21');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (18, 'CHECKIN', 'QUEUE', 'K-004', 'admin@nanocircumcision.com', 'Pasien antrean K-004', '2026-09-04 16:00:25');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (19, 'ADD_TRANSACTION_ITEM', 'BOOKING', 'BOOK-20260904-0006', 'admin@nanocircumcision.com', 'Tambah produk Obat Tetes Khitan Spesial (Nano Drops) (1x) total Rp 90.000', '2026-09-04 16:01:36');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (20, 'PAYMENT', 'INVOICE', 'INV-20260904-0006', 'admin@nanocircumcision.com', 'Pembayaran Rp 2.490.000, sisa Rp 0', '2026-09-04 16:02:56');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (21, 'UPDATE', 'CLINIC_SETTINGS', '1', 'admin@nanocircumcision.com', 'Pembaruan profil klinik', '2026-09-04 16:07:19');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (22, 'UPDATE', 'CIRCUMCISION_METHOD', '1', 'Administrator Klinik', 'Mengubah metode "Nano Klemp": Nama: "Klem Nano Sealer" → "Nano Klemp"', '2026-09-04 16:27:54');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (23, 'UPDATE', 'CIRCUMCISION_METHOD', '2', 'Administrator Klinik', 'Mengubah metode "Glanspro Bipolar Pensealer": Nama: "Super Ring Khitan" → "Glanspro Bipolar Pensealer"', '2026-09-04 16:28:10');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (24, 'TOGGLE_STATUS', 'CIRCUMCISION_METHOD', '3', 'Administrator Klinik', 'Status metode "Laser CO2 / Cauter Presisi" diubah menjadi: NONAKTIF', '2026-09-04 16:28:17');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (25, 'TOGGLE_STATUS', 'CIRCUMCISION_METHOD', '4', 'Administrator Klinik', 'Status metode "Klasik Jahitan Halus Estetik" diubah menjadi: NONAKTIF', '2026-09-04 16:28:20');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (26, 'UPDATE', 'DOCTOR', '1', 'Administrator Klinik', 'Mengubah data dokter dr. Muhammad Ali gufron: Nama: "dr. Bambang Irawan, Sp.B" → "dr. Muhammad Ali gufron", Deskripsi diperbarui, Catatan diperbarui', '2026-09-04 16:29:06');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (27, 'UPDATE', 'DOCTOR', '3', 'Administrator Klinik', 'Mengubah data dokter dr. Natsir Albukaoni: Nama: "dr. Maya Kartika" → "dr. Natsir Albukaoni", Deskripsi diperbarui, Catatan diperbarui', '2026-09-04 16:29:32');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (28, 'UPDATE', 'EMPLOYEE', '1', 'Administrator Klinik', 'Mengubah data karyawan Ns. Athour , S.Kep: Nama: "Ns. Ahmad Fauzi, S.Kep" → "Ns. Athour , S.Kep", Deskripsi peran diperbarui', '2026-09-04 16:30:25');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (29, 'TOGGLE_STATUS', 'EMPLOYEE', '3', 'admin@nanocircumcision.com', 'Status karyawan diubah: NONAKTIF', '2026-09-04 16:30:57');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (30, 'TOGGLE_STATUS', 'CIRCUMCISION_METHOD', '3', 'Administrator Klinik', 'Status metode "Metode Laser CO2 / Cauter Presisi" diubah menjadi: NONAKTIF', '2026-09-04 16:43:27');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (31, 'TOGGLE_STATUS', 'CIRCUMCISION_METHOD', '4', 'Administrator Klinik', 'Status metode "Metode Klasik Jahitan Halus Estetik" diubah menjadi: NONAKTIF', '2026-09-04 16:43:31');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (32, 'CONFIG_PACKAGE_ITEM', 'PACKAGE', '2', 'admin@nanocircumcision.com', 'Atur isi paket: Produk ID 8 Qty 1', '2026-09-04 16:44:17');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (33, 'UPDATE', 'PRODUCT', 'PRD-AKS-001', 'admin@nanocircumcision.com', 'Update data produk: Sertifikat', '2026-09-05 01:12:09');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (34, 'UPDATE', 'PRODUCT', 'PRD-OBT-001', 'admin@nanocircumcision.com', 'Update data produk: Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik)', '2026-09-05 01:13:52');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (35, 'UPDATE', 'PRODUCT', 'PRD-OBT-002', 'admin@nanocircumcision.com', 'Update data produk: Obat Spray (Antiseptic)', '2026-09-05 01:14:26');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (36, 'CREATE', 'PRODUCT', 'PRD-TTS-143', 'admin@nanocircumcision.com', 'Produk baru: Obat Tetes ( Antibiotic luar) (Stok: 20)', '2026-09-05 01:15:02');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (37, 'UPDATE', 'PRODUCT', 'PRD-TTS-001', 'admin@nanocircumcision.com', 'Update data produk: Obat Tetes Khitan Spesial (Nano Drops)', '2026-09-05 01:15:24');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (38, 'CREATE', 'PRODUCT', 'PRD-OTH-954', 'admin@nanocircumcision.com', 'Produk baru: GodiieBag Nano Special Edition (Stok: 20)', '2026-09-05 01:16:01');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (39, 'CREATE', 'PRODUCT', 'PRD-CLN-559', 'admin@nanocircumcision.com', 'Produk baru: Paket Celana Sunat (3pcs 100k) (Stok: 20)', '2026-09-05 01:17:05');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (40, 'CREATE', 'PRODUCT', 'PRD-CLN-797', 'admin@nanocircumcision.com', 'Produk baru: Celana Sunat Ecer (Stok: 20)', '2026-09-05 01:17:41');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (41, 'UPDATE', 'CIRCUMCISION_METHOD', '2', 'Administrator Klinik', 'Mengubah metode "Metode Glans Pro Bipolar Pensealer": Tarif: Reguler = Rp 2.400.000, VIP = Rp 2.700.000', '2026-09-05 02:31:50');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (42, 'UPDATE', 'CIRCUMCISION_METHOD', '1', 'Administrator Klinik', 'Mengubah metode "Metode Tindakan Nano Klemp": Tarif: Reguler = Rp 1.600.000, VIP = Rp 1.800.000', '2026-09-05 02:32:06');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (43, 'CHECKIN', 'QUEUE', 'K-001', 'admin@nanocircumcision.com', 'Pasien antrean K-001', '2026-09-05 02:32:41');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (44, 'COMPLETE', 'PROCEDURE', 'PROC-20260903-001', 'admin@nanocircumcision.com', 'Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit', '2026-09-05 02:34:33');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (45, 'COMPLETE', 'PROCEDURE', 'PROC-20260904-004', 'admin@nanocircumcision.com', 'Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit', '2026-09-05 03:29:22');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (46, 'COMPLETE', 'PROCEDURE', 'PROC-20260904-003', 'admin@nanocircumcision.com', 'Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit', '2026-09-05 03:30:15');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (47, 'CREATE', 'PATIENT', 'RM-2026-000007', 'admin@nanocircumcision.com', 'Pasien baru: sdfsf', '2026-09-05 03:31:26');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (48, 'CREATE', 'BOOKING', 'BOOK-20260905-0007', 'admin@nanocircumcision.com', 'Booking baru pasien 7 total Rp 2400000', '2026-09-05 03:32:08');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (49, 'CHECKIN', 'QUEUE', 'K-002', 'admin@nanocircumcision.com', 'Pasien antrean K-002', '2026-09-05 03:32:15');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (50, 'ADD_TRANSACTION_ITEM', 'BOOKING', 'BOOK-20260905-0007', 'admin@nanocircumcision.com', 'Tambah produk GodiieBag Nano Special Edition (1x) total Rp 50.000', '2026-09-05 03:32:38');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (51, 'COMPLETE', 'PROCEDURE', 'PROC-20260905-002', 'admin@nanocircumcision.com', 'Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit', '2026-09-05 03:33:15');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (52, 'PAYMENT', 'INVOICE', 'INV-20260905-0007', 'admin@nanocircumcision.com', 'Pembayaran Rp 2.400.000, sisa Rp 0', '2026-09-05 03:33:19');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (53, 'CONFIG_PACKAGE_ITEM', 'PACKAGE', '1', 'admin@nanocircumcision.com', 'Atur isi paket: Produk ID 11 Qty 1', '2026-09-05 03:34:17');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (54, 'CONFIG_PACKAGE_ITEM', 'PACKAGE', '1', 'admin@nanocircumcision.com', 'Atur isi paket: Produk ID 6 Qty 1', '2026-09-05 03:34:27');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (55, 'CONFIG_PACKAGE_ITEM', 'PACKAGE', '1', 'admin@nanocircumcision.com', 'Atur isi paket: Produk ID 8 Qty 1', '2026-09-05 03:34:42');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (56, 'CONFIG_PACKAGE_ITEM', 'PACKAGE', '1', 'admin@nanocircumcision.com', 'Atur isi paket: Produk ID 5 Qty 2', '2026-09-05 03:35:22');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (57, 'CONFIG_PACKAGE_ITEM', 'PACKAGE', '1', 'admin@nanocircumcision.com', 'Atur isi paket: Produk ID 5 Qty 1', '2026-09-05 03:35:31');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (58, 'CONFIG_PACKAGE_ITEM', 'PACKAGE', '1', 'admin@nanocircumcision.com', 'Atur isi paket: Produk ID 1 Qty 2', '2026-09-05 03:35:46');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (59, 'CONFIG_PACKAGE_ITEM', 'PACKAGE', '1', 'admin@nanocircumcision.com', 'Atur isi paket: Produk ID 11 Qty 2', '2026-09-05 03:35:52');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (60, 'CONFIG_PACKAGE_ITEM', 'PACKAGE', '1', 'admin@nanocircumcision.com', 'Atur isi paket: Produk ID 8 Qty 2', '2026-09-05 03:35:58');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (61, 'CONFIG_PACKAGE_ITEM', 'PACKAGE', '2', 'admin@nanocircumcision.com', 'Atur isi paket: Produk ID 11 Qty 1', '2026-09-05 03:37:45');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (62, 'CONFIG_PACKAGE_ITEM', 'PACKAGE', '2', 'admin@nanocircumcision.com', 'Atur isi paket: Produk ID 6 Qty 1', '2026-09-05 03:37:54');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (63, 'CONFIG_PACKAGE_ITEM', 'PACKAGE', '2', 'admin@nanocircumcision.com', 'Atur isi paket: Produk ID 5 Qty 1', '2026-09-05 03:38:03');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (64, 'CONFIG_PACKAGE_ITEM', 'PACKAGE', '2', 'admin@nanocircumcision.com', 'Atur isi paket: Produk ID 8 Qty 1', '2026-09-05 03:38:15');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (65, 'CONFIG_PACKAGE_ITEM', 'PACKAGE', '2', 'admin@nanocircumcision.com', 'Atur isi paket: Produk ID 11 Qty 1', '2026-09-05 03:38:30');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (66, 'CONFIG_PACKAGE_ITEM', 'PACKAGE', '2', 'admin@nanocircumcision.com', 'Atur isi paket: Produk ID 5 Qty 1', '2026-09-05 03:38:42');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (67, 'CONFIG_PACKAGE_ITEM', 'PACKAGE', '2', 'admin@nanocircumcision.com', 'Atur isi paket: Produk ID 1 Qty 1', '2026-09-05 03:38:50');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (68, 'COMPLETE', 'PROCEDURE', 'PROC-20260904-002', 'admin@nanocircumcision.com', 'Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit', '2026-09-05 03:41:04');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (69, 'UPDATE_STATUS', 'DOCTOR_FEE', '6', 'admin@nanocircumcision.com', 'Status diubah menjadi APPROVED', '2026-09-05 03:42:02');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (70, 'UPDATE_STATUS', 'DOCTOR_FEE', '5', 'admin@nanocircumcision.com', 'Status diubah menjadi APPROVED', '2026-09-05 03:42:04');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (71, 'UPDATE_STATUS', 'DOCTOR_FEE', '4', 'admin@nanocircumcision.com', 'Status diubah menjadi APPROVED', '2026-09-05 03:42:06');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (72, 'UPDATE_STATUS', 'DOCTOR_FEE', '3', 'admin@nanocircumcision.com', 'Status diubah menjadi APPROVED', '2026-09-05 03:42:08');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (73, 'UPDATE_STATUS', 'DOCTOR_FEE', '2', 'admin@nanocircumcision.com', 'Status diubah menjadi APPROVED', '2026-09-05 03:42:10');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (74, 'CREATE', 'PATIENT', 'RM-2026-000008', 'admin@nanocircumcision.com', 'Pasien baru: efendy agusria', '2026-09-05 05:32:30');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (75, 'CREATE', 'BOOKING', 'BOOK-20260905-0008', 'admin@nanocircumcision.com', 'Booking baru pasien 8 total Rp 2700000', '2026-09-05 05:33:10');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (76, 'CHECKIN', 'QUEUE', 'K-003', 'admin@nanocircumcision.com', 'Pasien antrean K-003', '2026-09-05 05:33:53');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (77, 'COMPLETE', 'PROCEDURE', 'PROC-20260905-003', 'admin@nanocircumcision.com', 'Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit', '2026-09-05 05:34:54');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (78, 'PAYMENT', 'INVOICE', 'INV-20260905-0008', 'admin@nanocircumcision.com', 'Pembayaran Rp 2.700.000, sisa Rp 0', '2026-09-05 05:35:04');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (79, 'UPDATE_STATUS', 'DOCTOR_FEE', '7', 'admin@nanocircumcision.com', 'Status diubah menjadi APPROVED', '2026-09-05 05:35:31');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (80, 'UPDATE_STATUS', 'DOCTOR_FEE', '2', 'admin@nanocircumcision.com', 'Status diubah menjadi PAID', '2026-09-05 05:36:24');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (81, 'UPDATE_STATUS', 'DOCTOR_FEE', '4', 'admin@nanocircumcision.com', 'Status diubah menjadi PAID', '2026-09-05 05:36:24');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (82, 'UPDATE_STATUS', 'DOCTOR_FEE', '5', 'admin@nanocircumcision.com', 'Status diubah menjadi PAID', '2026-09-05 05:36:24');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (83, 'UPDATE_STATUS', 'DOCTOR_FEE', '3', 'admin@nanocircumcision.com', 'Status diubah menjadi PAID', '2026-09-05 05:36:25');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (84, 'UPDATE_STATUS', 'DOCTOR_FEE', '6', 'admin@nanocircumcision.com', 'Status diubah menjadi PAID', '2026-09-05 05:36:25');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (85, 'UPDATE_STATUS', 'DOCTOR_FEE', '7', 'admin@nanocircumcision.com', 'Status diubah menjadi PAID', '2026-09-05 05:36:26');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (86, 'LOGIN', 'USER', 'user-doctor', 'dokter@nanocircumcision.com', 'Pengguna login: dr. Bambang Irawan, Sp.B (Dokter Operator Khitan) (doctor)', '2026-09-05 14:05:13');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (87, 'LOGOUT', 'USER', 'dokter', 'doctor@nanocircumcision.com', 'Pengguna keluar sistem', '2026-09-05 14:05:16');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (88, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-05 14:05:17');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (89, 'LOGOUT', 'USER', 'admin', 'admin@nanocircumcision.com', 'Pengguna keluar sistem', '2026-09-05 14:08:06');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (90, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-05 14:08:21');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (91, 'CHECKIN', 'QUEUE', 'K-004', 'admin@nanocircumcision.com', 'Pasien antrean K-004', '2026-09-05 14:09:21');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (92, 'CHECKIN', 'QUEUE', 'K-005', 'admin@nanocircumcision.com', 'Pasien antrean K-005', '2026-09-05 14:10:06');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (93, 'CREATE', 'PATIENT', 'RM-2026-000009', 'admin@nanocircumcision.com', 'Pasien baru: Sulton Prayoga', '2026-09-05 14:12:01');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (94, 'CREATE', 'BOOKING', 'BOOK-20260905-0009', 'admin@nanocircumcision.com', 'Booking baru pasien 9 total Rp 2400000', '2026-09-05 14:13:32');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (95, 'CHECKIN', 'QUEUE', 'K-006', 'admin@nanocircumcision.com', 'Pasien antrean K-006', '2026-09-05 14:13:39');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (96, 'COMPLETE', 'PROCEDURE', 'PROC-20260905-006', 'admin@nanocircumcision.com', 'Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit', '2026-09-05 14:14:36');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (97, 'PAYMENT', 'INVOICE', 'INV-20260905-0009', 'admin@nanocircumcision.com', 'Pembayaran Rp 2.400.000, sisa Rp 0', '2026-09-05 14:14:47');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (98, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-05 14:16:14');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (99, 'TOGGLE_STATUS', 'DOCTOR', '2', 'Administrator Klinik', 'Status dokter dr. Hendra Wijaya diubah menjadi: NONAKTIF', '2026-09-05 14:17:43');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (100, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-06 00:09:01');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (101, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-06 00:11:05');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (102, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-06 00:14:11');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (103, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-06 08:35:50');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (104, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-06 13:34:01');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (105, 'LOGOUT', 'USER', 'admin', 'admin@nanocircumcision.com', 'Pengguna keluar sistem', '2026-09-06 13:34:04');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (106, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-06 13:34:41');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (107, 'CHECKIN', 'QUEUE', 'K-001', 'admin@nanocircumcision.com', 'Pasien antrean K-001', '2026-09-06 13:35:14');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (108, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-06 13:47:01');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (109, 'CREATE', 'PATIENT', 'RM-2026-000010', 'admin@nanocircumcision.com', 'Pasien baru: Jeni guardian', '2026-09-06 13:47:58');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (110, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-06 13:53:17');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (111, 'CREATE', 'PATIENT', 'RM-2026-000011', 'admin@nanocircumcision.com', 'Pasien baru: Adam Prihantoro Agus', '2026-09-06 13:54:15');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (112, 'CREATE', 'BOOKING', 'BOOK-20260906-0010', 'admin@nanocircumcision.com', 'Booking baru pasien 10 total Rp 2700000', '2026-09-06 13:57:10');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (113, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-06 13:59:44');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (114, 'CREATE', 'BOOKING', 'BOOK-20260906-0011', 'admin@nanocircumcision.com', 'Booking baru pasien 11 total Rp 2600000', '2026-09-06 14:03:04');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (115, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-06 14:18:37');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (116, 'AUTO_BOOKING', 'BOOKING', 'BOOK-20260906-0012', 'admin@nanocircumcision.com', 'Auto-booking saat pendaftaran: Adam Prihantoro Agus (2026-09-10 07:00, Metode: Glans Pro bipolar pen sealer, Bius: Bius Kombinasi (FNI + Injeksi))', '2026-09-06 14:20:31');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (117, 'CREATE', 'PATIENT', 'RM-2026-000012', 'admin@nanocircumcision.com', 'Pasien baru: Adam Prihantoro Agus', '2026-09-06 14:20:31');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (118, 'CHECKIN', 'QUEUE', 'K-004', 'admin@nanocircumcision.com', 'Pasien antrean K-004', '2026-09-06 14:22:08');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (119, 'COMPLETE', 'PROCEDURE', 'PROC-20260906-004', 'admin@nanocircumcision.com', 'Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit', '2026-09-06 14:22:58');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (120, 'PAYMENT', 'INVOICE', 'INV-20260906-0012', 'admin@nanocircumcision.com', 'Pembayaran Rp 2.700.000, sisa Rp 0', '2026-09-06 14:23:24');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (121, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-06 14:28:02');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (122, 'LOGOUT', 'USER', 'admin', 'admin@nanocircumcision.com', 'Pengguna keluar sistem', '2026-09-06 14:32:56');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (123, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-06 14:33:02');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (124, 'CREATE', 'PRODUCT', 'PRD-OBT-292', 'admin@nanocircumcision.com', 'Produk baru: Paket Obat Kapsul (Stok: 20)', '2026-09-06 14:34:54');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (125, 'AUTO_BOOKING', 'BOOKING', 'BOOK-20260906-0001', 'admin@nanocircumcision.com', 'Auto-booking saat pendaftaran: izzam alvaro (2026-10-12 siang, Metode: glans pro bipolar pen sealer vip, Bius: Bius Tanpa Jarum Suntik / FREE Needle injection (FNI))', '2026-09-06 14:38:07');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (126, 'CREATE', 'PATIENT', 'RM-2026-000001', 'admin@nanocircumcision.com', 'Pasien baru: izzam alvaro', '2026-09-06 14:38:07');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (127, 'UPDATE', 'BOOKING', 'BOOK-20260906-0001', 'admin@nanocircumcision.com', 'Edit booking: Metode glans pro bipolar pen sealer vip, Bius: Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)', '2026-09-06 14:39:01');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (128, 'CHECKIN', 'QUEUE', 'K-001', 'admin@nanocircumcision.com', 'Pasien antrean K-001', '2026-09-06 14:39:14');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (129, 'COMPLETE', 'PROCEDURE', 'PROC-20260906-001', 'admin@nanocircumcision.com', 'Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit', '2026-09-06 14:41:25');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (130, 'PAYMENT', 'INVOICE', 'INV-20260906-0001', 'admin@nanocircumcision.com', 'Pembayaran Rp 2.700.000, sisa Rp 0', '2026-09-06 14:41:35');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (131, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-06 14:48:50');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (132, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-06 14:54:33');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (133, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-07 01:02:10');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (134, 'BACKUP_DOWNLOAD_JSON', 'database', 'all_tables', 'admin@nanocircumcision.com', 'Unduh backup database JSON (317 baris data) ke komputer lokal', '2026-09-07 01:03:28');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (135, 'CREATE', 'USER', 'user-mtqjfimf', 'admin@nanocircumcision.com', 'Buat akun pengguna: Novian Tri Andhika (admin)', '2026-09-07 01:04:15');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (136, 'LOGOUT', 'USER', 'admin', 'admin@nanocircumcision.com', 'Pengguna keluar sistem', '2026-09-07 01:04:17');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (137, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-07 01:04:49');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (138, 'UPDATE', 'USER', '5', 'admin@nanocircumcision.com', 'Pembaruan akun pengguna ID 5', '2026-09-07 01:05:22');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (139, 'LOGOUT', 'USER', 'admin', 'admin@nanocircumcision.com', 'Pengguna keluar sistem', '2026-09-07 01:05:30');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (140, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-07 01:05:37');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (141, 'UPDATE', 'CIRCUMCISION_METHOD', '3', 'Administrator Klinik', 'Mengubah metode "Metode Laser CO2 / Cauter Presisi": Tarif: Reguler = Rp 0, VIP = Rp 0', '2026-09-07 01:06:01');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (142, 'UPDATE', 'CIRCUMCISION_METHOD', '3', 'Administrator Klinik', 'Mengubah metode "-": Nama: "Metode Laser CO2 / Cauter Presisi" → "-", Tarif: Reguler = Rp 1.800.000, VIP = Rp 2.500.000', '2026-09-07 01:06:13');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (143, 'UPDATE', 'CIRCUMCISION_METHOD', '4', 'Administrator Klinik', 'Mengubah metode "-": Nama: "Metode Klasik Jahitan Halus Estetik" → "-", Tarif: Reguler = Rp 0, VIP = Rp 0', '2026-09-07 01:06:24');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (144, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-07 05:32:41');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (145, 'UPDATE_STATUS', 'DOCTOR_FEE', '1', 'admin@nanocircumcision.com', 'Status diubah menjadi APPROVED', '2026-09-07 05:33:40');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (146, 'AUTO_BOOKING', 'BOOKING', 'BOOK-20260907-0002', 'admin@nanocircumcision.com', 'Auto-booking saat pendaftaran: Muhammad Orhan Ghazi El Hanan (2026-09-07 16:00, Metode: glans pro bipolar pem sealer, Bius: Bius Kombinasi (FNI + Injeksi))', '2026-09-07 05:37:43');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (147, 'CREATE', 'PATIENT', 'RM-2026-000002', 'admin@nanocircumcision.com', 'Pasien baru: Muhammad Orhan Ghazi El Hanan', '2026-09-07 05:37:43');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (148, 'CHECKIN', 'QUEUE', 'K-001', 'admin@nanocircumcision.com', 'Pasien antrean K-001', '2026-09-07 05:38:05');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (149, 'COMPLETE', 'PROCEDURE', 'PROC-20260907-001', 'admin@nanocircumcision.com', 'Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit', '2026-09-07 05:38:44');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (150, 'PAYMENT', 'INVOICE', 'INV-20260907-0002', 'admin@nanocircumcision.com', 'Pembayaran Rp 2.700.000, sisa Rp 0', '2026-09-07 05:38:48');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (151, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-07 10:00:21');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (152, 'AUTO_BOOKING', 'BOOKING', 'BOOK-20260907-0003', 'admin@nanocircumcision.com', 'Auto-booking saat pendaftaran: Muhammad Orhan Ghazi El Hanan (2026-09-07 17:02, Metode: glans pro bipolar pem sealer, Bius: Bius Kombinasi (FNI + Injeksi))', '2026-09-07 10:02:28');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (153, 'CREATE', 'PATIENT', 'RM-2026-000003', 'admin@nanocircumcision.com', 'Pasien baru: Muhammad Orhan Ghazi El Hanan', '2026-09-07 10:02:28');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (154, 'CHECKIN', 'QUEUE', 'K-002', 'admin@nanocircumcision.com', 'Pasien antrean K-002', '2026-09-07 10:02:56');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (155, 'COMPLETE', 'PROCEDURE', 'PROC-20260907-002', 'admin@nanocircumcision.com', 'Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit', '2026-09-07 10:03:57');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (156, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-07 10:04:04');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (157, 'PAYMENT', 'INVOICE', 'INV-20260907-0003', 'admin@nanocircumcision.com', 'Pembayaran Rp 2.700.000, sisa Rp 0', '2026-09-07 10:04:27');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (158, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-07 10:06:25');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (159, 'UPDATE_STATUS', 'DOCTOR_FEE', '2', 'admin@nanocircumcision.com', 'Status diubah menjadi APPROVED', '2026-09-07 10:07:34');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (160, 'UPDATE_STATUS', 'DOCTOR_FEE', '3', 'admin@nanocircumcision.com', 'Status diubah menjadi APPROVED', '2026-09-07 10:07:35');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (161, 'GENERATE_PAYROLL', 'PAYROLL', 'PAYROLL-202609-001', 'admin@nanocircumcision.com', 'Generate gaji Ns. Tri Wahyuni, A.Md.Kep periode 2026-09: THP Rp 3200000 (Gaji: 3200000, Fee Tindakan: 0, Closing: 0, Lembur: 0)', '2026-09-07 10:11:45');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (162, 'GENERATE_PAYROLL', 'PAYROLL', 'PAYROLL-202609-002', 'admin@nanocircumcision.com', 'Generate gaji Budi Santoso periode 2026-09: THP Rp 2800000 (Gaji: 2800000, Fee Tindakan: 0, Closing: 0, Lembur: 0)', '2026-09-07 10:11:45');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (163, 'GENERATE_PAYROLL', 'PAYROLL', 'PAYROLL-202609-003', 'admin@nanocircumcision.com', 'Generate gaji Novian Tri Andhika periode 2026-09: THP Rp 1820000 (Gaji: 1800000, Fee Tindakan: 20000, Closing: 0, Lembur: 0)', '2026-09-07 10:11:46');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (164, 'GENERATE_PAYROLL', 'PAYROLL', 'PAYROLL-202609-004', 'admin@nanocircumcision.com', 'Generate gaji Ns. Athour , S.Kep periode 2026-09: THP Rp 2050000 (Gaji: 2000000, Fee Tindakan: 50000, Closing: 0, Lembur: 0)', '2026-09-07 10:11:46');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (165, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-07 10:22:22');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (166, 'GENERATE_PAYROLL', 'PAYROLL', 'PAYROLL-202609-004', 'admin@nanocircumcision.com', 'Generate gaji Ns. Athour , S.Kep periode 2026-09: THP Rp 2080000 (Gaji: 2000000, Fee Tindakan: 50000, Closing: 30000, Lembur: 0)', '2026-09-07 10:23:15');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (167, 'DELETE', 'PAYROLL', 'PAYROLL-202609-004', 'admin@nanocircumcision.com', 'Hapus draft slip gaji Ns. Athour , S.Kep (2026-09)', '2026-09-07 10:23:47');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (168, 'DELETE', 'PAYROLL', 'PAYROLL-202609-003', 'admin@nanocircumcision.com', 'Hapus draft slip gaji Novian Tri Andhika (2026-09)', '2026-09-07 10:23:50');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (169, 'DELETE', 'PAYROLL', 'PAYROLL-202609-002', 'admin@nanocircumcision.com', 'Hapus draft slip gaji Budi Santoso (2026-09)', '2026-09-07 10:23:53');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (170, 'DELETE', 'PAYROLL', 'PAYROLL-202609-001', 'admin@nanocircumcision.com', 'Hapus draft slip gaji Ns. Tri Wahyuni, A.Md.Kep (2026-09)', '2026-09-07 10:23:56');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (171, 'GENERATE_PAYROLL', 'PAYROLL', 'PAYROLL-202609-001', 'admin@nanocircumcision.com', 'Generate gaji Ns. Tri Wahyuni, A.Md.Kep periode 2026-09: THP Rp 3200000 (Gaji: 3200000, Fee Tindakan: 0, Closing: 0, Lembur: 0)', '2026-09-07 10:24:08');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (172, 'GENERATE_PAYROLL', 'PAYROLL', 'PAYROLL-202609-002', 'admin@nanocircumcision.com', 'Generate gaji Budi Santoso periode 2026-09: THP Rp 2800000 (Gaji: 2800000, Fee Tindakan: 0, Closing: 0, Lembur: 0)', '2026-09-07 10:24:09');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (173, 'GENERATE_PAYROLL', 'PAYROLL', 'PAYROLL-202609-003', 'admin@nanocircumcision.com', 'Generate gaji Novian Tri Andhika periode 2026-09: THP Rp 1820000 (Gaji: 1800000, Fee Tindakan: 20000, Closing: 0, Lembur: 0)', '2026-09-07 10:24:09');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (174, 'GENERATE_PAYROLL', 'PAYROLL', 'PAYROLL-202609-004', 'admin@nanocircumcision.com', 'Generate gaji Ns. Athour , S.Kep periode 2026-09: THP Rp 2050000 (Gaji: 2000000, Fee Tindakan: 50000, Closing: 0, Lembur: 0)', '2026-09-07 10:24:09');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (175, 'DELETE', 'PAYROLL', 'PAYROLL-202609-002', 'admin@nanocircumcision.com', 'Hapus draft slip gaji Budi Santoso (2026-09)', '2026-09-07 10:24:34');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (176, 'DELETE', 'PAYROLL', 'PAYROLL-202609-004', 'admin@nanocircumcision.com', 'Hapus draft slip gaji Ns. Athour , S.Kep (2026-09)', '2026-09-07 10:24:37');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (177, 'DELETE', 'PAYROLL', 'PAYROLL-202609-003', 'admin@nanocircumcision.com', 'Hapus draft slip gaji Novian Tri Andhika (2026-09)', '2026-09-07 10:24:40');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (178, 'DELETE', 'PAYROLL', 'PAYROLL-202609-001', 'admin@nanocircumcision.com', 'Hapus draft slip gaji Ns. Tri Wahyuni, A.Md.Kep (2026-09)', '2026-09-07 10:24:43');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (179, 'GENERATE_PAYROLL', 'PAYROLL', 'PAYROLL-202609-001', 'admin@nanocircumcision.com', 'Generate gaji Ns. Tri Wahyuni, A.Md.Kep periode 2026-09: THP Rp 3200000 (Gaji: 3200000, Fee Tindakan: 0, Closing: 0, Lembur: 0)', '2026-09-07 10:41:21');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (180, 'GENERATE_PAYROLL', 'PAYROLL', 'PAYROLL-202609-002', 'admin@nanocircumcision.com', 'Generate gaji Budi Santoso periode 2026-09: THP Rp 2800000 (Gaji: 2800000, Fee Tindakan: 0, Closing: 0, Lembur: 0)', '2026-09-07 10:41:21');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (181, 'GENERATE_PAYROLL', 'PAYROLL', 'PAYROLL-202609-003', 'admin@nanocircumcision.com', 'Generate gaji Novian Tri Andhika periode 2026-09: THP Rp 1820000 (Gaji: 1800000, Fee Tindakan: 20000, Closing: 0, Lembur: 0)', '2026-09-07 10:41:21');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (182, 'GENERATE_PAYROLL', 'PAYROLL', 'PAYROLL-202609-004', 'admin@nanocircumcision.com', 'Generate gaji Ns. Athour , S.Kep periode 2026-09: THP Rp 2050000 (Gaji: 2000000, Fee Tindakan: 50000, Closing: 0, Lembur: 0)', '2026-09-07 10:41:22');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (183, 'GENERATE_PAYROLL', 'PAYROLL', 'PAYROLL-202609-001', 'admin@nanocircumcision.com', 'Generate gaji Ns. Tri Wahyuni, A.Md.Kep periode 2026-09: THP Rp 3200000 (Gaji: 3200000, Fee Tindakan: 0, Closing: 0, Lembur: 0)', '2026-09-07 10:43:42');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (184, 'GENERATE_PAYROLL', 'PAYROLL', 'PAYROLL-202609-002', 'admin@nanocircumcision.com', 'Generate gaji Budi Santoso periode 2026-09: THP Rp 2800000 (Gaji: 2800000, Fee Tindakan: 0, Closing: 0, Lembur: 0)', '2026-09-07 10:43:42');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (185, 'GENERATE_PAYROLL', 'PAYROLL', 'PAYROLL-202609-003', 'admin@nanocircumcision.com', 'Generate gaji Novian Tri Andhika periode 2026-09: THP Rp 1820000 (Gaji: 1800000, Fee Tindakan: 20000, Closing: 0, Lembur: 0)', '2026-09-07 10:43:42');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (186, 'GENERATE_PAYROLL', 'PAYROLL', 'PAYROLL-202609-004', 'admin@nanocircumcision.com', 'Generate gaji Ns. Athour , S.Kep periode 2026-09: THP Rp 2050000 (Gaji: 2000000, Fee Tindakan: 50000, Closing: 0, Lembur: 0)', '2026-09-07 10:43:43');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (187, 'GENERATE_PAYROLL', 'PAYROLL', 'PAYROLL-202609-004', 'admin@nanocircumcision.com', 'Generate gaji Ns. Athour , S.Kep periode 2026-09: THP Rp 2170000 (Gaji: 2000000, Fee Tindakan: 50000, Closing: 60000, Lembur: 60000)', '2026-09-07 10:43:51');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (188, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-07 10:47:30');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (189, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-07 13:42:56');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (190, 'DELETE', 'EMPLOYEE', '2', 'Administrator Klinik', 'Menghapus/mengarsipkan karyawan/staf: Ns. Tri Wahyuni, A.Md.Kep (EMP-002) - Riwayat tindakan & payroll aman', '2026-09-07 13:43:18');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (191, 'DELETE', 'EMPLOYEE', '4', 'Administrator Klinik', 'Menghapus/mengarsipkan karyawan/staf: Budi Santoso (EMP-004) - Riwayat tindakan & payroll aman', '2026-09-07 13:43:26');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (192, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-08 01:16:04');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (193, 'DELETE', 'DOCTOR', '2', 'Administrator Klinik', 'Menghapus permanen dokter: dr. Hendra Wijaya (DOC-002)', '2026-09-08 01:16:19');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (194, 'DELETE', 'EMPLOYEE', '3', 'Administrator Klinik', 'Menghapus permanen karyawan/staf: Dina Safitri (EMP-003)', '2026-09-08 01:16:23');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (195, 'DELETE', 'PAYROLL', 'PAYROLL-202609-001', 'admin@nanocircumcision.com', 'Hapus draft slip gaji Ns. Tri Wahyuni, A.Md.Kep (2026-09)', '2026-09-08 01:16:34');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (196, 'DELETE', 'PAYROLL', 'PAYROLL-202609-002', 'admin@nanocircumcision.com', 'Hapus draft slip gaji Budi Santoso (2026-09)', '2026-09-08 01:16:39');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (197, 'DELETE', 'CIRCUMCISION_METHOD', '3', 'Administrator Klinik', 'Menghapus permanen metode tindakan: "-"', '2026-09-08 01:16:58');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (198, 'DELETE', 'CIRCUMCISION_METHOD', '4', 'Administrator Klinik', 'Menghapus permanen metode tindakan: "-"', '2026-09-08 01:17:02');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (199, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-08 05:34:44');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (200, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-08 09:29:34');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (201, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-09 01:17:11');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (202, 'SOFT_DELETE', 'PATIENT', 'RM-2026-000002', 'Administrator Klinik', 'Arsipkan/hapus lunak pasien: Muhammad Orhan Ghazi El Hanan - Alasan: Dihapus oleh admin', '2026-09-09 01:17:26');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (203, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-09 01:21:19');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (204, 'UPDATE', 'EMPLOYEE', '5', 'Administrator Klinik', 'Mengubah data karyawan Novian Tri Andhika: Deskripsi peran diperbarui', '2026-09-09 01:23:12');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (205, 'UPDATE', 'EMPLOYEE', '1', 'Administrator Klinik', 'Mengubah data karyawan Ns. Athour , S.Kep: Pembaruan profil', '2026-09-09 01:23:25');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (206, 'UPDATE', 'EMPLOYEE', '1', 'Administrator Klinik', 'Mengubah data karyawan Ns. Athour , S.Kep: Pembaruan profil', '2026-09-09 01:23:45');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (207, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-09 01:38:30');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (208, 'BACKUP_DOWNLOAD_SQL', 'database', 'all_tables', 'admin@nanocircumcision.com', 'Unduh dump SQL (409 baris data) ke komputer lokal', '2026-09-09 01:41:05');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (209, 'BACKUP_DOWNLOAD_JSON', 'database', 'all_tables', 'admin@nanocircumcision.com', 'Unduh backup database JSON (410 baris data) ke komputer lokal', '2026-09-09 01:41:07');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (210, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-10 00:50:32');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (211, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-10 02:11:08');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (212, 'AUTO_BOOKING', 'BOOKING', 'BOOK-20260910-0004', 'admin@nanocircumcision.com', 'Auto-booking saat pendaftaran: AL GHIFARI DAVIANSYAH (2026-09-10 08:00, Metode: Metode Glans Pro Bipolar Pensealer, Bius: Bius Kombinasi (FNI + Injeksi))', '2026-09-10 02:14:06');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (213, 'CREATE', 'PATIENT', 'RM-2026-000004', 'admin@nanocircumcision.com', 'Pasien baru: AL GHIFARI DAVIANSYAH', '2026-09-10 02:14:06');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (214, 'CHECKIN', 'QUEUE', 'K-001', 'admin@nanocircumcision.com', 'Pasien antrean K-001', '2026-09-10 02:14:20');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (215, 'COMPLETE', 'PROCEDURE', 'PROC-20260910-001', 'admin@nanocircumcision.com', 'Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit', '2026-09-10 02:15:28');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (216, 'PAYMENT', 'INVOICE', 'INV-20260910-0004', 'admin@nanocircumcision.com', 'Pembayaran Rp 2.700.000, sisa Rp 0', '2026-09-10 02:15:34');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (217, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-10 03:10:45');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (218, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-10 03:25:23');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (219, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-10 03:39:11');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (220, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-10 03:48:46');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (221, 'AUTO_BOOKING', 'BOOKING', 'BOOK-20260910-0005', 'admin@nanocircumcision.com', 'Auto-booking saat pendaftaran: Gilang Shodiq ramadhan (2026-07-03 08:00, Metode: Metode Tindakan Nano Klemp, Bius: Bius Tanpa Jarum Suntik / FREE Needle injection (FNI))', '2026-09-10 03:51:56');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (222, 'CREATE', 'PATIENT', 'RM-2026-000005', 'admin@nanocircumcision.com', 'Pasien baru: Gilang Shodiq ramadhan', '2026-09-10 03:51:56');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (223, 'CHECKIN', 'QUEUE', 'K-002', 'admin@nanocircumcision.com', 'Pasien antrean K-002', '2026-09-10 03:52:14');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (224, 'COMPLETE', 'PROCEDURE', 'PROC-20260910-002', 'admin@nanocircumcision.com', 'Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit', '2026-09-10 03:52:52');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (225, 'PAYMENT', 'INVOICE', 'INV-20260910-0005', 'admin@nanocircumcision.com', 'Pembayaran Rp 1.250.000, sisa Rp 0', '2026-09-10 03:52:59');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (226, 'STOCK_MUTATION', 'PRODUCT', 'PRD-MNN-001', 'admin@nanocircumcision.com', 'Mutasi OUT qty: 49 (Stok: 49 -> 0)', '2026-09-10 03:55:25');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (227, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-10 04:11:17');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (228, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-10 06:18:03');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (229, 'UPDATE', 'PATIENT', 'RM-2026-000004', 'admin@nanocircumcision.com', 'Edit data pasien: AL GHIFARI DAVIANSYAH', '2026-09-10 06:22:23');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (230, 'BACKUP_DOWNLOAD_SQL', 'database', 'all_tables', 'admin@nanocircumcision.com', 'Unduh dump SQL (490 baris data) ke komputer lokal', '2026-09-10 06:35:04');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (231, 'BACKUP_DOWNLOAD_JSON', 'database', 'all_tables', 'admin@nanocircumcision.com', 'Unduh backup database JSON (490 baris data) ke komputer lokal', '2026-09-10 06:35:04');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (232, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-10 07:40:39');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (233, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-10 07:52:38');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (234, 'NATIVE_PG_DUMP', 'database', 'cloud_sql_development_database_2026-09-10_07-56-50.backup', 'admin@nanocircumcision.com', 'Full backup PostgreSQL (FULL - CUSTOM) menggunakan pg_dump native. Ukuran: 136.26 KB', '2026-09-10 07:56:56');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (235, 'LOGIN', 'USER', 'user-admin', 'admin@nanocircumcision.com', 'Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)', '2026-09-10 08:00:12');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (236, 'NATIVE_PG_DUMP', 'database', 'cloud_sql_development_database_2026-09-10_08-00-21.sql', 'admin@nanocircumcision.com', 'Full backup PostgreSQL (FULL - PLAIN) menggunakan pg_dump native. Ukuran: 192.67 KB', '2026-09-10 08:00:26');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (237, 'LOGIN', 'USER', 'user-mtqjfimf', 'dika@gmail.com', 'Pengguna login: Novian Tri Andhika (admin)', '2026-09-10 09:05:32');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (238, 'NATIVE_PG_DUMP', 'database', 'cloud_sql_development_database_2026-09-10_09-05-57.backup', 'admin@nanocircumcision.com', 'Full backup PostgreSQL (STRUCTURE - CUSTOM) menggunakan pg_dump native. Ukuran: 98.58 KB', '2026-09-10 09:06:02');
INSERT INTO `audit_logs` (`id`, `action`, `entity`, `entity_id`, `performed_by`, `details`, `timestamp`) VALUES (239, 'BACKUP_DOWNLOAD_MYSQL', 'database', 'nano_clinic_mysql_dump_2026-09-10_09-09-07.sql', 'admin@nanocircumcision.com', 'Unduh FULL dump MySQL / MariaDB (DDL + 499 baris data) ke komputer lokal', '2026-09-10 09:09:07');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

-- --------------------------------------------------------
-- RESTORASI VARIABEL SISTEM MYSQL
-- --------------------------------------------------------
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- ==============================================================================
-- Selesai Dump MySQL Lengkap (500 total baris data diekspor)
-- Dump ini siap diimport ke MySQL / MariaDB via phpMyAdmin atau MySQL Workbench.
-- ==============================================================================
