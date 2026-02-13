# Order Tracking Monitoring and Alerting Guide

## Overview

This document outlines the monitoring strategy, key metrics, alerting thresholds, and dashboard configuration for the Order Tracking API. Proper monitoring ensures high availability, performance, and security.

## Key Performance Indicators (KPIs)

### 1. Error Rate

**Metric**: Percentage of failed order tracking requests  
**Target**: < 1%  
**Alert Threshold**: > 1% over 5-minute window  
**Severity**: High

**Calculation**:
```
Error Rate = (Failed Requests / Total Requests) × 100
```

**Failed Request Criteria**:
- HTTP 500 errors (INTERNAL_ERROR)
- Database connection failures
- Timeout errors
- Unhandled exceptions

**Monitoring Query** (Supabase/PostgreSQL):
```sql
SELECT 
  DATE_TRUNC('minute', created_at) as minute,
  COUNT(*) FILTER (WHERE severity = 'error') as errors,
  COUNT(*) as total,
  (COUNT(*) FILTER (WHERE severity = 'error')::float / COUNT(*) * 100) as error_rate
FROM error_logs
WHERE 
  app_name = 'api'
  AND feature = 'orderTracking'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY minute
ORDER BY minute DESC;
```

### 2. Response Time

**Metric**: Time to complete order tracking query  
**Target**: < 200ms average, < 500ms 95th percentile  
**Alert Threshold**: > 500ms average over 5-minute window  
**Severity**: Medium

**Monitoring Points**:
- Database query execution time
- GraphQL resolver execution time
- End-to-end API response time

**Log Pattern**:
```
[DB:{correlationId}] Query performance: {executionTime}ms (target: <500ms for 95th percentile)
```

**Monitoring Query** (from logs):
```javascript
// Parse logs and calculate percentiles
const responseTimes = logs
  .filter(log => log.message.includes('Query performance'))
  .map(log => extractExecutionTime(log.message));

const p50 = percentile(responseTimes, 50);
const p95 = percentile(responseTimes, 95);
const p99 = percentile(responseTimes, 99);
const avg = average(responseTimes);
```

### 3. Unauthorized Access Attempts

**Metric**: Number of FORBIDDEN errors  
**Target**: Monitor for patterns  
**Alert Threshold**: > 10 attempts from same user in 5 minutes  
**Severity**: High (potential security issue)

**Monitoring Query**:
```sql
SELECT 
  user_id,
  COUNT(*) as attempts,
  ARRAY_AGG(DISTINCT order_id) as attempted_orders
FROM error_logs
WHERE 
  app_name = 'api'
  AND feature = 'orderTracking'
  AND error_code = 'FORBIDDEN'
  AND created_at > NOW() - INTERVAL '5 minutes'
GROUP BY user_id
HAVING COUNT(*) > 10
ORDER BY attempts DESC;
```

### 4. Order Not Found Rate

**Metric**: Percentage of ORDER_NOT_FOUND errors  
**Target**: < 5% (some invalid IDs expected from user typos)  
**Alert Threshold**: > 10% over 15-minute window  
**Severity**: Medium (may indicate URL generation issue)

