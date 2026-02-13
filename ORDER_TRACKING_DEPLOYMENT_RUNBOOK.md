# Order Tracking Fix - Deployment Runbook

## Overview

This runbook provides step-by-step instructions for deploying the Order Tracking fix to production. The fix addresses the critical bug where the ChopChop order tracking page fails to retrieve orders.

**Deployment Date**: TBD  
**Deployment Window**: 2-hour window during low-traffic period  
**Rollback Time**: < 15 minutes if issues detected  
**Expected Downtime**: None (zero-downtime deployment)

## Pre-Deployment Checklist

### Code Review and Testing

- [ ] All code changes reviewed and approved
- [ ] Unit tests passing (100% of required tests)
- [ ] Integration tests passing
- [ ] Manual testing completed in staging
- [ ] Performance benchmarks met (< 200ms average response time)
- [ ] Security review completed
- [ ] Documentation updated

### Environment Preparation

- [ ] Staging environment matches production configuration
- [ ] Database indexes created in staging
- [ ] Database indexes verified in staging
- [ ] Staging deployment successful
- [ ] Staging smoke tests passed

### Team Coordination

- [ ] Deployment scheduled with team
- [ ] On-call engineer identified and available
- [ ] Stakeholders notified of deployment window
- [ ] Rollback plan reviewed with team
- [ ] Monitoring dashboards prepared
- [ ] Communication channels ready (Slack, email)

### Backup and Rollback Preparation

- [ ] Current production code tagged in Git
- [ ] Database backup completed
- [ ] Rollback procedure documented and tested
- [ ] Previous deployment artifacts available
- [ ] Vercel deployment history reviewed

## Deployment Steps

### Phase 1: Database Migration (15 minutes)

**Objective**: Add indexes to orders table for optimal query performance

#### Step 1.1: Connect to Supabase Dashboard

