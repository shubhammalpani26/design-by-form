# Show the real Nyra and Nalaa photo inside outreach emails

## What changes for the reader
New outreach emails show the real studio photo of Nyra (terracotta goldendoodle) and Nalaa (cream cat), the same photo as the top of the Originals page, right inside the email. The order becomes:

```text
Hi [name],
[Hook: one specific line about them / their pet / their shop]

[ PHOTO: Nyra and Nalaa, real finished pieces ]
Nyra and Nalaa, two real pieces made from owners' photos.

[Offer, 1 sentence: free sculpture of your pet (creators) / free front-desk piece (shops)]
[Terms, 1 short line: discount for their people + 20% to you, 30% on Statement, paid monthly]
[Ask: reply with a favourite photo and your pet's name]

More pieces: nyzora.ai/originals/...      <- one small link at the end
Shubham, Founder, Nyzora
Reply "no thanks" and I won't email again.
```

- The emails get shorter: about 60–90 words, down from 70–120.
- The ask always requests both a photo and the pet's name, so we can make the lettering straight away.
- Creators and shops both get the photo. Creator emails keep "first 30 creator partners this month".

## Why it should help, and the one risk
- People see the piece is real and well made before they read any numbers, which is the strongest reason to reply.
- Risk: heavy, image-only cold emails can land in Promotions or spam. To keep the risk low, each email carries only one small photo (~100 KB), stays mostly text, keeps a plain-text copy for mail apps that block images, and has one link instead of two.

## Rollout
1. Build it. Then send one test email to your own address (shubham.malpani@nyzora.ai) so you can see it on your phone. Nothing goes to leads.
2. The admin Outreach preview shows the photo in each draft, so you see what they'll see.
3. The 29 queued shop drafts get the photo and the new order when they're sent. Their wording stays as written.
4. After about 50 sends, compare the reply rate with the earlier text-only batches.

## Technical notes
- Compress `src/assets/originals-hero.jpg` to ~900px-wide JPEG, aiming for 80 KB or less (100 KB at most). Store it as a base64 constant in `supabase/functions/_shared/outreachPhoto.ts`, so the email never depends on a remote fetch.
- `rawEmail` in `_shared/outreach.ts`: build `multipart/alternative` (text/plain body unchanged) + `multipart/related` (simple HTML: escaped paragraphs, `<img src="cid:pieces">` at 100% max 520px wide, caption) with the JPEG as an inline CID part. Gmail send API accepts this raw MIME as-is.
- The image goes after the first paragraph (the greeting plus hook) of the stored body. Body text stays plain in the DB, so replies, search and edits are unaffected.
- Update the drafting INSTRUCTIONS in `outreach-admin/index.ts`: new shape, shorter length, link last, and the ask names both a favourite photo and the pet's name (shops: "a photo of a pet you'd like and its name"). `ensurePartnerShare` stays as it is.
- Add a test that the raw message holds text/plain, text/html with `cid:pieces`, and the image part with a matching Content-ID, and that the photo sits after the hook. Run the 16 existing tests too.
- `OutreachPanel.tsx`: show the photo inline in the draft preview after the first paragraph.
- Update the outreach-admin AGENTS.md rule: emails carry exactly one inline real-piece photo, never remote-hosted images.
