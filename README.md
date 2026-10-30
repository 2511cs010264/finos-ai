# FinOS - Financial Operating System

FinOS is a financial management operating system built for working families. It features real-time expense tracking, category budget limits, subscription management, milestone goal deposits, emergency safety cushion calculations, and 30/60/90-day predictive cashflow forecasting.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Custom Glassmorphism Design System), JavaScript (ES Modules, Chart.js, Lucide Icons).
- **Backend**: Java 21, Spring Boot 3.2, Spring Data JPA, RESTful Controllers.
- **Database**: MySQL Server (`finos_db`).

---

## 🚀 How to Run the Application

### 1. Database Setup (MySQL)
Ensure MySQL Server is running on your machine on port `3306`.
The application automatically creates the database `finos_db` on launch.

Default credentials in `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/finos_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=root
```
*(Update `username` and `password` if your MySQL root credentials differ).*

---

### 2. Start the Spring Boot Backend Server

Open PowerShell / Terminal in the project root directory:
```powershell
cd backend
mvn spring-boot:run
```
The REST API backend will start on **`http://localhost:8080`**.

---

### 3. Launch the Frontend Application

Run the included PowerShell server script or open `index.html` directly in your web browser or live server:

```powershell
.\serve.ps1
```
Open **`http://localhost:3000`** in your browser.

---

## 📋 Core Features & Functionalities

1. **User Authentication & Onboarding**: Sign up, log in, and complete your family income, rent, EMI, and financial goal onboarding.
2. **Dashboard**: Live financial health score (0-100), net balance, monthly savings goal, subscription costs, cashflow trend chart, expense breakdown pie chart, and recent transaction log.
3. **Expense Tracker**: Log income & expense transactions with categories (Groceries, Housing & Rent, Debt & EMI, Utilities, Subscriptions, Salary), dates, and payment methods. Filter and delete entries.
4. **Subscription Manager**: Manage recurring subscriptions, calculate monthly & annual totals, and flag unused services.
5. **Budget Planner**: Allocate monthly category budget limits and monitor actual spending vs allocated limits with real-time percentage progress bars.
6. **Financial Goals**: Set milestone target amounts & dates, and record cash deposits into your savings goals.
7. **Emergency Cushion Planner**: Dynamically calculates your family's 3-month and 6-month essential survival baselines.
8. **Future Wallet**: Predicts your 30, 60, and 90-day cashflow trajectory, expected balances, and potential liquidity crunch warnings.
9. **Government Policy & Inflation News**: Real-time government policy updates (LPG prices, RBI repo rates, electricity tariffs).
10. **Audit Reports**: Instant summary of total monthly income, expenses, and net surplus with CSV export and printable statement formatting.