**Monitoring Query**:
```sql
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) FILTER (WHERE error_code = 'ORDER_NOT_FOUND') as not_found,
  COUNT(*) as total,
  (COUNT(*) FILTER (WHERE error_code = 'ORDER_NOT_FOUND')::float / COUNT(*) * 100) as not_found_rate
FROM error_logs
WHERE 
  app_name = 'api'
  AND feature = 'orderTracking'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

## Alert Configuration

### Alert 1: High Error Rate

**Condition**: Error rate > 1% for 5 consecutive minutes  
**Severity**: High  
**Notification**: Email + Slack + SMS (on-call engineer)  
**Action**: Immediate investigation required

**Alert Message**:
```
🚨 HIGH ERROR RATE: Order Tracking API
Error Rate: {error_rate}% (threshold: 1%)
Time Window: {start_time} to {end_time}
Total Requests: {total_requests}
Failed Requests: {failed_requests}
Dashboard: {dashboard_url}
Logs: {logs_url}
```

**Investigation Steps**:
1. Check API server health and logs
2. Verify database connectivity
3. Check for recent deployments
4. Review error logs for patterns
5. Check external dependencies (Firebase, Supabase)

### Alert 2: Slow Response Time

**Condition**: Average response time > 500ms for 5 consecutive minutes  
**Severity**: Medium  
**Notification**: Email + Slack  
**Action**: Investigation within 30 minutes

**Alert Message**:
```
⚠️ SLOW RESPONSE TIME: Order Tracking API
Average Response Time: {avg_time}ms (threshold: 500ms)
95th Percentile: {p95_time}ms
Time Window: {start_time} to {end_time}
Total Requests: {total_requests}
Dashboard: {dashboard_url}
```

**Investigation Steps**:
1. Check database query performance
2. Review slow query logs
3. Verify database indexes are being used
4. Check database connection pool status
5. Review recent code changes

### Alert 3: Suspicious Access Pattern

**Condition**: > 10 FORBIDDEN errors from same user in 5 minutes  
**Severity**: High  
**Notification**: Email + Slack (security team)  
**Action**: Security review required

**Alert Message**:
```
🔒 SUSPICIOUS ACCESS PATTERN: Order Tracking API
User ID: {user_id}
Attempts: {attempt_count}
Attempted Orders: {order_ids}
Time Window: {start_time} to {end_time}
User Details: {user_details_url}
Logs: {logs_url}
```

**Investigation Steps**:
1. Review user account for suspicious activity
2. Check if orders belong to related accounts
3. Review user's recent activity across platform
4. Consider temporary account suspension if malicious
5. Update security rules if vulnerability found

### Alert 4: High Not Found Rate

**Condition**: ORDER_NOT_FOUND rate > 10% for 15 consecutive minutes  
**Severity**: Medium  
**Notification**: Email + Slack  
**Action**: Investigation within 1 hour

**Alert Message**:
```
⚠️ HIGH NOT FOUND RATE: Order Tracking API
Not Found Rate: {not_found_rate}% (threshold: 10%)
Time Window: {start_time} to {end_time}
Total Requests: {total_requests}
Not Found: {not_found_count}
Dashboard: {dashboard_url}
```

**Investigation Steps**:
1. Check if order ID generation is working correctly
2. Verify order confirmation emails have correct URLs
3. Review recent changes to order creation flow
4. Check for database synchronization issues
5. Analyze sample of not-found order IDs for patterns

## Dashboard Configuration

### Dashboard 1: Order Tracking Overview

**Refresh Rate**: 30 seconds  
**Time Range**: Last 24 hours (configurable)

**Panels**:

1. **Request Volume** (Line Chart)
   - Total requests per minute
   - Color: Blue
   - Y-axis: Request count
   - X-axis: Time

2. **Error Rate** (Line Chart with Threshold)
   - Error rate percentage per minute
   - Color: Red when > 1%, Yellow when > 0.5%, Green otherwise
   - Threshold line at 1%
   - Y-axis: Percentage (0-100%)
   - X-axis: Time

3. **Response Time Distribution** (Line Chart)
   - Average, P50, P95, P99 response times
   - Colors: Green (avg), Blue (P50), Orange (P95), Red (P99)
   - Threshold line at 500ms
   - Y-axis: Milliseconds
   - X-axis: Time

4. **Error Breakdown** (Pie Chart)
   - Distribution of error types
   - Segments: ORDER_NOT_FOUND, FORBIDDEN, UNAUTHENTICATED, INTERNAL_ERROR
   - Show percentage and count

5. **Top Errors** (Table)
   - Columns: Error Code, Count, Last Occurrence, Sample Message
   - Sort by count descending
   - Limit: 10 rows

6. **Recent Requests** (Table)
   - Columns: Timestamp, User ID, Order ID, Status, Response Time
   - Sort by timestamp descending
   - Limit: 20 rows
   - Color code by status (green=success, red=error)

### Dashboard 2: Performance Metrics

**Refresh Rate**: 1 minute  
**Time Range**: Last 1 hour (configurable)

**Panels**:

1. **Database Query Performance** (Line Chart)
   - Primary lookup time
   - Fallback lookup time
   - Average query time
   - Y-axis: Milliseconds
   - X-axis: Time

2. **Lookup Strategy Distribution** (Pie Chart)
   - Primary strategy success
   - Fallback strategy success
   - Both strategies failed
   - Show percentage and count

3. **Slowest Queries** (Table)
   - Columns: Correlation ID, Order ID, Execution Time, Strategy Used
   - Sort by execution time descending
   - Limit: 10 rows

4. **Database Connection Pool** (Gauge)
   - Active connections
   - Idle connections
   - Max connections
   - Color: Green (< 70%), Yellow (70-90%), Red (> 90%)

### Dashboard 3: Security Monitoring

**Refresh Rate**: 1 minute  
**Time Range**: Last 24 hours (configurable)

**Panels**:

1. **Unauthorized Access Attempts** (Line Chart)
   - FORBIDDEN errors per hour
   - UNAUTHENTICATED errors per hour
   - Y-axis: Count
   - X-axis: Time

2. **Top Unauthorized Users** (Table)
   - Columns: User ID, Attempt Count, Unique Orders Attempted, Last Attempt
   - Sort by attempt count descending
   - Limit: 10 rows

3. **Access Pattern Heatmap** (Heatmap)
   - X-axis: Hour of day
   - Y-axis: Day of week
   - Color intensity: Number of unauthorized attempts

4. **Recent Security Events** (Table)
   - Columns: Timestamp, User ID, Order ID, Error Code, IP Address
   - Sort by timestamp descending
   - Limit: 20 rows
   - Filter: FORBIDDEN and UNAUTHENTICATED only

## Monitoring Tools Integration

### Vercel Analytics

**Setup**:
1. Enable Vercel Analytics in project settings
2. Add `@vercel/analytics` package to API
3. Track custom events for order tracking

**Custom Events**:
```javascript
import { track } from '@vercel/analytics';

