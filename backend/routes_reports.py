"""Dashboard and chart/report routes."""

from collections import defaultdict
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query

from auth import get_current_user_id
from database import supabase

router = APIRouter(prefix="/reports", tags=["Reports"])


def _rows(table: str, user_id: str, columns: str = "*") -> list[dict]:
    response = supabase.table(table).select(columns).eq("user_id", user_id).execute()
    return response.data or []


def _month_label(value: str | None) -> str:
    # Supabase returns date as YYYY-MM-DD. Keeping YYYY-MM makes chart grouping simple.
    return value[:7] if value else "Unknown"


def _current_month_bounds() -> tuple[str, str]:
    today = date.today()
    month_start = today.replace(day=1)
    return str(month_start), str(today)


def _financial_health(total_income: float, total_expense: float, current_month_income: float, current_month_expense: float, top_category_total: float) -> dict:
    balance = total_income - total_expense
    savings_rate = (balance / total_income) if total_income else 0
    month_savings_rate = ((current_month_income - current_month_expense) / current_month_income) if current_month_income else 0
    concentration = (top_category_total / total_expense) if total_expense else 0

    score = 420
    score += max(-0.5, min(0.6, savings_rate)) * 420
    score += max(-0.5, min(0.6, month_savings_rate)) * 260
    score += 160 if balance >= 0 else -220
    score -= 90 if concentration > 0.45 else 0
    score -= 120 if current_month_income > 0 and current_month_expense > current_month_income else 0
    score = max(0, min(1000, round(score)))

    label = "Needs focus"
    if score >= 850:
        label = "Excellent"
    elif score >= 700:
        label = "Strong"
    elif score >= 550:
        label = "Stable"
    elif score >= 400:
        label = "Risky"

    return {
        "score": score,
        "label": label,
        "savings_rate": round(savings_rate * 100, 2),
        "month_savings_rate": round(month_savings_rate * 100, 2),
        "top_category_concentration": round(concentration * 100, 2),
    }


@router.get("/overview")
def overview(user_id: str = Depends(get_current_user_id)):
    today = date.today()
    month_start = today.replace(day=1)

    expenses = _rows("expenses", user_id, "amount, category, expense_date")
    incomes = _rows("income", user_id, "amount, source, income_date")

    total_expense = sum(float(row["amount"]) for row in expenses)
    total_income = sum(float(row["amount"]) for row in incomes)

    current_month_expense = sum(
        float(row["amount"])
        for row in expenses
        if str(month_start) <= row.get("expense_date", "") <= str(today)
    )
    current_month_income = sum(
        float(row["amount"])
        for row in incomes
        if str(month_start) <= row.get("income_date", "") <= str(today)
    )

    category_totals: dict[str, float] = defaultdict(float)
    for row in expenses:
        category_totals[row.get("category") or "Other"] += float(row["amount"])

    top_category = None
    if category_totals:
        category, total = max(category_totals.items(), key=lambda item: item[1])
        top_category = {"category": category, "total": round(total, 2)}

    highest_expense = max([float(row["amount"]) for row in expenses], default=0)

    return {
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "available_balance": round(total_income - total_expense, 2),
        "savings": round(total_income - total_expense, 2),
        "current_month_income": round(current_month_income, 2),
        "current_month_expense": round(current_month_expense, 2),
        "current_month_savings": round(current_month_income - current_month_expense, 2),
        "expense_records": len(expenses),
        "income_records": len(incomes),
        "highest_expense": round(highest_expense, 2),
        "top_category": top_category,
    }


@router.get("/health")
def health(user_id: str = Depends(get_current_user_id)):
    expenses = _rows("expenses", user_id, "amount, category, expense_date")
    incomes = _rows("income", user_id, "amount, income_date")
    month_start, today = _current_month_bounds()

    total_expense = sum(float(row["amount"]) for row in expenses)
    total_income = sum(float(row["amount"]) for row in incomes)
    current_month_expense = sum(float(row["amount"]) for row in expenses if month_start <= row.get("expense_date", "") <= today)
    current_month_income = sum(float(row["amount"]) for row in incomes if month_start <= row.get("income_date", "") <= today)

    category_totals: dict[str, float] = defaultdict(float)
    for row in expenses:
        category_totals[row.get("category") or "Other"] += float(row["amount"])
    top_category_total = max(category_totals.values(), default=0)

    return _financial_health(total_income, total_expense, current_month_income, current_month_expense, top_category_total)


@router.get("/category-breakdown")
def category_breakdown(
    user_id: str = Depends(get_current_user_id),
    period: Optional[str] = Query(default=None, description="Use current_month for this month only"),
):
    expenses = _rows("expenses", user_id, "amount, category, expense_date")
    totals: dict[str, float] = defaultdict(float)
    month_start, today = _current_month_bounds()

    for row in expenses:
        if period == "current_month" and not (month_start <= row.get("expense_date", "") <= today):
            continue
        totals[row.get("category") or "Other"] += float(row["amount"])

    return {
        "category_totals": [
            {"category": category, "total": round(total, 2)}
            for category, total in sorted(totals.items(), key=lambda item: item[1], reverse=True)
        ]
    }


@router.get("/monthly-trend")
def monthly_trend(user_id: str = Depends(get_current_user_id)):
    expenses = _rows("expenses", user_id, "amount, expense_date")
    incomes = _rows("income", user_id, "amount, income_date")

    months = set()
    expense_by_month: dict[str, float] = defaultdict(float)
    income_by_month: dict[str, float] = defaultdict(float)

    for row in expenses:
        month = _month_label(row.get("expense_date"))
        months.add(month)
        expense_by_month[month] += float(row["amount"])

    for row in incomes:
        month = _month_label(row.get("income_date"))
        months.add(month)
        income_by_month[month] += float(row["amount"])

    return {
        "months": [
            {
                "month": month,
                "income": round(income_by_month[month], 2),
                "expense": round(expense_by_month[month], 2),
                "savings": round(income_by_month[month] - expense_by_month[month], 2),
            }
            for month in sorted(months)[-12:]
        ]
    }


@router.get("/recent-transactions")
def recent_transactions(
    user_id: str = Depends(get_current_user_id),
    limit: int = Query(default=10, ge=1, le=50),
):
    expenses = _rows("expenses", user_id, "id, amount, category, payment_method, description, expense_date, created_at")
    incomes = _rows("income", user_id, "id, amount, source, note, income_date, created_at")

    transactions: list[dict] = []
    for row in expenses:
        transactions.append(
            {
                "id": row["id"],
                "type": "expense",
                "amount": float(row["amount"]),
                "category": row.get("category"),
                "payment_method": row.get("payment_method"),
                "description": row.get("description"),
                "date": row.get("expense_date"),
                "created_at": row.get("created_at"),
            }
        )

    for row in incomes:
        transactions.append(
            {
                "id": row["id"],
                "type": "income",
                "amount": float(row["amount"]),
                "source": row.get("source"),
                "note": row.get("note"),
                "date": row.get("income_date"),
                "created_at": row.get("created_at"),
            }
        )

    transactions.sort(key=lambda row: (row.get("date") or "", row.get("created_at") or ""), reverse=True)

    return {"transactions": transactions[:limit]}
