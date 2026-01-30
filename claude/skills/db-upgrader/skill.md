---
name: db-upgrader
description: Utilities for modifying YAML files during RDS database upgrades. Provides functions to update switchover flags, engine versions, and create SQL query files.
user-invocable: false
allowed-tools: Read, Edit, Write
---

# Database Upgrader YAML Utilities

This skill provides utilities for modifying YAML files during RDS database upgrades. It is designed to be called by the db upgrade agents, not invoked directly by users.

## Available Operations

### 1. Update Switchover Flags

Update `switchover` and `delete` flags in a namespace YAML file.

**Input:** Path to namespace YAML file
**Action:** Changes `switchover: false` to `switchover: true` and `delete: false` to `delete: true`

**Example:**
```yaml
# Before
blue_green_deployment:
  enabled: true
  switchover: false
  delete: false
  target:
    engine_version: "16.9"

# After
blue_green_deployment:
  enabled: true
  switchover: true
  delete: true
  target:
    engine_version: "16.9"
```

### 2. Update Engine Version

Update the `engine_version` field in an RDS YAML file.

**Input:**
- Path to RDS YAML file
- New version string (e.g., "16.9")

**Action:** Replaces the `engine_version` value with the new version

**Example:**
```yaml
# Before
engine_version: "16.4"

# After
engine_version: "16.9"
```

### 3. Remove Blue/Green Deployment Section

Remove the entire `blue_green_deployment` section from a namespace YAML file.

**Input:** Path to namespace YAML file
**Action:** Deletes the entire `blue_green_deployment` block

**Example:**
```yaml
# Before
externalResources:
- provider: rds
  name: chrome-service-stage
  blue_green_deployment:
    enabled: true
    switchover: true
    delete: true
    target:
      engine_version: "16.9"

# After
externalResources:
- provider: rds
  name: chrome-service-stage
```

### 4. Create SQL Query File

Create a SQL query YAML file for replication checks or post-maintenance.

**Input:**
- File path where to create the file
- Query type: "replication-check" or "post-maintenance"
- Service name
- Environment
- Namespace reference path
- RDS identifier
- (For post-maintenance) Database name

**Action:** Creates a properly formatted SQL query YAML file

### 5. Create Status Page Maintenance File

Create a status page maintenance incident YAML file for production upgrades.

**Input:**
- File path where to create the file
- Service name
- Product name
- Maintenance date
- Start time (UTC)
- End time (UTC)
- Maintenance message

**Action:** Creates a properly formatted status page maintenance YAML file

**Example:**
```yaml
$schema: /app-sre/maintenance-1.yml

affectedServices:
- $ref: /services/insights/chrome-service/app.yml

announcements:
- provider: statuspage
  page:
    $ref: /dependencies/statuspage/status-redhat-com.yml
  notifySubscribersOnCompletion: true
  notifySubscribersOnStart: true
  remindSubscribers: true

message: |
  The Red Hat Hybrid Cloud Console will undergo a DB upgrade for
  chrome-service starting on 2025-10-08 at 04:00 UTC (23:00 ET). The updates are
  expected to last approximately 3 hours until 07:00 UTC (02:00 ET).

  During this maintenance window, the console UI may briefly be unavailable.

name: Hybrid Cloud Console chrome-service database maintenance 2025-10-08

scheduledStart: "2025-10-08T04:00:00Z"
scheduledEnd: "2025-10-08T07:00:00Z"
```

### 6. Update Status Page Component Reference

Update the component YAML file to reference the maintenance file.

**Input:**
- Path to component YAML file
- Path to maintenance file (for reference)

**Action:** Updates or adds the `status` section with maintenance reference

**Example:**
```yaml
# Before (or if status section doesn't exist)
name: status-page-component-insights-chrome-service
# ... other fields ...

# After
name: status-page-component-insights-chrome-service
# ... other fields ...
status:
- provider: maintenance
  maintenance:
    $ref: /dependencies/statuspage/maintenances/production-chrome-service-db-maintenance-2025-10-08.yml
```

## Helper Script

The `scripts/helper.js` provides Node.js functions for generating YAML content and determining file paths.

See [reference.md](reference.md) for YAML schemas and [examples.md](examples.md) for detailed examples.

## Usage by Agents

Agents should:

1. Read the target YAML file
2. Call this skill with the operation needed
3. Validate the changes
4. Commit and create PR

This skill handles only the YAML modifications - agents handle orchestration, git operations, and PR creation.
