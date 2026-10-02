import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'fleet_operations.db')

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Company Profile Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS company_profile (
        id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        dba_name TEXT,
        dot_number TEXT NOT NULL,
        mc_number TEXT NOT NULL,
        tax_id TEXT,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        zip TEXT NOT NULL,
        factoring_company_name TEXT,
        factoring_remit_address TEXT,
        factoring_bank_name TEXT,
        factoring_routing_number TEXT,
        factoring_account_number TEXT,
        default_payment_terms TEXT,
        updated_at TEXT
    )
    ''')

    # 2. Projects / Loads Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        load_number TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_code TEXT,
        origin_city TEXT NOT NULL,
        origin_state TEXT NOT NULL,
        dest_city TEXT NOT NULL,
        dest_state TEXT NOT NULL,
        equipment_type TEXT NOT NULL,
        commodities TEXT,
        weight_lbs INTEGER,
        estimated_revenue REAL,
        linehaul_pay REAL,
        fuel_surcharge REAL,
        driver_id TEXT,
        driver_name TEXT,
        truck_unit TEXT,
        trailer_unit TEXT,
        status TEXT NOT NULL,
        documents_count INTEGER DEFAULT 0,
        associated_invoice_id TEXT,
        telemetry_json TEXT,
        trip_stops_json TEXT,
        created_at TEXT
    )
    ''')

    # 3. Invoices Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT NOT NULL UNIQUE,
        project_id TEXT,
        load_number TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        billing_address TEXT,
        payment_terms TEXT NOT NULL,
        issue_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        subtotal REAL NOT NULL,
        tax_amount REAL DEFAULT 0,
        total_amount REAL NOT NULL,
        amount_paid REAL DEFAULT 0,
        balance_due REAL NOT NULL,
        status TEXT NOT NULL,
        line_items_json TEXT,
        factoring_status TEXT,
        created_at TEXT
    )
    ''')

    # 4. Scanned Documents Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS scanned_documents (
        id TEXT PRIMARY KEY,
        file_name TEXT NOT NULL,
        type TEXT NOT NULL,
        ocr_confidence INTEGER,
        status TEXT NOT NULL,
        matched_project_id TEXT,
        matched_customer TEXT,
        extracted_data_json TEXT,
        file_size TEXT,
        uploaded_at TEXT
    )
    ''')

    # 5. Billing Emails Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS billing_emails (
        id TEXT PRIMARY KEY,
        invoice_id TEXT NOT NULL,
        invoice_number TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        recipient_name TEXT NOT NULL,
        cc_emails_json TEXT,
        subject TEXT NOT NULL,
        body_text TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT,
        sent_at TEXT
    )
    ''')

    # 6. Payment Remittances Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS payment_remittances (
        id TEXT PRIMARY KEY,
        document_number TEXT NOT NULL,
        payer_name TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        check_or_reference TEXT NOT NULL,
        payment_date TEXT NOT NULL,
        total_payment_amount REAL NOT NULL,
        unallocated_amount REAL NOT NULL,
        status TEXT NOT NULL,
        matched_invoices_json TEXT,
        created_at TEXT
    )
    ''')

    # Seed Default Company Profile if Empty
    cursor.execute('SELECT COUNT(*) FROM company_profile')
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
        INSERT INTO company_profile (
            id, company_name, dba_name, dot_number, mc_number, tax_id, email, phone, address, city, state, zip,
            factoring_company_name, factoring_remit_address, factoring_bank_name, factoring_routing_number,
            factoring_account_number, default_payment_terms, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            'cp-primary',
            'GREEN EXPRESS LLC',
            'Green Express Dedicated Fleet',
            '3252472',
            'TXDMV-009021927C',
            '83-4920192',
            'dispatch@greenexpressllc.com',
            '(817) 555-0192',
            '1040 S Crowley Rd',
            'Crowley',
            'TX',
            '76036',
            'Apex Capital Corp (Notice of Assignment)',
            'P.O. Box 934812, Dallas, TX 75393',
            'JPMorgan Chase Bank, N.A.',
            '111000614',
            '883920194812',
            'Net 30 Days',
            datetime.now().isoformat()
        ))

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("SQLite Fleet Database Initialized Successfully!")
