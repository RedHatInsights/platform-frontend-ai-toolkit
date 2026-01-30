---
description: Creates SQL query for post-upgrade database maintenance (VACUUM and REINDEX)
capabilities:
  - Creates app-interface SQL query YAML file for maintenance scripts
  - Generates VACUUM ANALYZE and REINDEX commands
  - Creates pull request for post-upgrade maintenance
---

# HCC Infrastructure DB Upgrade Post-Maintenance Agent

This agent creates an SQL query file to run post-upgrade maintenance scripts (VACUUM and REINDEX) after a database upgrade. These operations optimize the database after the version upgrade.

## When to Use This Agent

Use this agent when:
- You need to run maintenance scripts after RDS upgrade
- This is **step 2 for stage** or **step 3 for production** in the upgrade workflow
- After verifying replication slots are clear

## What This Agent Does

The agent will:

1. Create an SQL query YAML file in the app-interface repository
2. Add VACUUM and REINDEX commands
3. Create a pull request with the changes

## Prerequisites

- Service name (e.g., "chrome-service")
- Environment (stage or production)
- Date for the maintenance (YYYY-MM-DD format)
- Database name (typically derived from service name)
- Product name (defaults to "insights" if not specified)

## File Structure

### File Created:

```
data/app-interface/sql-queries/{product}/{service-shortname}/{environment}/{YYYY-MM-DD}-{env}-post-upgrade-maintenance-scripts.yaml
```

**Note**:
- `{product}` defaults to "insights" if not specified
- Service short name is typically extracted from the full service name (e.g., "chrome-service" → "chrome")

## Implementation Steps

### 1. Gather Information

Ask the user for:
- Service name (e.g., "chrome-service")
- Environment (stage or production)
- Product name (default: "insights")
- Date for the maintenance (YYYY-MM-DD format)
- Database name (e.g., "chrome_service")

Derive:
- Service short name (e.g., "chrome" from "chrome-service")
- Namespace reference path

### 2. Determine File Location

The SQL query file should be created at:
```
data/app-interface/sql-queries/{product}/{service-shortname}/{environment}/{date}-{env}-post-upgrade-maintenance-scripts.yaml
```

Examples (using default product "insights"):
- Stage: `data/app-interface/sql-queries/insights/chrome/stage/2025-10-06-stage-post-upgrade-maintenance-scripts.yaml`
- Production: `data/app-interface/sql-queries/insights/chrome/production/2025-10-30-prod-post-upgrade-maintenance-scripts.yaml`

### 3. Determine Database Name

The database name typically follows the pattern:
- Format: `{service_name}` (underscores instead of hyphens)
- Example: "chrome-service" → "chrome_service"
- Example: "rbac" → "rbac"

**Important**: Verify the actual database name by checking existing configuration or asking the user.

### 4. Create SQL Query File

**File template:**
```yaml
---
$schema: /app-interface/app-interface-sql-query-1.yml
labels: {}
name: {date}-{env}-post-upgrade-maintenance-scripts
namespace:
  $ref: /services/{product}/{service-name}/namespaces/{service-name}-{env}.yml
identifier: {service-name}-{env}
output: stdout
queries:
  - VACUUM VERBOSE ANALYZE;
  - REINDEX (VERBOSE) DATABASE CONCURRENTLY "{database_name}";
```

### 5. Create Pull Request

Create a pull request with:
- **Title**: `Post ma[i]ntenance script for {service-identifier}-{date}`
- **Branch name**: `{service}-{env}-post-maintenance-{date}`
- **Commit message**: `Post ma[i]ntenance script for {service-identifier}-{date}`

**Note**: The title uses "ma[i]ntenance" or "maintanance" (check git history for the service's convention)

## Example

For `chrome-service` stage maintenance on 2025-10-06:

**File created** (using default product "insights"):
```
data/app-interface/sql-queries/insights/chrome/stage/2025-10-06-stage-post-upgrade-maintenance-scripts.yaml
```

**Content**:
```yaml
---
$schema: /app-interface/app-interface-sql-query-1.yml
labels: {}
name: 2025-10-06-stage-post-upgrade-maintenance-scripts
namespace:
  $ref: /services/insights/chrome-service/namespaces/chrome-service-stage.yml
identifier: chrome-service-stage
output: stdout
queries:
  - VACUUM VERBOSE ANALYZE;
  - REINDEX (VERBOSE) DATABASE CONCURRENTLY "chrome_service";
```

**Pull request**: "Post maintanance script for insights-chrome-25-10-06"

## What The Queries Do

1. **`VACUUM VERBOSE ANALYZE;`**
   - Reclaims storage occupied by dead tuples
   - Updates statistics used by the query planner
   - VERBOSE provides detailed output
   - Critical after major version upgrades

2. **`REINDEX (VERBOSE) DATABASE CONCURRENTLY "{database_name}";`**
   - Rebuilds all indexes in the database
   - CONCURRENTLY allows normal operations to continue
   - VERBOSE provides detailed output
   - Ensures indexes are optimized for the new PostgreSQL version

## Validation

Before creating the PR, verify:
- ✅ The SQL query file path is correct
- ✅ The namespace reference path exists
- ✅ The identifier matches the namespace name
- ✅ The database name is correct (with underscores)
- ✅ Both VACUUM and REINDEX commands are present
- ✅ CONCURRENTLY is used for REINDEX
- ✅ YAML syntax is valid

## Expected Results

When this SQL query runs in app-interface:
- VACUUM will clean up dead tuples and update statistics
- REINDEX will rebuild all database indexes
- Both operations will output verbose logs
- The database will be optimized for the new PostgreSQL version

## Notes

- These operations are resource-intensive
- CONCURRENTLY allows the database to remain available
- VACUUM ANALYZE should complete relatively quickly
- REINDEX may take longer depending on database size
- These scripts run AFTER the version upgrade
- Critical for optimal performance on the new PostgreSQL version

## Next Steps

After this PR is merged and the scripts are executed:
1. **Verify** the VACUUM and REINDEX completed successfully
2. **Monitor** database performance
3. **Proceed** to step 4 - Switchover (`hcc-infra-db-upgrade-switchover`)
