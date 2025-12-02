# Vercel Deployment Guide for Food Delivery API

This guide explains how to deploy the Food Delivery API to Vercel as a serverless function.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional): Install with `npm i -g vercel`
3. **Environment Variables**: Prepare all required environment variables

## Required Environment Variables

You'll need to configure these in your Vercel project settings:

### Firebase Configuration
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_DATABASE_URL=your-database-url
```

### API Keys
```
IMGBB_API_KEY=your-imgbb-api-key
DELIVERMI_WEBHOOK_API_KEY=your-webhook-key
CHOPCHOP_WEBHOOK_API_KEY=your-webhook-key
```

### Application URLs
```
DELIVERMI_URL=https://your-delivermi-app.vercel.app
MENUVERSE_URL=https://your-menuverse-app.vercel.app
CHOPCHOP_URL=https://your-chopchop-app.vercel.app
```

### Other
```
NODE_ENV=production
PORT=4000
```

## Deployment Methods

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect Repository**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - Select the `api` folder as the root directory

2. **Configure Project**:
   - Framework Preset: **Other**
   - Build Command: `npm run build`
   - Output Directory: Leave empty (serverless function)
   - Install Command: `npm install`

3. **Add Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add all required variables listed above
   - Make sure to add them for **Production**, **Preview**, and **Development** environments

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your API

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy from API directory**:
```bash
cd api
vercel
```

4. **Follow the prompts**:
   - Set up and deploy: **Y**
   - Which scope: Select your account
   - Link to existing project: **N** (first time)
   - Project name: `food-delivery-api` (or your preferred name)
   - In which directory is your code located: `./`

5. **Add Environment Variables**:
```bash
vercel env add FIREBASE_PROJECT_ID
vercel env add FIREBASE_PRIVATE_KEY
vercel env add FIREBASE_CLIENT_EMAIL
# ... add all other variables
```

6. **Deploy to Production**:
```bash
vercel --prod
```

## Important Notes

### Database Considerations

⚠️ **SQLite Limitation**: Vercel serverless functions are stateless and ephemeral. The SQLite database (`food-delivery.db`) will NOT persist between deployments or function invocations.

**Solutions**:

1. **Migrate to PostgreSQL** (Recommended):
   - Use Vercel Postgres or external PostgreSQL service
   - Update `database.js` to use PostgreSQL instead of SQLite

2. **Use Vercel KV** (for simple key-value storage):
   - Good for caching and session data
   - Not suitable for complex relational data

3. **Use Firebase Firestore**:
   - You're already using Firebase for auth
   - Can store all data in Firestore
   - Update resolvers to use Firestore instead of SQLite

### File Uploads

The current implementation uses in-memory file handling which works with Vercel. However, ensure:
- Files are uploaded to external storage (imgbb) - ✅ Already implemented
- No local file system writes for permanent storage

### Cold Starts

Serverless functions may experience cold starts (slower first request). To minimize:
- Keep dependencies minimal
- Use Vercel's Edge Functions for critical paths (optional)
- Consider keeping functions "warm" with periodic pings

## Post-Deployment

### 1. Test Your Deployment

```bash
# Test GraphQL endpoint
curl https://your-api.vercel.app/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name } } }"}'
```

### 2. Update Client Applications

Update the API URL in your client apps:
- **ChopChop**: Update `NEXT_PUBLIC_API_URL`
- **MenuVerse**: Update `NEXT_PUBLIC_API_URL`
- **DeliverMi**: Update `NEXT_PUBLIC_API_URL`

### 3. Configure CORS (if needed)

If you encounter CORS issues, add this to `index.js`:

```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    return res.status(200).json({});
  }
  next();
});
```

## Monitoring & Logs

- **View Logs**: Go to your project dashboard → Deployments → Select deployment → View Function Logs
- **Monitor Performance**: Vercel Analytics (available in project settings)
- **Error Tracking**: Consider integrating Sentry or similar service

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json` (not devDependencies)
3. Verify Node.js version compatibility

### Function Timeout

Vercel has a 10-second timeout for Hobby plan, 60 seconds for Pro:
- Optimize slow database queries
- Consider upgrading to Pro plan if needed

### Environment Variables Not Working

1. Ensure variables are set for the correct environment (Production/Preview/Development)
2. Redeploy after adding new variables
3. Check variable names match exactly (case-sensitive)

### Database Issues

If you see database errors:
1. Remember SQLite doesn't persist on Vercel
2. Migrate to PostgreSQL or Firestore
3. See "Database Considerations" section above

## Recommended Next Steps

1. **Migrate to PostgreSQL**: For production-ready persistence
2. **Set up CI/CD**: Automatic deployments on git push
3. **Add Monitoring**: Integrate error tracking and performance monitoring
4. **Configure Custom Domain**: Add your custom domain in Vercel settings
5. **Enable Vercel Analytics**: Track API usage and performance

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Node.js Runtime](https://vercel.com/docs/runtimes#official-runtimes/node-js)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)

## Support

For issues specific to this deployment:
1. Check Vercel function logs
2. Review this guide's troubleshooting section
3. Consult the main API documentation in `README.md`
