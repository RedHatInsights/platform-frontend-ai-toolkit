# Database Upgrade Agents

This document describes the multi-agent system for performing RDS database upgrades in the app-interface repository using AWS RDS blue/green deployment.

## Overview

The DB upgrade workflow consists of **6 specialized agents**:

1. **Orchestrator** - Analyzes state and delegates to the appropriate sub-agent
2. **Status Page** - Creates maintenance announcements (production only)
3. **Replication Check** - Verifies no active replication slots
4. **Post-Maintenance** - Creates VACUUM and REINDEX scripts
5. **Switchover** - Performs the actual database version switchover
6. **Cleanup** - Removes blue/green deployment configuration

## Prerequisites

### Repository Access

The agents require access to the app-interface repository. By default, they expect it at:
```
/Users/khala/Documents/git/service/app-interface
```

You can modify the path in each agent's implementation as needed.

### Information Needed

Before starting a database upgrade, gather:
- **Service name** (e.g., "chrome-service")
- **Environment** (stage or production)
- **Product name** (defaults to "insights" if not specified - can be "console", "platform", etc.)
- **Target PostgreSQL version** (e.g., "16.9")
- **Maintenance date** (YYYY-MM-DD format)
- **Database name** (e.g., "chrome_service")

## Workflow

### Stage Upgrade (4 PRs)

```
1. Check replication slots
   └─> hcc-infra-db-upgrade-replication-check

2. Post maintenance script
   └─> hcc-infra-db-upgrade-post-maintenance

3. Switchover
   └─> hcc-infra-db-upgrade-switchover

4. Cleanup
   └─> hcc-infra-db-upgrade-cleanup
```

### Production Upgrade (5 PRs)

```
1. Update status page
   └─> hcc-infra-db-upgrade-status-page

2. Check replication slots
   └─> hcc-infra-db-upgrade-replication-check

3. Post maintenance script
   └─> hcc-infra-db-upgrade-post-maintenance

4. Switchover
   └─> hcc-infra-db-upgrade-switchover

5. Cleanup
   └─> hcc-infra-db-upgrade-cleanup
```

## Using the Agents

### Option 1: Using the Orchestrator (Recommended)

The orchestrator automatically determines the current state and delegates to the appropriate sub-agent:

```
Task with subagent_type='hcc-infra-db-upgrade-orchestrator' to upgrade chrome-service database to PostgreSQL 16.9 in production
```

**For services in other products** (non-insights):
```
Task with subagent_type='hcc-infra-db-upgrade-orchestrator' to upgrade my-service database to PostgreSQL 16.9 in production for product console
```

The orchestrator will:
1. Analyze the git history
2. Determine which step was last completed
3. Automatically call the next sub-agent

**Note**: If no product is specified, it defaults to "insights"

### Option 2: Calling Sub-Agents Directly

You can also call sub-agents directly if you know which step to perform:

#### Step 1: Status Page (Production Only)

```
Task with subagent_type='hcc-infra-db-upgrade-status-page' to create status page for chrome-service maintenance on 2025-10-08
```

#### Step 2/1: Replication Check

```
Task with subagent_type='hcc-infra-db-upgrade-replication-check' to check replication slots for chrome-service production
```

#### Step 3/2: Post-Maintenance

```
Task with subagent_type='hcc-infra-db-upgrade-post-maintenance' to create post-maintenance scripts for chrome-service production on 2025-10-08
```

#### Step 4/3: Switchover

```
Task with subagent_type='hcc-infra-db-upgrade-switchover' to switch chrome-service production to PostgreSQL 16.9
```

#### Step 5/4: Cleanup

```
Task with subagent_type='hcc-infra-db-upgrade-cleanup' to cleanup chrome-service production blue/green deployment
```

## Agent Details

### hcc-infra-db-upgrade-orchestrator

**Purpose**: Orchestrates the entire upgrade workflow

**What it does**:
- Analyzes git history to determine current state
- Identifies the next step in the workflow
- Delegates to the appropriate sub-agent
- Provides progress tracking

**Example prompts**:
- "I need to upgrade chrome-service database to PostgreSQL 16.9 in production"
- "Continue the database upgrade for rbac-service in stage"
- "What's the next step for the chrome-service database upgrade?"

### hcc-infra-db-upgrade-status-page

**Purpose**: Creates status page maintenance announcement (production only)

