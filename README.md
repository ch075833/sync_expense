# Sync Expense

A local-first PWA expense tracker for income, expenses, todo purchases with price tags, category charts, monthly budgets, custom categories, import/export, and offline use.

## Run

From this folder:

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 4173
```

Then open:

```text
http://127.0.0.1:4173/
```

The app stores data in browser `localStorage`. Use **Download/Upload > Export** to back up your records as JSON, and **Import** to restore a backup.
