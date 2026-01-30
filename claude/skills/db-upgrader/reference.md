# Database Upgrader Reference

This document provides detailed YAML file structures, schemas, and patterns used in the app-interface repository for RDS database upgrades.

## File Locations

### Service Structure

```
data/services/{product}/{service-name}/
├── namespaces/
│   ├── {service-name}-stage.yml
│   └── {service-name}-prod.yml
├── pipelines/
│   ├── stage/
│   └── production/
└── ...
```

### SQL Query Files

```
data/app-interface/sql-queries/{product}/{service-shortname}/{environment}/
├── YYYY-MM-DD-{env}-check-used-replication-slots.yaml
├── YYYY-MM-DD-{env}-post-maintenance.yaml
└── ...
```

### RDS Configuration Files

```
resources/terraform/resources/{product}/{environment}/rds/
├── postgres{major_version}-rds-{service-identifier}-{env}.yml
└── ...
```

## YAML Schemas

### 1. Namespace File (Blue/Green Configuration)

**File path:** `data/services/{product}/{service-name}/namespaces/{service-name}-{env}.yml`

#### Initial State (Blue/Green Enabled)

```yaml
---
$schema: /openshift/namespace-1.yml
name: {service-name}-{env}
cluster:
  $ref: /clusters/{cluster-name}.yml
app:
  $ref: /services/{product}/{service-name}/app.yml
environment:
  $ref: /environments/{env}.yml

externalResources:
- provider: rds
  name: {service-name}-{env}
  provisioner:
    $ref: /aws/account/app-sre.yml

  # Blue/Green Deployment Configuration
  blue_green_deployment:
    enabled: true
    switchover: false
    delete: false
    target:
      engine_version: "16.9"
      # Optional: instance_class can also be specified
      # instance_class: "db.t4g.medium"
```

#### After Switchover

```yaml
  blue_green_deployment:
    enabled: true
    switchover: true    # ← Changed from false
    delete: true        # ← Changed from false
    target:
      engine_version: "16.9"
```

#### After Cleanup

```yaml
externalResources:
- provider: rds
  name: {service-name}-{env}
  provisioner:
    $ref: /aws/account/app-sre.yml

  # Blue/green deployment section removed entirely
```

### 2. RDS Configuration File

**File path:** `resources/terraform/resources/{product}/{environment}/rds/postgres{version}-rds-{service}-{env}.yml`

#### Structure

```yaml
---
$schema: /aws/rds-1.yml
name: postgres{major_version}-rds-{service-identifier}-{env}
provider: rds
identifier: {service-identifier}-{env}
output_resource_name: {service-name}-{env}

# Database configuration
engine: postgres
engine_version: "16.4"  # ← This gets updated during switchover
instance_class: db.t4g.medium
parameter_group:
  $ref: /aws/rds-defaults/postgres{major_version}-parameter-group.yml
allocated_storage: 100
ca_cert: rds-ca-rsa2048-g1
enable_deletion_protection: true
reset_password: false

# Additional settings
defaults:
  $ref: /aws/rds-defaults/defaults.yml
vpc_security_group_ids:
  - $ref: /aws/vpc-peerings/{vpc-config}.yml
output_prefix: "{env}-"
```

#### During Switchover

The `engine_version` field is updated to match the `target.engine_version` from the namespace file:

```yaml
engine_version: "16.9"  # Updated from "16.4"
```

### 3. SQL Query File (Replication Check)

**File path:** `data/app-interface/sql-queries/{product}/{service-short}/{env}/{date}-{env}-check-used-replication-slots.yaml`

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

**Field descriptions:**

- `$schema`: References the SQL query schema definition
- `labels`: Metadata labels (typically empty)
- `name`: Unique identifier for this query (uses date prefix)
- `namespace`: Reference to the namespace where the database runs
- `identifier`: Must match the RDS identifier
- `output`: Where query results go (typically `stdout`)
- `queries`: Array of SQL statements to execute

### 4. SQL Query File (Post Maintenance)

**File path:** `data/app-interface/sql-queries/{product}/{service-short}/{env}/{date}-{env}-post-maintenance.yaml`

```yaml
---
$schema: /app-interface/app-interface-sql-query-1.yml
labels: {}
name: {date}-{env}-post-maintenance
namespace:
  $ref: /services/{product}/{service-name}/namespaces/{service-name}-{env}.yml
identifier: {service-name}-{env}
output: stdout
queries:
  - VACUUM (VERBOSE, ANALYZE);
  - REINDEX (VERBOSE) DATABASE {database-name};
```

