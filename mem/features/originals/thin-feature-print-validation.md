---
name: Thin-feature print validation
description: Physical test prints confirm upright ears and crests print fine; do not tighten the meshCheck thin-feature rule further
type: constraint
---

Physical test prints (Oct 2026) — a rabbit with tall upright ears and a cockatoo with a swept-back raised crest — both printed cleanly with no failures. User decision: the current meshCheck thresholds (featureWarnFraction 0.0005, featureFailFraction 0.003, signed-distance material-only detection) are correct as-is. Do NOT add a stricter rule forcing long ears to rest against the head or crests to lie flat; upright ears and raised crests are acceptable and validated by real prints.
