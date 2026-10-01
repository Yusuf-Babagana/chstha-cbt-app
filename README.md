# CBT Portal - College of Health and Environmental Sciences, Funtua

A computer-based testing (CBT) web app: students sit timed multiple-choice exams and get instant results; exam officers manage students, exams and scores from an admin dashboard.

Built with Next.js 15, React 19, Tailwind CSS 4, Prisma and SQLite.

## Quick start (any computer)

Requirements: [Node.js 20+](https://nodejs.org) and Git.

```bash
git clone <repo-url>
cd chstha-cbt-app
npm install
npm run setup     # creates .env, the database, and demo data
npm run dev       # http://localhost:3000
```

`npm run setup` copies `.env.example` to `.env` (with a freshly generated `AUTH_SECRET`), applies the database migrations and seeds a demo student and sample exam.

**Before real use, open `.env` and change `ADMIN_PASSWORD`.**

| Role    | URL                    | Default login                |
| ------- | ---------------------- | ---------------------------- |
| Admin   | `/admin/login`         | `admin` / `ChangeMe@2025` (from `.env`) |
| Student | `/student/login`       | `student1` / `password123` (demo account - delete it before going live) |

## Using the admin dashboard

- **Students** - register one at a time, or upload a CSV (`username,password,fullName`; see `public/sample-students.csv`). Passwords are stored hashed. You can reset passwords and delete students.
- **Exams** - upload a CSV (`text,option1..option4,correct`; see `public/sample-questions.csv`). `correct` is the **zero-based** index of the right option (`0` = option1). Each CSV row is validated and problems are reported with row numbers.
- **Scores** - filter by exam, download all results as CSV, or remove a score to let a student retake an exam.

## How exams work

- Questions are shuffled per student. The answer key is never sent to the browser.
- The countdown is based on the server start time, so refreshing or switching device does not reset the clock.
- Answers autosave while the student works; if time runs out the saved answers are submitted automatically.
- Each student can take each exam once, until an admin removes their score.

## Configuration (`.env`)

| Variable         | Purpose                                              |
| ---------------- | ---------------------------------------------------- |
| `DATABASE_URL`   | SQLite file, default `file:./dev.db`                 |
| `ADMIN_USERNAME` | Admin login name                                     |
| `ADMIN_PASSWORD` | Admin password - change it                           |
| `AUTH_SECRET`    | Random string used to sign login cookies             |

## Production / exam-day deployment

```bash
npm run build
npm start          # http://localhost:3000
```

For a lab network, run it on one machine and have the others open `http://<that-machine's-IP>:3000`. If you serve it over plain HTTP (no HTTPS), add `INSECURE_COOKIES=true` to `.env`, otherwise browsers will refuse to keep the login cookie in production mode.

Back up `prisma/dev.db` regularly - it holds all students, exams and scores.

## Useful commands

| Command            | What it does                                    |
| ------------------ | ----------------------------------------------- |
| `npm run dev`      | Development server                              |
| `npm run build`    | Production build                                |
| `npm run lint`     | Lint the code                                   |
| `npm run db:seed`  | Re-run the demo seed                            |
| `npm run db:reset` | **Erase** the database and recreate it          |