1. Navigate to [Supabase Dashboard](https://app.supabase.com)
2. Select the production project
3. Go to SQL Editor

#### Step 1.2: Apply Index Migration

1. Open the migration file: `api/migrations/add-order-tracking-indexes.sql`
2. Copy the SQL content
3. Paste into Supabase SQL Editor
4. Review the SQL statements:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
   CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
   CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
   ```
5. Click "Run" to execute
6. Verify success message

#### Step 1.3: Verify Indexes Created

Run verification query:
```sql
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'orders'
ORDER BY indexname;
```

Expected output should include:
- `idx_orders_order_id`
- `idx_orders_user_id`
- `idx_orders_status`

**Checkpoint**: ✅ Indexes created successfully

### Phase 2: API Deployment (30 minutes)

**Objective**: Deploy enhanced database helper and GraphQL resolver

#### Step 2.1: Prepare API Deployment

1. Ensure you're on the correct branch:
   ```bash
   cd api
   git status
   git log -1  # Verify latest commit
   ```

2. Verify environment variables in Vercel:
   ```bash
   vercel env ls --scope=your-team
   ```

3. Required environment variables:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

#### Step 2.2: Deploy to Production

1. Deploy API to Vercel:
   ```bash
   cd api
   vercel --prod
   ```

2. Wait for deployment to complete
3. Note the deployment URL
4. Verify deployment status in Vercel dashboard

#### Step 2.3: Verify API Deployment

1. Check API health endpoint:
   ```bash
   curl https://your-api-url.vercel.app/health
   ```

2. Test GraphQL endpoint:
   ```bash
   curl -X POST https://your-api-url.vercel.app/graphql \
     -H "Content-Type: application/json" \
     -d '{"query": "{ __schema { queryType { name } } }"}'
   ```

3. Expected response: `{"data":{"__schema":{"queryType":{"name":"Query"}}}}`

**Checkpoint**: ✅ API deployed and responding

### Phase 3: Frontend Deployment (30 minutes)

**Objective**: Deploy updated ChopChop with error handling components

#### Step 3.1: Prepare ChopChop Deployment

1. Ensure you're on the correct branch:
   ```bash
   cd ChopChop
   git status
   git log -1  # Verify latest commit
   ```

2. Verify environment variables in Vercel:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_GRAPHQL_URI` (should point to production API)

#### Step 3.2: Deploy to Production

1. Deploy ChopChop to Vercel:
   ```bash
   cd ChopChop
   vercel --prod
   ```

2. Wait for deployment to complete
3. Note the deployment URL
4. Verify deployment status in Vercel dashboard

#### Step 3.3: Verify Frontend Deployment

1. Open ChopChop in browser: `https://chopchop.vercel.app`
2. Verify homepage loads correctly
3. Check browser console for errors
4. Verify API connection (check Network tab)

**Checkpoint**: ✅ ChopChop deployed and loading

### Phase 4: Smoke Testing (15 minutes)

**Objective**: Verify critical functionality works in production

#### Test 1: Order Tracking with Valid Order

1. Get a valid order ID from production database
2. Navigate to: `https://chopchop.vercel.app/order-details/[orderId]`
3. Verify order details display correctly
4. Check browser console for errors
5. Verify no GraphQL errors

**Expected Result**: Order details display with all information

#### Test 2: Order Tracking with Invalid Order

1. Navigate to: `https://chopchop.vercel.app/order-details/ORD-INVALID-123`
2. Verify error message displays: "We couldn't find this order..."
3. Verify retry button is present
4. Click retry button and verify it works

**Expected Result**: User-friendly error message with retry button

#### Test 3: Unauthorized Access

1. Get an order ID that belongs to a different user
2. Navigate to that order's tracking page
3. Verify error message: "You don't have permission to view this order."
4. Verify no retry button (security measure)

**Expected Result**: Permission denied message without retry button

#### Test 4: Performance Check

1. Use browser DevTools Network tab
2. Navigate to order tracking page
3. Measure API response time
4. Verify response time < 500ms

**Expected Result**: Fast response time (< 500ms)

#### Test 5: Logging Verification

1. Check Vercel logs for API
2. Verify correlation IDs are present
3. Verify detailed logging for each request
4. Check for any unexpected errors

**Expected Result**: Comprehensive logging with correlation IDs

**Checkpoint**: ✅ All smoke tests passed

### Phase 5: Monitoring Setup (10 minutes)

**Objective**: Ensure monitoring and alerting are active

#### Step 5.1: Verify Monitoring Dashboards

1. Open monitoring dashboard (if configured)
2. Verify metrics are being collected
3. Check that data is flowing from production

#### Step 5.2: Test Alerts

1. Verify alert rules are active
2. Check alert notification channels (email, Slack)
3. Consider triggering a test alert (optional)

#### Step 5.3: Review Initial Metrics

1. Check error rate (should be < 1%)
2. Check response time (should be < 200ms average)
3. Verify request volume is normal
4. Check for any anomalies

**Checkpoint**: ✅ Monitoring active and collecting data

## Post-Deployment Verification (30 minutes)

### Immediate Verification (First 15 minutes)

- [ ] Monitor error rate (target: < 1%)
- [ ] Monitor response time (target: < 200ms average)
- [ ] Check for any critical errors in logs
- [ ] Verify no increase in 500 errors
- [ ] Check user feedback channels for issues

### Extended Verification (Next 15 minutes)

- [ ] Test order tracking with multiple order IDs
- [ ] Verify backward compatibility with old orders
- [ ] Check database query performance
- [ ] Verify indexes are being used
- [ ] Monitor for any security alerts

### Success Criteria

Deployment is successful if:
- ✅ Error rate < 1%
- ✅ Average response time < 200ms
- ✅ No critical errors in logs
- ✅ All smoke tests passed
- ✅ No user-reported issues
- ✅ Monitoring dashboards show healthy metrics

## Rollback Procedure

**Trigger Rollback If**:
- Error rate > 5% for 5 consecutive minutes
- Critical functionality broken
- Security vulnerability discovered
- Database performance severely degraded

### Rollback Steps

#### Step 1: Immediate Rollback (< 5 minutes)

1. **Rollback Frontend (ChopChop)**:
   ```bash
   cd ChopChop
   vercel ls  # List recent deployments
   vercel promote [previous-deployment-url] --scope=your-team
   ```

2. **Rollback API**:
   ```bash
   cd api
   vercel ls  # List recent deployments
   vercel promote [previous-deployment-url] --scope=your-team
   ```

3. **Verify Rollback**:
   - Check that previous version is live
   - Test critical functionality
   - Monitor error rate

#### Step 2: Database Rollback (if needed)

**Note**: Only rollback database if indexes cause issues

1. Connect to Supabase SQL Editor
2. Run rollback SQL:
   ```sql
   DROP INDEX IF EXISTS idx_orders_order_id;
   DROP INDEX IF EXISTS idx_orders_user_id;
   DROP INDEX IF EXISTS idx_orders_status;
   ```

3. Verify indexes removed:
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'orders';
   ```

#### Step 3: Communication

1. Notify team in incident channel
2. Update stakeholders
3. Post status update if user-facing
4. Document rollback reason

#### Step 4: Post-Rollback

1. Investigate root cause
2. Fix issues in development
3. Re-test in staging
4. Schedule new deployment

**Checkpoint**: ✅ Rollback completed, system stable

## Troubleshooting Guide

### Issue 1: High Error Rate After Deployment

**Symptoms**:
- Error rate > 5%
- Many INTERNAL_ERROR responses

**Diagnosis**:
1. Check API logs for error patterns
2. Verify database connectivity
3. Check environment variables
4. Review recent code changes

**Resolution**:
1. If database issue: Check connection pool, restart if needed
2. If code issue: Rollback deployment
3. If config issue: Fix environment variables and redeploy

### Issue 2: Slow Response Times

**Symptoms**:
- Response time > 1000ms
- Timeout errors

**Diagnosis**:
1. Check database query performance
2. Verify indexes are being used
3. Check database connection pool
4. Review slow query logs

**Resolution**:
1. Verify indexes created correctly
2. Check database load
3. Scale database if needed
4. Optimize queries if needed

### Issue 3: Orders Not Found

**Symptoms**:
- High ORDER_NOT_FOUND rate
- Valid orders returning not found

**Diagnosis**:
1. Check database for orders
2. Verify order_id format
3. Check database helper logic
4. Review logs for correlation IDs

**Resolution**:
1. Verify database migration applied
2. Check order ID generation
3. Test with known order IDs
4. Review database helper code

### Issue 4: Authentication Errors

**Symptoms**:
- High UNAUTHENTICATED rate
- Users can't access their orders

**Diagnosis**:
1. Check Firebase Auth configuration
2. Verify token validation
3. Check CORS settings
4. Review authentication middleware

**Resolution**:
1. Verify Firebase credentials
2. Check token expiration
3. Update CORS if needed
4. Test authentication flow

## Communication Templates

### Deployment Start Notification

```
📢 Deployment Starting: Order Tracking Fix

Deployment Window: [start_time] - [end_time]
Expected Duration: 2 hours
Expected Downtime: None

Components:
- API (database helper, GraphQL resolver)
- ChopChop (error handling, order tracking page)
- Database (indexes)

Status Updates: Every 30 minutes
Contact: [on-call-engineer]
```

### Deployment Success Notification

```
✅ Deployment Complete: Order Tracking Fix

Status: Successful
Completion Time: [completion_time]
Duration: [actual_duration]

Verification:
✅ All smoke tests passed
✅ Error rate: [error_rate]% (target: <1%)
✅ Response time: [avg_time]ms (target: <200ms)
✅ No critical errors

Monitoring: [dashboard_url]
Documentation: [docs_url]
```

### Deployment Issue Notification

```
⚠️ Deployment Issue: Order Tracking Fix

Status: Investigating
Issue: [brief_description]
Impact: [user_impact]
Started: [issue_start_time]

Actions Taken:
- [action_1]
- [action_2]

Next Steps:
- [next_step_1]
- [next_step_2]

ETA for Resolution: [eta]
Contact: [on-call-engineer]
```

### Rollback Notification

```
🔄 Rollback Initiated: Order Tracking Fix

Reason: [rollback_reason]
Started: [rollback_start_time]
Expected Completion: [eta]

Components Being Rolled Back:
- API
- ChopChop
- Database (if needed)

Status Updates: Every 15 minutes
Contact: [on-call-engineer]
```

## Post-Deployment Tasks

### Immediate (Within 24 hours)

- [ ] Monitor metrics for 24 hours
- [ ] Review all error logs
- [ ] Check user feedback
- [ ] Verify performance targets met
- [ ] Document any issues encountered

### Short-term (Within 1 week)

- [ ] Analyze performance data
- [ ] Review monitoring alerts
- [ ] Update documentation if needed
- [ ] Share deployment learnings with team
- [ ] Plan any follow-up improvements

### Long-term (Within 1 month)

- [ ] Comprehensive performance analysis
- [ ] User satisfaction survey
- [ ] Identify optimization opportunities
- [ ] Update deployment procedures based on learnings

## Related Documentation

- [Order Tracking API Documentation](./ORDER_TRACKING_API_DOCUMENTATION.md)
- [Monitoring and Alerting Guide](./ORDER_TRACKING_MONITORING_GUIDE.md)
- [Requirements Document](../.kiro/specs/chopchop-order-tracking-fix/requirements.md)
- [Design Document](../.kiro/specs/chopchop-order-tracking-fix/design.md)

## Deployment History

| Date | Version | Deployer | Status | Notes |
|------|---------|----------|--------|-------|
| TBD | 1.0.0 | TBD | Pending | Initial deployment |

---

**Last Updated**: February 10, 2026  
**Version**: 1.0.0  
**Status**: Ready for Deployment
