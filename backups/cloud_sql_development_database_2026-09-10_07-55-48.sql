--
-- PostgreSQL database dump
--

\restrict HC3dXMZekUTy7AU4lxZfzS32WNc4tpyx9kWti4Y5ro6hxa5AfHge0fRVjoLF0bJ

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.6 (Debian 18.6-1.pgdg12+2)

-- Started on 2026-09-10 07:55:48 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.transaction_items DROP CONSTRAINT IF EXISTS transaction_items_product_id_products_id_fk;
ALTER TABLE IF EXISTS ONLY public.transaction_items DROP CONSTRAINT IF EXISTS transaction_items_procedure_id_circumcision_procedures_id_fk;
ALTER TABLE IF EXISTS ONLY public.transaction_items DROP CONSTRAINT IF EXISTS transaction_items_invoice_id_invoices_id_fk;
ALTER TABLE IF EXISTS ONLY public.transaction_items DROP CONSTRAINT IF EXISTS transaction_items_booking_id_bookings_id_fk;
ALTER TABLE IF EXISTS ONLY public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_product_id_products_id_fk;
ALTER TABLE IF EXISTS ONLY public.queues DROP CONSTRAINT IF EXISTS queues_patient_id_patients_id_fk;
ALTER TABLE IF EXISTS ONLY public.queues DROP CONSTRAINT IF EXISTS queues_doctor_id_doctors_id_fk;
ALTER TABLE IF EXISTS ONLY public.queues DROP CONSTRAINT IF EXISTS queues_booking_id_bookings_id_fk;
ALTER TABLE IF EXISTS ONLY public.payrolls DROP CONSTRAINT IF EXISTS payrolls_employee_id_employees_id_fk;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_invoice_id_invoices_id_fk;
ALTER TABLE IF EXISTS ONLY public.patients DROP CONSTRAINT IF EXISTS patients_guardian_id_guardians_id_fk;
ALTER TABLE IF EXISTS ONLY public.package_prices DROP CONSTRAINT IF EXISTS package_prices_patient_category_id_patient_categories_id_fk;
ALTER TABLE IF EXISTS ONLY public.package_prices DROP CONSTRAINT IF EXISTS package_prices_package_id_circumcision_packages_id_fk;
ALTER TABLE IF EXISTS ONLY public.package_included_items DROP CONSTRAINT IF EXISTS package_included_items_product_id_products_id_fk;
ALTER TABLE IF EXISTS ONLY public.package_included_items DROP CONSTRAINT IF EXISTS package_included_items_patient_category_id_patient_categories_i;
ALTER TABLE IF EXISTS ONLY public.package_included_items DROP CONSTRAINT IF EXISTS package_included_items_package_id_circumcision_packages_id_fk;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_patient_id_patients_id_fk;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_doctor_id_doctors_id_fk;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_booking_id_bookings_id_fk;
ALTER TABLE IF EXISTS ONLY public.informed_consents DROP CONSTRAINT IF EXISTS informed_consents_procedure_id_circumcision_procedures_id_fk;
ALTER TABLE IF EXISTS ONLY public.informed_consents DROP CONSTRAINT IF EXISTS informed_consents_patient_id_patients_id_fk;
ALTER TABLE IF EXISTS ONLY public.informed_consents DROP CONSTRAINT IF EXISTS informed_consents_guardian_id_guardians_id_fk;
ALTER TABLE IF EXISTS ONLY public.informed_consents DROP CONSTRAINT IF EXISTS informed_consents_doctor_id_doctors_id_fk;
ALTER TABLE IF EXISTS ONLY public.follow_ups DROP CONSTRAINT IF EXISTS follow_ups_procedure_id_circumcision_procedures_id_fk;
ALTER TABLE IF EXISTS ONLY public.follow_ups DROP CONSTRAINT IF EXISTS follow_ups_patient_id_patients_id_fk;
ALTER TABLE IF EXISTS ONLY public.follow_ups DROP CONSTRAINT IF EXISTS follow_ups_booking_id_bookings_id_fk;
ALTER TABLE IF EXISTS ONLY public.expense_transactions DROP CONSTRAINT IF EXISTS expense_transactions_category_id_expense_categories_id_fk;
ALTER TABLE IF EXISTS ONLY public.employee_fee_transactions DROP CONSTRAINT IF EXISTS employee_fee_transactions_procedure_id_circumcision_procedures_;
ALTER TABLE IF EXISTS ONLY public.employee_fee_transactions DROP CONSTRAINT IF EXISTS employee_fee_transactions_patient_id_patients_id_fk;
ALTER TABLE IF EXISTS ONLY public.employee_fee_transactions DROP CONSTRAINT IF EXISTS employee_fee_transactions_employee_id_employees_id_fk;
ALTER TABLE IF EXISTS ONLY public.employee_fee_transactions DROP CONSTRAINT IF EXISTS employee_fee_transactions_booking_id_bookings_id_fk;
ALTER TABLE IF EXISTS ONLY public.employee_fee_rules DROP CONSTRAINT IF EXISTS employee_fee_rules_patient_category_id_patient_categories_id_fk;
ALTER TABLE IF EXISTS ONLY public.employee_fee_rules DROP CONSTRAINT IF EXISTS employee_fee_rules_package_id_circumcision_packages_id_fk;
ALTER TABLE IF EXISTS ONLY public.employee_fee_rules DROP CONSTRAINT IF EXISTS employee_fee_rules_employee_id_employees_id_fk;
ALTER TABLE IF EXISTS ONLY public.doctor_schedules DROP CONSTRAINT IF EXISTS doctor_schedules_doctor_id_doctors_id_fk;
ALTER TABLE IF EXISTS ONLY public.doctor_fee_transactions DROP CONSTRAINT IF EXISTS doctor_fee_transactions_procedure_id_circumcision_procedures_id;
ALTER TABLE IF EXISTS ONLY public.doctor_fee_transactions DROP CONSTRAINT IF EXISTS doctor_fee_transactions_patient_id_patients_id_fk;
ALTER TABLE IF EXISTS ONLY public.doctor_fee_transactions DROP CONSTRAINT IF EXISTS doctor_fee_transactions_patient_category_id_patient_categories_;
ALTER TABLE IF EXISTS ONLY public.doctor_fee_transactions DROP CONSTRAINT IF EXISTS doctor_fee_transactions_package_id_circumcision_packages_id_fk;
ALTER TABLE IF EXISTS ONLY public.doctor_fee_transactions DROP CONSTRAINT IF EXISTS doctor_fee_transactions_invoice_id_invoices_id_fk;
ALTER TABLE IF EXISTS ONLY public.doctor_fee_transactions DROP CONSTRAINT IF EXISTS doctor_fee_transactions_doctor_id_doctors_id_fk;
ALTER TABLE IF EXISTS ONLY public.doctor_fee_transactions DROP CONSTRAINT IF EXISTS doctor_fee_transactions_booking_id_bookings_id_fk;
ALTER TABLE IF EXISTS ONLY public.doctor_fee_rules DROP CONSTRAINT IF EXISTS doctor_fee_rules_patient_category_id_patient_categories_id_fk;
ALTER TABLE IF EXISTS ONLY public.doctor_fee_rules DROP CONSTRAINT IF EXISTS doctor_fee_rules_package_id_circumcision_packages_id_fk;
ALTER TABLE IF EXISTS ONLY public.doctor_fee_rules DROP CONSTRAINT IF EXISTS doctor_fee_rules_doctor_id_doctors_id_fk;
ALTER TABLE IF EXISTS ONLY public.circumcision_procedures DROP CONSTRAINT IF EXISTS circumcision_procedures_patient_id_patients_id_fk;
ALTER TABLE IF EXISTS ONLY public.circumcision_procedures DROP CONSTRAINT IF EXISTS circumcision_procedures_doctor_id_doctors_id_fk;
ALTER TABLE IF EXISTS ONLY public.circumcision_procedures DROP CONSTRAINT IF EXISTS circumcision_procedures_booking_id_bookings_id_fk;
ALTER TABLE IF EXISTS ONLY public.certificates DROP CONSTRAINT IF EXISTS certificates_procedure_id_circumcision_procedures_id_fk;
ALTER TABLE IF EXISTS ONLY public.certificates DROP CONSTRAINT IF EXISTS certificates_patient_id_patients_id_fk;
ALTER TABLE IF EXISTS ONLY public.certificates DROP CONSTRAINT IF EXISTS certificates_doctor_id_doctors_id_fk;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_patient_id_patients_id_fk;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_patient_category_id_patient_categories_id_fk;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_package_id_circumcision_packages_id_fk;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_guardian_id_guardians_id_fk;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_doctor_id_doctors_id_fk;
ALTER TABLE IF EXISTS ONLY public.booking_status_history DROP CONSTRAINT IF EXISTS booking_status_history_booking_id_bookings_id_fk;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_uid_unique;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.transaction_items DROP CONSTRAINT IF EXISTS transaction_items_pkey;
ALTER TABLE IF EXISTS ONLY public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_pkey;
ALTER TABLE IF EXISTS ONLY public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_movement_number_unique;
ALTER TABLE IF EXISTS ONLY public.queues DROP CONSTRAINT IF EXISTS queues_pkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_sku_unique;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE IF EXISTS ONLY public.payrolls DROP CONSTRAINT IF EXISTS payrolls_pkey;
ALTER TABLE IF EXISTS ONLY public.payrolls DROP CONSTRAINT IF EXISTS payrolls_payroll_number_unique;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_pkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_payment_number_unique;
ALTER TABLE IF EXISTS ONLY public.patients DROP CONSTRAINT IF EXISTS patients_rm_number_unique;
ALTER TABLE IF EXISTS ONLY public.patients DROP CONSTRAINT IF EXISTS patients_pkey;
ALTER TABLE IF EXISTS ONLY public.patient_categories DROP CONSTRAINT IF EXISTS patient_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.patient_categories DROP CONSTRAINT IF EXISTS patient_categories_code_unique;
ALTER TABLE IF EXISTS ONLY public.package_prices DROP CONSTRAINT IF EXISTS package_prices_pkey;
ALTER TABLE IF EXISTS ONLY public.package_included_items DROP CONSTRAINT IF EXISTS package_included_items_pkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_pkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_invoice_number_unique;
ALTER TABLE IF EXISTS ONLY public.informed_consents DROP CONSTRAINT IF EXISTS informed_consents_pkey;
ALTER TABLE IF EXISTS ONLY public.informed_consents DROP CONSTRAINT IF EXISTS informed_consents_consent_number_unique;
ALTER TABLE IF EXISTS ONLY public.guardians DROP CONSTRAINT IF EXISTS guardians_pkey;
ALTER TABLE IF EXISTS ONLY public.follow_ups DROP CONSTRAINT IF EXISTS follow_ups_pkey;
ALTER TABLE IF EXISTS ONLY public.expense_transactions DROP CONSTRAINT IF EXISTS expense_transactions_transaction_number_unique;
ALTER TABLE IF EXISTS ONLY public.expense_transactions DROP CONSTRAINT IF EXISTS expense_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.expense_categories DROP CONSTRAINT IF EXISTS expense_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.expense_categories DROP CONSTRAINT IF EXISTS expense_categories_name_unique;
ALTER TABLE IF EXISTS ONLY public.employees DROP CONSTRAINT IF EXISTS employees_pkey;
ALTER TABLE IF EXISTS ONLY public.employees DROP CONSTRAINT IF EXISTS employees_employee_code_unique;
ALTER TABLE IF EXISTS ONLY public.employee_fee_transactions DROP CONSTRAINT IF EXISTS employee_fee_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.employee_fee_transactions DROP CONSTRAINT IF EXISTS employee_fee_transactions_fee_number_unique;
ALTER TABLE IF EXISTS ONLY public.employee_fee_rules DROP CONSTRAINT IF EXISTS employee_fee_rules_pkey;
ALTER TABLE IF EXISTS ONLY public.doctors DROP CONSTRAINT IF EXISTS doctors_pkey;
ALTER TABLE IF EXISTS ONLY public.doctors DROP CONSTRAINT IF EXISTS doctors_code_unique;
ALTER TABLE IF EXISTS ONLY public.doctor_schedules DROP CONSTRAINT IF EXISTS doctor_schedules_pkey;
ALTER TABLE IF EXISTS ONLY public.doctor_fee_transactions DROP CONSTRAINT IF EXISTS doctor_fee_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.doctor_fee_transactions DROP CONSTRAINT IF EXISTS doctor_fee_transactions_fee_number_unique;
ALTER TABLE IF EXISTS ONLY public.doctor_fee_rules DROP CONSTRAINT IF EXISTS doctor_fee_rules_pkey;
ALTER TABLE IF EXISTS ONLY public.clinic_settings DROP CONSTRAINT IF EXISTS clinic_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.circumcision_procedures DROP CONSTRAINT IF EXISTS circumcision_procedures_procedure_number_unique;
ALTER TABLE IF EXISTS ONLY public.circumcision_procedures DROP CONSTRAINT IF EXISTS circumcision_procedures_pkey;
ALTER TABLE IF EXISTS ONLY public.circumcision_packages DROP CONSTRAINT IF EXISTS circumcision_packages_pkey;
ALTER TABLE IF EXISTS ONLY public.circumcision_packages DROP CONSTRAINT IF EXISTS circumcision_packages_code_unique;
ALTER TABLE IF EXISTS ONLY public.circumcision_methods DROP CONSTRAINT IF EXISTS circumcision_methods_pkey;
ALTER TABLE IF EXISTS ONLY public.certificates DROP CONSTRAINT IF EXISTS certificates_pkey;
ALTER TABLE IF EXISTS ONLY public.certificates DROP CONSTRAINT IF EXISTS certificates_certificate_number_unique;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_pkey;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_booking_number_unique;
ALTER TABLE IF EXISTS ONLY public.booking_status_history DROP CONSTRAINT IF EXISTS booking_status_history_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.transaction_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.stock_movements ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.queues ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.products ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.payrolls ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.payments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.patients ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.patient_categories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.package_prices ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.package_included_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.invoices ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.informed_consents ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.guardians ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.follow_ups ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.expense_transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.expense_categories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.employees ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.employee_fee_transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.employee_fee_rules ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.doctors ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.doctor_schedules ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.doctor_fee_transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.doctor_fee_rules ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.clinic_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.circumcision_procedures ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.circumcision_packages ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.circumcision_methods ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.certificates ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.bookings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.booking_status_history ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.transaction_items_id_seq;
DROP TABLE IF EXISTS public.transaction_items;
DROP SEQUENCE IF EXISTS public.stock_movements_id_seq;
DROP TABLE IF EXISTS public.stock_movements;
DROP SEQUENCE IF EXISTS public.queues_id_seq;
DROP TABLE IF EXISTS public.queues;
DROP SEQUENCE IF EXISTS public.products_id_seq;
DROP TABLE IF EXISTS public.products;
DROP SEQUENCE IF EXISTS public.payrolls_id_seq;
DROP TABLE IF EXISTS public.payrolls;
DROP SEQUENCE IF EXISTS public.payments_id_seq;
DROP TABLE IF EXISTS public.payments;
DROP SEQUENCE IF EXISTS public.patients_id_seq;
DROP TABLE IF EXISTS public.patients;
DROP SEQUENCE IF EXISTS public.patient_categories_id_seq;
DROP TABLE IF EXISTS public.patient_categories;
DROP SEQUENCE IF EXISTS public.package_prices_id_seq;
DROP TABLE IF EXISTS public.package_prices;
DROP SEQUENCE IF EXISTS public.package_included_items_id_seq;
DROP TABLE IF EXISTS public.package_included_items;
DROP SEQUENCE IF EXISTS public.invoices_id_seq;
DROP TABLE IF EXISTS public.invoices;
DROP SEQUENCE IF EXISTS public.informed_consents_id_seq;
DROP TABLE IF EXISTS public.informed_consents;
DROP SEQUENCE IF EXISTS public.guardians_id_seq;
DROP TABLE IF EXISTS public.guardians;
DROP SEQUENCE IF EXISTS public.follow_ups_id_seq;
DROP TABLE IF EXISTS public.follow_ups;
DROP SEQUENCE IF EXISTS public.expense_transactions_id_seq;
DROP TABLE IF EXISTS public.expense_transactions;
DROP SEQUENCE IF EXISTS public.expense_categories_id_seq;
DROP TABLE IF EXISTS public.expense_categories;
DROP SEQUENCE IF EXISTS public.employees_id_seq;
DROP TABLE IF EXISTS public.employees;
DROP SEQUENCE IF EXISTS public.employee_fee_transactions_id_seq;
DROP TABLE IF EXISTS public.employee_fee_transactions;
DROP SEQUENCE IF EXISTS public.employee_fee_rules_id_seq;
DROP TABLE IF EXISTS public.employee_fee_rules;
DROP SEQUENCE IF EXISTS public.doctors_id_seq;
DROP TABLE IF EXISTS public.doctors;
DROP SEQUENCE IF EXISTS public.doctor_schedules_id_seq;
DROP TABLE IF EXISTS public.doctor_schedules;
DROP SEQUENCE IF EXISTS public.doctor_fee_transactions_id_seq;
DROP TABLE IF EXISTS public.doctor_fee_transactions;
DROP SEQUENCE IF EXISTS public.doctor_fee_rules_id_seq;
DROP TABLE IF EXISTS public.doctor_fee_rules;
DROP SEQUENCE IF EXISTS public.clinic_settings_id_seq;
DROP TABLE IF EXISTS public.clinic_settings;
DROP SEQUENCE IF EXISTS public.circumcision_procedures_id_seq;
DROP TABLE IF EXISTS public.circumcision_procedures;
DROP SEQUENCE IF EXISTS public.circumcision_packages_id_seq;
DROP TABLE IF EXISTS public.circumcision_packages;
DROP SEQUENCE IF EXISTS public.circumcision_methods_id_seq;
DROP TABLE IF EXISTS public.circumcision_methods;
DROP SEQUENCE IF EXISTS public.certificates_id_seq;
DROP TABLE IF EXISTS public.certificates;
DROP SEQUENCE IF EXISTS public.bookings_id_seq;
DROP TABLE IF EXISTS public.bookings;
DROP SEQUENCE IF EXISTS public.booking_status_history_id_seq;
DROP TABLE IF EXISTS public.booking_status_history;
DROP SEQUENCE IF EXISTS public.audit_logs_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 16580)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    action text NOT NULL,
    entity text NOT NULL,
    entity_id text NOT NULL,
    performed_by text NOT NULL,
    details text,
    "timestamp" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO ai_studio_admin;

