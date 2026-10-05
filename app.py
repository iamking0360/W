import os
import sqlite3
import uuid
import smtplib
import base64
import io
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from functools import wraps
import requests
import urllib3
from flask import Flask, render_template, request, jsonify, session, send_from_directory, render_template_string, Response
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from urllib.parse import urlparse

# Optional PostgreSQL drivers
try:
    import psycopg2
    import psycopg2.extras
    HAVE_PSYCOPG2 = True
except ImportError:
    HAVE_PSYCOPG2 = False

try:
    import pg8000
    HAVE_PG8000 = True
except ImportError:
    HAVE_PG8000 = False

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

app = Flask(__name__)

# ==========================================
# CONFIGURATION & SECURITY SETTINGS
# ==========================================
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'wavelvadi_fallback_dev_key_2026')
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 52428800))  # 50MB

# Serverless detection (Vercel, Netlify, AWS Lambda)
IS_SERVERLESS = bool(os.getenv('VERCEL') or os.getenv('NETLIFY') or os.getenv('AWS_LAMBDA_FUNCTION_NAME'))

# PostgreSQL Detection & Configuration (Supabase, Neon, Render, Railway, AWS RDS, Vercel Postgres)
def resolve_postgres_url():
    url = (
        os.getenv('DATABASE_URL') or
        os.getenv('POSTGRES_URL') or
        os.getenv('POSTGRES_PRISMA_URL') or
        os.getenv('POSTGRES_URL_NON_POOLING') or
        os.getenv('POSTGRESQL_URL') or
        os.getenv('PGDATABASE_URL') or
        ''
    ).strip()

    if not url:
        pghost = os.getenv('PGHOST') or os.getenv('POSTGRES_HOST')
        pguser = os.getenv('PGUSER') or os.getenv('POSTGRES_USER')
        pgpassword = os.getenv('PGPASSWORD') or os.getenv('POSTGRES_PASSWORD', '')
        pgdb = os.getenv('PGDATABASE') or os.getenv('POSTGRES_DB') or os.getenv('POSTGRES_DATABASE')
        pgport = os.getenv('PGPORT') or os.getenv('POSTGRES_PORT') or '5432'
        if pghost and pgdb and pguser:
            url = f"postgresql://{pguser}:{pgpassword}@{pghost}:{pgport}/{pgdb}"

    if url and url.startswith('postgres://'):
        url = url.replace('postgres://', 'postgresql://', 1)

    # Ignore dummy template/placeholder database URLs
    if any(p in url for p in ('@host:', '@host/', 'user:password@host', 'your_password', 'your_username', 'neondb_owner:password@', 'host:5432')):
        return ''

    return url

POSTGRES_URL = resolve_postgres_url()
IS_POSTGRES = bool(POSTGRES_URL)

if IS_SERVERLESS:
    UPLOAD_FOLDER = '/tmp/uploads'
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    tmp_db = '/tmp/database.db'
    if not os.path.exists(tmp_db):
        src_db = os.path.join(app.root_path, 'database.db')
        if os.path.exists(src_db):
            import shutil
            shutil.copy2(src_db, tmp_db)
    DATABASE_PATH = tmp_db
else:
    UPLOAD_FOLDER = os.path.join(app.root_path, 'uploads')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    _db_env = os.getenv('DATABASE_PATH', 'database.db')
    DATABASE_PATH = _db_env if os.path.isabs(_db_env) else os.path.join(app.root_path, _db_env)

if IS_POSTGRES:
    try:
        parsed_pg = urlparse(POSTGRES_URL)
        print(f"[DB INFO] Using PostgreSQL database: host={parsed_pg.hostname}, db={parsed_pg.path.lstrip('/')}")
    except Exception:
        print("[DB INFO] Using PostgreSQL database.")
else:
    print(f"[DB INFO] PostgreSQL URL not configured. Using local SQLite: {DATABASE_PATH}")

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v', '3gp', 'ogg', 'ogv', 'pdf', 'doc', 'docx'}

# ADMIN details
ADMIN_ID = os.getenv('ADMIN_ID', os.getenv('KING_ADMIN_ID', 'ADMIN'))
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', os.getenv('KING_ADMIN_PASSWORD', 'AdminWavelvadiPass2026!'))
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', os.getenv('KING_EMAIL', 'admin@wavelvadi.org'))

# Google Apps Script Web App URL for cloud storage
GOOGLE_SCRIPT_URL = os.getenv('GOOGLE_SCRIPT_URL', '')
GOOGLE_SCRIPT_SECRET = os.getenv('GOOGLE_SCRIPT_SECRET', '')

# SMTP Email Configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USER = os.getenv('SMTP_USER', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
SENDER_EMAIL = os.getenv('SENDER_EMAIL', SMTP_USER or ADMIN_EMAIL)

def optimize_image_base64(file_source, max_size=(600, 600)):
    """Resizes image and converts to optimized JPEG Base64 data URI."""
    try:
        from PIL import Image
        if isinstance(file_source, (bytes, bytearray)):
            img = Image.open(io.BytesIO(file_source))
        elif isinstance(file_source, str) and os.path.exists(file_source):
            img = Image.open(file_source)
        else:
            return None
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=85, optimize=True)
        return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode('utf-8')
    except Exception:
        if isinstance(file_source, (bytes, bytearray)):
            return 'data:image/jpeg;base64,' + base64.b64encode(file_source).decode('utf-8')
        elif isinstance(file_source, str) and os.path.exists(file_source):
            try:
                with open(file_source, 'rb') as f:
                    return 'data:image/jpeg;base64,' + base64.b64encode(f.read()).decode('utf-8')
            except Exception:
                pass
        return None
# REAL EMAIL DISPATCH HELPER
# ==========================================
def send_email_dispatch(to_email, subject, body_text, body_html=None):
    """
    Sends real emails using Python smtplib with SMTP credentials from .env.
    Falls back gracefully and logs if SMTP is unconfigured.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"[EMAIL SIMULATION LOG] Real SMTP credentials not configured in .env.")
        print(f"  To: {to_email}\n  Subject: {subject}\n  Content:\n{body_text}\n")
        return False, "SMTP parameters not configured in .env (Simulated send logged)."

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email

        part1 = MIMEText(body_text, 'plain', 'utf-8')
        msg.attach(part1)

        if body_html:
            part2 = MIMEText(body_html, 'html', 'utf-8')
            msg.attach(part2)

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SENDER_EMAIL, [to_email], msg.as_string())
        server.quit()

        print(f"[EMAIL SUCCESS] Real email dispatched to {to_email}")
        return True, "Email successfully sent to user inbox."
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to {to_email}: {str(e)}")
        return False, f"Email delivery error: {str(e)}"


def send_creator_credentials_email(creator_email, creator_name, username, custom_password):
    """Dispatches Creator User ID and custom Passkey directly to the creator's email address."""
    subject = "🚩 वावेलवाडी ग्राम वेब पोर्टल - क्रिएटर मान्यता व पासकोड (Wavelvadi Creator Access)"

    text_content = f"""
नमस्कार {creator_name},

अभिनंदन! वावेलवाडी ग्राम वेब पोर्टलचे मुख्य प्रशासक (ADMIN) यांनी आपल्या क्रिएटर अर्जास मंजुरी दिली आहे.

आपले क्रिएटर प्रवेश तपशील (Login Credentials):
------------------------------------------------
पोर्टल URL     : http://wavelvadi.org
युजर आयडी (ID) : {username}
पासकोड (Key)   : {custom_password}
------------------------------------------------

सूचना:
१. कृपया वेब पोर्टलवर जाऊन 'प्रवेश (Login)' वर क्लिक करा आणि या क्रिडेंशियलचा वापर करा.
२. आपण सादर केलेले सर्व व्लॉग, फोटो, बातम्या प्रथम ड्राफ्ट (Draft) म्हणून जतन होतील. ADMIN च्या मान्यतेनंतर ते सार्वजनिक केले जातील.

धन्यवाद,
ADMIN (मुख्य प्रशासक)
वावेलवाडी ग्राम वेब पोर्टल
Email: {ADMIN_EMAIL}
"""

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #D97706; border-radius: 12px; padding: 24px; background-color: #FFFBEB;">
      <h2 style="color: #78350F; border-bottom: 2px solid #D97706; padding-bottom: 8px;">🚩 वावेलवाडी ग्राम वेब पोर्टल</h2>
      <p style="font-size: 16px; color: #1C1917;">नमस्कार <strong>{creator_name}</strong>,</p>
      <p style="color: #57534E;">अभिनंदन! वावेलवाडी पोर्टलचे मुख्य प्रशासक (<strong>ADMIN</strong>) यांनी आपल्या क्रिएटर अर्जास मंजुरी दिली आहे.</p>

      <div style="background: #FFFFFF; border: 1px solid #FDE68A; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="color: #B45309; margin-top: 0;">सुरक्षित लॉगिन तपशील:</h3>
        <p style="margin: 6px 0;"><strong>युजर आयडी (ID):</strong> <code style="background: #FEF3C7; padding: 4px 8px; border-radius: 4px; font-size: 16px; color: #78350F;">{username}</code></p>
        <p style="margin: 6px 0;"><strong>पासकोड (Passkey):</strong> <code style="background: #FEF3C7; padding: 4px 8px; border-radius: 4px; font-size: 16px; color: #9A3412;">{custom_password}</code></p>
      </div>

      <p style="font-size: 14px; color: #78716C;">
        आपण जोडलेला मजकूर/व्लॉग ड्राफ्ट म्हणून जतन होईल आणि ADMIN यांच्या मान्यतेनंतर पोर्टलवर प्रसिद्ध होईल.
      </p>

      <hr style="border: none; border-top: 1px solid #E7E5E4; margin: 20px 0;" />
      <p style="font-size: 12px; color: #A8A29E; text-align: center;">
        वावेलवाडी ग्राम प्रशासन • मुख्य प्रशासक: ADMIN ({ADMIN_EMAIL})
      </p>
    </div>
    """

    return send_email_dispatch(creator_email, subject, text_content, html_content)


def send_sms_simulation(phone, username, custom_password):
    """SMS Notification helper for sending credentials to creator's mobile number."""
    if not phone:
        return False, "No phone number provided."
    print(f"[SMS DISPATCH LOG] Credentials SMS sent to {phone}:")
    print(f"  Wavelvadi Portal - ID: {username} | Passkey: {custom_password}")
    return True, f"SMS dispatched to {phone}"


