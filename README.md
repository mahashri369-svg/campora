#DEPLOYMENT LINK:https://campora-virid.vercel.app/
# Attendance Predictor — VibeCraft Round 1 (The Overworld)

An intelligent, timetable-driven college attendance planning dashboard and detention risk engine built for SRM Institute of Science and Technology (Tiruchirappalli Campus).

---

## 1. Overview & Objectives

In engineering institutions, students must maintain a mandatory minimum of **75% attendance** in every individual subject to be eligible to appear for end-semester examinations. Falling below 75% results in detention.

The **Attendance Predictor** solves this challenge by connecting real student attendance data directly to the official class section timetable:
- **12 Official Engineering Sections** loaded directly from the institution's official timetable scans.
- **Section-driven class scheduling**: Counts remaining classes not through naive calendar days, but by matching the exact weekly period allocations (e.g., Monday Period 1, Wednesday Period 4, 4-hour workshop blocks).
- **Dual Target Math**: Calculates exact required classes for **75% Detention Safety** and **90% Honor Distinction**.
- **Irreversible Detention Detection**: Identifies whether a student's attendance deficit is mathematically impossible to recover even if they attend every remaining class in the semester.

---

## 2. Semester Timeline

- **Academic Year**: 2026–2027 (Odd Semester)
- **Semester Start Date**: 29 August 2026
- **Semester End Date**: 29 November 2026
- **Working Days**: Monday through Friday (5-day academic week)

---

## 3. Mathematical Attendance Logic

### 3.1 Current Attendance
Given:
- $T$ = Total classes conducted to date
- $A$ = Classes attended to date

$$\text{Current Attendance} = \left(\frac{A}{T}\right) \times 100$$

### 3.2 Scheduled Remaining Classes ($R$)
Using the student's selected section timetable, the engine iterates day-by-day between the effective future date and the planning date (or 29 November 2026). For each weekday matching the subject's schedule, scheduled period occurrences are counted to produce $R$.

### 3.3 Future Attendance Projection
If the student attends $x$ out of $R$ remaining classes:

$$\text{Future Attendance} = \left(\frac{A + x}{T + R}\right) \times 100$$

### 3.4 Target Calculation ($P = 75\%$ or $P = 90\%$)
To achieve $\text{Future Attendance} \ge P$:

$$\frac{A + x}{T + R} \ge \frac{P}{100}$$

$$A + x \ge \left(\frac{P}{100}\right) \times (T + R)$$

$$x \ge \left(\frac{P}{100}\right) \times (T + R) - A$$

The minimum whole number of classes required is:

$$x_{\text{min}} = \max\left(0, \left\lceil \left(\frac{P}{100}\right) \times (T + R) - A \right\rceil\right)$$

> **Strict Integer Rounding Up**: Fractions of classes are rounded UP (`Math.ceil`). If a calculation yields $7.02$, the student must attend $8$ classes. Attending $7$ would result in $< 75\%$, causing detention.

If $x_{\text{min}} > R$, the target is mathematically unreachable.

### 3.5 Irreversible Detention Condition
Suppose the student attends 100% of all future classes ($x = R$):

$$\text{Max Possible Attendance} = \left(\frac{A + R}{T + R}\right) \times 100$$

If $\text{Max Possible Attendance} < 75.0\%$:
The application triggers the **🚨 IRREVERSIBLE DETENTION** alert. No future attendance pattern can prevent detention.

---

## 4. Class Sections & Dataset Structure

Data is stored in `src/data/timetableData.ts` with complete fidelity to the scanned official timetables:

