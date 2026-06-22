const app = document.getElementById("app");
const navLinks = document.getElementById("navLinks");

const categories = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Education",
  "Medical",
  "Entertainment",
  "Rent",
  "Fuel",
  "Groceries",
  "Other",
];

const paymentMethods = ["UPI", "Cash", "Debit Card", "Credit Card", "Net Banking"];
const incomeSources = ["Salary", "Freelance", "Business", "Gift", "Bonus", "Interest", "Other"];
const chartColors = ["#2f8f8b", "#f97316", "#eab308", "#84cc16", "#14b8a6", "#a16207", "#64748b", "#ef4444", "#8b5cf6", "#06b6d4", "#f59e0b"];

const LS_KEYS = {
  token: "token",
  user: "user",
  theme: "smart_wallet_theme",
  goals: "smart_wallet_goals",
  budgets: "smart_wallet_budgets",
  prefs: "smart_wallet_preferences",
};

function getToken() {
  return localStorage.getItem(LS_KEYS.token);
}

function setToken(token) {
  localStorage.setItem(LS_KEYS.token, token);
}

function clearToken() {
  localStorage.removeItem(LS_KEYS.token);
  localStorage.removeItem(LS_KEYS.user);
}

function setUser(user) {
  localStorage.setItem(LS_KEYS.user, JSON.stringify(user || {}));
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.user) || "{}");
  } catch {
    return {};
  }
}

function getPrefs() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.prefs) || "{}");
  } catch {
    return {};
  }
}

function savePrefs(prefs) {
  localStorage.setItem(LS_KEYS.prefs, JSON.stringify(prefs || {}));
}

function defaultGoals() {
  return [
    { id: crypto.randomUUID(), name: "Emergency Fund", target: 10000, saved: 2500 },
    { id: crypto.randomUUID(), name: "New Laptop", target: 50000, saved: 8000 },
    { id: crypto.randomUUID(), name: "Vacation", target: 15000, saved: 4200 },
  ];
}