// Track successful order tracking
track('order_tracking_success', {
  orderId: order.orderId,
  responseTime: executionTime,
  strategy: 'primary' // or 'fallback'
});

// Track order tracking errors
track('order_tracking_error', {
  orderId: orderId,
  errorCode: error.extensions?.code,
  responseTime: executionTime
});
```

### Supabase Monitoring

**Setup**:
1. Use Supabase Dashboard > Database > Query Performance
2. Monitor slow queries (> 500ms)
3. Check index usage

**Queries to Monitor**:
```sql
-- Check if indexes are being used
EXPLAIN ANALYZE
SELECT * FROM orders WHERE order_id = 'ORD-1707577845000-abc123';

-- Find slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE query LIKE '%orders%'
ORDER BY mean_time DESC
LIMIT 10;
```

### Custom Logging Dashboard

**Setup**:
1. Parse API logs for correlation IDs
2. Extract metrics from log messages
3. Store in time-series database or use log aggregation service

**Log Parsing Pattern**:
```javascript
const logPattern = /\[(?:Resolver|DB):(\d+-\w+)\] (.+)/;
const performancePattern = /Query performance: (\d+)ms/;
const errorPattern = /ERROR in orderTracking: (.+)/;

// Extract metrics from logs
function parseLog(logLine) {
  const match = logLine.match(logPattern);
  if (!match) return null;
  
  const [, correlationId, message] = match;
  
  // Extract performance metrics
  const perfMatch = message.match(performancePattern);
  if (perfMatch) {
    return {
      type: 'performance',
      correlationId,
      executionTime: parseInt(perfMatch[1])
    };
  }
  
  // Extract errors
  const errorMatch = message.match(errorPattern);
  if (errorMatch) {
    return {
      type: 'error',
      correlationId,
      error: errorMatch[1]
    };
  }
  
  return { type: 'info', correlationId, message };
}
```

## Incident Response Procedures

### Procedure 1: High Error Rate

1. **Acknowledge Alert** (< 2 minutes)
   - Acknowledge in monitoring system
   - Post in incident channel

2. **Initial Assessment** (< 5 minutes)
   - Check API server status
   - Review recent deployments
   - Check database connectivity
   - Review error logs

3. **Mitigation** (< 15 minutes)
   - If recent deployment: Consider rollback
   - If database issue: Check connection pool, restart if needed
   - If external service: Check Firebase/Supabase status

4. **Resolution** (< 30 minutes)
   - Fix root cause
   - Deploy fix if needed
   - Verify error rate returns to normal

5. **Post-Incident** (< 24 hours)
   - Write incident report
   - Identify preventive measures
   - Update monitoring/alerting if needed

### Procedure 2: Performance Degradation

1. **Acknowledge Alert** (< 5 minutes)
2. **Check Database Performance** (< 10 minutes)
   - Review slow query logs
   - Check index usage
   - Verify connection pool status

3. **Optimize if Needed** (< 30 minutes)
   - Add missing indexes
   - Optimize slow queries
   - Scale database if needed

4. **Monitor Recovery** (< 1 hour)
   - Verify response times improve
   - Check for side effects

### Procedure 3: Security Incident

1. **Acknowledge Alert** (< 2 minutes)
2. **Assess Threat** (< 10 minutes)
   - Review access patterns
   - Check if orders are related
   - Determine if malicious

3. **Contain Threat** (< 15 minutes)
   - Temporarily suspend user if malicious
   - Block IP if automated attack
   - Rate limit if needed

4. **Investigate** (< 1 hour)
   - Review user's full activity
   - Check for data breaches
   - Identify vulnerability

5. **Remediate** (< 24 hours)
   - Fix vulnerability
   - Update security rules
   - Notify affected users if needed

## Maintenance and Review

### Weekly Review

- Review dashboard metrics
- Check for trends or anomalies
- Verify alerts are working correctly
- Update thresholds if needed

### Monthly Review

- Analyze incident reports
- Review and update alert thresholds
- Optimize slow queries
- Update documentation

### Quarterly Review

- Comprehensive performance analysis
- Security audit
- Capacity planning
- Update monitoring strategy

## Related Documentation

- [Order Tracking API Documentation](./ORDER_TRACKING_API_DOCUMENTATION.md)
- [Error Tracking System](./ERROR_TRACKING_API_DOCUMENTATION.md)
- [Deployment Guide](../DEPLOYMENT-CHECKLIST.md)

---

**Last Updated**: February 10, 2026  
**Version**: 1.0.0  
**Status**: Production Ready
