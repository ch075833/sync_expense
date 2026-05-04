const STORAGE_KEY = "sync-expense-state-v10";
const LEGACY_STORAGE_KEYS = ["sync-expense-state-v9", "sync-expense-state-v8", "sync-expense-state-v7", "sync-expense-state-v6", "sync-expense-state-v5", "sync-expense-state-v4", "sync-expense-state-v3", "sync-expense-state-v2", "sync-expense-state-v1"];
const currency = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol" });
const dateFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });

const defaultCategories = [
  { id: "food", name: "Food", description: "", color: "#c2410c", icon: "Fo", protected: true }
];

const categoryColors = ["#0f766e", "#2563eb", "#7c3aed", "#be123c", "#b7791f", "#0369a1", "#15803d", "#475569", "#c2410c", "#4338ca"];

const defaultBudgets = {
  Food: 450
};

const sampleTransactions = [
  { type: "expense", amount: 42.5, category: "Food", note: "Groceries", date: todayISO(-7) },
  { type: "expense", amount: 18.75, category: "Food", note: "Lunch", date: todayISO(-4) },
  { type: "expense", amount: 64.3, category: "Food", note: "Weekly groceries", date: todayISO(-2) },
  { type: "expense", amount: 28, category: "Food", note: "Dinner", date: todayISO(0) }
].map((item) => ({ ...item, id: makeId() }));

let state = loadState();
let activeView = "dashboard";
let deferredInstallPrompt = null;

const elements = {
  form: document.querySelector("#transactionForm"),
  amountInput: document.querySelector("#amountInput"),
  categoryInput: document.querySelector("#categoryInput"),
  dateInput: document.querySelector("#dateInput"),
  noteInput: document.querySelector("#noteInput"),
  periodMonth: document.querySelector("#periodMonth"),
  searchInput: document.querySelector("#searchInput"),
  typeFilter: document.querySelector("#typeFilter"),
  transactionList: document.querySelector("#transactionList"),
  recentList: document.querySelector("#recentList"),
  todoForm: document.querySelector("#todoForm"),
  todoTitleInput: document.querySelector("#todoTitleInput"),
  todoPriceInput: document.querySelector("#todoPriceInput"),
  todoCategoryInput: document.querySelector("#todoCategoryInput"),
  todoList: document.querySelector("#todoList"),
  todoDialog: document.querySelector("#todoDialog"),
  todoEditForm: document.querySelector("#todoEditForm"),
  closeTodoDialog: document.querySelector("#closeTodoDialog"),
  cancelTodoEdit: document.querySelector("#cancelTodoEdit"),
  deleteTodoFromDialog: document.querySelector("#deleteTodoFromDialog"),
  editTodoId: document.querySelector("#editTodoId"),
  editTodoTitle: document.querySelector("#editTodoTitle"),
  editTodoPrice: document.querySelector("#editTodoPrice"),
  todoPaymentDialog: document.querySelector("#todoPaymentDialog"),
  todoPaymentForm: document.querySelector("#todoPaymentForm"),
  closeTodoPaymentDialog: document.querySelector("#closeTodoPaymentDialog"),
  cancelTodoPayment: document.querySelector("#cancelTodoPayment"),
  payTodoId: document.querySelector("#payTodoId"),
  payTodoAmount: document.querySelector("#payTodoAmount"),
  budgetList: document.querySelector("#budgetList"),
  openWalletDialog: document.querySelector("#openWalletDialog"),
  walletDialog: document.querySelector("#walletDialog"),
  walletForm: document.querySelector("#walletForm"),
  closeWalletDialog: document.querySelector("#closeWalletDialog"),
  cancelWalletEdit: document.querySelector("#cancelWalletEdit"),
  walletInput: document.querySelector("#walletInput"),
  walletTotal: document.querySelector("#walletTotal"),
  overallBudgetTotal: document.querySelector("#overallBudgetTotal"),
  overallSpentTotal: document.querySelector("#overallSpentTotal"),
  overallBudgetRemaining: document.querySelector("#overallBudgetRemaining"),
  overallSpendRemaining: document.querySelector("#overallSpendRemaining"),
  expenseTotal: document.querySelector("#expenseTotal"),
  balanceTotal: document.querySelector("#balanceTotal"),
  periodLabel: document.querySelector("#periodLabel"),
  chart: document.querySelector("#categoryChart"),
  chartLegend: document.querySelector("#chartLegend"),
  exportButton: document.querySelector("#exportButton"),
  importInput: document.querySelector("#importInput"),
  installButton: document.querySelector("#installButton"),
  installItem: document.querySelector("#installItem"),
  openAddCategoryDialog: document.querySelector("#openAddCategoryDialog"),
  categoryList: document.querySelector("#categoryList"),
  recurringList: document.querySelector("#recurringList"),
  categoryDialog: document.querySelector("#categoryDialog"),
  categoryEditForm: document.querySelector("#categoryEditForm"),
  categoryDialogTitle: document.querySelector("#categoryDialogTitle"),
  categoryDialogMode: document.querySelector("#categoryDialogMode"),
  closeCategoryDialog: document.querySelector("#closeCategoryDialog"),
  cancelCategoryEdit: document.querySelector("#cancelCategoryEdit"),
  editCategoryId: document.querySelector("#editCategoryId"),
  editCategoryName: document.querySelector("#editCategoryName"),
  editCategoryDescription: document.querySelector("#editCategoryDescription"),
  editCategoryBudget: document.querySelector("#editCategoryBudget"),
  editCategoryColor: document.querySelector("#editCategoryColor"),
  openAddRecurringDialog: document.querySelector("#openAddRecurringDialog"),
  recurringDialog: document.querySelector("#recurringDialog"),
  recurringEditForm: document.querySelector("#recurringEditForm"),
  recurringDialogTitle: document.querySelector("#recurringDialogTitle"),
  recurringDialogMode: document.querySelector("#recurringDialogMode"),
  closeRecurringDialog: document.querySelector("#closeRecurringDialog"),
  cancelRecurringEdit: document.querySelector("#cancelRecurringEdit"),
  deleteRecurringFromDialog: document.querySelector("#deleteRecurringFromDialog"),
  editRecurringId: document.querySelector("#editRecurringId"),
  editRecurringName: document.querySelector("#editRecurringName"),
  editRecurringCategory: document.querySelector("#editRecurringCategory"),
  editRecurringAmount: document.querySelector("#editRecurringAmount"),
  editRecurringStart: document.querySelector("#editRecurringStart"),
  editRecurringHasEnd: document.querySelector("#editRecurringHasEnd"),
  editRecurringEnd: document.querySelector("#editRecurringEnd"),
  editRecurringPattern: document.querySelector("#editRecurringPattern"),
  editRecurringHasAmountChange: document.querySelector("#editRecurringHasAmountChange"),
  editRecurringNextAmount: document.querySelector("#editRecurringNextAmount"),
  editRecurringAmountChangeDate: document.querySelector("#editRecurringAmountChangeDate"),
  transactionDialog: document.querySelector("#transactionDialog"),
  transactionEditForm: document.querySelector("#transactionEditForm"),
  closeTransactionDialog: document.querySelector("#closeTransactionDialog"),
  cancelTransactionEdit: document.querySelector("#cancelTransactionEdit"),
  editTransactionId: document.querySelector("#editTransactionId"),
  editTransactionAmount: document.querySelector("#editTransactionAmount"),
  editTransactionCategory: document.querySelector("#editTransactionCategory"),
  editTransactionDate: document.querySelector("#editTransactionDate"),
  editTransactionNote: document.querySelector("#editTransactionNote")
};