function getGoals() {
  try {
    const raw = localStorage.getItem(LS_KEYS.goals);
    if (!raw) {
      const goals = defaultGoals();
      saveGoals(goals);
      return goals;
    }
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function saveGoals(goals) {
  localStorage.setItem(LS_KEYS.goals, JSON.stringify(goals || []));
}

function getBudgets() {
  try {
    const raw = localStorage.getItem(LS_KEYS.budgets);
    if (!raw) {
      const starter = { Food: 3000, Travel: 2000, Bills: 2500, Education: 2000, Shopping: 2500 };
      saveBudgets(starter);
      return starter;
    }
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function saveBudgets(budgets) {
  localStorage.setItem(LS_KEYS.budgets, JSON.stringify(budgets || {}));
}

function money(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

function compactMoney(value) {
  const number = Number(value || 0);
  if (Math.abs(number) >= 100000) return `₹${(number / 100000).toFixed(1)}L`;
  if (Math.abs(number) >= 1000) return `₹${(number / 1000).toFixed(1)}K`;
  return money(number);
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function getMonthName() {
  return new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pct(value, total) {
  if (!Number(total)) return 0;
  return clamp((Number(value || 0) / Number(total)) * 100, 0, 999);
}

function setTheme(theme) {
  const finalTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", finalTheme);
  localStorage.setItem(LS_KEYS.theme, finalTheme);
}

function applySavedTheme() {
  setTheme(localStorage.getItem(LS_KEYS.theme) || "light");
}

async function apiRequest(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
      showNav();
      if (!location.hash.includes("login")) location.hash = "#/login";
    }
    const message = data?.detail || data?.message || "Something went wrong";
    throw new Error(message);
  }

  return data;
}

function optionList(items, selected = "") {
  return items
    .map((item) => `<option value="${escapeHTML(item)}" ${item === selected ? "selected" : ""}>${escapeHTML(item)}</option>`)
    .join("");
}

function activeClass(route) {
  const current = (location.hash || "#/dashboard").replace("#", "").split("/").filter(Boolean)[0] || "dashboard";
  return current === route ? "active" : "";
}

function showNav() {
  const token = getToken();
  const user = getUser();

  if (!token) {
    navLinks.innerHTML = `
      <a href="#/login" class="${activeClass("login")}">Login</a>
      <a class="nav-cta" href="#/register">Register</a>
    `;
    return;
  }

  navLinks.innerHTML = `
    <a class="${activeClass("dashboard")}" href="#/dashboard">▦ Dashboard</a>
    <a class="${activeClass("add-income")}" href="#/add-income">＋ Add Salary</a>
    <a class="${activeClass("add-expense")}" href="#/add-expense">− Add Expense</a>
    <a class="${activeClass("expenses")}" href="#/expenses">Records</a>
    <a class="${activeClass("income")}" href="#/income">Salary History</a>
    <a class="${activeClass("budget")}" href="#/budget">Goals</a>
    <a class="profile-chip ${activeClass("settings")}" href="#/settings"><span class="avatar-mini">${escapeHTML((user.name || "U").slice(0, 1).toUpperCase())}</span>${escapeHTML(user.name || "User")}</a>
  `;
}

function requireLogin() {
  if (!getToken()) {
    location.hash = "#/login";
    return false;
  }
  return true;
}

function showMessage(type, message) {
  return message ? `<div class="${type}">${escapeHTML(message)}</div>` : "";
}

function emptyState(title, text, action = "") {
  return `
    <div class="empty-state">
      <div class="empty-icon">🧾</div>
      <h3>${escapeHTML(title)}</h3>
      <p>${escapeHTML(text)}</p>
      ${action}
    </div>
  `;
}

function renderRegister() {
  app.innerHTML = `
    <section class="auth-shell">
      <div class="auth-card glass-card">
        <div class="mini-badge">JWT protected</div>
        <h1>Create account</h1>
        <p class="muted">Your salary, expenses, savings, and dashboard stay attached to your login only.</p>
        <div id="message"></div>
        <form id="registerForm" class="form-grid">
          <label>Name</label>
          <input name="name" placeholder="Enter your name" required minlength="2" />

          <label>Email</label>
          <input name="email" type="email" placeholder="Enter your email" required />

          <label>Password</label>
          <input name="password" type="password" placeholder="Minimum 6 characters" required minlength="6" />

          <button type="submit">Register & enter dashboard</button>
        </form>
        <p class="muted">Already registered? <a href="#/login">Login</a></p>
      </div>
    </section>
  `;

  document.getElementById("registerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const payload = Object.fromEntries(form.entries());
    const messageBox = document.getElementById("message");
    messageBox.innerHTML = "";

    try {
      const result = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setToken(result.access_token);
      setUser(result.user);
      location.hash = "#/dashboard";
      router();
    } catch (error) {
      messageBox.innerHTML = showMessage("error", error.message);
    }
  });
}

function renderLogin() {
  app.innerHTML = `
    <section class="auth-shell">
      <div class="auth-card glass-card">
        <div class="mini-badge">Welcome back</div>
        <h1>Login</h1>
        <p class="muted">Money doesn’t track itself. Sadly, it has no discipline. You do.</p>
        <div id="message"></div>
        <form id="loginForm" class="form-grid">
          <label>Email</label>
          <input name="email" type="email" placeholder="Enter your email" required />

          <label>Password</label>
          <input name="password" type="password" placeholder="Enter your password" required minlength="6" />

          <button type="submit">Login</button>
        </form>
        <p class="muted">New user? <a href="#/register">Create account</a></p>
      </div>
    </section>
  `;

  document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const payload = Object.fromEntries(form.entries());
    const messageBox = document.getElementById("message");
    messageBox.innerHTML = "";

    try {
      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setToken(result.access_token);
      setUser(result.user);
      location.hash = "#/dashboard";
      router();
    } catch (error) {
      messageBox.innerHTML = showMessage("error", error.message);
    }
  });
}

function healthFromOverview(overview, categoryRows) {
  const totalIncome = Number(overview.total_income || 0);
  const totalExpense = Number(overview.total_expense || 0);
  const balance = Number(overview.available_balance || 0);
  const monthIncome = Number(overview.current_month_income || 0);
  const monthExpense = Number(overview.current_month_expense || 0);
  const topSpend = Math.max(...(categoryRows || []).map((row) => Number(row.total || 0)), 0);
  const concentration = totalExpense ? topSpend / totalExpense : 0;
  const savingsRate = totalIncome ? balance / totalIncome : 0;
  const monthSavingsRate = monthIncome ? (monthIncome - monthExpense) / monthIncome : 0;

  let score = 420;
  score += clamp(savingsRate, -0.5, 0.6) * 420;
  score += clamp(monthSavingsRate, -0.5, 0.6) * 260;
  score += balance >= 0 ? 160 : -220;
  score -= concentration > 0.45 ? 90 : 0;
  score -= monthIncome > 0 && monthExpense > monthIncome ? 120 : 0;
  score = clamp(Math.round(score), 0, 1000);

  let label = "Needs focus";
  if (score >= 850) label = "Excellent";
  else if (score >= 700) label = "Strong";
  else if (score >= 550) label = "Stable";
  else if (score >= 400) label = "Risky";

  return { score, label, savingsRate, monthSavingsRate, concentration };
}

function monthlySafeSpend(overview) {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(lastDay - now.getDate() + 1, 1);
  const prefs = getPrefs();
  const targetSavings = Number(prefs.monthlySavingsTarget || 0);
  const incomeLeft = Math.max(Number(overview.current_month_income || 0) - Number(overview.current_month_expense || 0) - targetSavings, 0);
  return incomeLeft / daysLeft;
}

function renderDashboardSkeleton(user) {
  app.innerHTML = `
    <section class="page dashboard-page">
      <div class="dashboard-hero">
        <div class="hero-card glass-card">
          <div class="mini-badge">Smart Wallet Command Center</div>
          <h1>${getGreeting()}, ${escapeHTML(user.name || "Abhi")}.</h1>
          <p class="hero-subtitle">A cleaner financial dashboard: salary, expense, balance, goals, budgets, and alerts in one place.</p>
          <div class="actions">
            <button class="btn" id="openQuickExpense">＋ Add Quick Expense</button>
            <a class="btn btn-light" href="#/add-income">＋ Add Salary</a>
            <button class="btn btn-secondary" id="openQuickGoal">＋ Quick Goal</button>
          </div>
        </div>

        <div class="health-card glass-card" id="healthCard">
          <h2>Financial Health Score</h2>
          <div class="gauge-loading">Loading...</div>
        </div>

        <div class="side-mini-grid">
          <div class="mini-panel glass-card" id="topExpenseCard"><span>Top Expense</span><strong>Loading...</strong></div>
          <div class="mini-panel glass-card" id="dailyLimitCard"><span>Safe Daily Spend</span><strong>Loading...</strong></div>
        </div>
      </div>

      <div id="dashboardMessage"></div>

      <div class="summary-grid" id="summaryGrid">
        <div class="stat-card skeleton"><span>Savings/Balance</span><strong>Loading...</strong></div>
        <div class="stat-card skeleton"><span>Total Income</span><strong>Loading...</strong></div>
        <div class="stat-card skeleton"><span>Total Expenses</span><strong>Loading...</strong></div>
        <div class="stat-card skeleton"><span>This Month</span><strong>Loading...</strong></div>
      </div>

      <div class="dashboard-layout">
        <div class="left-column">
          <div class="panel chart-card">
            <div class="section-title">
              <div>
                <h2>Expense by category</h2>
                <p class="muted">The donut tells the truth. No mercy, only math.</p>
              </div>
              <a class="btn btn-secondary slim" href="#/expenses">View Records</a>
            </div>
            <div class="chart-with-legend">
              <canvas id="categoryChart" height="290"></canvas>
              <div id="categoryLegend" class="legend-list"></div>
            </div>
          </div>

          <div class="panel chart-card">
            <div class="section-title">
              <div>
                <h2>Monthly Performance</h2>
                <p class="muted">Income vs expenses vs savings over time.</p>
              </div>
            </div>
            <canvas id="trendChart" height="310"></canvas>
          </div>
        </div>

        <aside class="right-column">
          <div class="panel" id="insightsPanel">
            <h2>Money Insights</h2>
            <p class="empty">Loading insights...</p>
          </div>

          <div class="panel" id="transactionsPanel">
            <div class="section-title tight">
              <h2>Recent Transactions</h2>
              <a href="#/expenses">More</a>
            </div>
            <input class="search-input" id="txSearch" placeholder="Search transaction" />
            <div id="recentTransactions" class="transaction-list"><p class="empty">Loading...</p></div>
          </div>

          <div class="panel" id="goalsPanel">
            <div class="section-title tight">
              <h2>Goals Progress</h2>
              <a href="#/budget">Manage</a>
            </div>
            <div id="goalsList"></div>
          </div>

          <div class="panel" id="budgetWatchPanel">
            <div class="section-title tight">
              <h2>Budget Watch</h2>
              <a href="#/budget">Set</a>
            </div>
            <div id="budgetWatchList"><p class="empty">Loading...</p></div>
          </div>
        </aside>
      </div>
    </section>

    ${quickExpenseModal()}
    ${quickGoalModal()}
  `;
}

async function renderDashboard() {
  if (!requireLogin()) return;

  const user = getUser();
  renderDashboardSkeleton(user);
  wireQuickModals();

  const messageBox = document.getElementById("dashboardMessage");

  try {
    const [overview, categoryResult, trendResult, txResult, monthExpenses] = await Promise.all([
      apiRequest("/reports/overview"),
      apiRequest("/reports/category-breakdown"),
      apiRequest("/reports/monthly-trend"),
      apiRequest("/reports/recent-transactions?limit=8"),
      apiRequest(`/expenses/?start_date=${monthStartISO()}&end_date=${todayISO()}`),
    ]);

    const categoryRows = categoryResult.category_totals || [];
    const transactions = txResult.transactions || [];
    const health = healthFromOverview(overview, categoryRows);
    const topCategory = overview.top_category ? `${overview.top_category.category} • ${money(overview.top_category.total)}` : "No expense yet";
    const balanceClass = Number(overview.available_balance) >= 0 ? "positive-text" : "negative-text";
    const safeDaily = monthlySafeSpend(overview);

    document.getElementById("summaryGrid").innerHTML = `
      <div class="stat-card balance-stat"><span>Savings / Balance</span><strong class="${balanceClass}">${money(overview.available_balance)}</strong><small>Income ${money(overview.total_income)} − Expense ${money(overview.total_expense)}</small></div>
      <div class="stat-card income-stat"><span>Total Income</span><strong>${money(overview.total_income)}</strong><small>${overview.income_records} salary/income entries</small></div>
      <div class="stat-card expense-stat"><span>Total Expenses</span><strong>${money(overview.total_expense)}</strong><small>${overview.expense_records} expense entries</small></div>
      <div class="stat-card"><span>${escapeHTML(getMonthName())}</span><strong>${money(overview.current_month_savings)}</strong><small>Saved this month after spending</small></div>
    `;

    document.getElementById("healthCard").innerHTML = `
      <h2>Financial Health Score</h2>
      <div class="gauge" style="--score:${health.score}; --angle:${health.score * 0.18}deg">
        <div class="gauge-inner"><strong>${health.score}</strong><span>/1000</span><em>${health.label}</em></div>
      </div>
      <p class="muted small-copy">Score uses savings rate, current month cashflow, balance, and spending concentration.</p>
    `;

    document.getElementById("topExpenseCard").innerHTML = `<span>Top Expense Category</span><strong>${escapeHTML(topCategory)}</strong>`;
    document.getElementById("dailyLimitCard").innerHTML = `<span>Safe Daily Spend</span><strong>${money(safeDaily)}</strong><small>After monthly savings target</small>`;

    drawDonutChart("categoryChart", categoryRows);
    renderCategoryLegend(categoryRows, overview.total_expense);
    drawTrendChart("trendChart", trendResult.months || []);
    renderInsights(overview, health, categoryRows, safeDaily);
    renderRecentTransactions(transactions);
    renderGoalsWidget();
    renderBudgetWatch(monthExpenses.expenses || []);
  } catch (error) {
    messageBox.innerHTML = showMessage("error", error.message);
  }
}

function renderInsights(overview, health, categoryRows, safeDaily) {
  const panel = document.getElementById("insightsPanel");
  const top = categoryRows[0];
  const savingRate = pct(Number(overview.available_balance || 0), Number(overview.total_income || 0));
  const monthSpendRate = pct(Number(overview.current_month_expense || 0), Number(overview.current_month_income || 0));
  const warning = Number(overview.current_month_expense || 0) > Number(overview.current_month_income || 0);

  panel.innerHTML = `
    <h2>Money Insights</h2>
    <div class="insight-list">
      <div class="insight ${warning ? "bad" : "good"}"><strong>${warning ? "Overspending alert" : "Cashflow is okay"}</strong><span>${warning ? "This month expenses crossed income. Pause non-urgent spending." : "This month is still under control. Keep the streak."}</span></div>
      <div class="insight"><strong>Savings rate: ${savingRate.toFixed(1)}%</strong><span>Aim for at least 20%. Old-school rule, still undefeated.</span></div>
      <div class="insight"><strong>Monthly spend rate: ${monthSpendRate.toFixed(1)}%</strong><span>Safe daily spend now: ${money(safeDaily)}.</span></div>
      <div class="insight"><strong>Cut-first category</strong><span>${top ? `${escapeHTML(top.category)} is eating ${money(top.total)}.` : "Add expenses to discover your money monster."}</span></div>
      <div class="insight"><strong>Health level: ${health.label}</strong><span>${health.score >= 700 ? "Nice. Keep investing in discipline." : "Not cooked, but the budget needs adult supervision."}</span></div>
    </div>
  `;
}

function renderRecentTransactions(transactions) {
  const list = document.getElementById("recentTransactions");
  const search = document.getElementById("txSearch");

  function paint(rows) {
    if (!rows.length) {
      list.innerHTML = emptyState("No transactions yet", "Add salary or expense to see your money timeline.");
      return;
    }

    list.innerHTML = rows
      .map((tx) => {
        const isIncome = tx.type === "income";
        const icon = isIncome ? "↗" : "↘";
        const title = isIncome ? tx.source || "Income" : tx.category || "Expense";
        const note = isIncome ? tx.note : tx.description;
        return `
          <div class="transaction-item">
            <div class="tx-icon ${isIncome ? "income-bg" : "expense-bg"}">${icon}</div>
            <div class="tx-main"><strong>${escapeHTML(title)}</strong><span>${escapeHTML(note || tx.date || "-")}</span></div>
            <div class="tx-amount ${isIncome ? "positive-text" : "negative-text"}">${isIncome ? "+" : "-"}${money(tx.amount)}</div>
          </div>
        `;
      })
      .join("");
  }

  paint(transactions);
  search.addEventListener("input", () => {
    const term = search.value.toLowerCase().trim();
    const filtered = transactions.filter((tx) => JSON.stringify(tx).toLowerCase().includes(term));
    paint(filtered);
  });
}

function renderGoalsWidget() {
  const wrap = document.getElementById("goalsList");
  const goals = getGoals().slice(0, 4);

  if (!goals.length) {
    wrap.innerHTML = emptyState("No goals yet", "Create one goal and give your savings a mission.", `<button class="btn" id="sideGoalBtn">+ Add Goal</button>`);
    document.getElementById("sideGoalBtn")?.addEventListener("click", () => openModal("goalModal"));
    return;
  }

  wrap.innerHTML = goals
    .map((goal) => {
      const progress = pct(goal.saved, goal.target);
      return `
        <div class="goal-row">
          <div class="goal-top"><strong>${escapeHTML(goal.name)}</strong><span>${Math.round(progress)}%</span></div>
          <div class="progress"><span style="width:${Math.min(progress, 100)}%"></span></div>
          <small>${money(goal.saved)} saved / ${money(goal.target)} target</small>
        </div>
      `;
    })
    .join("");
}

function renderBudgetWatch(expenses) {
  const wrap = document.getElementById("budgetWatchList");
  const budgets = getBudgets();
  const spent = {};
  expenses.forEach((expense) => {
    spent[expense.category] = (spent[expense.category] || 0) + Number(expense.amount || 0);
  });

  const rows = Object.entries(budgets)
    .filter(([, amount]) => Number(amount) > 0)
    .map(([category, budget]) => ({ category, budget: Number(budget), spent: spent[category] || 0 }))
    .sort((a, b) => pct(b.spent, b.budget) - pct(a.spent, a.budget))
    .slice(0, 5);

  if (!rows.length) {
    wrap.innerHTML = emptyState("No budget set", "Add category budgets to catch overspending early.");
    return;
  }

  wrap.innerHTML = rows
    .map((row) => {
      const progress = pct(row.spent, row.budget);
      const state = progress >= 100 ? "danger" : progress >= 80 ? "warning" : "";
      return `
        <div class="budget-row ${state}">
          <div class="goal-top"><strong>${escapeHTML(row.category)}</strong><span>${Math.round(progress)}%</span></div>
          <div class="progress"><span style="width:${Math.min(progress, 100)}%"></span></div>
          <small>${money(row.spent)} spent / ${money(row.budget)} budget</small>
        </div>
      `;
    })
    .join("");
}

function quickExpenseModal() {
  return `
    <div class="modal" id="expenseModal" aria-hidden="true">
      <div class="modal-card">
        <div class="section-title tight"><h2>Quick Expense</h2><button class="icon-btn" data-close-modal="expenseModal">×</button></div>
        <div id="quickExpenseMessage"></div>
        <form id="quickExpenseForm" class="form-grid two-col-form">
          <div><label>Amount</label><input name="amount" type="number" min="1" step="0.01" required placeholder="250" /></div>
          <div><label>Category</label><select name="category" required>${optionList(categories, "Food")}</select></div>
          <div><label>Payment</label><select name="payment_method" required>${optionList(paymentMethods, "UPI")}</select></div>
          <div><label>Date</label><input name="expense_date" type="date" required value="${todayISO()}" /></div>
          <div class="full-span"><label>Description</label><input name="description" maxlength="255" placeholder="Example: Tea, canteen, petrol" /></div>
          <button class="full-span" type="submit">Save Expense</button>
        </form>
      </div>
    </div>
  `;
}

function quickGoalModal() {
  return `
    <div class="modal" id="goalModal" aria-hidden="true">
      <div class="modal-card">
        <div class="section-title tight"><h2>Quick Goal</h2><button class="icon-btn" data-close-modal="goalModal">×</button></div>
        <form id="quickGoalForm" class="form-grid two-col-form">
          <div class="full-span"><label>Goal name</label><input name="name" required placeholder="Emergency fund" /></div>
          <div><label>Target</label><input name="target" type="number" min="1" step="0.01" required placeholder="10000" /></div>
          <div><label>Saved now</label><input name="saved" type="number" min="0" step="0.01" required value="0" /></div>
          <button class="full-span" type="submit">Create Goal</button>
        </form>
      </div>
    </div>
  `;
}

function openModal(id) {
  document.getElementById(id)?.classList.add("open");
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove("open");
}

function wireQuickModals() {
  document.getElementById("openQuickExpense")?.addEventListener("click", () => openModal("expenseModal"));
  document.getElementById("openQuickGoal")?.addEventListener("click", () => openModal("goalModal"));
  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => closeModal(button.dataset.closeModal));
  });
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal(modal.id);
    });
  });

  document.getElementById("quickExpenseForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const payload = Object.fromEntries(form.entries());
    payload.amount = Number(payload.amount);
    const messageBox = document.getElementById("quickExpenseMessage");
    messageBox.innerHTML = "";
    try {
      await apiRequest("/expenses/", { method: "POST", body: JSON.stringify(payload) });
      closeModal("expenseModal");
      await renderDashboard();
    } catch (error) {
      messageBox.innerHTML = showMessage("error", error.message);
    }
  });

  document.getElementById("quickGoalForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const goal = Object.fromEntries(form.entries());
    const goals = getGoals();
    goals.unshift({ id: crypto.randomUUID(), name: goal.name, target: Number(goal.target), saved: Number(goal.saved || 0) });
    saveGoals(goals);
    closeModal("goalModal");
    renderGoalsWidget();
  });
}

