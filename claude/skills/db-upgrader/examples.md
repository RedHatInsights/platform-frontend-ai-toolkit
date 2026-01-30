# Database Upgrader Examples

This document provides complete, step-by-step examples of database upgrade workflows showing exactly what YAML changes are made at each step.

## Table of Contents

1. [Stage Upgrade Example](#stage-upgrade-example)
2. [Production Upgrade Example](#production-upgrade-example)
3. [Common Variations](#common-variations)

---

## Stage Upgrade Example

This example shows upgrading `chrome-service` from PostgreSQL 16.4 to 16.9 in the stage environment.

**Service:** chrome-service
**Environment:** stage
**Product:** insights (default)
**Current version:** 16.4
**Target version:** 16.9
**Date:** 2025-10-06

### Step 1: Check Replication Slots

**Invoke:**
```
/db-upgrader chrome-service stage 16.9
```

**File created:**
```
data/app-interface/sql-queries/insights/chrome/stage/2025-10-06-stage-check-used-replication-slots.yaml
```

**Content:**
```yaml
---
$schema: /app-interface/app-interface-sql-query-1.yml
labels: {}
name: 2025-10-06-stage-check-used-replication-slots
namespace:
  $ref: /services/insights/chrome-service/namespaces/chrome-service-stage.yml
identifier: chrome-service-stage
output: stdout
queries:
  - SELECT oid, pubname FROM pg_publication;
  - SELECT pubname, tablename FROM pg_publication_tables;
  - SELECT slot_name, slot_type FROM pg_replication_slots;
```

**Git operations:**
```bash
git checkout -b chrome-service-stage-check-replication-slots-2025-10-06
git add data/app-interface/sql-queries/insights/chrome/stage/2025-10-06-stage-check-used-replication-slots.yaml
git commit -m "Check if no replication slots are used for chrome-service stage"
gh pr create --title "Check if no replication slots are used for chrome-service stage" --body "..."
```

**Expected results:**
- If queries return empty: proceed to step 2
- If replication slots found: remove them manually, then retry

---

### Step 2: Post Maintenance Script

**Invoke:**
```
/db-upgrader chrome-service stage 16.9
```

**File created:**
```
data/app-interface/sql-queries/insights/chrome/stage/2025-10-06-stage-post-maintenance.yaml
```

**Content:**
```yaml
---
$schema: /app-interface/app-interface-sql-query-1.yml
labels: {}
name: 2025-10-06-stage-post-maintenance
namespace:
  $ref: /services/insights/chrome-service/namespaces/chrome-service-stage.yml
identifier: chrome-service-stage
output: stdout
queries:
  - VACUUM (VERBOSE, ANALYZE);
  - REINDEX (VERBOSE) DATABASE chrome;
```

**Git operations:**
```bash
git checkout -b chrome-service-stage-post-maintenance-2025-10-06
git add data/app-interface/sql-queries/insights/chrome/stage/2025-10-06-stage-post-maintenance.yaml
git commit -m "Post maintenance script for chrome-service stage"
gh pr create --title "Post maintenance script for chrome-service stage" --body "..."
```

**Note:** The REINDEX query uses the database name (typically the short service name).

---

### Step 3: Switchover

**Invoke:**
```
/db-upgrader chrome-service stage 16.9
```

**Files modified:**

1. `data/services/insights/chrome-service/namespaces/chrome-service-stage.yml`
2. `resources/terraform/resources/insights/stage/rds/postgres16-rds-chrome-backend-service-stage.yml`

**Changes to namespace file:**

**Before:**
```yaml
externalResources:
- provider: rds
  name: chrome-service-stage
  provisioner:
    $ref: /aws/account/app-sre.yml
  blue_green_deployment:
    enabled: true
    switchover: false
    delete: false
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
  blue_green_deployment:
    enabled: true
    switchover: true      # ← Changed
    delete: true          # ← Changed
    target:
      engine_version: "16.9"
```

**Changes to RDS file:**

**Before:**
```yaml
---
$schema: /aws/rds-1.yml
name: postgres16-rds-chrome-backend-service-stage
provider: rds
identifier: chrome-backend-service-stage
output_resource_name: chrome-service-stage
engine: postgres
engine_version: "16.4"    # ← Old version
instance_class: db.t4g.medium
allocated_storage: 100
# ... rest of config
```

**After:**
```yaml
---
$schema: /aws/rds-1.yml
name: postgres16-rds-chrome-backend-service-stage
provider: rds
identifier: chrome-backend-service-stage
output_resource_name: chrome-service-stage
engine: postgres
engine_version: "16.9"    # ← Updated
instance_class: db.t4g.medium
allocated_storage: 100
# ... rest of config
```

**Git operations:**
```bash
git checkout -b chrome-service-stage-switchover-2025-10-06
git add data/services/insights/chrome-service/namespaces/chrome-service-stage.yml
git add resources/terraform/resources/insights/stage/rds/postgres16-rds-chrome-backend-service-stage.yml
git commit -m "chrome-service stage db upgrade - switch over to the new RDS 16.9 instance"
gh pr create --title "Switch over to the new RDS version of chrome-service for stage" --body "..."
```

**Critical:** This PR triggers the actual database switchover when merged. Monitor closely!

---

### Step 4: Cleanup

**Invoke:**
```
/db-upgrader chrome-service stage 16.9
```

**File modified:**
```
data/services/insights/chrome-service/namespaces/chrome-service-stage.yml
```

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
  # blue_green_deployment section removed entirely
```

**Git operations:**
```bash
git checkout -b chrome-service-stage-cleanup-2025-10-06
git add data/services/insights/chrome-service/namespaces/chrome-service-stage.yml
git commit -m "chrome-service stage db upgrade - cleanup green deployment"
gh pr create --title "Cleanup green deployment entry for chrome-service stage" --body "..."
```

**Done!** Stage upgrade complete. The service now runs on PostgreSQL 16.9.

---

## Production Upgrade Example

Production upgrades include an additional status page step at the beginning.

**Service:** chrome-service
**Environment:** production
**Product:** insights
**Current version:** 16.4
**Target version:** 16.9
**Date:** 2025-10-08

### Step 0: Update Status Page

**Invoke:**
```
/db-upgrader chrome-service production 16.9
```

**File created:**
```
data/status-page/incidents/chrome-service-2025-10-08-maintenance.yaml
```

**Content (example):**
```yaml
---
name: chrome-service-maintenance-2025-10-08
status_page:
  $ref: /status-pages/console.redhat.com.yml
scheduled_for: "2025-10-08T14:00:00Z"
scheduled_until: "2025-10-08T15:00:00Z"
scheduled_remind_prior: true
scheduled_auto_in_progress: true
scheduled_auto_completed: true
components:
  - $ref: /status-pages/components/chrome-service.yml
message: "We will be performing scheduled database maintenance for chrome-service. Brief downtime may occur during the switchover."
```

**Git operations:**
```bash
git checkout -b chrome-service-prod-status-page-2025-10-08
git add data/status-page/incidents/chrome-service-2025-10-08-maintenance.yaml
git commit -m "Update status page for chrome-service production maintenance"
gh pr create --title "Update status page for chrome-service" --body "..."
```

---

### Step 1: Check Replication Slots

**Invoke:**
```
/db-upgrader chrome-service production 16.9
```

**File created:**
```
data/app-interface/sql-queries/insights/chrome/production/2025-10-08-prod-check-used-replication-slots.yaml
```

**Content:**
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

**Git operations:**
```bash
git checkout -b chrome-service-prod-check-replication-slots-2025-10-08
git add data/app-interface/sql-queries/insights/chrome/production/2025-10-08-prod-check-used-replication-slots.yaml
git commit -m "Check if no replication slots are used for chrome-service production"
gh pr create --title "Check if no replication slots are used for chrome-service production" --body "..."
```

---

### Steps 2-4

Steps 2-4 are identical to the stage workflow, but using:
- Environment: `production`
- Namespace file: `chrome-service-prod.yml`
- RDS file: `postgres16-rds-chrome-backend-service-prod.yml`
- Date: `2025-10-08`

See the [Stage Upgrade Example](#stage-upgrade-example) for detailed YAML changes.

---

## Common Variations

### Variation 1: Service with Different Identifier

Some services have RDS identifiers that differ from the service name.

**Example:** `notifications-backend` service

**Service name:** notifications-backend
**RDS identifier:** notifications-backend-db
**Short name:** notifications

**Replication check file:**
```
data/app-interface/sql-queries/insights/notifications/stage/2025-10-06-stage-check-used-replication-slots.yaml
```

**Key difference in content:**
```yaml
identifier: notifications-backend-db  # ← Different from service name
```

**Finding the identifier:** Look in the existing namespace file under `externalResources[].name`.

---

### Variation 2: Non-Default Product

**Example:** `advisor-backend` in the `console` product

**Invoke:**
```
/db-upgrader advisor-backend stage 16.9 console
```

**File paths change:**
```
# Namespace
data/services/console/advisor-backend/namespaces/advisor-backend-stage.yml

# SQL queries
data/app-interface/sql-queries/console/advisor/stage/2025-10-06-stage-check-used-replication-slots.yaml

# RDS
resources/terraform/resources/console/stage/rds/postgres16-rds-advisor-*.yml
```

**Namespace reference in SQL query:**
```yaml
namespace:
  $ref: /services/console/advisor-backend/namespaces/advisor-backend-stage.yml
```

---

### Variation 3: Instance Class Change

Sometimes upgrades include instance class changes (e.g., moving to Graviton).

**Namespace file includes instance_class:**
```yaml
blue_green_deployment:
  enabled: true
  switchover: false
  delete: false
  target:
    engine_version: "16.9"
    instance_class: "db.t4g.medium"  # ← Graviton instance
```

**Commit message changes:**
```
chrome-service stage db upgrade - switch over to the new RDS 16.9 graviton instance class
```

**PR title:**
```
Switch over to the new RDS version of chrome-service for stage (with graviton upgrade)
```

---

### Variation 4: Multiple Replication Checks

Sometimes you need to run the replication check multiple times (e.g., slots keep reappearing).

**Solution:** Add "-bis" suffix to filename:

```
2025-10-06-stage-check-used-replication-slots-bis.yaml
```

**Content is identical** except for the name field:
```yaml
name: 2025-10-06-stage-check-used-replication-slots-bis
```

---

## Troubleshooting Examples

### Example 1: Cannot Find RDS File

**Problem:** The RDS file naming doesn't match the service name exactly.

**Search pattern:**
```bash
find resources/terraform/resources/insights/stage/rds -name "*chrome*"
```

**Result:**
```
resources/terraform/resources/insights/stage/rds/postgres16-rds-chrome-backend-service-stage.yml
```

**Solution:** Use the found filename for the RDS modification step.

---

### Example 2: Wrong Namespace Reference

**Problem:** SQL query fails because namespace reference is incorrect.

**Wrong:**
```yaml
namespace:
  $ref: services/insights/chrome-service/namespaces/chrome-service-stage.yml
```

**Correct:**
```yaml
namespace:
  $ref: /services/insights/chrome-service/namespaces/chrome-service-stage.yml
```

**Note:** Must have leading slash.

---

### Example 3: Version Mismatch After Switchover

**Problem:** Namespace target version doesn't match RDS engine_version.

**Namespace:**
```yaml
target:
  engine_version: "16.9"
```

**RDS:**
```yaml
engine_version: "16.4"  # ← Still old version!
```

**Solution:** Both must be updated to `"16.9"` in the switchover step.

---

## Quick Reference

### File Paths by Step

| Step | Files Created/Modified |
|------|------------------------|
| Status page | `data/status-page/incidents/{service}-{date}-maintenance.yaml` |
| Replication check | `data/app-interface/sql-queries/{product}/{service-short}/{env}/{date}-{env}-check-used-replication-slots.yaml` |
| Post maintenance | `data/app-interface/sql-queries/{product}/{service-short}/{env}/{date}-{env}-post-maintenance.yaml` |
| Switchover | Namespace file (update) + RDS file (update) |
| Cleanup | Namespace file (update) |

### PR Titles by Step

| Step | PR Title |
|------|----------|
| Status page | `Update status page for {service}` |
| Replication check | `Check if no replication slots are used for {service} {environment}` |
| Post maintenance | `Post maintenance script for {service} {environment}` |
| Switchover | `Switch over to the new RDS version of {service} for {environment}` |
| Cleanup | `Cleanup green deployment entry for {service} {environment}` |

### Commit Message Patterns

| Step | Pattern |
|------|---------|
| Status page | `Update status page for {service} production maintenance` |
| Replication check | `Check if no replication slots are used for {service} {environment}` |
| Post maintenance | `Post maintenance script for {service} {environment}` |
| Switchover | `{service} {env} db upgrade - switch over to the new RDS {version} instance` |
| Cleanup | `{service} {env} db upgrade - cleanup green deployment` |