--
-- TOC entry 219 (class 1259 OID 16579)
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4494 (class 0 OID 0)
-- Dependencies: 219
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- TOC entry 222 (class 1259 OID 16595)
-- Name: booking_status_history; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.booking_status_history (
    id integer NOT NULL,
    booking_id integer NOT NULL,
    status text NOT NULL,
    changed_by text DEFAULT 'Staff'::text NOT NULL,
    notes text,
    "timestamp" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.booking_status_history OWNER TO ai_studio_admin;

--
-- TOC entry 221 (class 1259 OID 16594)
-- Name: booking_status_history_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.booking_status_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.booking_status_history_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4495 (class 0 OID 0)
-- Dependencies: 221
-- Name: booking_status_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.booking_status_history_id_seq OWNED BY public.booking_status_history.id;


--
-- TOC entry 224 (class 1259 OID 16610)
-- Name: bookings; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.bookings (
    id integer NOT NULL,
    booking_number text NOT NULL,
    patient_id integer NOT NULL,
    guardian_id integer NOT NULL,
    patient_category_id integer NOT NULL,
    package_id integer NOT NULL,
    doctor_id integer NOT NULL,
    booking_date text NOT NULL,
    booking_time text NOT NULL,
    package_price_snapshot integer NOT NULL,
    discount_amount integer DEFAULT 0 NOT NULL,
    total_amount integer NOT NULL,
    dp_amount integer DEFAULT 0 NOT NULL,
    remaining_amount integer DEFAULT 0 NOT NULL,
    patient_source text DEFAULT 'Walk-in'::text NOT NULL,
    notes text,
    status text DEFAULT 'BOOKED'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    closing_staff_id integer,
    closing_staff_name text,
    method_type text DEFAULT 'Klem Nano Sealer'::text,
    anesthesia_type text DEFAULT 'Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)'::text
);


ALTER TABLE public.bookings OWNER TO ai_studio_admin;

--
-- TOC entry 223 (class 1259 OID 16609)
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bookings_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4496 (class 0 OID 0)
-- Dependencies: 223
-- Name: bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.bookings_id_seq OWNED BY public.bookings.id;


--
-- TOC entry 226 (class 1259 OID 16643)
-- Name: certificates; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.certificates (
    id integer NOT NULL,
    certificate_number text NOT NULL,
    procedure_id integer NOT NULL,
    patient_id integer NOT NULL,
    doctor_id integer NOT NULL,
    issue_date text NOT NULL,
    title text DEFAULT 'SERTIFIKAT KHITAN NANO CIRCUMCISION'::text NOT NULL,
    content text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.certificates OWNER TO ai_studio_admin;

--
-- TOC entry 225 (class 1259 OID 16642)
-- Name: certificates_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.certificates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.certificates_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4497 (class 0 OID 0)
-- Dependencies: 225
-- Name: certificates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.certificates_id_seq OWNED BY public.certificates.id;


--
-- TOC entry 282 (class 1259 OID 17602)
-- Name: circumcision_methods; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.circumcision_methods (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.circumcision_methods OWNER TO ai_studio_admin;

--
-- TOC entry 281 (class 1259 OID 17601)
-- Name: circumcision_methods_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.circumcision_methods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.circumcision_methods_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4498 (class 0 OID 0)
-- Dependencies: 281
-- Name: circumcision_methods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.circumcision_methods_id_seq OWNED BY public.circumcision_methods.id;


--
-- TOC entry 228 (class 1259 OID 16663)
-- Name: circumcision_packages; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.circumcision_packages (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    duration_minutes integer DEFAULT 45 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.circumcision_packages OWNER TO ai_studio_admin;

--
-- TOC entry 227 (class 1259 OID 16662)
-- Name: circumcision_packages_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.circumcision_packages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.circumcision_packages_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4499 (class 0 OID 0)
-- Dependencies: 227
-- Name: circumcision_packages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.circumcision_packages_id_seq OWNED BY public.circumcision_packages.id;


--
-- TOC entry 230 (class 1259 OID 16682)
-- Name: circumcision_procedures; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.circumcision_procedures (
    id integer NOT NULL,
    procedure_number text NOT NULL,
    booking_id integer NOT NULL,
    patient_id integer NOT NULL,
    doctor_id integer NOT NULL,
    procedure_date text NOT NULL,
    procedure_time text NOT NULL,
    method_type text DEFAULT 'Klem Nano Sealer'::text NOT NULL,
    pre_condition text,
    procedure_notes text,
    post_condition text,
    care_instructions text,
    control_date text,
    additional_notes text,
    status text DEFAULT 'WAITING'::text NOT NULL,
    checklist_data text,
    created_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    doctor_name_snapshot text,
    assistant_staff_id integer,
    assistant_staff_name text,
    anesthesia_type text DEFAULT 'Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)'::text
);


ALTER TABLE public.circumcision_procedures OWNER TO ai_studio_admin;

--
-- TOC entry 229 (class 1259 OID 16681)
-- Name: circumcision_procedures_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.circumcision_procedures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.circumcision_procedures_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4500 (class 0 OID 0)
-- Dependencies: 229
-- Name: circumcision_procedures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.circumcision_procedures_id_seq OWNED BY public.circumcision_procedures.id;


--
-- TOC entry 232 (class 1259 OID 16705)
-- Name: clinic_settings; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.clinic_settings (
    id integer NOT NULL,
    clinic_name text DEFAULT 'NANO CIRCUMCISION CLINIC'::text NOT NULL,
    tagline text DEFAULT 'Pusat Khitan Modern, Aman & Nyaman Tanpa Jahit'::text,
    address text DEFAULT 'Jl. Kesehatan No. 88, Jakarta Selatan'::text,
    phone text DEFAULT '0812-8888-9999'::text,
    email text DEFAULT 'info@nanocircumcision.com'::text,
    website text DEFAULT 'www.nanocircumcision.com'::text,
    logo_url text,
    invoice_header text DEFAULT 'Terima kasih atas kepercayaan Anda pada Nano Circumcision.'::text,
    invoice_footer text DEFAULT 'Kwitansi & Invoice ini sah dan telah diproses secara digital.'::text,
    invoice_paper_default text DEFAULT 'A4'::text,
    default_doctor_fee_type text DEFAULT 'FIXED'::text,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.clinic_settings OWNER TO ai_studio_admin;

--
-- TOC entry 231 (class 1259 OID 16704)
-- Name: clinic_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.clinic_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinic_settings_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4501 (class 0 OID 0)
-- Dependencies: 231
-- Name: clinic_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.clinic_settings_id_seq OWNED BY public.clinic_settings.id;


--
-- TOC entry 234 (class 1259 OID 16727)
-- Name: doctor_fee_rules; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.doctor_fee_rules (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    package_id integer NOT NULL,
    patient_category_id integer NOT NULL,
    fee_amount integer NOT NULL,
    effective_date text NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.doctor_fee_rules OWNER TO ai_studio_admin;

--
-- TOC entry 233 (class 1259 OID 16726)
-- Name: doctor_fee_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.doctor_fee_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctor_fee_rules_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4502 (class 0 OID 0)
-- Dependencies: 233
-- Name: doctor_fee_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.doctor_fee_rules_id_seq OWNED BY public.doctor_fee_rules.id;


--
-- TOC entry 236 (class 1259 OID 16744)
-- Name: doctor_fee_transactions; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.doctor_fee_transactions (
    id integer NOT NULL,
    fee_number text NOT NULL,
    doctor_id integer NOT NULL,
    patient_id integer NOT NULL,
    booking_id integer NOT NULL,
    procedure_id integer NOT NULL,
    invoice_id integer NOT NULL,
    package_id integer NOT NULL,
    patient_category_id integer NOT NULL,
    fee_amount integer NOT NULL,
    fee_date text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    approved_at timestamp without time zone,
    paid_at timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.doctor_fee_transactions OWNER TO ai_studio_admin;

--
-- TOC entry 235 (class 1259 OID 16743)
-- Name: doctor_fee_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.doctor_fee_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctor_fee_transactions_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4503 (class 0 OID 0)
-- Dependencies: 235
-- Name: doctor_fee_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.doctor_fee_transactions_id_seq OWNED BY public.doctor_fee_transactions.id;


--
-- TOC entry 238 (class 1259 OID 16769)
-- Name: doctor_schedules; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.doctor_schedules (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    day_of_week text NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    max_capacity integer DEFAULT 10 NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.doctor_schedules OWNER TO ai_studio_admin;

--
-- TOC entry 237 (class 1259 OID 16768)
-- Name: doctor_schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.doctor_schedules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctor_schedules_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4504 (class 0 OID 0)
-- Dependencies: 237
-- Name: doctor_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.doctor_schedules_id_seq OWNED BY public.doctor_schedules.id;


--
-- TOC entry 240 (class 1259 OID 16787)
-- Name: doctors; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.doctors (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    title text DEFAULT 'dr.'::text NOT NULL,
    specialty text DEFAULT 'Dokter Operator Khitan'::text NOT NULL,
    phone text,
    email text,
    sip_number text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    description text,
    notes text,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.doctors OWNER TO ai_studio_admin;

--
-- TOC entry 239 (class 1259 OID 16786)
-- Name: doctors_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.doctors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctors_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4505 (class 0 OID 0)
-- Dependencies: 239
-- Name: doctors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.doctors_id_seq OWNED BY public.doctors.id;


--
-- TOC entry 274 (class 1259 OID 17410)
-- Name: employee_fee_rules; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.employee_fee_rules (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    package_id integer,
    patient_category_id integer,
    fee_amount integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.employee_fee_rules OWNER TO ai_studio_admin;

--
-- TOC entry 273 (class 1259 OID 17409)
-- Name: employee_fee_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.employee_fee_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_fee_rules_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4506 (class 0 OID 0)
-- Dependencies: 273
-- Name: employee_fee_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.employee_fee_rules_id_seq OWNED BY public.employee_fee_rules.id;


--
-- TOC entry 276 (class 1259 OID 17422)
-- Name: employee_fee_transactions; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.employee_fee_transactions (
    id integer NOT NULL,
    fee_number text NOT NULL,
    employee_id integer NOT NULL,
    employee_name text NOT NULL,
    patient_id integer NOT NULL,
    patient_rm text NOT NULL,
    patient_name text NOT NULL,
    booking_id integer NOT NULL,
    procedure_id integer NOT NULL,
    procedure_date text NOT NULL,
    fee_amount integer NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    payroll_id integer,
    paid_at timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.employee_fee_transactions OWNER TO ai_studio_admin;

--
-- TOC entry 275 (class 1259 OID 17421)
-- Name: employee_fee_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.employee_fee_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_fee_transactions_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4507 (class 0 OID 0)
-- Dependencies: 275
-- Name: employee_fee_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.employee_fee_transactions_id_seq OWNED BY public.employee_fee_transactions.id;


--
-- TOC entry 278 (class 1259 OID 17447)
-- Name: employees; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    employee_code text NOT NULL,
    name text NOT NULL,
    "position" text DEFAULT 'Perawat Khitan'::text NOT NULL,
    phone text,
    email text,
    start_date text NOT NULL,
    basic_salary integer DEFAULT 0 NOT NULL,
    default_patient_fee integer DEFAULT 20000 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    closing_fee_per_patient integer DEFAULT 25000 NOT NULL,
    overtime_hourly_rate integer DEFAULT 35000 NOT NULL,
    description text,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.employees OWNER TO ai_studio_admin;

--
-- TOC entry 277 (class 1259 OID 17446)
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4508 (class 0 OID 0)
-- Dependencies: 277
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- TOC entry 242 (class 1259 OID 16808)
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.expense_categories (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    is_default boolean DEFAULT false NOT NULL
);


ALTER TABLE public.expense_categories OWNER TO ai_studio_admin;

--
-- TOC entry 241 (class 1259 OID 16807)
-- Name: expense_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.expense_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expense_categories_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4509 (class 0 OID 0)
-- Dependencies: 241
-- Name: expense_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.expense_categories_id_seq OWNED BY public.expense_categories.id;


--
-- TOC entry 244 (class 1259 OID 16823)
-- Name: expense_transactions; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.expense_transactions (
    id integer NOT NULL,
    transaction_number text NOT NULL,
    expense_date text NOT NULL,
    category_id integer,
    category_name text NOT NULL,
    description text NOT NULL,
    amount integer NOT NULL,
    payment_method text DEFAULT 'CASH'::text NOT NULL,
    receipt_url text,
    created_by text DEFAULT 'Admin'::text NOT NULL,
    status text DEFAULT 'PAID'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.expense_transactions OWNER TO ai_studio_admin;

--
-- TOC entry 243 (class 1259 OID 16822)
-- Name: expense_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.expense_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expense_transactions_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4510 (class 0 OID 0)
-- Dependencies: 243
-- Name: expense_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.expense_transactions_id_seq OWNED BY public.expense_transactions.id;


--
-- TOC entry 246 (class 1259 OID 16847)
-- Name: follow_ups; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.follow_ups (
    id integer NOT NULL,
    booking_id integer NOT NULL,
    procedure_id integer NOT NULL,
    patient_id integer NOT NULL,
    follow_up_type text NOT NULL,
    scheduled_date text NOT NULL,
    contact_date text,
    staff_name text,
    patient_condition text,
    notes text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.follow_ups OWNER TO ai_studio_admin;

--
-- TOC entry 245 (class 1259 OID 16846)
-- Name: follow_ups_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.follow_ups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.follow_ups_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4511 (class 0 OID 0)
-- Dependencies: 245
-- Name: follow_ups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.follow_ups_id_seq OWNED BY public.follow_ups.id;


--
-- TOC entry 248 (class 1259 OID 16865)
-- Name: guardians; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.guardians (
    id integer NOT NULL,
    name text NOT NULL,
    father_name text,
    mother_name text,
    guardian_name text,
    relationship text DEFAULT 'Orang Tua'::text NOT NULL,
    phone text NOT NULL,
    alternate_phone text,
    address text,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.guardians OWNER TO ai_studio_admin;

--
-- TOC entry 247 (class 1259 OID 16864)
-- Name: guardians_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.guardians_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.guardians_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4512 (class 0 OID 0)
-- Dependencies: 247
-- Name: guardians_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.guardians_id_seq OWNED BY public.guardians.id;


--
-- TOC entry 250 (class 1259 OID 16880)
-- Name: informed_consents; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.informed_consents (
    id integer NOT NULL,
    consent_number text NOT NULL,
    procedure_id integer NOT NULL,
    patient_id integer NOT NULL,
    guardian_id integer NOT NULL,
    doctor_id integer NOT NULL,
    consent_date text NOT NULL,
    signer_name text NOT NULL,
    signer_relation text NOT NULL,
    status text DEFAULT 'SIGNED'::text NOT NULL,
    signed_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.informed_consents OWNER TO ai_studio_admin;

--
-- TOC entry 249 (class 1259 OID 16879)
-- Name: informed_consents_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.informed_consents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.informed_consents_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4513 (class 0 OID 0)
-- Dependencies: 249
-- Name: informed_consents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.informed_consents_id_seq OWNED BY public.informed_consents.id;


--
-- TOC entry 252 (class 1259 OID 16903)
-- Name: invoices; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    invoice_number text NOT NULL,
    booking_id integer NOT NULL,
    patient_id integer NOT NULL,
    doctor_id integer NOT NULL,
    invoice_date text NOT NULL,
    subtotal integer NOT NULL,
    discount integer DEFAULT 0 NOT NULL,
    total_amount integer NOT NULL,
    paid_amount integer DEFAULT 0 NOT NULL,
    remaining_amount integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'UNPAID'::text NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    void_reason text,
    voided_at timestamp without time zone,
    voided_by text
);


ALTER TABLE public.invoices OWNER TO ai_studio_admin;

--
-- TOC entry 251 (class 1259 OID 16902)
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4514 (class 0 OID 0)
-- Dependencies: 251
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- TOC entry 266 (class 1259 OID 17258)
-- Name: package_included_items; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.package_included_items (
    id integer NOT NULL,
    package_id integer NOT NULL,
    patient_category_id integer,
    product_id integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    is_included boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.package_included_items OWNER TO ai_studio_admin;

--
-- TOC entry 265 (class 1259 OID 17257)
-- Name: package_included_items_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.package_included_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.package_included_items_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4515 (class 0 OID 0)
-- Dependencies: 265
-- Name: package_included_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.package_included_items_id_seq OWNED BY public.package_included_items.id;


--
-- TOC entry 254 (class 1259 OID 16931)
-- Name: package_prices; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.package_prices (
    id integer NOT NULL,
    package_id integer NOT NULL,
    patient_category_id integer NOT NULL,
    price integer NOT NULL,
    effective_from text NOT NULL,
    effective_until text,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.package_prices OWNER TO ai_studio_admin;

--
-- TOC entry 253 (class 1259 OID 16930)
-- Name: package_prices_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.package_prices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.package_prices_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4516 (class 0 OID 0)
-- Dependencies: 253
-- Name: package_prices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.package_prices_id_seq OWNED BY public.package_prices.id;


--
-- TOC entry 256 (class 1259 OID 16947)
-- Name: patient_categories; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.patient_categories (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.patient_categories OWNER TO ai_studio_admin;

--
-- TOC entry 255 (class 1259 OID 16946)
-- Name: patient_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.patient_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.patient_categories_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4517 (class 0 OID 0)
-- Dependencies: 255
-- Name: patient_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.patient_categories_id_seq OWNED BY public.patient_categories.id;


--
-- TOC entry 258 (class 1259 OID 16965)
-- Name: patients; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.patients (
    id integer NOT NULL,
    rm_number text NOT NULL,
    full_name text NOT NULL,
    nickname text,
    nik text,
    gender text DEFAULT 'Laki-laki'::text NOT NULL,
    birth_place text,
    birth_date text NOT NULL,
    age_years integer DEFAULT 0 NOT NULL,
    age_months integer DEFAULT 0 NOT NULL,
    address text,
    phone text,
    school text,
    grade text,
    weight_kg text,
    height_cm text,
    allergies text,
    notes text,
    guardian_id integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp without time zone,
    deleted_by text
);


ALTER TABLE public.patients OWNER TO ai_studio_admin;

--
-- TOC entry 257 (class 1259 OID 16964)
-- Name: patients_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.patients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.patients_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4518 (class 0 OID 0)
-- Dependencies: 257
-- Name: patients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.patients_id_seq OWNED BY public.patients.id;


--
-- TOC entry 260 (class 1259 OID 16990)
-- Name: payments; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    payment_number text NOT NULL,
    invoice_id integer NOT NULL,
    payment_date text NOT NULL,
    amount integer NOT NULL,
    payment_method text DEFAULT 'CASH'::text NOT NULL,
    payment_type text DEFAULT 'DP'::text NOT NULL,
    reference_number text,
    notes text,
    received_by text DEFAULT 'Staff Kasir'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.payments OWNER TO ai_studio_admin;

--
-- TOC entry 259 (class 1259 OID 16989)
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4519 (class 0 OID 0)
-- Dependencies: 259
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- TOC entry 280 (class 1259 OID 17471)
-- Name: payrolls; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.payrolls (
    id integer NOT NULL,
    payroll_number text NOT NULL,
    employee_id integer NOT NULL,
    employee_name text NOT NULL,
    period_month text NOT NULL,
    period_year integer DEFAULT 2026 NOT NULL,
    payment_date text NOT NULL,
    basic_salary integer DEFAULT 0 NOT NULL,
    patient_fee_total integer DEFAULT 0 NOT NULL,
    patient_count integer DEFAULT 0 NOT NULL,
    bonus_amount integer DEFAULT 0 NOT NULL,
    deduction_amount integer DEFAULT 0 NOT NULL,
    net_salary integer DEFAULT 0 NOT NULL,
    payment_method text DEFAULT 'TRANSFER'::text NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    notes text,
    paid_at timestamp without time zone,
    processed_by text DEFAULT 'Super Admin'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    closing_patient_count integer DEFAULT 0 NOT NULL,
    closing_fee_per_patient integer DEFAULT 0 NOT NULL,
    closing_fee_total integer DEFAULT 0 NOT NULL,
    overtime_hours integer DEFAULT 0 NOT NULL,
    overtime_hourly_rate integer DEFAULT 0 NOT NULL,
    overtime_total integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.payrolls OWNER TO ai_studio_admin;

--
-- TOC entry 279 (class 1259 OID 17470)
-- Name: payrolls_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.payrolls_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payrolls_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4520 (class 0 OID 0)
-- Dependencies: 279
-- Name: payrolls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.payrolls_id_seq OWNED BY public.payrolls.id;


--
-- TOC entry 268 (class 1259 OID 17275)
-- Name: products; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.products (
    id integer NOT NULL,
    sku text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    unit text DEFAULT 'pcs'::text NOT NULL,
    sell_price integer DEFAULT 0 NOT NULL,
    cost_price integer DEFAULT 0 NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    min_stock integer DEFAULT 5 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.products OWNER TO ai_studio_admin;

--
-- TOC entry 267 (class 1259 OID 17274)
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4521 (class 0 OID 0)
-- Dependencies: 267
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- TOC entry 262 (class 1259 OID 17013)
-- Name: queues; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.queues (
    id integer NOT NULL,
    queue_number text NOT NULL,
    queue_date text NOT NULL,
    booking_id integer NOT NULL,
    patient_id integer NOT NULL,
    doctor_id integer NOT NULL,
    status text DEFAULT 'WAITING'::text NOT NULL,
    arrived_at text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.queues OWNER TO ai_studio_admin;

--
-- TOC entry 261 (class 1259 OID 17012)
-- Name: queues_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.queues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.queues_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4522 (class 0 OID 0)
-- Dependencies: 261
-- Name: queues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.queues_id_seq OWNED BY public.queues.id;


--
-- TOC entry 270 (class 1259 OID 17303)
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.stock_movements (
    id integer NOT NULL,
    movement_number text NOT NULL,
    product_id integer NOT NULL,
    movement_type text NOT NULL,
    quantity integer NOT NULL,
    previous_stock integer NOT NULL,
    current_stock integer NOT NULL,
    unit_cost integer DEFAULT 0 NOT NULL,
    unit_price integer DEFAULT 0 NOT NULL,
    reference_type text NOT NULL,
    reference_id integer,
    notes text,
    performed_by text DEFAULT 'Staff'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_movements OWNER TO ai_studio_admin;

--
-- TOC entry 269 (class 1259 OID 17302)
-- Name: stock_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.stock_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_movements_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4523 (class 0 OID 0)
-- Dependencies: 269
-- Name: stock_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.stock_movements_id_seq OWNED BY public.stock_movements.id;


--
-- TOC entry 272 (class 1259 OID 17329)
-- Name: transaction_items; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.transaction_items (
    id integer NOT NULL,
    booking_id integer NOT NULL,
    procedure_id integer,
    invoice_id integer,
    product_id integer NOT NULL,
    product_sku text NOT NULL,
    product_name text NOT NULL,
    category text NOT NULL,
    item_type text DEFAULT 'ADDON'::text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    cost_price_snapshot integer DEFAULT 0 NOT NULL,
    sell_price_snapshot integer DEFAULT 0 NOT NULL,
    discount_amount integer DEFAULT 0 NOT NULL,
    total_amount integer DEFAULT 0 NOT NULL,
    is_stock_deducted boolean DEFAULT false NOT NULL,
    deducted_at timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.transaction_items OWNER TO ai_studio_admin;

--
-- TOC entry 271 (class 1259 OID 17328)
-- Name: transaction_items_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.transaction_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transaction_items_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4524 (class 0 OID 0)
-- Dependencies: 271
-- Name: transaction_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.transaction_items_id_seq OWNED BY public.transaction_items.id;


--
-- TOC entry 264 (class 1259 OID 17032)
-- Name: users; Type: TABLE; Schema: public; Owner: ai_studio_admin
--

CREATE TABLE public.users (
    id integer NOT NULL,
    uid text NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    role text DEFAULT 'staff'::text NOT NULL,
    phone text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    password_hash text,
    permissions text,
    last_login timestamp without time zone
);


ALTER TABLE public.users OWNER TO ai_studio_admin;

--
-- TOC entry 263 (class 1259 OID 17031)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: ai_studio_admin
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO ai_studio_admin;

--
-- TOC entry 4525 (class 0 OID 0)
-- Dependencies: 263
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ai_studio_admin
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3957 (class 2604 OID 16583)
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- TOC entry 3959 (class 2604 OID 16598)
-- Name: booking_status_history id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.booking_status_history ALTER COLUMN id SET DEFAULT nextval('public.booking_status_history_id_seq'::regclass);


--
-- TOC entry 3962 (class 2604 OID 16613)
-- Name: bookings id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.bookings ALTER COLUMN id SET DEFAULT nextval('public.bookings_id_seq'::regclass);


--
-- TOC entry 3971 (class 2604 OID 16646)
-- Name: certificates id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.certificates ALTER COLUMN id SET DEFAULT nextval('public.certificates_id_seq'::regclass);


--
-- TOC entry 4113 (class 2604 OID 17605)
-- Name: circumcision_methods id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.circumcision_methods ALTER COLUMN id SET DEFAULT nextval('public.circumcision_methods_id_seq'::regclass);


--
-- TOC entry 3974 (class 2604 OID 16666)
-- Name: circumcision_packages id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.circumcision_packages ALTER COLUMN id SET DEFAULT nextval('public.circumcision_packages_id_seq'::regclass);


--
-- TOC entry 3978 (class 2604 OID 16685)
-- Name: circumcision_procedures id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.circumcision_procedures ALTER COLUMN id SET DEFAULT nextval('public.circumcision_procedures_id_seq'::regclass);


--
-- TOC entry 3983 (class 2604 OID 16708)
-- Name: clinic_settings id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.clinic_settings ALTER COLUMN id SET DEFAULT nextval('public.clinic_settings_id_seq'::regclass);


--
-- TOC entry 3995 (class 2604 OID 16730)
-- Name: doctor_fee_rules id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.doctor_fee_rules ALTER COLUMN id SET DEFAULT nextval('public.doctor_fee_rules_id_seq'::regclass);


--
-- TOC entry 3997 (class 2604 OID 16747)
-- Name: doctor_fee_transactions id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.doctor_fee_transactions ALTER COLUMN id SET DEFAULT nextval('public.doctor_fee_transactions_id_seq'::regclass);


--
-- TOC entry 4000 (class 2604 OID 16772)
-- Name: doctor_schedules id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.doctor_schedules ALTER COLUMN id SET DEFAULT nextval('public.doctor_schedules_id_seq'::regclass);


--
-- TOC entry 4003 (class 2604 OID 16790)
-- Name: doctors id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.doctors ALTER COLUMN id SET DEFAULT nextval('public.doctors_id_seq'::regclass);


--
-- TOC entry 4081 (class 2604 OID 17413)
-- Name: employee_fee_rules id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.employee_fee_rules ALTER COLUMN id SET DEFAULT nextval('public.employee_fee_rules_id_seq'::regclass);


--
-- TOC entry 4083 (class 2604 OID 17425)
-- Name: employee_fee_transactions id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.employee_fee_transactions ALTER COLUMN id SET DEFAULT nextval('public.employee_fee_transactions_id_seq'::regclass);


--
-- TOC entry 4086 (class 2604 OID 17450)
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- TOC entry 4009 (class 2604 OID 16811)
-- Name: expense_categories id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.expense_categories ALTER COLUMN id SET DEFAULT nextval('public.expense_categories_id_seq'::regclass);


--
-- TOC entry 4011 (class 2604 OID 16826)
-- Name: expense_transactions id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.expense_transactions ALTER COLUMN id SET DEFAULT nextval('public.expense_transactions_id_seq'::regclass);


--
-- TOC entry 4016 (class 2604 OID 16850)
-- Name: follow_ups id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.follow_ups ALTER COLUMN id SET DEFAULT nextval('public.follow_ups_id_seq'::regclass);


--
-- TOC entry 4019 (class 2604 OID 16868)
-- Name: guardians id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.guardians ALTER COLUMN id SET DEFAULT nextval('public.guardians_id_seq'::regclass);


--
-- TOC entry 4022 (class 2604 OID 16883)
-- Name: informed_consents id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.informed_consents ALTER COLUMN id SET DEFAULT nextval('public.informed_consents_id_seq'::regclass);


--
-- TOC entry 4025 (class 2604 OID 16906)
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- TOC entry 4055 (class 2604 OID 17261)
-- Name: package_included_items id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.package_included_items ALTER COLUMN id SET DEFAULT nextval('public.package_included_items_id_seq'::regclass);


--
-- TOC entry 4031 (class 2604 OID 16934)
-- Name: package_prices id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.package_prices ALTER COLUMN id SET DEFAULT nextval('public.package_prices_id_seq'::regclass);


--
-- TOC entry 4033 (class 2604 OID 16950)
-- Name: patient_categories id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.patient_categories ALTER COLUMN id SET DEFAULT nextval('public.patient_categories_id_seq'::regclass);


--
-- TOC entry 4036 (class 2604 OID 16968)
-- Name: patients id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.patients ALTER COLUMN id SET DEFAULT nextval('public.patients_id_seq'::regclass);


--
-- TOC entry 4043 (class 2604 OID 16993)
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- TOC entry 4095 (class 2604 OID 17474)
-- Name: payrolls id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.payrolls ALTER COLUMN id SET DEFAULT nextval('public.payrolls_id_seq'::regclass);


--
-- TOC entry 4059 (class 2604 OID 17278)
-- Name: products id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- TOC entry 4048 (class 2604 OID 17016)
-- Name: queues id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.queues ALTER COLUMN id SET DEFAULT nextval('public.queues_id_seq'::regclass);


--
-- TOC entry 4067 (class 2604 OID 17306)
-- Name: stock_movements id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.stock_movements ALTER COLUMN id SET DEFAULT nextval('public.stock_movements_id_seq'::regclass);


--
-- TOC entry 4072 (class 2604 OID 17332)
-- Name: transaction_items id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.transaction_items ALTER COLUMN id SET DEFAULT nextval('public.transaction_items_id_seq'::regclass);


--
-- TOC entry 4051 (class 2604 OID 17035)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4425 (class 0 OID 16580)
-- Dependencies: 220
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.audit_logs (id, action, entity, entity_id, performed_by, details, "timestamp") FROM stdin;
1	CREATE	PATIENT	RM-2026-000006	admin@nanocircumcision.com	Pasien baru: Roxy Febrian 	2026-09-03 04:53:25.721212
2	CREATE	BOOKING	BOOK-20260903-0005	admin@nanocircumcision.com	Booking baru pasien 6 total Rp 2400000	2026-09-03 04:54:22.833132
3	CHECKIN	QUEUE	K-001	admin@nanocircumcision.com	Pasien antrean K-001	2026-09-03 04:54:29.527004
4	PAYMENT	INVOICE	INV-20260903-0005	admin@nanocircumcision.com	Pembayaran Rp 2.400.000, sisa Rp 0	2026-09-03 04:56:28.840167
5	CREATE	EMPLOYEE	EMP-005	admin@nanocircumcision.com	Karyawan baru: Novian Tri Andhika (Administrasi & Logistik)	2026-09-04 01:44:04.932663
6	LOGOUT	USER	admin	admin@nanocircumcision.com	Pengguna keluar sistem	2026-09-04 01:45:48.575506
7	LOGOUT	USER	admin	admin@nanocircumcision.com	Pengguna keluar sistem	2026-09-04 01:45:50.384552
8	UPDATE_STATUS	DOCTOR_FEE	1	admin@nanocircumcision.com	Status diubah menjadi PAID	2026-09-04 02:03:38.992992
9	PAYMENT	INVOICE	INV-20260902-0004	admin@nanocircumcision.com	Pembayaran Rp 1.500.000, sisa Rp 0	2026-09-04 02:03:49.4242
10	PAYMENT	INVOICE	INV-20260902-0003	admin@nanocircumcision.com	Pembayaran Rp 1.100.000, sisa Rp 0	2026-09-04 02:03:54.275851
11	PAYMENT	INVOICE	INV-20260902-0002	admin@nanocircumcision.com	Pembayaran Rp 1.300.000, sisa Rp 0	2026-09-04 02:03:58.210669
12	LOGOUT	USER	admin	admin@nanocircumcision.com	Pengguna keluar sistem	2026-09-04 08:43:50.335377
13	LOGOUT	USER	admin	admin@nanocircumcision.com	Pengguna keluar sistem	2026-09-04 15:58:26.723346
14	CREATE	BOOKING	BOOK-20260904-0006	admin@nanocircumcision.com	Booking baru pasien 3 total Rp 2400000	2026-09-04 15:59:37.787342
15	CHECKIN	QUEUE	K-001	admin@nanocircumcision.com	Pasien antrean K-001	2026-09-04 15:59:44.365419
16	CHECKIN	QUEUE	K-002	admin@nanocircumcision.com	Pasien antrean K-002	2026-09-04 16:00:19.964813
17	CHECKIN	QUEUE	K-003	admin@nanocircumcision.com	Pasien antrean K-003	2026-09-04 16:00:21.28111
18	CHECKIN	QUEUE	K-004	admin@nanocircumcision.com	Pasien antrean K-004	2026-09-04 16:00:25.154174
19	ADD_TRANSACTION_ITEM	BOOKING	BOOK-20260904-0006	admin@nanocircumcision.com	Tambah produk Obat Tetes Khitan Spesial (Nano Drops) (1x) total Rp 90.000	2026-09-04 16:01:36.140852
20	PAYMENT	INVOICE	INV-20260904-0006	admin@nanocircumcision.com	Pembayaran Rp 2.490.000, sisa Rp 0	2026-09-04 16:02:56.532947
21	UPDATE	CLINIC_SETTINGS	1	admin@nanocircumcision.com	Pembaruan profil klinik	2026-09-04 16:07:19.271704
22	UPDATE	CIRCUMCISION_METHOD	1	Administrator Klinik	Mengubah metode "Nano Klemp": Nama: "Klem Nano Sealer" → "Nano Klemp"	2026-09-04 16:27:54.206357
23	UPDATE	CIRCUMCISION_METHOD	2	Administrator Klinik	Mengubah metode "Glanspro Bipolar Pensealer": Nama: "Super Ring Khitan" → "Glanspro Bipolar Pensealer"	2026-09-04 16:28:10.668337
24	TOGGLE_STATUS	CIRCUMCISION_METHOD	3	Administrator Klinik	Status metode "Laser CO2 / Cauter Presisi" diubah menjadi: NONAKTIF	2026-09-04 16:28:17.156065
25	TOGGLE_STATUS	CIRCUMCISION_METHOD	4	Administrator Klinik	Status metode "Klasik Jahitan Halus Estetik" diubah menjadi: NONAKTIF	2026-09-04 16:28:20.054587
26	UPDATE	DOCTOR	1	Administrator Klinik	Mengubah data dokter dr. Muhammad Ali gufron: Nama: "dr. Bambang Irawan, Sp.B" → "dr. Muhammad Ali gufron", Deskripsi diperbarui, Catatan diperbarui	2026-09-04 16:29:06.452843
27	UPDATE	DOCTOR	3	Administrator Klinik	Mengubah data dokter dr. Natsir Albukaoni: Nama: "dr. Maya Kartika" → "dr. Natsir Albukaoni", Deskripsi diperbarui, Catatan diperbarui	2026-09-04 16:29:32.543112
28	UPDATE	EMPLOYEE	1	Administrator Klinik	Mengubah data karyawan Ns. Athour , S.Kep: Nama: "Ns. Ahmad Fauzi, S.Kep" → "Ns. Athour , S.Kep", Deskripsi peran diperbarui	2026-09-04 16:30:25.406042
29	TOGGLE_STATUS	EMPLOYEE	3	admin@nanocircumcision.com	Status karyawan diubah: NONAKTIF	2026-09-04 16:30:57.378188
30	TOGGLE_STATUS	CIRCUMCISION_METHOD	3	Administrator Klinik	Status metode "Metode Laser CO2 / Cauter Presisi" diubah menjadi: NONAKTIF	2026-09-04 16:43:27.27269
31	TOGGLE_STATUS	CIRCUMCISION_METHOD	4	Administrator Klinik	Status metode "Metode Klasik Jahitan Halus Estetik" diubah menjadi: NONAKTIF	2026-09-04 16:43:31.785171
32	CONFIG_PACKAGE_ITEM	PACKAGE	2	admin@nanocircumcision.com	Atur isi paket: Produk ID 8 Qty 1	2026-09-04 16:44:17.22877
33	UPDATE	PRODUCT	PRD-AKS-001	admin@nanocircumcision.com	Update data produk: Sertifikat	2026-09-05 01:12:09.90559
34	UPDATE	PRODUCT	PRD-OBT-001	admin@nanocircumcision.com	Update data produk: Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik)	2026-09-05 01:13:52.582902
35	UPDATE	PRODUCT	PRD-OBT-002	admin@nanocircumcision.com	Update data produk: Obat Spray (Antiseptic)	2026-09-05 01:14:26.991322
36	CREATE	PRODUCT	PRD-TTS-143	admin@nanocircumcision.com	Produk baru: Obat Tetes ( Antibiotic luar) (Stok: 20)	2026-09-05 01:15:02.739314
37	UPDATE	PRODUCT	PRD-TTS-001	admin@nanocircumcision.com	Update data produk: Obat Tetes Khitan Spesial (Nano Drops)	2026-09-05 01:15:24.054271
38	CREATE	PRODUCT	PRD-OTH-954	admin@nanocircumcision.com	Produk baru: GodiieBag Nano Special Edition (Stok: 20)	2026-09-05 01:16:01.514399
39	CREATE	PRODUCT	PRD-CLN-559	admin@nanocircumcision.com	Produk baru: Paket Celana Sunat (3pcs 100k) (Stok: 20)	2026-09-05 01:17:05.922128
40	CREATE	PRODUCT	PRD-CLN-797	admin@nanocircumcision.com	Produk baru: Celana Sunat Ecer (Stok: 20)	2026-09-05 01:17:41.351389
41	UPDATE	CIRCUMCISION_METHOD	2	Administrator Klinik	Mengubah metode "Metode Glans Pro Bipolar Pensealer": Tarif: Reguler = Rp 2.400.000, VIP = Rp 2.700.000	2026-09-05 02:31:50.29499
42	UPDATE	CIRCUMCISION_METHOD	1	Administrator Klinik	Mengubah metode "Metode Tindakan Nano Klemp": Tarif: Reguler = Rp 1.600.000, VIP = Rp 1.800.000	2026-09-05 02:32:06.669354
43	CHECKIN	QUEUE	K-001	admin@nanocircumcision.com	Pasien antrean K-001	2026-09-05 02:32:41.459119
44	COMPLETE	PROCEDURE	PROC-20260903-001	admin@nanocircumcision.com	Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit	2026-09-05 02:34:33.84784
45	COMPLETE	PROCEDURE	PROC-20260904-004	admin@nanocircumcision.com	Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit	2026-09-05 03:29:22.945771
46	COMPLETE	PROCEDURE	PROC-20260904-003	admin@nanocircumcision.com	Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit	2026-09-05 03:30:15.248633
47	CREATE	PATIENT	RM-2026-000007	admin@nanocircumcision.com	Pasien baru: sdfsf	2026-09-05 03:31:26.178365
48	CREATE	BOOKING	BOOK-20260905-0007	admin@nanocircumcision.com	Booking baru pasien 7 total Rp 2400000	2026-09-05 03:32:08.094025
49	CHECKIN	QUEUE	K-002	admin@nanocircumcision.com	Pasien antrean K-002	2026-09-05 03:32:15.520421
50	ADD_TRANSACTION_ITEM	BOOKING	BOOK-20260905-0007	admin@nanocircumcision.com	Tambah produk GodiieBag Nano Special Edition (1x) total Rp 50.000	2026-09-05 03:32:38.593096
51	COMPLETE	PROCEDURE	PROC-20260905-002	admin@nanocircumcision.com	Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit	2026-09-05 03:33:15.107148
52	PAYMENT	INVOICE	INV-20260905-0007	admin@nanocircumcision.com	Pembayaran Rp 2.400.000, sisa Rp 0	2026-09-05 03:33:19.691458
53	CONFIG_PACKAGE_ITEM	PACKAGE	1	admin@nanocircumcision.com	Atur isi paket: Produk ID 11 Qty 1	2026-09-05 03:34:17.739447
54	CONFIG_PACKAGE_ITEM	PACKAGE	1	admin@nanocircumcision.com	Atur isi paket: Produk ID 6 Qty 1	2026-09-05 03:34:27.729223
55	CONFIG_PACKAGE_ITEM	PACKAGE	1	admin@nanocircumcision.com	Atur isi paket: Produk ID 8 Qty 1	2026-09-05 03:34:42.922481
56	CONFIG_PACKAGE_ITEM	PACKAGE	1	admin@nanocircumcision.com	Atur isi paket: Produk ID 5 Qty 2	2026-09-05 03:35:22.898192
57	CONFIG_PACKAGE_ITEM	PACKAGE	1	admin@nanocircumcision.com	Atur isi paket: Produk ID 5 Qty 1	2026-09-05 03:35:31.957834
58	CONFIG_PACKAGE_ITEM	PACKAGE	1	admin@nanocircumcision.com	Atur isi paket: Produk ID 1 Qty 2	2026-09-05 03:35:46.600924
59	CONFIG_PACKAGE_ITEM	PACKAGE	1	admin@nanocircumcision.com	Atur isi paket: Produk ID 11 Qty 2	2026-09-05 03:35:52.682014
60	CONFIG_PACKAGE_ITEM	PACKAGE	1	admin@nanocircumcision.com	Atur isi paket: Produk ID 8 Qty 2	2026-09-05 03:35:58.207847
61	CONFIG_PACKAGE_ITEM	PACKAGE	2	admin@nanocircumcision.com	Atur isi paket: Produk ID 11 Qty 1	2026-09-05 03:37:45.85062
62	CONFIG_PACKAGE_ITEM	PACKAGE	2	admin@nanocircumcision.com	Atur isi paket: Produk ID 6 Qty 1	2026-09-05 03:37:54.309973
63	CONFIG_PACKAGE_ITEM	PACKAGE	2	admin@nanocircumcision.com	Atur isi paket: Produk ID 5 Qty 1	2026-09-05 03:38:03.791878
64	CONFIG_PACKAGE_ITEM	PACKAGE	2	admin@nanocircumcision.com	Atur isi paket: Produk ID 8 Qty 1	2026-09-05 03:38:15.216323
65	CONFIG_PACKAGE_ITEM	PACKAGE	2	admin@nanocircumcision.com	Atur isi paket: Produk ID 11 Qty 1	2026-09-05 03:38:30.964506
66	CONFIG_PACKAGE_ITEM	PACKAGE	2	admin@nanocircumcision.com	Atur isi paket: Produk ID 5 Qty 1	2026-09-05 03:38:42.466757
67	CONFIG_PACKAGE_ITEM	PACKAGE	2	admin@nanocircumcision.com	Atur isi paket: Produk ID 1 Qty 1	2026-09-05 03:38:50.160417
68	COMPLETE	PROCEDURE	PROC-20260904-002	admin@nanocircumcision.com	Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit	2026-09-05 03:41:04.063342
69	UPDATE_STATUS	DOCTOR_FEE	6	admin@nanocircumcision.com	Status diubah menjadi APPROVED	2026-09-05 03:42:02.647819
70	UPDATE_STATUS	DOCTOR_FEE	5	admin@nanocircumcision.com	Status diubah menjadi APPROVED	2026-09-05 03:42:04.86669
71	UPDATE_STATUS	DOCTOR_FEE	4	admin@nanocircumcision.com	Status diubah menjadi APPROVED	2026-09-05 03:42:06.797252
72	UPDATE_STATUS	DOCTOR_FEE	3	admin@nanocircumcision.com	Status diubah menjadi APPROVED	2026-09-05 03:42:08.258948
73	UPDATE_STATUS	DOCTOR_FEE	2	admin@nanocircumcision.com	Status diubah menjadi APPROVED	2026-09-05 03:42:10.516581
74	CREATE	PATIENT	RM-2026-000008	admin@nanocircumcision.com	Pasien baru: efendy agusria	2026-09-05 05:32:30.083466
75	CREATE	BOOKING	BOOK-20260905-0008	admin@nanocircumcision.com	Booking baru pasien 8 total Rp 2700000	2026-09-05 05:33:10.749567
76	CHECKIN	QUEUE	K-003	admin@nanocircumcision.com	Pasien antrean K-003	2026-09-05 05:33:53.602064
77	COMPLETE	PROCEDURE	PROC-20260905-003	admin@nanocircumcision.com	Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit	2026-09-05 05:34:54.059585
78	PAYMENT	INVOICE	INV-20260905-0008	admin@nanocircumcision.com	Pembayaran Rp 2.700.000, sisa Rp 0	2026-09-05 05:35:04.73887
79	UPDATE_STATUS	DOCTOR_FEE	7	admin@nanocircumcision.com	Status diubah menjadi APPROVED	2026-09-05 05:35:31.486278
80	UPDATE_STATUS	DOCTOR_FEE	2	admin@nanocircumcision.com	Status diubah menjadi PAID	2026-09-05 05:36:24.205505
81	UPDATE_STATUS	DOCTOR_FEE	4	admin@nanocircumcision.com	Status diubah menjadi PAID	2026-09-05 05:36:24.72288
82	UPDATE_STATUS	DOCTOR_FEE	5	admin@nanocircumcision.com	Status diubah menjadi PAID	2026-09-05 05:36:24.985583
83	UPDATE_STATUS	DOCTOR_FEE	3	admin@nanocircumcision.com	Status diubah menjadi PAID	2026-09-05 05:36:25.288824
84	UPDATE_STATUS	DOCTOR_FEE	6	admin@nanocircumcision.com	Status diubah menjadi PAID	2026-09-05 05:36:25.593571
85	UPDATE_STATUS	DOCTOR_FEE	7	admin@nanocircumcision.com	Status diubah menjadi PAID	2026-09-05 05:36:26.087728
86	LOGIN	USER	user-doctor	dokter@nanocircumcision.com	Pengguna login: dr. Bambang Irawan, Sp.B (Dokter Operator Khitan) (doctor)	2026-09-05 14:05:13.339877
87	LOGOUT	USER	dokter	doctor@nanocircumcision.com	Pengguna keluar sistem	2026-09-05 14:05:16.506911
88	LOGIN	USER	user-admin	admin@nanocircumcision.com	Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)	2026-09-05 14:05:17.938896
89	LOGOUT	USER	admin	admin@nanocircumcision.com	Pengguna keluar sistem	2026-09-05 14:08:06.01587
90	LOGIN	USER	user-admin	admin@nanocircumcision.com	Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)	2026-09-05 14:08:21.031717
91	CHECKIN	QUEUE	K-004	admin@nanocircumcision.com	Pasien antrean K-004	2026-09-05 14:09:21.368832
92	CHECKIN	QUEUE	K-005	admin@nanocircumcision.com	Pasien antrean K-005	2026-09-05 14:10:06.556066
93	CREATE	PATIENT	RM-2026-000009	admin@nanocircumcision.com	Pasien baru: Sulton Prayoga	2026-09-05 14:12:01.111968
94	CREATE	BOOKING	BOOK-20260905-0009	admin@nanocircumcision.com	Booking baru pasien 9 total Rp 2400000	2026-09-05 14:13:32.454673
95	CHECKIN	QUEUE	K-006	admin@nanocircumcision.com	Pasien antrean K-006	2026-09-05 14:13:39.306592
96	COMPLETE	PROCEDURE	PROC-20260905-006	admin@nanocircumcision.com	Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit	2026-09-05 14:14:36.526922
97	PAYMENT	INVOICE	INV-20260905-0009	admin@nanocircumcision.com	Pembayaran Rp 2.400.000, sisa Rp 0	2026-09-05 14:14:47.700414
98	LOGIN	USER	user-admin	admin@nanocircumcision.com	Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)	2026-09-05 14:16:14.09618
99	TOGGLE_STATUS	DOCTOR	2	Administrator Klinik	Status dokter dr. Hendra Wijaya diubah menjadi: NONAKTIF	2026-09-05 14:17:43.937181
100	LOGIN	USER	user-admin	admin@nanocircumcision.com	Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)	2026-09-06 00:09:01.573751
101	LOGIN	USER	user-admin	admin@nanocircumcision.com	Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)	2026-09-06 00:11:05.970219
102	LOGIN	USER	user-admin	admin@nanocircumcision.com	Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)	2026-09-06 00:14:11.10762
103	LOGIN	USER	user-admin	admin@nanocircumcision.com	Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)	2026-09-06 08:35:50.643828
104	LOGIN	USER	user-admin	admin@nanocircumcision.com	Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)	2026-09-06 13:34:01.108739
105	LOGOUT	USER	admin	admin@nanocircumcision.com	Pengguna keluar sistem	2026-09-06 13:34:04.832629
106	LOGIN	USER	user-admin	admin@nanocircumcision.com	Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)	2026-09-06 13:34:41.286766
107	CHECKIN	QUEUE	K-001	admin@nanocircumcision.com	Pasien antrean K-001	2026-09-06 13:35:14.28171
108	LOGIN	USER	user-admin	admin@nanocircumcision.com	Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)	2026-09-06 13:47:01.370714
109	CREATE	PATIENT	RM-2026-000010	admin@nanocircumcision.com	Pasien baru: Jeni guardian	2026-09-06 13:47:58.449957
110	LOGIN	USER	user-admin	admin@nanocircumcision.com	Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)	2026-09-06 13:53:17.453904
111	CREATE	PATIENT	RM-2026-000011	admin@nanocircumcision.com	Pasien baru: Adam Prihantoro Agus	2026-09-06 13:54:15.314546
112	CREATE	BOOKING	BOOK-20260906-0010	admin@nanocircumcision.com	Booking baru pasien 10 total Rp 2700000	2026-09-06 13:57:10.020672
113	LOGIN	USER	user-admin	admin@nanocircumcision.com	Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)	2026-09-06 13:59:44.197701
114	CREATE	BOOKING	BOOK-20260906-0011	admin@nanocircumcision.com	Booking baru pasien 11 total Rp 2600000	2026-09-06 14:03:04.387176
115	LOGIN	USER	user-admin	admin@nanocircumcision.com	Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)	2026-09-06 14:18:37.918957
116	AUTO_BOOKING	BOOKING	BOOK-20260906-0012	admin@nanocircumcision.com	Auto-booking saat pendaftaran: Adam Prihantoro Agus (2026-09-10 07:00, Metode: Glans Pro bipolar pen sealer, Bius: Bius Kombinasi (FNI + Injeksi))	2026-09-06 14:20:31.810606
117	CREATE	PATIENT	RM-2026-000012	admin@nanocircumcision.com	Pasien baru: Adam Prihantoro Agus	2026-09-06 14:20:31.857584
118	CHECKIN	QUEUE	K-004	admin@nanocircumcision.com	Pasien antrean K-004	2026-09-06 14:22:08.257232
119	COMPLETE	PROCEDURE	PROC-20260906-004	admin@nanocircumcision.com	Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit	2026-09-06 14:22:58.51162
120	PAYMENT	INVOICE	INV-20260906-0012	admin@nanocircumcision.com	Pembayaran Rp 2.700.000, sisa Rp 0	2026-09-06 14:23:24.965869
121	LOGIN	USER	user-admin	admin@nanocircumcision.com	Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)	2026-09-06 14:28:02.563187
122	LOGOUT	USER	admin	admin@nanocircumcision.com	Pengguna keluar sistem	2026-09-06 14:32:56.18829
123	LOGIN	USER	user-admin	admin@nanocircumcision.com	Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)	2026-09-06 14:33:02.633393
124	CREATE	PRODUCT	PRD-OBT-292	admin@nanocircumcision.com	Produk baru: Paket Obat Kapsul (Stok: 20)	2026-09-06 14:34:54.11114
125	AUTO_BOOKING	BOOKING	BOOK-20260906-0001	admin@nanocircumcision.com	Auto-booking saat pendaftaran: izzam alvaro (2026-10-12 siang, Metode: glans pro bipolar pen sealer vip, Bius: Bius Tanpa Jarum Suntik / FREE Needle injection (FNI))	2026-09-06 14:38:07.511239
126	CREATE	PATIENT	RM-2026-000001	admin@nanocircumcision.com	Pasien baru: izzam alvaro	2026-09-06 14:38:07.563202
127	UPDATE	BOOKING	BOOK-20260906-0001	admin@nanocircumcision.com	Edit booking: Metode glans pro bipolar pen sealer vip, Bius: Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)	2026-09-06 14:39:01.154865
128	CHECKIN	QUEUE	K-001	admin@nanocircumcision.com	Pasien antrean K-001	2026-09-06 14:39:14.059409
129	COMPLETE	PROCEDURE	PROC-20260906-001	admin@nanocircumcision.com	Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit	2026-09-06 14:41:25.996884
130	PAYMENT	INVOICE	INV-20260906-0001	admin@nanocircumcision.com	Pembayaran Rp 2.700.000, sisa Rp 0	2026-09-06 14:41:35.431292
131	LOGIN	USER	user-admin	admin@nanocircumcision.com	Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)	2026-09-06 14:48:50.710736
132	LOGIN	USER	user-admin	admin@nanocircumcision.com	Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)	2026-09-06 14:54:33.532129
133	LOGIN	USER	user-admin	admin@nanocircumcision.com	Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)	2026-09-07 01:02:10.017424
134	BACKUP_DOWNLOAD_JSON	database	all_tables	admin@nanocircumcision.com	Unduh backup database JSON (317 baris data) ke komputer lokal	2026-09-07 01:03:28.207561
135	CREATE	USER	user-mtqjfimf	admin@nanocircumcision.com	Buat akun pengguna: Novian Tri Andhika (admin)	2026-09-07 01:04:15.375667
136	LOGOUT	USER	admin	admin@nanocircumcision.com	Pengguna keluar sistem	2026-09-07 01:04:17.759374
137	LOGIN	USER	user-admin	admin@nanocircumcision.com	Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)	2026-09-07 01:04:49.359552
138	UPDATE	USER	5	admin@nanocircumcision.com	Pembaruan akun pengguna ID 5	2026-09-07 01:05:22.388968
139	LOGOUT	USER	admin	admin@nanocircumcision.com	Pengguna keluar sistem	2026-09-07 01:05:30.963358
140	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-07 01:05:37.899368
141	UPDATE	CIRCUMCISION_METHOD	3	Administrator Klinik	Mengubah metode "Metode Laser CO2 / Cauter Presisi": Tarif: Reguler = Rp 0, VIP = Rp 0	2026-09-07 01:06:01.181741
142	UPDATE	CIRCUMCISION_METHOD	3	Administrator Klinik	Mengubah metode "-": Nama: "Metode Laser CO2 / Cauter Presisi" → "-", Tarif: Reguler = Rp 1.800.000, VIP = Rp 2.500.000	2026-09-07 01:06:13.827327
143	UPDATE	CIRCUMCISION_METHOD	4	Administrator Klinik	Mengubah metode "-": Nama: "Metode Klasik Jahitan Halus Estetik" → "-", Tarif: Reguler = Rp 0, VIP = Rp 0	2026-09-07 01:06:24.564963
144	LOGIN	USER	user-admin	admin@nanocircumcision.com	Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)	2026-09-07 05:32:41.362561
145	UPDATE_STATUS	DOCTOR_FEE	1	admin@nanocircumcision.com	Status diubah menjadi APPROVED	2026-09-07 05:33:40.107368
146	AUTO_BOOKING	BOOKING	BOOK-20260907-0002	admin@nanocircumcision.com	Auto-booking saat pendaftaran: Muhammad Orhan Ghazi El Hanan (2026-09-07 16:00, Metode: glans pro bipolar pem sealer, Bius: Bius Kombinasi (FNI + Injeksi))	2026-09-07 05:37:43.169979
147	CREATE	PATIENT	RM-2026-000002	admin@nanocircumcision.com	Pasien baru: Muhammad Orhan Ghazi El Hanan	2026-09-07 05:37:43.222006
148	CHECKIN	QUEUE	K-001	admin@nanocircumcision.com	Pasien antrean K-001	2026-09-07 05:38:05.359944
149	COMPLETE	PROCEDURE	PROC-20260907-001	admin@nanocircumcision.com	Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit	2026-09-07 05:38:44.86967
150	PAYMENT	INVOICE	INV-20260907-0002	admin@nanocircumcision.com	Pembayaran Rp 2.700.000, sisa Rp 0	2026-09-07 05:38:48.463368
151	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-07 10:00:21.672832
152	AUTO_BOOKING	BOOKING	BOOK-20260907-0003	admin@nanocircumcision.com	Auto-booking saat pendaftaran: Muhammad Orhan Ghazi El Hanan (2026-09-07 17:02, Metode: glans pro bipolar pem sealer, Bius: Bius Kombinasi (FNI + Injeksi))	2026-09-07 10:02:28.2852
153	CREATE	PATIENT	RM-2026-000003	admin@nanocircumcision.com	Pasien baru: Muhammad Orhan Ghazi El Hanan	2026-09-07 10:02:28.336729
154	CHECKIN	QUEUE	K-002	admin@nanocircumcision.com	Pasien antrean K-002	2026-09-07 10:02:56.288264
155	COMPLETE	PROCEDURE	PROC-20260907-002	admin@nanocircumcision.com	Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit	2026-09-07 10:03:57.992233
156	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-07 10:04:04.609031
157	PAYMENT	INVOICE	INV-20260907-0003	admin@nanocircumcision.com	Pembayaran Rp 2.700.000, sisa Rp 0	2026-09-07 10:04:27.980653
158	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-07 10:06:25.635897
159	UPDATE_STATUS	DOCTOR_FEE	2	admin@nanocircumcision.com	Status diubah menjadi APPROVED	2026-09-07 10:07:34.164412
160	UPDATE_STATUS	DOCTOR_FEE	3	admin@nanocircumcision.com	Status diubah menjadi APPROVED	2026-09-07 10:07:35.665763
161	GENERATE_PAYROLL	PAYROLL	PAYROLL-202609-001	admin@nanocircumcision.com	Generate gaji Ns. Tri Wahyuni, A.Md.Kep periode 2026-09: THP Rp 3200000 (Gaji: 3200000, Fee Tindakan: 0, Closing: 0, Lembur: 0)	2026-09-07 10:11:45.415309
162	GENERATE_PAYROLL	PAYROLL	PAYROLL-202609-002	admin@nanocircumcision.com	Generate gaji Budi Santoso periode 2026-09: THP Rp 2800000 (Gaji: 2800000, Fee Tindakan: 0, Closing: 0, Lembur: 0)	2026-09-07 10:11:45.709356
163	GENERATE_PAYROLL	PAYROLL	PAYROLL-202609-003	admin@nanocircumcision.com	Generate gaji Novian Tri Andhika periode 2026-09: THP Rp 1820000 (Gaji: 1800000, Fee Tindakan: 20000, Closing: 0, Lembur: 0)	2026-09-07 10:11:46.048738
164	GENERATE_PAYROLL	PAYROLL	PAYROLL-202609-004	admin@nanocircumcision.com	Generate gaji Ns. Athour , S.Kep periode 2026-09: THP Rp 2050000 (Gaji: 2000000, Fee Tindakan: 50000, Closing: 0, Lembur: 0)	2026-09-07 10:11:46.447216
165	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-07 10:22:22.373414
166	GENERATE_PAYROLL	PAYROLL	PAYROLL-202609-004	admin@nanocircumcision.com	Generate gaji Ns. Athour , S.Kep periode 2026-09: THP Rp 2080000 (Gaji: 2000000, Fee Tindakan: 50000, Closing: 30000, Lembur: 0)	2026-09-07 10:23:15.199731
167	DELETE	PAYROLL	PAYROLL-202609-004	admin@nanocircumcision.com	Hapus draft slip gaji Ns. Athour , S.Kep (2026-09)	2026-09-07 10:23:47.221275
168	DELETE	PAYROLL	PAYROLL-202609-003	admin@nanocircumcision.com	Hapus draft slip gaji Novian Tri Andhika (2026-09)	2026-09-07 10:23:50.863252
169	DELETE	PAYROLL	PAYROLL-202609-002	admin@nanocircumcision.com	Hapus draft slip gaji Budi Santoso (2026-09)	2026-09-07 10:23:53.739001
170	DELETE	PAYROLL	PAYROLL-202609-001	admin@nanocircumcision.com	Hapus draft slip gaji Ns. Tri Wahyuni, A.Md.Kep (2026-09)	2026-09-07 10:23:56.794489
171	GENERATE_PAYROLL	PAYROLL	PAYROLL-202609-001	admin@nanocircumcision.com	Generate gaji Ns. Tri Wahyuni, A.Md.Kep periode 2026-09: THP Rp 3200000 (Gaji: 3200000, Fee Tindakan: 0, Closing: 0, Lembur: 0)	2026-09-07 10:24:08.880464
172	GENERATE_PAYROLL	PAYROLL	PAYROLL-202609-002	admin@nanocircumcision.com	Generate gaji Budi Santoso periode 2026-09: THP Rp 2800000 (Gaji: 2800000, Fee Tindakan: 0, Closing: 0, Lembur: 0)	2026-09-07 10:24:09.167913
173	GENERATE_PAYROLL	PAYROLL	PAYROLL-202609-003	admin@nanocircumcision.com	Generate gaji Novian Tri Andhika periode 2026-09: THP Rp 1820000 (Gaji: 1800000, Fee Tindakan: 20000, Closing: 0, Lembur: 0)	2026-09-07 10:24:09.51247
174	GENERATE_PAYROLL	PAYROLL	PAYROLL-202609-004	admin@nanocircumcision.com	Generate gaji Ns. Athour , S.Kep periode 2026-09: THP Rp 2050000 (Gaji: 2000000, Fee Tindakan: 50000, Closing: 0, Lembur: 0)	2026-09-07 10:24:09.91291
175	DELETE	PAYROLL	PAYROLL-202609-002	admin@nanocircumcision.com	Hapus draft slip gaji Budi Santoso (2026-09)	2026-09-07 10:24:34.788208
176	DELETE	PAYROLL	PAYROLL-202609-004	admin@nanocircumcision.com	Hapus draft slip gaji Ns. Athour , S.Kep (2026-09)	2026-09-07 10:24:37.767367
177	DELETE	PAYROLL	PAYROLL-202609-003	admin@nanocircumcision.com	Hapus draft slip gaji Novian Tri Andhika (2026-09)	2026-09-07 10:24:40.682107
178	DELETE	PAYROLL	PAYROLL-202609-001	admin@nanocircumcision.com	Hapus draft slip gaji Ns. Tri Wahyuni, A.Md.Kep (2026-09)	2026-09-07 10:24:43.95411
179	GENERATE_PAYROLL	PAYROLL	PAYROLL-202609-001	admin@nanocircumcision.com	Generate gaji Ns. Tri Wahyuni, A.Md.Kep periode 2026-09: THP Rp 3200000 (Gaji: 3200000, Fee Tindakan: 0, Closing: 0, Lembur: 0)	2026-09-07 10:41:21.12161
180	GENERATE_PAYROLL	PAYROLL	PAYROLL-202609-002	admin@nanocircumcision.com	Generate gaji Budi Santoso periode 2026-09: THP Rp 2800000 (Gaji: 2800000, Fee Tindakan: 0, Closing: 0, Lembur: 0)	2026-09-07 10:41:21.351736
181	GENERATE_PAYROLL	PAYROLL	PAYROLL-202609-003	admin@nanocircumcision.com	Generate gaji Novian Tri Andhika periode 2026-09: THP Rp 1820000 (Gaji: 1800000, Fee Tindakan: 20000, Closing: 0, Lembur: 0)	2026-09-07 10:41:21.658301
182	GENERATE_PAYROLL	PAYROLL	PAYROLL-202609-004	admin@nanocircumcision.com	Generate gaji Ns. Athour , S.Kep periode 2026-09: THP Rp 2050000 (Gaji: 2000000, Fee Tindakan: 50000, Closing: 0, Lembur: 0)	2026-09-07 10:41:22.018337
183	GENERATE_PAYROLL	PAYROLL	PAYROLL-202609-001	admin@nanocircumcision.com	Generate gaji Ns. Tri Wahyuni, A.Md.Kep periode 2026-09: THP Rp 3200000 (Gaji: 3200000, Fee Tindakan: 0, Closing: 0, Lembur: 0)	2026-09-07 10:43:42.358857
184	GENERATE_PAYROLL	PAYROLL	PAYROLL-202609-002	admin@nanocircumcision.com	Generate gaji Budi Santoso periode 2026-09: THP Rp 2800000 (Gaji: 2800000, Fee Tindakan: 0, Closing: 0, Lembur: 0)	2026-09-07 10:43:42.56518
185	GENERATE_PAYROLL	PAYROLL	PAYROLL-202609-003	admin@nanocircumcision.com	Generate gaji Novian Tri Andhika periode 2026-09: THP Rp 1820000 (Gaji: 1800000, Fee Tindakan: 20000, Closing: 0, Lembur: 0)	2026-09-07 10:43:42.825618
186	GENERATE_PAYROLL	PAYROLL	PAYROLL-202609-004	admin@nanocircumcision.com	Generate gaji Ns. Athour , S.Kep periode 2026-09: THP Rp 2050000 (Gaji: 2000000, Fee Tindakan: 50000, Closing: 0, Lembur: 0)	2026-09-07 10:43:43.136413
187	GENERATE_PAYROLL	PAYROLL	PAYROLL-202609-004	admin@nanocircumcision.com	Generate gaji Ns. Athour , S.Kep periode 2026-09: THP Rp 2170000 (Gaji: 2000000, Fee Tindakan: 50000, Closing: 60000, Lembur: 60000)	2026-09-07 10:43:51.02984
188	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-07 10:47:30.015664
189	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-07 13:42:56.857208
190	DELETE	EMPLOYEE	2	Administrator Klinik	Menghapus/mengarsipkan karyawan/staf: Ns. Tri Wahyuni, A.Md.Kep (EMP-002) - Riwayat tindakan & payroll aman	2026-09-07 13:43:18.462074
191	DELETE	EMPLOYEE	4	Administrator Klinik	Menghapus/mengarsipkan karyawan/staf: Budi Santoso (EMP-004) - Riwayat tindakan & payroll aman	2026-09-07 13:43:26.387225
192	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-08 01:16:04.516506
193	DELETE	DOCTOR	2	Administrator Klinik	Menghapus permanen dokter: dr. Hendra Wijaya (DOC-002)	2026-09-08 01:16:19.229028
194	DELETE	EMPLOYEE	3	Administrator Klinik	Menghapus permanen karyawan/staf: Dina Safitri (EMP-003)	2026-09-08 01:16:23.509451
195	DELETE	PAYROLL	PAYROLL-202609-001	admin@nanocircumcision.com	Hapus draft slip gaji Ns. Tri Wahyuni, A.Md.Kep (2026-09)	2026-09-08 01:16:34.926827
196	DELETE	PAYROLL	PAYROLL-202609-002	admin@nanocircumcision.com	Hapus draft slip gaji Budi Santoso (2026-09)	2026-09-08 01:16:39.700376
197	DELETE	CIRCUMCISION_METHOD	3	Administrator Klinik	Menghapus permanen metode tindakan: "-"	2026-09-08 01:16:58.881136
198	DELETE	CIRCUMCISION_METHOD	4	Administrator Klinik	Menghapus permanen metode tindakan: "-"	2026-09-08 01:17:02.607946
199	LOGIN	USER	user-admin	admin@nanocircumcision.com	Pengguna login: Siti Rahmawati, S.Kep (Admin Operasional) (admin)	2026-09-08 05:34:44.145489
200	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-08 09:29:34.813675
201	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-09 01:17:11.676889
202	SOFT_DELETE	PATIENT	RM-2026-000002	Administrator Klinik	Arsipkan/hapus lunak pasien: Muhammad Orhan Ghazi El Hanan - Alasan: Dihapus oleh admin	2026-09-09 01:17:26.81724
203	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-09 01:21:19.720486
204	UPDATE	EMPLOYEE	5	Administrator Klinik	Mengubah data karyawan Novian Tri Andhika: Deskripsi peran diperbarui	2026-09-09 01:23:12.940091
205	UPDATE	EMPLOYEE	1	Administrator Klinik	Mengubah data karyawan Ns. Athour , S.Kep: Pembaruan profil	2026-09-09 01:23:25.493341
206	UPDATE	EMPLOYEE	1	Administrator Klinik	Mengubah data karyawan Ns. Athour , S.Kep: Pembaruan profil	2026-09-09 01:23:45.366703
207	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-09 01:38:30.757473
208	BACKUP_DOWNLOAD_SQL	database	all_tables	admin@nanocircumcision.com	Unduh dump SQL (409 baris data) ke komputer lokal	2026-09-09 01:41:05.830854
209	BACKUP_DOWNLOAD_JSON	database	all_tables	admin@nanocircumcision.com	Unduh backup database JSON (410 baris data) ke komputer lokal	2026-09-09 01:41:07.901083
210	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-10 00:50:32.194879
211	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-10 02:11:08.05252
212	AUTO_BOOKING	BOOKING	BOOK-20260910-0004	admin@nanocircumcision.com	Auto-booking saat pendaftaran: AL GHIFARI DAVIANSYAH (2026-09-10 08:00, Metode: Metode Glans Pro Bipolar Pensealer, Bius: Bius Kombinasi (FNI + Injeksi))	2026-09-10 02:14:06.636686
213	CREATE	PATIENT	RM-2026-000004	admin@nanocircumcision.com	Pasien baru: AL GHIFARI DAVIANSYAH	2026-09-10 02:14:06.687536
214	CHECKIN	QUEUE	K-001	admin@nanocircumcision.com	Pasien antrean K-001	2026-09-10 02:14:20.874842
215	COMPLETE	PROCEDURE	PROC-20260910-001	admin@nanocircumcision.com	Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit	2026-09-10 02:15:28.132582
216	PAYMENT	INVOICE	INV-20260910-0004	admin@nanocircumcision.com	Pembayaran Rp 2.700.000, sisa Rp 0	2026-09-10 02:15:34.785322
217	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-10 03:10:45.286124
218	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-10 03:25:23.330159
219	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-10 03:39:11.418988
220	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-10 03:48:46.263352
221	AUTO_BOOKING	BOOKING	BOOK-20260910-0005	admin@nanocircumcision.com	Auto-booking saat pendaftaran: Gilang Shodiq ramadhan (2026-07-03 08:00, Metode: Metode Tindakan Nano Klemp, Bius: Bius Tanpa Jarum Suntik / FREE Needle injection (FNI))	2026-09-10 03:51:56.257803
222	CREATE	PATIENT	RM-2026-000005	admin@nanocircumcision.com	Pasien baru: Gilang Shodiq ramadhan	2026-09-10 03:51:56.314612
223	CHECKIN	QUEUE	K-002	admin@nanocircumcision.com	Pasien antrean K-002	2026-09-10 03:52:14.725884
224	COMPLETE	PROCEDURE	PROC-20260910-002	admin@nanocircumcision.com	Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit	2026-09-10 03:52:52.08723
225	PAYMENT	INVOICE	INV-20260910-0005	admin@nanocircumcision.com	Pembayaran Rp 1.250.000, sisa Rp 0	2026-09-10 03:52:59.859553
226	STOCK_MUTATION	PRODUCT	PRD-MNN-001	admin@nanocircumcision.com	Mutasi OUT qty: 49 (Stok: 49 -> 0)	2026-09-10 03:55:25.573074
227	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-10 04:11:17.516223
228	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-10 06:18:03.076915
229	UPDATE	PATIENT	RM-2026-000004	admin@nanocircumcision.com	Edit data pasien: AL GHIFARI DAVIANSYAH	2026-09-10 06:22:23.930371
230	BACKUP_DOWNLOAD_SQL	database	all_tables	admin@nanocircumcision.com	Unduh dump SQL (490 baris data) ke komputer lokal	2026-09-10 06:35:04.748943
231	BACKUP_DOWNLOAD_JSON	database	all_tables	admin@nanocircumcision.com	Unduh backup database JSON (490 baris data) ke komputer lokal	2026-09-10 06:35:04.749897
232	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-10 07:40:39.097447
233	LOGIN	USER	user-mtqjfimf	dika@gmail.com	Pengguna login: Novian Tri Andhika (admin)	2026-09-10 07:52:38.258789
\.


