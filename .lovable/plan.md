# Admin-only zero-payment inspection orders

## What will change
- When an authenticated admin applies `NYZORA-INTERNAL`, checkout will create a real internal test order without opening a payment window or charging anything.
- The order will run through the same preview, size-specific 3D generation, reinforced base, orientation normalization, raised front lettering, printability checks, and STL creation used for customers.
- Internal test orders will stop in an **Awaiting approval** state. Automatic retries and background sweeps must not send them to manufacturing.
- Originals Ops will show the preview/render, provide a secure STL download, show lettering-placement evidence, and offer an explicit **Approve and send to manufacturing** action.
- The release action will revalidate the final STL, lettering version/face/hash, address, size, and filament before sending it to the manufacturing partner.

## Safety and access
- The no-payment path and release action will verify the admin role on the server; public customers cannot invoke them.
- Ordinary paid orders keep their existing automatic manufacturing workflow.
- Test orders remain auditable and retain the real manufacturing quote, while the customer charge is recorded as $0.

## Validation
- Add automated tests for public rejection, admin zero-payment creation, generation-with-hold, and explicit release.
- Run existing engraving/base/orientation tests plus payment and fulfillment regression tests.
- Test dog and cat journeys at mobile size, including personalization persistence, size switching, cart changes, address completion, order creation, render/STL access, and the manufacturing hold.
- Verify through the live preview that no partner order exists before approval.
