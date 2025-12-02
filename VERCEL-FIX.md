# Vercel Deployment Fix - Function Invocation Error

## Problem
The serverless function was crashing with:
```
500: INTERNAL_SERVER_ERROR
Code: FUNCTION_INVOCATION_FAILED
```

## Root Causes

### 1. **Wrong Entry Point** ✅ FIXED
- **Issue**: `index.js` was trying to start a long-running server with `app.listen()`
- **Fix**: Created `api/index.js` that exports the Express app as a serverless handler
- **Solution**: Vercel now uses `api/index.js` which properly exports the app

### 2. **SQLite File System Issue** ✅ FIXED
- **Issue**: `database.js` was trying to create `food-delivery.db` file on disk
- **Problem**: Vercel's filesystem is **read-only** in serverless functions
- **Fix**: Created `database.vercel.js` that uses **in-memory SQLite**
- **Warning**: ⚠️ **Data will NOT persist between requests!**

## What Was Changed

### Files Created:
1. **`api/index.js`** - Serverless function handler
   - Exports Express app instead of starting a server
   - Properly initializes Apollo Server before handling requests

2. **`database.vercel.js`** - In-memory database
   - Uses `:memory:` instead of file path
   - Same schema and helpers as `database.js`
   - **Temporary solution only!**

### Files Updated:
1. **`vercel.json`** - Updated to use `api/index.js` as entry point
2. **`api/index.js`** - Now imports from `database.vercel.js`

## Current Status

✅ **Function should now deploy without crashing**

⚠️ **CRITICAL LIMITATION**: The in-memory database means:
- Data is lost between function invocations
- Each request starts with an empty database
- This is **NOT suitable for production**

## Next Steps (REQUIRED for Production)

You **MUST** migrate to a persistent database. Choose one:

### Option 1: Firebase Firestore (Recommended)
**Pros:**
- Already using Firebase for auth
- Real-time capabilities
- Easy integration
- Free tier available

**Steps:**
1. Update resolvers to use Firestore instead of SQLite
2. Remove `database.vercel.js` dependency
3. Use Firebase Admin SDK for all data operations

### Option 2: Vercel Postgres
**Pros:**
- Native Vercel integration
- Automatic connection pooling
- Easy setup via dashboard

**Steps:**
1. Enable Vercel Postgres in dashboard
2. Install `@vercel/postgres` package
3. Update `database.vercel.js` to use Postgres
4. Migrate schema to PostgreSQL

### Option 3: External PostgreSQL
**Pros:**
- More control
- Can use free tier (Supabase, Railway, Neon)

**Steps:**
1. Create PostgreSQL database
2. Install `pg` package
3. Update connection string in environment variables
4. Migrate schema

## Testing the Fix

1. **Redeploy to Vercel:**
   ```bash
   vercel --prod
   ```

2. **Test the GraphQL endpoint:**
   ```bash
   curl https://your-api.vercel.app/graphql \
     -H "Content-Type: application/json" \
     -d '{"query":"{ __schema { types { name } } }"}'
   ```

3. **Check function logs:**
   - Go to Vercel Dashboard → Deployments → Select deployment → View Function Logs
   - Look for: "In-memory SQLite database initialized (Vercel mode)"

## Temporary Workaround for Testing

If you just want to test the API structure without data persistence:

1. The current setup will work
2. Each request will have an empty database
3. You can create test data in each request
4. **Do NOT use this for production!**

## Migration Priority

**HIGH PRIORITY** - Migrate to persistent database ASAP because:
- Current setup loses all data between requests
- Not suitable for any real usage
- Could cause confusion during testing

## Resources

- [Firestore Migration Guide](https://firebase.google.com/docs/firestore/quickstart)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [PostgreSQL Migration Guide](../VERCEL-DEPLOYMENT.md#database-migration)

---

**Status**: Function should now run without crashing, but requires database migration for production use.
