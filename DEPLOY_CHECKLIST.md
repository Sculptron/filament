# 🚀 Deployment Checklist — Infrastructure Phase

Complete these steps to activate the new infrastructure:

## ☐ Step 1: Create Supabase Project (5 minutes)
1. Go to https://supabase.com and sign in
2. Click **New Project**
3. Choose:
   - **Name:** filament (or anything you prefer)
   - **Database Password:** Generate a strong password (you won't need to remember it)
   - **Region:** Choose closest to your users (e.g., US East, EU West)
4. Click **Create new project**
5. Wait ~2 minutes for provisioning

---

## ☐ Step 2: Run Database Schema (2 minutes)
1. In Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Open the file `supabase-schema.sql` in your code editor
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click **Run** (bottom right)
7. You should see: "Success. No rows returned"
8. Verify: Go to **Table Editor** → You should see `constellations` and `search_logs` tables

---

## ☐ Step 3: Copy API Keys (1 minute)
1. In Supabase dashboard, go to **Settings** (gear icon) → **API**
2. Copy these three values to a text file:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public: eyJhbG... (first long key)
   service_role: eyJhbG... (second long key, labeled "secret")
   ```

---

## ☐ Step 4: Add to Vercel (3 minutes)
1. Go to https://vercel.com/dashboard
2. Find your Filament project
3. Go to **Settings** → **Environment Variables**
4. Add these three new variables (select **Production, Preview, Development**):
   ```
   Name: SUPABASE_URL
   Value: (paste your Project URL)

   Name: SUPABASE_ANON_KEY
   Value: (paste your anon public key)

   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: (paste your service_role key)
   ```
5. Click **Save** for each

**Verify:** You should now have 4 environment variables total:
- ANTHROPIC_API_KEY (already existed)
- SUPABASE_URL (new)
- SUPABASE_ANON_KEY (new)
- SUPABASE_SERVICE_ROLE_KEY (new)

---

## ☐ Step 5: Deploy to Vercel (2 minutes)

### Option A: Git Push (Recommended)
```bash
git add .
git commit -m "Add database infrastructure with rate limiting"
git push
```

Vercel will automatically deploy (watch progress in Vercel dashboard).

### Option B: Manual Redeploy
1. Go to Vercel dashboard → **Deployments** tab
2. Click three dots (**...**) on latest deployment
3. Click **Redeploy**
4. Check **Use existing Build Cache** → Click **Redeploy**

---

## ☐ Step 6: Test It Works (3 minutes)

### Test 1: Basic Search
1. Go to https://filament-pink.vercel.app
2. Try a title search (e.g., "The Matrix")
3. ✅ Should generate a constellation normally

### Test 2: Verify Database Persistence
1. Go to Supabase dashboard → **Table Editor** → `constellations`
2. Click the **Reload** icon
3. ✅ You should see your search saved with a `share_id`

### Test 3: Verify Search Logging
1. Go to Supabase dashboard → **Table Editor** → `search_logs`
2. ✅ You should see your search logged with IP address

### Test 4: Rate Limiting (Optional)
1. Do 5 searches in a row
2. On the 6th search, you should see an error:
   ```
   Daily search limit reached. You've used 5 of 5 searches.
   Try again in 24 hours.
   ```
3. ✅ Rate limiting is working!

---

## ☐ Step 7: Monitor (Ongoing)

### Check Vercel Logs
If anything breaks:
1. Go to Vercel dashboard → **Functions** → Click `/api/constellation`
2. Check **Logs** for errors

### Check Supabase Logs
1. Go to Supabase dashboard → **Logs** → **API Logs**
2. See database queries in real-time

---

## 🎉 Success Criteria

When all steps are complete, you should have:
- ✅ Supabase project created
- ✅ Database tables visible in Supabase Table Editor
- ✅ 4 environment variables in Vercel
- ✅ New deployment live on Vercel
- ✅ Searches being saved to database
- ✅ Rate limiting active (5 per day per IP)

---

## 🚨 If Something Goes Wrong

### "Error: Failed to get response from AI"
→ Check that `ANTHROPIC_API_KEY` is still set in Vercel

### "Error: Internal server error"
→ Check Vercel function logs for the actual error message

### Searches work but aren't saving to database
→ Verify all 3 Supabase variables are in Vercel
→ Make sure you're using `SUPABASE_SERVICE_ROLE_KEY` not just the anon key
→ Re-run the SQL schema in Supabase

### Rate limit not working
→ Check that `search_logs` table exists in Supabase
→ Check Vercel logs for database connection errors

---

## 📊 What You Can Do Now

With infrastructure complete, you can now:

### Immediately
- See search patterns in Supabase (Table Editor → search_logs)
- Monitor rate limiting effectiveness
- Track API usage for cost estimates

### Next Session (Recommended)
- **Build shareable constellation URLs** (data is ready, just need frontend)
- **Display "searches remaining" in UI** (data is already returned)
- **Add error boundary to frontend** (for better user experience)

---

**Estimated Total Time:** 15-20 minutes

**Any Issues?** Start a new Claude Code session and say: "I'm deploying the infrastructure changes and [describe the problem]"
