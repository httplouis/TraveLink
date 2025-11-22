# Fix Foreign Key Constraint Violation

Step-by-step guide to fix foreign key constraint violations.

## Process

1. **Identify the constraint causing the error**
   ```sql
   SELECT 
     tc.constraint_name,
     tc.table_name,
     kcu.column_name,
     ccu.table_name AS foreign_table_name,
     ccu.column_name AS foreign_column_name,
     rc.delete_rule
   FROM information_schema.table_constraints AS tc
   JOIN information_schema.key_column_usage AS kcu
     ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.constraint_column_usage AS ccu
     ON ccu.constraint_name = tc.constraint_name
   JOIN information_schema.referential_constraints AS rc
     ON rc.constraint_name = tc.constraint_name
   WHERE tc.constraint_name = 'constraint_name_from_error';
   ```

2. **Check current DELETE rule**
   - `NO ACTION` or `RESTRICT` = blocks deletion
   - `SET NULL` = sets FK to NULL when referenced row deleted
   - `CASCADE` = deletes row when referenced row deleted

3. **Create migration to fix**
   ```sql
   -- Drop existing constraint
   ALTER TABLE public.table_name
   DROP CONSTRAINT IF EXISTS constraint_name;
   
   -- Recreate with proper ON DELETE behavior
   ALTER TABLE public.table_name
   ADD CONSTRAINT constraint_name 
   FOREIGN KEY (column_name) 
   REFERENCES other_table(id)
   ON DELETE SET NULL; -- or CASCADE
   ```

4. **Apply migration**
   - Use Supabase MCP tool or SQL editor
   - Verify with query from step 1

5. **Test deletion**
   - Try deleting the referenced row
   - Verify FK behavior matches expectations

## Common Scenarios

### Optional Reference (should be NULL when deleted)
Use `ON DELETE SET NULL`

### Required Reference (should be deleted together)
Use `ON DELETE CASCADE`

### Block Deletion (should prevent deletion)
Keep `ON DELETE NO ACTION` or `RESTRICT`

## Key Points
- Always check current constraint first
- Choose appropriate DELETE rule based on business logic
- Test thoroughly after applying migration
- Update application code if needed (remove manual cleanup if FK handles it)

