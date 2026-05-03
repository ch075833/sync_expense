const STORAGE_KEY = "sync-expense-state-v9";
const LEGACY_STORAGE_KEYS = ["sync-expense-state-v8", "sync-expense-state-v7", "sync-expense-state-v6", "sync-expense-state-v5", "sync-expense-state-v4", "sync-expense-state-v3", "sync-expense-state-v2", "sync-expense-state-v1"];
const currency = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol" });
const dateFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });

const defaultCategories = [
  { id: "food", name: "Food", color: "#c2410c", icon: "Fo", protected: true, recurring: false, recurringAmount: 0, recurringStart: todayISO(), recurringEnd: "", recurringPattern: "monthly", recurringAmountChangeDate: "", recurringNextAmount: 0 }
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
  typeInput: document.querySelector("#typeInput"),
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
  budgetList: document.querySelector("#budgetList"),
  incomeTotal: document.querySelector("#incomeTotal"),
  expenseTotal: document.querySelector("#expenseTotal"),
  balanceTotal: document.querySelector("#balanceTotal"),
  dailyAverage: document.querySelector("#dailyAverage"),
  periodLabel: document.querySelector("#periodLabel"),
  chart: document.querySelector("#categoryChart"),
  chartLegend: document.querySelector("#chartLegend"),
  exportButton: document.querySelector("#exportButton"),
  importInput: document.querySelector("#importInput"),
  resetDemoButton: document.querySelector("#resetDemoButton"),
  installButton: document.querySelector("#installButton"),
  statusDot: document.querySelector("#statusDot"),
  statusText: document.querySelector("#statusText"),
  openAddCategoryDialog: document.querySelector("#openAddCategoryDialog"),
  categoryList: document.querySelector("#categoryList"),
  categoryDialog: document.querySelector("#categoryDialog"),
  categoryEditForm: document.querySelector("#categoryEditForm"),
  categoryDialogTitle: document.querySelector("#categoryDialogTitle"),
  categoryDialogMode: document.querySelector("#categoryDialogMode"),
  closeCategoryDialog: document.querySelector("#closeCategoryDialog"),
  cancelCategoryEdit: document.querySelector("#cancelCategoryEdit"),
  editCategoryId: document.querySelector("#editCategoryId"),
  editCategoryName: document.querySelector("#editCategoryName"),
  editCategoryBudget: document.querySelector("#editCategoryBudget"),
  editCategoryColor: document.querySelector("#editCategoryColor"),
  editCategoryRecurring: document.querySelector("#editCategoryRecurring"),
  editCategoryRecurringAmount: document.querySelector("#editCategoryRecurringAmount"),
  editCategoryRecurringStart: document.querySelector("#editCategoryRecurringStart"),
  editCategoryHasEnd: document.querySelector("#editCategoryHasEnd"),
  editCategoryRecurringEnd: document.querySelector("#editCategoryRecurringEnd"),
  editCategoryRecurringPattern: document.querySelector("#editCategoryRecurringPattern"),
  editCategoryHasAmountChange: document.querySelector("#editCategoryHasAmountChange"),
  editCategoryNextAmount: document.querySelector("#editCategoryNextAmount"),
  editCategoryAmountChangeDate: document.querySelector("#editCategoryAmountChangeDate"),
  transactionDialog: document.querySelector("#transactionDialog"),
  transactionEditForm: document.querySelector("#transactionEditForm"),
  closeTransactionDialog: document.querySelector("#closeTransactionDialog"),
  cancelTransactionEdit: document.querySelector("#cancelTransactionEdit"),
  editTransactionId: document.querySelector("#editTransactionId"),
  editTransactionType: document.querySelector("#editTransactionType"),
  editTransactionAmount: document.querySelector("#editTransactionAmount"),
  editTransactionCategory: document.querySelector("#editTransactionCategory"),
  editTransactionDate: document.querySelector("#editTransactionDate"),
  editTransactionNote: document.querySelector("#editTransactionNote")
};

init();

function init() {
  elements.dateInput.value = todayISO();
  elements.periodMonth.value = currentMonthKey();
  populateCategories();
  bindEvents();
  render();
  registerServiceWorker();
  updateConnectionStatus();
}