--
-- TOC entry 4427 (class 0 OID 16595)
-- Dependencies: 222
-- Data for Name: booking_status_history; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.booking_status_history (id, booking_id, status, changed_by, notes, "timestamp") FROM stdin;
1	1	BOOKED	Administrator Klinik	Booking otomatis dari pendaftaran pasien baru (Rencana Tindakan: 2026-10-12 siang, Metode: glans pro bipolar pen sealer vip)	2026-09-06 14:38:07.35517
2	1	ARRIVED	Administrator Klinik	Pasien check-in, nomor antrean K-001	2026-09-06 14:39:13.848926
3	1	COMPLETED	Administrator Klinik	Tindakan khitan selesai oleh dr. Natsir Albukaoni & asisten Novian Tri Andhika	2026-09-06 14:41:23.853308
4	2	BOOKED	Administrator Klinik	Booking otomatis dari pendaftaran pasien baru (Rencana Tindakan: 2026-09-07 16:00, Metode: glans pro bipolar pem sealer)	2026-09-07 05:37:43.007893
5	2	ARRIVED	Administrator Klinik	Pasien check-in, nomor antrean K-001	2026-09-07 05:38:05.141555
6	2	COMPLETED	Administrator Klinik	Tindakan khitan selesai oleh dr. Muhammad Ali gufron & asisten Ns. Athour , S.Kep	2026-09-07 05:38:42.579771
7	3	BOOKED	Administrator Klinik	Booking otomatis dari pendaftaran pasien baru (Rencana Tindakan: 2026-09-07 17:02, Metode: glans pro bipolar pem sealer)	2026-09-07 10:02:28.124311
8	3	ARRIVED	Administrator Klinik	Pasien check-in, nomor antrean K-002	2026-09-07 10:02:56.074548
9	3	COMPLETED	Administrator Klinik	Tindakan khitan selesai oleh dr. Muhammad Ali gufron & asisten Ns. Athour , S.Kep	2026-09-07 10:03:55.543273
10	4	BOOKED	Administrator Klinik	Booking otomatis dari pendaftaran pasien baru (Rencana Tindakan: 2026-09-10 08:00, Metode: Metode Glans Pro Bipolar Pensealer)	2026-09-10 02:14:06.480766
11	4	ARRIVED	Administrator Klinik	Pasien check-in, nomor antrean K-001	2026-09-10 02:14:20.665039
12	4	COMPLETED	Administrator Klinik	Tindakan khitan selesai oleh dr. Natsir Albukaoni & asisten Ns. Athour , S.Kep, Novian Tri Andhika	2026-09-10 02:15:25.795406
13	5	BOOKED	Administrator Klinik	Booking otomatis dari pendaftaran pasien baru (Rencana Tindakan: 2026-07-03 08:00, Metode: Metode Tindakan Nano Klemp)	2026-09-10 03:51:56.082948
14	5	ARRIVED	Administrator Klinik	Pasien check-in, nomor antrean K-002	2026-09-10 03:52:14.515266
15	5	COMPLETED	Administrator Klinik	Tindakan khitan selesai oleh dr. Muhammad Ali gufron & asisten Novian Tri Andhika	2026-09-10 03:52:49.723557
\.