init();

function init() {
  if (elements.dateInput) elements.dateInput.value = todayISO();
  if (elements.periodMonth) elements.periodMonth.value = currentMonthKey();
  populateCategories();
  bindEvents();
  setView(viewFromHash() || activeView, { syncHash: false });
  render();
  registerServiceWorker();
}

function bindEvents() {
  document.addEventListener("click", handleViewClick);
  window.addEventListener("hashchange", () => setView(viewFromHash() || "dashboard", { syncHash: false }));

  bind(elements.form, "submit", addTransaction);
  bind(elements.periodMonth, "change", render);
  bind(elements.searchInput, "input", renderTransactions);
  bind(elements.typeFilter, "change", renderTransactions);
  bind(elements.todoForm, "submit", addTodo);
  bind(elements.todoEditForm, "submit", saveTodoEdit);
  bind(elements.closeTodoDialog, "click", closeTodoDialog);
  bind(elements.cancelTodoEdit, "click", closeTodoDialog);
  bind(elements.deleteTodoFromDialog, "click", deleteTodoFromDialog);
  bind(elements.todoPaymentForm, "submit", saveTodoPayment);
  bind(elements.closeTodoPaymentDialog, "click", closeTodoPaymentDialog);
  bind(elements.cancelTodoPayment, "click", closeTodoPaymentDialog);
  bind(elements.openWalletDialog, "click", openWalletDialog);
  bind(elements.walletForm, "submit", saveWallet);
  bind(elements.closeWalletDialog, "click", closeWalletDialog);
  bind(elements.cancelWalletEdit, "click", closeWalletDialog);
  bind(elements.exportButton, "click", exportData);
  bind(elements.importInput, "change", importData);
  bind(elements.installButton, "click", installApp);
  bind(elements.openAddCategoryDialog, "click", openAddCategoryDialog);
  bind(elements.categoryEditForm, "submit", saveCategoryEdit);
  bind(elements.closeCategoryDialog, "click", closeCategoryDialog);
  bind(elements.cancelCategoryEdit, "click", closeCategoryDialog);
  bind(elements.openAddRecurringDialog, "click", openAddRecurringDialog);
  bind(elements.recurringEditForm, "submit", saveRecurringEdit);
  bind(elements.editRecurringHasEnd, "change", syncRecurringDialogControls);
  bind(elements.editRecurringHasAmountChange, "change", syncRecurringDialogControls);
  bind(elements.closeRecurringDialog, "click", closeRecurringDialog);
  bind(elements.cancelRecurringEdit, "click", closeRecurringDialog);
  bind(elements.deleteRecurringFromDialog, "click", deleteRecurringFromDialog);
  bind(elements.transactionEditForm, "submit", saveTransactionEdit);
  bind(elements.closeTransactionDialog, "click", closeTransactionDialog);
  bind(elements.cancelTransactionEdit, "click", closeTransactionDialog);
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (elements.installItem) elements.installItem.hidden = false;
  });
}

function bind(element, eventName, handler) {
  if (element) element.addEventListener(eventName, handler);
}

function populateCategories() {
  const options = state.categories
    .map((category) => `<option value="${escapeHTML(category.id)}">${escapeHTML(formatCategoryLabel(category))}</option>`)
    .join("");
  if (elements.categoryInput) elements.categoryInput.innerHTML = options;
  if (elements.editTransactionCategory) elements.editTransactionCategory.innerHTML = options;
  if (elements.todoCategoryInput) elements.todoCategoryInput.innerHTML = options;
  if (elements.editRecurringCategory) elements.editRecurringCategory.innerHTML = options;
}

function handleViewClick(event) {
  const trigger = event.target.closest("[data-view], [data-view-jump]");
  if (!trigger) return;
  const view = trigger.dataset.view || trigger.dataset.viewJump;
  if (!view) return;
  event.preventDefault();
  setView(view, { syncHash: true });
}

function setView(view, options = {}) {
  const targetPanel = document.querySelector(`[data-view-panel="${view}"]`);
  if (!targetPanel) return;

  activeView = view;
  document.body.dataset.activeView = view;
  document.querySelectorAll("[data-view]").forEach((button) => {
    const isActive = button.dataset.view === view;
    button.classList.toggle("active", isActive);
    button.toggleAttribute("aria-current", isActive);
  });
  document.querySelectorAll("[data-view-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.viewPanel === view);
    panel.toggleAttribute("aria-hidden", panel.dataset.viewPanel !== view);
  });

  if (options.syncHash && window.location.hash !== `#${view}`) {
    history.pushState(null, "", `#${view}`);
  }
}

function viewFromHash() {
  return window.location.hash.replace("#", "");
}

function addTransaction(event) {
  event.preventDefault();
  const selectedCategory = getSelectedCategory(elements.categoryInput);
  const transaction = {
    id: makeId(),
    type: "expense",
    amount: Number(elements.amountInput.value),
    category: selectedCategory.name,
    categoryDescription: selectedCategory.description || "",
    date: elements.dateInput.value,
    note: elements.noteInput.value.trim()
  };

  if (!transaction.amount || transaction.amount <= 0) return;

  state.transactions.unshift(transaction);
  saveState();
  elements.form.reset();
  elements.dateInput.value = todayISO();
  render();
}

function deleteTransaction(id) {
  if (!confirm("Delete this transaction?")) return;
  state.transactions = state.transactions.filter((transaction) => transaction.id !== id);
  state.todos = state.todos.map((todo) => (
    todo.transactionId === id ? { ...todo, checked: false, transactionId: "" } : todo
  ));
  saveState();
  render();
}

function addTodo(event) {
  event.preventDefault();
  const selectedCategory = getSelectedCategory(elements.todoCategoryInput);
  const todo = {
    id: makeId(),
    title: elements.todoTitleInput.value.trim(),
    price: Number(elements.todoPriceInput.value) || 0,
    category: selectedCategory.name,
    categoryDescription: selectedCategory.description || "",
    checked: false,
    transactionId: "",
    createdAt: new Date().toISOString()
  };

  if (!todo.title) return;

  state.todos.unshift(todo);
  saveState();
  elements.todoForm.reset();
  elements.todoCategoryInput.value = state.categories[0]?.id || "food";
  render();
}

