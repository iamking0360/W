# 🚩 वावेलवाडी - अधिकृत ग्राम वेब पोर्टल (Wavelvadi Official Village Portal)

A premium, professional, responsive website for the village of **Wavelvadi (वावेलवाडी)**. Built exclusively using **HTML5, CSS3, Vanilla JavaScript, and Python (Flask)** to showcase village culture, traditions, history, vlogs, photo galleries, video showcases, noticeboard announcements, and future development projects.

Designed with a rich Maharashtrian heritage aesthetic featuring **natural green, earthy brown, saffron, warm cream, and warm gold colors** inspired by modern luxury design principles.

---

## 🌟 Key Features

1. **Owner and Developer Control (KING Admin)**:
   - Exclusive main owner/admin named **KING**.
   - Only KING can approve creators, review content drafts, publish content publicly, delete posts, and manage village announcements.
   - Credentials, passkeys, and email placeholders are securely managed in `.env` files.

2. **Real Email & SMS Dispatch of Creator Credentials**:
   - When KING approves a creator request in the Admin Portal, the system **automatically dispatches an email** containing the Creator's User ID and Passkey directly to the creator's registered email address.
   - Includes a mobile SMS notification dispatch helper hook.

3. **Public Visitor Access**:
   - Clean view-only experience for villagers and global visitors.
   - View village culture, history, vlogs, photos, videos, and announcements without any edit/delete permissions.

4. **Creator Request & Approval Workflow**:
   - Visitors can request creator access via the **"क्रिएटर नोंदणी अर्ज"** modal.
   - Permission requests are stored in the database and logged to KING's configured email address (`KING_EMAIL`).
   - Approved creators can log in to submit content as **Drafts**.
   - Draft content remains hidden from the public until **KING** approves and publishes it.

5. **80% Marathi & 20% English Dual Language Support**:
   - Dynamic real-time Marathi ↔ English language switcher toggle.
   - Devanagari typography (`Yatra One`, `Noto Sans Devanagari`) and English serif typography (`Playfair Display`).

6. **Future Village Development & Payment Section**:
   - Visual roadmap for solar street lighting and digital youth library projects.
   - Includes clear placeholders for **QR Code image** (`/static/images/qr_placeholder.svg`) and **UPI ID** (`wavelvadi.development@upi`).
   - Marked **"DISABLED / COMING SOON"** by default until KING configures real payment details.

---

## 📁 Project Structure

```text
wavelvadi-website/
├── app.py                  # Python Flask backend server, DB models, & real email dispatch
├── requirements.txt        # Python package dependencies (Flask, python-dotenv, Werkzeug)
├── .env.example            # Template for environment variables and KING admin passkey
├── .env                    # Local environment config (DO NOT commit to git!)
├── templates/
│   └── index.html          # Main HTML structure with modular sections & modals
├── static/
│   ├── css/
│   │   └── style.css       # Custom styling (village heritage theme palette)
│   ├── js/
│   │   └── script.js       # Dynamic language switching, API calls, & modal handler
│   ├── images/             # Vector SVG placeholders (hero, culture, vlogs, stepwell, QR)
│   └── videos/             # Video asset directory
├── uploads/                # Directory for user-uploaded media files
└── README.md               # Complete setup, administration, & security documentation
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
Ensure Python 3.8+ is installed on your system.

### 2. Installation
Navigate to the project folder and install dependencies:
```bash
cd wavelvadi-website
pip install -r requirements.txt
```

### 3. Environment Setup
Copy `.env.example` to `.env` and configure your credentials:
```bash
cp .env.example .env
```

### 4. Running the Web Application
Start the Flask application:
```bash
python app.py
```
Open your web browser and navigate to:
```text
http://127.0.0.1:5000
```

---

## 📧 Configuring Real Email Credentials Dispatch

To send actual email messages with User ID and Passkey to creators when KING approves them:
1. Open your `.env` file.
2. Fill in your SMTP settings (e.g. Gmail SMTP or custom server):
   ```env
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_specific_password
   SENDER_EMAIL=your_email@gmail.com
   ```
3. When KING clicks **Approve**, the system will immediately email the generated login credentials to the creator's inbox.

---

## 🛡️ Role-Based Access Control Matrix

| Role | View Published Content | Request Creator Access | Submit Content Drafts | Approve Creators | Publish Drafts | Delete Content |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Public Visitor** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Approved Creator**| ✅ | N/A | ✅ (Drafts Only) | ❌ | ❌ | ❌ |
| **KING (Main Admin)**| ✅ | N/A | ✅ (Direct Publish) | ✅ | ✅ | ✅ |

---

## 📜 License & Copyright
Developed exclusively for **Wavelvadi (वावेलवाडी) Village Portal**. Content owned and administered by **KING**.