**Query explanations:**

- `VACUUM (VERBOSE, ANALYZE)`: Reclaims storage and updates statistics
- `REINDEX (VERBOSE) DATABASE`: Rebuilds all indexes for better performance

### 5. Status Page Maintenance File (Production Only)

**File path:** `data/dependencies/statuspage/maintenances/production-{service-name}-db-maintenance-{date}.yml`

```yaml
$schema: /app-sre/maintenance-1.yml

affectedServices:
- $ref: /services/{product}/{service-name}/app.yml

announcements:
- provider: statuspage
  page:
    $ref: /dependencies/statuspage/status-redhat-com.yml
  notifySubscribersOnCompletion: true
  notifySubscribersOnStart: true
  remindSubscribers: true

message: |
  The Red Hat Hybrid Cloud Console will undergo a DB upgrade for
  {service-name} starting on {YYYY-MM-DD} at {HH:MM} UTC ({HH:MM} ET). The updates are
  expected to last approximately {duration} hours until {HH:MM} UTC ({HH:MM} ET).

  During this maintenance window, the console UI may briefly be unavailable.

name: Hybrid Cloud Console {service-name} database maintenance {YYYY-MM-DD}

scheduledStart: "{YYYY-MM-DD}T{HH:MM:SS}Z"
scheduledEnd: "{YYYY-MM-DD}T{HH:MM:SS}Z"
```

**Field descriptions:**

- `$schema`: References the maintenance schema definition
- `affectedServices`: List of services affected by this maintenance
- `announcements`: Configuration for status page notifications
  - `notifySubscribersOnCompletion`: Send notification when complete
  - `notifySubscribersOnStart`: Send notification when starting
  - `remindSubscribers`: Send reminder before maintenance
- `message`: User-facing message displayed on status page (supports multi-line)
- `name`: Internal name for the maintenance
- `scheduledStart`: Start time in ISO 8601 format (UTC)
- `scheduledEnd`: End time in ISO 8601 format (UTC)

### 6. Status Page Component File

**File path:** `data/dependencies/statuspage/components/status-page-component-{product}-{service-name}.yml`

This file needs to be updated to reference the maintenance file.

**Add or update the status section:**

```yaml
status:
- provider: maintenance
  maintenance:
    $ref: /dependencies/statuspage/maintenances/production-{service-name}-db-maintenance-{date}.yml
```

**Complete example:**

```yaml
$schema: /dependencies/statuspage-component-1.yml
name: status-page-component-insights-chrome-service
page:
  $ref: /dependencies/statuspage/status-redhat-com.yml
component_id: abc123xyz
group_id: def456uvw

status:
- provider: maintenance
  maintenance:
    $ref: /dependencies/statuspage/maintenances/production-chrome-service-db-maintenance-2025-10-08.yml
```

## Common Patterns

### Service Name Variations

Different files use different service name formats:

| Format              | Example             | Used In                  |
|---------------------|---------------------|--------------------------|
| Full name           | `chrome-service`    | Namespace files, dirs    |
| Short name          | `chrome`            | SQL query directories    |
| Backend name        | `chrome-backend-service` | Some RDS files      |
| Identifier          | `chrome-svc`        | Some RDS identifiers     |

**Finding the correct name:**

1. Check existing namespace files for the exact name
2. Use glob patterns to find RDS files: `postgres*-rds-*{service}*.yml`
3. Look at existing SQL query directories for short name

### Environment Abbreviations

| Full Name    | Abbreviation | Used In              |
|--------------|--------------|----------------------|
| stage        | stage        | Most files           |
| production   | prod         | Namespace files      |
| production   | production   | Directory paths      |

### Date Formats

SQL query filenames use ISO 8601 date format:

```
YYYY-MM-DD-{env}-{purpose}.yaml
```

Examples:
- `2025-10-06-stage-check-used-replication-slots.yaml`
- `2025-10-08-prod-post-maintenance.yaml`

### PostgreSQL Versions

Version strings appear in multiple formats:

| Format | Example | Used In |
|--------|---------|---------|
| Full version | `16.9` | Namespace target, RDS engine_version |
| Major version | `16` | RDS file names, parameter group refs |

