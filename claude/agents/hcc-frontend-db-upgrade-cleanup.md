---
description: Removes blue/green deployment configuration after successful database upgrade
capabilities:
  - Removes blue_green_deployment section from namespace YAML
  - Creates pull request for cleanup
---

# HCC Frontend DB Upgrade Cleanup Agent

This agent removes the blue/green deployment configuration from the namespace file after a successful database upgrade. This is the final step in the upgrade workflow.

## When to Use This Agent

Use this agent when:
- This is **step 4 for stage** or **step 5 for production** (final step)
- After the switchover has completed successfully
- The new database version is confirmed running
- Application is healthy and stable

## Prerequisites

Get from the user:
- Service name (e.g., "chrome-service")
- Environment (stage or production)
- Product name (default: "insights")

## Implementation Steps

### 1. Gather Information

Ask the user for:
- Service name
- Environment
- Product (defaults to "insights")

### 2. Locate Namespace File

**Namespace file:**
```
data/services/{product}/{service}/namespaces/{service}-{env}.yml
```

Use helper to get path:
```javascript
const paths = new AppInterfacePaths(serviceName, environment, product);
const namespacePath = paths.getNamespacePath();
```

### 3. Use the db-upgrader Skill

**Remove blue/green deployment section:**
```javascript
// Read current content
const namespaceContent = await read(namespacePath);

// Remove blue_green_deployment section
const cleanedContent = YamlEditor.removeBlueGreenDeployment(namespaceContent);

// Write back
await write(namespacePath, cleanedContent);
```

This removes the entire `blue_green_deployment` block from the namespace YAML.

### 4. Validate Changes

Before committing, verify:
- ✅ The `blue_green_deployment` section is completely removed
- ✅ No other parts of the file were modified
- ✅ YAML syntax is still valid
- ✅ The rest of the namespace configuration is intact

### 5. Create Pull Request

- **Branch**: `{service}-{env}-cleanup-{date}`
- **Commit**: `{service} {env} db upgrade - cleanup green deployment`
- **PR Title**: `Cleanup green deployment entry for {service} {environment}`

## What This Does

Removes the blue/green deployment configuration:

**Before:**
```yaml
externalResources:
- provider: rds
  name: chrome-service-stage
  provisioner:
    $ref: /aws/account/app-sre.yml
  blue_green_deployment:
    enabled: true
    switchover: true
    delete: true
    target:
      engine_version: "16.9"
```

**After:**
```yaml
externalResources:
- provider: rds
  name: chrome-service-stage
  provisioner:
    $ref: /aws/account/app-sre.yml
```

This signals that:
- The upgrade is complete
- No blue/green deployment is in progress
- The service is running on the new version normally

## Notes

- Only perform cleanup after confirming switchover succeeded
- The blue/green configuration is no longer needed
- This allows future upgrades to start fresh

## Completion

After this PR is merged:
- ✅ Database upgrade workflow is complete!
- The service is now running on the upgraded PostgreSQL version
- Future upgrades can follow the same workflow