--
-- TOC entry 4429 (class 0 OID 16610)
-- Dependencies: 224
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.bookings (id, booking_number, patient_id, guardian_id, patient_category_id, package_id, doctor_id, booking_date, booking_time, package_price_snapshot, discount_amount, total_amount, dp_amount, remaining_amount, patient_source, notes, status, created_at, closing_staff_id, closing_staff_name, method_type, anesthesia_type) FROM stdin;
1	BOOK-20260906-0001	1	1	2	2	3	2026-10-12	08:38	2700000	0	2700000	0	0	WhatsApp / Chat Pendaftaran	Tgl Daftar: agustus • Usia Anak: tahun • Hobi & Minat Anak: blum ada • Prestasi Yang Pernah diraih Anak: belum ada • Rencana Tgl Sunat: october • Request Jam: siang • Cabang: bangkalan • Akun IG: queen ana safira • Request Metode: glans pro bipolar pen sealer vip • Paket:  • Agama: islam • nb: untuk pasien yang sudah daftar di mohon di konfirmasi ulang sebelum H- tindakan sunat (khitan)	CONFIRMED	2026-09-06 14:38:07.301066	\N	Administrator Klinik	glans pro bipolar pen sealer vip	Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)
2	BOOK-20260907-0002	2	2	2	2	1	2026-09-07	16:00	2700000	0	2700000	0	0	WhatsApp / Chat Pendaftaran	Tgl Daftar: Sep • Usia Anak: bulan • Rencana Tgl Sunat: September • Request Jam: . • Cabang: Bangkalan • Sumber informasi Sunat: teman • Akun IG: Qa_ainy • Request Metode: glans pro bipolar pem sealer • Paket: vip • Agama: islam	COMPLETED	2026-09-07 05:37:42.951998	\N	Administrator Klinik	glans pro bipolar pem sealer	Bius Kombinasi (FNI + Injeksi)
5	BOOK-20260910-0005	5	5	1	1	1	2026-07-03	08:00	1600000	350000	1250000	0	0	Datang Langsung (Walk-in)	Tgl Daftar: 29 juni 2026 • Usia Anak: 8 tahun • Hobi & Minat Anak: main • Rencana Tgl Sunat: 2026-07-03 • Request Jam: 08:00 • Cabang: bangkalan • Sumber Info: teman • Request Metode: nano klamp reguler • Paket: Reg • Agama: islam • Diskon/Voucher: Rp 350	COMPLETED	2026-09-10 03:51:56.018661	5	Novian Tri Andhika	Metode Tindakan Nano Klemp	Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)
3	BOOK-20260907-0003	3	3	2	2	1	2026-09-07	17:02	2700000	0	2700000	0	0	WhatsApp / Chat Pendaftaran	Tgl Daftar: Sep • Usia Anak: bulan • Rencana Tgl Sunat: September • Request Jam: . • Cabang: Bangkalan • Sumber informasi Sunat: teman • Akun IG: Qa_ainy • Request Metode: glans pro bipolar pem sealer • Paket: vip • Agama: islam	COMPLETED	2026-09-07 10:02:28.068008	\N	Administrator Klinik	glans pro bipolar pem sealer	Bius Kombinasi (FNI + Injeksi)
4	BOOK-20260910-0004	4	4	2	2	3	2026-09-10	08:00	2700000	0	2700000	0	0	Datang Langsung (Walk-in)	Tgl Daftar: // • Usia Anak: TH  BULN • Hobi & Minat Anak: NANGIS,game • Rencana Tgl Sunat: SEPTEMBER • Request Jam:  • Cabang: bangkalan • Sumber Info: teman • Request Metode:  • Paket:  • Agama: Islam • nb: untuk pasien yang sudah daftar di mohon di konfirmasi ulang sebelum H- tindakan sunat (khitan)	COMPLETED	2026-09-10 02:14:06.427087	5	Novian Tri Andhika	Metode Glans Pro Bipolar Pensealer	Bius Kombinasi (FNI + Injeksi)
\.