function renderExpenseForm(mode = "add", expense = null) {
  const isEdit = mode === "edit";
  const today = todayISO();

  app.innerHTML = `
    <section class="page narrow-page">
      <div class="form-card wide-form glass-card">
        <div class="mini-badge">Expense deduction</div>
        <h1>${isEdit ? "Edit" : "Add"} Expense</h1>
        <p class="muted">Every expense reduces your savings automatically. No manual balance math needed.</p>
        <div id="message"></div>
        <form id="expenseForm" class="form-grid two-col-form">
          <div>
            <label>Amount</label>
            <input name="amount" type="number" step="0.01" min="1" placeholder="Example: 250" required value="${escapeHTML(expense?.amount || "")}" />
          </div>

          <div>
            <label>Category</label>
            <select name="category" required>${optionList(categories, expense?.category || "Food")}</select>
          </div>

          <div>
            <label>Payment Method</label>
            <select name="payment_method" required>${optionList(paymentMethods, expense?.payment_method || "UPI")}</select>
          </div>

          <div>
            <label>Date</label>
            <input name="expense_date" type="date" required value="${escapeHTML(expense?.expense_date || today)}" />
          </div>

          <div class="full-span">
            <label>Description</label>
            <input name="description" maxlength="255" placeholder="Example: College canteen" value="${escapeHTML(expense?.description || "")}" />
          </div>

          <button class="full-span" type="submit">${isEdit ? "Update" : "Add"} Expense</button>
        </form>
        <div class="actions"><a class="btn btn-secondary" href="#/expenses">Back to Expenses</a></div>
      </div>
    </section>
  `;

  document.getElementById("expenseForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const payload = Object.fromEntries(form.entries());
    payload.amount = Number(payload.amount);

    const messageBox = document.getElementById("message");
    messageBox.innerHTML = "";

    try {
      const endpoint = isEdit ? `/expenses/${expense.id}` : "/expenses/";
      const method = isEdit ? "PUT" : "POST";
      await apiRequest(endpoint, { method, body: JSON.stringify(payload) });
      location.hash = "#/dashboard";
    } catch (error) {
      messageBox.innerHTML = showMessage("error", error.message);
    }
  });
}

