# Smart Wallet Upgrade Notes

This upgrade turns the old Level 2 tracker into a more useful Smart Wallet dashboard.

## Frontend upgrades

- New polished dashboard UI inspired by the provided design
- Financial health score gauge
- Safe daily spend card
- Top expense category card
- Recent transactions with search
- Goals progress widget
- Monthly budget watch widget
- Smart money insights
- Donut chart for category spending
- Monthly performance chart with savings line
- Expense and income pages now have search, filters, summary cards, CSV export
- New Budgets & Goals page
- New Settings page with profile update, dark mode, savings target, reset, logout, delete account

## Backend upgrades

- `PUT /auth/profile`
- `DELETE /auth/account`
- `GET /reports/health`
- `GET /reports/recent-transactions`
- `GET /reports/category-breakdown?period=current_month`

## Database

No new Supabase tables are required. Goals, budgets, theme, and savings target are stored in browser localStorage. Income and expenses remain in Supabase.
