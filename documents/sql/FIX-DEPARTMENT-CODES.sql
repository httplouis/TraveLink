-- Fix department codes to match departments.ts
-- This script updates department codes to match the canonical codes in src/lib/org/departments.ts

-- Admission Office: ADM -> AO
UPDATE public.departments 
SET code = 'AO' 
WHERE code = 'ADM' AND name = 'Admission Office';

-- Audting Department: AUD -> AuD
UPDATE public.departments 
SET code = 'AuD' 
WHERE code = 'AUD' AND name = 'Audting Department';

-- Dr. Cesar A. Villariba Research & Knowledgement Management Institute: VRKMI -> DCAVRKMI
UPDATE public.departments 
SET code = 'DCAVRKMI' 
WHERE code = 'VRKMI' AND name = 'Dr. Cesar A. Villariba Research & Knowledgement Management Institute';

-- Health, Safety and Auxiliary Services Department: HSAS -> HSASD
UPDATE public.departments 
SET code = 'HSASD' 
WHERE code = 'HSAS' AND name = 'Health, Safety and Auxiliary Services Department';

-- Human Resource Department: HR -> HRD
UPDATE public.departments 
SET code = 'HRD' 
WHERE code = 'HR' AND name = 'Human Resource Department';

-- Information & Communications Technology Department: ICT -> ICTD
UPDATE public.departments 
SET code = 'ICTD' 
WHERE code = 'ICT' AND name = 'Information & Communications Technology Department';

-- MSEUF International Student Hub: ISH -> MISH
UPDATE public.departments 
SET code = 'MISH' 
WHERE code = 'ISH' AND name = 'MSEUF International Student Hub';

-- Office of Scholarship & Endowmen, Job Placement, and Alumni Relations: OSEA -> OSEJPAR
UPDATE public.departments 
SET code = 'OSEJPAR' 
WHERE code = 'OSEA' AND name = 'Office of Scholarship & Endowmen, Job Placement, and Alumni Relations';

-- Office of the Comptroller: COMP -> OC
UPDATE public.departments 
SET code = 'OC' 
WHERE code = 'COMP' AND name = 'Office of the Comptroller';

-- Office of the President/COO: OCOO -> OPCOO
UPDATE public.departments 
SET code = 'OPCOO' 
WHERE code = 'OCOO' AND name = 'Office of the President/COO';

-- Office of the Vice President for Academics and Research: VPACAD -> OVPAR
UPDATE public.departments 
SET code = 'OVPAR' 
WHERE code = 'VPACAD' AND name = 'Office of the Vice President for Academics and Research';

-- Office of the Vice President for Administration: VPADMIN -> OVPA
UPDATE public.departments 
SET code = 'OVPA' 
WHERE code = 'VPADMIN' AND name = 'Office of the Vice President for Administration';

-- Office of the Vice President for External Relations: VPEXT -> OVPER
UPDATE public.departments 
SET code = 'OVPER' 
WHERE code = 'VPEXT' AND name = 'Office of the Vice President for External Relations';

-- Office of the Vice President for Finance: VPFIN -> OVPF
UPDATE public.departments 
SET code = 'OVPF' 
WHERE code = 'VPFIN' AND name = 'Office of the Vice President for Finance';

-- Procurement Office: PROC -> PO
UPDATE public.departments 
SET code = 'PO' 
WHERE code = 'PROC' AND name = 'Procurement Office';

-- Property Office: PROP -> PropO
UPDATE public.departments 
SET code = 'PropO' 
WHERE code = 'PROP' AND name = 'Property Office';

-- Registrar's Office: REG -> RO
UPDATE public.departments 
SET code = 'RO' 
WHERE code = 'REG' AND name = 'Registrar''s Office';

-- Treasury Department: TRES -> TD
UPDATE public.departments 
SET code = 'TD' 
WHERE code = 'TRES' AND name = 'Treasury Department';

-- University Laboratories: LAB -> UL
UPDATE public.departments 
SET code = 'UL' 
WHERE code = 'LAB' AND name = 'University Laboratories';

-- University Libraries: LIB -> ULib
UPDATE public.departments 
SET code = 'ULib' 
WHERE code = 'LIB' AND name = 'University Libraries';

-- Verify changes
SELECT code, name, type 
FROM public.departments 
ORDER BY type, name;