function renderAddExpense() {
  if (!requireLogin()) return;
  renderExpenseForm("add");
}

async function renderEditExpense(id) {
  if (!requireLogin()) return;

  app.innerHTML = `<section class="page"><div class="panel"><h1>Loading expense...</h1></div></section>`;

  try {
    const expense = await apiRequest(`/expenses/${id}`);
    renderExpenseForm("edit", expense);
  } catch (error) {
    app.innerHTML = `<section class="page"><div class="panel">${showMessage("error", error.message)}<a class="btn" href="#/expenses">Back</a></div></section>`;
  }
}

function renderIncomeForm(mode = "add", income = null) {
  const isEdit = mode === "edit";
  const today = todayISO();

  app.innerHTML = `
    <section class="page narrow-page">
      <div class="form-card wide-form glass-card">
        <div class="mini-badge">Income boost</div>
        <h1>${isEdit ? "Edit" : "Add"} Salary / Income</h1>
        <p class="muted">Add salary more than once — monthly salary, bonus, freelance, business income, everything counts.</p>
        <div id="message"></div>
        <form id="incomeForm" class="form-grid two-col-form">
          <div>
            <label>Amount</label>
            <input name="amount" type="number" step="0.01" min="1" placeholder="Example: 25000" required value="${escapeHTML(income?.amount || "")}" />
          </div>

          <div>
            <label>Source</label>
            <select name="source" required>${optionList(incomeSources, income?.source || "Salary")}</select>
          </div>

          <div>
            <label>Date</label>
            <input name="income_date" type="date" required value="${escapeHTML(income?.income_date || today)}" />
          </div>

          <div>
            <label>Note</label>
            <input name="note" maxlength="255" placeholder="Example: June salary / freelance client" value="${escapeHTML(income?.note || "")}" />
          </div>

          <button class="full-span" type="submit">${isEdit ? "Update" : "Add"} Salary</button>
        </form>
        <div class="actions"><a class="btn btn-secondary" href="#/income">Back to Salary History</a></div>
      </div>
    </section>
  `;

  document.getElementById("incomeForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const payload = Object.fromEntries(form.entries());
    payload.amount = Number(payload.amount);

    const messageBox = document.getElementById("message");
    messageBox.innerHTML = "";

    try {
      const endpoint = isEdit ? `/income/${income.id}` : "/income/";
      const method = isEdit ? "PUT" : "POST";
      await apiRequest(endpoint, { method, body: JSON.stringify(payload) });
      location.hash = "#/dashboard";
    } catch (error) {
      messageBox.innerHTML = showMessage("error", error.message);
    }
  });
}

