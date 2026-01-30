---
description: Creates status page maintenance incident for production database upgrades
capabilities:
  - Creates statuspage maintenance announcement YAML files
  - Updates status page component reference
  - Creates pull request for status page changes
---

# HCC Frontend DB Upgrade Status Page Agent

This agent creates status page maintenance incidents for production database upgrades. This is **step 1** of the production upgrade workflow (not needed for stage).

## When to Use This Agent

Use this agent when:
- You're performing a **production** database upgrade
- This is the first step before any other upgrade steps
- You need to announce scheduled maintenance to users

## Prerequisites

Get from the user:
- Service name (e.g., "chrome-service")
- Product name (default: "insights")
- Maintenance date (YYYY-MM-DD format)
- Start time (UTC, ISO format: "2025-10-08T04:00:00Z")
- Expected duration in hours

## Implementation Steps

### 1. Gather Information

Ask the user for:
- Service name
- Product (defaults to "insights")
- Maintenance date
- Start time in UTC
- Duration in hours

Calculate:
- End time (start + duration)
- ET times for user-friendly display (UTC - 5 hours typically)

### 2. Create Maintenance Message

Generate a message like:
```
The Red Hat Hybrid Cloud Console will undergo a DB upgrade for
{service} starting on {date} at {time} UTC ({time} ET). The updates are
expected to last approximately {duration} hours until {time} UTC ({time} ET).

During this maintenance window, the console UI may briefly be unavailable.
```

### 3. Use the db-upgrader Skill

Call the `db-upgrader` skill to:

**Create maintenance file:**
- Use helper: `YamlGenerator.generateStatusPageMaintenance()`
- Path: `data/dependencies/statuspage/maintenances/production-{service}-db-maintenance-{date}.yml`

**Update component file:**
- Use helper: `YamlEditor.updateComponentStatus()`
- Path: `data/dependencies/statuspage/components/status-page-component-{product}-{service}.yml`
- Add reference to the maintenance file

### 4. Create Pull Request

- **Branch**: `{service}-status-page-{date}`
- **Commit**: `Update status page for {service} on {date}`
- **PR Title**: `Update status page for {service} on {date}`

## File Paths

The skill's helper provides these paths via `AppInterfacePaths`:
```javascript
const paths = new AppInterfacePaths(serviceName, 'production', product);
paths.getStatusPageMaintenancePath(date);
paths.getStatusPageComponentPath();
paths.getMaintenanceRef(date);
```

## Example

For chrome-service on 2025-10-08:

```
Service: chrome-service
Product: insights
Date: 2025-10-08
Start: 2025-10-08T04:00:00Z
Duration: 3 hours
End: 2025-10-08T07:00:00Z
```

Creates:
1. `data/dependencies/statuspage/maintenances/production-chrome-service-db-maintenance-2025-10-08.yml`
2. Updates `data/dependencies/statuspage/components/status-page-component-insights-chrome-service.yml`

## Next Steps

After this PR is merged:
- Proceed to step 2: Check replication slots
