# Complete Application Configuration

All FEO features in one config.

```yaml
apiVersion: v1
kind: Template
metadata:
  name: monitoring
objects:
  - apiVersion: cloud.redhat.com/v1alpha1
    kind: Frontend
    metadata:
      name: monitoring
    spec:
      envName: ${ENV_NAME}
      title: "System Monitoring"
      image: ${IMAGE}:${IMAGE_TAG}
      feoConfigEnabled: true

      frontend:
        paths:
          - "/apps/monitoring"

      module:
        manifestLocation: "/apps/monitoring/fed-mods.json"
        defaultDocumentTitle: "System Monitoring | Console"
        modules:
          - id: monitoring
            module: "./RootApp"
            routes:
              - pathname: /insights/monitoring
                props: {bundle: insights}
              - pathname: /insights/monitoring/systems
                props: {bundle: insights, view: systems}
              - pathname: /insights/monitoring/alerts
                props: {bundle: insights, view: alerts}
        analytics:
          APIKey: "PROD-KEY"
          APIKeyDev: "DEV-KEY"

      bundleSegments:
        - segmentId: monitoring-insights
          bundleId: insights
          position: 450
          navItems:
            - id: monitoring
              title: "Monitoring"
              href: /insights/monitoring
              product: "Red Hat Insights"

      serviceTiles:
        - id: monitoring
          section: insights
          group: observability
          title: "System Monitoring"
          href: /insights/monitoring
          description: "Monitor system health and performance metrics"
          icon: "Monitor"

      searchEntries:
        - id: monitoring
          title: "System Monitoring"
          href: /insights/monitoring
          description: "Monitor system health and performance"
          alt_title:
            - "monitoring"
            - "health monitoring"
            - "performance"
```

## Multi-Bundle Example

```yaml
module:
  modules:
    - id: my-app
      module: "./RootApp"
      routes:
        - pathname: /insights/my-app
          props: {bundle: insights}
        - pathname: /openshift/my-app
          props: {bundle: openshift}

bundleSegments:
  - segmentId: my-app-insights
    bundleId: insights
    position: 500
    navItems:
      - id: my-app
        title: "My App"
        href: /insights/my-app
        product: "Insights"
  - segmentId: my-app-openshift
    bundleId: openshift
    position: 300
    navItems:
      - id: my-app
        title: "My App"
        href: /openshift/my-app
        product: "OpenShift"
```