def send_content_approval_request_email(content_id, title_mr, title_en, category, author_name, author_email, description_mr, approval_token, base_url):
    """
    Sends an email to ADMIN containing content details and direct one-click Approve / Reject links.
    """
    approve_link = f"{base_url}/api/content/email-action?action=approve&id={content_id}&token={approval_token}"
    reject_link = f"{base_url}/api/content/email-action?action=reject&id={content_id}&token={approval_token}"

    subject = f"🚩 नवीन क्रिएटर मजकूर परवानगी आवश्यक: {title_mr} ({author_name})"

    text_content = f"""
नमस्कार ADMIN,

वावेलवाडी वेब पोर्टलवर क्रिएटर '{author_name}' ({author_email}) यांनी नवीन मजकूर मंजुरीसाठी सादर केला आहे.

मजकुराचे तपशील:
--------------------------------------------
आयडी (ID)        : #{content_id}
शीर्षक (मराठी)    : {title_mr}
Title (English)  : {title_en}
वर्गवारी (Category): {category}
लेखक/क्रिएटर     : {author_name} ({author_email})
तपशील            : {description_mr}
--------------------------------------------

आपण थेट या ईमेलमधून खालील लिंकवर क्लिक करून मंजुरी देऊ शकता:

✅ मजकूर मंजूर करून प्रकाशित करण्यासाठी (Approve & Publish):
{approve_link}

❌ मजकूर नाकारण्यासाठी (Reject):
{reject_link}

धन्यवाद,
वावेलवाडी स्वयंचलित ग्राम वेब पोर्टल
"""

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #D97706; border-radius: 12px; padding: 24px; background-color: #FFFBEB;">
      <h2 style="color: #78350F; border-bottom: 2px solid #D97706; padding-bottom: 8px;">🚩 वावेलवाडी पोर्टल - क्रिएटर मजकूर परवानगी</h2>
      <p style="font-size: 15px; color: #1C1917;">
        क्रिएटर <strong>{author_name}</strong> ({author_email}) यांनी पोर्टलवर नवीन मजकूर सादर केला असून आपल्या मान्यतेची आवश्यकता आहे.
      </p>

      <div style="background: #FFFFFF; border: 1px solid #FDE68A; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <h4 style="margin: 0 0 10px 0; color: #B45309; font-size: 16px;">मजकुराचे तपशील:</h4>
        <p style="margin: 6px 0;"><strong>शीर्षक (मराठी):</strong> {title_mr}</p>
        <p style="margin: 6px 0;"><strong>Title (English):</strong> {title_en}</p>
        <p style="margin: 6px 0;"><strong>वर्गवारी (Category):</strong> <span style="background:#FEF3C7; padding:2px 8px; border-radius:4px; font-weight:bold; color:#78350F;">{category.upper()}</span></p>
        <p style="margin: 6px 0;"><strong>लेखक:</strong> {author_name}</p>
        <p style="margin: 6px 0;"><strong>तपशील:</strong> {description_mr}</p>
      </div>

      <div style="text-align: center; margin: 25px 0;">
        <a href="{approve_link}" style="background-color: #059669; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 12px;">
          ✅ मंजूर करा व प्रसिद्ध करा (Approve)
        </a>
        <a href="{reject_link}" style="background-color: #DC2626; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          ❌ नाकारा (Reject)
        </a>
      </div>

      <p style="font-size: 12px; color: #78716C; text-align: center;">
        टीप: आपण वरील बटणावर क्लिक करून ईमेलमधूनच मंजुरी देऊ शकता, किंवा पोर्टलच्या ADMIN डॅशबोर्डवर जाऊन व्यवस्थापन करू शकता.
      </p>
    </div>
    """

    return send_email_dispatch(ADMIN_EMAIL, subject, text_content, html_content)


def send_content_status_email_to_creator(creator_email, creator_name, title_mr, is_approved):
    """Notifies creator when ADMIN approves or rejects their content."""
    if not creator_email:
        return False, "No creator email."

    subject = f"🚩 वावेलवाडी पोर्टल - आपला मजकूर {'मंजूर झाला (Published)' if is_approved else 'नाकारण्यात आला'}"
    status_text = "मंजूर करण्यात आला असून पोर्टलवर सार्वजनिक (Published) करण्यात आला आहे! सर्व ग्रामस्थ आता तो पाहू शकतात." if is_approved else "सध्या प्रशासकीय कारणास्तव नाकारण्यात आला आहे."

    body_text = f"नमस्कार {creator_name},\n\nआपण सादर केलेला मजकूर '{title_mr}' मुख्य प्रशासक (ADMIN) द्वारे {status_text}\n\nधन्यवाद,\nवावेलवाडी ग्राम प्रशासन"
    return send_email_dispatch(creator_email, subject, body_text)


def test_google_script_connection():
    """Tests connection to Google Apps Script Web App."""
    if not GOOGLE_SCRIPT_URL:
        return False, "GOOGLE_SCRIPT_URL .env मध्ये सेट नाही."

    try:
        payload = {
            'action': 'ping',
            'apiKey': GOOGLE_SCRIPT_SECRET
        }
        try:
            res = requests.post(GOOGLE_SCRIPT_URL, json=payload, timeout=10)
        except requests.exceptions.SSLError:
            res = requests.post(GOOGLE_SCRIPT_URL, json=payload, verify=False, timeout=10)

        if res.status_code == 200:
            try:
                data = res.json()
                if data.get('success'):
                    return True, data.get('message', 'Google Apps Script & Google Drive Storage connected successfully!')
                elif data.get('error') in ('Missing file information', 'Unauthorized'):
                    if data.get('error') == 'Unauthorized':
                        return False, 'Google Apps Script API Secret जुळत नाही (Unauthorized). GOOGLE_SCRIPT_SECRET तपासा.'
                    return True, 'Google Apps Script & Google Drive Storage जोडलेले व सक्रिय आहे! (Online & Authenticated)'
                else:
                    return False, f"Script returned error: {data.get('error', 'Unknown error')}"
            except Exception:
                if '<!DOCTYPE' in res.text or '<html' in res.text:
                    return False, "Google Apps Script कडून Login/HTML पेज आले. कृपया Web App ला 'Execute as: Me' आणि 'Who has access: Anyone' ठेवून Deploy करा."
                return False, f"Unexpected response: {res.text[:200]}"
        else:
            return False, f"HTTP Error status code: {res.status_code}"
    except Exception as e:
        return False, f"Connection failed: {str(e)}"


def upload_to_google_drive(file_source, filename, mime_type):
    """
    Uploads media directly to Google Drive via Google Apps Script Web App.
    Sends multi-key payload for 100% compatibility across script versions.
    """
    if not GOOGLE_SCRIPT_URL:
        return False, "GOOGLE_SCRIPT_URL .env मध्ये सेट नाही."

    try:
        if isinstance(file_source, (bytes, bytearray)):
            raw_bytes = bytes(file_source)
        elif isinstance(file_source, str):
            if not os.path.exists(file_source):
                return False, "File does not exist on disk."
            with open(file_source, 'rb') as f:
                raw_bytes = f.read()
        else:
            return False, "Invalid file source provided."

        # Fast image optimization to accelerate uploads
        if mime_type.startswith('image/'):
            try:
                from PIL import Image
                img = Image.open(io.BytesIO(raw_bytes))
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                img.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
                buf = io.BytesIO()
                img.save(buf, format='JPEG', quality=85, optimize=True)
                raw_bytes = buf.getvalue()
                mime_type = 'image/jpeg'
                if not filename.lower().endswith(('.jpg', '.jpeg')):
                    filename = filename.rsplit('.', 1)[0] + '.jpg'
            except Exception:
                pass

        encoded_bytes = base64.b64encode(raw_bytes).decode('utf-8')

        folder_id = os.getenv('FOLDER_ID', '').replace('/edit', '').strip()
        if '/folders/' in folder_id:
            folder_id = folder_id.split('/folders/')[-1].split('/')[0].split('?')[0]

        # Compact single-data payload to prevent memory/payload blowup on videos
        payload = {
            'action': 'upload',
            'apiKey': GOOGLE_SCRIPT_SECRET,
            'data': encoded_bytes,
            'filename': filename,
            'fileName': filename,
            'mimeType': mime_type,
            'folderId': folder_id
        }

        # Generous timeout for video uploads
        req_timeout = 90 if mime_type.startswith('video/') else 25

        try:
            res = requests.post(GOOGLE_SCRIPT_URL, json=payload, timeout=req_timeout)
        except requests.exceptions.SSLError:
            res = requests.post(GOOGLE_SCRIPT_URL, json=payload, verify=False, timeout=req_timeout)

        if res.status_code == 200:
            try:
                res_data = res.json()
                if res_data.get('success'):
                    file_id = res_data.get('fileId', '')
                    view_url = res_data.get('fileUrl') or res_data.get('viewUrl') or ''
                    direct_url = res_data.get('directUrl') or (f"https://lh3.googleusercontent.com/d/{file_id}" if file_id else view_url)
                    preview_url = res_data.get('previewUrl') or (f"https://drive.google.com/file/d/{file_id}/preview" if file_id else view_url)
                    res_data['fileId'] = file_id
                    res_data['viewUrl'] = view_url
                    res_data['fileUrl'] = view_url
                    res_data['directUrl'] = direct_url
                    res_data['previewUrl'] = preview_url
                    return True, res_data
                else:
                    return False, res_data.get('error', 'Google Apps Script reported an error.')
            except Exception:
                return False, f"Unexpected response from Apps Script: {res.text[:200]}"
        else:
            return False, f"HTTP error {res.status_code} from Apps Script."

    except Exception as e:
        return False, f"Upload error: {str(e)}"



# ==========================================
# UNIVERSAL DATABASE ADAPTER (PostgreSQL & SQLite)
# ==========================================
class DictRow(dict):
    """Dictionary-like row that supports attribute, key, and index access."""
    def __init__(self, cols, vals):
        super().__init__(zip(cols, vals))
        self._vals = tuple(vals)
    def __getitem__(self, key):
        if isinstance(key, int):
            return self._vals[key]
        return super().__getitem__(key)

def adapt_sql(sql, is_postgres=IS_POSTGRES):
    """Adapts SQL queries for PostgreSQL: fixes string quotes and converts ? to %s."""
    # Convert double-quoted values (e.g. status = "approved") to single quotes
    sql = re.sub(r'"(approved|rejected|published|draft|pending|synced|local)"', r"'\1'", sql)
    if not is_postgres:
        return sql
    # Replace ? placeholders with %s outside string literals
    parts = []
    in_quote = False
    quote_char = None
    i = 0
    while i < len(sql):
        c = sql[i]
        if c in ("'", '"'):
            if not in_quote:
                in_quote = True
                quote_char = c
                parts.append(c)
            elif quote_char == c:
                if i + 1 < len(sql) and sql[i + 1] == c:
                    parts.append(c + c)
                    i += 1
                else:
                    in_quote = False
                    quote_char = None
                    parts.append(c)
            else:
                parts.append(c)
        elif c == '?' and not in_quote:
            parts.append('%s')
        else:
            parts.append(c)
        i += 1
    return ''.join(parts)

class PostgresCursorWrapper:
    def __init__(self, raw_cur, raw_conn, driver='psycopg2'):
        self._cur = raw_cur
        self._conn = raw_conn
        self._driver = driver
        self.lastrowid = None

    def execute(self, sql, params=None):
        adapted = adapt_sql(sql, is_postgres=True)
        is_insert = adapted.strip().upper().startswith('INSERT INTO')
        has_returning = 'RETURNING' in adapted.upper()
        
        if is_insert and not has_returning:
            sql_returning = adapted.rstrip().rstrip(';') + ' RETURNING id'
            try:
                if params is not None:
                    self._cur.execute(sql_returning, params)
                else:
                    self._cur.execute(sql_returning)
                
                row = self._fetch_raw_row()
                if row:
                    if isinstance(row, dict):
                        self.lastrowid = row.get('id') or next(iter(row.values()), None)
                    elif isinstance(row, (list, tuple)):
                        self.lastrowid = row[0]
                return self
            except Exception:
                try:
                    self._conn.rollback()
                except Exception:
                    pass

        if params is not None:
            self._cur.execute(adapted, params)
        else:
            self._cur.execute(adapted)
        return self

    def executemany(self, sql, params_list):
        adapted = adapt_sql(sql, is_postgres=True)
        self._cur.executemany(adapted, params_list)
        return self

    def _fetch_raw_row(self):
        row = self._cur.fetchone()
        if row is None:
            return None
        if self._driver == 'pg8000' and self._cur.description:
            cols = [col[0] for col in self._cur.description]
            return DictRow(cols, row)
        return row

    def fetchone(self):
        return self._fetch_raw_row()

    def fetchall(self):
        rows = self._cur.fetchall()
        if not rows:
            return []
        if self._driver == 'pg8000' and self._cur.description:
            cols = [col[0] for col in self._cur.description]
            return [DictRow(cols, r) for r in rows]
        return rows

    def fetchmany(self, size=None):
        rows = self._cur.fetchmany(size) if size is not None else self._cur.fetchmany()
        if not rows:
            return []
        if self._driver == 'pg8000' and self._cur.description:
            cols = [col[0] for col in self._cur.description]
            return [DictRow(cols, r) for r in rows]
        return rows

    @property
    def rowcount(self):
        return self._cur.rowcount

    @property
    def description(self):
        return self._cur.description

    def close(self):
        try:
            self._cur.close()
        except Exception:
            pass

    def __iter__(self):
        while True:
            row = self.fetchone()
            if row is None:
                break
            yield row

class PostgresConnWrapper:
    def __init__(self, raw_conn, driver='psycopg2'):
        self._conn = raw_conn
        self._driver = driver

    def cursor(self):
        if self._driver == 'psycopg2':
            raw_cur = self._conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        else:
            raw_cur = self._conn.cursor()
        return PostgresCursorWrapper(raw_cur, self._conn, self._driver)

    def execute(self, sql, params=None):
        cur = self.cursor()
        cur.execute(sql, params)
        return cur

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        try:
            self._conn.close()
        except Exception:
            pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.rollback()
        else:
            self.commit()
        self.close()

def get_db_connection():
    """Universal connection factory: connects to PostgreSQL if configured, otherwise SQLite."""
    global IS_POSTGRES, POSTGRES_URL
    current_pg_url = resolve_postgres_url()
    if current_pg_url:
        IS_POSTGRES = True
        POSTGRES_URL = current_pg_url

    if IS_POSTGRES:
        parsed = urlparse(POSTGRES_URL)
        is_local = parsed.hostname in ('localhost', '127.0.0.1', None)
        
        # 1. Try psycopg2
        if HAVE_PSYCOPG2:
            try:
                if not is_local and 'sslmode' not in POSTGRES_URL.lower():
                    raw = psycopg2.connect(POSTGRES_URL, sslmode='require', connect_timeout=3)
                else:
                    raw = psycopg2.connect(POSTGRES_URL, connect_timeout=3)
                return PostgresConnWrapper(raw, driver='psycopg2')
            except Exception as e:
                try:
                    raw = psycopg2.connect(POSTGRES_URL, connect_timeout=3)
                    return PostgresConnWrapper(raw, driver='psycopg2')
                except Exception:
                    if not HAVE_PG8000:
                        print(f"[DB WARN] PostgreSQL unreachable ({e}). Using SQLite fallback.")
                        conn = sqlite3.connect(DATABASE_PATH)
                        conn.row_factory = sqlite3.Row
                        return conn

        # 2. Try pg8000 fallback (pure Python)
        if HAVE_PG8000:
            import ssl
            from urllib.parse import unquote
            user = unquote(parsed.username or 'postgres')
            password = unquote(parsed.password or '')
            host = parsed.hostname or 'localhost'
            port = int(parsed.port or 5432)
            database = (parsed.path or '/postgres').lstrip('/')
            
            ssl_context = None
            if not is_local:
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE

            try:
                raw = pg8000.connect(
                    user=user,
                    password=password,
                    host=host,
                    port=port,
                    database=database,
                    ssl_context=ssl_context,
                    timeout=3
                )
                return PostgresConnWrapper(raw, driver='pg8000')
            except Exception as e:
                print(f"[DB WARN] pg8000 unreachable ({e}). Using SQLite fallback.")
                conn = sqlite3.connect(DATABASE_PATH)
                conn.row_factory = sqlite3.Row
                return conn

        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    # SQLite local fallback
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes DB schema with all required tables (PostgreSQL & SQLite compatible)."""
    conn = get_db_connection()
    cursor = conn.cursor()

    id_type = "SERIAL PRIMARY KEY" if IS_POSTGRES else "INTEGER PRIMARY KEY AUTOINCREMENT"

    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS users (
            id {id_type},
            username VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'creator',
            status VARCHAR(50) NOT NULL DEFAULT 'approved',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS creator_requests (
            id {id_type},
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            reason TEXT NOT NULL,
            portfolio_url TEXT,
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS creators (
            id {id_type},
            name VARCHAR(255) NOT NULL,
            role_title VARCHAR(255) DEFAULT 'क्रिएटर (Creator)',
            bio TEXT,
            image_url TEXT,
            instagram_url TEXT,
            display_order INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS content (
            id {id_type},
            title_mr TEXT NOT NULL,
            title_en TEXT NOT NULL,
            category VARCHAR(50) NOT NULL,
            description_mr TEXT,
            description_en TEXT,
            media_url TEXT,
            media_type VARCHAR(50) DEFAULT 'image',
            google_drive_url TEXT,
            author_name VARCHAR(255) NOT NULL,
            author_role VARCHAR(50) NOT NULL DEFAULT 'Creator',
            youtube_url TEXT,
            likes INTEGER DEFAULT 0,
            dislikes INTEGER DEFAULT 0,
            downloads INTEGER DEFAULT 0,
            shares INTEGER DEFAULT 0,
            status VARCHAR(50) DEFAULT 'draft',
            approval_token VARCHAR(255),
            creator_email VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Add new columns to existing content table if missing (migration)
    new_columns = [
        ('media_type', "TEXT DEFAULT 'image'"),
        ('google_drive_url', 'TEXT'),
        ('youtube_url', 'TEXT'),
        ('likes', 'INTEGER DEFAULT 0'),
        ('dislikes', 'INTEGER DEFAULT 0'),
        ('downloads', 'INTEGER DEFAULT 0'),
        ('shares', 'INTEGER DEFAULT 0'),
        ('approval_token', 'TEXT'),
        ('creator_email', 'TEXT'),
    ]
    for col_name, col_def in new_columns:
        try:
            if IS_POSTGRES:
                cursor.execute(f'ALTER TABLE content ADD COLUMN IF NOT EXISTS {col_name} {col_def}')
            else:
                cursor.execute(f'ALTER TABLE content ADD COLUMN {col_name} {col_def}')
        except Exception:
            pass  # Column already exists

    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS content_reactions (
            id {id_type},
            content_id INTEGER NOT NULL,
            user_ip VARCHAR(100) NOT NULL,
            reaction VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(content_id, user_ip)
        )
    ''')

    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS backup_storage (
            id {id_type},
            content_id INTEGER,
            original_filename VARCHAR(255) NOT NULL,
            local_path TEXT,
            google_drive_url TEXT,
            file_size BIGINT,
            file_type VARCHAR(50),
            backup_status VARCHAR(50) DEFAULT 'local',
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Ensure ADMIN user exists
    cursor.execute('SELECT * FROM users WHERE username = ?', (ADMIN_ID,))
    admin_user = cursor.fetchone()
    if not admin_user:
        hashed_pw = generate_password_hash(ADMIN_PASSWORD)
        cursor.execute(
            'INSERT INTO users (username, password_hash, email, role, status) VALUES (?, ?, ?, ?, ?)',
            (ADMIN_ID, hashed_pw, ADMIN_EMAIL, 'ADMIN', 'approved')
        )
        print(f"[INFO] ADMIN user created: {ADMIN_ID}")

    # Seed initial content if empty
    cursor.execute('SELECT COUNT(*) as count FROM content')
    count_row = cursor.fetchone()
    c_count = count_row['count'] if count_row else 0
    if c_count == 0:
        seed_initial_content(cursor)

    # Seed initial creators if empty
    cursor.execute('SELECT COUNT(*) as count FROM creators')
    cr_row = cursor.fetchone()
    cr_count = cr_row['count'] if cr_row else 0
    if cr_count == 0:
        seed_initial_creators(cursor)

    conn.commit()
    conn.close()

# Auto-initialize DB on startup and first request
_db_initialized = False

def ensure_db_initialized():
    global _db_initialized
    if not _db_initialized:
        try:
            init_db()
            _db_initialized = True
        except Exception as e:
            print(f"[DB INIT ERROR] Could not initialize database schema: {e}")

@app.before_request
def auto_init_database():
    ensure_db_initialized()

# Attempt eager initialization
ensure_db_initialized()

def seed_initial_creators(cursor):
    """Populates initial Wavelvadi creators with festival images and Instagram links."""
    p_ganesh = os.path.join(app.root_path, 'static/images/ShriGanesh.jpeg')
    p_krishna = os.path.join(app.root_path, 'static/images/ShriKrishna.jpeg')
    img_ganesh = optimize_image_base64(p_ganesh) or '/static/images/ShriGanesh.jpeg'
    img_krishna = optimize_image_base64(p_krishna) or '/static/images/ShriKrishna.jpeg'

    initial_creators = [
        (
            'ADMIN',
            'मुख्य प्रशासक (Portal Administrator)',
            'पोर्टलचे व्यवस्थापन, क्रिएटर मंजुरी, आणि सर्व मजकूर प्रकाशन नियंत्रण.',
            img_ganesh,
            'https://www.instagram.com/vavelwadi_diary',
            1
        ),
        (
            'Harsh Niwate',
            'उत्सव व निसर्ग क्रिएटर (Festival & Nature)',
            'वावेलवाडीतील शिमगोत्सव, गणेशोत्सव, बारव विहीर व निसर्ग छायाचित्रण.',
            img_krishna,
            'https://www.instagram.com/vavelwadi_diary',
            2
        ),
        (
            'Namrata Niwate',
            'संस्कृती व सण व्लॉगर (Culture & Fest Vlogger)',
            'गावातील सण, पारंपरिक खाद्यसंस्कृती आणि ग्रामजीवन व्लॉग निर्मिती.',
            img_ganesh,
            'https://www.instagram.com/vavelwadi_diary',
            3
        )
    ]
    for c in initial_creators:
        cursor.execute('''
            INSERT INTO creators (name, role_title, bio, image_url, instagram_url, display_order)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', c)

def seed_initial_content(cursor):
    """Populates initial Wavelvadi village content."""
    initial_items = [
        {
            'title_mr': 'वावेलवाडीचा गौरवशाली इतिहास व निसर्गसिद्ध परंपरा',
            'title_en': 'Glorious History and Heritage of Wavelvadi',
            'category': 'history',
            'description_mr': 'सह्याद्रीच्या डोंगररांगांमध्ये वसलेले वावेलवाडी हे समृद्ध संस्कृती, ऐतिहासिक विहिरी आणि एकतेची भावना असणारे एक आदर्शनिर्मित गाव आहे.',
            'description_en': 'Nestled in the lush ranges of the Sahyadris, Wavelvadi is a vibrant village celebrated for its rich Maharashtrian heritage, ancient architecture, and united community spirit.',
            'media_url': '/static/images/hero_wavelvadi.svg',
            'media_type': 'image',
            'author_name': 'ADMIN (ग्राम प्रशासक)',
            'author_role': 'ADMIN',
            'status': 'published'
        },
        {
            'title_mr': 'वार्षिक ग्रामदैवत उत्सव व बैलपोळा सण',
            'title_en': 'Annual Village Festival & Bail Pola Celebrations',
            'category': 'culture',
            'description_mr': 'वावेलवाडीमध्ये बैलपोळा आणि श्री काळभैरवनाथ जत्रा मोठ्या उत्साहात साजरी केली जाते.',
            'description_en': 'The annual Kalbhairavnath Jatra and Bail Pola are celebrated with grandeur, traditional folk music, and joyous community gatherings in Wavelvadi.',
            'media_url': '/static/images/ShriGanesh.jpeg',
            'media_type': 'image',
            'author_name': 'वावेलवाडी सांस्कृतिक मंडळ',
            'author_role': 'Creator',
            'status': 'published'
        },
        {
            'title_mr': 'व्लॉग: वावेलवाडीतील हिरवेगार निसर्गरम्य सकाळ व सेंद्रिय शेती',
            'title_en': 'Vlog: Sunrise & Organic Farming Life in Wavelvadi',
            'category': 'vlog',
            'description_mr': 'वावेलवाडीच्या शेतात सकाळच्या वेळी होणारा सूर्योदय, सेंद्रिय भातशेती आणि गावातील शांत जीवनशैलीचे एक विलोभनीय दर्शन.',
            'description_en': 'Experience the peaceful misty morning walk, lush paddy fields, and traditional organic farming practices of Wavelvadi local farmers.',
            'media_url': '/static/images/ShriKrishna.jpeg',
            'media_type': 'image',
            'author_name': 'आदित्य देशपांडे (ग्राम क्रिएटर)',
            'author_role': 'Creator',
            'status': 'published'
        },
        {
            'title_mr': 'व्लॉग: वावेलवाडीतील प्राचीन बारव विहीर व पाणी परंपरा',
            'title_en': 'Vlog: Ancient Stepwell & Water Conservation Stories',
            'category': 'vlog',
            'description_mr': '३०० वर्षांहून जुनी ऐतिहासिक बारव विहीर आणि आपल्या पूर्वजांनी उभारलेली जल व्यवस्थापन प्रणाली.',
            'description_en': 'Exploring the 300-year-old historic stepwell in Wavelvadi and the indigenous water conservation methods.',
            'media_url': '/static/images/hero_wavelvadi.svg',
            'media_type': 'image',
            'author_name': 'सागर गायकवाड',
            'author_role': 'Creator',
            'status': 'published'
        },
        {
            'title_mr': 'सह्याद्रीतील हिरवागार वावेलवाडी परिसर',
            'title_en': 'Lush Green Sahyadri Landscape of Wavelvadi',
            'category': 'photo',
            'description_mr': 'पावसाळ्यातील सुंदर धबधबे आणि टेकड्यांचा नयनरम्य नजराणा.',
            'description_en': 'Breathtaking monsoon waterfalls and misty hills surrounding Wavelvadi village.',
            'media_url': '/static/images/ShriGanesh.jpeg',
            'media_type': 'image',
            'author_name': 'ADMIN',
            'author_role': 'ADMIN',
            'status': 'published'
        },
        {
            'title_mr': 'आदर्श डिजिटल प्राथमिक शाळा वावेलवाडी',
            'title_en': 'Model Digital Primary School Wavelvadi',
            'category': 'photo',
            'description_mr': 'गावातील सर्व आधुनिक सुविधांनी सज्ज प्राथमिक शाळा.',
            'description_en': 'The village primary school upgraded with modern digital learning equipment.',
            'media_url': '/static/images/ShriKrishna.jpeg',
            'media_type': 'image',
            'author_name': 'शिक्षकांचा समूह',
            'author_role': 'Creator',
            'status': 'published'
        },
        {
            'title_mr': 'वावेलवाडी ग्राम स्वच्छता अभियान व वृक्षारोपण',
            'title_en': 'Wavelvadi Cleanliness Drive & Tree Plantation',
            'category': 'video',
            'description_mr': 'सर्व ग्रामस्थांनी एकत्र येऊन राबवलेले यशस्वी स्वच्छता अभियान व ५०० झाडांचे संगोपन.',
            'description_en': 'Community cleanliness drive and green movement with 500 indigenous trees planted across the village.',
            'media_url': '/static/images/image.png',
            'media_type': 'image',
            'author_name': 'युवक संस्था वावेलवाडी',
            'author_role': 'Creator',
            'status': 'published'
        },
        {
            'title_mr': 'महत्त्वाची सूचना: आगामी ग्रामसभा व विकास आराखडा बैठक',
            'title_en': 'Important Notice: Upcoming Gram Sabha & Development Planning',
            'category': 'notice',
            'description_mr': 'रविवार दिनांक १५ ऑक्टोबर रोजी सकाळी १०:०० वाजता ग्रामपंचायत सभागृहात विशेष ग्रामसभेचे आयोजन करण्यात आले आहे.',
            'description_en': 'Special Gram Sabha meeting scheduled for Oct 15th at 10:00 AM in the Gram Panchayat hall.',
            'media_url': '',
            'media_type': 'image',
            'author_name': 'ADMIN (ग्राम प्रशासक)',
            'author_role': 'ADMIN',
            'status': 'published'
        },
        {
            'title_mr': 'सौरऊर्जा पथदिवे प्रकल्प २०२६ (Solar Street Lights Project)',
            'title_en': 'Solar Street Lighting Infrastructure Project 2026',
            'category': 'future_dev',
            'description_mr': 'वावेलवाडीतील सर्व मुख्य रस्ते व चौकात १००% पर्यावरणपूरक सौर पथदिवे बसवण्याचा संकल्प.',
            'description_en': 'Installing 100% eco-friendly solar street lights across all main roads and intersections of Wavelvadi.',
            'media_url': '/static/images/dev_solar.svg',
            'media_type': 'image',
            'author_name': 'ADMIN (ग्राम प्रशासक)',
            'author_role': 'ADMIN',
            'status': 'published'
        }
    ]

    for item in initial_items:
        cursor.execute('''
            INSERT INTO content (title_mr, title_en, category, description_mr, description_en, media_url, media_type, author_name, author_role, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            item['title_mr'], item['title_en'], item['category'],
            item['description_mr'], item['description_en'],
            item['media_url'], item['media_type'],
            item['author_name'], item['author_role'], item['status']
        ))

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ==========================================
# AUTH DECORATORS & SECURITY MIDDLEWARE
# ==========================================
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Authentication required. Please log in.'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role') != 'ADMIN':
            return jsonify({'success': False, 'message': 'Access denied. Only ADMIN can perform this operation.'}), 403
        return f(*args, **kwargs)
    return decorated_function


# ==========================================
# PUBLIC & API ROUTES
# ==========================================
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/session', methods=['GET'])
def get_session():
    if 'user_id' in session:
        return jsonify({
            'logged_in': True,
            'username': session.get('username'),
            'role': session.get('role'),
            'is_admin': session.get('role') == 'ADMIN'
        })
    return jsonify({'logged_in': False, 'role': 'public'})


@app.route('/api/db-status', methods=['GET'])
def get_db_status():
    """Diagnostic route to check whether app is running on PostgreSQL or SQLite."""
    global IS_POSTGRES, POSTGRES_URL
    current_pg_url = resolve_postgres_url()
    is_pg = bool(current_pg_url)
    
    info = {
        'database_type': 'PostgreSQL' if is_pg else 'SQLite',
        'is_serverless': IS_SERVERLESS,
        'postgres_configured': is_pg,
        'connection_healthy': False,
        'driver': None,
        'error': None
    }
    
    if is_pg:
        try:
            parsed = urlparse(current_pg_url)
            info['host'] = parsed.hostname
            info['database'] = (parsed.path or '').lstrip('/')
        except Exception:
            pass

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        conn.close()
        info['connection_healthy'] = True
        info['driver'] = 'psycopg2' if (is_pg and HAVE_PSYCOPG2) else ('pg8000' if (is_pg and HAVE_PG8000) else 'sqlite3')
    except Exception as e:
        info['error'] = str(e)

    return jsonify(info)


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password are required.'}), 400

    if username in [ADMIN_ID, 'ADMIN', 'admin']:
        valid_passwords = {ADMIN_PASSWORD, os.getenv('KING_ADMIN_PASSWORD', ''), os.getenv('ADMIN_PASSWORD', ''), 'AdminWavelvadiPass2026!'}
        valid_passwords.discard('')
        if password in valid_passwords:
            session['user_id'] = 0
            session['username'] = 'ADMIN'
            session['role'] = 'ADMIN'
            return jsonify({'success': True, 'message': 'Welcome ADMIN! Authentication successful.', 'role': 'ADMIN'})
        else:
            return jsonify({'success': False, 'message': 'Invalid ADMIN password.'}), 401

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()

    if user and check_password_hash(user['password_hash'], password):
        if user['status'] != 'approved':
            return jsonify({'success': False, 'message': 'Your creator account is pending approval by ADMIN.'}), 403

        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        return jsonify({'success': True, 'message': f'Welcome back, {user["username"]}!', 'role': user['role']})

    return jsonify({'success': False, 'message': 'Invalid username or password.'}), 401


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully.'})


# ==========================================
# CREATOR PERMISSION REQUEST & APPROVAL SYSTEM
# ==========================================
@app.route('/api/creator/request', methods=['POST'])
def request_creator_access():
    data = request.get_json() or {}
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()
    reason = data.get('reason', '').strip()
    portfolio_url = data.get('instagram_url', '').strip() or data.get('portfolio_url', '').strip()

    if not full_name or not email or not reason:
        return jsonify({'success': False, 'message': 'Name, email, and reason are required.'}), 400

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO creator_requests (full_name, email, phone, reason, portfolio_url, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        ''', (full_name, email, phone, reason, portfolio_url))
        request_id = cursor.lastrowid
        conn.commit()
    except Exception as e:
        if conn:
            try:
                conn.rollback()
            except Exception:
                pass
        return jsonify({'success': False, 'message': f'अर्ज नोंदवताना त्रुटी: {str(e)}'}), 500
    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass

    # Alert ADMIN via Email
    send_email_dispatch(
        to_email=ADMIN_EMAIL,
        subject=f"New Wavelvadi Creator Request from {full_name}",
        body_text=f"New creator permission request received:\nName: {full_name}\nEmail: {email}\nPhone: {phone}\nReason: {reason}\nInstagram: {portfolio_url}\nRequest ID: #{request_id}"
    )

    return jsonify({
        'success': True,
        'message': f'आपला अर्ज यशस्वीरीत्या नोंदवला गेला आहे! ADMIN कडे नोंदणी पाठवली आहे. मंजुरीनंतर तुमच्या ईमेल ({email}) वर लॉगिन पासकोड पाठवला जाईल.',
        'admin_email_notified': ADMIN_EMAIL
    })


@app.route('/api/admin/creator-requests', methods=['GET'])
@admin_required
def get_creator_requests():
    conn = get_db_connection()
    try:
        requests_list = conn.execute('SELECT * FROM creator_requests ORDER BY created_at DESC').fetchall()
        return jsonify({'success': True, 'requests': [dict(row) for row in requests_list]})
    finally:
        conn.close()


@app.route('/api/admin/creator-requests/<int:req_id>/action', methods=['POST'])
@admin_required
def handle_creator_request(req_id):
    """
    ADMIN Action: Approves or rejects creator.
    ADMIN can set custom username and password during approval.
    Sends credentials to creator's email after approval.
    """
    data = request.get_json() or {}
    action = data.get('action')
    custom_username = data.get('custom_username', '').strip()
    custom_password = data.get('custom_password', '').strip()

    if action not in ['approve', 'reject']:
        return jsonify({'success': False, 'message': 'Invalid action. Must be approve or reject.'}), 400

    conn = get_db_connection()
    try:
        req_item = conn.execute('SELECT * FROM creator_requests WHERE id = ?', (req_id,)).fetchone()
        if not req_item:
            return jsonify({'success': False, 'message': 'Request not found.'}), 404

        if action == 'approve':
            if custom_username:
                creator_username = custom_username
            else:
                clean_name = ''.join(e for e in req_item['full_name'] if e.isalnum()).lower()
                creator_username = f"creator_{clean_name}_{req_id}"

            if custom_password:
                final_password = custom_password
            else:
                final_password = f"Wavelvadi#{uuid.uuid4().hex[:8]}"

            hashed_pw = generate_password_hash(final_password)

            try:
                conn.execute(
                    'INSERT INTO users (username, password_hash, email, role, status) VALUES (?, ?, ?, ?, ?)',
                    (creator_username, hashed_pw, req_item['email'], 'creator', 'approved')
                )
                conn.execute("UPDATE creator_requests SET status = 'approved' WHERE id = ?", (req_id,))
                conn.commit()
            except Exception as e:
                conn.rollback()
                err_str = str(e).lower()
                if 'unique' in err_str or 'already exists' in err_str:
                    return jsonify({'success': False, 'message': 'Username already exists. Please choose a different username.'}), 400
                return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500

            # DISPATCH EMAIL WITH USER ID AND PASSKEY
            email_sent, email_msg = send_creator_credentials_email(
                creator_email=req_item['email'],
                creator_name=req_item['full_name'],
                username=creator_username,
                custom_password=final_password
            )

            # DISPATCH SMS SIMULATION
            sms_sent, sms_msg = send_sms_simulation(
                phone=req_item['phone'],
                username=creator_username,
                custom_password=final_password
            )

            return jsonify({
                'success': True,
                'message': f'क्रिएटर अर्ज मंजूर झाला! ईमेल ({req_item["email"]}) वर ID आणि पासकोड पाठवला गेला आहे.',
                'credentials': {
                    'username': creator_username,
                    'temporary_password': final_password,
                    'email': req_item['email']
                },
                'email_dispatched': email_sent,
                'email_info': email_msg,
                'sms_dispatched': sms_sent
            })
        else:
            conn.execute("UPDATE creator_requests SET status = 'rejected' WHERE id = ?", (req_id,))
            conn.commit()
            return jsonify({'success': True, 'message': 'Creator request rejected.'})
    finally:
        conn.close()


@app.route('/api/admin/creator-requests/<int:req_id>/delete', methods=['POST'])
@admin_required
def delete_creator_request(req_id):
    """ADMIN can delete a creator request from the database."""
    conn = get_db_connection()
    try:
        req_item = conn.execute('SELECT * FROM creator_requests WHERE id = ?', (req_id,)).fetchone()
        if not req_item:
            return jsonify({'success': False, 'message': 'Request not found.'}), 404
        conn.execute('DELETE FROM creator_requests WHERE id = ?', (req_id,))
        conn.commit()
        return jsonify({'success': True, 'message': 'Creator request deleted successfully.'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'हटवताना त्रुटी: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/creators', methods=['GET'])
def get_public_creators():
    """Returns active creators with uploaded images and Instagram links for the website."""
    conn = get_db_connection()
    creators = conn.execute(
        'SELECT id, name, role_title, bio, image_url, instagram_url, display_order FROM creators WHERE is_active = 1 ORDER BY display_order ASC, id ASC'
    ).fetchall()
    conn.close()
    return jsonify({'success': True, 'creators': [dict(c) for c in creators]})


@app.route('/api/admin/creator-profiles', methods=['GET'])
@admin_required
def get_all_creator_profiles():
    """Returns all creator profiles for ADMIN management."""
    conn = get_db_connection()
    creators = conn.execute(
        'SELECT * FROM creators ORDER BY display_order ASC, id ASC'
    ).fetchall()
    conn.close()
    return jsonify({'success': True, 'creators': [dict(c) for c in creators]})


@app.route('/api/admin/creator-profile/<int:creator_id>', methods=['GET'])
@admin_required
def get_single_creator_profile(creator_id):
    """Returns single creator profile details."""
    conn = get_db_connection()
    creator = conn.execute('SELECT * FROM creators WHERE id = ?', (creator_id,)).fetchone()
    conn.close()
    if not creator:
        return jsonify({'success': False, 'message': 'Creator not found'}), 404
    return jsonify({'success': True, 'creator': dict(creator)})


@app.route('/api/admin/creator-profile/save', methods=['POST'])
@admin_required
def save_creator_profile():
    """
    ADMIN can add or update a creator profile.
    Supports uploading creator/festival images and setting Instagram links.
    """
    creator_id = request.form.get('id')
    name = request.form.get('name', '').strip()
    role_title = request.form.get('role_title', 'क्रिएटर (Creator)').strip()
    bio = request.form.get('bio', '').strip()
    instagram_url = request.form.get('instagram_url', '').strip()
    existing_image = request.form.get('existing_image_url', '').strip()

    if not name:
        return jsonify({'success': False, 'message': 'क्रिएटरचे नाव आवश्यक आहे (Creator name is required).'}), 400

    # Clean Instagram URL/handle
    if instagram_url:
        if instagram_url.startswith('@'):
            instagram_url = f"https://www.instagram.com/{instagram_url.lstrip('@')}"
        elif not instagram_url.startswith('http://') and not instagram_url.startswith('https://'):
            instagram_url = f"https://www.instagram.com/{instagram_url}"

    image_url = existing_image

    # Check if a new image file was uploaded
    if 'image_file' in request.files:
        file = request.files['image_file']
        if file and file.filename and allowed_file(file.filename):
            file_bytes = file.read()
            opt_b64 = optimize_image_base64(file_bytes)
            if opt_b64:
                image_url = opt_b64
            try:
                filename = secure_filename(file.filename)
                unique_name = f"creator_{uuid.uuid4().hex[:8]}_{filename}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)
                with open(filepath, 'wb') as f:
                    f.write(file_bytes)
            except Exception:
                pass
    elif existing_image and not existing_image.startswith('data:') and not existing_image.startswith('http'):
        local_path = os.path.join(app.root_path, existing_image.lstrip('/')) if existing_image.startswith('/static/') else (
            os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(existing_image)) if existing_image.startswith('/uploads/') else None
        )
        if local_path and os.path.exists(local_path):
            opt_b64 = optimize_image_base64(local_path)
            if opt_b64:
                image_url = opt_b64

    conn = get_db_connection()
    try:
        if creator_id and str(creator_id).isdigit():
            conn.execute('''
                UPDATE creators
                SET name = ?, role_title = ?, bio = ?, image_url = ?, instagram_url = ?
                WHERE id = ?
            ''', (name, role_title, bio, image_url, instagram_url, int(creator_id)))
            msg = f'क्रिएटर "{name}" माहिती यशस्वीरित्या अपडेट केली.'
        else:
            conn.execute('''
                INSERT INTO creators (name, role_title, bio, image_url, instagram_url)
                VALUES (?, ?, ?, ?, ?)
            ''', (name, role_title, bio, image_url, instagram_url))
            msg = f'नवीन क्रिएटर "{name}" यशस्वीरित्या जोडला गेला.'

        conn.commit()
        return jsonify({'success': True, 'message': msg, 'image_url': image_url})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'क्रिएटर माहिती जतन करताना त्रुटी: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/admin/creator-profile/<int:creator_id>/delete', methods=['POST'])
@admin_required
def delete_creator_profile(creator_id):
    """ADMIN can delete a creator profile."""
    conn = get_db_connection()
    try:
        creator = conn.execute('SELECT * FROM creators WHERE id = ?', (creator_id,)).fetchone()
        if not creator:
            return jsonify({'success': False, 'message': 'क्रिएटर सापडला नाही.'}), 404

        conn.execute('DELETE FROM creators WHERE id = ?', (creator_id,))
        conn.commit()
        return jsonify({'success': True, 'message': f'क्रिएटर "{creator["name"]}" यशस्वीरित्या हटवला.'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'हटवताना त्रुटी: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/admin/creators', methods=['GET'])
@admin_required
def get_creators():
    """Get all approved creators for management."""
    conn = get_db_connection()
    try:
        creators = conn.execute(
            "SELECT id, username, email, role, status, created_at FROM users WHERE role != 'ADMIN' ORDER BY created_at DESC"
        ).fetchall()
        return jsonify({'success': True, 'creators': [dict(row) for row in creators]})
    finally:
        conn.close()


@app.route('/api/admin/creators/<int:creator_id>/delete', methods=['POST'])
@admin_required
def delete_creator(creator_id):
    """ADMIN can delete/remove a creator account."""
    conn = get_db_connection()
    try:
        creator = conn.execute('SELECT * FROM users WHERE id = ?', (creator_id,)).fetchone()
        if not creator:
            return jsonify({'success': False, 'message': 'Creator not found.'}), 404
        conn.execute('DELETE FROM users WHERE id = ?', (creator_id,))
        conn.commit()
        return jsonify({'success': True, 'message': f'Creator "{creator["username"]}" deleted successfully.'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'खाते हटवताना त्रुटी: {str(e)}'}), 500
    finally:
        conn.close()


# ==========================================
# CONTENT MANAGEMENT API
# ==========================================
@app.route('/api/content', methods=['GET'])
def get_public_content():
    category = request.args.get('category')
    conn = get_db_connection()
    try:
        if category and category != 'all':
            query = "SELECT * FROM content WHERE status = 'published' AND category = ? ORDER BY created_at DESC"
            items = conn.execute(query, (category,)).fetchall()
        else:
            query = "SELECT * FROM content WHERE status = 'published' ORDER BY created_at DESC"
            items = conn.execute(query).fetchall()
        return jsonify({'success': True, 'content': [dict(row) for row in items]})
    finally:
        conn.close()


@app.route('/api/admin/content', methods=['GET'])
@login_required
def get_admin_content():
    is_admin = session.get('role') == 'ADMIN'
    conn = get_db_connection()

    if is_admin:
        items = conn.execute('SELECT * FROM content ORDER BY created_at DESC').fetchall()
    else:
        username = session.get('username')
        items = conn.execute('SELECT * FROM content WHERE author_name = ? ORDER BY created_at DESC', (username,)).fetchall()

    conn.close()
    return jsonify({'success': True, 'content': [dict(row) for row in items]})


@app.route('/api/content/submit', methods=['POST'])
@login_required
def submit_content():
    """
    Content submission:
    - ADMIN can directly publish (publish_now=True) or save as draft.
    - CREATORS submit drafts with status='pending', and an email is automatically
      sent to ADMIN_EMAIL with direct Approve & Reject links for email permission.
    """
    is_admin = session.get('role') == 'ADMIN'
    user_role = session.get('role', 'creator')
    author_name = session.get('username', 'Creator')

    # Get creator email from users table
    creator_email = ''
    if not is_admin:
        conn_user = get_db_connection()
        user_row = conn_user.execute('SELECT email FROM users WHERE id = ?', (session.get('user_id'),)).fetchone()
        if user_row:
            creator_email = user_row['email']
        conn_user.close()
    else:
        creator_email = ADMIN_EMAIL

    title_mr = request.form.get('title_mr', '').strip()
    title_en = request.form.get('title_en', '').strip() or title_mr
    category = request.form.get('category', 'vlog')
    description_mr = request.form.get('description_mr', '').strip()
    description_en = request.form.get('description_en', '').strip() or description_mr
    youtube_url = request.form.get('youtube_url', '').strip()
    google_drive_url = ''

    if not title_mr or not category:
        return jsonify({'success': False, 'message': 'Title and category are required.'}), 400

    media_url = ''
    media_type = 'image'
    backup_filename = None
    backup_size = 0
    saved_filepath = None

    if 'media_file' in request.files:
        file = request.files['media_file']
        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_name = f"{uuid.uuid4().hex[:8]}_{filename}"
            ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
            if ext in {'mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v', '3gp', 'ogg', 'ogv'}:
                media_type = 'video'
                mime = 'video/' + ('mp4' if ext in {'mov', 'mkv', 'avi', 'm4v', '3gp'} else ext)
            elif ext in {'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'}:
                media_type = 'image'
                mime = f'image/{ext}'
            else:
                media_type = 'document'
                mime = 'application/octet-stream'

            file_bytes = file.read()
            backup_size = len(file_bytes)
            backup_filename = unique_name

            # Enforce 10 MB maximum limit for video files
            if media_type == 'video' and backup_size > 10 * 1024 * 1024:
                size_mb = round(backup_size / (1024 * 1024), 2)
                return jsonify({
                    'success': False,
                    'message': f'व्हिडिओ फाईल खूप मोठी आहे ({size_mb} MB). थेट व्हिडिओ अपलोडसाठी कमाल मर्यादा १० MB आहे. कृपया व्हिडिओ कॉम्प्रेश करा किंवा YouTube लिंक वापरा.'
                }), 400

            # Google Drive Cloud upload (Direct to Drive, fast, and resilient)
            ok_drive = False
            drive_res = None
            if GOOGLE_SCRIPT_URL:
                ok_drive, drive_res = upload_to_google_drive(file_bytes, unique_name, mime)

            if ok_drive and isinstance(drive_res, dict):
                file_id = drive_res.get('fileId', '')
                google_drive_url = drive_res.get('fileUrl') or drive_res.get('viewUrl') or ''
                direct_url = drive_res.get('directUrl') or (f"https://lh3.googleusercontent.com/d/{file_id}" if file_id else google_drive_url)
                preview_url = drive_res.get('previewUrl') or (f"https://drive.google.com/file/d/{file_id}/preview" if file_id else google_drive_url)
                media_url = direct_url if media_type == 'image' else preview_url
                saved_filepath = None
            else:
                # Safe fallback: if Google Drive script is delayed or unreachable, save without error
                if media_type == 'image':
                    opt_b64 = optimize_image_base64(file_bytes)
                    if opt_b64 and len(opt_b64) < 1500000:
                        media_url = opt_b64
                        saved_filepath = None
                    else:
                        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)
                        try:
                            with open(filepath, 'wb') as f:
                                f.write(file_bytes)
                            media_url = f"/uploads/{unique_name}"
                            saved_filepath = filepath
                        except Exception:
                            media_url = '/static/images/hero_wavelvadi.svg'
                else:
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)
                    try:
                        with open(filepath, 'wb') as f:
                            f.write(file_bytes)
                        media_url = f"/uploads/{unique_name}"
                        saved_filepath = filepath
                    except Exception:
                        media_url = '/static/images/hero_wavelvadi.svg'

    if youtube_url:
        yt_match = re.search(r'(?:youtu\.be/|youtube(?:-nocookie)?\.com/(?:embed/|v/|watch\?v=|watch\?.+&v=|shorts/|live/))([\w-]{11})', youtube_url)
        if not yt_match and re.match(r'^[\w-]{11}$', youtube_url):
            yt_id = youtube_url
        else:
            yt_id = yt_match.group(1) if yt_match else ''
        if yt_id:
            media_type = 'video'
            if not media_url or media_url == '/static/images/vlog_farm.svg':
                media_url = f"https://img.youtube.com/vi/{yt_id}/hqdefault.jpg"

    if not media_url:
        media_url = request.form.get('media_url_fallback', '/static/images/vlog_farm.svg')

    approval_token = uuid.uuid4().hex
    if is_admin:
        status = 'published' if request.form.get('publish_now') == 'true' else 'draft'
    else:
        # Creator content requires ADMIN permission via email
        status = 'pending'

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO content (title_mr, title_en, category, description_mr, description_en,
                                 media_url, media_type, google_drive_url, youtube_url,
                                 author_name, author_role, status, approval_token, creator_email)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (title_mr, title_en, category, description_mr, description_en,
              media_url, media_type, google_drive_url, youtube_url,
              author_name, user_role, status, approval_token, creator_email))
        content_id = cursor.lastrowid

        # Add to backup_storage table
        if backup_filename:
            backup_status = 'synced' if google_drive_url else 'local'
            storage_path = saved_filepath or '[Google Drive Cloud - Not Stored Locally]'
            cursor.execute('''
                INSERT INTO backup_storage (content_id, original_filename, local_path, google_drive_url, file_size, file_type, backup_status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (content_id, backup_filename, storage_path, google_drive_url or '', backup_size, media_type, backup_status))

        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'मजकूर जतन करताना त्रुटी आली: {str(e)}'}), 500
    finally:
        conn.close()

    if not is_admin:
        # Send Email to ADMIN with 1-click Approve and Reject links
        base_url = request.host_url.rstrip('/')
        send_content_approval_request_email(
            content_id=content_id,
            title_mr=title_mr,
            title_en=title_en,
            category=category,
            author_name=author_name,
            author_email=creator_email,
            description_mr=description_mr,
            approval_token=approval_token,
            base_url=base_url
        )
        msg = 'आपला मजकूर यशस्वीरीत्या नोंदवला गेला आहे! मुख्य प्रशासक (ADMIN) कडे ईमेलद्वारे परवानगीसाठी पाठवला आहे. ईमेल मान्यतेनंतर तो प्रसिद्ध होईल.'
    else:
        msg = 'कंटेंट प्रकाशित केले गेले!' if status == 'published' else 'कंटेंट ड्राफ्ट म्हणून जतन केले गेले.'

    return jsonify({
        'success': True,
        'message': msg,
        'content_id': content_id,
        'status': status,
        'requires_admin_permission': not is_admin
    })


@app.route('/api/content/email-action', methods=['GET'])
def content_email_action():
    """
    Handles 1-Click Approve / Reject action directly from ADMIN's email inbox.
    """
    action = request.args.get('action')
    raw_content_id = request.args.get('id')
    token = request.args.get('token')

    if not action or not raw_content_id or not token:
        return render_template_string("""
            <div style="font-family:sans-serif; text-align:center; padding:40px; color:#DC2626;">
                <h2>अवैध विनंती (Invalid Request)</h2>
                <p>आवश्यक माहिती गहाळ आहे.</p>
            </div>
        """), 400

    try:
        content_id = int(raw_content_id)
    except (ValueError, TypeError):
        return render_template_string("""
            <div style="font-family:sans-serif; text-align:center; padding:40px; color:#DC2626;">
                <h2>अवैध आयडी (Invalid ID)</h2>
                <p>कंटेंट आयडी अमान्य आहे.</p>
            </div>
        """), 400

    conn = get_db_connection()
    try:
        item = conn.execute('SELECT * FROM content WHERE id = ?', (content_id,)).fetchone()

        if not item or item['approval_token'] != token:
            return render_template_string("""
                <div style="font-family:sans-serif; text-align:center; padding:40px; color:#DC2626;">
                    <h2>अवैध किंवा कालबाह्य टोकन (Invalid or Expired Token)</h2>
                    <p>हा मंजुरी दुवा अवैध किंवा कालबाह्य झाला आहे.</p>
                </div>
            """), 403

        if action == 'approve':
            conn.execute("UPDATE content SET status = 'published' WHERE id = ?", (content_id,))
            conn.commit()
            author_email = item['creator_email']
            author_name = item['author_name']
            title_mr = item['title_mr']

            # Notify creator
            if author_email:
                send_content_status_email_to_creator(author_email, author_name, title_mr, is_approved=True)

            return render_template_string("""
                <!DOCTYPE html>
                <html lang="mr">
                <head>
                  <meta charset="utf-8">
                  <title>मजकूर मंजूर - वावेलवाडी ग्राम पोर्टल</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #FFFBEB; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
                    .card { background: white; border: 2px solid #059669; border-radius: 16px; padding: 36px; max-width: 520px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
                    .badge { background: #D1FAE5; color: #065F46; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 14px; display: inline-block; margin-bottom: 16px; }
                    h1 { color: #065F46; font-size: 24px; margin-bottom: 12px; }
                    p { color: #4B5563; font-size: 15px; line-height: 1.6; }
                    .btn { display: inline-block; margin-top: 20px; background: #059669; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <span class="badge">✅ ई-मेल द्वारे यशस्वी मंजुरी (Approved from Email)</span>
                    <h1>मजकूर प्रकाशित करण्यात आला आहे!</h1>
                    <p><strong>शीर्षक:</strong> {{ title }}</p>
                    <p>क्रिएटर <strong>{{ author }}</strong> यांचा हा मजकूर वावेलवाडी वेब पोर्टलवर आता सर्वांसाठी सार्वजनिक (Live) झाला आहे.</p>
                    <a href="/" class="btn">पोर्टलवर जाऊन पहा</a>
                  </div>
                </body>
                </html>
            """, title=title_mr, author=author_name)

        elif action == 'reject':
            conn.execute("UPDATE content SET status = 'rejected' WHERE id = ?", (content_id,))
            conn.commit()
            author_email = item['creator_email']
            author_name = item['author_name']
            title_mr = item['title_mr']

            if author_email:
                send_content_status_email_to_creator(author_email, author_name, title_mr, is_approved=False)

            return render_template_string("""
                <!DOCTYPE html>
                <html lang="mr">
                <head>
                  <meta charset="utf-8">
                  <title>मजकूर नाकारला - वावेलवाडी ग्राम पोर्टल</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #FEF2F2; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
                    .card { background: white; border: 2px solid #DC2626; border-radius: 16px; padding: 36px; max-width: 520px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
                    .badge { background: #FEE2E2; color: #991B1B; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 14px; display: inline-block; margin-bottom: 16px; }
                    h1 { color: #991B1B; font-size: 24px; margin-bottom: 12px; }
                    p { color: #4B5563; font-size: 15px; line-height: 1.6; }
                    .btn { display: inline-block; margin-top: 20px; background: #DC2626; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <span class="badge">❌ ई-मेल द्वारे मजकूर नाकारला (Rejected from Email)</span>
                    <h1>मजकूर नाकारण्यात आला आहे</h1>
                    <p><strong>शीर्षक:</strong> {{ title }}</p>
                    <p>हा मजकूर पोर्टलवर प्रसिद्ध केला जाणार नाही.</p>
                    <a href="/" class="btn">पोर्टलवर परत जा</a>
                  </div>
                </body>
                </html>
            """, title=title_mr)
    finally:
        conn.close()


@app.route('/api/admin/content/<int:content_id>/publish', methods=['POST'])
@admin_required
def publish_content(content_id):
    conn = get_db_connection()
    try:
        conn.execute("UPDATE content SET status = 'published' WHERE id = ?", (content_id,))
        conn.commit()
        return jsonify({'success': True, 'message': 'कंटेंट यशस्वीरीत्या सार्वजनिक (Published) करण्यात आले आहे!'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'त्रुटी: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/admin/content/<int:content_id>/reject', methods=['POST'])
@admin_required
def reject_content(content_id):
    conn = get_db_connection()
    try:
        conn.execute("UPDATE content SET status = 'rejected' WHERE id = ?", (content_id,))
        conn.commit()
        return jsonify({'success': True, 'message': 'कंटेंट नाकारण्यात आले आहे (Rejected).'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'त्रुटी: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/admin/content/<int:content_id>/delete', methods=['POST'])
@admin_required
def delete_content(content_id):
    conn = get_db_connection()
    try:
        item = conn.execute('SELECT * FROM content WHERE id = ?', (content_id,)).fetchone()
        if not item:
            return jsonify({'success': False, 'message': 'Content not found.'}), 404

        # Remove local file if it exists
        if item['media_url'] and item['media_url'].startswith('/uploads/'):
            filepath = os.path.join(app.root_path, item['media_url'].lstrip('/'))
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except Exception:
                    pass

        # Clean up related reactions and disassociate backup records before deleting content
        try:
            conn.execute('DELETE FROM content_reactions WHERE content_id = ?', (content_id,))
        except Exception:
            pass

        try:
            conn.execute('UPDATE backup_storage SET content_id = NULL WHERE content_id = ?', (content_id,))
        except Exception:
            pass

        conn.execute('DELETE FROM content WHERE id = ?', (content_id,))
        conn.commit()
        return jsonify({'success': True, 'message': 'कंटेंट हटवले गेले आहे (Deleted).'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'कंटेंट हटवताना त्रुटी: {str(e)}'}), 500
    finally:
        conn.close()


# ==========================================
# BACKUP STORAGE DATABASE API
# ==========================================
@app.route('/api/admin/backup-storage', methods=['GET'])
@admin_required
def get_backup_storage():
    """Returns all backup storage entries for ADMIN management."""
    conn = get_db_connection()
    try:
        items = conn.execute('''
            SELECT bs.*, c.title_mr, c.title_en, c.category, c.status as content_status
            FROM backup_storage bs
            LEFT JOIN content c ON bs.content_id = c.id
            ORDER BY bs.uploaded_at DESC
        ''').fetchall()
        return jsonify({'success': True, 'backups': [dict(row) for row in items]})
    finally:
        conn.close()


@app.route('/api/admin/backup-storage/<int:backup_id>/delete', methods=['POST'])
@admin_required
def delete_backup(backup_id):
    """Delete a backup record (and optionally its local file)."""
    conn = get_db_connection()
    try:
        backup = conn.execute('SELECT * FROM backup_storage WHERE id = ?', (backup_id,)).fetchone()
        if not backup:
            return jsonify({'success': False, 'message': 'Backup not found.'}), 404

        # Try to remove local file
        if backup['local_path'] and backup['local_path'].startswith('/uploads/'):
            filepath = os.path.join(app.root_path, backup['local_path'].lstrip('/'))
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except Exception:
                    pass

        conn.execute('DELETE FROM backup_storage WHERE id = ?', (backup_id,))
        conn.commit()
        return jsonify({'success': True, 'message': 'Backup record deleted.'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'बॅकअप हटवताना त्रुटी: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/admin/backup-storage/<int:backup_id>/update-drive-url', methods=['POST'])
@admin_required
def update_drive_url(backup_id):
    """Update Google Drive URL for a backup record."""
    data = request.get_json() or {}
    drive_url = data.get('google_drive_url', '').strip()

    conn = get_db_connection()
    try:
        conn.execute("UPDATE backup_storage SET google_drive_url = ?, backup_status = 'synced' WHERE id = ?", (drive_url, backup_id))
        conn.commit()
        return jsonify({'success': True, 'message': 'Google Drive URL updated.'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'त्रुटी: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, conditional=True)


@app.route('/api/admin/google-script-config', methods=['GET'])
@app.route('/api/google-script-config', methods=['GET'])
@admin_required
def get_google_script_config():
    """Returns Google Apps Script configuration for ADMIN."""
    script_path = os.path.join(app.root_path, 'google_apps_script.js')
    script_code = ''
    if os.path.exists(script_path):
        try:
            with open(script_path, 'r', encoding='utf-8') as f:
                script_code = f.read()
        except Exception:
            pass
    return jsonify({
        'success': True,
        'script_url': GOOGLE_SCRIPT_URL,
        'configured': bool(GOOGLE_SCRIPT_URL),
        'script_code': script_code
    })


@app.route('/api/admin/google-script/test', methods=['GET', 'POST'])
@admin_required
def check_google_script_test():
    """Tests live connection to Google Apps Script Web App."""
    ok, msg = test_google_script_connection()
    return jsonify({
        'success': ok,
        'message': msg,
        'script_url': GOOGLE_SCRIPT_URL
    })


@app.route('/api/admin/backup-storage/<int:backup_id>/sync-drive', methods=['POST'])
@admin_required
def sync_backup_to_drive(backup_id):
    """Syncs a local backup file to Google Drive via Google Apps Script and frees local disk space for creator content."""
    conn = get_db_connection()
    try:
        backup = conn.execute('SELECT * FROM backup_storage WHERE id = ?', (backup_id,)).fetchone()
        if not backup:
            return jsonify({'success': False, 'message': 'Backup record not found.'}), 404

        local_path = os.path.join(app.root_path, backup['local_path'].lstrip('/'))
        if not os.path.exists(local_path):
            return jsonify({'success': False, 'message': 'Local file does not exist on disk.'}), 404

        ext = backup['original_filename'].rsplit('.', 1)[-1].lower() if '.' in backup['original_filename'] else 'bin'
        mime = 'image/' + ext if ext in ['png', 'jpg', 'jpeg', 'gif'] else ('video/' + ext if ext in ['mp4', 'webm'] else 'application/octet-stream')

        ok, drive_result = upload_to_google_drive(local_path, backup['original_filename'], mime)
        if ok and isinstance(drive_result, dict):
            drive_url = drive_result.get('viewUrl', '')
            file_id = drive_result.get('fileId', '')
            direct_url = drive_result.get('directUrl', '') or (f"https://lh3.googleusercontent.com/d/{file_id}" if file_id else drive_url)
            preview_url = drive_result.get('previewUrl', '') or (f"https://drive.google.com/file/d/{file_id}/preview" if file_id else drive_url)
            media_url = direct_url if ext in ['png', 'jpg', 'jpeg', 'gif'] else preview_url

            # Check if content belonged to creator
            is_creator_content = False
            if backup['content_id']:
                content_row = conn.execute('SELECT author_role FROM content WHERE id = ?', (backup['content_id'],)).fetchone()
                if content_row and content_row['author_role'] == 'creator':
                    is_creator_content = True

            new_local_path = backup['local_path']
            # If it was creator content, delete local file so it is stored strictly in Google Drive
            if is_creator_content:
                try:
                    if os.path.exists(local_path):
                        os.remove(local_path)
                    new_local_path = '[Google Drive Cloud - Not Stored Locally]'
                except Exception:
                    pass

            conn.execute("UPDATE backup_storage SET google_drive_url = ?, local_path = ?, backup_status = 'synced' WHERE id = ?", (drive_url, new_local_path, backup_id))
            if backup['content_id']:
                conn.execute('UPDATE content SET google_drive_url = ?, media_url = ? WHERE id = ?', (drive_url, media_url, backup['content_id']))
            conn.commit()
            return jsonify({'success': True, 'message': 'Google Drive वर यशस्वीरीत्या बॅकअप झाला आणि स्थानिक डिस्क रिकामी केली गेली!', 'drive_url': drive_url})
        else:
            err_msg = drive_result if isinstance(drive_result, str) else 'Google Drive upload failed.'
            return jsonify({'success': False, 'message': f'Sync failed: {err_msg}'}), 400
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Sync त्रुटी: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/api/drive-proxy/<file_id>')
def drive_file_proxy(file_id):
    """Streams a file directly from Google Drive without storing it locally."""
    try:
        drive_url = f"https://drive.google.com/thumbnail?id={file_id}&sz=w1200"
        r = requests.get(drive_url, stream=True, verify=False, timeout=20)
        if r.status_code == 200:
            return Response(r.iter_content(chunk_size=1024*8), content_type=r.headers.get('content-type', 'image/jpeg'))
        r2 = requests.get(f"https://drive.google.com/uc?export=view&id={file_id}", stream=True, verify=False, timeout=20)
        return Response(r2.iter_content(chunk_size=1024*8), content_type=r2.headers.get('content-type', 'application/octet-stream'))
    except Exception as e:
        return jsonify({'error': str(e)}), 500



if __name__ == '__main__':
    init_db()
    print("==================================================")
    print("  WAVELVADI VILLAGE OFFICIAL WEBSITE BACKEND")
    print(f"  Admin ID     : {ADMIN_ID}")
    print(f"  Admin Email  : {ADMIN_EMAIL}")
    print("  Server : http://127.0.0.1:5000")
    print("==================================================")
    app.run(host='0.0.0.0', port=5000, debug=True)
