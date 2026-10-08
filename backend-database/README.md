# BengalBet & NeextPlay - MySQL Database Backend System (PHP)

Complete backend database API and auto-process system ready for hosting on your server (`https://deserver.neexthub.site` or `http://localhost/backend-database/`).

---

## 📁 Directory Structure

```
backend-database/
├── index.php                 # Web dashboard & connection status monitor
├── process.php               # ⭐ MASTER PROCESS URL (Auto-creates & updates both DBs)
├── README.md                 # Setup manual & API documentation
├── common/
│   ├── cors.php              # Cross-Origin headers for all domains
│   └── db_helper.php         # PDO connection & JSON response helpers
├── bengalbet/
│   ├── config.php            # BengalBet DB credentials (bengalbet_db)
│   ├── schema.sql            # Full 15-table SQL schema
│   ├── process.php           # Dedicated BengalBet auto-update process
│   └── api.php               # BengalBet REST API
└── neextplay/
    ├── config.php            # NeextPlay DB credentials (neextplay_db)
    ├── schema.sql            # Full 10-table B2B SQL schema
    ├── process.php           # Dedicated NeextPlay auto-update process
    └── api.php               # NeextPlay B2B Master REST API
```

---

## ⚡ 1. The Master Process URL

Running **one single URL** automatically creates both databases, verifies and builds all tables, checks columns, and seeds default records:

### In Browser:
Open: `http://localhost/backend-database/process.php` (or `http://localhost/process.php` if deployed at root)

### Via Terminal / cURL:
```bash
curl -X POST "http://localhost/backend-database/process.php?format=json"
```

### JSON Response:
```json
{
  "success": true,
  "timestamp": "2026-10-08 10:50:00",
  "message": "All databases, tables, and rows have been successfully processed and synchronized!",
  "execution_time_ms": 14.2,
  "databases": {
    "bengalbet": {
      "database": "bengalbet_db",
      "tables_count": 15,
      "status": "success"
    },
    "neextplay": {
      "database": "neextplay_db",
      "tables_count": 10,
      "status": "success"
    }
  }
}
```

---

## 🛠️ 2. Hosting in XAMPP (Windows/Mac/Linux)

1. Start **Apache** and **MySQL** in XAMPP Control Panel.
2. Copy the `backend-database` folder into your XAMPP `htdocs` directory:
   - Path: `C:\xampp\htdocs\backend-database` (or copy contents directly into `C:\xampp\htdocs\`)
3. Visit `http://localhost/backend-database/` or `http://localhost/` in your browser.
4. Click **"Run Master Process URL"** — both `bengalbet_db` and `neextplay_db` will be created automatically in your MySQL!

---

## 🌐 3. Database Credentials & Configuration

Default settings in `bengalbet/config.php` and `neextplay/config.php`:
- **Host**: `127.0.0.1` (or `localhost`)
- **Port**: `3306`
- **User**: `root`
- **Password**: *(empty by default in XAMPP)*
- **Databases**:
  - BengalBet: `bengalbet_db`
  - NeextPlay: `neextplay_db`

You can customize credentials via environment variables:
`BENGALBET_DB_HOST`, `BENGALBET_DB_USER`, `BENGALBET_DB_PASS`, `BENGALBET_DB_NAME`
`NEEXTPLAY_DB_HOST`, `NEEXTPLAY_DB_USER`, `NEEXTPLAY_DB_PASS`, `NEEXTPLAY_DB_NAME`

---

## 📡 4. REST API Endpoints

### BengalBet API: `http://localhost/backend-database/bengalbet/api.php`
- `action=ping`
- `action=stats`
- `action=get_users`
- `action=get_user&id={id}`
- `action=save_user`
- `action=update_balance`
- `action=get_transactions`
- `action=create_transaction`
- `action=update_transaction`
- `action=get_bets`
- `action=record_bet`
- `action=get_vip_tiers`
- `action=get_settings`
- `action=update_settings`

### NeextPlay B2B API: `http://localhost/backend-database/neextplay/api.php`
- `action=ping`
- `action=stats`
- `action=get_operators`
- `action=save_operator`
- `action=get_players`
- `action=get_player_balance`
- `action=update_player_balance`
- `action=create_session`
- `action=verify_session`
- `action=get_win_controls`
- `action=save_win_controls`
- `action=get_games`