## Path Resolution Examples

### Given: Service = "chrome-service", Environment = "stage", Product = "insights"

**Namespace file:**
```
data/services/insights/chrome-service/namespaces/chrome-service-stage.yml
```

**SQL query directory:**
```
data/app-interface/sql-queries/insights/chrome/stage/
```

**RDS file (requires searching):**
```
resources/terraform/resources/insights/stage/rds/postgres16-rds-chrome-backend-service-stage.yml
```

### Finding RDS Files

Since RDS file naming varies, use glob patterns:

```bash
# Pattern to find RDS files for a service
resources/terraform/resources/{product}/{environment}/rds/postgres*-rds-*{service}*.yml
```

For "chrome-service" in stage:
```bash
resources/terraform/resources/insights/stage/rds/postgres*-rds-*chrome*.yml
```

## Validation Rules

### YAML Syntax

All YAML files must:
- Start with `---`
- Include required `$schema` field
- Use proper indentation (2 spaces)
- Quote version strings (e.g., `"16.9"`)

### Namespace File

- `externalResources[].provider` must be "rds"
- `blue_green_deployment.enabled` must be `true` for switchover
- `blue_green_deployment.target.engine_version` must match RDS file version after switchover

### RDS File

- `engine` must be "postgres"
- `engine_version` must be quoted string
- `instance_class` follows format `db.{type}.{size}`

### SQL Query Files

- `$schema` must be `/app-interface/app-interface-sql-query-1.yml`
- `namespace.$ref` must point to existing namespace file
- `identifier` must match the RDS identifier
- `queries` must be non-empty array

## Reference Paths

### Schema References

Common schema paths used in app-interface:

```yaml
$schema: /openshift/namespace-1.yml           # Namespace files
$schema: /aws/rds-1.yml                       # RDS config files
$schema: /app-interface/app-interface-sql-query-1.yml  # SQL query files
```

### Resource References

```yaml
# Cluster reference
cluster:
  $ref: /clusters/{cluster-name}.yml

# App reference
app:
  $ref: /services/{product}/{service-name}/app.yml

# Environment reference
environment:
  $ref: /environments/{env}.yml

# Namespace reference (from SQL query files)
namespace:
  $ref: /services/{product}/{service-name}/namespaces/{service-name}-{env}.yml

# Parameter group reference
parameter_group:
  $ref: /aws/rds-defaults/postgres{major_version}-parameter-group.yml
```

## Git Workflow

### Branch Naming

```
{service-name}-{env}-{action}-{date}
```

Examples:
- `chrome-service-stage-check-replication-slots-2025-10-06`
- `chrome-service-prod-switchover-2025-10-08`
- `chrome-service-stage-cleanup-2025-10-10`

### Commit Messages

Follow the pattern from existing PRs:

```
{service} {env} db upgrade - {description}
```

Examples:
- `chrome-service stage db upgrade - check replication slots`
- `chrome-service prod db upgrade - switch over to the new RDS 16.9 graviton instance class`
- `chrome-service stage db upgrade - cleanup green deployment`

### PR Titles

Be specific and include service and environment:

- `Check if no replication slots are used for {service} {environment}`
- `Post maintenance script for {service} {environment}`
- `Switch over to the new RDS version of {service} for {environment}`
- `Cleanup green deployment entry for {service} {environment}`

## Troubleshooting

### Common File Location Issues

**Problem:** Cannot find RDS configuration file

**Solution:** Use glob pattern with partial service name:
```bash
find resources/terraform/resources/{product}/{env}/rds -name "*{service}*"
```

**Problem:** Namespace reference path is incorrect

**Solution:** Verify the path follows this exact format:
```
/services/{product}/{service-name}/namespaces/{service-name}-{env}.yml
```

Note the leading slash and `.yml` extension.

### Common YAML Errors

**Problem:** Version not quoted

**Bad:**
```yaml
engine_version: 16.9
```

**Good:**
```yaml
engine_version: "16.9"
```

**Problem:** Incorrect boolean values

**Bad:**
```yaml
switchover: True
delete: "true"
```

**Good:**
```yaml
switchover: true
delete: true
```

### Version Mismatches

After switchover, these must match:

1. Namespace: `blue_green_deployment.target.engine_version`
2. RDS: `engine_version`

Both should be the same version string (e.g., `"16.9"`).