| Section ID | Section Name | Year & Semester | Department |
| :--- | :--- | :--- | :--- |
| `section-3-ece-a` | III ECE-A | III Year / Sem V | Electronics & Communication |
| `section-3-ece-b` | III ECE-B | III Year / Sem V | Electronics & Communication |
| `section-3-ece-ds` | III ECE-DS | III Year / Sem V | ECE (Data Science) |
| `section-3-bme` | III BME | III Year / Sem V | Biomedical Engineering |
| `section-4-ece-a` | IV ECE-A | IV Year / Sem VII | Electronics & Communication |
| `section-4-ece-b` | IV ECE-B | IV Year / Sem VII | Electronics & Communication |
| `section-2-ece-ds-b` | II ECE-DS B | II Year / Sem III | ECE (Data Science) |
| `section-2-bme` | II BME | II Year / Sem III | Biomedical Engineering |
| `section-1-ece-a` | I ECE-A | I Year / Sem I | Electronics & Communication |
| `section-1-ece-b-eee` | I ECE-B & EEE | I Year / Sem I | ECE & Electrical Engg. |
| `section-1-ece-ds` | I ECE-DS | I Year / Sem I | ECE (Data Science) |
| `section-1-biotech-biomed` | I Biotech-B & Biomed | I Year / Sem I | Biotech & Biomedical |

Each section object encapsulates:
- `id`, `name`, `year`, `semester`, `department`, `venue`
- `subjects`: List of subject codes, full names, slots, credits, faculty names, and weekly lecture hours
- `schedule`: Monday–Friday array with periods 1–9, exact timings (`09:00 - 09:50`, etc.), subject codes, and room assignments

---

## 5. Key Application Features

1. **Strict User Authentication & Profile Isolation**:
   - **Real Registration**: Saves ONLY the details entered by the user (Name, Email, Password, Section, optional Roll Number, optional Phone).
   - **Zero Random / Fake Data**: Never generates or populates random names, fake emails, or mock attendance. If a field or attendance record is empty, it clearly displays "Not added yet" / "No attendance data added yet."
   - **Email & Password Authentication**: Validates credentials against independent registered student records.
   - **Profile Management**: Dedicated **"My Student Profile"** modal allowing users to edit Name, Section, Roll Number, and Phone Number with instant "Save Changes" persistence.
   - **Multi-User Isolation**: User A and User B maintain completely separate accounts and attendance datasets in `localStorage`.
2. **Official Dataset Preservation**: All 12 class sections from the official SRM scanned timetable sheets are 100% preserved and active.
3. **Section & Subject Binding**: Selecting a section loads only the subjects mapped to that section.
4. **User-Specific Attendance Storage**: Attendance entered in either the Single-Subject Predictor or the Subject Matrix is saved strictly to the active user's account.
5. **Auto-detected Today Date**: Automatically reads system date while supporting mid-semester test overrides.
6. **Planning Date Horizon**: Select any future milestone date up to 29 November 2026.
7. **Results Dashboard**:
   - 🚨 Irreversible Detention Alert (High Priority)
   - 🟢 Safe / Warning Status Cards with text labels
   - 5 KPI Cards: Current %, Remaining Classes, Needed for 75%, Needed for 90%, Max Possible Final
   - Visual Progress Bar with danger and goal threshold markers
   - Personalized Attendance Plan Timeline
   - Upcoming scheduled classes list with period times and rooms
8. **Multi-Subject Matrix**: Interactive table tracking all subjects in the section at once, with inline count editing.
9. **Official Timetable Calendar**: Full weekly timetable grid with period timings, faculty details, and subject highlighting.

---

## 6. Installation & Execution

### Prerequisites
- Node.js $\ge 18$
- npm $\ge 9$

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
The server will start on `http://localhost:3000`.

### Production Build
```bash
npm run build
```

---

## 7. Verification Test Cases

| Scenario | Inputs | Expected Output |
| :--- | :--- | :--- |
| **Safe (85%)** | Conducted: 40, Attended: 34 | Status: `SAFE`. Needed for 75% calculated based on remaining timetable slots. |
| **Borderline (75%)** | Conducted: 40, Attended: 30 | Status: `AT DETENTION LIMIT (75%)`. Warning prompt to attend upcoming classes. |
| **Irreversible Detention** | Conducted: 45, Attended: 18 | Status: `🚨 IRREVERSIBLE DETENTION`. Max possible $< 75\%$. Prominent red warning banner. |
| **Honor Distiction (95%)** | Conducted: 40, Attended: 38 | Status: `🌟 90% TARGET ACHIEVED`. 0 classes needed for 75%. |
