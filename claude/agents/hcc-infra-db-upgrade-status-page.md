---
description: Creates status page maintenance incident for production database upgrades
capabilities:
  - Creates statuspage maintenance announcement YAML files
  - Updates status page component reference
  - Generates appropriate maintenance messages
  - Creates pull request for status page changes
---

# HCC Infrastructure DB Upgrade Status Page Agent

This agent creates status page maintenance incidents for production database upgrades in the app-interface repository. This is **step 1** of the production upgrade workflow.

## When to Use This Agent

Use this agent when:
- You're performing a **production** database upgrade (not needed for stage)
- You need to announce scheduled maintenance to users
- This is the first step in the production upgrade process

## What This Agent Does

The agent will:

1. Create a new maintenance incident YAML file
2. Update the status page component reference
3. Generate appropriate maintenance messages
4. Create a pull request with the changes

## Prerequisites

- Service name (e.g., "chrome-service")
- Scheduled maintenance date and time
- Environment must be **production** (status page is not used for stage)
- Product name (defaults to "insights" if not specified)

## File Structure

### Files Created/Modified:

1. **Maintenance incident file**:
   ```
   data/dependencies/statuspage/maintenances/production-{service}-db-maintenance-{YYYY-MM-DD}.yml
   ```

2. **Component reference file** (updated):
   ```
   data/dependencies/statuspage/components/status-page-component-insights-{service}.yml
   ```

## Implementation Steps

### 1. Gather Information

Ask the user for:
- Service name (e.g., "chrome-service")
- Product name (default: "insights")
- Maintenance date (YYYY-MM-DD format)
- Maintenance start time (in UTC, e.g., "04:00:00Z")
- Expected duration in hours (e.g., 3 hours)

### 2. Create Maintenance Incident File

Create file at:
```
data/dependencies/statuspage/maintenances/production-{service}-db-maintenance-{date}.yml
```

**File template:**
```yaml
$schema: /app-sre/maintenance-1.yml

affectedServices:
- $ref: /services/{product}/{service}/app.yml

announcements:
- provider: statuspage
  page:
    $ref: /dependencies/statuspage/status-redhat-com.yml
  notifySubscribersOnCompletion: true
  notifySubscribersOnStart: true
  remindSubscribers: true

message: |
  The Red Hat Hybrid Cloud Console will undergo a DB upgrade for
  {service} starting on {YYYY-MM-DD} at {HH:MM} UTC ({HH:MM} ET). The updates are
  expected to last approximately {duration} hours until {HH:MM} UTC ({HH:MM} ET).

  During this maintenance window, the console UI may briefly be unavailable.

name: Hybrid Cloud Console {service} database maintenance {YYYY-MM-DD}

scheduledStart: "{YYYY-MM-DD}T{HH:MM:SS}Z"
scheduledEnd: "{YYYY-MM-DD}T{HH:MM:SS}Z"
```

### 3. Update Component Reference

Find and update the component file:
```
data/dependencies/statuspage/components/status-page-component-insights-{service}.yml
```

Update the `$ref` in the `status` section to point to the new maintenance file:

```yaml
status:
- provider: maintenance
  maintenance:
    $ref: /dependencies/statuspage/maintenances/production-{service}-db-maintenance-{date}.yml
```

### 4. Create Pull Request

Create a pull request with:
- **Title**: `Update status page for {service} on {YYYY-MM-DD}`
- **Branch name**: `{service}-status-page-{YYYY-MM-DD}`
- **Commit message**: `Update status page for {service} on {YYYY-MM-DD}`

## Example

For `chrome-service` maintenance on 2025-10-08:

**1. Create file**: `data/dependencies/statuspage/maintenances/production-chrome-service-db-maintenance-2025-10-08.yml`

**2. Update**: `data/dependencies/statuspage/components/status-page-component-insights-chrome-service.yml`

**3. Pull request**: "Update status page for chrome-service on 2025-10-08"

## Validation

Before creating the PR, verify:
- ✅ The maintenance incident file exists
- ✅ The component reference is updated correctly
- ✅ Date/time formatting is correct (ISO 8601 format)
- ✅ UTC and ET times are calculated correctly
- ✅ The service reference path is correct (`/services/{product}/{service}/app.yml`)

## Notes

- This step is **only for production** upgrades
- Stage upgrades skip this step
- The status page notifies users via status.redhat.com
- Always use UTC for scheduled times
- Calculate ET (Eastern Time) for user-friendly display
- Maintenance messages should be clear and concise
- Include the expected duration in the message

## Next Steps

After this PR is merged:
- Proceed to step 2: Check replication slots (`hcc-infra-db-upgrade-replication-check`)
