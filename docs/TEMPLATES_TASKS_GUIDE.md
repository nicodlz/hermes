# Templates & Tasks - User Guide

## 📧 Templates

### What are Templates?

Templates are reusable message blueprints for outreach (emails, DMs, proposals). They help standardize communication and track what works best.

### Template Types

- **INITIAL_OUTREACH** - First contact message
- **FOLLOWUP_1/2/3** - Sequential follow-up messages
- **PROPOSAL** - Project proposal template
- **CLOSING** - Deal closing messages
- **REJECTION** - Polite rejection responses
- **CUSTOM** - Your own templates

### Using Templates

1. **Browse Templates**: Go to `/templates` to see all available templates
2. **Preview**: Click a template to see preview with variable substitution
3. **Use in Outreach**: When composing an email from a lead detail page, select a template
4. **Track Performance**: See usage count and reply rates for each template

### Variables

Templates support dynamic variables like:
- `{{author}}` - Lead author name
- `{{title}}` - Lead title/project name
- `{{company}}` - Company name
- `{{stack}}` - Technology stack
- `{{budget}}` - Budget range

### Creating Templates

Click "New Template" and fill in:
- **Name**: Descriptive name
- **Type**: Template category
- **Channel**: Email, Reddit DM, Twitter DM, etc.
- **Subject**: Email subject (optional)
- **Content**: Message body with `{{variables}}`

### Best Practices

✅ **DO:**
- Keep initial outreach short and personalized
- Use proven templates as starting points
- Track reply rates and iterate
- A/B test different approaches

❌ **DON'T:**
- Send generic copy-paste messages
- Use overly salesy language
- Forget to customize variables
- Ignore low-performing templates

---

## ✅ Tasks

### What are Tasks?

Tasks are action items linked to leads. They help you stay organized and never miss a follow-up.

### Task Types

- **EMAIL** - Send an email (outreach, follow-up)
- **FOLLOWUP** - Generic follow-up action
- **CALL** - Schedule or make a call
- **RESEARCH** - Research company/person
- **PROPOSAL** - Prepare/send proposal
- **OTHER** - Custom tasks

### Task Priorities

- 🔴 **URGENT** - Do immediately
- 🟠 **HIGH** - Do today
- 🟡 **MEDIUM** - Do this week
- ⚪ **LOW** - Do when you can

### Task Workflow

1. **Create**: Add task from lead detail page or Tasks page
2. **Track**: View all tasks organized by status (Pending/In Progress/Completed)
3. **Complete**: Mark done when finished
4. **Review**: Check completed tasks for patterns

### Task Statuses

- **PENDING** - Not started yet
- **IN_PROGRESS** - Currently working on it
- **COMPLETED** - Done ✓
- **CANCELLED** - No longer needed

### Viewing Tasks

**Tasks Page** (`/tasks`):
- See ALL tasks across all leads
- Filter by status, priority, type
- View overdue tasks
- Organized in Kanban-style columns

**Lead Detail Page**:
- See tasks specific to that lead
- Quick overview of what's pending
- Context-aware task creation

### Creating Tasks

**From Lead Detail**:
1. Click "Add Task" button (if available)
2. Fill in title, description, type, priority
3. Set due date (optional)
4. Task is automatically linked to the lead

**From Tasks Page**:
1. Click "New Task" (to be implemented)
2. Select lead (optional)
3. Fill in details
4. Save

### Use Cases

**Example Workflow**:
1. New lead scraped → Create "Research" task
2. Research complete → Create "Email" task
3. Email sent → Create "Follow-up" task (due in 3 days)
4. No response → Create "Follow-up 2" task (due in 7 days)
5. Response received → Mark all tasks complete, create "Call" task

**AI Agent Integration** (future):
Tasks can be automatically executed by AI agents:
- EMAIL tasks → Auto-send with template
- RESEARCH tasks → AI researches and summarizes
- FOLLOWUP tasks → Auto-schedule and send

---

## 🔧 Troubleshooting

### Templates Not Showing

**Problem**: Templates page shows "No templates yet" but templates exist in DB.

**Cause**: Not authenticated (session expired).

**Solution**:
1. Go to `/login`
2. Request a magic link to your email
3. Click the link to log in
4. Templates should now appear

### Tasks Not Visible

**Problem**: No tasks showing anywhere.

**Cause**: No tasks created yet (feature not used).

**Solution**:
1. Run demo seed: `pnpm tsx scripts/seed-demo-tasks.ts`
2. Or manually create tasks from lead pages
3. Tasks will appear in `/tasks` and on lead detail pages

### Authentication Issues

**Problem**: Redirected to login page repeatedly.

**Cause**: Session cookie not being set or expired.

**Solution**:
1. Clear cookies for the domain
2. Request new magic link
3. Check that cookies are enabled in browser
4. Verify `APP_URL` env var is correct in `.env`

---

## 🚀 Quick Start

### For Nicolas (Production)

1. **Create your user**:
   ```bash
   pnpm tsx scripts/ensure-user.ts ndlz@pm.me "Nicolas" "Nicolas"
   ```

2. **Log in**:
   - Go to https://hermes.ndlz.net/login
   - Enter `ndlz@pm.me`
   - Check email for magic link
   - Click link to authenticate

3. **Test templates**:
   - Navigate to `/templates`
   - Should see 12 templates
   - Click one to preview

4. **Test tasks** (optional):
   ```bash
   pnpm tsx scripts/seed-demo-tasks.ts
   ```
   - Navigate to `/tasks`
   - Should see demo tasks

### For Developers (Local)

1. **Setup**:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   pnpm install
   ```

2. **Create user**:
   ```bash
   pnpm tsx scripts/ensure-user.ts your@email.com "Your Name" "Your Org"
   ```

3. **Start dev server**:
   ```bash
   pnpm dev
   ```

4. **Login**:
   - Go to http://localhost:5173/login
   - Magic link will be logged to console in dev mode

---

## 📊 Analytics

Both Templates and Tasks track usage metrics:

**Templates**:
- Usage count (how many times used)
- Reply rate (% of messages that got replies)
- Best performing templates by channel

**Tasks**:
- Completion rate
- Average time to complete
- Overdue tasks by lead/type

These metrics help you optimize your outreach process.
