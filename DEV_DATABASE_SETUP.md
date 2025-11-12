# Setting Up Govern to Point to Dev Database

This setup matches the LEARN project's database configuration pattern.

## Quick Setup

### 1. Create `.env` file

In the `govern` project root, create a `.env` file:

```bash
cd /Users/naresh/staysecure-projects/govern
```

### 2. Add Dev Database Credentials

Edit `.env` and add your dev database credentials:

**Option A: Single Client (Dev Mode) - Recommended for development**

Govern uses the same database as LEARN (`cleqfnrbiqpxpzxkatda.supabase.co`):

```env
VITE_SUPABASE_URL=https://cleqfnrbiqpxpzxkatda.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find the anon key:**
- Go to Supabase project: https://cleqfnrbiqpxpzxkatda.supabase.co
- Navigate to **Settings → API**
- Copy the **anon/public key**

**Option B: Multi-Client Configuration (Production-like)**

```env
VITE_CLIENT_CONFIGS='{"default":{"clientId":"default","supabaseUrl":"https://cleqfnrbiqpxpzxkatda.supabase.co","supabaseAnonKey":"your-anon-key","displayName":"Dev (Shared with LEARN)"},"prod":{"clientId":"prod","supabaseUrl":"https://prod-project.supabase.co","supabaseAnonKey":"prod-key","displayName":"Production"}}'
```

**Note**: Govern shares the database with LEARN (`cleqfnrbiqpxpzxkatda.supabase.co`). Use the same anon key as LEARN.

### 3. Restart Dev Server

After creating/updating `.env`, restart your dev server:

```bash
npm run dev
```

Vite will automatically load environment variables from `.env` on startup.

---

## How It Works

The Supabase client uses the same pattern as LEARN:

1. **Multi-Client Mode**: If `VITE_CLIENT_CONFIGS` is set (JSON string), uses path-based client routing (e.g., `/dev/...` vs `/prod/...`)
2. **Single-Client Mode**: If `VITE_SUPABASE_URL` is set, creates a default client for development
3. **Fallback**: If neither is set, throws an error (no hardcoded production values)

The client configuration is in:
- `src/config/clients.ts` - Parses environment variables
- `src/integrations/supabase/client.ts` - Creates and manages Supabase clients

---

## Environment Variable Names

The client supports these environment variable names:
- `VITE_SUPABASE_URL` (required for single-client mode)
- `VITE_SUPABASE_ANON_KEY` (preferred)
- `VITE_SUPABASE_PUB_KEY` (alternative)
- `VITE_SB_PUB_KEY` (alternative)
- `VITE_CLIENT_CONFIGS` (for multi-client mode - JSON string)

**Note**: Vite requires the `VITE_` prefix for environment variables to be exposed to the client-side code.

---

## Switching Between Environments

### Use Dev Database (Single-Client Mode)
```bash
# .env file exists with dev credentials (shared with LEARN)
VITE_SUPABASE_URL=https://cleqfnrbiqpxpzxkatda.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
npm run dev
```

### Use Multi-Client Mode
```bash
# .env file with VITE_CLIENT_CONFIGS
VITE_CLIENT_CONFIGS='{"default":{"clientId":"default","supabaseUrl":"https://cleqfnrbiqpxpzxkatda.supabase.co","supabaseAnonKey":"your-anon-key","displayName":"Dev (Shared with LEARN)"},"prod":{"clientId":"prod","supabaseUrl":"https://prod.supabase.co","supabaseAnonKey":"prod-key","displayName":"Production"}}'
npm run dev
```

Then access via:
- `/default/...` or `/` - Uses shared dev database (`cleqfnrbiqpxpzxkatda`)
- `/prod/...` - Uses production database

### Remove Environment Configuration
```bash
# Remove or rename .env file
mv .env .env.backup
npm run dev
```

**Note**: Without `.env`, the app will throw an error (no hardcoded fallback to production).

---

## Verification

To verify which database you're connected to:

1. **Check the browser console** - Supabase client logs the project URL
2. **Check network requests** - Look for requests to your Supabase project URL
3. **Test with dev data** - Try creating a test record and verify it appears in dev database

---

## Troubleshooting

### Environment variables not loading?

1. **Make sure `.env` is in project root** (same directory as `package.json`)
2. **Restart dev server** after creating/updating `.env`
3. **Check variable names** - must start with `VITE_`
4. **No spaces around `=`** in `.env` file:
   ```env
   # ✅ Correct
   VITE_SUPABASE_URL=https://...
   
   # ❌ Wrong
   VITE_SUPABASE_URL = https://...
   ```

### Still using production database?

- Check that `.env` file exists and has correct values
- Verify no typos in variable names
- Restart dev server completely (stop and start again)

---

## Security Notes

⚠️ **Never commit `.env` to git!**

The `.env` file should already be in `.gitignore`. Verify:

```bash
grep -q "\.env" .gitignore && echo "✅ .env is ignored" || echo "❌ Add .env to .gitignore"
```

Use `.env.example` (committed) as a template for other developers.

