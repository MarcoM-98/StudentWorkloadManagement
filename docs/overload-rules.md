# Overload Rules (Sprint 1)

## Goal
Detect when a student’s **required work hours** exceed their **available study hours** and show a warning:
- "Overloaded by X hours"

Sprint 1 is **manual-only** (no AI parsing).

---

## Data model (Sprint 1)

### Assignment
- `title: string`
- `dueDate: YYYY-MM-DD` (date only)
- `estimatedHours: number` (>= 0, decimals allowed)
- `status: "TODO" | "DONE"`

### Availability
- `hoursPerWeek: number` (0–80)

---

## Definitions

### Required Hours (R)
Sum of `estimatedHours` for all assignments where `status !== "DONE"`.

\[
R = \sum estimatedHours \text{ for TODO assignments}
\]

### Planning Window (W)
**Sprint 1 decision:** use a fixed window of **Next 7 days**:
- `windowStart = today`
- `windowEnd = today + 6 days` (7 total days)

Reason: simplest + consistent while other features are still being built.

### Available Hours (A)
Convert weekly hours into daily average, then multiply by days in window.

- `daily = hoursPerWeek / 7`
- `days = 7`
- `A = daily * days = hoursPerWeek`

So for this sprint, **available hours in the 7-day window equals `hoursPerWeek`**.

### Overload Hours (O)
\[
O = \max(0, R - A)
\]

### Overloaded?
\[
isOverloaded = (R > A)
\]

---

## Output (what the overload endpoint returns)
Return an object:

- `requiredHours: number`
- `availableHours: number`
- `overloadHours: number`
- `isOverloaded: boolean`
- `windowStart: YYYY-MM-DD`
- `windowEnd: YYYY-MM-DD`

Display numbers rounded to 1 decimal place in the UI.

---

## Validation rules
- `estimatedHours` must be a number and **>= 0**
- `dueDate` required
- `hoursPerWeek` must be a number and **>= 0**
- If `hoursPerWeek` is missing, treat as `0` available and show “Set availability” message.

---

## Edge cases to handle
1. **No assignments** → `R = 0`, `isOverloaded = false`
2. **All DONE** → `R = 0`
3. **Missing/invalid estimatedHours** → block save in UI (preferred) or treat as 0
4. **Due date in the past** → still counts (if TODO)
5. **Decimals** allowed (ex: 1.5 hours)
6. **Very large values** → UI can clamp `hoursPerWeek` to 0–80 (optional)

---

## Examples (sanity checks)

### Example A (not overloaded)
- hoursPerWeek = 10  → A = 10
- TODO assignments: 3h, 2h, 4h → R = 9
- O = max(0, 9 - 10) = 0 → not overloaded

### Example B (overloaded)
- hoursPerWeek = 8 → A = 8
- TODO assignments: 3h, 3h, 4h → R = 10
- O = max(0, 10 - 8) = 2 → overloaded by 2h

### Example C (DONE ignored)
- hoursPerWeek = 5 → A = 5
- Assignments: TODO 3h, DONE 10h → R = 3
- O = 0 → not overloaded