function toggleTodo(id, checked) {
  const todo = state.todos.find((item) => item.id === id);
  if (!todo) return;

  if (checked) {
    openTodoPaymentDialog(id);
    render();
    return;
  }

  todo.checked = checked;
  if (todo.transactionId) {
    state.transactions = state.transactions.filter((transaction) => transaction.id !== todo.transactionId);
    todo.transactionId = "";
  }

  saveState();
  render();
}

function openTodoDialog(id) {
  const todo = state.todos.find((item) => item.id === id);
  if (!todo) return;

  elements.editTodoId.value = todo.id;
  elements.editTodoTitle.value = todo.title;
  elements.editTodoPrice.value = todo.price || "";
  elements.todoDialog.showModal();
}

function closeTodoDialog() {
  elements.todoDialog.close();
}

function saveTodoEdit(event) {
  event.preventDefault();
  const todo = state.todos.find((item) => item.id === elements.editTodoId.value);
  if (!todo) return;
  const title = elements.editTodoTitle.value.trim();
  const price = Number(elements.editTodoPrice.value) || 0;
  if (!title || (todo.checked && price <= 0)) return;

  todo.title = title;
  todo.price = price;
  syncTodoTransaction(todo);
  saveState();
  render();
  closeTodoDialog();
}

function deleteTodoFromDialog() {
  deleteTodo(elements.editTodoId.value);
}

function openTodoPaymentDialog(id) {
  const todo = state.todos.find((item) => item.id === id);
  if (!todo) return;
  elements.payTodoId.value = todo.id;
  elements.payTodoAmount.value = todo.price > 0 ? todo.price : "";
  openModal(elements.todoPaymentDialog);
  elements.payTodoAmount.focus();
}

function closeTodoPaymentDialog() {
  closeModal(elements.todoPaymentDialog);
}

function saveTodoPayment(event) {
  event.preventDefault();
  const todo = state.todos.find((item) => item.id === elements.payTodoId.value);
  const amount = Number(elements.payTodoAmount.value);
  if (!todo || !amount || amount <= 0) return;

  todo.price = amount;
  todo.checked = true;
  const linkedTransaction = todo.transactionId
    ? state.transactions.find((transaction) => transaction.id === todo.transactionId)
    : null;
  if (linkedTransaction) {
    syncTodoTransaction(todo);
  } else {
    const transaction = makeTodoTransaction(todo);
    todo.transactionId = transaction.id;
    state.transactions.unshift(transaction);
  }

  saveState();
  render();
  closeTodoPaymentDialog();
}

function deleteTodo(id) {
  const todo = state.todos.find((item) => item.id === id);
  if (!todo) return;
  if (!confirm("Delete this todo item?")) return;
  if (todo.transactionId) {
    state.transactions = state.transactions.filter((transaction) => transaction.id !== todo.transactionId);
  }
  state.todos = state.todos.filter((item) => item.id !== id);
  saveState();
  render();
  if (elements.todoDialog.open) closeTodoDialog();
}

function deleteRecurringOccurrence(key) {
  if (!confirm("Skip this recurring payment for this date?")) return;
  state.recurringSkips = [...(state.recurringSkips || []), key].filter((item, index, list) => list.indexOf(item) === index);
  saveState();
  render();
}

function openTransactionDialog(id) {
  const transaction = state.transactions.find((item) => item.id === id);
  if (!transaction) return;

  elements.editTransactionId.value = transaction.id;
  elements.editTransactionAmount.value = transaction.amount;
  elements.editTransactionCategory.value = getCategoryOptionValue(transaction.category, transaction.categoryDescription);
  elements.editTransactionDate.value = transaction.date;
  elements.editTransactionNote.value = transaction.note || "";
  elements.transactionDialog.showModal();
}

function closeTransactionDialog() {
  elements.transactionDialog.close();
}

function saveTransactionEdit(event) {
  event.preventDefault();
  const transaction = state.transactions.find((item) => item.id === elements.editTransactionId.value);
  if (!transaction) return;
  const amount = Number(elements.editTransactionAmount.value);
  if (!amount || amount <= 0) return;

  transaction.type = "expense";
  transaction.amount = amount;
  const selectedCategory = getSelectedCategory(elements.editTransactionCategory);
  transaction.category = selectedCategory.name;
  transaction.categoryDescription = selectedCategory.description || "";
  transaction.date = elements.editTransactionDate.value;
  transaction.note = elements.editTransactionNote.value.trim();

  saveState();
  render();
  closeTransactionDialog();
}

function render() {
  const monthKey = selectedMonthKey();
  const allTransactions = getTransactionsWithRecurring();
  const monthly = allTransactions.filter((transaction) => monthFromDate(transaction.date) === monthKey);
  const wallet = Number(state.wallet || 0);
  const expenses = sum(monthly.filter((item) => item.type === "expense"));

  setText(elements.periodLabel, monthLabel(monthKey));
  setText(elements.expenseTotal, currency.format(expenses));
  setText(elements.balanceTotal, currency.format(wallet - expenses));

  renderChart(monthly);
  renderTransactions();
  renderRecent(monthly);
  renderTodos();
  renderOverall(monthly);
  renderBudgets(monthly);
  renderCategories();
  renderRecurringExpenses();
}

function renderOverall(monthly) {
  if (!elements.walletTotal) return;
  const wallet = Number(state.wallet || 0);
  const budgetTotal = totalBudget();
  const spentTotal = sum(monthly.filter((item) => item.type === "expense"));

  elements.walletTotal.textContent = currency.format(wallet);
  elements.overallBudgetTotal.textContent = currency.format(budgetTotal);
  elements.overallSpentTotal.textContent = currency.format(spentTotal);
  elements.overallBudgetRemaining.textContent = currency.format(wallet - budgetTotal);
  elements.overallSpendRemaining.textContent = currency.format(wallet - spentTotal);
}

function setText(element, value) {
  if (element) element.textContent = value;
}

function openWalletDialog() {
  elements.walletInput.value = Number(state.wallet || 0);
  openModal(elements.walletDialog);
  elements.walletInput.focus();
}

function closeWalletDialog() {
  closeModal(elements.walletDialog);
}

function saveWallet(event) {
  event.preventDefault();
  const wallet = Number(elements.walletInput.value);
  if (Number.isNaN(wallet) || wallet < 0) return;
  state.wallet = wallet;
  saveState();
  render();
  closeWalletDialog();
}

function openModal(dialog) {
  if (!dialog) return;
  if (typeof dialog.showModal === "function") {
    try {
      dialog.showModal();
      return;
    } catch (error) {
      console.warn("Dialog showModal failed, using open fallback", error);
    }
  }
  dialog.setAttribute("open", "");
}

function closeModal(dialog) {
  if (!dialog) return;
  if (typeof dialog.close === "function") {
    dialog.close();
    return;
  }
  dialog.removeAttribute("open");
}

function renderTransactions() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const type = elements.typeFilter.value;
  const monthKey = selectedMonthKey();
  const filtered = getTransactionsWithRecurring().filter((transaction) => {
    const matchesType = type === "all" || transaction.type === type;
    const haystack = `${formatStoredCategory(transaction)} ${transaction.note}`.toLowerCase();
    return monthFromDate(transaction.date) === monthKey && matchesType && haystack.includes(query);
  });
  renderList(elements.transactionList, filtered, { actions: true });
}

