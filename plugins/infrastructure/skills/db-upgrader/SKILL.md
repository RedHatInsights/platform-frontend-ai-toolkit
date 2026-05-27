---
name: db-upgrader
description: Utilities for modifying YAML files during RDS database upgrades. Provides functions to update switchover flags, engine versions, and create SQL query files.
disable-model-invocation: true
allowed-tools: Read, Edit, Write
arguments:
  - name: service
    description: Service name (e.g., "chrome-service")
    required: true
  - name: environment
    description: Environment (stage or production)
    required: true
  - name: version
    description: Target PostgreSQL version (e.g., "16.9")
    required: true
  - name: product
    description: Product/bundle name (defaults to "insights")
    required: false
    default: insights
  - name: action
    description: Upgrade step to perform (status-page, replication-check, post-maintenance, switchover, cleanup)
    required: false
---

# Database Upgrader YAML Utilities

This skill provides utilities for modifying YAML files during RDS database upgrades. It can be called by db upgrade agents or invoked directly by users.

## Invoking the Skill

You can call this skill with arguments:

```
/db-upgrader <service> <environment> <version> [product] [action]
```

**Examples:**
```
# Run orchestrator to determine next step
/db-upgrader chrome-service stage 16.9

# Run specific upgrade step
/db-upgrader chrome-service production 16.9 insights status-page
/db-upgrader chrome-service stage 16.9 insights replication-check
/db-upgrader chrome-service stage 16.9 insights switchover
```

The skill will automatically collect:
- `$ARGUMENTS.service` - Service name (required)
- `$ARGUMENTS.environment` - Environment: stage or production (required)
- `$ARGUMENTS.version` - Target PostgreSQL version (required)
- `$ARGUMENTS.product` - Product/bundle name (optional, defaults to "insights")
- `$ARGUMENTS.action` - Upgrade step to perform (optional)
  - `status-page` - Create status page maintenance (production only)
  - `replication-check` - Verify no active replication slots
  - `post-maintenance` - Create VACUUM and REINDEX queries
  - `switchover` - Trigger database version switch
  - `cleanup` - Remove blue/green deployment config

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

Agents can call this skill via the Skill tool with arguments:

```javascript
// Orchestrator agent - let skill determine next step
Skill("db-upgrader", args: "chrome-service stage 16.9")

// Specialized agent - specify the action to perform
Skill("db-upgrader", args: "chrome-service stage 16.9 insights replication-check")
Skill("db-upgrader", args: "chrome-service production 16.9 insights status-page")
Skill("db-upgrader", args: "chrome-service stage 16.9 insights switchover")
```

The skill will receive:
- `$ARGUMENTS.service` - Service name
- `$ARGUMENTS.environment` - Environment (stage/production)
- `$ARGUMENTS.version` - Target PostgreSQL version
- `$ARGUMENTS.product` - Product/bundle (defaults to "insights" if not provided)
- `$ARGUMENTS.action` - Specific upgrade step to perform (optional)

### Workflow

**Option 1: Orchestrator Mode (no action specified)**
When called without an action, the skill can analyze git history and determine the next step to perform.

**Option 2: Direct Action Mode (action specified)**
When called with a specific action, the skill performs that step directly:

1. **status-page**: Creates status page maintenance YAML files
2. **replication-check**: Generates replication slot check SQL query
3. **post-maintenance**: Generates VACUUM and REINDEX SQL queries
4. **switchover**: Updates switchover flags and engine version
5. **cleanup**: Removes blue/green deployment configuration

Agents should:

1. Determine the service name, environment, and target version
2. (Optional) Specify which action to perform, or let the skill orchestrate
3. Call this skill with those arguments
4. Use the helper functions (AppInterfacePaths, YamlGenerator, YamlEditor) to perform operations
5. Read and modify YAML files as needed
6. Validate the changes
7. Commit and create PR

This skill handles only the YAML modifications - agents handle orchestration, git operations, and PR creation.
