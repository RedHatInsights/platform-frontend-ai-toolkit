---
description: Creates SQL query to check for active replication slots before database upgrade
capabilities:
  - Creates app-interface SQL query YAML file
  - Generates SQL queries to check pg_publication and pg_replication_slots
  - Creates pull request for replication slot verification
---

# HCC Infrastructure DB Upgrade Replication Check Agent

This agent creates an SQL query file to check for active replication slots before performing a database upgrade. This prevents issues during the blue/green switchover process.

## When to Use This Agent

Use this agent when:
- You need to verify no replication slots are in use before DB upgrade
- This is **step 1 for stage** or **step 2 for production** in the upgrade workflow
- Before performing the actual database switchover

## What This Agent Does

The agent will:

1. Create an SQL query YAML file in the app-interface repository
2. Add queries to check for active publications and replication slots
3. Create a pull request with the changes

## Prerequisites

- Service name (e.g., "chrome-service")
- Environment (stage or production)
- Date for the check (YYYY-MM-DD format)
- Product name (defaults to "insights" if not specified)

## File Structure

### File Created:

```
data/app-interface/sql-queries/{product}/{service-shortname}/{environment}/{YYYY-MM-DD}-{env}-check-used-replication-slots.yaml
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
- Date for the check (YYYY-MM-DD format)

Derive:
- Service short name (e.g., "chrome" from "chrome-service")
- Namespace reference path

### 2. Determine File Location

The SQL query file should be created at:
```
data/app-interface/sql-queries/{product}/{service-shortname}/{environment}/{date}-{env}-check-used-replication-slots.yaml
```

Examples (using default product "insights"):
- Stage: `data/app-interface/sql-queries/insights/chrome/stage/2025-10-06-stage-check-used-replication-slots.yaml`
- Production: `data/app-interface/sql-queries/insights/chrome/production/2025-10-08-prod-check-used-replication-slots.yaml`

### 3. Create SQL Query File

**File template:**
```yaml
---
$schema: /app-interface/app-interface-sql-query-1.yml
labels: {}
name: {date}-{env}-check-used-replication-slots
namespace:
  $ref: /services/{product}/{service-name}/namespaces/{service-name}-{env}.yml
identifier: {service-name}-{env}
output: stdout
queries:
  - SELECT oid, pubname FROM pg_publication;
  - SELECT pubname, tablename FROM pg_publication_tables;
  - SELECT slot_name, slot_type FROM pg_replication_slots;
```

### 4. Create Pull Request

Create a pull request with:
- **Title**: `Check if no replication slots are used for {service} {environment}`
- **Branch name**: `{service}-{env}-check-replication-slots-{date}`
- **Commit message**: `Check if no replication slots are used for {service} {environment}`

## Example

For `chrome-service` production check on 2025-10-08:

**File created** (using default product "insights"):
```
data/app-interface/sql-queries/insights/chrome/production/2025-10-08-prod-check-used-replication-slots.yaml
```

**Content**:
```yaml
---
$schema: /app-interface/app-interface-sql-query-1.yml
labels: {}
name: 2025-10-08-prod-check-used-replication-slots
namespace:
  $ref: /services/insights/chrome-service/namespaces/chrome-service-prod.yml
identifier: chrome-service-prod
output: stdout
queries:
  - SELECT oid, pubname FROM pg_publication;
  - SELECT pubname, tablename FROM pg_publication_tables;
  - SELECT slot_name, slot_type FROM pg_replication_slots;
```

**Pull request**: "Check if no replication slots are used for chrome-service production"

## What The Queries Do

1. **`SELECT oid, pubname FROM pg_publication;`**
   - Lists all publications in the database
   - Publications are used for logical replication

2. **`SELECT pubname, tablename FROM pg_publication_tables;`**
   - Shows which tables are included in each publication
   - Helps identify what's being replicated

3. **`SELECT slot_name, slot_type FROM pg_replication_slots;`**
   - Lists all replication slots
   - Active slots must be removed before blue/green switchover

## Validation

Before creating the PR, verify:
- ✅ The SQL query file path is correct
- ✅ The namespace reference path exists
- ✅ The identifier matches the namespace name
- ✅ All three SQL queries are present
- ✅ YAML syntax is valid

## Expected Results

When this SQL query runs in app-interface:
- **Ideal result**: All queries return empty results (no replication slots)
- **Problematic result**: Active replication slots found
  - Must be manually removed before proceeding with upgrade
  - Coordinate with team to remove slots

## Notes

- This check is critical for blue/green deployment success
- Active replication slots will block the switchover
- The query output goes to stdout for manual review
- This step must be completed before the switchover step
- Sometimes a "bis" suffix is added to the filename if creating multiple checks (e.g., `-bis.yaml`)

## Next Steps

After this PR is merged and the query is executed:
1. **Review the query results** to ensure no active slots
2. **If clear**: Proceed to step 3 - Post maintenance script (`hcc-infra-db-upgrade-post-maintenance`)
3. **If slots found**: Work with the team to remove them, then re-run the check