--
-- TOC entry 4431 (class 0 OID 16643)
-- Dependencies: 226
-- Data for Name: certificates; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.certificates (id, certificate_number, procedure_id, patient_id, doctor_id, issue_date, title, content, created_at) FROM stdin;
1	CERT-2026-000001	1	1	3	2026-09-06	SERTIFIKAT KHITAN NANO CIRCUMCISION	Diberikan kepada Ananda izzam alvaro (No. RM: RM-2026-000001) atas keberanian dan kesuksesannya menjalani tindakan khitan modern bersama dr. Natsir Albukaoni.	2026-09-06 14:41:24.464789
2	CERT-2026-000002	2	2	1	2026-09-07	SERTIFIKAT KHITAN NANO CIRCUMCISION	Diberikan kepada Ananda Muhammad Orhan Ghazi El Hanan (No. RM: RM-2026-000002) atas keberanian dan kesuksesannya menjalani tindakan khitan modern bersama dr. Muhammad Ali gufron.	2026-09-07 05:38:43.261
3	CERT-2026-000003	3	3	1	2026-09-07	SERTIFIKAT KHITAN NANO CIRCUMCISION	Diberikan kepada Ananda Muhammad Orhan Ghazi El Hanan (No. RM: RM-2026-000003) atas keberanian dan kesuksesannya menjalani tindakan khitan modern bersama dr. Muhammad Ali gufron.	2026-09-07 10:03:56.168942
4	CERT-2026-000004	4	4	3	2026-09-10	SERTIFIKAT KHITAN NANO CIRCUMCISION	Diberikan kepada Ananda AL GHIFARI DAVIANSYAH (No. RM: RM-2026-000004) atas keberanian dan kesuksesannya menjalani tindakan khitan modern bersama dr. Natsir Albukaoni.	2026-09-10 02:15:26.607214
5	CERT-2026-000005	5	5	1	2026-09-10	SERTIFIKAT KHITAN NANO CIRCUMCISION	Diberikan kepada Ananda Gilang Shodiq ramadhan (No. RM: RM-2026-000005) atas keberanian dan kesuksesannya menjalani tindakan khitan modern bersama dr. Muhammad Ali gufron.	2026-09-10 03:52:50.398444
\.


--
-- TOC entry 4487 (class 0 OID 17602)
-- Dependencies: 282
-- Data for Name: circumcision_methods; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.circumcision_methods (id, name, description, notes, is_active, created_at, updated_at, is_deleted) FROM stdin;
2	Metode Glans Pro Bipolar Pensealer	Teknologi bipolar pensil pemotong dan sealer presisi tanpa jahitan, tanpa perban, penyembuhan ultra-cepat.	Teknologi unggulan dengan hemostatis prima, aman bagi anak aktif, luka steril bebas basah.	t	2026-09-04 16:26:47.71307	2026-09-05 02:31:50.01	f
1	Metode Tindakan Nano Klemp	Metode khitan modern menggunakan klem steril dan perekat luka bedah (sealer) tanpa perban/jahitan.	Minim nyeri, luka cepat kering, anak bisa langsung beraktivitas normal dan mandi.	t	2026-09-04 16:26:47.71307	2026-09-05 02:32:06.415	f
\.


--
-- TOC entry 4433 (class 0 OID 16663)
-- Dependencies: 228
-- Data for Name: circumcision_packages; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.circumcision_packages (id, code, name, description, duration_minutes, is_active, created_at) FROM stdin;
2	PKT-SUPER-RING	Metode Glans Pro Bipolar Pensealer	Teknologi bipolar pensil pemotong dan sealer presisi tanpa jahitan, tanpa perban, penyembuhan ultra-cepat.	40	t	2026-09-03 04:39:20.84295
1	PKT-NANO-SEALER	Metode Tindakan Nano Klemp	Metode khitan modern menggunakan klem steril dan perekat luka bedah (sealer) tanpa perban/jahitan.	45	t	2026-09-03 04:39:20.84295
\.


--
-- TOC entry 4435 (class 0 OID 16682)
-- Dependencies: 230
-- Data for Name: circumcision_procedures; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.circumcision_procedures (id, procedure_number, booking_id, patient_id, doctor_id, procedure_date, procedure_time, method_type, pre_condition, procedure_notes, post_condition, care_instructions, control_date, additional_notes, status, checklist_data, created_at, completed_at, doctor_name_snapshot, assistant_staff_id, assistant_staff_name, anesthesia_type) FROM stdin;
4	PROC-20260910-001	4	4	3	2026-09-10	08:00	Metode Glans Pro Bipolar Pensealer	Anatomi normal, preputium mobile, tidak ada kelainan bawaan.	Anestesi blok cincin tanpa jarum suntik, insisi presisi hemostatis baik, aplikasi sealer medis steril.	Luka tertutup rapi, sirkulasi glans baik, tidak ada pendarahan aktif.	Boleh mandi setelah 24 jam dengan celana khitan khusus. Minum obat analgetik dan antibiotik teratur.	2026-09-11		COMPLETED	{"identityVerified":true,"guardianVerified":true,"packageConfirmed":true,"consentSigned":true,"procedureDone":true,"notesFilled":true,"careGiven":true,"controlScheduled":true,"assistantStaffIds":[1,5]}	2026-09-10 02:14:20.822323	2026-09-10 02:15:25.62	dr. Natsir Albukaoni	1	Ns. Athour , S.Kep, Novian Tri Andhika	Bius Kombinasi ( FNI + injeksi)
1	PROC-20260906-001	1	1	3	2026-09-06	08:38	glans pro bipolar pen sealer vip	Anatomi normal, preputium mobile, tidak ada kelainan bawaan.	Anestesi blok cincin tanpa jarum suntik, insisi presisi hemostatis baik, aplikasi sealer medis steril.	Luka tertutup rapi, sirkulasi glans baik, tidak ada pendarahan aktif.	Boleh mandi setelah 6 jam dengan celana khitan khusus. Minum obat analgetik dan antibiotik teratur.	2026-09-09		COMPLETED	{"identityVerified":true,"guardianVerified":true,"packageConfirmed":true,"consentSigned":true,"procedureDone":true,"notesFilled":true,"careGiven":true,"controlScheduled":true}	2026-09-06 14:39:14.006258	2026-09-06 14:41:23.674	dr. Natsir Albukaoni	5	Novian Tri Andhika	Bius Kombinasi ( FNI + injeksi)
2	PROC-20260907-001	2	2	1	2026-09-07	16:00	glans pro bipolar pem sealer	Anatomi normal, preputium mobile, tidak ada kelainan bawaan.	Anestesi blok cincin tanpa jarum suntik, insisi presisi hemostatis baik, aplikasi sealer medis steril.	Luka tertutup rapi, sirkulasi glans baik, tidak ada pendarahan aktif.	Boleh mandi setelah 24 jam dengan celana khitan khusus. Minum obat analgetik dan antibiotik teratur.	2026-09-09		COMPLETED	{"identityVerified":true,"guardianVerified":true,"packageConfirmed":true,"consentSigned":true,"procedureDone":true,"notesFilled":true,"careGiven":true,"controlScheduled":true}	2026-09-07 05:38:05.301782	2026-09-07 05:38:42.38	dr. Muhammad Ali gufron	1	Ns. Athour , S.Kep	Bius Kombinasi ( FNI + injeksi)
5	PROC-20260910-002	5	5	1	2026-09-10	08:00	Metode Tindakan Nano Klemp	Anatomi normal, preputium mobile, tidak ada kelainan bawaan.	Anestesi blok cincin tanpa jarum suntik, insisi presisi hemostatis baik, aplikasi sealer medis steril.	Luka tertutup rapi, sirkulasi glans baik, tidak ada pendarahan aktif.	Boleh mandi setelah 24 jam dengan celana khitan khusus. Minum obat analgetik dan antibiotik teratur.	2026-09-09		COMPLETED	{"identityVerified":true,"guardianVerified":true,"packageConfirmed":true,"consentSigned":true,"procedureDone":true,"notesFilled":true,"careGiven":true,"controlScheduled":true,"assistantStaffIds":[5]}	2026-09-10 03:52:14.672752	2026-09-10 03:52:49.527	dr. Muhammad Ali gufron	5	Novian Tri Andhika	Bius Kombinasi ( FNI + injeksi)
3	PROC-20260907-002	3	3	1	2026-09-07	17:02	glans pro bipolar pem sealer	Anatomi normal, preputium mobile, tidak ada kelainan bawaan.hanya ada indikasi fimosis	Anestesi blok cincin tanpa jarum suntik, insisi presisi hemostatis baik, aplikasi sealer medis steril.	Luka tertutup rapi, sirkulasi glans baik, tidak ada pendarahan aktif.	Boleh mandi setelah 24 jam dengan celana khitan khusus. Minum obat analgetik dan antibiotik teratur.	2026-09-09		COMPLETED	{"identityVerified":true,"guardianVerified":true,"packageConfirmed":true,"consentSigned":true,"procedureDone":true,"notesFilled":true,"careGiven":true,"controlScheduled":true}	2026-09-07 10:02:56.233857	2026-09-07 10:03:55.362	dr. Muhammad Ali gufron	1	Ns. Athour , S.Kep	Bius Kombinasi ( FNI + injeksi)
\.


--
-- TOC entry 4437 (class 0 OID 16705)
-- Dependencies: 232
-- Data for Name: clinic_settings; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.clinic_settings (id, clinic_name, tagline, address, phone, email, website, logo_url, invoice_header, invoice_footer, invoice_paper_default, default_doctor_fee_type, updated_at) FROM stdin;
1	NANO CIRCUMCISION CLINIC	Pusat Khitan Modern, Aman & Nyaman Tanpa Jahit	RUKO KHAYANGAN RECIDENCE RB_16  BURNEH BANGKALAN MADURA	0812-8888-9999	NanoCirumcision@gmail.com	www.nanocircumcision.com	\N	Terima kasih telah mempercayakan tindakan khitan putra tercinta kepada tim medis Nano Circumcision.	Dokumen ini sah dan diterbitkan secara digital oleh PT Nano Circumcision Management System.	A4	FIXED	2026-09-04 16:07:18.958
\.


--
-- TOC entry 4439 (class 0 OID 16727)
-- Dependencies: 234
-- Data for Name: doctor_fee_rules; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.doctor_fee_rules (id, doctor_id, package_id, patient_category_id, fee_amount, effective_date, is_active) FROM stdin;
2	1	1	2	450000	2026-01-01	t
5	3	1	1	250000	2026-01-01	t
6	3	1	2	380000	2026-01-01	t
8	1	2	2	450000	2026-01-01	t
12	3	2	2	380000	2026-01-01	t
1	1	1	1	300000	2026-01-01	f
7	1	2	1	300000	2026-01-01	f
11	3	2	1	250000	2026-01-01	f
\.


--
-- TOC entry 4441 (class 0 OID 16744)
-- Dependencies: 236
-- Data for Name: doctor_fee_transactions; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.doctor_fee_transactions (id, fee_number, doctor_id, patient_id, booking_id, procedure_id, invoice_id, package_id, patient_category_id, fee_amount, fee_date, status, approved_at, paid_at, notes, created_at) FROM stdin;
1	FEE-20260906-0001	3	1	1	1	1	2	2	380000	2026-09-06	APPROVED	2026-09-07 05:33:39.821	\N	Fee tindakan khitan untuk izzam alvaro (dr. Natsir Albukaoni)	2026-09-06 14:41:24.107839
2	FEE-20260907-0002	1	2	2	2	2	2	2	450000	2026-09-07	APPROVED	2026-09-07 10:07:33.858	\N	Fee tindakan khitan untuk Muhammad Orhan Ghazi El Hanan (dr. Muhammad Ali gufron)	2026-09-07 05:38:42.861783
3	FEE-20260907-0003	1	3	3	3	3	2	2	450000	2026-09-07	APPROVED	2026-09-07 10:07:35.582	\N	Fee tindakan khitan untuk Muhammad Orhan Ghazi El Hanan (dr. Muhammad Ali gufron)	2026-09-07 10:03:55.800903
4	FEE-20260910-0004	3	4	4	4	4	2	2	380000	2026-09-10	PENDING	\N	\N	Fee tindakan khitan untuk AL GHIFARI DAVIANSYAH (dr. Natsir Albukaoni)	2026-09-10 02:15:26.048022
5	FEE-20260910-0005	1	5	5	5	5	1	1	250000	2026-09-10	PENDING	\N	\N	Fee tindakan khitan untuk Gilang Shodiq ramadhan (dr. Muhammad Ali gufron)	2026-09-10 03:52:50.002963
\.


--
-- TOC entry 4443 (class 0 OID 16769)
-- Dependencies: 238
-- Data for Name: doctor_schedules; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.doctor_schedules (id, doctor_id, day_of_week, start_time, end_time, max_capacity, is_active) FROM stdin;
1	1	Senin	08:00	16:00	12	t
2	1	Selasa	08:00	16:00	12	t
3	1	Rabu	08:00	16:00	12	t
4	1	Kamis	08:00	16:00	12	t
5	1	Jumat	08:00	16:00	12	t
6	1	Sabtu	08:00	16:00	12	t
7	1	Minggu	08:00	16:00	12	t
15	3	Senin	08:00	16:00	12	t
16	3	Selasa	08:00	16:00	12	t
17	3	Rabu	08:00	16:00	12	t
18	3	Kamis	08:00	16:00	12	t
19	3	Jumat	08:00	16:00	12	t
20	3	Sabtu	08:00	16:00	12	t
21	3	Minggu	08:00	16:00	12	t
\.


--
-- TOC entry 4445 (class 0 OID 16787)
-- Dependencies: 240
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.doctors (id, code, name, title, specialty, phone, email, sip_number, is_active, created_at, description, notes, is_deleted) FROM stdin;
1	DOC-001	dr. Muhammad Ali gufron	dr.	Dokter Spesialis Bedah & Operator Khitan Senior	0812-1111-2222	Gufron@nanocircumcision.com	SIP.440/123/DISKES/2023	t	2026-09-03 04:39:20.84295			f
3	DOC-003	dr. Natsir Albukaoni	dr.	Dokter Operator Khitan Ramah Anak	0815-5555-6666	Natsir@nanocircumcision.com	SIP.440/789/DISKES/2024	t	2026-09-03 04:39:20.84295			f
\.


--
-- TOC entry 4479 (class 0 OID 17410)
-- Dependencies: 274
-- Data for Name: employee_fee_rules; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.employee_fee_rules (id, employee_id, package_id, patient_category_id, fee_amount, is_active) FROM stdin;
\.


--
-- TOC entry 4481 (class 0 OID 17422)
-- Dependencies: 276
-- Data for Name: employee_fee_transactions; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.employee_fee_transactions (id, fee_number, employee_id, employee_name, patient_id, patient_rm, patient_name, booking_id, procedure_id, procedure_date, fee_amount, status, payroll_id, paid_at, notes, created_at) FROM stdin;
3	EFEE-20260907-0003	1	Ns. Athour , S.Kep	3	RM-2026-000003	Muhammad Orhan Ghazi El Hanan	3	3	2026-09-07	25000	INCLUDED_IN_PAYROLL	12	\N	Fee asisten tindakan khitan pasien Muhammad Orhan Ghazi El Hanan (RM-2026-000003)	2026-09-07 10:03:56.007799
2	EFEE-20260907-0002	1	Ns. Athour , S.Kep	2	RM-2026-000002	Muhammad Orhan Ghazi El Hanan	2	2	2026-09-07	25000	INCLUDED_IN_PAYROLL	12	\N	Fee asisten tindakan khitan pasien Muhammad Orhan Ghazi El Hanan (RM-2026-000002)	2026-09-07 05:38:43.089454
4	EFEE-20260910-0001	1	Ns. Athour , S.Kep	4	RM-2026-000004	AL GHIFARI DAVIANSYAH	4	4	2026-09-10	25000	PENDING	\N	\N	Fee asisten tindakan khitan pasien AL GHIFARI DAVIANSYAH (RM-2026-000004)	2026-09-10 02:15:26.251416
5	EFEE-20260910-0002	5	Novian Tri Andhika	4	RM-2026-000004	AL GHIFARI DAVIANSYAH	4	4	2026-09-10	20000	PENDING	\N	\N	Fee asisten tindakan khitan pasien AL GHIFARI DAVIANSYAH (RM-2026-000004)	2026-09-10 02:15:26.453382
6	EFEE-20260910-0003	5	Novian Tri Andhika	5	RM-2026-000005	Gilang Shodiq ramadhan	5	5	2026-09-10	20000	PENDING	\N	\N	Fee asisten tindakan khitan pasien Gilang Shodiq ramadhan (RM-2026-000005)	2026-09-10 03:52:50.229143
1	EFEE-20260906-0001	5	Novian Tri Andhika	1	RM-2026-000001	izzam alvaro	1	1	2026-09-06	20000	INCLUDED_IN_PAYROLL	11	\N	Fee asisten tindakan khitan pasien izzam alvaro (RM-2026-000001)	2026-09-06 14:41:24.311652
\.


--
-- TOC entry 4483 (class 0 OID 17447)
-- Dependencies: 278
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.employees (id, employee_code, name, "position", phone, email, start_date, basic_salary, default_patient_fee, is_active, notes, created_at, closing_fee_per_patient, overtime_hourly_rate, description, is_deleted) FROM stdin;
2	EMP-002	Ns. Tri Wahyuni, A.Md.Kep	Perawat Khitan & Asisten Medis	0813-4455-6677	tri.wahyuni@nanocircumcision.com	2024-03-01	3200000	20000	f	Asisten tindakan dan penanggung jawab sterilisasi instrumen	2026-09-04 01:30:56.937723	25000	35000	\N	t
4	EMP-004	Budi Santoso	Teknisi Logistik & Sterilisasi	0815-6677-8899	budi.santoso@nanocircumcision.com	2024-05-01	2800000	5000	f	Pengelolaan inventaris obat, klem, dan sterilisasi	2026-09-04 01:30:56.937723	25000	35000	\N	t
5	EMP-005	Novian Tri Andhika	Administrasi & Logistik	085331309822		2026-09-04	1800000	20000	t		2026-09-04 01:44:04.881156	30000	15000		f
1	EMP-001	Ns. Athour , S.Kep	Perawat Khitan & Asisten Medis Utama	0812-3344-5566	ahmad.fauzi@nanocircumcision.com	2024-01-15	2000000	25000	t	Asisten tindakan khitan senior bersertifikat	2026-09-04 01:30:56.937723	30000	15000		f
\.


--
-- TOC entry 4447 (class 0 OID 16808)
-- Dependencies: 242
-- Data for Name: expense_categories; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.expense_categories (id, name, description, is_default) FROM stdin;
1	Fee Dokter	Beban pengeluaran kompensasi / fee dokter pelaksana tindakan	t
2	Pembelian Obat	Pengadaan obat anestesi, analgetik, dan salep perawatan luka	t
3	Alat Khitan	Pengadaan klem steril, ring, sealer, dan blade cauter	t
4	Perlengkapan	Kain kasa, handscoon steril, apron disposable, kassa alkohol	t
5	Gaji Staff	Gaji bulanan perawat asisten tindakan dan staff administrasi	t
6	Listrik & Air	Tagihan utilitas gedung klinik	t
7	Internet & Software	Koneksi internet dan server operasional	t
8	Sewa Tempat	Sewa ruko / klinik cabang	t
9	Marketing & Ads	Iklan Instagram, TikTok, Meta Ads & Google Ads	t
10	Transportasi	Bensin dan operasional logistik	t
11	Operasional Klinik	Snack pasien, kebersihan, tisu, dan perlengkapan harian	t
12	Lainnya	Pengeluaran rupa-rupa tidak terduga	t
\.


--
-- TOC entry 4449 (class 0 OID 16823)
-- Dependencies: 244
-- Data for Name: expense_transactions; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.expense_transactions (id, transaction_number, expense_date, category_id, category_name, description, amount, payment_method, receipt_url, created_by, status, created_at) FROM stdin;
1	EXP-20260901-0001	2026-09-01	3	Alat Khitan	Restock 20 Set Klem Nano & Ring Steril Disposable	3500000	TRANSFER	\N	Admin	PAID	2026-09-03 04:39:49.833033
2	EXP-20260901-0002	2026-09-01	2	Pembelian Obat	Pengadaan Ampul Anestesi Lokal & Salep Antibiotik Khusus	1800000	TRANSFER	\N	Admin	PAID	2026-09-03 04:39:49.833033
3	EXP-20260902-0003	2026-09-02	9	Marketing & Ads	Iklan Meta & Instagram Story Kampanye Khitan Liburan	1200000	DEBIT	\N	Admin	PAID	2026-09-03 04:39:49.833033
4	EXP-20260902-0004	2026-09-02	11	Operasional Klinik	Paket Snack Box Pasien VIP & Goodie Bag Anak	650000	CASH	\N	Staff	PAID	2026-09-03 04:39:49.833033
\.


