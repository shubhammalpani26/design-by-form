UPDATE public.manufacturing_intelligence
SET value = 'FGF additive (PETG-CF pellet) • 1.2mm nozzle • 28% infill'
WHERE id = '670c3bcf-1c4d-46e5-b5af-71039792ee2a';

UPDATE public.manufacturing_intelligence
SET value = 'Large-format FGF • PETG-CF pellet • internal ribbing',
    learning = 'Use Cyanique large-format FGF pellet extrusion for any seat >1.2m wide.'
WHERE id = 'c3b6555a-0501-4409-a8f2-a144d27a3fef';

UPDATE public.manufacturing_intelligence
SET learning = 'For accent benches at this size, PETG-CF pellet (FGF) at 28% infill = best stiffness-to-weight.'
WHERE id = '670c3bcf-1c4d-46e5-b5af-71039792ee2a';