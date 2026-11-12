# outreach-admin

- Founder cold outreach runs only through `outreach-admin` (admin Outreach tab + hourly `run`): one-to-one sends from the founder's linked Gmail, in US-daytime waves under a daily total (hard cap 150), rules in tested `_shared/outreach.ts`; why: cold email must never use the app-email service that carries order emails, and volume must stay controlled.
- New outreach contacts come from in-app research (`find_people`, Lovable AI web search) and are kept only if the address is printed on a fetchable public page we re-check ourselves (`emailOnPage`/`isCheckableUrl` in `_shared/outreach.ts`) and its domain takes mail; why: guessed addresses bounce and damage the founder's Gmail reputation.
