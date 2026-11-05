/**
 * Complete MySQL DDL and Dump Generator for Nano Circumcision Clinic Management System.
 * Generates official MySQL 5.7+ / 8.0+ / MariaDB compatible dump files (.sql)
 * that can be imported directly into phpMyAdmin, MySQL Workbench, HeidiSQL, DBeaver, or MySQL CLI.
 */

export function generateCompleteMysqlDdl(): string {
  return `-- ==============================================================================
-- NANO CIRCUMCISION CLINIC MANAGEMENT SYSTEM
-- MySQL & MariaDB Compatible Database Schema DDL
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10+, phpMyAdmin & MySQL Workbench
-- ==============================================================================

-- 1. Master Table: Users & Staff Authentication
DROP TABLE IF EXISTS \`users\`;
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`uid\` varchar(191) NOT NULL,
  \`email\` varchar(191) NOT NULL,
  \`full_name\` varchar(255) NOT NULL,
  \`role\` varchar(50) NOT NULL DEFAULT 'staff',
  \`phone\` varchar(50) DEFAULT NULL,
  \`password_hash\` text DEFAULT NULL,
  \`permissions\` text DEFAULT NULL,
  \`last_login\` datetime DEFAULT NULL,
  \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_users_uid\` (\`uid\`),
  KEY \`idx_users_role\` (\`role\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Master Table: Guardians / Orang Tua / Wali
DROP TABLE IF EXISTS \`guardians\`;
CREATE TABLE IF NOT EXISTS \`guardians\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) NOT NULL,
  \`father_name\` varchar(255) DEFAULT NULL,
  \`mother_name\` varchar(255) DEFAULT NULL,
  \`guardian_name\` varchar(255) DEFAULT NULL,
  \`relationship\` varchar(100) NOT NULL DEFAULT 'Orang Tua',
  \`phone\` varchar(50) NOT NULL,
  \`alternate_phone\` varchar(50) DEFAULT NULL,
  \`address\` text DEFAULT NULL,
  \`notes\` text DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_guardians_phone\` (\`phone\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Master Table: Patients / Pasien Khitan
DROP TABLE IF EXISTS \`patients\`;
CREATE TABLE IF NOT EXISTS \`patients\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`rm_number\` varchar(100) NOT NULL,
  \`full_name\` varchar(255) NOT NULL,
  \`nickname\` varchar(100) DEFAULT NULL,
  \`nik\` varchar(50) DEFAULT NULL,
  \`gender\` varchar(20) NOT NULL DEFAULT 'Laki-laki',
  \`birth_place\` varchar(150) DEFAULT NULL,
  \`birth_date\` varchar(50) NOT NULL,
  \`age_years\` int(11) NOT NULL DEFAULT 0,
  \`age_months\` int(11) NOT NULL DEFAULT 0,
  \`address\` text DEFAULT NULL,
  \`phone\` varchar(50) DEFAULT NULL,
  \`school\` varchar(255) DEFAULT NULL,
  \`grade\` varchar(50) DEFAULT NULL,
  \`weight_kg\` varchar(20) DEFAULT NULL,
  \`height_cm\` varchar(20) DEFAULT NULL,
  \`allergies\` text DEFAULT NULL,
  \`notes\` text DEFAULT NULL,
  \`guardian_id\` int(11) NOT NULL,
  \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
  \`is_deleted\` tinyint(1) NOT NULL DEFAULT 0,
  \`deleted_at\` datetime DEFAULT NULL,
  \`deleted_by\` varchar(255) DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_patients_rm_number\` (\`rm_number\`),
  KEY \`idx_patients_guardian_id\` (\`guardian_id\`),
  KEY \`idx_patients_full_name\` (\`full_name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Master Table: Patient Categories (REGULER, VIP, dll)
DROP TABLE IF EXISTS \`patient_categories\`;
CREATE TABLE IF NOT EXISTS \`patient_categories\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`code\` varchar(50) NOT NULL,
  \`name\` varchar(150) NOT NULL,
  \`description\` text DEFAULT NULL,
  \`is_default\` tinyint(1) NOT NULL DEFAULT 0,
  \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_patient_categories_code\` (\`code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Master Table: Circumcision Packages (Paket Layanan Khitan)
DROP TABLE IF EXISTS \`circumcision_packages\`;
CREATE TABLE IF NOT EXISTS \`circumcision_packages\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`code\` varchar(50) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`description\` text DEFAULT NULL,
  \`duration_minutes\` int(11) NOT NULL DEFAULT 45,
  \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_packages_code\` (\`code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Master Table: Package Prices per Category
DROP TABLE IF EXISTS \`package_prices\`;
CREATE TABLE IF NOT EXISTS \`package_prices\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`package_id\` int(11) NOT NULL,
  \`patient_category_id\` int(11) NOT NULL,
  \`price\` int(11) NOT NULL,
  \`effective_from\` varchar(50) NOT NULL,
  \`effective_until\` varchar(50) DEFAULT NULL,
  \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (\`id\`),
  KEY \`idx_package_prices_package_id\` (\`package_id\`),
  KEY \`idx_package_prices_category_id\` (\`patient_category_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Master Table: Circumcision Methods (Metode Tindakan Khitan)
DROP TABLE IF EXISTS \`circumcision_methods\`;
CREATE TABLE IF NOT EXISTS \`circumcision_methods\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) NOT NULL,
  \`description\` text DEFAULT NULL,
  \`notes\` text DEFAULT NULL,
  \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
  \`is_deleted\` tinyint(1) NOT NULL DEFAULT 0,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Master Table: Doctors (Dokter Operator Khitan)
DROP TABLE IF EXISTS \`doctors\`;
CREATE TABLE IF NOT EXISTS \`doctors\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`code\` varchar(50) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`title\` varchar(50) NOT NULL DEFAULT 'dr.',
  \`specialty\` varchar(150) NOT NULL DEFAULT 'Dokter Operator Khitan',
  \`description\` text DEFAULT NULL,
  \`notes\` text DEFAULT NULL,
  \`phone\` varchar(50) DEFAULT NULL,
  \`email\` varchar(191) DEFAULT NULL,
  \`sip_number\` varchar(100) DEFAULT NULL,
  \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
  \`is_deleted\` tinyint(1) NOT NULL DEFAULT 0,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_doctors_code\` (\`code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Doctor Schedules
DROP TABLE IF EXISTS \`doctor_schedules\`;
CREATE TABLE IF NOT EXISTS \`doctor_schedules\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`doctor_id\` int(11) NOT NULL,
  \`day_of_week\` varchar(50) NOT NULL,
  \`start_time\` varchar(20) NOT NULL,
  \`end_time\` varchar(20) NOT NULL,
  \`max_capacity\` int(11) NOT NULL DEFAULT 10,
  \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (\`id\`),
  KEY \`idx_schedules_doctor_id\` (\`doctor_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Doctor Fee Rules
DROP TABLE IF EXISTS \`doctor_fee_rules\`;
CREATE TABLE IF NOT EXISTS \`doctor_fee_rules\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`doctor_id\` int(11) NOT NULL,
  \`package_id\` int(11) NOT NULL,
  \`patient_category_id\` int(11) NOT NULL,
  \`fee_amount\` int(11) NOT NULL,
  \`effective_date\` varchar(50) NOT NULL,
  \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (\`id\`),
  KEY \`idx_fee_rules_doctor\` (\`doctor_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Bookings Table (Form Booking Khitan)
DROP TABLE IF EXISTS \`bookings\`;
CREATE TABLE IF NOT EXISTS \`bookings\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`booking_number\` varchar(100) NOT NULL,
  \`patient_id\` int(11) NOT NULL,
  \`guardian_id\` int(11) NOT NULL,
  \`patient_category_id\` int(11) DEFAULT NULL,
  \`package_id\` int(11) DEFAULT NULL,
  \`doctor_id\` int(11) DEFAULT NULL,
  \`booking_date\` varchar(50) NOT NULL,
  \`booking_time\` varchar(20) NOT NULL,
  \`method_type\` varchar(150) DEFAULT 'Klem Nano Sealer',
  \`anesthesia_type\` varchar(150) DEFAULT 'Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)',
  \`package_price_snapshot\` int(11) NOT NULL,
  \`discount_amount\` int(11) NOT NULL DEFAULT 0,
  \`total_amount\` int(11) NOT NULL,
  \`dp_amount\` int(11) NOT NULL DEFAULT 0,
  \`remaining_amount\` int(11) NOT NULL DEFAULT 0,
  \`patient_source\` varchar(100) NOT NULL DEFAULT 'Walk-in',
  \`closing_staff_id\` int(11) DEFAULT NULL,
  \`closing_staff_name\` varchar(255) DEFAULT NULL,
  \`notes\` text DEFAULT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'BOOKED',
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_bookings_number\` (\`booking_number\`),
  KEY \`idx_bookings_patient\` (\`patient_id\`),
  KEY \`idx_bookings_date\` (\`booking_date\`),
  KEY \`idx_bookings_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Booking Status History
DROP TABLE IF EXISTS \`booking_status_history\`;
CREATE TABLE IF NOT EXISTS \`booking_status_history\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`booking_id\` int(11) NOT NULL,
  \`status\` varchar(50) NOT NULL,
  \`changed_by\` varchar(150) NOT NULL DEFAULT 'Staff',
  \`notes\` text DEFAULT NULL,
  \`timestamp\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_history_booking\` (\`booking_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Queues Table (Antrean Harian Tindakan)
DROP TABLE IF EXISTS \`queues\`;
CREATE TABLE IF NOT EXISTS \`queues\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`queue_number\` varchar(50) NOT NULL,
  \`queue_date\` varchar(50) NOT NULL,
  \`booking_id\` int(11) NOT NULL,
  \`patient_id\` int(11) NOT NULL,
  \`doctor_id\` int(11) NOT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'WAITING',
  \`arrived_at\` varchar(20) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_queues_date\` (\`queue_date\`),
  KEY \`idx_queues_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Circumcision Procedures (Pelaksanaan Tindakan Medis)
DROP TABLE IF EXISTS \`circumcision_procedures\`;
CREATE TABLE IF NOT EXISTS \`circumcision_procedures\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`procedure_number\` varchar(100) NOT NULL,
  \`booking_id\` int(11) NOT NULL,
  \`patient_id\` int(11) NOT NULL,
  \`doctor_id\` int(11) NOT NULL,
  \`doctor_name_snapshot\` varchar(255) DEFAULT NULL,
  \`assistant_staff_id\` int(11) DEFAULT NULL,
  \`assistant_staff_name\` varchar(255) DEFAULT NULL,
  \`procedure_date\` varchar(50) NOT NULL,
  \`procedure_time\` varchar(20) NOT NULL,
  \`method_type\` varchar(150) NOT NULL DEFAULT 'Klem Nano Sealer',
  \`anesthesia_type\` varchar(150) DEFAULT 'Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)',
  \`pre_condition\` text DEFAULT NULL,
  \`procedure_notes\` text DEFAULT NULL,
  \`post_condition\` text DEFAULT NULL,
  \`care_instructions\` text DEFAULT NULL,
  \`control_date\` varchar(50) DEFAULT NULL,
  \`additional_notes\` text DEFAULT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'WAITING',
  \`checklist_data\` text DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`completed_at\` datetime DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_procedures_number\` (\`procedure_number\`),
  KEY \`idx_procedures_patient\` (\`patient_id\`),
  KEY \`idx_procedures_date\` (\`procedure_date\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Informed Consents (Surat Persetujuan Tindakan Medis)
DROP TABLE IF EXISTS \`informed_consents\`;
CREATE TABLE IF NOT EXISTS \`informed_consents\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`procedure_id\` int(11) NOT NULL,
  \`patient_id\` int(11) NOT NULL,
  \`guardian_id\` int(11) NOT NULL,
  \`doctor_id\` int(11) NOT NULL,
  \`consent_date\` varchar(50) NOT NULL,
  \`consent_time\` varchar(20) NOT NULL,
  \`is_approved\` tinyint(1) NOT NULL DEFAULT 1,
  \`guardian_signature\` longtext DEFAULT NULL,
  \`guardian_signer_name\` varchar(255) NOT NULL,
  \`guardian_nik\` varchar(50) DEFAULT NULL,
  \`doctor_signature\` longtext DEFAULT NULL,
  \`doctor_signer_name\` varchar(255) NOT NULL,
  \`witness_name\` varchar(255) DEFAULT NULL,
  \`witness_signature\` longtext DEFAULT NULL,
  \`emergency_contact\` varchar(100) DEFAULT NULL,
  \`notes\` text DEFAULT NULL,
  \`signed_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_consents_procedure\` (\`procedure_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Certificates (Sertifikat Keberanian Khitan)
DROP TABLE IF EXISTS \`certificates\`;
CREATE TABLE IF NOT EXISTS \`certificates\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`certificate_number\` varchar(100) NOT NULL,
  \`procedure_id\` int(11) NOT NULL,
  \`patient_id\` int(11) NOT NULL,
  \`issue_date\` varchar(50) NOT NULL,
  \`custom_title\` varchar(255) DEFAULT 'Sertifikat Keberanian Khitan',
  \`notes\` text DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_certificates_number\` (\`certificate_number\`),
  KEY \`idx_certificates_patient\` (\`patient_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Invoices (Faktur Pembayaran Kasir)
DROP TABLE IF EXISTS \`invoices\`;
CREATE TABLE IF NOT EXISTS \`invoices\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`invoice_number\` varchar(100) NOT NULL,
  \`booking_id\` int(11) NOT NULL,
  \`patient_id\` int(11) NOT NULL,
  \`invoice_date\` varchar(50) NOT NULL,
  \`package_amount\` int(11) NOT NULL,
  \`discount_amount\` int(11) NOT NULL DEFAULT 0,
  \`adjustment_amount\` int(11) NOT NULL DEFAULT 0,
  \`total_amount\` int(11) NOT NULL,
  \`paid_amount\` int(11) NOT NULL DEFAULT 0,
  \`balance_amount\` int(11) NOT NULL DEFAULT 0,
  \`status\` varchar(50) NOT NULL DEFAULT 'UNPAID',
  \`cashier_staff_id\` int(11) DEFAULT NULL,
  \`cashier_staff_name\` varchar(255) DEFAULT NULL,
  \`notes\` text DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_invoices_number\` (\`invoice_number\`),
  KEY \`idx_invoices_booking\` (\`booking_id\`),
  KEY \`idx_invoices_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Payments (Catatan Transaksi Penerimaan Kasir)
DROP TABLE IF EXISTS \`payments\`;
CREATE TABLE IF NOT EXISTS \`payments\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`invoice_id\` int(11) NOT NULL,
  \`payment_number\` varchar(100) NOT NULL,
  \`payment_date\` varchar(50) NOT NULL,
  \`payment_time\` varchar(20) DEFAULT '00:00:00',
  \`amount\` int(11) NOT NULL,
  \`payment_method\` varchar(100) NOT NULL,
  \`reference_number\` varchar(100) DEFAULT NULL,
  \`cashier_staff_id\` int(11) DEFAULT NULL,
  \`cashier_staff_name\` varchar(255) DEFAULT NULL,
  \`notes\` text DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_payments_number\` (\`payment_number\`),
  KEY \`idx_payments_invoice\` (\`invoice_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Doctor Fee Transactions
DROP TABLE IF EXISTS \`doctor_fee_transactions\`;
CREATE TABLE IF NOT EXISTS \`doctor_fee_transactions\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`fee_number\` varchar(100) NOT NULL,
  \`doctor_id\` int(11) NOT NULL,
  \`procedure_id\` int(11) NOT NULL,
  \`invoice_id\` int(11) NOT NULL,
  \`fee_amount\` int(11) NOT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'PENDING',
  \`paid_date\` varchar(50) DEFAULT NULL,
  \`notes\` text DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_doctor_fees_number\` (\`fee_number\`),
  KEY \`idx_doctor_fees_doctor\` (\`doctor_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Expense Categories & Transactions (Beban Biaya Klinik)
DROP TABLE IF EXISTS \`expense_categories\`;
CREATE TABLE IF NOT EXISTS \`expense_categories\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) NOT NULL,
  \`code\` varchar(50) NOT NULL,
  \`description\` text DEFAULT NULL,
  \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_expense_cat_code\` (\`code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS \`expense_transactions\`;
CREATE TABLE IF NOT EXISTS \`expense_transactions\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`expense_number\` varchar(100) NOT NULL,
  \`category_id\` int(11) NOT NULL,
  \`title\` varchar(255) NOT NULL,
  \`description\` text DEFAULT NULL,
  \`amount\` int(11) NOT NULL,
  \`expense_date\` varchar(50) NOT NULL,
  \`expense_time\` varchar(20) DEFAULT NULL,
  \`payment_method\` varchar(100) NOT NULL DEFAULT 'Cash',
  \`receipt_image_url\` text DEFAULT NULL,
  \`approved_by\` varchar(150) DEFAULT NULL,
  \`staff_id\` int(11) DEFAULT NULL,
  \`staff_name\` varchar(255) DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_expenses_number\` (\`expense_number\`),
  KEY \`idx_expenses_category\` (\`category_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Follow Ups (Kontrol & Pemantauan Pasca Khitan)
DROP TABLE IF EXISTS \`follow_ups\`;
CREATE TABLE IF NOT EXISTS \`follow_ups\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`procedure_id\` int(11) NOT NULL,
  \`patient_id\` int(11) NOT NULL,
  \`scheduled_date\` varchar(50) NOT NULL,
  \`actual_date\` varchar(50) DEFAULT NULL,
  \`day_number\` int(11) NOT NULL DEFAULT 1,
  \`channel\` varchar(100) NOT NULL DEFAULT 'WhatsApp',
  \`wound_condition\` text DEFAULT NULL,
  \`healing_progress\` text DEFAULT NULL,
  \`pain_level\` varchar(50) DEFAULT NULL,
  \`swelling_status\` varchar(50) DEFAULT NULL,
  \`photo_urls\` text DEFAULT NULL,
  \`notes\` text DEFAULT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'PENDING',
  \`contacted_by\` varchar(150) DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_followups_procedure\` (\`procedure_id\`),
  KEY \`idx_followups_patient\` (\`patient_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Products & Stock Inventory (Alat Medis, Obat, Celana Sunat)
DROP TABLE IF EXISTS \`products\`;
CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`sku\` varchar(100) NOT NULL,
  \`barcode\` varchar(100) DEFAULT NULL,
  \`name\` varchar(255) NOT NULL,
  \`category\` varchar(100) NOT NULL DEFAULT 'Medis',
  \`unit\` varchar(50) NOT NULL DEFAULT 'Pcs',
  \`purchase_price\` int(11) NOT NULL DEFAULT 0,
  \`selling_price\` int(11) NOT NULL DEFAULT 0,
  \`current_stock\` int(11) NOT NULL DEFAULT 0,
  \`min_stock_alert\` int(11) NOT NULL DEFAULT 5,
  \`description\` text DEFAULT NULL,
  \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
  \`is_deleted\` tinyint(1) NOT NULL DEFAULT 0,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_products_sku\` (\`sku\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS \`package_included_items\`;
CREATE TABLE IF NOT EXISTS \`package_included_items\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`package_id\` int(11) NOT NULL,
  \`product_id\` int(11) NOT NULL,
  \`quantity\` int(11) NOT NULL DEFAULT 1,
  \`notes\` text DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_pkg_items_pkg\` (\`package_id\`),
  KEY \`idx_pkg_items_prod\` (\`product_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS \`stock_movements\`;
CREATE TABLE IF NOT EXISTS \`stock_movements\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`movement_number\` varchar(100) NOT NULL,
  \`product_id\` int(11) NOT NULL,
  \`type\` varchar(50) NOT NULL,
  \`quantity\` int(11) NOT NULL,
  \`previous_stock\` int(11) NOT NULL,
  \`new_stock\` int(11) NOT NULL,
  \`reason\` text DEFAULT NULL,
  \`reference_id\` varchar(100) DEFAULT NULL,
  \`performed_by\` varchar(150) NOT NULL DEFAULT 'Staff',
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_stock_movements_number\` (\`movement_number\`),
  KEY \`idx_stock_mov_product\` (\`product_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS \`transaction_items\`;
CREATE TABLE IF NOT EXISTS \`transaction_items\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`invoice_id\` int(11) NOT NULL,
  \`product_id\` int(11) NOT NULL,
  \`product_name_snapshot\` varchar(255) NOT NULL,
  \`quantity\` int(11) NOT NULL DEFAULT 1,
  \`unit_price\` int(11) NOT NULL,
  \`total_price\` int(11) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_trans_items_invoice\` (\`invoice_id\`),
  KEY \`idx_trans_items_product\` (\`product_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. Employees & Payroll Management (SDM & Penggajian)
DROP TABLE IF EXISTS \`employees\`;
CREATE TABLE IF NOT EXISTS \`employees\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`employee_code\` varchar(50) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`role\` varchar(100) NOT NULL DEFAULT 'Perawat Asisten',
  \`specialty\` varchar(150) DEFAULT NULL,
  \`phone\` varchar(50) DEFAULT NULL,
  \`email\` varchar(191) DEFAULT NULL,
  \`address\` text DEFAULT NULL,
  \`join_date\` varchar(50) NOT NULL,
  \`base_salary\` int(11) NOT NULL DEFAULT 0,
  \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
  \`is_deleted\` tinyint(1) NOT NULL DEFAULT 0,
  \`notes\` text DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_employees_code\` (\`employee_code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS \`employee_fee_rules\`;
CREATE TABLE IF NOT EXISTS \`employee_fee_rules\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`employee_id\` int(11) NOT NULL,
  \`action_type\` varchar(100) NOT NULL DEFAULT 'ASSISTANT_KHITAN',
  \`fee_amount\` int(11) NOT NULL DEFAULT 0,
  \`effective_date\` varchar(50) NOT NULL,
  \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (\`id\`),
  KEY \`idx_emp_fee_rules_emp\` (\`employee_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS \`employee_fee_transactions\`;
CREATE TABLE IF NOT EXISTS \`employee_fee_transactions\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`fee_number\` varchar(100) NOT NULL,
  \`employee_id\` int(11) NOT NULL,
  \`procedure_id\` int(11) DEFAULT NULL,
  \`invoice_id\` int(11) DEFAULT NULL,
  \`action_type\` varchar(100) NOT NULL DEFAULT 'ASSISTANT_KHITAN',
  \`fee_amount\` int(11) NOT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'PENDING',
  \`paid_date\` varchar(50) DEFAULT NULL,
  \`notes\` text DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_emp_fee_trans_num\` (\`fee_number\`),
  KEY \`idx_emp_fee_trans_emp\` (\`employee_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS \`payrolls\`;
CREATE TABLE IF NOT EXISTS \`payrolls\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`payroll_number\` varchar(100) NOT NULL,
  \`employee_id\` int(11) NOT NULL,
  \`period_month\` int(11) NOT NULL,
  \`period_year\` int(11) NOT NULL,
  \`base_salary\` int(11) NOT NULL DEFAULT 0,
  \`fee_total\` int(11) NOT NULL DEFAULT 0,
  \`bonus_amount\` int(11) NOT NULL DEFAULT 0,
  \`deduction_amount\` int(11) NOT NULL DEFAULT 0,
  \`net_salary\` int(11) NOT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'DRAFT',
  \`payment_method\` varchar(50) DEFAULT 'Transfer',
  \`paid_at\` datetime DEFAULT NULL,
  \`paid_by\` varchar(150) DEFAULT NULL,
  \`notes\` text DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_payrolls_number\` (\`payroll_number\`),
  KEY \`idx_payrolls_emp\` (\`employee_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. Audit Logs & Clinic Settings
DROP TABLE IF EXISTS \`audit_logs\`;
CREATE TABLE IF NOT EXISTS \`audit_logs\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`action\` varchar(100) NOT NULL,
  \`entity\` varchar(100) NOT NULL,
  \`entity_id\` varchar(100) NOT NULL,
  \`performed_by\` varchar(150) NOT NULL,
  \`details\` text DEFAULT NULL,
  \`ip_address\` varchar(100) DEFAULT NULL,
  \`timestamp\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_audit_timestamp\` (\`timestamp\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS \`clinic_settings\`;
CREATE TABLE IF NOT EXISTS \`clinic_settings\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`clinic_name\` varchar(255) NOT NULL,
  \`tagline\` text DEFAULT NULL,
  \`address\` text DEFAULT NULL,
  \`phone\` varchar(50) DEFAULT NULL,
  \`email\` varchar(191) DEFAULT NULL,
  \`website\` varchar(255) DEFAULT NULL,
  \`logo_url\` text DEFAULT NULL,
  \`invoice_header\` text DEFAULT NULL,
  \`invoice_footer\` text DEFAULT NULL,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
}

/**
 * Format value safely according to standard MySQL dump specifications.
 */
function mysqlEscapeVal(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : 'NULL';
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (val instanceof Date) {
    const d = val.toISOString().replace('T', ' ').replace(/\..+/, '');
    return `'${d}'`;
  }

  // String escaping for MySQL
  const str = String(val);
  const escaped = str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\0/g, '\\0')
    .replace(/\x1a/g, '\\Z');

  return `'${escaped}'`;
}

/**
 * Build a complete, highly standard MySQL Dump SQL file.
 * Compatible with import via phpMyAdmin, MySQL Command-Line Client, HeidiSQL, or MySQL Workbench.
 */
export function buildCompleteMysqlDump(
  tables: Record<string, any[]>,
  userEmail: string,
  options: { type?: 'full' | 'data' | 'structure' } = { type: 'full' }
): { sql: string; totalRows: number } {
  const now = new Date();
  const type = options.type || 'full';

  let sqlOutput = `-- ==============================================================================\n`;
  sqlOutput += `-- Nano Circumcision Clinic Management System\n`;
  sqlOutput += `-- MySQL / MariaDB DATABASE ${type.toUpperCase()} BACKUP DUMP\n`;
  sqlOutput += `-- Tanggal Ekspor : ${now.toISOString()}\n`;
  sqlOutput += `-- Diekspor Oleh  : ${userEmail || 'admin@nanocircumcision.com'}\n`;
  sqlOutput += `-- Mode Backup    : ${type.toUpperCase()}\n`;
  sqlOutput += `-- Target RDBMS   : MySQL 5.7+, MySQL 8.0+, MariaDB 10+, phpMyAdmin, MySQL Workbench\n`;
  sqlOutput += `-- ==============================================================================\n\n`;

  // Standard MySQL Compatibility Headers
  sqlOutput += `/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;\n`;
  sqlOutput += `/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;\n`;
  sqlOutput += `/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;\n`;
  sqlOutput += `/*!50503 SET NAMES utf8mb4 */;\n`;
  sqlOutput += `/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;\n`;
  sqlOutput += `/*!40103 SET TIME_ZONE='+00:00' */;\n`;
  sqlOutput += `/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;\n`;
  sqlOutput += `/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;\n`;
  sqlOutput += `/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;\n`;
  sqlOutput += `/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;\n\n`;

  // BAGIAN 1: STRUKTUR DDL LENGKAP MYSQL
  if (type === 'full' || type === 'structure') {
    sqlOutput += `-- --------------------------------------------------------\n`;
    sqlOutput += `-- BAGIAN 1: STRUKTUR TABEL & INDEX MYSQL (DDL)\n`;
    sqlOutput += `-- --------------------------------------------------------\n\n`;
    sqlOutput += generateCompleteMysqlDdl();
    sqlOutput += `\n\n`;
  }

  // BAGIAN 2: DATA INSERTION (DML)
  let totalInserted = 0;
  if (type === 'full' || type === 'data') {
    sqlOutput += `-- --------------------------------------------------------\n`;
    sqlOutput += `-- BAGIAN 2: DATA INSERTION MYSQL (DML)\n`;
    sqlOutput += `-- --------------------------------------------------------\n\n`;

    const tableMapping: { [key: string]: string } = {
      clinicSettings: 'clinic_settings',
      users: 'users',
      guardians: 'guardians',
      patients: 'patients',
      patientCategories: 'patient_categories',
      circumcisionPackages: 'circumcision_packages',
      packagePrices: 'package_prices',
      circumcisionMethods: 'circumcision_methods',
      doctors: 'doctors',
      doctorSchedules: 'doctor_schedules',
      doctorFeeRules: 'doctor_fee_rules',
      bookings: 'bookings',
      bookingStatusHistory: 'booking_status_history',
      queues: 'queues',
      circumcisionProcedures: 'circumcision_procedures',
      informedConsents: 'informed_consents',
      certificates: 'certificates',
      invoices: 'invoices',
      payments: 'payments',
      doctorFeeTransactions: 'doctor_fee_transactions',
      expenseCategories: 'expense_categories',
      expenseTransactions: 'expense_transactions',
      followUps: 'follow_ups',
      products: 'products',
      packageIncludedItems: 'package_included_items',
      stockMovements: 'stock_movements',
      transactionItems: 'transaction_items',
      employees: 'employees',
      employeeFeeRules: 'employee_fee_rules',
      employeeFeeTransactions: 'employee_fee_transactions',
      payrolls: 'payrolls',
      auditLogs: 'audit_logs',
    };

    for (const [key, dbTableName] of Object.entries(tableMapping)) {
      const rows = tables[key];
      if (Array.isArray(rows) && rows.length > 0) {
        sqlOutput += `-- Dumping data untuk tabel \`${dbTableName}\` (${rows.length} baris)\n`;
        sqlOutput += `LOCK TABLES \`${dbTableName}\` WRITE;\n`;
        sqlOutput += `/*!40000 ALTER TABLE \`${dbTableName}\` DISABLE KEYS */;\n`;

        for (const row of rows) {
          const keys = Object.keys(row);
          const cols = keys.map((k) => `\`${k.replace(/([A-Z])/g, '_$1').toLowerCase()}\``);
          const vals = keys.map((k) => mysqlEscapeVal(row[k]));
          sqlOutput += `INSERT INTO \`${dbTableName}\` (${cols.join(', ')}) VALUES (${vals.join(', ')});\n`;
          totalInserted++;
        }

        sqlOutput += `/*!40000 ALTER TABLE \`${dbTableName}\` ENABLE KEYS */;\n`;
        sqlOutput += `UNLOCK TABLES;\n\n`;
      }
    }
  }

  // Standard MySQL Compatibility Footers
  sqlOutput += `-- --------------------------------------------------------\n`;
  sqlOutput += `-- RESTORASI VARIABEL SISTEM MYSQL\n`;
  sqlOutput += `-- --------------------------------------------------------\n`;
  sqlOutput += `/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;\n`;
  sqlOutput += `/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;\n`;
  sqlOutput += `/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;\n`;
  sqlOutput += `/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;\n`;
  sqlOutput += `/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;\n`;
  sqlOutput += `/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;\n`;
  sqlOutput += `/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;\n`;
  sqlOutput += `/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;\n\n`;

  sqlOutput += `-- ==============================================================================\n`;
  sqlOutput += `-- Selesai Dump MySQL Lengkap (${totalInserted} total baris data diekspor)\n`;
  sqlOutput += `-- Dump ini siap diimport ke MySQL / MariaDB via phpMyAdmin atau MySQL Workbench.\n`;
  sqlOutput += `-- ==============================================================================\n`;

  return { sql: sqlOutput, totalRows: totalInserted };
}
