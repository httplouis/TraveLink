# Verify Department Resolution

Test and debug department resolution logic in TraviLink.

## Resolution Order

1. **Check `department_id`** (direct foreign key)
2. **Check `department` text field** with matching:
   - Exact match (case-insensitive)
   - Code match (e.g., "CCMS" matches "College of Computing and Multimedia Studies")
   - Partial match (contains)
3. **Fallback to `departments.head_name`** (legacy, last resort)

## Test Function

```typescript
async function resolveDepartment(user: any) {
  console.log("[Department Resolution] Starting for user:", user.id);
  
  // Step 1: Check department_id
  if (user.department_id) {
    console.log("[Department Resolution] ✅ Found department_id:", user.department_id);
    return user.department_id;
  }
  
  // Step 2: Check department text field
  if (user.department) {
    console.log("[Department Resolution] Checking department text:", user.department);
    
    // Fetch all departments
    const { data: departments } = await supabase
      .from('departments')
      .select('id, name, code');
    
    // Exact match
    const exactMatch = departments?.find(
      d => d.name.toLowerCase() === user.department.toLowerCase()
    );
    if (exactMatch) {
      console.log("[Department Resolution] ✅ Exact match:", exactMatch.id);
      return exactMatch.id;
    }
    
    // Code match
    const codeMatch = departments?.find(
      d => d.code.toLowerCase() === user.department.toLowerCase()
    );
    if (codeMatch) {
      console.log("[Department Resolution] ✅ Code match:", codeMatch.id);
      return codeMatch.id;
    }
    
    // Partial match
    const partialMatch = departments?.find(
      d => d.name.toLowerCase().includes(user.department.toLowerCase()) ||
           user.department.toLowerCase().includes(d.name.toLowerCase())
    );
    if (partialMatch) {
      console.log("[Department Resolution] ✅ Partial match:", partialMatch.id);
      return partialMatch.id;
    }
    
    console.log("[Department Resolution] ❌ No match found for:", user.department);
  }
  
  // Step 3: Fallback (if applicable)
  console.log("[Department Resolution] ⚠️ Using fallback");
  return null;
}
```

## Debugging Checklist

- [ ] Log user's `department_id` value
- [ ] Log user's `department` text value
- [ ] Log all departments fetched from database
- [ ] Log each matching attempt (exact, code, partial)
- [ ] Log final resolved `department_id`
- [ ] Verify resolved department exists in database

## Common Issues

### No department_id and no department text
- **Solution**: User needs department assignment
- **Action**: Update user with department_id

### Department text doesn't match
- **Solution**: Check department names in database
- **Action**: Update department text or add to matching logic

### Multiple matches found
- **Solution**: Prioritize exact match, then code, then partial
- **Action**: Use first match in priority order

## Key Points
- Always log all resolution attempts
- Use case-insensitive matching
- Check exact, code, and partial matches in order
- Fallback to head_name only as last resort
- Update user's department_id after resolution

