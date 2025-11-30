# 🚨 URGENT FIX: Frontend Still Using Localhost

## ❌ Problem

The frontend is still calling `http://localhost:3001` because:
- **Vite embeds environment variables at BUILD TIME**
- Your frontend was built **BEFORE** setting `VITE_API_URL` in Railway
- The build embedded the fallback value (`localhost:3001`) into the JavaScript files

## ✅ Solution: Set VITE_API_URL and Rebuild

### Step 1: Find Your Backend Railway URL

1. Go to **Railway Dashboard**
2. Click on your **Backend Service**
3. Go to **Settings** tab → **Domains** section
4. Copy your backend URL (e.g., `https://capstone-2025-budz-reserve-production-23d2.up.railway.app`)

### Step 2: Set VITE_API_URL in Railway

1. Go to **Railway Dashboard**
2. Click on your **Frontend Service**
3. Go to **Variables** tab
4. Click **+ New Variable** (or edit if it exists)
5. Set:
   - **Variable Name:** `VITE_API_URL`
   - **Value:** `https://YOUR-BACKEND-URL.up.railway.app/api`
     - ⚠️ **IMPORTANT:** Replace `YOUR-BACKEND-URL` with your actual backend URL
     - ⚠️ **MUST** start with `https://`
     - ⚠️ **MUST** end with `/api`
   - Example: `https://capstone-2025-budz-reserve-production-23d2.up.railway.app/api`
6. Click **Save**

### Step 3: Railway Will Automatically Rebuild

- Railway will **automatically trigger a new build** when you save the environment variable
- Wait for the deployment to complete (check the **Deployments** tab)
- This build will embed the correct backend URL into the JavaScript files

### Step 4: Verify Backend CORS is Set

While waiting for the frontend rebuild, also check your backend:

1. Go to **Railway Dashboard**
2. Click on your **Backend Service**
3. Go to **Variables** tab
4. Make sure `CORS_ORIGIN` is set to:
   - `https://client-production-3363.up.railway.app`
   - (Your frontend Railway URL)

## 🔍 How to Verify It's Fixed

After the rebuild completes:

1. **Refresh your frontend** (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
2. **Open Browser DevTools** (F12)
3. Go to **Network** tab
4. Try to log in
5. Check the request URL — it should now be:
   - ✅ `https://YOUR-BACKEND-URL.up.railway.app/api/auth/login`
   - ❌ NOT `http://localhost:3001/api/auth/login`

## 📋 Quick Checklist

- [ ] Found backend Railway URL
- [ ] Set `VITE_API_URL` to: `https://BACKEND-URL.up.railway.app/api`
- [ ] Verified URL starts with `https://`
- [ ] Verified URL ends with `/api`
- [ ] Saved the variable (triggers rebuild)
- [ ] Set `CORS_ORIGIN` in backend to frontend URL
- [ ] Waited for deployment to complete
- [ ] Refreshed frontend and tested login

## ⚠️ Common Mistakes

1. ❌ **Missing `https://`** - Must use `https://` not `http://`
2. ❌ **Missing `/api` at the end** - Must end with `/api`
3. ❌ **Extra spaces** - No spaces before/after the URL
4. ❌ **Wrong backend URL** - Make sure you're using the BACKEND URL, not frontend
5. ❌ **Not waiting for rebuild** - Must wait for Railway to finish rebuilding

## 🎯 Expected Result

After setting `VITE_API_URL` and rebuilding:
- ✅ Frontend will call your Railway backend URL
- ✅ Login will work
- ✅ All API calls will go to the correct backend
- ✅ No more localhost errors

---

**Need your backend URL?** Check Railway → Backend Service → Settings → Domains

