-- ============================================
-- INSERT ALL DEPARTMENTS AND OFFICES
-- Complete list from src/lib/org/departments.ts
-- ============================================

-- Create departments table if not exists
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(50) UNIQUE,
  type VARCHAR(50), -- 'academic' or 'office'
  head_name VARCHAR(255), -- Default head name
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ACADEMIC DEPARTMENTS (13)
-- ============================================

INSERT INTO public.departments (name, code, type, head_name) VALUES
  ('College of Computing and Multimedia Studies', 'CCMS', 'academic', 'Dr. Aileen Santos'),
  ('College of Criminal Justice and Criminology', 'CCJC', 'academic', 'Dean Roberto Cruz'),
  ('College of Nursing and Allied Health Sciences', 'CNAHS', 'academic', 'Dr. Melissa Ramos'),
  ('College of International Hospitality and Tourism Management', 'CIHTM', 'academic', 'Chef Arman Villanueva'),
  ('College of Architecture and Fine Arts', 'CAFA', 'academic', 'Ar. Paolo Lopez'),
  ('College of Maritime Education', 'CME', 'academic', 'Capt. Jerome Valdez'),
  ('College of Business and Accountancy', 'CBA', 'academic', 'Prof. Henry Dizon'),
  ('College of Arts and Sciences', 'CAS', 'academic', 'Dr. Regina Flores'),
  ('College of Education', 'CED', 'academic', 'Dr. Celeste Aquino'),
  ('College of Engineering', 'CENG', 'academic', 'Engr. Liza Ramos'),
  ('Enverga Law School', 'ELS', 'academic', 'Atty. Miguel Santos'),
  ('Institute of Graduate Studies and Research', 'IGSR', 'academic', 'Dr. Alvin Garcia'),
  ('Basic Education Department', 'BED', 'academic', 'Mrs. Karen Bautista')
ON CONFLICT (name) DO UPDATE SET
  code = EXCLUDED.code,
  type = EXCLUDED.type,
  head_name = EXCLUDED.head_name;

-- ============================================
-- ADMINISTRATIVE OFFICES (40+)
-- ============================================

INSERT INTO public.departments (name, code, type, head_name) VALUES
  ('Accounting Department', 'ACCT', 'office', 'Ms. Paula Reyes'),
  ('Admission Office', 'ADM', 'office', 'Ms. Tricia Gomez'),
  ('Audting Department', 'AUD', 'office', 'Mr. Leo Castillo'),
  ('Community Relations Department', 'CRD', 'office', 'Ms. Iya Morales'),
  ('Corporate Planning and Development Office', 'CPDO', 'office', 'Mr. Daniel Lim'),
  ('Data Protection Office', 'DPO', 'office', 'Mr. Noel Sarmiento'),
  ('Dr. Cesar A. Villariba Research & Knowledgement Management Institute', 'VRKMI', 'office', 'Dr. Cesar Villariba'),
  ('General Services Department', 'GSD', 'office', 'Mr. Jason Uy'),
  ('Global Engagement Office', 'GEO', 'office', 'Ms. Sofia Tan'),
  ('Health, Safety and Auxiliary Services Department', 'HSAS', 'office', 'Mr. Patrick Cruz'),
  ('Human Resource Department', 'HR', 'office', 'Ms. Lorna de la Cruz'),
  ('Information & Communications Technology Department', 'ICT', 'office', 'Mr. Carlo Perez'),
  ('Institutional Marketing and Promotions', 'IMP', 'office', 'Ms. Bea Robles'),
  ('Learning Development Center', 'LDC', 'office', 'Ms. Andrea Soriano'),
  ('Legal Office', 'LEGAL', 'office', 'Atty. Vivian Mendoza'),
  ('Medical and Dental Services', 'MDS', 'office', 'Dr. Ramon Santos'),
  ('MSEUF International Student Hub', 'ISH', 'office', 'Ms. Hannah Ocampo'),
  ('Office of Quality Improvement', 'OQI', 'office', 'Mr. Julius Navarro'),
  ('Office of Scholarship & Endowmen, Job Placement, and Alumni Relations', 'OSEA', 'office', 'Ms. Angela Ramos'),
  ('Office of Sports & Cultural Relations', 'OSCR', 'office', 'Mr. Marco Villoria'),
  ('Office of Student Affairs & Services', 'OSAS', 'office', 'Ms. Kristine Chavez'),
  ('Office of the Chairman/CEO', 'OCEO', 'office', 'Mr. Ernesto Enverga'),
  ('Office of the Comptroller', 'COMP', 'office', 'Mr. Luis Fernandez'),
  ('Office of the President/COO', 'OCOO', 'office', 'Dr. Maria Enverga'),
  ('Office of the Vice President for Academics and Research', 'VPACAD', 'office', 'Dr. Roselle Garcia'),
  ('Office of the Vice President for Administration', 'VPADMIN', 'office', 'Mr. Rene Garcia'),
  ('Office of the Vice President for External Relations', 'VPEXT', 'office', 'Mr. Paolo Miranda'),
  ('Office of the Vice President for Finance', 'VPFIN', 'office', 'Ms. Clarissa Lim'),
  ('Pollution Control Office', 'PCO', 'office', 'Mr. Nathan Ong'),
  ('Procurement Office', 'PROC', 'office', 'Ms. Faith Santos'),
  ('Property Office', 'PROP', 'office', 'Mr. Jorge Dizon'),
  ('Registrar''s Office', 'REG', 'office', 'Ms. Liza Manuel'),
  ('Research Publication, Incubation, and Utilization Center', 'RPIUC', 'office', 'Dr. Helen Cruz'),
  ('Treasury Department', 'TRES', 'office', 'Ms. Carmina Reyes'),
  ('University Collegiate Student Council', 'UCSC', 'office', 'Mr. Adrian Gomez'),
  ('University Laboratories', 'LAB', 'office', 'Dr. Vincent Tan'),
  ('University Libraries', 'LIB', 'office', 'Ms. Teresa Mariano'),
  ('Web Content and Digital Engagement Office', 'WCDEO', 'office', 'Ms. Jamie Uy'),
  
  -- Additional short/alias offices
  ('Treasury Office', 'TREAS', 'office', 'Ms. Carmina Reyes'),
  ('Alumni Affairs Office', 'ALUMNI', 'office', 'Ms. Angela Ramos'),
  ('Human Resources', 'HRO', 'office', 'Ms. Lorna de la Cruz'),
  ('Finance Office', 'FIN', 'office', 'Ms. Clarissa Lim'),
  
  -- Transport Office (special - where Ma'am TM and Cleofe are)
  ('Transport Office', 'TRANS', 'office', 'Ma''am TM')
ON CONFLICT (name) DO UPDATE SET
  code = EXCLUDED.code,
  type = EXCLUDED.type,
  head_name = EXCLUDED.head_name;

-- ============================================
-- VERIFICATION
-- ============================================

-- Count by type
SELECT 
  type,
  COUNT(*) as count
FROM public.departments
GROUP BY type
ORDER BY type;

-- List all departments
SELECT 
  name,
  code,
  type,
  head_name
FROM public.departments
ORDER BY type, name;

-- Total count
SELECT 'Total Departments/Offices' as label, COUNT(*) as count 
FROM public.departments;

-- ============================================
-- DONE!
-- ============================================
-- Expected results:
-- Academic: 13
-- Office: 40+
-- Total: 53+
