# Bugs found

Add one section per issue. Bug 1 is filled in to show the format — fix it, then write what you changed. Copy the blank template for the rest.

Keep this file in the repo and **commit it** with your fixes.

---

Bug 1

**How to reproduce:** Open the app. The expense list says “Newest first”. The first row is Wine (7 Mar). Board game (15 Mar) is further down.

**What is wrong:** The list is showing oldest expenses first. Newest should be at the top.

**What I changed:** In `src/components/ExpenseList.jsx`, updated the sorting function from ascending `dateValue(a.date) - dateValue(b.date)` to descending `dateValue(b.date) - dateValue(a.date)` so the latest expenses appear at the top. Also updated `dateValue` in `src/lib/format.js` to return numeric epoch timestamps for reliable sorting.

---

Bug 2

**How to reproduce:** Check an expense where the payer is not in the split group (e.g., "Uber to airport" paid by Diya ($60) split between Aisha and Ben). Diya paid $60 and consumed $0, but her balance is reduced by $30.

**What is wrong:** In `src/lib/balances.js`, `computeBalances` contained a conditional block that subtracted an extra share (`bal[exp.paidBy] -= Number(exp.amount) / n`) from the payer if the payer was not in `shares`. Payers who are not part of the split should be reimbursed their entire payment without any deduction.

**What I changed:** Removed the erroneous `if (!(exp.paidBy in shares) ...)` block in `src/lib/balances.js` so that a payer who does not participate in an expense receives their full credit without deductions.

---

Bug 3

**How to reproduce:** Look at the Balances panel on the right sidebar. Members with positive net balances (who paid more than they consumed) are shown in red with the label "owes $X.XX", and members with negative net balances are shown in green with the label "is owed $X.XX".

**What is wrong:** In `src/components/BalancesPanel.jsx`, the logic for rendering labels and CSS classes was inverted. A positive balance means the group owes money to that member ("is owed", green/`owed`), while a negative balance means that member owes money to the group ("owes", red/`owe`).

**What I changed:** Swapped the conditions and class names in `src/components/BalancesPanel.jsx` so that `bal > 0.005` displays `"is owed ${formatMoney(bal)}"` with class `owed`, and `bal < -0.005` displays `"owes ${formatMoney(-bal)}"` with class `owe`.

---

Bug 4

**How to reproduce:** When a debtor owes the exact same amount that a creditor is owed (for example, Debtor A owes $50 and Creditor B is owed $50), no transfer is shown in the "Settle up" panel for that pair.

**What is wrong:** In `src/lib/settle.js`, `suggestSettlements` handled `d.amount > c.amount` and `d.amount < c.amount`, but the `else` branch (when amounts are equal) only incremented the index pointers `i += 1; j += 1;` without pushing a settlement transfer object to the `transfers` array.

**What I changed:** Updated the `else` branch in `src/lib/settle.js` to construct and push the transfer object `{ from: d.id, to: c.id, fromName: nameOf(d.id), toName: nameOf(c.id), amount: Number(d.amount.toFixed(2)) }` to `transfers` before incrementing pointers.

---

Bug 5

**How to reproduce:** Select any member in the "Paid by" dropdown in the Filter card.

**What is wrong:** The expense list displays "No expenses match these filters.", even for members who paid for multiple expenses. In `src/App.jsx`, `paidBy` from the `<select>` input is stored as a string (e.g. `"1"`), whereas `expense.paidBy` is a number (`1`). The strict comparison `e.paidBy !== paidBy` (`1 !== "1"`) evaluates to `true`, filtering out all expenses.

**What I changed:** Updated `src/App.jsx` to compare numeric values: `if (paidBy !== "" && Number(e.paidBy) !== Number(paidBy)) return false;`.

---

Bug 6

**How to reproduce:** Filter the list by a category (such as "Stay" or search "Uber"), or view the sorted list. Click "Delete" on the first visible expense.

**What is wrong:** The first expense in the original unfiltered/unsorted array (`e1` "Groceries") is deleted instead of the expense that was clicked. Similarly, inline editing an amount updates the wrong expense in state. This occurred because `ExpenseList` passed the visual array index to `onDeleteAt(index)` and `onUpdateAt(index, patch)`, which the reducer applied directly to `state.expenses[action.index]`.

**What I changed:** 
1. Updated `ExpenseList.jsx` and `ExpenseRow` to pass `expense.id` to `onDeleteExpense(expense.id)` and `onUpdateExpense(expense.id, patch)`.
2. Updated `reducer` in `src/state/store.js` to match and delete/update items by `id` (`state.expenses.filter(e => e.id !== action.id)` and `state.expenses.map(e => e.id === action.id ? ... : e)`).
3. Updated `App.jsx` to dispatch `DELETE_EXPENSE` and `UPDATE_EXPENSE` actions with `id`.

---

Bug 7

**How to reproduce:** Split an expense of $100 equally among 3 people. Each person was assigned $33.33, totaling $99.99, losing $0.01 from the group total.

**What is wrong:** `splitEqual` and `splitByPercent` in `src/lib/money.js` rounded each individual share independently without distributing remainder cents to ensure that the sum of portions exactly equals the total bill amount. Furthermore, `percentsSumTo100` used a strict `=== 100` equality check which fails on standard floating-point operations (e.g., `33.33 + 33.33 + 33.34 = 100.00000000000001`).

**What I changed:**
1. In `splitEqual`, converted amount to integer cents and distributed remainder cents among participants so the sum of portions strictly equals the total bill amount.
2. In `splitByPercent`, allocated remainder cents to the final share so the total strictly equals the expense amount.
3. In `percentsSumTo100`, used epsilon precision `Math.abs(sum - 100) < 0.01`.

---

Bug 8

**How to reproduce:** Add a new member using the "Add member" form in the Summary card.

**What is wrong:** The member count increments, but the new member does not appear in the "Paid so far" list with $0.00 until an expense is added or modified. In `src/components/SummaryCards.jsx`, the `useMemo` hook computing `perPerson` had `[expenses]` as its dependency array, omitting `members`.

**What I changed:** Updated the `useMemo` dependency array in `src/components/SummaryCards.jsx` to `[expenses, members]` so the summary card immediately reflects new members.

---

Bug 9

**How to reproduce:** Edit an expense's amount or reorder/filter the list.

**What is wrong:** `ExpenseRow` initialized its draft input state using `useState(String(expense.amount))` only on component mount. Because `ExpenseList` keyed rows by array `index` rather than unique `expense.id`, React reused component state across reordered items, causing inputs to display stale draft amounts. Additionally, if an expense amount was updated externally, the draft state did not synchronize.

**What I changed:
1. Keyed `ExpenseRow` by `expense.id` in `src/components/ExpenseList.jsx`.
2. Added a `useEffect` hook in `ExpenseRow` to keep `draft` synchronized with `expense.amount`.

Bug 10

How to reproduce: Reload the browser page after expenses have been saved to `localStorage`.

What is wrong: `loadState` in `src/state/store.js` returned raw `JSON.parse(raw)` when loading from `localStorage`, leaving `date` properties as strings instead of `Date` instances. This caused `formatDate` in `src/lib/format.js` to fail the `date instanceof Date` check, displaying raw unformatted date strings (e.g. `2026-03-12` instead of `12 Mar 2026`).

What I changed:
1. In `src/state/store.js`, wrapped `JSON.parse(raw)` in `hydrate()` so dates are properly reconstructed as `Date` objects on every reload.
2. In `src/lib/format.js`, enhanced `formatDate` and `dateValue` to safely parse and format both ISO date strings and `Date` instances without timezone offset shifts.



