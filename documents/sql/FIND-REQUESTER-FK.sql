-- Find the requester foreign key specifically
SELECT
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'requests'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name LIKE '%requester%'
ORDER BY kcu.column_name;
