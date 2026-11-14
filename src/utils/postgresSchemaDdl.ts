/**
 * Complete DDL Script Generator for Nano Circumcision Clinic PostgreSQL Database.
 * This guarantees that even in plain SQL exports, the entire relational structure
 * (Tables, Primary Keys, Foreign Keys, Defaults, Constraints, Sequences) is fully created
 * and matches src/db/schema.ts 100%!
 */

export function generateCompletePostgresDdl(): string {
  return `-- ==============================================================================
-- NANO CIRCUMCISION CLINIC MANAGEMENT SYSTEM
-- PostgreSQL Complete Schema DDL (Structure + Constraints + Sequences + Indexes)
-- Compatible with PostgreSQL 12+, 13, 14, 15, 16, 17, 18+ & pgAdmin 4
-- ==============================================================================

-- 1. Master Table: Branches / Cabang Klinik
CREATE TABLE IF NOT EXISTS public.branches (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    manager_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Master Table: Users & Staff Authentication
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    uid TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    phone TEXT,
    password_hash TEXT,
    permissions TEXT,
    branch_code TEXT DEFAULT 'PUSAT',
    last_login TIMESTAMP WITHOUT TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Master Table: Guardians / Orang Tua / Wali
CREATE TABLE IF NOT EXISTS public.guardians (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    father_name TEXT,
    mother_name TEXT,
    guardian_name TEXT,
    relationship TEXT NOT NULL DEFAULT 'Orang Tua',
    phone TEXT NOT NULL,
    alternate_phone TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Master Table: Patients / Pasien Khitan
CREATE TABLE IF NOT EXISTS public.patients (
    id SERIAL PRIMARY KEY,
    rm_number TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    nickname TEXT,
    nik TEXT,
    gender TEXT NOT NULL DEFAULT 'Laki-laki',
    birth_place TEXT,
    birth_date TEXT NOT NULL,
    age_years INTEGER NOT NULL DEFAULT 0,
    age_months INTEGER NOT NULL DEFAULT 0,
    address TEXT,
    phone TEXT,
    school TEXT,
    grade TEXT,
    weight_kg TEXT,
    height_cm TEXT,
    allergies TEXT,
    notes TEXT,
    guardian_id INTEGER NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    deleted_by TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Master Table: Patient Categories (REGULER, VIP, dll)
CREATE TABLE IF NOT EXISTS public.patient_categories (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 6. Master Table: Circumcision Packages (Paket Layanan Khitan)
CREATE TABLE IF NOT EXISTS public.circumcision_packages (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 45,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Master Table: Package Prices per Category
CREATE TABLE IF NOT EXISTS public.package_prices (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES public.circumcision_packages(id) ON DELETE CASCADE,
    patient_category_id INTEGER NOT NULL REFERENCES public.patient_categories(id) ON DELETE CASCADE,
    price INTEGER NOT NULL,
    effective_from TEXT NOT NULL,
    effective_until TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 8. Master Table: Circumcision Methods (Metode Tindakan Khitan)
CREATE TABLE IF NOT EXISTS public.circumcision_methods (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Master Table: Doctors (Dokter Operator Khitan)
CREATE TABLE IF NOT EXISTS public.doctors (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'dr.',
    specialty TEXT NOT NULL DEFAULT 'Dokter Operator Khitan',
    description TEXT,
    notes TEXT,
    phone TEXT,
    email TEXT,
    sip_number TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Doctor Schedules
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    max_capacity INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 11. Doctor Fee Rules
CREATE TABLE IF NOT EXISTS public.doctor_fee_rules (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    package_id INTEGER NOT NULL REFERENCES public.circumcision_packages(id) ON DELETE CASCADE,
    patient_category_id INTEGER NOT NULL REFERENCES public.patient_categories(id) ON DELETE CASCADE,
    fee_amount INTEGER NOT NULL,
    effective_date TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 12. Bookings Table (Form Booking Khitan)
CREATE TABLE IF NOT EXISTS public.bookings (
    id SERIAL PRIMARY KEY,
    booking_number TEXT NOT NULL UNIQUE,
    patient_id INTEGER NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    guardian_id INTEGER NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
    patient_category_id INTEGER REFERENCES public.patient_categories(id),
    package_id INTEGER REFERENCES public.circumcision_packages(id),
    doctor_id INTEGER REFERENCES public.doctors(id),
    booking_date TEXT NOT NULL,
    booking_time TEXT NOT NULL,
    method_type TEXT DEFAULT 'Klem Nano Sealer',
    anesthesia_type TEXT DEFAULT 'Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)',
    package_price_snapshot INTEGER NOT NULL,
    discount_amount INTEGER NOT NULL DEFAULT 0,
    total_amount INTEGER NOT NULL,
    dp_amount INTEGER NOT NULL DEFAULT 0,
    remaining_amount INTEGER NOT NULL DEFAULT 0,
    patient_source TEXT NOT NULL DEFAULT 'Walk-in',
    closing_staff_id INTEGER,
    closing_staff_name TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'BOOKED',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Booking Status History
CREATE TABLE IF NOT EXISTS public.booking_status_history (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    changed_by TEXT NOT NULL DEFAULT 'Staff',
    notes TEXT,
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Queues Table (Antrean Harian Tindakan)
CREATE TABLE IF NOT EXISTS public.queues (
    id SERIAL PRIMARY KEY,
    queue_number TEXT NOT NULL,
    queue_date TEXT NOT NULL,
    booking_id INTEGER NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'WAITING',
    arrived_at TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Circumcision Procedures (Pelaksanaan Tindakan Medis)
CREATE TABLE IF NOT EXISTS public.circumcision_procedures (
    id SERIAL PRIMARY KEY,
    procedure_number TEXT NOT NULL UNIQUE,
    booking_id INTEGER NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    doctor_name_snapshot TEXT,
    assistant_staff_id INTEGER,
    assistant_staff_name TEXT,
    procedure_date TEXT NOT NULL,
    procedure_time TEXT NOT NULL,
    method_type TEXT NOT NULL DEFAULT 'Klem Nano Sealer',
    anesthesia_type TEXT DEFAULT 'Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)',
    pre_condition TEXT,
    procedure_notes TEXT,
    post_condition TEXT,
    care_instructions TEXT,
    control_date TEXT,
    additional_notes TEXT,
    status TEXT NOT NULL DEFAULT 'WAITING',
    checklist_data TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITHOUT TIME ZONE
);

-- 16. Informed Consents (Surat Persetujuan Tindakan Medis)
CREATE TABLE IF NOT EXISTS public.informed_consents (
    id SERIAL PRIMARY KEY,
    procedure_id INTEGER NOT NULL REFERENCES public.circumcision_procedures(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    guardian_id INTEGER NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    consent_number TEXT,
    consent_date TEXT NOT NULL,
    consent_time TEXT NOT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'SIGNED',
    signer_name TEXT,
    signer_relation TEXT,
    guardian_signature TEXT,
    guardian_signer_name TEXT,
    guardian_nik TEXT,
    doctor_signature TEXT,
    doctor_signer_name TEXT,
    witness_name TEXT,
    witness_signature TEXT,
    emergency_contact TEXT,
    notes TEXT,
    signed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Certificates (Sertifikat Keberanian Khitan)
CREATE TABLE IF NOT EXISTS public.certificates (
    id SERIAL PRIMARY KEY,
    certificate_number TEXT NOT NULL UNIQUE,
    procedure_id INTEGER NOT NULL REFERENCES public.circumcision_procedures(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES public.doctors(id),
    issue_date TEXT NOT NULL,
    title TEXT DEFAULT 'Sertifikat Keberanian Khitan',
    custom_title TEXT DEFAULT 'Sertifikat Keberanian Khitan',
    content TEXT,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. Invoices (Faktur Pembayaran Kasir)
CREATE TABLE IF NOT EXISTS public.invoices (
    id SERIAL PRIMARY KEY,
    invoice_number TEXT NOT NULL UNIQUE,
    booking_id INTEGER NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES public.doctors(id),
    invoice_date TEXT NOT NULL,
    package_amount INTEGER NOT NULL DEFAULT 0,
    subtotal INTEGER NOT NULL DEFAULT 0,
    discount INTEGER NOT NULL DEFAULT 0,
    discount_amount INTEGER NOT NULL DEFAULT 0,
    adjustment_amount INTEGER NOT NULL DEFAULT 0,
    total_amount INTEGER NOT NULL,
    paid_amount INTEGER NOT NULL DEFAULT 0,
    remaining_amount INTEGER NOT NULL DEFAULT 0,
    balance_amount INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'UNPAID',
    void_reason TEXT,
    voided_at TIMESTAMP WITHOUT TIME ZONE,
    voided_by TEXT,
    cashier_staff_id INTEGER,
    cashier_staff_name TEXT,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. Payments (Catatan Transaksi Penerimaan Kasir)
CREATE TABLE IF NOT EXISTS public.payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    payment_number TEXT NOT NULL UNIQUE,
    payment_date TEXT NOT NULL,
    payment_time TEXT DEFAULT TO_CHAR(CURRENT_TIMESTAMP, 'HH24:MI:SS'),
    payment_type TEXT NOT NULL DEFAULT 'CASH',
    amount INTEGER NOT NULL,
    payment_method TEXT NOT NULL,
    reference_number TEXT,
    received_by TEXT,
    cashier_staff_id INTEGER,
    cashier_staff_name TEXT,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. Doctor Fee Transactions
CREATE TABLE IF NOT EXISTS public.doctor_fee_transactions (
    id SERIAL PRIMARY KEY,
    fee_number TEXT NOT NULL UNIQUE,
    fee_type TEXT NOT NULL DEFAULT 'PROCEDURE',
    title TEXT,
    doctor_id INTEGER NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    patient_id INTEGER REFERENCES public.patients(id) ON DELETE SET NULL,
    booking_id INTEGER REFERENCES public.bookings(id) ON DELETE SET NULL,
    procedure_id INTEGER REFERENCES public.circumcision_procedures(id) ON DELETE SET NULL,
    invoice_id INTEGER REFERENCES public.invoices(id) ON DELETE SET NULL,
    package_id INTEGER REFERENCES public.circumcision_packages(id),
    patient_category_id INTEGER REFERENCES public.patient_categories(id),
    method_name TEXT,
    patient_condition TEXT DEFAULT 'STANDAR',
    service_type TEXT DEFAULT 'REGULER',
    fee_amount INTEGER NOT NULL,
    fee_date TEXT,
    branch_code TEXT DEFAULT 'PUSAT',
    status TEXT NOT NULL DEFAULT 'PENDING',
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    paid_at TIMESTAMP WITHOUT TIME ZONE,
    paid_date TEXT,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20b. Doctor Method Fee Rules (Tarif Fee Dokter Berdasarkan Metode Khitan & Kondisi Pasien)
CREATE TABLE IF NOT EXISTS public.doctor_method_fee_rules (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER REFERENCES public.doctors(id) ON DELETE CASCADE,
    method_id INTEGER,
    method_name TEXT NOT NULL,
    patient_condition TEXT NOT NULL DEFAULT 'STANDAR',
    reguler_fee INTEGER NOT NULL DEFAULT 250000,
    vip_fee INTEGER NOT NULL DEFAULT 350000,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 21. Expense Categories & Transactions (Beban Biaya Klinik)
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT UNIQUE,
    description TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.expense_transactions (
    id SERIAL PRIMARY KEY,
    transaction_number TEXT UNIQUE,
    expense_number TEXT,
    expense_date TEXT NOT NULL,
    category_id INTEGER REFERENCES public.expense_categories(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL DEFAULT 'Operasional',
    title TEXT,
    description TEXT NOT NULL,
    amount INTEGER NOT NULL,
    expense_time TEXT,
    payment_method TEXT NOT NULL DEFAULT 'CASH',
    receipt_url TEXT,
    receipt_image_url TEXT,
    created_by TEXT NOT NULL DEFAULT 'Admin',
    status TEXT NOT NULL DEFAULT 'PAID',
    approved_by TEXT,
    staff_id INTEGER,
    staff_name TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 22. Follow Ups (Kontrol & Pemantauan Pasca Khitan)
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES public.bookings(id),
    procedure_id INTEGER NOT NULL REFERENCES public.circumcision_procedures(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    follow_up_type TEXT NOT NULL DEFAULT 'H+1',
    scheduled_date TEXT NOT NULL,
    actual_date TEXT,
    contact_date TEXT,
    day_number INTEGER NOT NULL DEFAULT 1,
    channel TEXT NOT NULL DEFAULT 'WhatsApp',
    staff_name TEXT,
    patient_condition TEXT,
    wound_condition TEXT,
    healing_progress TEXT,
    pain_level TEXT,
    swelling_status TEXT,
    photo_urls TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    contacted_by TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 23. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id SERIAL PRIMARY KEY,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 24. Clinic Settings
CREATE TABLE IF NOT EXISTS public.clinic_settings (
    id SERIAL PRIMARY KEY,
    clinic_name TEXT NOT NULL DEFAULT 'NANO CIRCUMCISION CLINIC',
    tagline TEXT DEFAULT 'Sunat Canggih & Modern',
    address TEXT DEFAULT 'Jl. Kesehatan No. 88, Jakarta Selatan',
    phone TEXT DEFAULT '0812-8888-9999',
    email TEXT DEFAULT 'info@nanocircumcision.com',
    website TEXT DEFAULT 'www.nanocircumcision.com',
    logo_url TEXT,
    invoice_header TEXT DEFAULT 'Terima kasih atas kepercayaan Anda pada Nano Circumcision.',
    invoice_footer TEXT DEFAULT 'Kwitansi & Invoice ini sah dan telah diproses secara digital.',
    invoice_paper_default TEXT DEFAULT 'A4',
    default_doctor_fee_type TEXT DEFAULT 'FIXED',
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 25. Products Table (Obat, Obat Tetes, Celana Sunat, Aksesoris, Mainan, Produk Lainnya)
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    barcode TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'pcs',
    sell_price INTEGER NOT NULL DEFAULT 0,
    cost_price INTEGER NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 26. Package Included Items
CREATE TABLE IF NOT EXISTS public.package_included_items (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES public.circumcision_packages(id) ON DELETE CASCADE,
    patient_category_id INTEGER REFERENCES public.patient_categories(id),
    product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    is_included BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 27. Stock Movements (Kartu Stok & Riwayat Mutasi)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id SERIAL PRIMARY KEY,
    movement_number TEXT NOT NULL UNIQUE,
    product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    current_stock INTEGER NOT NULL,
    unit_cost INTEGER NOT NULL DEFAULT 0,
    unit_price INTEGER NOT NULL DEFAULT 0,
    reference_type TEXT NOT NULL,
    reference_id INTEGER,
    notes TEXT,
    performed_by TEXT NOT NULL DEFAULT 'Staff',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 28. Transaction Items (Penjualan Kasir / Item Paket)
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    procedure_id INTEGER REFERENCES public.circumcision_procedures(id),
    invoice_id INTEGER REFERENCES public.invoices(id),
    product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    product_sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL,
    item_type TEXT NOT NULL DEFAULT 'ADDON',
    quantity INTEGER NOT NULL DEFAULT 1,
    cost_price_snapshot INTEGER NOT NULL DEFAULT 0,
    sell_price_snapshot INTEGER NOT NULL DEFAULT 0,
    discount_amount INTEGER NOT NULL DEFAULT 0,
    total_amount INTEGER NOT NULL DEFAULT 0,
    is_stock_deducted BOOLEAN NOT NULL DEFAULT false,
    deducted_at TIMESTAMP WITHOUT TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 29. Employees (SDM & Perawat / Karyawan)
CREATE TABLE IF NOT EXISTS public.employees (
    id SERIAL PRIMARY KEY,
    employee_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    position TEXT NOT NULL DEFAULT 'Perawat Khitan',
    role TEXT DEFAULT 'Perawat Khitan',
    specialty TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    start_date TEXT NOT NULL,
    basic_salary INTEGER NOT NULL DEFAULT 0,
    default_patient_fee INTEGER NOT NULL DEFAULT 20000,
    closing_fee_per_patient INTEGER NOT NULL DEFAULT 25000,
    overtime_hourly_rate INTEGER NOT NULL DEFAULT 35000,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 30. Employee Fee Rules
CREATE TABLE IF NOT EXISTS public.employee_fee_rules (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    package_id INTEGER REFERENCES public.circumcision_packages(id),
    patient_category_id INTEGER REFERENCES public.patient_categories(id),
    fee_amount INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 31. Employee Fee Transactions
CREATE TABLE IF NOT EXISTS public.employee_fee_transactions (
    id SERIAL PRIMARY KEY,
    fee_number TEXT NOT NULL UNIQUE,
    employee_id INTEGER NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    patient_id INTEGER REFERENCES public.patients(id) ON DELETE SET NULL,
    patient_rm TEXT,
    patient_name TEXT,
    booking_id INTEGER REFERENCES public.bookings(id) ON DELETE SET NULL,
    procedure_id INTEGER REFERENCES public.circumcision_procedures(id) ON DELETE SET NULL,
    procedure_date TEXT NOT NULL,
    fee_amount INTEGER NOT NULL,
    branch_code TEXT DEFAULT 'PUSAT',
    status TEXT NOT NULL DEFAULT 'PENDING',
    payroll_id INTEGER,
    paid_at TIMESTAMP WITHOUT TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 32. Payrolls (Penggajian Karyawan & Perawat)
CREATE TABLE IF NOT EXISTS public.payrolls (
    id SERIAL PRIMARY KEY,
    payroll_number TEXT NOT NULL UNIQUE,
    employee_id INTEGER NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    period_month TEXT NOT NULL,
    period_year INTEGER NOT NULL DEFAULT 2026,
    payment_date TEXT NOT NULL,
    basic_salary INTEGER NOT NULL DEFAULT 0,
    patient_fee_total INTEGER NOT NULL DEFAULT 0,
    patient_count INTEGER NOT NULL DEFAULT 0,
    closing_patient_count INTEGER NOT NULL DEFAULT 0,
    closing_fee_per_patient INTEGER NOT NULL DEFAULT 0,
    closing_fee_total INTEGER NOT NULL DEFAULT 0,
    overtime_hours INTEGER NOT NULL DEFAULT 0,
    overtime_hourly_rate INTEGER NOT NULL DEFAULT 0,
    overtime_total INTEGER NOT NULL DEFAULT 0,
    bonus_amount INTEGER NOT NULL DEFAULT 0,
    deduction_amount INTEGER NOT NULL DEFAULT 0,
    net_salary INTEGER NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'TRANSFER',
    status TEXT NOT NULL DEFAULT 'DRAFT',
    notes TEXT,
    paid_at TIMESTAMP WITHOUT TIME ZONE,
    processed_by TEXT NOT NULL DEFAULT 'Super Admin',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- AUTO-PATCH EXISTING COLUMNS IF DATABASE WAS PARTIALLY CREATED EARLIER
-- ==============================================================================
DO $$
BEGIN
    -- clinic_settings
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clinic_settings') THEN
        ALTER TABLE public.clinic_settings ADD COLUMN IF NOT EXISTS invoice_paper_default TEXT DEFAULT 'A4';
        ALTER TABLE public.clinic_settings ADD COLUMN IF NOT EXISTS default_doctor_fee_type TEXT DEFAULT 'FIXED';
    END IF;

    -- invoices
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='invoices') THEN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS doctor_id INTEGER REFERENCES public.doctors(id);
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS subtotal INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS remaining_amount INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS void_reason TEXT;
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS voided_at TIMESTAMP WITHOUT TIME ZONE;
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS voided_by TEXT;
    END IF;

    -- payments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='payments') THEN
        BEGIN
            ALTER TABLE public.payments ALTER COLUMN payment_time DROP NOT NULL;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
            ALTER TABLE public.payments ALTER COLUMN payment_time SET DEFAULT TO_CHAR(CURRENT_TIMESTAMP, 'HH24:MI:SS');
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_time TEXT DEFAULT TO_CHAR(CURRENT_TIMESTAMP, 'HH24:MI:SS');
        ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_type TEXT NOT NULL DEFAULT 'CASH';
        ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS received_by TEXT;
    END IF;

    -- products
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products') THEN
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sell_price INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_stock INTEGER NOT NULL DEFAULT 5;
    END IF;

    -- transaction_items
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='transaction_items') THEN
        ALTER TABLE public.transaction_items ADD COLUMN IF NOT EXISTS booking_id INTEGER REFERENCES public.bookings(id) ON DELETE CASCADE;
        ALTER TABLE public.transaction_items ADD COLUMN IF NOT EXISTS procedure_id INTEGER REFERENCES public.circumcision_procedures(id);
        ALTER TABLE public.transaction_items ADD COLUMN IF NOT EXISTS product_sku TEXT;
        ALTER TABLE public.transaction_items ADD COLUMN IF NOT EXISTS product_name TEXT;
        ALTER TABLE public.transaction_items ADD COLUMN IF NOT EXISTS category TEXT;
        ALTER TABLE public.transaction_items ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'ADDON';
        ALTER TABLE public.transaction_items ADD COLUMN IF NOT EXISTS cost_price_snapshot INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE public.transaction_items ADD COLUMN IF NOT EXISTS sell_price_snapshot INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE public.transaction_items ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE public.transaction_items ADD COLUMN IF NOT EXISTS total_amount INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE public.transaction_items ADD COLUMN IF NOT EXISTS is_stock_deducted BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE public.transaction_items ADD COLUMN IF NOT EXISTS deducted_at TIMESTAMP WITHOUT TIME ZONE;
        ALTER TABLE public.transaction_items ADD COLUMN IF NOT EXISTS notes TEXT;
    END IF;

    -- employees
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employees') THEN
        ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS position TEXT NOT NULL DEFAULT 'Perawat Khitan';
        ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS start_date TEXT;
        ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS basic_salary INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS default_patient_fee INTEGER NOT NULL DEFAULT 20000;
        ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS closing_fee_per_patient INTEGER NOT NULL DEFAULT 25000;
        ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS overtime_hourly_rate INTEGER NOT NULL DEFAULT 35000;
        ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS description TEXT;
    END IF;
END $$;

-- Performance & Search Indexes
CREATE INDEX IF NOT EXISTS idx_patients_rm ON public.patients(rm_number);
CREATE INDEX IF NOT EXISTS idx_patients_guardian ON public.patients(guardian_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_procedures_date ON public.circumcision_procedures(procedure_date);
CREATE INDEX IF NOT EXISTS idx_invoices_booking ON public.invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_employees_code ON public.employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.audit_logs(timestamp);

-- End of DDL
`;
}