**Files created/modified**:
- `data/dependencies/statuspage/maintenances/production-{service}-db-maintenance-{date}.yml`
- `data/dependencies/statuspage/components/status-page-component-insights-{service}.yml`

**Pull request**: "Update status page for {service} on {date}"

### hcc-infra-db-upgrade-replication-check

**Purpose**: Verifies no active replication slots before upgrade

**Files created**:
- `data/app-interface/sql-queries/insights/{service-short}/{env}/{date}-{env}-check-used-replication-slots.yaml`

**Pull request**: "Check if no replication slots are used for {service} {environment}"

**What to check**: The SQL query should return empty results. If replication slots are found, they must be manually removed before proceeding.

### hcc-infra-db-upgrade-post-maintenance

**Purpose**: Creates post-upgrade maintenance scripts (VACUUM and REINDEX)

**Files created**:
- `data/app-interface/sql-queries/insights/{service-short}/{env}/{date}-{env}-post-upgrade-maintenance-scripts.yaml`

**Pull request**: "Post ma[i]ntenance script for {service-identifier}-{date}"

**Scripts included**:
- `VACUUM VERBOSE ANALYZE;`
- `REINDEX (VERBOSE) DATABASE CONCURRENTLY "{database_name}";`

### hcc-infra-db-upgrade-switchover

**Purpose**: Performs the actual RDS blue/green switchover

**Files modified**:
- `data/services/insights/{service}/namespaces/{service}-{env}.yml` (sets switchover: true, delete: true)
- `resources/terraform/resources/insights/{env}/rds/postgres{version}-rds-{service}-{env}.yml` (updates engine_version)

**Pull request**: "Switch over to the new RDS version of {service} for {environment}"

**⚠️ Critical**: This step triggers the actual database switchover. Coordinate with the team before merging.

### hcc-infra-db-upgrade-cleanup

**Purpose**: Removes blue/green deployment configuration after successful upgrade

**Files modified**:
- `data/services/insights/{service}/namespaces/{service}-{env}.yml` (removes blue_green_deployment section)

**Pull request**: "Cleanup green deployment entry for {service}-{env} db upgrade"

**✅ Completion**: This is the final step. The upgrade is complete when this PR is merged.

## Best Practices

### 1. Use the Orchestrator

Let the orchestrator manage the workflow. It will:
- Track progress automatically
- Prevent skipping steps
- Ensure consistency

### 2. Verify Each Step

After each PR is merged:
- Check that the change was applied correctly
- Verify any SQL queries ran successfully
- Monitor application health

### 3. Stage Before Production

Always perform the upgrade in stage first:
1. Complete the entire stage workflow (4 PRs)
2. Verify the application works on the new database version
3. Then proceed with production (5 PRs)

### 4. Coordinate Switchover

The switchover step triggers actual downtime:
- Notify the team before merging
- Monitor application during switchover
- Be ready to rollback if needed

### 5. Post-Upgrade Monitoring

After cleanup, monitor:
- Application performance
- Database query performance
- Error rates
- Resource utilization

## Troubleshooting

### Issue: Replication slots found

**Solution**: Manually remove replication slots before proceeding:
1. Identify the slots from the query output
2. Drop them using `SELECT pg_drop_replication_slot('slot_name');`
3. Re-run the replication check

### Issue: Switchover failed

**Solution**:
1. Check AWS RDS console for errors
2. Verify blue/green deployment status
3. Coordinate with infrastructure team
4. May need to rollback changes

### Issue: Agent can't find service

**Solution**:
1. Verify service name is correct
2. Check that the service exists in `data/services/insights/`
3. Ensure namespace files exist for the environment

### Issue: Can't determine current state

**Solution**:
1. Check git history manually: `git log --oneline --grep="{service}"`
2. Identify the last completed step
3. Call the next sub-agent directly

## Examples

### Example 1: Full Production Upgrade

```
User: I need to upgrade chrome-service to PostgreSQL 16.9 in production

Agent (Orchestrator): I'll help you upgrade chrome-service to PostgreSQL 16.9 in production.
Let me analyze the git history to determine the current state...

[Checks git history]

I see this is the beginning of the upgrade. For production, we need to start with
the status page update. I'm delegating to hcc-infra-db-upgrade-status-page...

Agent (Status Page): I'll create the status page maintenance announcement.
What date is the maintenance scheduled for?

User: 2025-10-08 at 4:00 AM UTC, expected 3 hours duration

Agent (Status Page): Creating status page files...
[Creates PR: "Update status page for chrome-service on 2025-10-08"]

Done! Next step: Check replication slots (use the orchestrator after this PR is merged)
```

