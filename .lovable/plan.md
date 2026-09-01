# Prove the engraving before spending on six pieces

Your question is the right one: was the blank plinth our bug, or can the print partner simply not print engraved text? Before any money is spent, this gets answered with evidence, not assurance.

## What is already known

The six test orders from the batch each have an engraved print file generated and recorded in the database:

| Piece | Lettering recorded | Cap height |
|---|---|---|
| MILO (petite) | `MILO / 2014 - 2024` | 10.74 mm |
| BARTHOLOMEW REX (standard) | `BARTHOLOMEW REX` | 6.83 mm |
| ZOË (standard) | `ZOE` | 12 mm |
| DUSKY (statement) | `DUSKY / GOOD GIRL` | 12 mm |
| PIP (petite) | `PIP` | 10.65 mm |
| KIWI (statement) | `KIWI / FLY FREE` | 12 mm |

Every one has an `-engraved.stl` file and a timestamp. None of them was sent to the partner (they have no shipping address, so fulfilment stopped — as designed).

That confirms the software now produces engraved files. It does not yet confirm the lettering is physically printable. That is what this plan checks.

## The check, in three parts

**1. Is the text real geometry in the file we would send?**
Download all six `-engraved.stl` files and, for each one, compare against the same mesh before engraving: triangle-count increase, bounding box unchanged, and the letter prisms located on the plinth face. Then render each plinth face to an image and read the name with your own eyes. If a name is legible in the render of the actual file, the file is correct — that is the same file the partner slices.

**2. Can the partner's process print it?**
Measure the engraved features against FDM reality rather than assuming:
- letter relief height (currently 1.2 mm proud — three layers at 0.2 mm)
- stroke width (0.9-1.6 mm — two to four times a 0.4 mm nozzle)
- cap heights above (6.8-12 mm)
Raised lettering at those dimensions is ordinary FDM work; nothing here is near a tolerance edge. This is stated as a measurement from the actual files, not a claim about the partner.

**3. Was the original failure ours?**
The two delivered blank pieces (Roxy, Dusky) were sent with print files that had no letter geometry at all — the lettering existed only in the AI render, and the image-to-3D step smoothed it away. The partner printed exactly what we sent. Part 1 re-confirms this by checking whether the *old* file for the Dusky order contains letter geometry; if it does not, the cause was ours and is now fixed.

## The guard that makes it not happen again

Beyond the existing fulfilment stop (a personalised order with no matching engraving record cannot be sent), add one geometry assertion at the point of engraving: the engraved file must contain more triangles than the source and the added geometry must sit on the plinth face. An order that fails that assertion never reaches the partner. This closes the gap where a file could be recorded as engraved without carrying real geometry.

## Then, and only then

Once you have looked at six rendered plinths with six correct names on them, the six pieces get a shipping address and are released to the partner. If any render is wrong, that piece is fixed before anything ships — no repeat of paying for blank plinths.

## Technical notes

- Verification is read-only: download the stored STLs, parse triangles, render orthographic views of the plinth face, report per-piece measurements. No production data is modified.
- The one code change is the triangle-delta/placement assertion inside the engraving step in `originals-model`, plus recording the measured relief and stroke width in `engraving_meta` so the admin card shows it.
- The fulfilment hard stop in `originals-fulfill` stays exactly as it is.
- Output is a per-piece checklist with the rendered plinth image for each of the six.