function renderAddIncome() {
  if (!requireLogin()) return;
  renderIncomeForm("add");
}

async function renderEditIncome(id) {
  if (!requireLogin()) return;

  app.innerHTML = `<section class="page"><div class="panel"><h1>Loading salary record...</h1></div></section>`;

  try {
    const income = await apiRequest(`/income/${id}`);
    renderIncomeForm("edit", income);
  } catch (error) {
    app.innerHTML = `<section class="page"><div class="panel">${showMessage("error", error.message)}<a class="btn" href="#/income">Back</a></div></section>`;
  }
}

async function renderExpenses() {
  if (!requireLogin()) return;

  app.innerHTML = `
    <section class="page">
      <div class="panel glass-card">
        <div class="section-title">
          <div>
            <div class="mini-badge">Expense history</div>
            <h1>Expenses</h1>
            <p class="muted">Filter, search, edit, delete, and export. Useful beats fancy.</p>
          </div>
          <a class="btn" href="#/add-expense">+ Add Expense</a>
        </div>
        <div id="message"></div>
        <div class="filters upgraded-filters">
          <div><label>Search</label><input id="expenseSearch" placeholder="canteen, travel, UPI..." /></div>
          <div><label>Category</label><select id="filterCategory"><option value="All">All</option>${optionList(categories)}</select></div>
          <div><label>Start Date</label><input type="date" id="filterStart" /></div>
          <div><label>End Date</label><input type="date" id="filterEnd" /></div>
          <button id="applyFilter">Apply</button>
          <button class="btn-secondary" id="resetFilter">Reset</button>
          <button class="btn-light" id="exportExpenseCsv">Export CSV</button>
        </div>
      </div>

      <div id="expenseSummary" class="summary-grid compact-summary"></div>
      <div class="table-card" id="expenseTableWrap"><p class="empty">Loading expenses...</p></div>
    </section>
  `;

  document.getElementById("applyFilter").addEventListener("click", loadAndRenderExpensesTable);
  document.getElementById("expenseSearch").addEventListener("input", loadAndRenderExpensesTable);
  document.getElementById("resetFilter").addEventListener("click", () => {
    document.getElementById("expenseSearch").value = "";
    document.getElementById("filterCategory").value = "All";
    document.getElementById("filterStart").value = "";
    document.getElementById("filterEnd").value = "";
    loadAndRenderExpensesTable();
  });
  document.getElementById("exportExpenseCsv").addEventListener("click", async () => {
    const result = await apiRequest(buildExpenseQuery());
    const rows = filterExpenseRows(result.expenses || []);
    downloadCsv("expenses.csv", rows, ["expense_date", "category", "amount", "payment_method", "description"]);
  });
  await loadAndRenderExpensesTable();
}

function buildExpenseQuery() {
  const category = document.getElementById("filterCategory")?.value || "All";
  const startDate = document.getElementById("filterStart")?.value || "";
  const endDate = document.getElementById("filterEnd")?.value || "";
  const params = new URLSearchParams();

  if (category !== "All") params.set("category", category);
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);

  return params.toString() ? `/expenses/?${params.toString()}` : "/expenses/";
}

function filterExpenseRows(rows) {
  const term = document.getElementById("expenseSearch")?.value.toLowerCase().trim() || "";
  if (!term) return rows;
  return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(term));
}

async function loadAndRenderExpensesTable() {
  const wrap = document.getElementById("expenseTableWrap");
  const messageBox = document.getElementById("message");
  const summary = document.getElementById("expenseSummary");
  if (!wrap) return;
  messageBox.innerHTML = "";
  wrap.innerHTML = `<p class="empty">Loading expenses...</p>`;

  try {
    const result = await apiRequest(buildExpenseQuery());
    const expenses = filterExpenseRows(result.expenses || []);
    const total = expenses.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const avg = expenses.length ? total / expenses.length : 0;
    const top = expenses.reduce((best, row) => Number(row.amount || 0) > Number(best.amount || 0) ? row : best, {});

    summary.innerHTML = `
      <div class="stat-card"><span>Filtered Total</span><strong>${money(total)}</strong><small>${expenses.length} records</small></div>
      <div class="stat-card"><span>Average Expense</span><strong>${money(avg)}</strong><small>Per transaction</small></div>
      <div class="stat-card"><span>Largest Expense</span><strong>${top.amount ? money(top.amount) : "₹0.00"}</strong><small>${escapeHTML(top.category || "-")}</small></div>
      <div class="stat-card"><span>Smart Tip</span><strong>${expenses.length ? "Review top 3" : "Add data"}</strong><small>Cutting one leak changes the game</small></div>
    `;

    if (expenses.length === 0) {
      wrap.innerHTML = emptyState("No expenses found", "Add your first expense and the dashboard will deduct it from your savings.", `<a class="btn" href="#/add-expense">+ Add Expense</a>`);
      return;
    }

    wrap.innerHTML = `
      <table>
        <thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Payment</th><th>Description</th><th>Actions</th></tr></thead>
        <tbody>
          ${expenses.map((expense) => `
            <tr>
              <td>${escapeHTML(expense.expense_date)}</td>
              <td><span class="pill">${escapeHTML(expense.category)}</span></td>
              <td class="money-cell negative-text">${money(expense.amount)}</td>
              <td>${escapeHTML(expense.payment_method)}</td>
              <td>${escapeHTML(expense.description || "-")}</td>
              <td><div class="row-actions"><a class="btn btn-secondary" href="#/edit-expense/${expense.id}">Edit</a><button class="btn-danger" data-delete-id="${expense.id}">Delete</button></div></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    document.querySelectorAll("[data-delete-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.getAttribute("data-delete-id");
        if (!confirm("Delete this expense?")) return;
        try {
          await apiRequest(`/expenses/${id}`, { method: "DELETE" });
          await loadAndRenderExpensesTable();
        } catch (error) {
          messageBox.innerHTML = showMessage("error", error.message);
        }
      });
    });
  } catch (error) {
    wrap.innerHTML = "";
    messageBox.innerHTML = showMessage("error", error.message);
  }
}