--
-- TOC entry 4451 (class 0 OID 16847)
-- Dependencies: 246
-- Data for Name: follow_ups; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.follow_ups (id, booking_id, procedure_id, patient_id, follow_up_type, scheduled_date, contact_date, staff_name, patient_condition, notes, status, created_at) FROM stdin;
2	1	1	1	H+3	2026-09-09	2026-09-10	Administrator Klinik	\N	Pemeriksaan pengeringan luka, kebersihan celana khitan, dan nafsu makan. [Notifikasi WA terkirim 10/9/2026]	CONTACTED	2026-09-06 14:41:24.567285
5	2	2	2	H+3	2026-09-10	2026-09-10	Administrator Klinik	\N	Pemeriksaan pengeringan luka, kebersihan celana khitan, dan nafsu makan.	CONTACTED	2026-09-07 05:38:43.376459
8	3	3	3	H+3	2026-09-10	2026-09-10	Administrator Klinik	\N	Pemeriksaan pengeringan luka, kebersihan celana khitan, dan nafsu makan.	CONTACTED	2026-09-07 10:03:56.297026
1	1	1	1	H+1	2026-09-07	2026-09-10	Administrator Klinik	\N	Konfirmasi rasa nyeri, pendarahan, dan kemampuan buang air kecil pasca 24 jam. [Notifikasi WA terkirim 10/9/2026]	CONTACTED	2026-09-06 14:41:24.567285
4	2	2	2	H+1	2026-09-08	2026-09-10	Administrator Klinik	\N	Konfirmasi rasa nyeri, pendarahan, dan kemampuan buang air kecil pasca 24 jam. [Notifikasi WA terkirim 10/9/2026]	CONTACTED	2026-09-07 05:38:43.376459
7	3	3	3	H+1	2026-09-08	2026-09-10	Administrator Klinik	\N	Konfirmasi rasa nyeri, pendarahan, dan kemampuan buang air kecil pasca 24 jam. [Notifikasi WA terkirim 10/9/2026]	CONTACTED	2026-09-07 10:03:56.297026
10	4	4	4	H+1	2026-09-11	2026-09-10	Administrator Klinik	\N	Konfirmasi rasa nyeri, pendarahan, dan kemampuan buang air kecil pasca 24 jam pertama. [Notifikasi WA terkirim 10/9/2026]	CONTACTED	2026-09-10 02:15:26.709664
3	1	1	1	H+7	2026-09-13	2026-09-10	Administrator Klinik	\N	Evaluasi kesembuhan total dan pelepasan pelindung sealer/ring. [Notifikasi WA terkirim 10/9/2026]	CONTACTED	2026-09-06 14:41:24.567285
11	4	4	4	H+3	2026-09-13	2026-09-10	Administrator Klinik	\N	Pemeriksaan pengeringan luka sealer, kebersihan celana khitan, dan perkembangan anak. [Notifikasi WA terkirim 10/9/2026]	CONTACTED	2026-09-10 02:15:26.709664
6	2	2	2	H+7	2026-09-14	2026-09-10	Administrator Klinik	\N	Evaluasi kesembuhan total dan pelepasan pelindung sealer/ring. [Notifikasi WA terkirim 10/9/2026]	CONTACTED	2026-09-07 05:38:43.376459
9	3	3	3	H+7	2026-09-14	2026-09-10	Administrator Klinik	\N	Evaluasi kesembuhan total dan pelepasan pelindung sealer/ring. [Notifikasi WA terkirim 10/9/2026]	CONTACTED	2026-09-07 10:03:56.297026
12	4	4	4	H+7	2026-09-17	2026-09-10	Administrator Klinik	\N	Follow up chat WA menanyakan perkembangan penyembuhan (Metode Glans Pro Bipolar selesai tanpa kontrol lepas alat). [Notifikasi WA terkirim 10/9/2026]	CONTACTED	2026-09-10 02:15:26.709664
13	5	5	5	H+1	2026-09-11	\N	\N	\N	Konfirmasi rasa nyeri, pendarahan, dan kemampuan buang air kecil pasca 24 jam pertama.	PENDING	2026-09-10 03:52:50.511811
14	5	5	5	H+3	2026-09-13	\N	\N	\N	Pemeriksaan kebersihan alat klem, persiapan kontrol lepas alat (H+5), dan kenyamanan anak.	PENDING	2026-09-10 03:52:50.511811
15	5	5	5	H+5	2026-09-15	\N	\N	\N	Pemberitahuan kontrol lepas alat Nanoklemp di klinik (5 hari pasca tindakan).	PENDING	2026-09-10 03:52:50.511811
16	5	5	5	H+7	2026-09-17	\N	\N	\N	Follow up chat WA evaluasi kesembuhan total pasca pelepasan alat klem di klinik.	PENDING	2026-09-10 03:52:50.511811
\.


--
-- TOC entry 4453 (class 0 OID 16865)
-- Dependencies: 248
-- Data for Name: guardians; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.guardians (id, name, father_name, mother_name, guardian_name, relationship, phone, alternate_phone, address, notes, created_at) FROM stdin;
1	iswatun hasanah	iswatun hasanah		iswatun hasanah	Ibu Kandung	085857105734		dsn. kandang  rt / banteyan. kecamatan kelampis, RT/RW: ibu rumah tangga		2026-09-06 14:38:06.989421
2	Hanan. Ibu : Qurrotul Ainy	Hanan. Ibu : Qurrotul Ainy	Qurrotul Ainy	Hanan. Ibu : Qurrotul Ainy	Ayah Kandung	085733286618		kmp. Jaya sumber no  rt/rw / desa Pesanggrahan kec Kwanyar, RT/RW: ASN		2026-09-07 05:37:42.626853
3	Hanan. Ibu : Qurrotul Ainy	Hanan. Ibu : Qurrotul Ainy	Qurrotul Ainy	Hanan. Ibu : Qurrotul Ainy	Ayah Kandung	085733286618		kmp. Jaya sumber no  rt/rw / desa Pesanggrahan kec Kwanyar, RT/RW: ASN		2026-09-07 10:02:27.74549
5	M. Sodik	M. Sodik		M. Sodik	Ayah Kandung	085784582370		tedungan socah, RT/RW: swasta		2026-09-10 03:51:55.754024
4	WAHYU 	WAHYU 	Yuli	WAHYU 	Ayah Kandung	085257361205		Dsn Baruk Lajing Arosbaya, 		2026-09-10 02:14:06.163281
\.


--
-- TOC entry 4455 (class 0 OID 16880)
-- Dependencies: 250
-- Data for Name: informed_consents; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.informed_consents (id, consent_number, procedure_id, patient_id, guardian_id, doctor_id, consent_date, signer_name, signer_relation, status, signed_at) FROM stdin;
\.


--
-- TOC entry 4457 (class 0 OID 16903)
-- Dependencies: 252
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.invoices (id, invoice_number, booking_id, patient_id, doctor_id, invoice_date, subtotal, discount, total_amount, paid_amount, remaining_amount, status, notes, created_at, void_reason, voided_at, voided_by) FROM stdin;
1	INV-20260906-0001	1	1	3	2026-10-12	2700000	0	2700000	2700000	0	PAID	Invoice otomatis dari booking pendaftaran izzam alvaro	2026-09-06 14:38:07.458746	\N	\N	\N
2	INV-20260907-0002	2	2	1	2026-09-07	2700000	0	2700000	2700000	0	PAID	Invoice otomatis dari booking pendaftaran Muhammad Orhan Ghazi El Hanan	2026-09-07 05:37:43.112001	\N	\N	\N
3	INV-20260907-0003	3	3	1	2026-09-07	2700000	0	2700000	2700000	0	PAID	Invoice otomatis dari booking pendaftaran Muhammad Orhan Ghazi El Hanan	2026-09-07 10:02:28.230573	\N	\N	\N
4	INV-20260910-0004	4	4	3	2026-09-10	2700000	0	2700000	2700000	0	PAID	Invoice otomatis dari booking pendaftaran AL GHIFARI DAVIANSYAH	2026-09-10 02:14:06.584523	\N	\N	\N
5	INV-20260910-0005	5	5	1	2026-07-03	1600000	350000	1250000	1250000	0	PAID	Invoice otomatis dari booking pendaftaran Gilang Shodiq ramadhan	2026-09-10 03:51:56.19886	\N	\N	\N
\.


--
-- TOC entry 4471 (class 0 OID 17258)
-- Dependencies: 266
-- Data for Name: package_included_items; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.package_included_items (id, package_id, patient_category_id, product_id, quantity, is_included, notes, created_at) FROM stdin;
1	2	1	2	1	t	Termasuk dalam Paket Reguler: 1 pcs Celana Sunat	2026-09-03 05:03:01.495001
3	1	1	2	1	t	Termasuk dalam Paket Reguler: 1 pcs Celana Sunat	2026-09-03 05:03:01.495001
5	2	1	4	1	t	Termasuk dalam Paket Reguler: 1 paket Obat Oral Standar	2026-09-03 05:03:01.495001
7	1	1	4	1	t	Termasuk dalam Paket Reguler: 1 paket Obat Oral Standar	2026-09-03 05:03:01.495001
9	2	2	2	2	t	Termasuk dalam Paket VIP: 2 pcs Celana Sunat Pelindung	2026-09-03 05:03:01.495001
11	1	2	2	2	t	Termasuk dalam Paket VIP: 2 pcs Celana Sunat Pelindung	2026-09-03 05:03:01.495001
13	2	2	4	1	t	Termasuk dalam Paket VIP: 1 paket Obat Oral Standar	2026-09-03 05:03:01.495001
15	1	2	4	1	t	Termasuk dalam Paket VIP: 1 paket Obat Oral Standar	2026-09-03 05:03:01.495001
17	2	1	8	1	t		2026-09-04 16:44:17.167045
18	1	1	11	1	t		2026-09-05 03:34:17.67433
19	1	1	6	1	t		2026-09-05 03:34:27.670992
20	1	1	8	1	t		2026-09-05 03:34:42.863218
22	1	1	5	1	t		2026-09-05 03:35:31.899749
24	1	2	11	1	t		2026-09-05 03:35:52.628246
23	1	2	1	1	t		2026-09-05 03:35:46.547591
25	1	2	8	1	t		2026-09-05 03:35:58.14934
21	1	2	5	1	t		2026-09-05 03:35:22.838777
26	2	1	11	1	t		2026-09-05 03:37:45.791517
27	2	1	6	1	t		2026-09-05 03:37:54.252216
28	2	1	5	1	t		2026-09-05 03:38:03.733138
29	2	2	8	1	t		2026-09-05 03:38:15.163404
30	2	2	11	1	t		2026-09-05 03:38:30.910518
31	2	2	5	1	t		2026-09-05 03:38:42.41336
32	2	2	1	1	t		2026-09-05 03:38:50.102068
\.


--
-- TOC entry 4459 (class 0 OID 16931)
-- Dependencies: 254
-- Data for Name: package_prices; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.package_prices (id, package_id, patient_category_id, price, effective_from, effective_until, is_active) FROM stdin;
2	2	1	1500000	2026-01-01	2026-09-05	f
6	2	2	2100000	2026-01-01	2026-09-05	f
9	2	1	2400000	2026-09-05	\N	t
10	2	2	2700000	2026-09-05	\N	t
1	1	1	1800000	2026-01-01	2026-09-05	f
5	1	2	2400000	2026-01-01	2026-09-05	f
11	1	1	1600000	2026-09-05	\N	t
12	1	2	1800000	2026-09-05	\N	t
\.


--
-- TOC entry 4461 (class 0 OID 16947)
-- Dependencies: 256
-- Data for Name: patient_categories; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.patient_categories (id, code, name, description, is_default, is_active) FROM stdin;
1	REGULER	Pasien Reguler	Layanan khitan standar ruang tindakan utama	t	t
2	VIP	Pasien VIP	Layanan khitan private room, snack luxury & prioritas penanganan	f	t
\.


--
-- TOC entry 4463 (class 0 OID 16965)
-- Dependencies: 258
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.patients (id, rm_number, full_name, nickname, nik, gender, birth_place, birth_date, age_years, age_months, address, phone, school, grade, weight_kg, height_cm, allergies, notes, guardian_id, is_active, created_at, is_deleted, deleted_at, deleted_by) FROM stdin;
1	RM-2026-000001	izzam alvaro	izzam		Laki-laki	Bangkalan	2023-10-11	2	11	dsn. kandang  rt / banteyan. kecamatan kelampis, RT/RW: ibu rumah tangga	085857105734	belum sekolah					Tgl Daftar: agustus • Usia Anak: tahun • Hobi & Minat Anak: blum ada • Prestasi Yang Pernah diraih Anak: belum ada • Rencana Tgl Sunat: october • Request Jam: siang • Cabang: bangkalan • Akun IG: queen ana safira • Request Metode: glans pro bipolar pen sealer vip • Paket:  • Agama: islam • nb: untuk pasien yang sudah daftar di mohon di konfirmasi ulang sebelum H- tindakan sunat (khitan)	1	t	2026-09-06 14:38:07.094526	f	\N	\N
3	RM-2026-000003	Muhammad Orhan Ghazi El Hanan	Muhammad		Laki-laki	Bangkalan	2025-03-15	1	6	kmp. Jaya sumber no  rt/rw / desa Pesanggrahan kec Kwanyar, RT/RW: ASN	085733286618	-				Fimosis	Tgl Daftar: Sep • Usia Anak: bulan • Rencana Tgl Sunat: September • Request Jam: . • Cabang: Bangkalan • Sumber informasi Sunat: teman • Akun IG: Qa_ainy • Request Metode: glans pro bipolar pem sealer • Paket: vip • Agama: islam	3	t	2026-09-07 10:02:27.852824	f	\N	\N
2	RM-2026-000002	Muhammad Orhan Ghazi El Hanan	Muhammad		Laki-laki	Bangkalan	2025-03-15	1	6	kmp. Jaya sumber no  rt/rw / desa Pesanggrahan kec Kwanyar, RT/RW: ASN	085733286618						Tgl Daftar: Sep • Usia Anak: bulan • Rencana Tgl Sunat: September • Request Jam: . • Cabang: Bangkalan • Sumber informasi Sunat: teman • Akun IG: Qa_ainy • Request Metode: glans pro bipolar pem sealer • Paket: vip • Agama: islam\n[Diarsipkan: Dihapus oleh admin oleh Administrator Klinik]	2	t	2026-09-07 05:37:42.735681	t	2026-09-09 01:17:26.723	Administrator Klinik
5	RM-2026-000005	Gilang Shodiq ramadhan	Gilang		Laki-laki	Bangkalan	2018-05-27	8	4	tedungan socah, RT/RW: swasta	085784582370	kelas 2 SDN 01 socah	kelas 2				Tgl Daftar: 29 juni 2026 • Usia Anak: 8 tahun • Hobi & Minat Anak: main • Rencana Tgl Sunat: 2026-07-03 • Request Jam: 08:00 • Cabang: bangkalan • Sumber Info: teman • Request Metode: nano klamp reguler • Paket: Reg • Agama: islam • Diskon/Voucher: Rp 350	5	t	2026-09-10 03:51:55.860746	f	\N	\N
4	RM-2026-000004	AL GHIFARI DAVIANSYAH	AL		Laki-laki	Bangkalan	2024-08-14	2	1	Dsn Baruk Lajing Arosbaya, 	085257361205	klas  SDN LAJING				Tidak ada	Tgl Daftar: // • Usia Anak: TH  BULN • Hobi & Minat Anak: NANGIS,game • Rencana Tgl Sunat: SEPTEMBER • Request Jam:  • Cabang: bangkalan • Sumber Info: teman • Request Metode:  • Paket:  • Agama: Islam • nb: untuk pasien yang sudah daftar di mohon di konfirmasi ulang sebelum H- tindakan sunat (khitan)	4	t	2026-09-10 02:14:06.268513	f	\N	\N
\.


--
-- TOC entry 4465 (class 0 OID 16990)
-- Dependencies: 260
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.payments (id, payment_number, invoice_id, payment_date, amount, payment_method, payment_type, reference_number, notes, received_by, created_at) FROM stdin;
1	PAY-20260906-0001-5332	1	2026-09-06	2700000	CASH	FULL_PAYMENT			Administrator Klinik	2026-09-06 14:41:35.359896
2	PAY-20260907-0002-8375	2	2026-09-07	2700000	CASH	FULL_PAYMENT			Administrator Klinik	2026-09-07 05:38:48.397068
3	PAY-20260907-0003-7886	3	2026-09-07	2700000	CASH	FULL_PAYMENT			Administrator Klinik	2026-09-07 10:04:27.90881
4	PAY-20260910-0004-4687	4	2026-09-10	2700000	QRIS	FULL_PAYMENT			Administrator Klinik	2026-09-10 02:15:34.715082
5	PAY-20260910-0005-9771	5	2026-09-10	1250000	CASH	FULL_PAYMENT			Administrator Klinik	2026-09-10 03:52:59.792186
\.


--
-- TOC entry 4485 (class 0 OID 17471)
-- Dependencies: 280
-- Data for Name: payrolls; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.payrolls (id, payroll_number, employee_id, employee_name, period_month, period_year, payment_date, basic_salary, patient_fee_total, patient_count, bonus_amount, deduction_amount, net_salary, payment_method, status, notes, paid_at, processed_by, created_at, closing_patient_count, closing_fee_per_patient, closing_fee_total, overtime_hours, overtime_hourly_rate, overtime_total) FROM stdin;
11	PAYROLL-202609-003	5	Novian Tri Andhika	2026-09	2026	2026-09-07	1800000	20000	1	0	0	1820000	TRANSFER	DRAFT	Penggajian periode 2026-09	\N	Administrator Nano Circumcision	2026-09-07 10:41:21.554494	0	25000	0	0	35000	0
12	PAYROLL-202609-004	1	Ns. Athour , S.Kep	2026-09	2026	2026-09-07	2000000	50000	2	0	0	2170000	TRANSFER	DRAFT	Penggajian periode 2026-09	\N	Administrator Nano Circumcision	2026-09-07 10:41:21.862629	2	30000	60000	4	15000	60000
\.


--
-- TOC entry 4473 (class 0 OID 17275)
-- Dependencies: 268
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.products (id, sku, name, category, unit, sell_price, cost_price, stock, min_stock, is_active, description, created_at) FROM stdin;
3	PRD-CLN-002	Celana Sunat Karakter Hero Premium	CELANA_SUNAT	pcs	65000	28000	60	15	t	Celana sunat motif superhero pelindung tahan benturan	2026-09-03 05:02:55.51408
7	PRD-MNN-002	Robot Action Figure Transformers Mini	MAINAN	pcs	45000	20000	40	10	t	Mainan robotik favorit anak untuk motivasi setelah tindakan	2026-09-03 05:02:55.51408
9	PRD-OTH-001	Kasa Steril & Waterproof Dressing Pack	LAINNYA	box	40000	18000	45	10	t	Kasa pembalut steril tahan air khusus khitan	2026-09-03 05:02:55.51408
10	PRD-TTS-143	Obat Tetes ( Antibiotic luar)	OBAT_TETES	tube	90000	25000	20	10	t		2026-09-05 01:15:02.633424
12	PRD-CLN-559	Paket Celana Sunat (3pcs 100k)	CELANA_SUNAT	paket	100000	75000	20	10	t		2026-09-05 01:17:05.814397
13	PRD-CLN-797	Celana Sunat Ecer	CELANA_SUNAT	pcs	35000	25000	20	10	t		2026-09-05 01:17:41.246496
1	PRD-TTS-001	Obat Tetes Khitan Spesial (Nano Drops)	OBAT_TETES	botol	90000	25000	46	10	t	Obat tetes pemulihan luka khitan cepat kering dan anti-lengket	2026-09-03 05:02:55.51408
14	PRD-OBT-292	Paket Obat Kapsul	OBAT	paket	250000	100000	20	10	t	Paket obat pil 	2026-09-06 14:34:53.9886
2	PRD-CLN-001	Celana Sunat Pelindung Tempurung Super	CELANA_SUNAT	pcs	50000	20000	91	20	t	Celana sunat ergonomis dengan kubah pelindung berventilasi udara	2026-09-03 05:02:55.51408
4	PRD-OBT-001	Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik)	OBAT	paket	200000	90000	75	15	t	Paket obat minum pereda nyeri dan pencegah infeksi ramah anak	2026-09-03 05:02:55.51408
11	PRD-OTH-954	GodiieBag Nano Special Edition	LAINNYA	box	50000	25000	15	10	t		2026-09-05 01:16:01.408497
8	PRD-AKS-001	Sertifikat	AKSESORIS	pcs	30000	12000	55	15	t	Medali kehormatan berlogo klinik untuk kenang-kenangan	2026-09-03 05:02:55.51408
5	PRD-OBT-002	Obat Spray (Antiseptic)	LAINNYA	tube	75000	35000	35	10	t	Salep gel steril untuk mempercepat epitelisasi jaringan luka khitan	2026-09-03 05:02:55.51408
6	PRD-MNN-001	Mobil Diecast Sport Hadiah Anak Berani	MAINAN	pcs	35000	15000	0	10	t	Mainan hadiah pereda cemas dan apresiasi anak berani khitan	2026-09-03 05:02:55.51408
\.


--
-- TOC entry 4467 (class 0 OID 17013)
-- Dependencies: 262
-- Data for Name: queues; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.queues (id, queue_number, queue_date, booking_id, patient_id, doctor_id, status, arrived_at, created_at) FROM stdin;
1	K-001	2026-09-06	1	1	3	COMPLETED	14:39	2026-09-06 14:39:13.901766
2	K-001	2026-09-07	2	2	1	COMPLETED	05:38	2026-09-07 05:38:05.194264
3	K-002	2026-09-07	3	3	1	COMPLETED	10:02	2026-09-07 10:02:56.126685
4	K-001	2026-09-10	4	4	3	COMPLETED	02:14	2026-09-10 02:14:20.718086
5	K-002	2026-09-10	5	5	1	COMPLETED	03:52	2026-09-10 03:52:14.567288
\.


