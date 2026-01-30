---
description: Creates SQL query to check for active replication slots before database upgrade
capabilities:
  - Creates app-interface SQL query YAML file
  - Generates SQL queries to check pg_publication and pg_replication_slots
  - Creates pull request for replication slot verification
---

# HCC Frontend DB Upgrade Replication Check Agent

This agent creates an SQL query file to verify no replication slots are active before performing a database upgrade. This prevents issues during blue/green switchover.

## When to Use This Agent

Use this agent when:
- This is **step 1 for stage** or **step 2 for production**
- Before performing the database switchover
- You need to verify database is ready for upgrade

## Prerequisites

Get from the user:
- Service name (e.g., "chrome-service")
- Environment (stage or production)
- Product name (default: "insights")
- Date for the check (default: today)

## Implementation Steps

### 1. Gather Information

Ask the user for:
- Service name
- Environment
- Product (defaults to "insights")
- Date (defaults to today's date)

### 2. Use the db-upgrader Skill

Call the `db-upgrader` skill to create the SQL query file:

**Generate YAML content:**
```javascript
const paths = new AppInterfacePaths(serviceName, environment, product);
const yamlContent = YamlGenerator.generateReplicationCheck(
  serviceName,
  environment,
  product,
  date
);
```

**Write to file:**
- Path: `data/app-interface/sql-queries/{product}/{service-short}/{env}/{date}-{env}-check-used-replication-slots.yaml`
- Use `paths.getReplicationCheckPath(date)` to get the path

### 3. Create Pull Request

- **Branch**: `{service}-{env}-check-replication-slots-{date}`
- **Commit**: `Check if no replication slots are used for {service} {environment}`
- **PR Title**: `Check if no replication slots are used for {service} {environment}`

## What The SQL Queries Check

The generated file includes three queries:

1. `SELECT oid, pubname FROM pg_publication;`
   - Lists all publications (for logical replication)

2. `SELECT pubname, tablename FROM pg_publication_tables;`
   - Shows which tables are in each publication

3. `SELECT slot_name, slot_type FROM pg_replication_slots;`
   - Lists all replication slots (must be empty)

## Expected Results

When this SQL query runs:
- **Ideal**: All queries return empty results (no replication slots)
- **Problematic**: Active replication slots found → Must remove before proceeding

## File Structure

The skill generates this structure:
```yaml
---
$schema: /app-interface/app-interface-sql-query-1.yml
labels: {}
name: {date}-{env}-check-used-replication-slots
namespace:
  $ref: /services/{product}/{service}/namespaces/{service}-{env}.yml
identifier: {service}-{env}
output: stdout
queries:
  - SELECT oid, pubname FROM pg_publication;
  - SELECT pubname, tablename FROM pg_publication_tables;
  - SELECT slot_name, slot_type FROM pg_replication_slots;
```

## Notes

- Sometimes a "-bis" suffix is added if creating multiple checks
- The identifier may differ from the service name (verify in namespace file)
- Query output goes to stdout for manual review

## Next Steps

After this PR is merged and query executes:
1. **If clear**: Proceed to step 3 - Post maintenance script
2. **If slots found**: Remove them, then re-run the check