async function renderIncomeHistory() {
  if (!requireLogin()) return;

  app.innerHTML = `
    <section class="page">
      <div class="panel glass-card">
        <div class="section-title">
          <div>
            <div class="mini-badge">Salary history</div>
            <h1>Income / Salary</h1>
            <p class="muted">Add salary multiple times whenever you earn. Bonus? Freelance? Add it. Balance goes up.</p>
          </div>
          <a class="btn" href="#/add-income">+ Add Salary</a>
        </div>
        <div id="message"></div>
        <div class="filters income-filters">
          <div><label>Search</label><input id="incomeSearch" placeholder="salary, freelance..." /></div>
          <div><label>Source</label><select id="incomeSource"><option value="All">All</option>${optionList(incomeSources)}</select></div>
          <div><label>Start Date</label><input type="date" id="incomeStart" /></div>
          <div><label>End Date</label><input type="date" id="incomeEnd" /></div>
          <button id="applyIncomeFilter">Apply</button>
          <button class="btn-light" id="exportIncomeCsv">Export CSV</button>
        </div>
      </div>

      <div id="incomeSummary" class="summary-grid compact-summary"></div>
      <div class="table-card" id="incomeTableWrap"><p class="empty">Loading salary records...</p></div>
    </section>
  `;

  document.getElementById("applyIncomeFilter").addEventListener("click", loadAndRenderIncomeTable);
  document.getElementById("incomeSearch").addEventListener("input", loadAndRenderIncomeTable);
  document.getElementById("exportIncomeCsv").addEventListener("click", async () => {
    const result = await apiRequest(buildIncomeQuery());
    const rows = filterIncomeRows(result.income || []);
    downloadCsv("income.csv", rows, ["income_date", "source", "amount", "note"]);
  });
  await loadAndRenderIncomeTable();
}

function buildIncomeQuery() {
  const source = document.getElementById("incomeSource")?.value || "All";
  const startDate = document.getElementById("incomeStart")?.value || "";
  const endDate = document.getElementById("incomeEnd")?.value || "";
  const params = new URLSearchParams();

  if (source !== "All") params.set("source", source);
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);

  return params.toString() ? `/income/?${params.toString()}` : "/income/";
}

function filterIncomeRows(rows) {
  const term = document.getElementById("incomeSearch")?.value.toLowerCase().trim() || "";
  if (!term) return rows;
  return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(term));
}

async function loadAndRenderIncomeTable() {
  const wrap = document.getElementById("incomeTableWrap");
  const messageBox = document.getElementById("message");
  const summary = document.getElementById("incomeSummary");
  messageBox.innerHTML = "";
  wrap.innerHTML = `<p class="empty">Loading salary records...</p>`;

  try {
    const result = await apiRequest(buildIncomeQuery());
    const incomeRows = filterIncomeRows(result.income || []);
    const total = incomeRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const avg = incomeRows.length ? total / incomeRows.length : 0;
    const latest = incomeRows[0];

    summary.innerHTML = `
      <div class="stat-card income-stat"><span>Filtered Income</span><strong>${money(total)}</strong><small>${incomeRows.length} records</small></div>
      <div class="stat-card"><span>Average Entry</span><strong>${money(avg)}</strong><small>Per income record</small></div>
      <div class="stat-card"><span>Latest Source</span><strong>${escapeHTML(latest?.source || "-")}</strong><small>${latest?.income_date || "No data yet"}</small></div>
      <div class="stat-card"><span>Income Habit</span><strong>${incomeRows.length ? "Logged" : "Start"}</strong><small>Record every source, even small one</small></div>
    `;

    if (incomeRows.length === 0) {
      wrap.innerHTML = emptyState("No salary/income added yet", "Add salary first, then expenses will deduct from your savings block.", `<a class="btn" href="#/add-income">+ Add Salary</a>`);
      return;
    }

    wrap.innerHTML = `
      <table>
        <thead><tr><th>Date</th><th>Source</th><th>Amount</th><th>Note</th><th>Actions</th></tr></thead>
        <tbody>
          ${incomeRows.map((income) => `
            <tr>
              <td>${escapeHTML(income.income_date)}</td>
              <td><span class="pill income-pill">${escapeHTML(income.source)}</span></td>
              <td class="money-cell positive-text">${money(income.amount)}</td>
              <td>${escapeHTML(income.note || "-")}</td>
              <td><div class="row-actions"><a class="btn btn-secondary" href="#/edit-income/${income.id}">Edit</a><button class="btn-danger" data-delete-income-id="${income.id}">Delete</button></div></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    document.querySelectorAll("[data-delete-income-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.getAttribute("data-delete-income-id");
        if (!confirm("Delete this salary/income record?")) return;
        try {
          await apiRequest(`/income/${id}`, { method: "DELETE" });
          await loadAndRenderIncomeTable();
        } catch (error) {
          messageBox.innerHTML = showMessage("error", error.message);
        }
      });
    });
  } catch (error) {
    wrap.innerHTML = "";
    messageBox.innerHTML = showMessage("error", error.message);
  }
}

async function renderBudgetGoals() {
  if (!requireLogin()) return;
  app.innerHTML = `
    <section class="page">
      <div class="section-title page-heading">
        <div>
          <div class="mini-badge">Planning zone</div>
          <h1>Budgets & Goals</h1>
          <p class="muted">Budgets stop leakage. Goals give savings a destination.</p>
        </div>
        <a class="btn" href="#/dashboard">Back Dashboard</a>
      </div>

      <div class="planning-grid">
        <div class="panel glass-card">
          <h2>Monthly Category Budgets</h2>
          <p class="muted">Saved in your browser. Fast and simple for college/project demo.</p>
          <div id="budgetMessage"></div>
          <form id="budgetsForm" class="budget-form"></form>
        </div>

        <div class="panel glass-card">
          <div class="section-title tight"><h2>Savings Goals</h2><button id="addGoalRow" class="btn slim">+ Add</button></div>
          <div id="goalsEditor" class="goals-editor"></div>
        </div>
      </div>

      <div class="panel" id="budgetReality"><p class="empty">Loading monthly budget reality...</p></div>
    </section>
  `;
  renderBudgetEditor();
  renderGoalsEditor();
  await renderBudgetReality();
}

