# Salary-slip email evidence

All people, documents and workspace values in these images are synthetic.
Feature source: d6df5b7cb. No salary amount, actual employee document or real
recipient was used in these local captures.

- `admin-email-queued.png`: real Brave system workflow after administrator
  recipient/month confirmation and enqueue. This proves queued UI, not external
  delivery. The test mail adapter performs no real send.
- `email-desktop.png` and `email-mobile.png`: Rails' actual MIME-aware mailer
  preview in Brave at1400/390px. Both inline logos resolve; the private archive
  link includes workspace/month. No page overflow or captured JS exception.

Focused verification:39 request/job/mailer/policy examples,8 real Brave system
examples, required Vite build and focused lint pass. Production delivery and
the separately authorized Keshav channel test are recorded in the PR after they
are observed; these synthetic images alone do not establish either.
