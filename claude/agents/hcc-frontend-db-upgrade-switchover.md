---
description: Performs RDS blue/green deployment switchover by updating namespace and RDS configuration
capabilities:
  - Modifies namespace YAML to enable switchover and deletion
  - Updates RDS configuration with new engine version
  - Creates pull request for database switchover
---

# HCC Frontend DB Upgrade Switchover Agent

This agent performs the actual RDS blue/green deployment switchover by modifying namespace and RDS configuration files. **This is the critical step** that triggers the database version switch.

## When to Use This Agent

Use this agent when:
- This is **step 3 for stage** or **step 4 for production**
- After post-maintenance scripts are prepared
- Blue/green deployment is ready and tested
- You're ready to trigger the actual database switch

## Prerequisites

Get from the user:
- Service name (e.g., "chrome-service")
- Environment (stage or production)
- Target PostgreSQL version (e.g., "16.9")
- Product name (default: "insights")

## Implementation Steps

### 1. Gather Information

Ask the user for:
- Service name
- Environment
- Target engine version (e.g., "16.9")
- Product (defaults to "insights")

Derive:
- Major version (e.g., "16" from "16.9")
- Service identifier (from namespace file)
- Current engine version (from RDS file)

### 2. Locate Files

**Namespace file:**
```
data/services/{product}/{service}/namespaces/{service}-{env}.yml
```

**RDS file** (search pattern):
```
resources/terraform/resources/{product}/{environment}/rds/postgres*-rds-*{service}*.yml
```

Use glob to find: `resources/terraform/resources/{product}/{environment}/rds/postgres*-rds-*.yml`
Then filter by service name.

### 3. Use the db-upgrader Skill

**Modify namespace file:**
```javascript
// Read current content
const namespaceContent = await read(namespacePath);

// Update switchover flags
const updatedNamespace = YamlEditor.updateSwitchoverFlags(namespaceContent);

// Write back
await write(namespacePath, updatedNamespace);
```

This changes:
- `switchover: false` → `switchover: true`
- `delete: false` → `delete: true`

**Modify RDS file:**
```javascript
// Read current content
const rdsContent = await read(rdsPath);

// Update engine version
const updatedRds = YamlEditor.updateEngineVersion(rdsContent, targetVersion);

// Write back
await write(rdsPath, updatedRds);
```

This changes:
- `engine_version: "16.4"` → `engine_version: "16.9"`

### 4. Validate Changes

Before committing, verify:
- ✅ Namespace has `switchover: true` and `delete: true`
- ✅ RDS has new `engine_version`
- ✅ Engine versions match between namespace target and RDS file
- ✅ No other unintended changes

### 5. Create Pull Request

- **Branch**: `{service}-{env}-switchover-{date}`
- **Commit**: `{service} {env} db upgrade - switch over to the new RDS {version} instance`
- **PR Title**: `Switch over to the new RDS version of {service} for {environment}`

## What This Does

When the PR is merged and applied:

1. **`switchover: true`** triggers AWS RDS to:
   - Promote the green (upgraded) instance to primary
   - Redirect all traffic to the new instance
   - Demote the blue (old) instance to standby

2. **`delete: true`** triggers AWS RDS to:
   - Delete the old blue instance after switchover completes
   - Clean up associated resources

3. **`engine_version` update** ensures:
   - Terraform state matches actual database version
   - Future deployments use correct version

## Critical Notes

- **This is irreversible** once the old instance is deleted
- **Downtime**: Typically 1-5 minutes during switchover
- **Coordinate with team** before merging
- **Monitor closely** during and after switchover
- The old instance briefly remains available for rollback

## Next Steps

After this PR is merged and switchover completes:
1. **Monitor** application for any issues
2. **Verify** new database version is running
3. **Check** application logs and metrics
4. **Proceed** to step 5 - Cleanup