function renderBudgetEditor() {
  const budgets = getBudgets();
  const form = document.getElementById("budgetsForm");
  form.innerHTML = `
    ${categories.map((cat) => `
      <div class="budget-input-row">
        <label>${escapeHTML(cat)}</label>
        <input type="number" min="0" step="0.01" name="${escapeHTML(cat)}" value="${escapeHTML(budgets[cat] || "")}" placeholder="0" />
      </div>
    `).join("")}
    <button class="full-span" type="submit">Save Budgets</button>
  `;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const clean = {};
    Object.entries(data).forEach(([key, value]) => clean[key] = Number(value || 0));
    saveBudgets(clean);
    document.getElementById("budgetMessage").innerHTML = showMessage("success", "Budgets saved. Dashboard watch updated.");
    renderBudgetReality();
  });
}

function renderGoalsEditor() {
  const wrap = document.getElementById("goalsEditor");
  const goals = getGoals();

  function paint() {
    const latest = getGoals();
    if (!latest.length) {
      wrap.innerHTML = emptyState("No goals", "Add one goal: emergency fund, laptop, course fee, anything.");
      return;
    }
    wrap.innerHTML = latest.map((goal) => `
      <div class="goal-edit-card" data-goal-id="${goal.id}">
        <input data-field="name" value="${escapeHTML(goal.name)}" />
        <input data-field="target" type="number" min="1" step="0.01" value="${escapeHTML(goal.target)}" />
        <input data-field="saved" type="number" min="0" step="0.01" value="${escapeHTML(goal.saved)}" />
        <button class="btn-light" data-save-goal="${goal.id}">Save</button>
        <button class="btn-danger" data-delete-goal="${goal.id}">Delete</button>
      </div>
    `).join("");

    document.querySelectorAll("[data-save-goal]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.saveGoal;
        const card = document.querySelector(`[data-goal-id="${id}"]`);
        const updated = getGoals().map((goal) => {
          if (goal.id !== id) return goal;
          return {
            ...goal,
            name: card.querySelector('[data-field="name"]').value,
            target: Number(card.querySelector('[data-field="target"]').value || 0),
            saved: Number(card.querySelector('[data-field="saved"]').value || 0),
          };
        });
        saveGoals(updated);
        paint();
      });
    });

    document.querySelectorAll("[data-delete-goal]").forEach((button) => {
      button.addEventListener("click", () => {
        if (!confirm("Delete this goal?")) return;
        saveGoals(getGoals().filter((goal) => goal.id !== button.dataset.deleteGoal));
        paint();
      });
    });
  }

  document.getElementById("addGoalRow").addEventListener("click", () => {
    const next = getGoals();
    next.unshift({ id: crypto.randomUUID(), name: "New Goal", target: 10000, saved: 0 });
    saveGoals(next);
    paint();
  });
  if (!goals.length) saveGoals(defaultGoals());
  paint();
}

async function renderBudgetReality() {
  const wrap = document.getElementById("budgetReality");
  try {
    const result = await apiRequest(`/expenses/?start_date=${monthStartISO()}&end_date=${todayISO()}`);
    const budgets = getBudgets();
    const spent = {};
    (result.expenses || []).forEach((expense) => spent[expense.category] = (spent[expense.category] || 0) + Number(expense.amount || 0));
    const rows = categories.map((cat) => ({ category: cat, budget: Number(budgets[cat] || 0), spent: Number(spent[cat] || 0) })).filter((row) => row.budget || row.spent);

    wrap.innerHTML = `
      <div class="section-title"><div><h2>This Month Budget Reality</h2><p class="muted">${escapeHTML(getMonthName())}</p></div></div>
      ${rows.length ? `
        <div class="budget-reality-grid">
          ${rows.map((row) => {
            const progress = pct(row.spent, row.budget || row.spent || 1);
            const state = row.budget && row.spent > row.budget ? "danger" : progress >= 80 ? "warning" : "";
            return `<div class="budget-row big ${state}"><div class="goal-top"><strong>${escapeHTML(row.category)}</strong><span>${Math.round(progress)}%</span></div><div class="progress"><span style="width:${Math.min(progress, 100)}%"></span></div><small>${money(row.spent)} spent / ${row.budget ? money(row.budget) : "No budget"}</small></div>`;
          }).join("")}
        </div>
      ` : emptyState("No spending or budgets yet", "Set budgets and add monthly expenses to compare.")}
    `;
  } catch (error) {
    wrap.innerHTML = showMessage("error", error.message);
  }
}

async function renderSettings() {
  if (!requireLogin()) return;
  const user = getUser();
  const prefs = getPrefs();
  const theme = localStorage.getItem(LS_KEYS.theme) || "light";

  app.innerHTML = `
    <section class="page narrow-page">
      <div class="panel glass-card">
        <div class="mini-badge">Control room</div>
        <h1>Settings</h1>
        <p class="muted">Profile, dark mode, dashboard targets, logout, and account controls.</p>
        <div id="settingsMessage"></div>

        <form id="profileForm" class="form-grid two-col-form settings-block">
          <div><label>Name</label><input name="name" value="${escapeHTML(user.name || "")}" required minlength="2" /></div>
          <div><label>Email</label><input value="${escapeHTML(user.email || "")}" disabled /></div>
          <button class="full-span" type="submit">Save Profile</button>
        </form>

        <div class="settings-block split-box">
          <div><h2>Appearance</h2><p class="muted">Switch between clean light mode and night-coder dark mode.</p></div>
          <button id="themeToggle" class="btn-light">${theme === "dark" ? "☀ Light Mode" : "🌙 Dark Mode"}</button>
        </div>

        <form id="prefsForm" class="form-grid settings-block">
          <h2>Dashboard Targets</h2>
          <label>Monthly savings target</label>
          <input name="monthlySavingsTarget" type="number" min="0" step="0.01" value="${escapeHTML(prefs.monthlySavingsTarget || 0)}" />
          <button type="submit">Save Target</button>
        </form>

        <div class="danger-zone">
          <h2>Danger Zone</h2>
          <p class="muted">Logout is safe. Delete account is permanent. Big difference, boss.</p>
          <div class="actions">
            <button id="logoutBtn" class="btn-secondary">Logout</button>
            <button id="resetLocalBtn" class="btn-light">Reset Goals/Budgets</button>
            <button id="deleteAccountBtn" class="btn-danger">Delete Account</button>
          </div>
        </div>
      </div>
    </section>
  `;

  const msg = document.getElementById("settingsMessage");

  document.getElementById("profileForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.target).entries());
    try {
      const result = await apiRequest("/auth/profile", { method: "PUT", body: JSON.stringify(payload) });
      setUser(result.user);
      showNav();
      msg.innerHTML = showMessage("success", "Profile updated.");
    } catch (error) {
      msg.innerHTML = showMessage("error", error.message);
    }
  });

  document.getElementById("themeToggle").addEventListener("click", () => {
    const next = (localStorage.getItem(LS_KEYS.theme) || "light") === "dark" ? "light" : "dark";
    setTheme(next);
    renderSettings();
  });

  document.getElementById("prefsForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.target).entries());
    savePrefs({ ...getPrefs(), monthlySavingsTarget: Number(payload.monthlySavingsTarget || 0) });
    msg.innerHTML = showMessage("success", "Dashboard target saved.");
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    clearToken();
    location.hash = "#/login";
    router();
  });

  document.getElementById("resetLocalBtn").addEventListener("click", () => {
    if (!confirm("Reset local goals, budgets and preferences?")) return;
    localStorage.removeItem(LS_KEYS.goals);
    localStorage.removeItem(LS_KEYS.budgets);
    localStorage.removeItem(LS_KEYS.prefs);
    msg.innerHTML = showMessage("success", "Local goals, budgets and preferences reset.");
  });

  document.getElementById("deleteAccountBtn").addEventListener("click", async () => {
    if (!confirm("Delete your account and all income/expense records? This cannot be undone.")) return;
    try {
      await apiRequest("/auth/account", { method: "DELETE" });
      clearToken();
      location.hash = "#/register";
      router();
    } catch (error) {
      msg.innerHTML = showMessage("error", error.message);
    }
  });
}

