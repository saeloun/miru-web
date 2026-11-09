# Primary bank account confirmation

Original Brave captures use synthetic local data:

- [Desktop confirmation](screenshots/bank-confirmation-desktop.png),1440×1000.
- [Mobile confirmation](screenshots/bank-confirmation-mobile.png),375×1000.

The API regression first reproduced an initial bank number being accepted with one
entry (expected422, actual200). The shared endpoint now checks exact text confirmation
under its existing employment lock before assigning, saving or auditing changes.
All28 employee-record request cases pass, including session/admin and token/self
paths, missing/mismatch/type rejection, unchanged ciphertext/audits after rejection,
leading zeros, no persisted/returned confirmation, filtering and clear/contact-only
compatibility.

Native verification passes3 new bank cases plus10 existing profile cases (13 unique).
The new cases cover employee desktop, admin mobile, missing/mismatched/correct entry,
reset/cancel, unchanged/cleared values and retained failed-save drafts. The three
existing authorization cases without built-in console listeners were additionally
checked with a temporary external listener; all affected actor flows had zero console
errors/JavaScript exceptions. Those three reruns are not added to the unique count.
Both required Vite builds and focused lint pass; tested source hashes remained fixed.

No schema, bank digest, recipient verification, protected-credit reconciliation,
provider request, payment or production state changed. This entry safeguard does not
complete all country/currency beneficiary requirements or establish bank ownership.
