#!/usr/bin/env node

/**
 * Helper utilities for YAML file modifications during database upgrades
 *
 * This module provides functions for:
 * - YAML content generation for SQL query files
 * - YAML editing (switchover flags, engine versions, cleanup)
 * - File path resolution for app-interface structure
 */

// Note: fs and path can be required if needed for future file operations

/**
 * Get current date in YYYY-MM-DD format
 */
function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalize service name to short form
 * Examples:
 *   chrome-service -> chrome
 *   notifications-backend -> notifications
 *   rbac-service -> rbac
 */
function getShortServiceName(serviceName) {
  // Remove common suffixes
  return serviceName
    .replace(/-service$/, '')
    .replace(/-backend$/, '')
    .replace(/-frontend$/, '')
    .replace(/-api$/, '');
}

/**
 * Get environment abbreviation
 */
function getEnvAbbreviation(environment) {
  const abbrevMap = {
    'production': 'prod',
    'stage': 'stage',
    'staging': 'stage'
  };
  return abbrevMap[environment.toLowerCase()] || environment;
}

/**
 * Resolve file paths for app-interface repository structure
 */
class AppInterfacePaths {
  constructor(serviceName, environment, product = 'insights') {
    this.serviceName = serviceName;
    this.environment = environment;
    this.product = product;
    this.shortName = getShortServiceName(serviceName);
    this.envAbbrev = getEnvAbbreviation(environment);
  }

  /**
   * Get namespace file path
   */
  getNamespacePath() {
    return `data/services/${this.product}/${this.serviceName}/namespaces/${this.serviceName}-${this.envAbbrev}.yml`;
  }

  /**
   * Get SQL query directory path
   */
  getSqlQueryDir() {
    return `data/app-interface/sql-queries/${this.product}/${this.shortName}/${this.environment}`;
  }

  /**
   * Get SQL query file path for replication check
   */
  getReplicationCheckPath(date = getCurrentDate()) {
    const dir = this.getSqlQueryDir();
    return `${dir}/${date}-${this.envAbbrev}-check-used-replication-slots.yaml`;
  }

  /**
   * Get SQL query file path for post maintenance
   */
  getPostMaintenancePath(date = getCurrentDate()) {
    const dir = this.getSqlQueryDir();
    return `${dir}/${date}-${this.envAbbrev}-post-maintenance.yaml`;
  }

  /**
   * Get RDS directory path (files need to be searched)
   */
  getRdsDir() {
    return `resources/terraform/resources/${this.product}/${this.environment}/rds`;
  }

  /**
   * Get namespace reference for use in SQL query files
   */
  getNamespaceRef() {
    return `/services/${this.product}/${this.serviceName}/namespaces/${this.serviceName}-${this.envAbbrev}.yml`;
  }

  /**
   * Get typical RDS identifier (may need verification)
   */
  getRdsIdentifier() {
    return `${this.serviceName}-${this.envAbbrev}`;
  }

  /**
   * Get status page maintenance file path
   */
  getStatusPageMaintenancePath(date = getCurrentDate()) {
    return `data/dependencies/statuspage/maintenances/production-${this.serviceName}-db-maintenance-${date}.yml`;
  }

  /**
   * Get status page component file path
   */
  getStatusPageComponentPath() {
    return `data/dependencies/statuspage/components/status-page-component-${this.product}-${this.serviceName}.yml`;
  }

  /**
   * Get maintenance reference path for status page component
   */
  getMaintenanceRef(date = getCurrentDate()) {
    return `/dependencies/statuspage/maintenances/production-${this.serviceName}-db-maintenance-${date}.yml`;
  }
}

/**
 * YAML generation utilities
 */
