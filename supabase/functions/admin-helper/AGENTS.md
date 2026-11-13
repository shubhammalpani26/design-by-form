# admin-helper

- Admin Social/Ads chat helpers run through one function (`admin-helper`, rules + tested guards in its `rules.ts`), one saved chat per helper; Social drafts are stored with status `draft` and publish only after the owner's Approve tap, and Ads can only pause objects in our own ad account; why: helpers act fast without ever publishing, enabling ads or raising spend on their own.