function downloadCsv(filename, rows, columns) {
  const header = columns.join(",");
  const body = rows.map((row) => columns.map((col) => `"${String(row[col] ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function drawDonutChart(canvasId, rows) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  ctx.clearRect(0, 0, w, h);
  ctx.font = "14px Inter, Arial";

  if (!rows.length) {
    ctx.fillStyle = getCssVar("--muted");
    ctx.textAlign = "center";
    ctx.fillText("Add expenses to see category chart", w / 2, h / 2);
    return;
  }

  const total = rows.reduce((sum, row) => sum + Number(row.total || 0), 0);
  const radius = Math.min(w, h) / 2 - 22;
  const inner = radius * 0.58;
  const cx = w / 2;
  const cy = h / 2;
  let start = -Math.PI / 2;

  rows.forEach((row, index) => {
    const value = Number(row.total || 0);
    const angle = (value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = chartColors[index % chartColors.length];
    ctx.fill();
    start += angle;
  });

  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  ctx.textAlign = "center";
  ctx.fillStyle = getCssVar("--muted");
  ctx.font = "13px Inter, Arial";
  ctx.fillText("Total Spending", cx, cy - 8);
  ctx.fillStyle = getCssVar("--text");
  ctx.font = "800 23px Inter, Arial";
  ctx.fillText(compactMoney(total), cx, cy + 22);
}

function renderCategoryLegend(rows, total) {
  const legend = document.getElementById("categoryLegend");
  if (!legend) return;
  if (!rows.length) {
    legend.innerHTML = "";
    return;
  }
  legend.innerHTML = rows.slice(0, 8).map((row, index) => `
    <div class="legend-item"><span style="background:${chartColors[index % chartColors.length]}"></span><strong>${escapeHTML(row.category)}</strong><em>${money(row.total)} · ${pct(row.total, total).toFixed(1)}%</em></div>
  `).join("");
}

function drawTrendChart(canvasId, rows) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  ctx.clearRect(0, 0, w, h);
  ctx.font = "13px Inter, Arial";

  if (!rows.length) {
    ctx.fillStyle = getCssVar("--muted");
    ctx.textAlign = "center";
    ctx.fillText("Add salary and expenses to see monthly trend", w / 2, h / 2);
    return;
  }

  const data = rows.slice(-8);
  const maxValue = Math.max(...data.flatMap((row) => [Number(row.income || 0), Number(row.expense || 0), Math.max(Number(row.savings || 0), 0)]), 1);
  const chartLeft = 54;
  const chartRight = 20;
  const chartTop = 28;
  const chartBottom = 48;
  const chartW = w - chartLeft - chartRight;
  const chartH = h - chartTop - chartBottom;
  const groupWidth = chartW / data.length;
  const barWidth = Math.min(22, groupWidth / 4);

  ctx.strokeStyle = getCssVar("--border");
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = chartTop + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(w - chartRight, y);
    ctx.stroke();
  }

  const savingPoints = [];
  data.forEach((row, index) => {
    const xCenter = chartLeft + groupWidth * index + groupWidth / 2;
    const incomeHeight = (Number(row.income || 0) / maxValue) * chartH;
    const expenseHeight = (Number(row.expense || 0) / maxValue) * chartH;
    const savingHeight = (Math.max(Number(row.savings || 0), 0) / maxValue) * chartH;

    ctx.fillStyle = "#2f8f8b";
    roundRect(ctx, xCenter - barWidth - 4, chartTop + chartH - incomeHeight, barWidth, incomeHeight, 6);
    ctx.fill();

    ctx.fillStyle = "#eab308";
    roundRect(ctx, xCenter + 4, chartTop + chartH - expenseHeight, barWidth, expenseHeight, 6);
    ctx.fill();

    savingPoints.push([xCenter, chartTop + chartH - savingHeight]);

    ctx.fillStyle = getCssVar("--muted");
    ctx.textAlign = "center";
    ctx.fillText(String(row.month).slice(5) || row.month, xCenter, h - 18);
  });

  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 2;
  ctx.beginPath();
  savingPoints.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  savingPoints.forEach(([x, y]) => {
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  drawLegend(ctx, w - 245, 12, "Income", "#2f8f8b");
  drawLegend(ctx, w - 165, 12, "Expense", "#eab308");
  drawLegend(ctx, w - 75, 12, "Savings", "#f97316");
}

function drawLegend(ctx, x, y, label, color) {
  ctx.fillStyle = color;
  roundRect(ctx, x, y, 12, 12, 4);
  ctx.fill();
  ctx.fillStyle = getCssVar("--muted");
  ctx.textAlign = "left";
  ctx.fillText(label, x + 18, y + 11);
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function renderNotFound() {
  app.innerHTML = `
    <section class="page">
      <div class="panel">
        <h1>Page not found</h1>
        <p class="muted">This route does not exist.</p>
        <a class="btn" href="#/dashboard">Go to Dashboard</a>
      </div>
    </section>
  `;
}

function router() {
  applySavedTheme();
  showNav();
  const hash = location.hash || "#/dashboard";
  const parts = hash.replace("#", "").split("/").filter(Boolean);
  const route = parts[0];

  if (!getToken() && !["login", "register"].includes(route)) {
    location.hash = "#/login";
    showNav();
    renderLogin();
    return;
  }

  switch (route) {
    case "login": renderLogin(); break;
    case "register": renderRegister(); break;
    case "dashboard": renderDashboard(); break;
    case "add-income": renderAddIncome(); break;
    case "income": renderIncomeHistory(); break;
    case "edit-income": renderEditIncome(parts[1]); break;
    case "add-expense": renderAddExpense(); break;
    case "expenses": renderExpenses(); break;
    case "edit-expense": renderEditExpense(parts[1]); break;
    case "budget": renderBudgetGoals(); break;
    case "settings": renderSettings(); break;
    default: renderNotFound();
  }
}

let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if ((location.hash || "#/dashboard") === "#/dashboard") renderDashboard();
  }, 250);
});
window.addEventListener("hashchange", router);
window.addEventListener("load", router);
applySavedTheme();
