# 📝 STORAGE POLICY SQL EXPRESSIONS

## ✅ FOR INSERT POLICY (Upload Files)

**Policy Name:** `Allow authenticated uploads`

**Allowed operation:** INSERT ✅

**Target roles:** authenticated ✅

**Policy definition (USING):**
```sql
bucket_id = 'profiles'
```

**Policy definition (WITH CHECK):**
```sql
bucket_id = 'profiles'
```

---

## ✅ FOR UPDATE POLICY (Update Files)

**Policy Name:** `Allow authenticated updates`

**Allowed operation:** UPDATE ✅

**Target roles:** authenticated ✅

**Policy definition (USING):**
```sql
bucket_id = 'profiles'
```

**Policy definition (WITH CHECK):**
```sql
bucket_id = 'profiles'
```

---

## 🎯 QUICK COPY-PASTE

### For INSERT Policy:
**USING:**
```
bucket_id = 'profiles'
```

**WITH CHECK:**
```
bucket_id = 'profiles'
```

### For UPDATE Policy:
**USING:**
```
bucket_id = 'profiles'
```

**WITH CHECK:**
```
bucket_id = 'profiles'
```

---

## 📋 STEPS TO COMPLETE

1. **In the Policy definition field**, replace `1 bucket_id = 'profiles'` with:
   ```
   bucket_id = 'profiles'
   ```

2. **Click "Review"** button

3. **Review the policy**, then click **"Save policy"**

4. **Create UPDATE policy** (same steps, but operation = UPDATE)

---

**The expression `bucket_id = 'profiles'` allows operations on the profiles bucket!**