function renderRecent(monthly) {
  renderList(elements.recentList, monthly.slice().sort(sortByDateDesc).slice(0, 8), { actions: false });
}

function renderTodos() {
  if (!elements.todoList) return;
  if (!state.todos.length) {
    elements.todoList.innerHTML = `
      <div class="empty-state">
        <strong>No todo items yet</strong>
        <span>Add something you plan to buy, then check it when paid.</span>
      </div>
    `;
    return;
  }

  elements.todoList.innerHTML = state.todos
    .map((todo) => {
      const category = getCategory(todo.category);
      return `
        <article class="todo-row ${todo.checked ? "checked" : ""}">
          <label class="todo-check" title="Mark as paid">
            <input type="checkbox" data-toggle-todo="${todo.id}" ${todo.checked ? "checked" : ""}>
            <span>${todo.checked ? "Paid" : "Pending"}</span>
          </label>
          <div class="category-icon" style="background:${category.color}">${category.icon}</div>
          <div class="row-title">
            <strong>${escapeHTML(todo.title)}</strong>
            <span>${escapeHTML(formatStoredCategory(todo))}</span>
          </div>
          <strong class="price-tag">${todo.price > 0 ? currency.format(todo.price) : "No estimate"}</strong>
          <button class="secondary" type="button" data-edit-todo="${todo.id}">Edit</button>
        </article>
      `;
    })
    .join("");

  elements.todoList.querySelectorAll("[data-toggle-todo]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => toggleTodo(checkbox.dataset.toggleTodo, checkbox.checked));
  });
  elements.todoList.querySelectorAll("[data-edit-todo]").forEach((button) => {
    button.addEventListener("click", () => openTodoDialog(button.dataset.editTodo));
  });
}

function renderList(container, items, options = { actions: true }) {
  if (!items.length) {
    container.innerHTML = document.querySelector("#emptyStateTemplate").innerHTML;
    return;
  }

  container.innerHTML = items
    .sort(sortByDateDesc)
    .map((transaction) => {
      const category = getCategory(transaction.category);
      const sign = transaction.type === "income" ? "+" : "-";
      return `
        <article class="transaction-row">
          <div class="category-icon" style="background:${category.color}">${category.icon}</div>
          <div class="row-title">
            <strong>${escapeHTML(transaction.note || formatStoredCategory(transaction))}</strong>
            <span>${escapeHTML(formatStoredCategory(transaction))}</span>
          </div>
          <span class="row-date">${dateFormatter.format(new Date(`${transaction.date}T00:00:00`))}</span>
          <strong class="amount ${transaction.type}">${sign}${currency.format(transaction.amount)}</strong>
          ${renderTransactionActions(transaction, options.actions)}
        </article>
      `;
    })
    .join("");

  container.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteTransaction(button.dataset.delete));
  });
  container.querySelectorAll("[data-delete-recurring]").forEach((button) => {
    button.addEventListener("click", () => deleteRecurringOccurrence(button.dataset.deleteRecurring));
  });
  container.querySelectorAll("[data-edit-transaction]").forEach((button) => {
    button.addEventListener("click", () => openTransactionDialog(button.dataset.editTransaction));
  });
}

function renderTransactionActions(transaction, showActions) {
  if (!showActions) return "";
  if (transaction.recurring) {
    return `<button class="delete-button" type="button" data-delete-recurring="${transaction.recurringKey}" title="Skip recurring payment" aria-label="Skip recurring payment">x</button>`;
  }
  return `
    <div class="row-actions">
      <button class="secondary" type="button" data-edit-transaction="${transaction.id}">Edit</button>
      <button class="delete-button" type="button" data-delete="${transaction.id}" title="Delete transaction" aria-label="Delete transaction">x</button>
    </div>
  `;
}

