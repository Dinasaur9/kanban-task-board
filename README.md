# NextPlay Kanban

A polished, responsive Kanban task board built for the Next Play Games Software Development Internship Assessment.

## Live demo

The deployment URL will be added here after publishing.

## Features

- Private guest workspaces using Supabase anonymous authentication
- Four required workflow columns: To Do, In Progress, In Review, and Done
- Drag-and-drop task movement with an accessible status-selector alternative
- Create, edit, move, and delete task workflows
- Priority levels, descriptions, and due dates
- Due-soon and overdue indicators
- Search and priority filtering
- Board summary statistics
- Responsive layouts, polished empty states, loading feedback, and actionable errors
- Safe device-local fallback when Supabase is unavailable
- End-to-end coverage with Playwright

## Technology

- React 19 and TypeScript
- Vite
- Tailwind CSS
- Supabase Auth and Postgres
- Playwright

## Local setup

1. Clone the repository.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a Supabase project on the free tier.
4. In Supabase Authentication settings, enable anonymous sign-ins.
5. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor.
6. Copy `.env.example` to `.env.local` and add the project URL and public anon key:

   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-anon-key
   ```

7. Start the app:

   ```bash
   npm run dev
   ```

Never place a Supabase service-role key in a frontend environment file.

## Database and security

The complete reproducible schema is in [`supabase/schema.sql`](supabase/schema.sql). Tasks use UUID primary keys and canonical status values (`todo`, `in_progress`, `in_review`, and `done`). Each record is tied to the authenticated guest through `user_id`.

Row Level Security is enabled and forced. Separate `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies compare `auth.uid()` with `user_id`, so one guest cannot access another guest's tasks. The anonymous Postgres role receives no table access; signed-in anonymous Supabase users operate through the `authenticated` role.

## Quality checks

```bash
npm run lint
npm run build
npm run test:e2e
```

## Design decisions

The visual system uses a deep slate foundation with cyan as the primary action color and restrained amber, violet, emerald, and red accents for workflow meaning. Strong spacing, rounded surfaces, compact badges, and clear typography create hierarchy without turning the board into a dense dashboard.

Native HTML drag-and-drop keeps the required desktop interaction lightweight. Every card also includes a status selector so moving tasks remains keyboard- and touch-friendly. Optimistic updates make the board feel immediate, while failed remote mutations roll back to the previous state and display a clear message.

## Tradeoffs and future improvements

- Native drag-and-drop is intentionally dependency-free, but a dedicated interaction library could add richer touch dragging and animated reordering within columns.
- Device-local storage is a resilience fallback, not a replacement for Supabase. Local fallback data does not automatically merge into a later cloud session.
- With more time, the next additions would be assignees, task comments, activity history, and custom labels.
