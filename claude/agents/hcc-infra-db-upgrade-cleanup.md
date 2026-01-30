---
description: Removes blue/green deployment configuration after successful database upgrade
capabilities:
  - Removes blue_green_deployment section from namespace YAML
  - Creates pull request for post-upgrade cleanup
  - Finalizes the database upgrade workflow
---

# HCC Infrastructure DB Upgrade Cleanup Agent

This agent removes the blue/green deployment configuration from the namespace file after a successful database upgrade. This is the final step in the upgrade workflow.

## When to Use This Agent

Use this agent when:
- The database switchover has completed successfully
- This is **step 4 for stage** or **step 5 for production** in the upgrade workflow
- You need to clean up the blue/green deployment configuration
- The database is running on the new version

## What This Agent Does

The agent will:

1. Remove the `blue_green_deployment` section from the namespace YAML
2. Remove the `deletion_protection: false` override if present
3. Create a pull request with the changes

## Prerequisites

- Service name (e.g., "chrome-service")
- Environment (stage or production)
- Successful completion of the switchover step
- Product name (defaults to "insights" if not specified)

## File Structure

### File Modified:

```
data/services/{product}/{service-name}/namespaces/{service-name}-{env}.yml
```

**Note**: `{product}` defaults to "insights" if not specified

## Implementation Steps

### 1. Gather Information

Ask the user for:
- Service name (e.g., "chrome-service")
- Environment (stage or production)
- Product name (default: "insights")

### 2. Locate Namespace File

Find the namespace file at:
```
data/services/{product}/{service-name}/namespaces/{service-name}-{env}.yml
```

Examples (using default product "insights"):
- Stage: `data/services/insights/chrome-service/namespaces/chrome-service-stage.yml`
- Production: `data/services/insights/chrome-service/namespaces/chrome-service-prod.yml`

### 3. Remove Blue/Green Configuration

In the namespace file, find and remove the `blue_green_deployment` section and related overrides:

**Before**:
```yaml
externalResources:
- provider: rds
  identifier: chrome-service-stage
  defaults: /terraform/resources/insights/stage/rds/postgres16-defaults-chrome-service-stage.yml
  parameter_group: /terraform/resources/insights/stage/rds/postgres16-parameter-group-chrome-service-stage.yml
  output_resource_name: chrome-service-db
  enhanced_monitoring: true
  overrides:
    apply_immediately: false
    deletion_protection: false          # ← Remove this line
  blue_green_deployment:                # ← Remove this entire section
    enabled: true
    switchover: true
    delete: true
    target:
      engine_version: "16.9"
- provider: cloudwatch
  # ... rest of config ...
```

**After**:
```yaml
externalResources:
- provider: rds
  identifier: chrome-service-stage
  defaults: /terraform/resources/insights/stage/rds/postgres16-defaults-chrome-service-stage.yml
  parameter_group: /terraform/resources/insights/stage/rds/postgres16-parameter-group-chrome-service-stage.yml
  output_resource_name: chrome-service-db
  enhanced_monitoring: true
- provider: cloudwatch
  # ... rest of config ...
```

**Note**: If the `overrides` section becomes empty after removing `deletion_protection`, remove the entire `overrides` section as well.

### 4. Create Pull Request

Create a pull request with:
- **Title**: `Cleanup green deployment entry for {service}-{env} db upgrade` or `{Service} services {env} post RDS update cleanup`
- **Branch name**: `{service}-{env}-cleanup-{date}`
- **Commit message**: Same as title

## Example

For `chrome-service` stage cleanup:

**File modified** (using default product "insights"):
```
data/services/insights/chrome-service/namespaces/chrome-service-stage.yml
```

**Removed section**:
```yaml
  overrides:
    apply_immediately: false
    deletion_protection: false
  blue_green_deployment:
    enabled: true
    switchover: true
    delete: true
    target:
      engine_version: "16.9"
```

**Pull request**: "Cleanup green deployment entry for chrome-service-stage db update"

or

**Pull request**: "Chrome services stage post RDS update cleanup"

## What This Does

Removing the blue/green deployment configuration:

1. **Signals completion**: Indicates the upgrade is complete
2. **Cleans up Terraform state**: Removes temporary upgrade configuration
3. **Prevents accidental re-runs**: Blue/green won't trigger again
4. **Returns to normal mode**: Database operates in standard configuration

## Validation

Before creating the PR, verify:
- ✅ The `blue_green_deployment` section is completely removed
- ✅ The `deletion_protection: false` override is removed (if it was only for the upgrade)
- ✅ Empty `overrides` section is removed
- ✅ No other unintended changes
- ✅ YAML syntax is valid
- ✅ Indentation is preserved correctly

## Notes

- This is the final step in the database upgrade workflow
- Only perform after confirming the switchover was successful
- The old database instance should be deleted by now
- Database is now running on the new PostgreSQL version
- Future upgrades will require adding the blue/green configuration again
- This step is mandatory to clean up the Terraform configuration

## Completion Checklist

After this PR is merged, the database upgrade is complete! Verify:

- ✅ Database is running on the new version
- ✅ Application is functioning normally
- ✅ Performance metrics are acceptable
- ✅ No errors in application logs
- ✅ Blue/green configuration is removed
- ✅ All upgrade-related PRs are merged

## Next Steps

The database upgrade workflow is complete! You can now:

1. **Document the upgrade**: Update internal documentation
2. **Monitor**: Continue monitoring for any issues
3. **Celebrate**: The upgrade was successful! 🎉

## Post-Upgrade Monitoring

After cleanup, monitor:
- Application performance
- Database query performance
- Error rates
- Resource utilization (CPU, memory, disk)
- Connection pool behavior

If any issues are discovered:
- Review PostgreSQL 16.x release notes for changes
- Check for deprecated features
- Verify query plans are optimal
- Consider re-running VACUUM and REINDEX if needed