export function buildCompletePostgresSqlDump(
  tables: Record<string, any[]>,
  userEmail: string,
  options: { type?: 'full' | 'data' | 'structure' } = { type: 'full' }
): { sql: string; totalRows: number } {
  const now = new Date();
  const type = options.type || 'full';

  let sqlOutput = `-- ========================================================\n`;
  sqlOutput += `-- Nano Circumcision Clinic Management System\n`;
  sqlOutput += `-- PostgreSQL ${type.toUpperCase()} DATABASE BACKUP DUMP\n`;
  sqlOutput += `-- Tanggal Ekspor: ${now.toISOString()}\n`;
  sqlOutput += `-- Diekspor Oleh: ${userEmail || 'admin@nanocircumcision.com'}\n`;
  sqlOutput += `-- Mode Backup  : ${type.toUpperCase()}\n`;
  sqlOutput += `-- Target RDBMS : PostgreSQL 12+, 13, 14, 15, 16, 17, 18+ (pgAdmin 4 Compatible)\n`;
  sqlOutput += `-- ========================================================\n\n`;

  // BAGIAN 1: STRUKTUR DDL LENGKAP (TABEL, FOREIGN KEY, INDEX, SEQUENCE, TIPE DATA)
  if (type === 'full' || type === 'structure') {
    sqlOutput += `-- --------------------------------------------------------\n`;
    sqlOutput += `-- BAGIAN 1: PEMBUATAN STRUKTUR TABEL & RELASI (DDL)\n`;
    sqlOutput += `-- --------------------------------------------------------\n\n`;
    sqlOutput += generateCompletePostgresDdl();
    sqlOutput += `\n\n`;
  }

  // BAGIAN 2: DATA INSERTION (DML)
  let totalInserted = 0;
  if (type === 'full' || type === 'data') {
    sqlOutput += `-- --------------------------------------------------------\n`;
    sqlOutput += `-- BAGIAN 2: DATA INSERTION (DML)\n`;
    sqlOutput += `-- --------------------------------------------------------\n\n`;
    sqlOutput += `BEGIN;\n\n`;

    function sqlVal(val: any): string {
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number') return String(val);
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      if (val instanceof Date) return `'${val.toISOString()}'`;
      if (typeof val === 'object') {
        return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
      }
      return `'${String(val).replace(/'/g, "''")}'`;
    }

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

    // Nonaktifkan pemeriksaan foreign key sementara agar proses restore aman tanpa kegagalan urutan relasi
    sqlOutput += `-- Nonaktifkan validasi foreign key & trigger sementara agar import data lancar dan tidak terbentur relasi antar tabel\n`;
    sqlOutput += `SET session_replication_role = 'replica';\n\n`;

    for (const [key, dbTableName] of Object.entries(tableMapping)) {
      const rows = tables[key];
      if (Array.isArray(rows) && rows.length > 0) {
        sqlOutput += `-- Data Tabel: ${dbTableName} (${rows.length} baris)\n`;
        for (const row of rows) {
          const keys = Object.keys(row);
          const cols = keys.map((k) => k.replace(/([A-Z])/g, '_$1').toLowerCase());
          const vals = keys.map((k) => sqlVal(row[k]));
          sqlOutput += `INSERT INTO ${dbTableName} (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;\n`;
          totalInserted++;
        }
        sqlOutput += `\n`;
      }
    }

    // Aktifkan kembali pemeriksaan foreign key dan validasi data
    sqlOutput += `-- Aktifkan kembali validasi integritas foreign key & trigger ke default\n`;
    sqlOutput += `SET session_replication_role = 'default';\n\n`;

    // BAGIAN 3: RESET SEQUENCES SECARA AMAN (COMPATIBLE SEMUA VERSI POSTGRESQL)
    sqlOutput += `-- --------------------------------------------------------\n`;
    sqlOutput += `-- BAGIAN 3: SINKRONISASI NILAI SEQUENCE (AUTO-INCREMENT)\n`;
    sqlOutput += `-- Menggunakan blok PL/pgSQL dinamis agar aman dari error NULL sequence\n`;
    sqlOutput += `-- --------------------------------------------------------\n\n`;
    sqlOutput += `DO $$\n`;
    sqlOutput += `DECLARE\n`;
    sqlOutput += `  tbl text;\n`;
    sqlOutput += `  seq text;\n`;
    sqlOutput += `  max_id bigint;\n`;
    sqlOutput += `  tables_list text[] := ARRAY[\n`;
    sqlOutput += `    'clinic_settings', 'users', 'guardians', 'patients', 'patient_categories',\n`;
    sqlOutput += `    'circumcision_packages', 'package_prices', 'circumcision_methods', 'doctors',\n`;
    sqlOutput += `    'doctor_schedules', 'doctor_fee_rules', 'bookings', 'booking_status_history',\n`;
    sqlOutput += `    'queues', 'circumcision_procedures', 'informed_consents', 'certificates',\n`;
    sqlOutput += `    'invoices', 'payments', 'doctor_fee_transactions', 'expense_categories',\n`;
    sqlOutput += `    'expense_transactions', 'follow_ups', 'products', 'package_included_items',\n`;
    sqlOutput += `    'stock_movements', 'transaction_items', 'employees', 'employee_fee_rules',\n`;
    sqlOutput += `    'employee_fee_transactions', 'payrolls', 'doctor_method_fee_rules', 'audit_logs'\n`;
    sqlOutput += `  ];\n`;
    sqlOutput += `BEGIN\n`;
    sqlOutput += `  FOREACH tbl IN ARRAY tables_list\n`;
    sqlOutput += `  LOOP\n`;
    sqlOutput += `    BEGIN\n`;
    sqlOutput += `      seq := pg_get_serial_sequence('public.' || tbl, 'id');\n`;
    sqlOutput += `      IF seq IS NOT NULL THEN\n`;
    sqlOutput += `        EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM public.%I', tbl) INTO max_id;\n`;
    sqlOutput += `        IF max_id > 0 THEN\n`;
    sqlOutput += `          PERFORM setval(seq, max_id, true);\n`;
    sqlOutput += `        ELSE\n`;
    sqlOutput += `          PERFORM setval(seq, 1, false);\n`;
    sqlOutput += `        END IF;\n`;
    sqlOutput += `      END IF;\n`;
    sqlOutput += `    EXCEPTION WHEN OTHERS THEN\n`;
    sqlOutput += `      -- Lewati jika tabel tidak memiliki sequence 'id'\n`;
    sqlOutput += `      NULL;\n`;
    sqlOutput += `    END;\n`;
    sqlOutput += `  END LOOP;\n`;
    sqlOutput += `END $$;\n\n`;

    sqlOutput += `COMMIT;\n`;
  }

  sqlOutput += `-- ========================================================\n`;
  sqlOutput += `-- Selesai Dump SQL (${totalInserted} total baris data diekspor)\n`;
  sqlOutput += `-- Struktur dan data siap direstore ke database baru via pgAdmin 4 atau psql.\n`;
  sqlOutput += `-- ========================================================\n`;

  return { sql: sqlOutput, totalRows: totalInserted };
}

/**
 * Extracts and returns an array of individual CREATE TABLE statements
 * in proper foreign-key dependency order for safe, resilient execution.
 */
export function getAllPostgresTableCreationStatements(): string[] {
  const ddl = generateCompletePostgresDdl();
  const matches = ddl.match(/CREATE TABLE IF NOT EXISTS [\s\S]*?\);/g);
  return matches ? matches.map(s => s.trim()) : [];
}

/**
 * Extracts and returns an array of individual CREATE INDEX statements.
 */
export function getAllPostgresIndexStatements(): string[] {
  const ddl = generateCompletePostgresDdl();
  const matches = ddl.match(/CREATE INDEX IF NOT EXISTS [\s\S]*?;/g);
  return matches ? matches.map(s => s.trim()) : [];
}
