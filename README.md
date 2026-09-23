# Team Portal

An internal employee portal for **Flare Technical** and **Gas Needs**: passwordless
sign-in, individual task tracking with progress logging, KPIs, a company-wide
director dashboard, and a manager view for anyone with direct reports. Also
includes an approvals workflow (with comments, file attachments and digital
signatures) for things like quotations, drawings, site maps and submission
plans that need sign-off.

Built with Next.js 14 (App Router, TypeScript, Tailwind CSS), Prisma, and
SQLite for local development (swap to Postgres for production — see below).

## How it works

- **Sign in**: an employee enters their email and receives a 6-digit code
  (passwordless — no accounts to create, no passwords to remember).
- **Employees** see: the director's latest message, their own tasks with
  deadlines and progress bars, their KPIs, and a full timeline of every
  update they've logged.
- **Logging progress**: each task has an update form — an employee writes a
  short comment and moves a progress slider. That comment + progress
  snapshot is saved to the task's timeline, so progress history is always
  documented.
- **Managers** (anyone with direct reports, e.g. Ram, Shafeek, Antony, Manu,
  Sumith…) get a "My Team" view of their reports' tasks, KPIs and timelines,
  and can assign new tasks / set KPI targets for people in their reporting
  line.
- **Approvals**: anyone can send a request (with an optional file) to their
  manager for sign-off. The approver can comment back and forth before
  deciding, and both sides can keep attaching documents. Approving/rejecting
  attaches the decider's saved digital signature.
- **The director** (Abraham Mathew, director of both companies) gets a
  company-wide dashboard: overall task completion, overdue tasks, average
  KPI achievement across the company, the full org chart, and a page to post
  a message that appears on every employee's dashboard. A separate
  "Manage employees" page lets the director fix email addresses.

## Local development

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Open http://localhost:3000. Sign in with any of the seeded email addresses
below — since no email service is configured by default, the 6-digit code is
printed to your terminal instead of actually emailed.

### Seeded accounts

Everyone was seeded with their real official address where known, and a
placeholder `name@company.com` address otherwise. Before rolling this out,
go to **Company Dashboard → Manage employees** as the director
(`abraham@flaretechnical.com`) and replace any remaining placeholder email
with the person's real one.

- Director (both companies): `abraham@flaretechnical.com`
- Flare Technical: `finance@` (Shafeek), `accounts@` (Hashim), `ram@` (Ram),
  `jiyad.m@` (Jiyad), `santhosh@` (Santhosh), `simi@` (Simi), `design@`
  (Mamidi), `saroj@` (Saroj), `service@` (Jayaprakash), `alerts@`
  (Flexie) `flaretechnical.com`
- Gas Needs: `sales@` (Antony), `accounts@` (Jintu), `business@` (Manu
  Johny), `sumith@` (Sumith), `vishal@` (Vishal), `jibin@` (Jibin),
  `badarudheen@` (Badarudheen) `gasneeds.com`, and `jai@gasneeds.com`
  (Jai — placeholder until his real address is shared)

## Sending real emails

Set `RESEND_API_KEY` and `EMAIL_FROM` in `.env` (get a free key at
[resend.com](https://resend.com) — the free tier covers 100 emails/day,
3,000/month, no card required) and sign-in codes will be emailed for real
instead of being logged to the console.

## File storage

Task and approval attachments are stored on local disk under `uploads/` for
now (see `src/lib/storage.ts`). That folder isn't committed to git and isn't
persistent on most hosts (e.g. Vercel) — before a real production deploy,
swap that one file's implementation for the Microsoft Graph API against each
company's OneDrive/SharePoint (needs an Azure AD app registration with
`Files.ReadWrite.All` permission — Tenant ID, Client ID and Client Secret per
company).

## Moving to production

1. Provision a Postgres database (e.g. [Supabase](https://supabase.com) or
   [Neon](https://neon.tech)) and set `DATABASE_URL` to its connection
   string.
2. In `prisma/schema.prisma`, change the datasource `provider` from
   `"sqlite"` to `"postgresql"`.
3. Run `npx prisma migrate deploy`.
4. Deploy the app (e.g. to [Vercel](https://vercel.com)) with the same env
   vars (`DATABASE_URL`, `SESSION_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`).
