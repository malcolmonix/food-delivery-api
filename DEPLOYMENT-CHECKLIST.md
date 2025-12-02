# Vercel Deployment Checklist

Use this checklist to ensure a smooth deployment to Vercel.

## Pre-Deployment

- [ ] **Review Environment Variables**
  - [ ] Copy `.env.vercel.template` and fill in actual values
  - [ ] Verify Firebase credentials are correct
  - [ ] Generate secure webhook API keys
  - [ ] Confirm imgbb API key is valid

- [ ] **Database Migration Plan**
  - [ ] ⚠️ **CRITICAL**: SQLite will NOT work on Vercel
  - [ ] Choose migration path:
    - [ ] Option 1: Migrate to Vercel Postgres
    - [ ] Option 2: Migrate to Firebase Firestore
    - [ ] Option 3: Use external PostgreSQL (Supabase, Railway, etc.)
  - [ ] Update `database.js` for chosen database
  - [ ] Test database connection locally

- [ ] **Code Review**
  - [ ] Ensure no hardcoded secrets in code
  - [ ] Verify all file uploads go to external storage (imgbb)
  - [ ] Check for any local file system writes
  - [ ] Review CORS configuration

## Deployment Steps

- [ ] **Initial Setup**
  - [ ] Create Vercel account
  - [ ] Install Vercel CLI (optional): `npm i -g vercel`
  - [ ] Connect Git repository to Vercel

- [ ] **Configure Project**
  - [ ] Set root directory to `api`
  - [ ] Framework Preset: Other
  - [ ] Build Command: `npm run build`
  - [ ] Install Command: `npm install`

- [ ] **Environment Variables**
  - [ ] Add all variables from `.env.vercel.template`
  - [ ] Set for Production environment
  - [ ] Set for Preview environment
  - [ ] Set for Development environment

- [ ] **Deploy**
  - [ ] Trigger deployment (via dashboard or CLI)
  - [ ] Monitor build logs for errors
  - [ ] Wait for deployment to complete

## Post-Deployment

- [ ] **Testing**
  - [ ] Test GraphQL endpoint: `https://your-api.vercel.app/graphql`
  - [ ] Test authentication with Firebase token
  - [ ] Test file upload mutation
  - [ ] Test webhook endpoints:
    - [ ] `/notify-ready`
    - [ ] `/order-driver/:orderId`
    - [ ] `/api/webhooks/rider-location-update`

- [ ] **Update Client Apps**
  - [ ] Update `NEXT_PUBLIC_API_URL` in ChopChop
  - [ ] Update `NEXT_PUBLIC_API_URL` in MenuVerse
  - [ ] Update `NEXT_PUBLIC_API_URL` in DeliverMi
  - [ ] Redeploy all client applications

- [ ] **Monitoring Setup**
  - [ ] Enable Vercel Analytics
  - [ ] Set up error tracking (Sentry, etc.)
  - [ ] Configure uptime monitoring
  - [ ] Set up log aggregation

- [ ] **Performance**
  - [ ] Test cold start times
  - [ ] Verify function timeout limits
  - [ ] Check response times
  - [ ] Monitor function execution logs

## Production Readiness

- [ ] **Security**
  - [ ] Verify all API keys are in environment variables
  - [ ] Test authentication middleware
  - [ ] Review CORS configuration
  - [ ] Enable rate limiting (if needed)

- [ ] **Domain & SSL**
  - [ ] Add custom domain (optional)
  - [ ] Verify SSL certificate
  - [ ] Update DNS records

- [ ] **Documentation**
  - [ ] Update README with production API URL
  - [ ] Document deployment process for team
  - [ ] Create runbook for common issues

- [ ] **Backup & Recovery**
  - [ ] Set up database backups
  - [ ] Document rollback procedure
  - [ ] Test disaster recovery plan

## Common Issues

### Build Fails
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure Node.js version compatibility

### Function Timeout
- Optimize database queries
- Consider upgrading Vercel plan
- Review function execution time in logs

### Database Errors
- Confirm database migration is complete
- Test database connection
- Check environment variables

### CORS Errors
- Add CORS middleware to `index.js`
- Verify allowed origins
- Check preflight requests

## Resources

- [VERCEL-DEPLOYMENT.md](./VERCEL-DEPLOYMENT.md) - Full deployment guide
- [.env.vercel.template](./.env.vercel.template) - Environment variables template
- [Vercel Documentation](https://vercel.com/docs)

## Notes

- **Database**: Remember to migrate from SQLite before deploying
- **Cold Starts**: First request may be slower
- **Timeouts**: Hobby plan = 10s, Pro plan = 60s
- **Logs**: Available in Vercel dashboard under Deployments

---

**Last Updated**: 2025-12-02