class YamlGenerator {
  /**
   * Generate replication check SQL query YAML
   */
  static generateReplicationCheck(serviceName, environment, product = 'insights', date = getCurrentDate()) {
    const paths = new AppInterfacePaths(serviceName, environment, product);
    const envAbbrev = paths.envAbbrev;
    const identifier = paths.getRdsIdentifier();

    return `---
$schema: /app-interface/app-interface-sql-query-1.yml
labels: {}
name: ${date}-${envAbbrev}-check-used-replication-slots
namespace:
  $ref: ${paths.getNamespaceRef()}
identifier: ${identifier}
output: stdout
queries:
  - SELECT oid, pubname FROM pg_publication;
  - SELECT pubname, tablename FROM pg_publication_tables;
  - SELECT slot_name, slot_type FROM pg_replication_slots;
`;
  }

  /**
   * Generate post maintenance SQL query YAML
   */
  static generatePostMaintenance(serviceName, environment, product = 'insights', date = getCurrentDate(), databaseName = null) {
    const paths = new AppInterfacePaths(serviceName, environment, product);
    const envAbbrev = paths.envAbbrev;
    const identifier = paths.getRdsIdentifier();
    const dbName = databaseName || paths.shortName;

    return `---
$schema: /app-interface/app-interface-sql-query-1.yml
labels: {}
name: ${date}-${envAbbrev}-post-maintenance
namespace:
  $ref: ${paths.getNamespaceRef()}
identifier: ${identifier}
output: stdout
queries:
  - VACUUM (VERBOSE, ANALYZE);
  - REINDEX (VERBOSE) DATABASE ${dbName};
`;
  }

  /**
   * Generate status page maintenance YAML
   *
   * @param {string} serviceName - Service name (e.g., "chrome-service")
   * @param {string} product - Product name (default: "insights")
   * @param {string} date - Maintenance date (YYYY-MM-DD)
   * @param {string} scheduledStart - Start time in ISO format (e.g., "2025-10-08T04:00:00Z")
   * @param {string} scheduledEnd - End time in ISO format (e.g., "2025-10-08T07:00:00Z")
   * @param {string} message - Custom maintenance message
   * @returns {string} Status page maintenance YAML content
   */
  static generateStatusPageMaintenance(serviceName, product = 'insights', date, scheduledStart, scheduledEnd, message) {
    return `$schema: /app-sre/maintenance-1.yml

affectedServices:
- $ref: /services/${product}/${serviceName}/app.yml

announcements:
- provider: statuspage
  page:
    $ref: /dependencies/statuspage/status-redhat-com.yml
  notifySubscribersOnCompletion: true
  notifySubscribersOnStart: true
  remindSubscribers: true

message: |
  ${message}

name: Hybrid Cloud Console ${serviceName} database maintenance ${date}

scheduledStart: "${scheduledStart}"
scheduledEnd: "${scheduledEnd}"
`;
  }
}

/**
 * YAML manipulation utilities
 */
class YamlEditor {
  /**
   * Update blue_green_deployment switchover and delete flags
   */
  static updateSwitchoverFlags(yamlContent) {
    // Replace switchover: false with switchover: true
    let updated = yamlContent.replace(
      /(\s+switchover:\s+)false/,
      '$1true'
    );

    // Replace delete: false with delete: true
    updated = updated.replace(
      /(\s+delete:\s+)false/,
      '$1true'
    );

    return updated;
  }