function renderBudgets(monthly) {
  const expenseTotals = groupExpenses(monthly);
  elements.budgetList.innerHTML = getBudgetCategories()
    .map((categoryName) => {
      const budget = state.budgets[categoryName] || 0;
      const spent = expenseTotals[categoryName] || 0;
      const ratio = budget > 0 ? spent / budget : 0;
      const fillClass = ratio > 1 ? "over" : ratio > 0.8 ? "warn" : "";
      const isOver = ratio > 1;
      return `
        <article class="budget-row">
          <div class="budget-meta">
            <strong>${categoryName}</strong>
            <div class="budget-bar" aria-hidden="true">
              <div class="budget-fill ${fillClass}" style="width:${Math.min(ratio * 100, 100)}%"></div>
            </div>
            <span class="row-date">${currency.format(spent)} of ${currency.format(budget)}</span>
          </div>
          <div class="budget-status ${isOver ? "over" : "ok"}">
            <span class="face" aria-hidden="true"></span>
            <strong>${Math.round(ratio * 100)}%</strong>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCategories() {
  if (!elements.categoryList) return;
  elements.categoryList.innerHTML = state.categories
    .map((category) => renderCategoryRow(category))
    .join("");

  elements.categoryList.querySelectorAll("[data-delete-category]").forEach((button) => {
    button.addEventListener("click", () => deleteCategory(button.dataset.deleteCategory));
  });

  elements.categoryList.querySelectorAll("[data-edit-category]").forEach((button) => {
    button.addEventListener("click", () => openCategoryDialog(button.dataset.editCategory));
  });
}

function renderCategoryRow(category) {
  const isSharedBudget = state.categories.some((item) => item.id !== category.id && item.name === category.name);
  const budgetLabel = isSharedBudget ? `${category.name} shared monthly budget` : "monthly budget";
  return `
    <article class="category-row">
      <div class="category-icon" style="background:${category.color}">${category.icon}</div>
      <div class="row-title">
        <strong>${escapeHTML(formatCategoryLabel(category))}</strong>
        <span>${currency.format(state.budgets[category.name] || 0)} ${escapeHTML(budgetLabel)}</span>
      </div>
      <div class="row-actions">
        <button class="secondary" type="button" data-edit-category="${category.id}">Edit</button>
        ${category.protected ? "" : `<button class="delete-button" type="button" data-delete-category="${category.id}" title="Delete category" aria-label="Delete category">x</button>`}
      </div>
    </article>
  `;
}

function renderRecurringExpenses() {
  if (!elements.recurringList) return;
  const recurringExpenses = state.recurringExpenses || [];
  if (!recurringExpenses.length) {
    elements.recurringList.innerHTML = `
      <div class="empty-state">
        <strong>No recurring expenses</strong>
        <span>Add bills or repeat payments here, separate from categories.</span>
      </div>
    `;
    return;
  }

  elements.recurringList.innerHTML = recurringExpenses
    .map((expense) => {
      const category = getCategory(expense.category);
      return `
        <article class="category-row">
          <div class="category-icon" style="background:${category.color}">${category.icon}</div>
          <div class="row-title">
            <strong>${escapeHTML(expense.name)}</strong>
            <span>${escapeHTML(formatStoredCategory(expense))}</span>
            <div class="category-tags">
              <span class="tag recurring">${escapeHTML(getRecurringLabel(expense))}</span>
            </div>
          </div>
          <div class="row-actions">
            <button class="secondary" type="button" data-edit-recurring="${expense.id}">Edit</button>
            <button class="delete-button" type="button" data-delete-recurring-expense="${expense.id}" title="Delete recurring expense" aria-label="Delete recurring expense">x</button>
          </div>
        </article>
      `;
    })
    .join("");

  elements.recurringList.querySelectorAll("[data-edit-recurring]").forEach((button) => {
    button.addEventListener("click", () => openRecurringDialog(button.dataset.editRecurring));
  });
  elements.recurringList.querySelectorAll("[data-delete-recurring-expense]").forEach((button) => {
    button.addEventListener("click", () => deleteRecurringExpense(button.dataset.deleteRecurringExpense));
  });
}

function openAddCategoryDialog() {
  elements.categoryDialogTitle.textContent = "Add category";
  elements.categoryDialogMode.value = "add";
  elements.editCategoryId.value = "";
  elements.editCategoryName.value = "";
  elements.editCategoryDescription.value = "";
  elements.editCategoryBudget.value = 0;
  elements.editCategoryColor.value = getRandomCategoryColor();
  openModal(elements.categoryDialog);
  elements.editCategoryName.focus();
}

function openCategoryDialog(id) {
  const category = state.categories.find((item) => item.id === id);
  if (!category) return;

  elements.categoryDialogTitle.textContent = "Edit category";
  elements.categoryDialogMode.value = "edit";
  elements.editCategoryId.value = category.id;
  elements.editCategoryName.value = category.name;
  elements.editCategoryDescription.value = category.description || "";
  elements.editCategoryBudget.value = state.budgets[category.name] || 0;
  elements.editCategoryColor.value = category.color;
  openModal(elements.categoryDialog);
  elements.editCategoryName.focus();
}

function closeCategoryDialog() {
  closeModal(elements.categoryDialog);
}

function saveCategoryEdit(event) {
  event.preventDefault();
  if (elements.categoryDialogMode.value === "add") {
    addCategoryFromDialog();
    return;
  }
  const id = elements.editCategoryId.value;
  const category = state.categories.find((item) => item.id === id);
  if (!category) return;
  const previousName = category.name;
  const previousDescription = category.description || "";

  const nextName = normalizeCategoryName(elements.editCategoryName.value);
  const nextDescription = normalizeCategoryDescription(elements.editCategoryDescription.value);
  if (!nextName) return;
  const duplicate = state.categories.some((item) => isSameCategoryLabel(item, nextName, nextDescription) && item.id !== id);
  if (duplicate) return;

  const budget = Number(elements.editCategoryBudget.value) || 0;

  category.name = nextName;
  category.description = nextDescription;
  category.color = elements.editCategoryColor.value;
  category.icon = makeCategoryIcon(nextName);

  if (previousName !== nextName && !state.categories.some((item) => item.id !== id && item.name === previousName)) {
    delete state.budgets[previousName];
  }
  state.budgets[nextName] = budget;
  state.transactions = state.transactions.map((transaction) => (
    transaction.category === previousName && (transaction.categoryDescription || "") === previousDescription
      ? { ...transaction, category: nextName, categoryDescription: nextDescription }
      : transaction
  ));
  state.todos = state.todos.map((todo) => (
    todo.category === previousName && (todo.categoryDescription || "") === previousDescription
      ? { ...todo, category: nextName, categoryDescription: nextDescription }
      : todo
  ));
  state.recurringExpenses = (state.recurringExpenses || []).map((expense) => (
    expense.category === previousName && (expense.categoryDescription || "") === previousDescription
      ? { ...expense, category: nextName, categoryDescription: nextDescription }
      : expense
  ));

  saveState();
  populateCategories();
  render();
  closeCategoryDialog();
}

function addCategoryFromDialog() {
  const name = normalizeCategoryName(elements.editCategoryName.value);
  const description = normalizeCategoryDescription(elements.editCategoryDescription.value);
  if (!name || state.categories.some((category) => isSameCategoryLabel(category, name, description))) return;
  const hasExistingBudget = Object.prototype.hasOwnProperty.call(state.budgets, name);
  const budget = Number(elements.editCategoryBudget.value) || 0;

  state.categories.push({
    id: makeId(),
    name,
    description,
    color: elements.editCategoryColor.value || getRandomCategoryColor(),
    icon: makeCategoryIcon(name),
    protected: false
  });
  state.budgets[name] = hasExistingBudget && budget === 0 ? state.budgets[name] : budget;
  saveState();
  populateCategories();
  render();
  closeCategoryDialog();
}

function deleteCategory(id) {
  const categoryToDelete = state.categories.find((category) => category.id === id);
  if (!categoryToDelete || categoryToDelete.protected) return;
  const label = formatCategoryLabel(categoryToDelete);
  if (!confirm(`Delete ${label}? Transactions in this category will move to Food.`)) return;
  const name = categoryToDelete.name;
  const description = categoryToDelete.description || "";
  state.categories = state.categories.filter((category) => (category.id !== id && !isSameCategoryLabel(category, name, description)) || category.protected);
  const categoryNameStillExists = state.categories.some((category) => category.name === name);
  if (!categoryNameStillExists) {
    state.transactions = state.transactions.map((transaction) => (
      transaction.category === name ? { ...transaction, category: "Food", categoryDescription: "" } : transaction
    ));
    state.todos = state.todos.map((todo) => (
      todo.category === name ? { ...todo, category: "Food", categoryDescription: "" } : todo
    ));
    state.recurringExpenses = (state.recurringExpenses || []).map((expense) => (
      expense.category === name ? { ...expense, category: "Food", categoryDescription: "" } : expense
    ));
    delete state.budgets[name];
  } else {
    state.recurringExpenses = (state.recurringExpenses || []).filter((expense) => (
      !(expense.category === name && (expense.categoryDescription || "") === description)
    ));
    state.transactions = state.transactions.map((transaction) => (
      transaction.category === name && (transaction.categoryDescription || "") === description
        ? { ...transaction, categoryDescription: "" }
        : transaction
    ));
    state.todos = state.todos.map((todo) => (
      todo.category === name && (todo.categoryDescription || "") === description
        ? { ...todo, categoryDescription: "" }
        : todo
    ));
  }
  saveState();
  populateCategories();
  render();
}

function openAddRecurringDialog() {
  elements.recurringDialogTitle.textContent = "Add recurring expense";
  elements.recurringDialogMode.value = "add";
  elements.editRecurringId.value = "";
  elements.editRecurringName.value = "";
  elements.editRecurringCategory.value = state.categories[0]?.id || "food";
  elements.editRecurringAmount.value = "";
  elements.editRecurringStart.value = todayISO();
  elements.editRecurringHasEnd.checked = false;
  elements.editRecurringEnd.value = "";
  elements.editRecurringPattern.value = "monthly";
  elements.editRecurringHasAmountChange.checked = false;
  elements.editRecurringNextAmount.value = "";
  elements.editRecurringAmountChangeDate.value = "";
  elements.deleteRecurringFromDialog.hidden = true;
  syncRecurringDialogControls();
  openModal(elements.recurringDialog);
  elements.editRecurringName.focus();
}

function openRecurringDialog(id) {
  const expense = (state.recurringExpenses || []).find((item) => item.id === id);
  if (!expense) return;

  elements.recurringDialogTitle.textContent = "Edit recurring expense";
  elements.recurringDialogMode.value = "edit";
  elements.editRecurringId.value = expense.id;
  elements.editRecurringName.value = expense.name;
  elements.editRecurringCategory.value = getCategoryOptionValue(expense.category, expense.categoryDescription);
  elements.editRecurringAmount.value = expense.amount;
  elements.editRecurringStart.value = expense.recurringStart || todayISO();
  elements.editRecurringHasEnd.checked = Boolean(expense.recurringEnd);
  elements.editRecurringEnd.value = expense.recurringEnd || "";
  elements.editRecurringPattern.value = expense.recurringPattern || "monthly";
  elements.editRecurringHasAmountChange.checked = Boolean(expense.recurringAmountChangeDate && expense.recurringNextAmount);
  elements.editRecurringNextAmount.value = expense.recurringNextAmount || "";
  elements.editRecurringAmountChangeDate.value = expense.recurringAmountChangeDate || "";
  elements.deleteRecurringFromDialog.hidden = false;
  syncRecurringDialogControls();
  openModal(elements.recurringDialog);
  elements.editRecurringName.focus();
}

function closeRecurringDialog() {
  closeModal(elements.recurringDialog);
}

function saveRecurringEdit(event) {
  event.preventDefault();
  const selectedCategory = getSelectedCategory(elements.editRecurringCategory);
  const recurringExpense = readRecurringDialog(selectedCategory);
  if (!recurringExpense) return;

  if (elements.recurringDialogMode.value === "add") {
    state.recurringExpenses = [...(state.recurringExpenses || []), { id: makeId(), ...recurringExpense }];
  } else {
    const id = elements.editRecurringId.value;
    state.recurringExpenses = (state.recurringExpenses || []).map((expense) => (
      expense.id === id ? { ...expense, ...recurringExpense } : expense
    ));
  }

  saveState();
  render();
  closeRecurringDialog();
}

function readRecurringDialog(selectedCategory) {
  const name = elements.editRecurringName.value.trim().replace(/\s+/g, " ").slice(0, 80);
  const amount = Number(elements.editRecurringAmount.value);
  if (!name || !amount || amount <= 0) return null;
  const recurringStart = normalizeRecurringStart({ recurringStart: elements.editRecurringStart.value });
  const recurringEnd = elements.editRecurringHasEnd.checked ? normalizeRecurringEnd(elements.editRecurringEnd.value, recurringStart) : "";
  const amountChangeDate = elements.editRecurringHasAmountChange.checked
    ? normalizeAmountChangeDate(elements.editRecurringAmountChangeDate.value, recurringStart, recurringEnd)
    : "";
  const nextAmount = amountChangeDate ? Number(elements.editRecurringNextAmount.value) || amount : 0;

  return {
    name,
    amount,
    category: selectedCategory.name,
    categoryDescription: selectedCategory.description || "",
    recurringStart,
    recurringEnd,
    recurringPattern: elements.editRecurringPattern.value,
    recurringAmountChangeDate: amountChangeDate,
    recurringNextAmount: nextAmount
  };
}

function deleteRecurringFromDialog() {
  deleteRecurringExpense(elements.editRecurringId.value);
}

function deleteRecurringExpense(id) {
  if (!id) return;
  if (!confirm("Delete this recurring expense?")) return;
  state.recurringExpenses = (state.recurringExpenses || []).filter((expense) => expense.id !== id);
  state.recurringSkips = (state.recurringSkips || []).filter((key) => !key.startsWith(`recurring-${id}-`));
  saveState();
  render();
  if (elements.recurringDialog.open) closeRecurringDialog();
}

function syncRecurringDialogControls() {
  if (!elements.editRecurringStart.value) {
    elements.editRecurringStart.value = todayISO();
  }
  elements.editRecurringEnd.disabled = !elements.editRecurringHasEnd.checked;
  elements.editRecurringNextAmount.disabled = !elements.editRecurringHasAmountChange.checked;
  elements.editRecurringAmountChangeDate.disabled = !elements.editRecurringHasAmountChange.checked;
}

function renderChart(monthly) {
  const ctx = elements.chart.getContext("2d");
  const totals = groupExpenses(monthly);
  const entries = Object.entries(totals).filter(([, value]) => value > 0);
  const total = entries.reduce((acc, [, value]) => acc + value, 0);
  const width = elements.chart.width;
  const height = elements.chart.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.38;

  ctx.clearRect(0, 0, width, height);
  if (!entries.length) {
    ctx.fillStyle = "#667085";
    ctx.font = "16px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("No expense data for this month", centerX, centerY);
    elements.chartLegend.innerHTML = "";
    return;
  }

  let start = -Math.PI / 2;
  entries.forEach(([categoryName, value]) => {
    const category = getCategory(categoryName);
    const slice = (value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = category.color;
    ctx.fill();
    start += slice;
  });

  ctx.beginPath();
  ctx.fillStyle = "#ffffff";
  ctx.arc(centerX, centerY, radius * 0.56, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#152033";
  ctx.font = "700 22px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(currency.format(total), centerX, centerY - 2);
  ctx.fillStyle = "#667085";
  ctx.font = "12px system-ui";
  ctx.fillText("spent", centerX, centerY + 18);

  elements.chartLegend.innerHTML = entries
    .map(([categoryName, value]) => {
      const category = getCategory(categoryName);
      return `
        <span class="legend-item">
          <span class="swatch" style="background:${category.color}"></span>
          ${categoryName} ${Math.round((value / total) * 100)}%
        </span>
      `;
    })
    .join("");
}

function loadState() {
  for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
    try {
      const stored = JSON.parse(localStorage.getItem(key));
      if (stored?.transactions && stored?.budgets) return normalizeState(stored);
    } catch (error) {
      console.warn("Could not load expense data", error);
    }
  }
  return normalizeState({ transactions: sampleTransactions, budgets: defaultBudgets, categories: defaultCategories });
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sync-expense-${todayISO()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const [file] = event.target.files;
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const incoming = JSON.parse(reader.result);
      if (!Array.isArray(incoming.transactions) || typeof incoming.budgets !== "object") throw new Error("Invalid file");
      state = normalizeState(incoming);
      saveState();
      populateCategories();
      render();
    } catch {
      alert("That JSON file does not look like Sync Expense data.");
    }
  });
  reader.readAsText(file);
  event.target.value = "";
}

function loadSampleData() {
  state = normalizeState({
    transactions: sampleTransactions.map((item) => ({ ...item, id: makeId() })),
    todos: [],
    budgets: { ...defaultBudgets },
    categories: defaultCategories
  });
  saveState();
  populateCategories();
  render();
}

async function installApp() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  if (elements.installItem) elements.installItem.hidden = true;
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("sw.js")
      .then((registration) => registration.update())
      .catch((error) => console.warn("Service worker registration failed", error));
  }
}

function groupExpenses(transactions) {
  return transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
      return acc;
    }, {});
}

function totalBudget() {
  return Object.values(state.budgets || {}).reduce((acc, value) => acc + Number(value || 0), 0);
}

function getBudgetCategories() {
  return state.categories
    .map((category) => category.name)
    .filter((name, index, list) => list.indexOf(name) === index);
}

function sum(items) {
  return items.reduce((acc, transaction) => acc + transaction.amount, 0);
}

function getCategory(name) {
  return state.categories.find((category) => category.name === name) || {
    name,
    description: "",
    color: "#475569",
    icon: makeCategoryIcon(name)
  };
}

function getSelectedCategory(select) {
  return state.categories.find((category) => category.id === select.value) || state.categories[0] || getCategory("Food");
}

function getCategoryOptionValue(name, description = "") {
  return (
    state.categories.find((category) => category.name === name && (category.description || "") === (description || "")) ||
    state.categories.find((category) => category.name === name) ||
    state.categories[0] ||
    { id: "food" }
  ).id;
}

function formatStoredCategory(item) {
  return item.categoryDescription ? `${item.category} - ${item.categoryDescription}` : item.category;
}

function getTransactionsWithRecurring() {
  return [...state.transactions, ...getRecurringTransactions()];
}

function makeTodoTransaction(todo) {
  return {
    id: makeId(),
    type: "expense",
    amount: todo.price,
    category: todo.category,
    categoryDescription: todo.categoryDescription || "",
    date: todayISO(),
    note: todo.title,
    todoId: todo.id
  };
}

function syncTodoTransaction(todo) {
  if (!todo.transactionId) return;
  const transaction = state.transactions.find((item) => item.id === todo.transactionId);
  if (!transaction) {
    todo.checked = false;
    todo.transactionId = "";
    return;
  }
  transaction.amount = todo.price;
  transaction.note = todo.title;
  transaction.category = todo.category;
  transaction.categoryDescription = todo.categoryDescription || "";
}

function getRecurringTransactions() {
  const monthKeys = new Set([selectedMonthKey(), currentMonthKey(), ...state.transactions.map((transaction) => monthFromDate(transaction.date))]);
  return [...monthKeys].flatMap((monthKey) => {
    return (state.recurringExpenses || [])
      .filter((expense) => hasRecurringAmount(expense))
      .flatMap((expense) => {
        return getRecurringDatesForMonth(expense, monthKey).filter((date) => !isRecurringSkipped(expense.id, date)).map((date) => ({
          id: getRecurringKey(expense.id, date),
          recurringKey: getRecurringKey(expense.id, date),
          type: "expense",
          amount: getRecurringAmountForDate(expense, date),
          category: expense.category,
          categoryDescription: expense.categoryDescription || "",
          date,
          note: expense.name,
          recurring: true
        }));
      });
  });
}

function getRecurringDatesForMonth(expense, monthKey) {
  const start = parseISODate(expense.recurringStart || todayISO());
  const end = expense.recurringEnd ? parseISODate(expense.recurringEnd) : null;
  const today = parseISODate(todayISO());
  const monthStart = parseISODate(`${monthKey}-01`);
  const [year, month] = monthKey.split("-").map(Number);
  const monthEnd = new Date(year, month, 0);
  if (start > monthEnd) return [];
  if (end && end < monthStart) return [];
  if (monthStart > today) return [];
  const recurrenceEnd = [end, monthEnd, today].filter(Boolean).sort((a, b) => a - b)[0];

  if (expense.recurringPattern === "daily") {
    const first = start > monthStart ? start : monthStart;
    const dates = [];
    for (let cursor = new Date(first); cursor <= recurrenceEnd; cursor.setDate(cursor.getDate() + 1)) {
      dates.push(toISODate(cursor));
    }
    return dates;
  }

  if (expense.recurringPattern === "weekly") {
    const dates = [];
    const cursor = new Date(start);
    while (cursor < monthStart) {
      cursor.setDate(cursor.getDate() + 7);
    }
    while (cursor <= recurrenceEnd) {
      dates.push(toISODate(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
    return dates;
  }

  if (expense.recurringPattern === "yearly") {
    if (start.getMonth() !== monthStart.getMonth()) return [];
    const day = Math.min(start.getDate(), monthEnd.getDate());
    const yearlyDate = new Date(year, month - 1, day);
    return yearlyDate >= start && yearlyDate <= recurrenceEnd ? [toISODate(yearlyDate)] : [];
  }

  const monthsElapsed = (year - start.getFullYear()) * 12 + (month - 1 - start.getMonth());
  if (monthsElapsed < 0) return [];
  const day = Math.min(start.getDate(), monthEnd.getDate());
  const monthlyDate = new Date(year, month - 1, day);
  return monthlyDate <= recurrenceEnd ? [toISODate(monthlyDate)] : [];
}

function getRecurringAmountForDate(expense, date) {
  const baseAmount = Number(expense.amount || 0);
  if (
    expense.recurringAmountChangeDate &&
    expense.recurringNextAmount &&
    parseISODate(date) >= parseISODate(expense.recurringAmountChangeDate)
  ) {
    return Number(expense.recurringNextAmount);
  }
  return baseAmount;
}

function hasRecurringAmount(expense) {
  return Number(expense.amount || 0) > 0 || Number(expense.recurringNextAmount || 0) > 0;
}

function getRecurringKey(categoryId, date) {
  return `recurring-${categoryId}-${date}`;
}

function isRecurringSkipped(categoryId, date) {
  return (state.recurringSkips || []).includes(getRecurringKey(categoryId, date));
}

function sortByDateDesc(a, b) {
  return new Date(b.date) - new Date(a.date);
}

function todayISO(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function monthFromDate(date) {
  return date.slice(0, 7);
}

function currentMonthKey() {
  return todayISO().slice(0, 7);
}

function selectedMonthKey() {
  return elements.periodMonth?.value || currentMonthKey();
}

function monthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function daysInMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeState(incoming) {
  const customCategories = Array.isArray(incoming.categories)
    ? incoming.categories.filter((category) => category.name && (category.name !== "Food" || category.description))
    : [];
  const categories = [
    ...defaultCategories.map((category) => ({ ...category })),
    ...customCategories.map((category) => ({
      id: category.id || makeId(),
      name: normalizeCategoryName(category.name),
      description: normalizeCategoryDescription(category.description || ""),
      color: category.color || "#0f766e",
      icon: category.icon || makeCategoryIcon(category.name),
      protected: false
    }))
  ].filter((category, index, list) => category.name && list.findIndex((item) => categoryKey(item) === categoryKey(category)) === index);

  const budgets = {};
  categories.forEach((category) => {
    budgets[category.name] = Number(incoming.budgets?.[category.name] ?? defaultBudgets[category.name] ?? 0);
  });

  const categoryNames = new Set(categories.map((category) => category.name));
  const transactions = Array.isArray(incoming.transactions)
    ? incoming.transactions.map((transaction) => ({
      ...transaction,
      category: categoryNames.has(transaction.category) ? transaction.category : "Food",
      categoryDescription: getValidCategoryDescription(transaction.category, transaction.categoryDescription, categories)
    }))
    : [];
  const transactionIds = new Set(transactions.map((transaction) => transaction.id));
  const todos = Array.isArray(incoming.todos)
    ? incoming.todos
      .filter((todo) => todo.title)
      .map((todo) => {
        const transactionId = transactionIds.has(todo.transactionId) ? todo.transactionId : "";
        const price = Number(todo.price) || 0;
        return {
          id: todo.id || makeId(),
          title: String(todo.title).trim().slice(0, 80),
          price,
          category: categoryNames.has(todo.category) ? todo.category : "Food",
          categoryDescription: getValidCategoryDescription(todo.category, todo.categoryDescription, categories),
          checked: Boolean(todo.checked && transactionId && price > 0),
          transactionId,
          createdAt: todo.createdAt || new Date().toISOString()
        };
      })
    : [];
  const recurringExpenses = normalizeRecurringExpenses(incoming, categories, categoryNames);

  return {
    transactions,
    todos,
    budgets,
    categories,
    recurringExpenses,
    wallet: Number(incoming.wallet || 0),
    recurringSkips: Array.isArray(incoming.recurringSkips) ? incoming.recurringSkips : []
  };
}

function normalizeRecurringExpenses(incoming, categories, categoryNames) {
  const fromExpenses = Array.isArray(incoming.recurringExpenses)
    ? incoming.recurringExpenses.map((expense) => normalizeRecurringExpense(expense, categories, categoryNames))
    : [];
  const fromLegacyCategories = Array.isArray(incoming.categories)
    ? incoming.categories
      .filter((category) => category.recurring)
      .map((category) => normalizeRecurringExpense({
        id: category.id || makeId(),
        name: `${formatCategoryLabel({
          name: normalizeCategoryName(category.name),
          description: normalizeCategoryDescription(category.description || "")
        })} recurring payment`,
        amount: Number(category.recurringAmount ?? incoming.budgets?.[category.name] ?? defaultBudgets[category.name] ?? 0),
        category: category.name,
        categoryDescription: category.description || "",
        recurringStart: category.recurringStart,
        recurringEnd: category.recurringEnd,
        recurringPattern: category.recurringPattern,
        recurringAmountChangeDate: category.recurringAmountChangeDate,
        recurringNextAmount: category.recurringNextAmount
      }, categories, categoryNames))
    : [];

  return [...fromExpenses, ...fromLegacyCategories]
    .filter((expense) => expense.name && hasRecurringAmount(expense))
    .filter((expense, index, list) => list.findIndex((item) => item.id === expense.id) === index);
}

function normalizeRecurringExpense(expense, categories, categoryNames) {
  const category = categoryNames.has(expense.category) ? expense.category : "Food";
  const description = getValidCategoryDescription(category, expense.categoryDescription, categories);
  const start = normalizeRecurringStart(expense);
  const end = normalizeRecurringEnd(expense.recurringEnd, start);
  return {
    id: expense.id || makeId(),
    name: String(expense.name || "Recurring payment").trim().replace(/\s+/g, " ").slice(0, 80),
    amount: Number(expense.amount || 0),
    category,
    categoryDescription: description,
    recurringStart: start,
    recurringEnd: end,
    recurringPattern: normalizeRecurringPattern(expense.recurringPattern),
    recurringAmountChangeDate: normalizeAmountChangeDate(expense.recurringAmountChangeDate, start, end),
    recurringNextAmount: Number(expense.recurringNextAmount || 0)
  };
}

function normalizeCategoryName(value) {
  return value.trim().replace(/\s+/g, " ").slice(0, 32);
}

function normalizeCategoryDescription(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 48);
}

function formatCategoryLabel(category) {
  return category.description ? `${category.name} - ${category.description}` : category.name;
}

function categoryKey(category) {
  return `${category.name.toLowerCase()}|${(category.description || "").toLowerCase()}`;
}

function isSameCategoryLabel(category, name, description) {
  return categoryKey(category) === categoryKey({ name, description });
}

function getValidCategoryDescription(name, description, categories) {
  const normalizedDescription = normalizeCategoryDescription(description || "");
  return categories.some((category) => category.name === name && (category.description || "") === normalizedDescription)
    ? normalizedDescription
    : "";
}

function makeCategoryIcon(name) {
  return normalizeCategoryName(name).slice(0, 2).padEnd(2, "?").toUpperCase();
}

function getRandomCategoryColor() {
  const used = new Set(state.categories.map((category) => category.color));
  const available = categoryColors.filter((color) => !used.has(color));
  const palette = available.length ? available : categoryColors;
  return palette[Math.floor(Math.random() * palette.length)];
}

function normalizeRecurringStart(category) {
  if (isISODate(category.recurringStart)) return category.recurringStart;
  if (category.recurringDay) {
    const day = Math.min(Math.max(Number(category.recurringDay) || 1, 1), daysInMonth(currentMonthKey()));
    return `${currentMonthKey()}-${String(day).padStart(2, "0")}`;
  }
  return todayISO();
}

function normalizeRecurringEnd(value, start) {
  if (!isISODate(value)) return "";
  return parseISODate(value) >= parseISODate(start) ? value : "";
}

function normalizeAmountChangeDate(value, start, end = "") {
  if (!isISODate(value)) return "";
  const date = parseISODate(value);
  if (date < parseISODate(start)) return "";
  if (end && date > parseISODate(end)) return "";
  return value;
}

function normalizeRecurringPattern(pattern) {
  return ["daily", "weekly", "monthly", "yearly"].includes(pattern) ? pattern : "monthly";
}

function getRecurringLabel(expense) {
  const pattern = (expense.recurringPattern || "monthly").charAt(0).toUpperCase() + (expense.recurringPattern || "monthly").slice(1);
  const start = dateFormatter.format(parseISODate(expense.recurringStart));
  const end = expense.recurringEnd ? ` until ${dateFormatter.format(parseISODate(expense.recurringEnd))}` : "";
  const amount = currency.format(getRecurringAmountForDate(expense, expense.recurringStart));
  const change = expense.recurringAmountChangeDate && expense.recurringNextAmount
    ? `, ${currency.format(expense.recurringNextAmount)} from ${dateFormatter.format(parseISODate(expense.recurringAmountChangeDate))}`
    : "";
  return `${pattern} ${amount} from ${start}${end}${change}`;
}

function isISODate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseISODate(value) {
  return new Date(`${value}T00:00:00`);
}

function toISODate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}