function bindEvents() {
  elements.form.addEventListener("submit", addTransaction);
  elements.periodMonth.addEventListener("change", () => {
    render();
  });
  elements.searchInput.addEventListener("input", renderTransactions);
  elements.typeFilter.addEventListener("change", renderTransactions);
  elements.todoForm.addEventListener("submit", addTodo);
  elements.todoEditForm.addEventListener("submit", saveTodoEdit);
  elements.closeTodoDialog.addEventListener("click", closeTodoDialog);
  elements.cancelTodoEdit.addEventListener("click", closeTodoDialog);
  elements.deleteTodoFromDialog.addEventListener("click", deleteTodoFromDialog);
  elements.exportButton.addEventListener("click", exportData);
  elements.importInput.addEventListener("change", importData);
  elements.resetDemoButton.addEventListener("click", loadSampleData);
  elements.installButton.addEventListener("click", installApp);
  elements.openAddCategoryDialog.addEventListener("click", openAddCategoryDialog);
  elements.categoryEditForm.addEventListener("submit", saveCategoryEdit);
  elements.editCategoryRecurring.addEventListener("change", syncDialogRecurringControls);
  elements.editCategoryHasEnd.addEventListener("change", syncDialogRecurringControls);
  elements.editCategoryHasAmountChange.addEventListener("change", syncDialogRecurringControls);
  elements.closeCategoryDialog.addEventListener("click", closeCategoryDialog);
  elements.cancelCategoryEdit.addEventListener("click", closeCategoryDialog);
  elements.transactionEditForm.addEventListener("submit", saveTransactionEdit);
  elements.closeTransactionDialog.addEventListener("click", closeTransactionDialog);
  elements.cancelTransactionEdit.addEventListener("click", closeTransactionDialog);
  window.addEventListener("online", updateConnectionStatus);
  window.addEventListener("offline", updateConnectionStatus);
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    elements.installButton.hidden = false;
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view, { scroll: true }));
  });

  document.querySelectorAll("[data-view-jump]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.viewJump, { scroll: true }));
  });

}

function populateCategories() {
  elements.categoryInput.innerHTML = state.categories
    .map((category) => `<option value="${escapeHTML(category.name)}">${escapeHTML(category.name)}</option>`)
    .join("");
  elements.editTransactionCategory.innerHTML = elements.categoryInput.innerHTML;
  elements.todoCategoryInput.innerHTML = elements.categoryInput.innerHTML;
}