### Example 2: Continuing a Partially Complete Upgrade

```
User: Continue the chrome-service production database upgrade

Agent (Orchestrator): Let me check the current state...
[Analyzes git history]

I can see:
✅ Status page updated (2025-10-08)
✅ Replication slots checked
✅ Post-maintenance scripts created
❌ Switchover not yet performed

The next step is the switchover. I'm delegating to hcc-infra-db-upgrade-switchover...

Agent (Switchover): I'll perform the RDS switchover for chrome-service production.
What is the target PostgreSQL version?

User: 16.9

Agent (Switchover): Updating namespace and RDS configuration files...
[Creates PR: "Switch over to the new RDS version of chrome service for production"]

⚠️  IMPORTANT: This PR will trigger the actual database switchover.
Please coordinate with your team before merging.

Done! Next step: Cleanup (use the orchestrator after switchover is complete)
```

### Example 3: Stage Upgrade (Simpler Workflow)

```
User: Upgrade rbac-service to PostgreSQL 16.9 in stage

Agent (Orchestrator): I'll help upgrade rbac-service in stage.
Stage upgrades skip the status page step.

Let me check the current state...
[Analyzes git history]

Starting from step 1: Replication check. Delegating to hcc-infra-db-upgrade-replication-check...

Agent (Replication Check): Creating replication slots check for rbac-service stage.
What date should I use for the filename?

User: 2025-10-22

Agent (Replication Check): Creating SQL query file...
[Creates PR: "Check if no replication slots are used for rbac-service stage"]

Done! Review the SQL query results before proceeding to the next step.
```

## Integration with Existing Workflows

### Preparation: Blue/Green Deployment Setup

Before starting the DB upgrade workflow with these agents, ensure the blue/green deployment configuration has been added to the namespace file. This is typically done in a separate PR:

```yaml
externalResources:
- provider: rds
  # ... other config ...
  overrides:
    apply_immediately: false
    deletion_protection: false
  blue_green_deployment:
    enabled: true
    switchover: false
    delete: false
    target:
      engine_version: "16.9"
```

If this hasn't been done, you can manually create this PR or extend the orchestrator to handle it.

### Post-Upgrade Verification

After the cleanup step completes:

1. **Verify database version**:
   ```sql
   SELECT version();
   ```

2. **Check application health**:
   - Monitor error rates
   - Verify all services are running
   - Check performance metrics

3. **Review maintenance scripts output**:
   - VACUUM ANALYZE completed successfully
   - REINDEX completed successfully
   - No errors in the logs

4. **Document the upgrade**:
   - Update internal documentation
   - Note any issues encountered
   - Record the upgrade completion

## Contributing

### Adding Support for New Services

To support a new service:

1. Verify the service exists in `data/services/{product}/{service-name}/`
2. Ensure namespace files exist for stage and production
3. Identify the database name (usually `{service_name}` with underscores)
4. Specify the product name when calling the agents (or omit for default "insights")
5. The agents should work automatically!

**Example for a non-insights product**:
```
Task with subagent_type='hcc-infra-db-upgrade-orchestrator' to upgrade console-api to PostgreSQL 16.9 in stage for product console
```

### Extending the Agents

The agents are designed to be modular. You can extend them by:

- Adding support for different database types (MySQL, etc.)
- Customizing the PR templates
- Adding additional validation steps
- Integrating with monitoring systems

## Related Documentation

- [AWS RDS Blue/Green Deployments](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/blue-green-deployments.html)
- [PostgreSQL VACUUM](https://www.postgresql.org/docs/current/sql-vacuum.html)
- [PostgreSQL REINDEX](https://www.postgresql.org/docs/current/sql-reindex.html)
- [App-Interface Documentation](../../service/app-interface/README.md)

## Support

If you encounter issues:

1. Check this documentation
2. Review the agent descriptions in `claude/agents/`
3. Examine git history for similar upgrades
4. Ask the team for help

## Changelog

### Version 1.4.0 (2026-01-30)

- Initial release of DB upgrade agents
- 6 specialized agents for complete upgrade workflow
- Support for stage and production environments
- **Configurable product support** (defaults to "insights", but works with any product like "console", "platform", etc.)
- Automatic state detection and delegation
- Comprehensive documentation and examples