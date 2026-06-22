# Smart Expense Tracker - Level 3 Upgrade

A beginner-friendly full-stack expense tracker with a more useful financial dashboard.

## Tech Stack

- FastAPI backend
- Supabase PostgreSQL database
- Static HTML/CSS/JavaScript frontend served by FastAPI
- JWT authentication
- Postman collection for API testing

## Main Features

### Authentication

- Register
- Login
- JWT protected APIs
- Profile update
- Delete account

### Income / Salary

- Add salary multiple times
- Add freelance, bonus, business, gift, interest or other income
- Edit/delete salary records
- Search/filter salary history
- CSV export

### Expenses

- Add/edit/delete expenses
- Filter by category and date range
- Search records
- CSV export
- Expenses automatically reduce available balance in reports

### Dashboard

- Financial health score
- Savings/balance summary
- Total income and total expense
- Current month savings
- Top expense category
- Safe daily spending limit
- Recent combined transactions
- Category donut chart
- Monthly performance chart
- Money insight cards

### Goals & Budgets

- Add savings goals
- Track goal progress
- Set monthly category budgets
- Budget watch warns when spending crosses 80% or 100%

Goals, budgets, dark mode, and monthly savings target are saved in browser localStorage. This keeps the database simple for the current level.

## 1. Setup Supabase

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Copy and run `docs/database.sql`.
4. Go to **Project Settings → API**.
5. Copy:
   - `Project URL`
   - `service_role` key

Use the `service_role` key only in the backend `.env` file. Never place it in frontend JavaScript or public GitHub.

## 2. Setup Backend

```bash
cd backend
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install packages:

```bash
pip install -r requirements.txt
```

Create `.env`:

```bash
copy .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

Fill `.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SECRET_KEY=put_any_long_random_secret_here
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

Run app:

```bash
uvicorn main:app --reload
```

## 3. Open App

Frontend:

```text
http://127.0.0.1:8000
```

Swagger API docs:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/api/health
```

## 4. New API Routes

- `PUT /auth/profile` — update logged-in user's name
- `DELETE /auth/account` — delete account and all records using cascade
- `GET /reports/overview` — main dashboard totals
- `GET /reports/health` — financial health score
- `GET /reports/recent-transactions?limit=10` — combined salary and expenses
- `GET /reports/category-breakdown?period=current_month` — current month category spending
- `GET /reports/monthly-trend` — monthly income/expense/savings

## Project Structure

```text
smart-expense-supabase-level2/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── auth.py
│   ├── schemas.py
│   ├── routes_auth.py
│   ├── routes_expenses.py
│   ├── routes_income.py
│   ├── routes_reports.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── docs/
    ├── database.sql
    ├── postman_collection.json
    └── README.md
```

## Important Notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` private.
- Do not push `.env` to GitHub.
- Use Python 3.10+.
- This version uses normal HTML/CSS/JS, so there is no React build step.
