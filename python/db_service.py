import sys
import json
import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'fleet_operations.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_company_profile():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM company_profile LIMIT 1')
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return {}

def update_company_profile(data):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    UPDATE company_profile SET
        company_name = ?, dba_name = ?, dot_number = ?, mc_number = ?, tax_id = ?,
        email = ?, phone = ?, address = ?, city = ?, state = ?, zip = ?,
        factoring_company_name = ?, factoring_remit_address = ?, factoring_bank_name = ?,
        factoring_routing_number = ?, factoring_account_number = ?, default_payment_terms = ?,
        updated_at = ?
    WHERE id = 'cp-primary'
    ''', (
        data.get('companyName', 'GREEN EXPRESS LLC'),
        data.get('dbaName', ''),
        data.get('dotNumber', '3252472'),
        data.get('mcNumber', 'TXDMV-009021927C'),
        data.get('taxId', ''),
        data.get('email', 'dispatch@greenexpressllc.com'),
        data.get('phone', '(817) 555-0192'),
        data.get('address', '1040 S Crowley Rd'),
        data.get('city', 'Crowley'),
        data.get('state', 'TX'),
        data.get('zip', '76036'),
        data.get('factoringCompanyName', 'Apex Capital Corp'),
        data.get('factoringRemitAddress', 'P.O. Box 934812, Dallas, TX 75393'),
        data.get('factoringBankName', 'JPMorgan Chase Bank, N.A.'),
        data.get('factoringRoutingNumber', '111000614'),
        data.get('factoringAccountNumber', '883920194812'),
        data.get('defaultPaymentTerms', 'Net 30 Days'),
        datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Company profile saved to Python SQLite database!"}

def get_invoices():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM invoices ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()
    results = []
    for row in rows:
        item = dict(row)
        if item.get('line_items_json'):
            try:
                item['lineItems'] = json.loads(item['line_items_json'])
            except Exception:
                item['lineItems'] = []
        results.append(item)
    return results

def create_invoice(data):
    conn = get_db()
    cursor = conn.cursor()
    inv_id = data.get('id', f"inv-{int(datetime.now().timestamp())}")
    cursor.execute('''
    INSERT OR REPLACE INTO invoices (
        id, invoice_number, project_id, load_number, customer_name, customer_email,
        billing_address, payment_terms, issue_date, due_date, subtotal, tax_amount,
        total_amount, amount_paid, balance_due, status, line_items_json, factoring_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        inv_id,
        data.get('invoiceNumber'),
        data.get('projectId', 'proj-1'),
        data.get('loadNumber'),
        data.get('customerName'),
        data.get('customerEmail'),
        data.get('billingAddress', ''),
        data.get('paymentTerms', 'Net 30 Days'),
        data.get('issueDate', datetime.now().strftime("%Y-%m-%d")),
        data.get('dueDate', datetime.now().strftime("%Y-%m-%d")),
        data.get('subtotal', 0.0),
        data.get('taxAmount', 0.0),
        data.get('totalAmount', 0.0),
        data.get('amountPaid', 0.0),
        data.get('balanceDue', data.get('totalAmount', 0.0)),
        data.get('status', 'ready_to_send'),
        json.dumps(data.get('lineItems', [])),
        data.get('factoringStatus', 'submitted'),
        datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()
    return {"success": True, "invoiceId": inv_id}

def record_payment(inv_id, amount_paid, ref_num):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM invoices WHERE id = ?', (inv_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return {"error": "Invoice not found"}

    item = dict(row)
    new_amount_paid = item['amount_paid'] + amount_paid
    new_balance = max(0.0, item['total_amount'] - new_amount_paid)
    new_status = 'paid' if new_balance <= 0 else 'partially_paid'

    cursor.execute('''
    UPDATE invoices SET
        amount_paid = ?,
        balance_due = ?,
        status = ?
    WHERE id = ?
    ''', (new_amount_paid, new_balance, new_status, inv_id))

    conn.commit()
    conn.close()
    return {"success": True, "newBalance": new_balance, "newStatus": new_status}

def save_gmail_thread(data):
    conn = get_db()
    cursor = conn.cursor()
    thread_id = data.get('threadId', f"th-{int(datetime.now().timestamp())}")
    cursor.execute('''
    INSERT OR REPLACE INTO gmail_threads (
        id, thread_id, subject, from_email, snippet, parsed_data_json, status, last_action, messages_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('id', f"gt-{thread_id}"),
        thread_id,
        data.get('subject', 'Rate Confirmation'),
        data.get('fromEmail', ''),
        data.get('snippet', ''),
        json.dumps(data.get('parsedFreightData', {})),
        data.get('status', 'unread'),
        data.get('lastAction', 'synced'),
        json.dumps(data.get('messages', [])),
        datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()
    return {"success": True, "threadId": thread_id}

def get_gmail_threads():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM gmail_threads ORDER BY updated_at DESC')
    rows = cursor.fetchall()
    conn.close()
    results = []
    for row in rows:
        item = dict(row)
        if item.get('parsed_data_json'):
            try: item['parsedFreightData'] = json.loads(item['parsed_data_json'])
            except Exception: pass
        if item.get('messages_json'):
            try: item['messages'] = json.loads(item['messages_json'])
            except Exception: pass
        results.append(item)
    return results

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No action"}))
        return

    action = sys.argv[1]
    input_data = {}
    if len(sys.argv) > 2:
        try:
            input_data = json.loads(sys.argv[2])
        except Exception:
            input_data = {}

    if action == 'get_company_profile':
        print(json.dumps(get_company_profile()))
    elif action == 'update_company_profile':
        print(json.dumps(update_company_profile(input_data)))
    elif action == 'get_invoices':
        print(json.dumps(get_invoices()))
    elif action == 'create_invoice':
        print(json.dumps(create_invoice(input_data)))
    elif action == 'record_payment':
        print(json.dumps(record_payment(input_data.get('invoiceId'), input_data.get('amount', 0), input_data.get('refNumber', ''))))
    elif action == 'save_gmail_thread':
        print(json.dumps(save_gmail_thread(input_data)))
    elif action == 'get_gmail_threads':
        print(json.dumps(get_gmail_threads()))

if __name__ == '__main__':
    main()