--
-- TOC entry 4475 (class 0 OID 17303)
-- Dependencies: 270
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.stock_movements (id, movement_number, product_id, movement_type, quantity, previous_stock, current_stock, unit_cost, unit_price, reference_type, reference_id, notes, performed_by, created_at) FROM stdin;
1	STK-INIT-PRD-TTS-001	1	IN	50	0	50	45000	90000	RESTOCK	\N	Saldo awal master stok klinik	Apoteker / Admin	2026-09-03 05:03:04.348834
2	STK-INIT-PRD-CLN-001	2	IN	100	0	100	20000	50000	RESTOCK	\N	Saldo awal master stok klinik	Apoteker / Admin	2026-09-03 05:03:04.348834
3	STK-INIT-PRD-CLN-002	3	IN	60	0	60	28000	65000	RESTOCK	\N	Saldo awal master stok klinik	Apoteker / Admin	2026-09-03 05:03:04.348834
4	STK-INIT-PRD-OBT-001	4	IN	80	0	80	55000	120000	RESTOCK	\N	Saldo awal master stok klinik	Apoteker / Admin	2026-09-03 05:03:04.348834
5	STK-INIT-PRD-OBT-002	5	IN	40	0	40	35000	75000	RESTOCK	\N	Saldo awal master stok klinik	Apoteker / Admin	2026-09-03 05:03:04.348834
6	STK-INIT-PRD-MNN-001	6	IN	50	0	50	15000	35000	RESTOCK	\N	Saldo awal master stok klinik	Apoteker / Admin	2026-09-03 05:03:04.348834
7	STK-INIT-PRD-MNN-002	7	IN	40	0	40	20000	45000	RESTOCK	\N	Saldo awal master stok klinik	Apoteker / Admin	2026-09-03 05:03:04.348834
8	STK-INIT-PRD-AKS-001	8	IN	60	0	60	12000	30000	RESTOCK	\N	Saldo awal master stok klinik	Apoteker / Admin	2026-09-03 05:03:04.348834
9	STK-INIT-PRD-OTH-001	9	IN	45	0	45	18000	40000	RESTOCK	\N	Saldo awal master stok klinik	Apoteker / Admin	2026-09-03 05:03:04.348834
10	STK-20260905-8372	10	IN	20	0	20	25000	90000	RESTOCK	\N	Saldo stok awal saat produk baru didaftarkan	Administrator Klinik	2026-09-05 01:15:02.686688
11	STK-20260905-6673	11	IN	20	0	20	25000	50000	RESTOCK	\N	Saldo stok awal saat produk baru didaftarkan	Administrator Klinik	2026-09-05 01:16:01.461868
12	STK-20260905-4364	12	IN	20	0	20	75000	100000	RESTOCK	\N	Saldo stok awal saat produk baru didaftarkan	Administrator Klinik	2026-09-05 01:17:05.869844
13	STK-20260905-1685	13	IN	20	0	20	25000	35000	RESTOCK	\N	Saldo stok awal saat produk baru didaftarkan	Administrator Klinik	2026-09-05 01:17:41.299151
45	STK-20260906-6928	14	IN	20	0	20	100000	250000	RESTOCK	\N	Saldo stok awal saat produk baru didaftarkan	Administrator Klinik	2026-09-06 14:34:54.052608
46	STK-20260906-8305	1	OUT	-1	50	49	25000	0	PROCEDURE_INCLUDED	1	[INCLUDED] Obat Tetes Khitan Spesial (Nano Drops) (1 botol) - Pasien izzam alvaro	Administrator Klinik	2026-09-06 14:41:24.87464
47	STK-20260906-3417	2	OUT	-2	100	98	20000	0	PROCEDURE_INCLUDED	1	[INCLUDED] Celana Sunat Pelindung Tempurung Super (2 pcs) - Pasien izzam alvaro	Administrator Klinik	2026-09-06 14:41:25.079608
48	STK-20260906-1569	4	OUT	-1	80	79	90000	0	PROCEDURE_INCLUDED	1	[INCLUDED] Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik) (1 paket) - Pasien izzam alvaro	Administrator Klinik	2026-09-06 14:41:25.283962
49	STK-20260906-9422	8	OUT	-1	60	59	12000	0	PROCEDURE_INCLUDED	1	[INCLUDED] Sertifikat (1 pcs) - Pasien izzam alvaro	Administrator Klinik	2026-09-06 14:41:25.486963
50	STK-20260906-7783	11	OUT	-1	20	19	25000	0	PROCEDURE_INCLUDED	1	[INCLUDED] GodiieBag Nano Special Edition (1 box) - Pasien izzam alvaro	Administrator Klinik	2026-09-06 14:41:25.69008
51	STK-20260906-4691	5	OUT	-1	40	39	35000	0	PROCEDURE_INCLUDED	1	[INCLUDED] Obat Spray (Antiseptic) (1 tube) - Pasien izzam alvaro	Administrator Klinik	2026-09-06 14:41:25.894316
52	STK-20260907-7806	2	OUT	-2	98	96	20000	0	PROCEDURE_INCLUDED	2	[INCLUDED] Celana Sunat Pelindung Tempurung Super (2 pcs) - Pasien Muhammad Orhan Ghazi El Hanan	Administrator Klinik	2026-09-07 05:38:43.721247
53	STK-20260907-1868	4	OUT	-1	79	78	90000	0	PROCEDURE_INCLUDED	2	[INCLUDED] Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik) (1 paket) - Pasien Muhammad Orhan Ghazi El Hanan	Administrator Klinik	2026-09-07 05:38:43.945853
54	STK-20260907-5632	8	OUT	-1	59	58	12000	0	PROCEDURE_INCLUDED	2	[INCLUDED] Sertifikat (1 pcs) - Pasien Muhammad Orhan Ghazi El Hanan	Administrator Klinik	2026-09-07 05:38:44.154237
55	STK-20260907-5390	11	OUT	-1	19	18	25000	0	PROCEDURE_INCLUDED	2	[INCLUDED] GodiieBag Nano Special Edition (1 box) - Pasien Muhammad Orhan Ghazi El Hanan	Administrator Klinik	2026-09-07 05:38:44.358061
56	STK-20260907-4511	5	OUT	-1	39	38	35000	0	PROCEDURE_INCLUDED	2	[INCLUDED] Obat Spray (Antiseptic) (1 tube) - Pasien Muhammad Orhan Ghazi El Hanan	Administrator Klinik	2026-09-07 05:38:44.562396
57	STK-20260907-9288	1	OUT	-1	49	48	25000	0	PROCEDURE_INCLUDED	2	[INCLUDED] Obat Tetes Khitan Spesial (Nano Drops) (1 botol) - Pasien Muhammad Orhan Ghazi El Hanan	Administrator Klinik	2026-09-07 05:38:44.766871
58	STK-20260907-2101	2	OUT	-2	96	94	20000	0	PROCEDURE_INCLUDED	3	[INCLUDED] Celana Sunat Pelindung Tempurung Super (2 pcs) - Pasien Muhammad Orhan Ghazi El Hanan	Administrator Klinik	2026-09-07 10:03:56.640228
59	STK-20260907-3052	4	OUT	-1	78	77	90000	0	PROCEDURE_INCLUDED	3	[INCLUDED] Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik) (1 paket) - Pasien Muhammad Orhan Ghazi El Hanan	Administrator Klinik	2026-09-07 10:03:56.873686
60	STK-20260907-6881	8	OUT	-1	58	57	12000	0	PROCEDURE_INCLUDED	3	[INCLUDED] Sertifikat (1 pcs) - Pasien Muhammad Orhan Ghazi El Hanan	Administrator Klinik	2026-09-07 10:03:57.106489
61	STK-20260907-2832	11	OUT	-1	18	17	25000	0	PROCEDURE_INCLUDED	3	[INCLUDED] GodiieBag Nano Special Edition (1 box) - Pasien Muhammad Orhan Ghazi El Hanan	Administrator Klinik	2026-09-07 10:03:57.335793
62	STK-20260907-6448	5	OUT	-1	38	37	35000	0	PROCEDURE_INCLUDED	3	[INCLUDED] Obat Spray (Antiseptic) (1 tube) - Pasien Muhammad Orhan Ghazi El Hanan	Administrator Klinik	2026-09-07 10:03:57.564197
63	STK-20260907-2546	1	OUT	-1	48	47	25000	0	PROCEDURE_INCLUDED	3	[INCLUDED] Obat Tetes Khitan Spesial (Nano Drops) (1 botol) - Pasien Muhammad Orhan Ghazi El Hanan	Administrator Klinik	2026-09-07 10:03:57.877225
64	STK-20260910-6031	2	OUT	-2	94	92	20000	0	PROCEDURE_INCLUDED	4	[INCLUDED] Celana Sunat Pelindung Tempurung Super (2 pcs) - Pasien AL GHIFARI DAVIANSYAH	Administrator Klinik	2026-09-10 02:15:27.012892
65	STK-20260910-3449	4	OUT	-1	77	76	90000	0	PROCEDURE_INCLUDED	4	[INCLUDED] Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik) (1 paket) - Pasien AL GHIFARI DAVIANSYAH	Administrator Klinik	2026-09-10 02:15:27.218932
66	STK-20260910-4443	8	OUT	-1	57	56	12000	0	PROCEDURE_INCLUDED	4	[INCLUDED] Sertifikat (1 pcs) - Pasien AL GHIFARI DAVIANSYAH	Administrator Klinik	2026-09-10 02:15:27.421113
67	STK-20260910-9350	11	OUT	-1	17	16	25000	0	PROCEDURE_INCLUDED	4	[INCLUDED] GodiieBag Nano Special Edition (1 box) - Pasien AL GHIFARI DAVIANSYAH	Administrator Klinik	2026-09-10 02:15:27.623786
68	STK-20260910-9834	5	OUT	-1	37	36	35000	0	PROCEDURE_INCLUDED	4	[INCLUDED] Obat Spray (Antiseptic) (1 tube) - Pasien AL GHIFARI DAVIANSYAH	Administrator Klinik	2026-09-10 02:15:27.827336
69	STK-20260910-5787	1	OUT	-1	47	46	25000	0	PROCEDURE_INCLUDED	4	[INCLUDED] Obat Tetes Khitan Spesial (Nano Drops) (1 botol) - Pasien AL GHIFARI DAVIANSYAH	Administrator Klinik	2026-09-10 02:15:28.030514
70	STK-20260910-9504	2	OUT	-1	92	91	20000	0	PROCEDURE_INCLUDED	5	[INCLUDED] Celana Sunat Pelindung Tempurung Super (1 pcs) - Pasien Gilang Shodiq ramadhan	Administrator Klinik	2026-09-10 03:52:50.85385
71	STK-20260910-2178	4	OUT	-1	76	75	90000	0	PROCEDURE_INCLUDED	5	[INCLUDED] Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik) (1 paket) - Pasien Gilang Shodiq ramadhan	Administrator Klinik	2026-09-10 03:52:51.079616
72	STK-20260910-7526	11	OUT	-1	16	15	25000	0	PROCEDURE_INCLUDED	5	[INCLUDED] GodiieBag Nano Special Edition (1 box) - Pasien Gilang Shodiq ramadhan	Administrator Klinik	2026-09-10 03:52:51.302773
73	STK-20260910-9768	6	OUT	-1	50	49	15000	0	PROCEDURE_INCLUDED	5	[INCLUDED] Mobil Diecast Sport Hadiah Anak Berani (1 pcs) - Pasien Gilang Shodiq ramadhan	Administrator Klinik	2026-09-10 03:52:51.526833
74	STK-20260910-1323	8	OUT	-1	56	55	12000	0	PROCEDURE_INCLUDED	5	[INCLUDED] Sertifikat (1 pcs) - Pasien Gilang Shodiq ramadhan	Administrator Klinik	2026-09-10 03:52:51.750571
75	STK-20260910-5448	5	OUT	-1	36	35	35000	0	PROCEDURE_INCLUDED	5	[INCLUDED] Obat Spray (Antiseptic) (1 tube) - Pasien Gilang Shodiq ramadhan	Administrator Klinik	2026-09-10 03:52:51.974894
76	STK-20260910-8394	6	OUT	-49	49	0	15000	35000	ADJUSTMENT	\N	Restock / penerimaan barang baru dari supplier	Administrator Klinik	2026-09-10 03:55:25.519924
\.


--
-- TOC entry 4477 (class 0 OID 17329)
-- Dependencies: 272
-- Data for Name: transaction_items; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.transaction_items (id, booking_id, procedure_id, invoice_id, product_id, product_sku, product_name, category, item_type, quantity, cost_price_snapshot, sell_price_snapshot, discount_amount, total_amount, is_stock_deducted, deducted_at, notes, created_at) FROM stdin;
6	1	1	1	1	PRD-TTS-001	Obat Tetes Khitan Spesial (Nano Drops)	OBAT_TETES	INCLUDED	1	25000	0	0	0	t	2026-09-06 14:41:23.674	Termasuk dalam paket khitan	2026-09-06 14:39:19.204125
1	1	1	1	2	PRD-CLN-001	Celana Sunat Pelindung Tempurung Super	CELANA_SUNAT	INCLUDED	2	20000	0	0	0	t	2026-09-06 14:41:23.674	Termasuk dalam Paket VIP: 2 pcs Celana Sunat Pelindung	2026-09-06 14:39:18.9678
2	1	1	1	4	PRD-OBT-001	Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik)	OBAT	INCLUDED	1	90000	0	0	0	t	2026-09-06 14:41:23.674	Termasuk dalam Paket VIP: 1 paket Obat Oral Standar	2026-09-06 14:39:19.016087
3	1	1	1	8	PRD-AKS-001	Sertifikat	AKSESORIS	INCLUDED	1	12000	0	0	0	t	2026-09-06 14:41:23.674	Termasuk dalam paket khitan	2026-09-06 14:39:19.063169
4	1	1	1	11	PRD-OTH-954	GodiieBag Nano Special Edition	LAINNYA	INCLUDED	1	25000	0	0	0	t	2026-09-06 14:41:23.674	Termasuk dalam paket khitan	2026-09-06 14:39:19.110464
5	1	1	1	5	PRD-OBT-002	Obat Spray (Antiseptic)	LAINNYA	INCLUDED	1	35000	0	0	0	t	2026-09-06 14:41:23.674	Termasuk dalam paket khitan	2026-09-06 14:39:19.15725
7	2	2	2	2	PRD-CLN-001	Celana Sunat Pelindung Tempurung Super	CELANA_SUNAT	INCLUDED	2	20000	0	0	0	t	2026-09-07 05:38:42.38	Termasuk dalam Paket VIP: 2 pcs Celana Sunat Pelindung	2026-09-07 05:38:09.443086
8	2	2	2	4	PRD-OBT-001	Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik)	OBAT	INCLUDED	1	90000	0	0	0	t	2026-09-07 05:38:42.38	Termasuk dalam Paket VIP: 1 paket Obat Oral Standar	2026-09-07 05:38:09.502009
9	2	2	2	8	PRD-AKS-001	Sertifikat	AKSESORIS	INCLUDED	1	12000	0	0	0	t	2026-09-07 05:38:42.38	Termasuk dalam paket khitan	2026-09-07 05:38:09.559584
10	2	2	2	11	PRD-OTH-954	GodiieBag Nano Special Edition	LAINNYA	INCLUDED	1	25000	0	0	0	t	2026-09-07 05:38:42.38	Termasuk dalam paket khitan	2026-09-07 05:38:09.616896
11	2	2	2	5	PRD-OBT-002	Obat Spray (Antiseptic)	LAINNYA	INCLUDED	1	35000	0	0	0	t	2026-09-07 05:38:42.38	Termasuk dalam paket khitan	2026-09-07 05:38:09.67447
12	2	2	2	1	PRD-TTS-001	Obat Tetes Khitan Spesial (Nano Drops)	OBAT_TETES	INCLUDED	1	25000	0	0	0	t	2026-09-07 05:38:42.38	Termasuk dalam paket khitan	2026-09-07 05:38:09.732135
13	3	3	3	2	PRD-CLN-001	Celana Sunat Pelindung Tempurung Super	CELANA_SUNAT	INCLUDED	2	20000	0	0	0	t	2026-09-07 10:03:55.362	Termasuk dalam Paket VIP: 2 pcs Celana Sunat Pelindung	2026-09-07 10:03:03.671329
14	3	3	3	4	PRD-OBT-001	Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik)	OBAT	INCLUDED	1	90000	0	0	0	t	2026-09-07 10:03:55.362	Termasuk dalam Paket VIP: 1 paket Obat Oral Standar	2026-09-07 10:03:03.740837
15	3	3	3	8	PRD-AKS-001	Sertifikat	AKSESORIS	INCLUDED	1	12000	0	0	0	t	2026-09-07 10:03:55.362	Termasuk dalam paket khitan	2026-09-07 10:03:03.793162
16	3	3	3	11	PRD-OTH-954	GodiieBag Nano Special Edition	LAINNYA	INCLUDED	1	25000	0	0	0	t	2026-09-07 10:03:55.362	Termasuk dalam paket khitan	2026-09-07 10:03:03.84484
17	3	3	3	5	PRD-OBT-002	Obat Spray (Antiseptic)	LAINNYA	INCLUDED	1	35000	0	0	0	t	2026-09-07 10:03:55.362	Termasuk dalam paket khitan	2026-09-07 10:03:03.896976
18	3	3	3	1	PRD-TTS-001	Obat Tetes Khitan Spesial (Nano Drops)	OBAT_TETES	INCLUDED	1	25000	0	0	0	t	2026-09-07 10:03:55.362	Termasuk dalam paket khitan	2026-09-07 10:03:03.948904
19	4	4	4	2	PRD-CLN-001	Celana Sunat Pelindung Tempurung Super	CELANA_SUNAT	INCLUDED	2	20000	0	0	0	t	2026-09-10 02:15:25.62	Termasuk dalam Paket VIP: 2 pcs Celana Sunat Pelindung	2026-09-10 02:14:26.72361
20	4	4	4	4	PRD-OBT-001	Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik)	OBAT	INCLUDED	1	90000	0	0	0	t	2026-09-10 02:15:25.62	Termasuk dalam Paket VIP: 1 paket Obat Oral Standar	2026-09-10 02:14:26.776316
21	4	4	4	8	PRD-AKS-001	Sertifikat	AKSESORIS	INCLUDED	1	12000	0	0	0	t	2026-09-10 02:15:25.62	Termasuk dalam paket khitan	2026-09-10 02:14:26.828096
22	4	4	4	11	PRD-OTH-954	GodiieBag Nano Special Edition	LAINNYA	INCLUDED	1	25000	0	0	0	t	2026-09-10 02:15:25.62	Termasuk dalam paket khitan	2026-09-10 02:14:26.879742
23	4	4	4	5	PRD-OBT-002	Obat Spray (Antiseptic)	LAINNYA	INCLUDED	1	35000	0	0	0	t	2026-09-10 02:15:25.62	Termasuk dalam paket khitan	2026-09-10 02:14:26.931862
24	4	4	4	1	PRD-TTS-001	Obat Tetes Khitan Spesial (Nano Drops)	OBAT_TETES	INCLUDED	1	25000	0	0	0	t	2026-09-10 02:15:25.62	Termasuk dalam paket khitan	2026-09-10 02:14:26.983302
25	5	5	5	2	PRD-CLN-001	Celana Sunat Pelindung Tempurung Super	CELANA_SUNAT	INCLUDED	1	20000	0	0	0	t	2026-09-10 03:52:49.527	Termasuk dalam Paket Reguler: 1 pcs Celana Sunat	2026-09-10 03:52:18.183579
26	5	5	5	4	PRD-OBT-001	Paket Obat Syrup (Analgetik, Antiinflamasi & Antibiotik)	OBAT	INCLUDED	1	90000	0	0	0	t	2026-09-10 03:52:49.527	Termasuk dalam Paket Reguler: 1 paket Obat Oral Standar	2026-09-10 03:52:18.241594
27	5	5	5	11	PRD-OTH-954	GodiieBag Nano Special Edition	LAINNYA	INCLUDED	1	25000	0	0	0	t	2026-09-10 03:52:49.527	Termasuk dalam paket khitan	2026-09-10 03:52:18.29905
28	5	5	5	6	PRD-MNN-001	Mobil Diecast Sport Hadiah Anak Berani	MAINAN	INCLUDED	1	15000	0	0	0	t	2026-09-10 03:52:49.527	Termasuk dalam paket khitan	2026-09-10 03:52:18.355848
29	5	5	5	8	PRD-AKS-001	Sertifikat	AKSESORIS	INCLUDED	1	12000	0	0	0	t	2026-09-10 03:52:49.527	Termasuk dalam paket khitan	2026-09-10 03:52:18.412251
30	5	5	5	5	PRD-OBT-002	Obat Spray (Antiseptic)	LAINNYA	INCLUDED	1	35000	0	0	0	t	2026-09-10 03:52:49.527	Termasuk dalam paket khitan	2026-09-10 03:52:18.468953
\.


--
-- TOC entry 4469 (class 0 OID 17032)
-- Dependencies: 264
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: ai_studio_admin
--

COPY public.users (id, uid, email, full_name, role, phone, is_active, created_at, password_hash, permissions, last_login) FROM stdin;
1	user-owner	owner@nanocircumcision.com	H. Rian Gunawan, S.E. (Owner / Super Admin)	owner	0811-2233-4455	t	2026-09-04 01:30:56.79886	43a0d17178a9d26c9e0fe9a74b0b45e38d32f27aed887a008a54bf6e033bf7b9	["dashboard.view","patients.view","patients.create","patients.edit","patients.delete","bookings.view","bookings.create","bookings.edit","bookings.cancel","procedures.view","procedures.edit","procedures.complete","products.view","products.create","products.edit","products.adjust_stock","cashier.view","cashier.payment","cashier.void","doctor_fees.view","doctor_fees.manage","employees.view","employees.manage","payroll.view","payroll.manage","expenses.view","expenses.manage","reports.view","reports.export","master.view","master.manage","users.view","users.manage","audit.view","settings.manage"]	\N
3	user-staff	staff@nanocircumcision.com	Dina Safitri (Front Office & Kasir)	staff	0813-9876-5432	t	2026-09-04 01:30:56.79886	10176e7b7b24d317acfcf8d2064cfd2f24e154f7b5a96603077d5ef813d6a6b6	["dashboard.view","patients.view","patients.create","bookings.view","bookings.create","bookings.edit","cashier.view","cashier.payment","products.view","followups.view","followups.edit"]	\N
4	user-doctor	dokter@nanocircumcision.com	dr. Bambang Irawan, Sp.B (Dokter Operator Khitan)	doctor	0812-7777-8888	t	2026-09-04 01:30:56.79886	b3959dee9b178b030c2b8373da55a04ab3adb318edeb178953ff8b77301a360a	["dashboard.view","patients.view","procedures.view","procedures.edit","procedures.complete","doctor_fees.view"]	2026-09-05 14:05:13.25
2	user-admin	admin@nanocircumcision.com	Siti Rahmawati, S.Kep (Admin Operasional)	admin	0812-3456-7890	t	2026-09-04 01:30:56.79886	240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9	["dashboard.view","patients.view","patients.create","patients.edit","bookings.view","bookings.create","bookings.edit","bookings.cancel","procedures.view","procedures.edit","procedures.complete","products.view","products.create","products.edit","products.adjust_stock","cashier.view","cashier.payment","doctor_fees.view","employees.view","payroll.view","expenses.view","expenses.manage","reports.view","master.view","settings.manage"]	2026-09-08 05:34:44.067
5	user-mtqjfimf	dika@gmail.com	Novian Tri Andhika	admin		t	2026-09-07 01:04:15.319804	dfa2ff914d8a9586450aa638ba5999b14a0aa95d625207ac1c31678b5e5ac623	[]	2026-09-10 07:52:38.184
\.


--
-- TOC entry 4526 (class 0 OID 0)
-- Dependencies: 219
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 233, true);


--
-- TOC entry 4527 (class 0 OID 0)
-- Dependencies: 221
-- Name: booking_status_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.booking_status_history_id_seq', 15, true);


--
-- TOC entry 4528 (class 0 OID 0)
-- Dependencies: 223
-- Name: bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.bookings_id_seq', 5, true);


--
-- TOC entry 4529 (class 0 OID 0)
-- Dependencies: 225
-- Name: certificates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.certificates_id_seq', 5, true);


--
-- TOC entry 4530 (class 0 OID 0)
-- Dependencies: 281
-- Name: circumcision_methods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.circumcision_methods_id_seq', 4, true);


--
-- TOC entry 4531 (class 0 OID 0)
-- Dependencies: 227
-- Name: circumcision_packages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.circumcision_packages_id_seq', 4, true);


--
-- TOC entry 4532 (class 0 OID 0)
-- Dependencies: 229
-- Name: circumcision_procedures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.circumcision_procedures_id_seq', 5, true);


--
-- TOC entry 4533 (class 0 OID 0)
-- Dependencies: 231
-- Name: clinic_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.clinic_settings_id_seq', 1, false);


--
-- TOC entry 4534 (class 0 OID 0)
-- Dependencies: 233
-- Name: doctor_fee_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.doctor_fee_rules_id_seq', 27, true);


--
-- TOC entry 4535 (class 0 OID 0)
-- Dependencies: 235
-- Name: doctor_fee_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.doctor_fee_transactions_id_seq', 5, true);


--
-- TOC entry 4536 (class 0 OID 0)
-- Dependencies: 237
-- Name: doctor_schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.doctor_schedules_id_seq', 21, true);