  /**
   * Update engine_version in RDS YAML
   */
  static updateEngineVersion(yamlContent, newVersion) {
    // Ensure version is quoted
    const quotedVersion = newVersion.includes('"') ? newVersion : `"${newVersion}"`;

    return yamlContent.replace(
      /engine_version:\s+["']?[\d.]+["']?/,
      `engine_version: ${quotedVersion}`
    );
  }

  /**
   * Remove blue_green_deployment section from namespace YAML
   */
  static removeBlueGreenDeployment(yamlContent) {
    // Match the entire blue_green_deployment section
    // This regex handles indentation and nested structure
    const regex = /\n\s+blue_green_deployment:\n(?:\s+.*\n)*/;
    return yamlContent.replace(regex, '\n');
  }

  /**
   * Update or add status section in component YAML
   *
   * @param {string} yamlContent - Current component YAML content
   * @param {string} maintenanceRef - Reference path to maintenance file
   * @returns {string} Updated YAML content
   */
  static updateComponentStatus(yamlContent, maintenanceRef) {
    const statusSection = `status:
- provider: maintenance
  maintenance:
    $ref: ${maintenanceRef}
`;

    // Check if status section already exists
    if (yamlContent.includes('status:')) {
      // Replace existing status section
      const regex = /status:\n(?:[ \t]*-.*\n(?:[ \t]+.*\n)*)+/;
      return yamlContent.replace(regex, statusSection);
    } else {
      // Add status section at the end
      return yamlContent.trim() + '\n\n' + statusSection;
    }
  }

  /**
   * Validate YAML syntax (basic check)
   */
  static validateYaml(yamlContent) {
    const errors = [];

    // Check for required schema
    if (!yamlContent.includes('$schema:')) {
      errors.push('Missing $schema field');
    }

    // Check for proper YAML start
    if (!yamlContent.trim().startsWith('---')) {
      errors.push('YAML should start with ---');
    }

    // Check for common indentation issues
    const lines = yamlContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().length === 0) continue;

      const indent = line.search(/\S/);
      if (indent !== -1 && indent % 2 !== 0) {
        errors.push(`Line ${i + 1}: Indentation should be multiples of 2 spaces`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export all utilities
module.exports = {
  getCurrentDate,
  getShortServiceName,
  getEnvAbbreviation,
  AppInterfacePaths,
  YamlGenerator,
  YamlEditor
};

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'generate-replication-check') {
    const [_, serviceName, environment, product, date] = args;
    console.log(YamlGenerator.generateReplicationCheck(serviceName, environment, product, date));
  } else if (command === 'generate-post-maintenance') {
    const [_, serviceName, environment, product, date, dbName] = args;
    console.log(YamlGenerator.generatePostMaintenance(serviceName, environment, product, date, dbName));
  } else if (command === 'generate-status-page') {
    const [_, serviceName, product, date, scheduledStart, scheduledEnd] = args;
    const message = args.slice(6).join(' '); // Remaining args are the message
    console.log(YamlGenerator.generateStatusPageMaintenance(
      serviceName,
      product || 'insights',
      date,
      scheduledStart,
      scheduledEnd,
      message
    ));
  } else if (command === 'get-paths') {
    const [_, serviceName, environment, product] = args;
    const paths = new AppInterfacePaths(serviceName, environment, product);
    console.log(JSON.stringify({
      namespace: paths.getNamespacePath(),
      sqlQueryDir: paths.getSqlQueryDir(),
      replicationCheck: paths.getReplicationCheckPath(),
      postMaintenance: paths.getPostMaintenancePath(),
      rdsDir: paths.getRdsDir(),
      namespaceRef: paths.getNamespaceRef(),
      rdsIdentifier: paths.getRdsIdentifier(),
      statusPageMaintenance: paths.getStatusPageMaintenancePath(),
      statusPageComponent: paths.getStatusPageComponentPath(),
      maintenanceRef: paths.getMaintenanceRef()
    }, null, 2));
  } else {
    console.log(`
Database Upgrader Helper - YAML Utilities

Usage:
  node helper.js <command> [args...]

Commands:
  generate-replication-check <service> <env> [product] [date]
    Generate SQL query YAML content for replication slot check

  generate-post-maintenance <service> <env> [product] [date] [dbName]
    Generate SQL query YAML content for post-maintenance

  generate-status-page <service> <product> <date> <start> <end> <message...>
    Generate status page maintenance YAML content
    <start> and <end> should be ISO format: "2025-10-08T04:00:00Z"

  get-paths <service> <env> [product]
    Get all file paths for the service (includes status page paths)

Examples:
  node helper.js generate-replication-check chrome-service stage
  node helper.js generate-post-maintenance chrome-service stage insights 2025-01-30
  node helper.js generate-status-page chrome-service insights 2025-10-08 "2025-10-08T04:00:00Z" "2025-10-08T07:00:00Z" "DB maintenance message..."
  node helper.js get-paths chrome-service production
`);
  }
}