function setView(view, options = {}) {
  const targetPanel = document.querySelector(`[data-view-panel="${view}"]`);
  if (!targetPanel) return;

  activeView = view;
  document.querySelectorAll("[data-view]").forEach((button) => {
    const isActive = button.dataset.view === view;
    button.classList.toggle("active", isActive);
    button.toggleAttribute("aria-current", isActive);
  });
  document.querySelectorAll("[data-view-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.viewPanel === view);
    panel.toggleAttribute("aria-hidden", panel.dataset.viewPanel !== view);
  });

  if (options.scroll) {
    requestAnimationFrame(() => {
      targetPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function addTransaction(event) {
  event.preventDefault();
  const transaction = {
    id: makeId(),
    type: elements.typeInput.value,
    amount: Number(elements.amountInput.value),
    category: elements.categoryInput.value,
    date: elements.dateInput.value,
    note: elements.noteInput.value.trim()
  };

  if (!transaction.amount || transaction.amount <= 0) return;

  state.transactions.unshift(transaction);
  saveState();
  elements.form.reset();
  elements.dateInput.value = todayISO();
  elements.typeInput.value = "expense";
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
  const todo = {
    id: makeId(),
    title: elements.todoTitleInput.value.trim(),
    price: Number(elements.todoPriceInput.value),
    category: elements.todoCategoryInput.value,
    checked: false,
    transactionId: "",
    createdAt: new Date().toISOString()
  };

  if (!todo.title || !todo.price || todo.price <= 0) return;

  state.todos.unshift(todo);
  saveState();
  elements.todoForm.reset();
  elements.todoCategoryInput.value = state.categories[0]?.name || "Food";
  render();
}

function toggleTodo(id, checked) {
  const todo = state.todos.find((item) => item.id === id);
  if (!todo) return;

  todo.checked = checked;
  if (checked) {
    const linkedTransaction = todo.transactionId
      ? state.transactions.find((transaction) => transaction.id === todo.transactionId)
      : null;
    if (!linkedTransaction) {
      const transaction = makeTodoTransaction(todo);
      todo.transactionId = transaction.id;
      state.transactions.unshift(transaction);
    }
  } else if (todo.transactionId) {
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
  elements.editTodoPrice.value = todo.price;
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
  const price = Number(elements.editTodoPrice.value);
  if (!title || !price || price <= 0) return;

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
  elements.editTransactionType.value = transaction.type;
  elements.editTransactionAmount.value = transaction.amount;
  elements.editTransactionCategory.value = transaction.category;
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

  transaction.type = elements.editTransactionType.value;
  transaction.amount = amount;
  transaction.category = elements.editTransactionCategory.value;
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
  const income = sum(monthly.filter((item) => item.type === "income"));
  const expenses = sum(monthly.filter((item) => item.type === "expense"));
  const daysElapsed = monthKey === currentMonthKey() ? new Date().getDate() : daysInMonth(monthKey);

  elements.periodLabel.textContent = monthLabel(monthKey);
  elements.incomeTotal.textContent = currency.format(income);
  elements.expenseTotal.textContent = currency.format(expenses);
  elements.balanceTotal.textContent = currency.format(income - expenses);
  elements.dailyAverage.textContent = currency.format(expenses / Math.max(daysElapsed, 1));

  renderChart(monthly);
  renderTransactions();
  renderRecent(monthly);
  renderTodos();
  renderBudgets(monthly);
  renderCategories();
}

function renderTransactions() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const type = elements.typeFilter.value;
  const monthKey = selectedMonthKey();
  const filtered = getTransactionsWithRecurring().filter((transaction) => {
    const matchesType = type === "all" || transaction.type === type;
    const haystack = `${transaction.category} ${transaction.note}`.toLowerCase();
    return monthFromDate(transaction.date) === monthKey && matchesType && haystack.includes(query);
  });
  renderList(elements.transactionList, filtered, { actions: true });
}

function renderRecent(monthly) {
  renderList(elements.recentList, monthly.slice().sort(sortByDateDesc).slice(0, 8), { actions: false });
}

function renderTodos() {
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
            <span>${todo.checked ? "Paid" : "Open"}</span>
          </label>
          <div class="category-icon" style="background:${category.color}">${category.icon}</div>
          <div class="row-title">
            <strong>${escapeHTML(todo.title)}</strong>
            <span>${escapeHTML(todo.category)}</span>
          </div>
          <strong class="price-tag">${currency.format(todo.price)}</strong>
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
            <strong>${escapeHTML(transaction.note || transaction.category)}</strong>
            <span>${escapeHTML(transaction.category)}</span>
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
  elements.budgetList.innerHTML = state.categories
    .map((category) => {
      const categoryName = category.name;
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
  return `
    <article class="category-row">
      <div class="category-icon" style="background:${category.color}">${category.icon}</div>
      <div class="row-title">
        <strong>${escapeHTML(category.name)}</strong>
        <span>${currency.format(state.budgets[category.name] || 0)} monthly budget</span>
        <div class="category-tags">
          <span class="tag ${category.recurring ? "recurring" : ""}">${getRecurringLabel(category)}</span>
        </div>
      </div>
      <div class="row-actions">
        <button class="secondary" type="button" data-edit-category="${category.id}">Edit</button>
        ${category.protected ? "" : `<button class="delete-button" type="button" data-delete-category="${category.id}" title="Delete category" aria-label="Delete category">x</button>`}
      </div>
    </article>
  `;
}

function openAddCategoryDialog() {
  elements.categoryDialogTitle.textContent = "Add category";
  elements.categoryDialogMode.value = "add";
  elements.editCategoryId.value = "";
  elements.editCategoryName.value = "";
  elements.editCategoryBudget.value = 0;
  elements.editCategoryColor.value = getRandomCategoryColor();
  elements.editCategoryRecurring.checked = false;
  elements.editCategoryRecurringAmount.value = 0;
  elements.editCategoryRecurringStart.value = todayISO();
  elements.editCategoryHasEnd.checked = false;
  elements.editCategoryRecurringEnd.value = "";
  elements.editCategoryRecurringPattern.value = "monthly";
  elements.editCategoryHasAmountChange.checked = false;
  elements.editCategoryNextAmount.value = "";
  elements.editCategoryAmountChangeDate.value = "";
  syncDialogRecurringControls();
  elements.categoryDialog.showModal();
}

function openCategoryDialog(id) {
  const category = state.categories.find((item) => item.id === id);
  if (!category) return;

  elements.categoryDialogTitle.textContent = "Edit category";
  elements.categoryDialogMode.value = "edit";
  elements.editCategoryId.value = category.id;
  elements.editCategoryName.value = category.name;
  elements.editCategoryBudget.value = state.budgets[category.name] || 0;
  elements.editCategoryColor.value = category.color;
  elements.editCategoryRecurring.checked = category.recurring;
  elements.editCategoryRecurringAmount.value = category.recurringAmount || state.budgets[category.name] || 0;
  elements.editCategoryRecurringStart.value = category.recurringStart || todayISO();
  elements.editCategoryHasEnd.checked = Boolean(category.recurringEnd);
  elements.editCategoryRecurringEnd.value = category.recurringEnd || "";
  elements.editCategoryRecurringPattern.value = category.recurringPattern || "monthly";
  elements.editCategoryHasAmountChange.checked = Boolean(category.recurringAmountChangeDate && category.recurringNextAmount);
  elements.editCategoryNextAmount.value = category.recurringNextAmount || "";
  elements.editCategoryAmountChangeDate.value = category.recurringAmountChangeDate || "";
  syncDialogRecurringControls();
  elements.categoryDialog.showModal();
}

function closeCategoryDialog() {
  elements.categoryDialog.close();
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

  const nextName = normalizeCategoryName(elements.editCategoryName.value);
  if (!nextName) return;
  const duplicate = state.categories.some((item) => item.name.toLowerCase() === nextName.toLowerCase() && item.id !== id);
  if (duplicate) return;

  const isRecurring = elements.editCategoryRecurring.checked;
  const hasEnd = elements.editCategoryHasEnd.checked;
  const recurringStart = normalizeRecurringStart({
    recurringStart: elements.editCategoryRecurringStart.value
  });
  const recurringEnd = hasEnd ? normalizeRecurringEnd(elements.editCategoryRecurringEnd.value, recurringStart) : "";
  const budget = Number(elements.editCategoryBudget.value) || 0;
  const recurringAmount = Number(elements.editCategoryRecurringAmount.value) || budget;
  const hasAmountChange = elements.editCategoryHasAmountChange.checked;
  const amountChangeDate = hasAmountChange ? normalizeAmountChangeDate(elements.editCategoryAmountChangeDate.value, recurringStart, recurringEnd) : "";
  const nextAmount = hasAmountChange && amountChangeDate ? Number(elements.editCategoryNextAmount.value) || recurringAmount : 0;

  category.name = nextName;
  category.color = elements.editCategoryColor.value;
  category.icon = makeCategoryIcon(nextName);
  category.recurring = isRecurring;
  category.recurringAmount = isRecurring ? recurringAmount : 0;
  category.recurringStart = isRecurring ? recurringStart : todayISO();
  category.recurringEnd = isRecurring ? recurringEnd : "";
  category.recurringPattern = elements.editCategoryRecurringPattern.value;
  category.recurringAmountChangeDate = isRecurring ? amountChangeDate : "";
  category.recurringNextAmount = isRecurring ? nextAmount : 0;

  delete state.budgets[previousName];
  state.budgets[nextName] = budget;
  state.transactions = state.transactions.map((transaction) => (
    transaction.category === previousName ? { ...transaction, category: nextName } : transaction
  ));
  state.todos = state.todos.map((todo) => (
    todo.category === previousName ? { ...todo, category: nextName } : todo
  ));

  saveState();
  populateCategories();
  render();
  closeCategoryDialog();
}

function addCategoryFromDialog() {
  const name = normalizeCategoryName(elements.editCategoryName.value);
  if (!name || state.categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) return;
  const isRecurring = elements.editCategoryRecurring.checked;
  const hasEnd = elements.editCategoryHasEnd.checked;
  const recurringStart = normalizeRecurringStart({ recurringStart: elements.editCategoryRecurringStart.value });
  const recurringEnd = hasEnd ? normalizeRecurringEnd(elements.editCategoryRecurringEnd.value, recurringStart) : "";
  const budget = Number(elements.editCategoryBudget.value) || 0;
  const recurringAmount = Number(elements.editCategoryRecurringAmount.value) || budget;
  const hasAmountChange = elements.editCategoryHasAmountChange.checked;
  const amountChangeDate = hasAmountChange ? normalizeAmountChangeDate(elements.editCategoryAmountChangeDate.value, recurringStart, recurringEnd) : "";
  const nextAmount = hasAmountChange && amountChangeDate ? Number(elements.editCategoryNextAmount.value) || recurringAmount : 0;

  state.categories.push({
    id: makeId(),
    name,
    color: elements.editCategoryColor.value || getRandomCategoryColor(),
    icon: makeCategoryIcon(name),
    recurring: isRecurring,
    recurringAmount: isRecurring ? recurringAmount : 0,
    recurringStart: isRecurring ? recurringStart : todayISO(),
    recurringEnd: isRecurring ? recurringEnd : "",
    recurringPattern: elements.editCategoryRecurringPattern.value,
    recurringAmountChangeDate: isRecurring ? amountChangeDate : "",
    recurringNextAmount: isRecurring ? nextAmount : 0,
    protected: false
  });
  state.budgets[name] = budget;
  saveState();
  populateCategories();
  render();
  closeCategoryDialog();
}

function deleteCategory(id) {
  const categoryToDelete = state.categories.find((category) => category.id === id);
  if (!categoryToDelete || categoryToDelete.protected) return;
  if (!confirm(`Delete ${categoryToDelete.name}? Transactions in this category will move to Food.`)) return;
  const name = categoryToDelete.name;
  state.categories = state.categories.filter((category) => category.id !== id || category.protected);
  state.transactions = state.transactions.map((transaction) => (
    transaction.category === name ? { ...transaction, category: "Food" } : transaction
  ));
  state.todos = state.todos.map((todo) => (
    todo.category === name ? { ...todo, category: "Food" } : todo
  ));
  delete state.budgets[name];
  saveState();
  populateCategories();
  render();
}

function syncDialogRecurringControls() {
  const disabled = !elements.editCategoryRecurring.checked;
  if (!elements.editCategoryRecurringStart.value) {
    elements.editCategoryRecurringStart.value = todayISO();
  }
  if (!elements.editCategoryRecurringAmount.value || Number(elements.editCategoryRecurringAmount.value) <= 0) {
    elements.editCategoryRecurringAmount.value = elements.editCategoryBudget.value || 0;
  }
  elements.editCategoryRecurringAmount.disabled = disabled;
  elements.editCategoryRecurringStart.disabled = disabled;
  elements.editCategoryHasEnd.disabled = disabled;
  if (disabled) {
    elements.editCategoryHasEnd.checked = false;
    elements.editCategoryHasAmountChange.checked = false;
  }
  elements.editCategoryRecurringEnd.disabled = disabled || !elements.editCategoryHasEnd.checked;
  elements.editCategoryRecurringPattern.disabled = disabled;
  elements.editCategoryHasAmountChange.disabled = disabled;
  elements.editCategoryNextAmount.disabled = disabled || !elements.editCategoryHasAmountChange.checked;
  elements.editCategoryAmountChangeDate.disabled = disabled || !elements.editCategoryHasAmountChange.checked;
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

function updateConnectionStatus() {
  const online = navigator.onLine;
  elements.statusDot.classList.toggle("offline", !online);
  elements.statusText.textContent = online ? "Ready offline" : "Offline mode";
}

async function installApp() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  elements.installButton.hidden = true;
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch((error) => console.warn("Service worker registration failed", error));
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

function sum(items) {
  return items.reduce((acc, transaction) => acc + transaction.amount, 0);
}

function getCategory(name) {
  return state.categories.find((category) => category.name === name) || {
    name,
    color: "#475569",
    icon: makeCategoryIcon(name)
  };
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
}

function getRecurringTransactions() {
  const monthKeys = new Set([selectedMonthKey(), currentMonthKey(), ...state.transactions.map((transaction) => monthFromDate(transaction.date))]);
  return [...monthKeys].flatMap((monthKey) => {
    return state.categories
      .filter((category) => category.recurring && hasRecurringAmount(category))
      .flatMap((category) => {
        return getRecurringDatesForMonth(category, monthKey).filter((date) => !isRecurringSkipped(category.id, date)).map((date) => ({
          id: getRecurringKey(category.id, date),
          recurringKey: getRecurringKey(category.id, date),
          type: "expense",
          amount: getRecurringAmountForDate(category, date),
          category: category.name,
          date,
          note: "Recurring payment",
          recurring: true
        }));
      });
  });
}

function getRecurringDatesForMonth(category, monthKey) {
  const start = parseISODate(category.recurringStart || todayISO());
  const end = category.recurringEnd ? parseISODate(category.recurringEnd) : null;
  const today = parseISODate(todayISO());
  const monthStart = parseISODate(`${monthKey}-01`);
  const [year, month] = monthKey.split("-").map(Number);
  const monthEnd = new Date(year, month, 0);
  if (start > monthEnd) return [];
  if (end && end < monthStart) return [];
  if (monthStart > today) return [];
  const recurrenceEnd = [end, monthEnd, today].filter(Boolean).sort((a, b) => a - b)[0];

  if (category.recurringPattern === "daily") {
    const first = start > monthStart ? start : monthStart;
    const dates = [];
    for (let cursor = new Date(first); cursor <= recurrenceEnd; cursor.setDate(cursor.getDate() + 1)) {
      dates.push(toISODate(cursor));
    }
    return dates;
  }

  if (category.recurringPattern === "weekly") {
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

  if (category.recurringPattern === "yearly") {
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

function getRecurringAmountForDate(category, date) {
  const baseAmount = Number(category.recurringAmount || state.budgets[category.name] || 0);
  if (
    category.recurringAmountChangeDate &&
    category.recurringNextAmount &&
    parseISODate(date) >= parseISODate(category.recurringAmountChangeDate)
  ) {
    return Number(category.recurringNextAmount);
  }
  return baseAmount;
}

function hasRecurringAmount(category) {
  return Number(category.recurringAmount || state.budgets[category.name] || 0) > 0 || Number(category.recurringNextAmount || 0) > 0;
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
    ? incoming.categories.filter((category) => category.name && category.name !== "Food")
    : [];
  const categories = [
    ...defaultCategories.map((category) => ({ ...category })),
    ...customCategories.map((category) => ({
      id: category.id || makeId(),
      name: normalizeCategoryName(category.name),
      color: category.color || "#0f766e",
      icon: category.icon || makeCategoryIcon(category.name),
      recurring: Boolean(category.recurring),
      recurringAmount: Number(category.recurringAmount ?? incoming.budgets?.[category.name] ?? defaultBudgets[category.name] ?? 0),
      recurringStart: normalizeRecurringStart(category),
      recurringEnd: normalizeRecurringEnd(category.recurringEnd, normalizeRecurringStart(category)),
      recurringPattern: normalizeRecurringPattern(category.recurringPattern),
      recurringAmountChangeDate: normalizeAmountChangeDate(category.recurringAmountChangeDate, normalizeRecurringStart(category), normalizeRecurringEnd(category.recurringEnd, normalizeRecurringStart(category))),
      recurringNextAmount: Number(category.recurringNextAmount || 0),
      protected: false
    }))
  ].filter((category, index, list) => category.name && list.findIndex((item) => item.name.toLowerCase() === category.name.toLowerCase()) === index);

  const budgets = {};
  categories.forEach((category) => {
    budgets[category.name] = Number(incoming.budgets?.[category.name] ?? defaultBudgets[category.name] ?? 0);
  });

  const categoryNames = new Set(categories.map((category) => category.name));
  const transactions = Array.isArray(incoming.transactions)
    ? incoming.transactions.map((transaction) => ({
      ...transaction,
      category: categoryNames.has(transaction.category) ? transaction.category : "Food"
    }))
    : [];
  const transactionIds = new Set(transactions.map((transaction) => transaction.id));
  const todos = Array.isArray(incoming.todos)
    ? incoming.todos
      .filter((todo) => todo.title && Number(todo.price) > 0)
      .map((todo) => {
        const transactionId = transactionIds.has(todo.transactionId) ? todo.transactionId : "";
        return {
          id: todo.id || makeId(),
          title: String(todo.title).trim().slice(0, 80),
          price: Number(todo.price),
          category: categoryNames.has(todo.category) ? todo.category : "Food",
          checked: Boolean(todo.checked && transactionId),
          transactionId,
          createdAt: todo.createdAt || new Date().toISOString()
        };
      })
    : [];

  return {
    transactions,
    todos,
    budgets,
    categories,
    recurringSkips: Array.isArray(incoming.recurringSkips) ? incoming.recurringSkips : []
  };
}

function normalizeCategoryName(value) {
  return value.trim().replace(/\s+/g, " ").slice(0, 32);
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

function getRecurringLabel(category) {
  if (!category.recurring) return "Not recurring";
  const pattern = category.recurringPattern.charAt(0).toUpperCase() + category.recurringPattern.slice(1);
  const start = dateFormatter.format(parseISODate(category.recurringStart));
  const end = category.recurringEnd ? ` until ${dateFormatter.format(parseISODate(category.recurringEnd))}` : "";
  const amount = currency.format(getRecurringAmountForDate(category, category.recurringStart));
  const change = category.recurringAmountChangeDate && category.recurringNextAmount
    ? `, ${currency.format(category.recurringNextAmount)} from ${dateFormatter.format(parseISODate(category.recurringAmountChangeDate))}`
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