--
-- TOC entry 4537 (class 0 OID 0)
-- Dependencies: 239
-- Name: doctors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.doctors_id_seq', 3, true);


--
-- TOC entry 4538 (class 0 OID 0)
-- Dependencies: 273
-- Name: employee_fee_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.employee_fee_rules_id_seq', 1, false);


--
-- TOC entry 4539 (class 0 OID 0)
-- Dependencies: 275
-- Name: employee_fee_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.employee_fee_transactions_id_seq', 6, true);


--
-- TOC entry 4540 (class 0 OID 0)
-- Dependencies: 277
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.employees_id_seq', 5, true);


--
-- TOC entry 4541 (class 0 OID 0)
-- Dependencies: 241
-- Name: expense_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.expense_categories_id_seq', 12, true);


--
-- TOC entry 4542 (class 0 OID 0)
-- Dependencies: 243
-- Name: expense_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.expense_transactions_id_seq', 4, true);


--
-- TOC entry 4543 (class 0 OID 0)
-- Dependencies: 245
-- Name: follow_ups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.follow_ups_id_seq', 16, true);


--
-- TOC entry 4544 (class 0 OID 0)
-- Dependencies: 247
-- Name: guardians_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.guardians_id_seq', 5, true);


--
-- TOC entry 4545 (class 0 OID 0)
-- Dependencies: 249
-- Name: informed_consents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.informed_consents_id_seq', 1, false);


--
-- TOC entry 4546 (class 0 OID 0)
-- Dependencies: 251
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.invoices_id_seq', 5, true);


--
-- TOC entry 4547 (class 0 OID 0)
-- Dependencies: 265
-- Name: package_included_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.package_included_items_id_seq', 32, true);


--
-- TOC entry 4548 (class 0 OID 0)
-- Dependencies: 253
-- Name: package_prices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.package_prices_id_seq', 18, true);


--
-- TOC entry 4549 (class 0 OID 0)
-- Dependencies: 255
-- Name: patient_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.patient_categories_id_seq', 2, true);


--
-- TOC entry 4550 (class 0 OID 0)
-- Dependencies: 257
-- Name: patients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.patients_id_seq', 5, true);


--
-- TOC entry 4551 (class 0 OID 0)
-- Dependencies: 259
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.payments_id_seq', 5, true);


--
-- TOC entry 4552 (class 0 OID 0)
-- Dependencies: 279
-- Name: payrolls_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.payrolls_id_seq', 12, true);


--
-- TOC entry 4553 (class 0 OID 0)
-- Dependencies: 267
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.products_id_seq', 14, true);


--
-- TOC entry 4554 (class 0 OID 0)
-- Dependencies: 261
-- Name: queues_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.queues_id_seq', 5, true);


--
-- TOC entry 4555 (class 0 OID 0)
-- Dependencies: 269
-- Name: stock_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.stock_movements_id_seq', 76, true);


--
-- TOC entry 4556 (class 0 OID 0)
-- Dependencies: 271
-- Name: transaction_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.transaction_items_id_seq', 30, true);


--
-- TOC entry 4557 (class 0 OID 0)
-- Dependencies: 263
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ai_studio_admin
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- TOC entry 4119 (class 2606 OID 16593)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4121 (class 2606 OID 16608)
-- Name: booking_status_history booking_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.booking_status_history
    ADD CONSTRAINT booking_status_history_pkey PRIMARY KEY (id);


--
-- TOC entry 4123 (class 2606 OID 16641)
-- Name: bookings bookings_booking_number_unique; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_booking_number_unique UNIQUE (booking_number);


--
-- TOC entry 4125 (class 2606 OID 16639)
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- TOC entry 4127 (class 2606 OID 16661)
-- Name: certificates certificates_certificate_number_unique; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_certificate_number_unique UNIQUE (certificate_number);


--
-- TOC entry 4129 (class 2606 OID 16659)
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- TOC entry 4219 (class 2606 OID 17615)
-- Name: circumcision_methods circumcision_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.circumcision_methods
    ADD CONSTRAINT circumcision_methods_pkey PRIMARY KEY (id);


--
-- TOC entry 4131 (class 2606 OID 16680)
-- Name: circumcision_packages circumcision_packages_code_unique; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.circumcision_packages
    ADD CONSTRAINT circumcision_packages_code_unique UNIQUE (code);


--
-- TOC entry 4133 (class 2606 OID 16678)
-- Name: circumcision_packages circumcision_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.circumcision_packages
    ADD CONSTRAINT circumcision_packages_pkey PRIMARY KEY (id);


--
-- TOC entry 4135 (class 2606 OID 16701)
-- Name: circumcision_procedures circumcision_procedures_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.circumcision_procedures
    ADD CONSTRAINT circumcision_procedures_pkey PRIMARY KEY (id);


--
-- TOC entry 4137 (class 2606 OID 16703)
-- Name: circumcision_procedures circumcision_procedures_procedure_number_unique; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.circumcision_procedures
    ADD CONSTRAINT circumcision_procedures_procedure_number_unique UNIQUE (procedure_number);


--
-- TOC entry 4139 (class 2606 OID 16725)
-- Name: clinic_settings clinic_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.clinic_settings
    ADD CONSTRAINT clinic_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 4141 (class 2606 OID 16742)
-- Name: doctor_fee_rules doctor_fee_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.doctor_fee_rules
    ADD CONSTRAINT doctor_fee_rules_pkey PRIMARY KEY (id);


--
-- TOC entry 4143 (class 2606 OID 16767)
-- Name: doctor_fee_transactions doctor_fee_transactions_fee_number_unique; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.doctor_fee_transactions
    ADD CONSTRAINT doctor_fee_transactions_fee_number_unique UNIQUE (fee_number);


--
-- TOC entry 4145 (class 2606 OID 16765)
-- Name: doctor_fee_transactions doctor_fee_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.doctor_fee_transactions
    ADD CONSTRAINT doctor_fee_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 4147 (class 2606 OID 16785)
-- Name: doctor_schedules doctor_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_pkey PRIMARY KEY (id);


--
-- TOC entry 4149 (class 2606 OID 16806)
-- Name: doctors doctors_code_unique; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_code_unique UNIQUE (code);


--
-- TOC entry 4151 (class 2606 OID 16804)
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);


--
-- TOC entry 4205 (class 2606 OID 17420)
-- Name: employee_fee_rules employee_fee_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.employee_fee_rules
    ADD CONSTRAINT employee_fee_rules_pkey PRIMARY KEY (id);


--
-- TOC entry 4207 (class 2606 OID 17445)
-- Name: employee_fee_transactions employee_fee_transactions_fee_number_unique; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.employee_fee_transactions
    ADD CONSTRAINT employee_fee_transactions_fee_number_unique UNIQUE (fee_number);


--
-- TOC entry 4209 (class 2606 OID 17443)
-- Name: employee_fee_transactions employee_fee_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.employee_fee_transactions
    ADD CONSTRAINT employee_fee_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 4211 (class 2606 OID 17469)
-- Name: employees employees_employee_code_unique; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_code_unique UNIQUE (employee_code);


--
-- TOC entry 4213 (class 2606 OID 17467)
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- TOC entry 4153 (class 2606 OID 16821)
-- Name: expense_categories expense_categories_name_unique; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_name_unique UNIQUE (name);


--
-- TOC entry 4155 (class 2606 OID 16819)
-- Name: expense_categories expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4157 (class 2606 OID 16843)
-- Name: expense_transactions expense_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.expense_transactions
    ADD CONSTRAINT expense_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 4159 (class 2606 OID 16845)
-- Name: expense_transactions expense_transactions_transaction_number_unique; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.expense_transactions
    ADD CONSTRAINT expense_transactions_transaction_number_unique UNIQUE (transaction_number);


--
-- TOC entry 4161 (class 2606 OID 16863)
-- Name: follow_ups follow_ups_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT follow_ups_pkey PRIMARY KEY (id);


--
-- TOC entry 4163 (class 2606 OID 16878)
-- Name: guardians guardians_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.guardians
    ADD CONSTRAINT guardians_pkey PRIMARY KEY (id);


--
-- TOC entry 4165 (class 2606 OID 16901)
-- Name: informed_consents informed_consents_consent_number_unique; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.informed_consents
    ADD CONSTRAINT informed_consents_consent_number_unique UNIQUE (consent_number);


--
-- TOC entry 4167 (class 2606 OID 16899)
-- Name: informed_consents informed_consents_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.informed_consents
    ADD CONSTRAINT informed_consents_pkey PRIMARY KEY (id);


--
-- TOC entry 4169 (class 2606 OID 16929)
-- Name: invoices invoices_invoice_number_unique; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number);


--
-- TOC entry 4171 (class 2606 OID 16927)
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- TOC entry 4193 (class 2606 OID 17273)
-- Name: package_included_items package_included_items_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.package_included_items
    ADD CONSTRAINT package_included_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4173 (class 2606 OID 16945)
-- Name: package_prices package_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.package_prices
    ADD CONSTRAINT package_prices_pkey PRIMARY KEY (id);


--
-- TOC entry 4175 (class 2606 OID 16963)
-- Name: patient_categories patient_categories_code_unique; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.patient_categories
    ADD CONSTRAINT patient_categories_code_unique UNIQUE (code);


--
-- TOC entry 4177 (class 2606 OID 16961)
-- Name: patient_categories patient_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.patient_categories
    ADD CONSTRAINT patient_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4179 (class 2606 OID 16986)
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- TOC entry 4181 (class 2606 OID 16988)
-- Name: patients patients_rm_number_unique; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_rm_number_unique UNIQUE (rm_number);


--
-- TOC entry 4183 (class 2606 OID 17011)
-- Name: payments payments_payment_number_unique; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payment_number_unique UNIQUE (payment_number);


--
-- TOC entry 4185 (class 2606 OID 17009)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 4215 (class 2606 OID 17507)
-- Name: payrolls payrolls_payroll_number_unique; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT payrolls_payroll_number_unique UNIQUE (payroll_number);


--
-- TOC entry 4217 (class 2606 OID 17505)
-- Name: payrolls payrolls_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT payrolls_pkey PRIMARY KEY (id);


--
-- TOC entry 4195 (class 2606 OID 17299)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 4197 (class 2606 OID 17301)
-- Name: products products_sku_unique; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_unique UNIQUE (sku);


--
-- TOC entry 4187 (class 2606 OID 17030)
-- Name: queues queues_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_pkey PRIMARY KEY (id);


--
-- TOC entry 4199 (class 2606 OID 17327)
-- Name: stock_movements stock_movements_movement_number_unique; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_movement_number_unique UNIQUE (movement_number);


--
-- TOC entry 4201 (class 2606 OID 17325)
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- TOC entry 4203 (class 2606 OID 17357)
-- Name: transaction_items transaction_items_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4189 (class 2606 OID 17048)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4191 (class 2606 OID 17050)
-- Name: users users_uid_unique; Type: CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_uid_unique UNIQUE (uid);


--
-- TOC entry 4220 (class 2606 OID 17051)
-- Name: booking_status_history booking_status_history_booking_id_bookings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.booking_status_history
    ADD CONSTRAINT booking_status_history_booking_id_bookings_id_fk FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- TOC entry 4221 (class 2606 OID 17076)
-- Name: bookings bookings_doctor_id_doctors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_doctor_id_doctors_id_fk FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- TOC entry 4222 (class 2606 OID 17061)
-- Name: bookings bookings_guardian_id_guardians_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_guardian_id_guardians_id_fk FOREIGN KEY (guardian_id) REFERENCES public.guardians(id);


--
-- TOC entry 4223 (class 2606 OID 17071)
-- Name: bookings bookings_package_id_circumcision_packages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_package_id_circumcision_packages_id_fk FOREIGN KEY (package_id) REFERENCES public.circumcision_packages(id);


--
-- TOC entry 4224 (class 2606 OID 17066)
-- Name: bookings bookings_patient_category_id_patient_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_patient_category_id_patient_categories_id_fk FOREIGN KEY (patient_category_id) REFERENCES public.patient_categories(id);


--
-- TOC entry 4225 (class 2606 OID 17056)
-- Name: bookings bookings_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- TOC entry 4226 (class 2606 OID 17091)
-- Name: certificates certificates_doctor_id_doctors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_doctor_id_doctors_id_fk FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- TOC entry 4227 (class 2606 OID 17086)
-- Name: certificates certificates_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- TOC entry 4228 (class 2606 OID 17081)
-- Name: certificates certificates_procedure_id_circumcision_procedures_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_procedure_id_circumcision_procedures_id_fk FOREIGN KEY (procedure_id) REFERENCES public.circumcision_procedures(id);


--
-- TOC entry 4229 (class 2606 OID 17096)
-- Name: circumcision_procedures circumcision_procedures_booking_id_bookings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.circumcision_procedures
    ADD CONSTRAINT circumcision_procedures_booking_id_bookings_id_fk FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- TOC entry 4230 (class 2606 OID 17106)
-- Name: circumcision_procedures circumcision_procedures_doctor_id_doctors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.circumcision_procedures
    ADD CONSTRAINT circumcision_procedures_doctor_id_doctors_id_fk FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- TOC entry 4231 (class 2606 OID 17101)
-- Name: circumcision_procedures circumcision_procedures_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.circumcision_procedures
    ADD CONSTRAINT circumcision_procedures_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- TOC entry 4232 (class 2606 OID 17111)
-- Name: doctor_fee_rules doctor_fee_rules_doctor_id_doctors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.doctor_fee_rules
    ADD CONSTRAINT doctor_fee_rules_doctor_id_doctors_id_fk FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- TOC entry 4233 (class 2606 OID 17116)
-- Name: doctor_fee_rules doctor_fee_rules_package_id_circumcision_packages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.doctor_fee_rules
    ADD CONSTRAINT doctor_fee_rules_package_id_circumcision_packages_id_fk FOREIGN KEY (package_id) REFERENCES public.circumcision_packages(id);


--
-- TOC entry 4234 (class 2606 OID 17121)
-- Name: doctor_fee_rules doctor_fee_rules_patient_category_id_patient_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.doctor_fee_rules
    ADD CONSTRAINT doctor_fee_rules_patient_category_id_patient_categories_id_fk FOREIGN KEY (patient_category_id) REFERENCES public.patient_categories(id);


--
-- TOC entry 4235 (class 2606 OID 17136)
-- Name: doctor_fee_transactions doctor_fee_transactions_booking_id_bookings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.doctor_fee_transactions
    ADD CONSTRAINT doctor_fee_transactions_booking_id_bookings_id_fk FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- TOC entry 4236 (class 2606 OID 17126)
-- Name: doctor_fee_transactions doctor_fee_transactions_doctor_id_doctors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.doctor_fee_transactions
    ADD CONSTRAINT doctor_fee_transactions_doctor_id_doctors_id_fk FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- TOC entry 4237 (class 2606 OID 17146)
-- Name: doctor_fee_transactions doctor_fee_transactions_invoice_id_invoices_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.doctor_fee_transactions
    ADD CONSTRAINT doctor_fee_transactions_invoice_id_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- TOC entry 4238 (class 2606 OID 17151)
-- Name: doctor_fee_transactions doctor_fee_transactions_package_id_circumcision_packages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.doctor_fee_transactions
    ADD CONSTRAINT doctor_fee_transactions_package_id_circumcision_packages_id_fk FOREIGN KEY (package_id) REFERENCES public.circumcision_packages(id);


--
-- TOC entry 4239 (class 2606 OID 17665)
-- Name: doctor_fee_transactions doctor_fee_transactions_patient_category_id_patient_categories_; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.doctor_fee_transactions
    ADD CONSTRAINT doctor_fee_transactions_patient_category_id_patient_categories_ FOREIGN KEY (patient_category_id) REFERENCES public.patient_categories(id);


--
-- TOC entry 4240 (class 2606 OID 17131)
-- Name: doctor_fee_transactions doctor_fee_transactions_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.doctor_fee_transactions
    ADD CONSTRAINT doctor_fee_transactions_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- TOC entry 4241 (class 2606 OID 17660)
-- Name: doctor_fee_transactions doctor_fee_transactions_procedure_id_circumcision_procedures_id; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.doctor_fee_transactions
    ADD CONSTRAINT doctor_fee_transactions_procedure_id_circumcision_procedures_id FOREIGN KEY (procedure_id) REFERENCES public.circumcision_procedures(id);


--
-- TOC entry 4242 (class 2606 OID 17161)
-- Name: doctor_schedules doctor_schedules_doctor_id_doctors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_doctor_id_doctors_id_fk FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- TOC entry 4269 (class 2606 OID 17510)
-- Name: employee_fee_rules employee_fee_rules_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.employee_fee_rules
    ADD CONSTRAINT employee_fee_rules_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- TOC entry 4270 (class 2606 OID 17515)
-- Name: employee_fee_rules employee_fee_rules_package_id_circumcision_packages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.employee_fee_rules
    ADD CONSTRAINT employee_fee_rules_package_id_circumcision_packages_id_fk FOREIGN KEY (package_id) REFERENCES public.circumcision_packages(id);


--
-- TOC entry 4271 (class 2606 OID 17520)
-- Name: employee_fee_rules employee_fee_rules_patient_category_id_patient_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.employee_fee_rules
    ADD CONSTRAINT employee_fee_rules_patient_category_id_patient_categories_id_fk FOREIGN KEY (patient_category_id) REFERENCES public.patient_categories(id);


--
-- TOC entry 4272 (class 2606 OID 17535)
-- Name: employee_fee_transactions employee_fee_transactions_booking_id_bookings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.employee_fee_transactions
    ADD CONSTRAINT employee_fee_transactions_booking_id_bookings_id_fk FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- TOC entry 4273 (class 2606 OID 17525)
-- Name: employee_fee_transactions employee_fee_transactions_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.employee_fee_transactions
    ADD CONSTRAINT employee_fee_transactions_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- TOC entry 4274 (class 2606 OID 17530)
-- Name: employee_fee_transactions employee_fee_transactions_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.employee_fee_transactions
    ADD CONSTRAINT employee_fee_transactions_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- TOC entry 4275 (class 2606 OID 17675)
-- Name: employee_fee_transactions employee_fee_transactions_procedure_id_circumcision_procedures_; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.employee_fee_transactions
    ADD CONSTRAINT employee_fee_transactions_procedure_id_circumcision_procedures_ FOREIGN KEY (procedure_id) REFERENCES public.circumcision_procedures(id);


--
-- TOC entry 4243 (class 2606 OID 17166)
-- Name: expense_transactions expense_transactions_category_id_expense_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.expense_transactions
    ADD CONSTRAINT expense_transactions_category_id_expense_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.expense_categories(id);


--
-- TOC entry 4244 (class 2606 OID 17171)
-- Name: follow_ups follow_ups_booking_id_bookings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT follow_ups_booking_id_bookings_id_fk FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- TOC entry 4245 (class 2606 OID 17181)
-- Name: follow_ups follow_ups_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT follow_ups_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- TOC entry 4246 (class 2606 OID 17176)
-- Name: follow_ups follow_ups_procedure_id_circumcision_procedures_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT follow_ups_procedure_id_circumcision_procedures_id_fk FOREIGN KEY (procedure_id) REFERENCES public.circumcision_procedures(id);


--
-- TOC entry 4247 (class 2606 OID 17201)
-- Name: informed_consents informed_consents_doctor_id_doctors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.informed_consents
    ADD CONSTRAINT informed_consents_doctor_id_doctors_id_fk FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- TOC entry 4248 (class 2606 OID 17196)
-- Name: informed_consents informed_consents_guardian_id_guardians_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.informed_consents
    ADD CONSTRAINT informed_consents_guardian_id_guardians_id_fk FOREIGN KEY (guardian_id) REFERENCES public.guardians(id);


--
-- TOC entry 4249 (class 2606 OID 17191)
-- Name: informed_consents informed_consents_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.informed_consents
    ADD CONSTRAINT informed_consents_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- TOC entry 4250 (class 2606 OID 17186)
-- Name: informed_consents informed_consents_procedure_id_circumcision_procedures_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.informed_consents
    ADD CONSTRAINT informed_consents_procedure_id_circumcision_procedures_id_fk FOREIGN KEY (procedure_id) REFERENCES public.circumcision_procedures(id);


--
-- TOC entry 4251 (class 2606 OID 17206)
-- Name: invoices invoices_booking_id_bookings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_booking_id_bookings_id_fk FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- TOC entry 4252 (class 2606 OID 17216)
-- Name: invoices invoices_doctor_id_doctors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_doctor_id_doctors_id_fk FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- TOC entry 4253 (class 2606 OID 17211)
-- Name: invoices invoices_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- TOC entry 4261 (class 2606 OID 17358)
-- Name: package_included_items package_included_items_package_id_circumcision_packages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.package_included_items
    ADD CONSTRAINT package_included_items_package_id_circumcision_packages_id_fk FOREIGN KEY (package_id) REFERENCES public.circumcision_packages(id);


--
-- TOC entry 4262 (class 2606 OID 17670)
-- Name: package_included_items package_included_items_patient_category_id_patient_categories_i; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.package_included_items
    ADD CONSTRAINT package_included_items_patient_category_id_patient_categories_i FOREIGN KEY (patient_category_id) REFERENCES public.patient_categories(id);


--
-- TOC entry 4263 (class 2606 OID 17368)
-- Name: package_included_items package_included_items_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.package_included_items
    ADD CONSTRAINT package_included_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 4254 (class 2606 OID 17221)
-- Name: package_prices package_prices_package_id_circumcision_packages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.package_prices
    ADD CONSTRAINT package_prices_package_id_circumcision_packages_id_fk FOREIGN KEY (package_id) REFERENCES public.circumcision_packages(id);


--
-- TOC entry 4255 (class 2606 OID 17226)
-- Name: package_prices package_prices_patient_category_id_patient_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.package_prices
    ADD CONSTRAINT package_prices_patient_category_id_patient_categories_id_fk FOREIGN KEY (patient_category_id) REFERENCES public.patient_categories(id);


--
-- TOC entry 4256 (class 2606 OID 17231)
-- Name: patients patients_guardian_id_guardians_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_guardian_id_guardians_id_fk FOREIGN KEY (guardian_id) REFERENCES public.guardians(id);


--
-- TOC entry 4257 (class 2606 OID 17236)
-- Name: payments payments_invoice_id_invoices_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- TOC entry 4276 (class 2606 OID 17545)
-- Name: payrolls payrolls_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT payrolls_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- TOC entry 4258 (class 2606 OID 17241)
-- Name: queues queues_booking_id_bookings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_booking_id_bookings_id_fk FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- TOC entry 4259 (class 2606 OID 17251)
-- Name: queues queues_doctor_id_doctors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_doctor_id_doctors_id_fk FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- TOC entry 4260 (class 2606 OID 17246)
-- Name: queues queues_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- TOC entry 4264 (class 2606 OID 17373)
-- Name: stock_movements stock_movements_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 4265 (class 2606 OID 17378)
-- Name: transaction_items transaction_items_booking_id_bookings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_booking_id_bookings_id_fk FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- TOC entry 4266 (class 2606 OID 17388)
-- Name: transaction_items transaction_items_invoice_id_invoices_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_invoice_id_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- TOC entry 4267 (class 2606 OID 17383)
-- Name: transaction_items transaction_items_procedure_id_circumcision_procedures_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_procedure_id_circumcision_procedures_id_fk FOREIGN KEY (procedure_id) REFERENCES public.circumcision_procedures(id);


--
-- TOC entry 4268 (class 2606 OID 17393)
-- Name: transaction_items transaction_items_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: ai_studio_admin
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 4493 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO cloudsqlsuperuser;


-- Completed on 2026-09-10 07:55:54 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict HC3dXMZekUTy7AU4lxZfzS32WNc4tpyx9kWti4Y5ro6hxa5AfHge0fRVjoLF0bJ

