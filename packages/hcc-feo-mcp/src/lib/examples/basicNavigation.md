# Basic Navigation Configuration

Add your application to console left navigation.

## Minimal Example

```yaml
spec:
  feoConfigEnabled: true
  bundleSegments:
    - segmentId: my-app-insights      # Format: {app}-{bundle}
      bundleId: insights                # insights, openshift, ansible, settings
      position: 800                     # 0-1000, lower = higher in menu
      navItems:
        - id: my-app
          title: "My Application"
          href: /insights/my-app
          product: "Red Hat Insights"
```

## Position Ranges
- 0-200: Core features
- 200-500: Secondary features
- 500-800: Standard apps
- 800-1000: Admin/settings

## Multiple Nav Items

```yaml
bundleSegments:
  - segmentId: my-app-insights
    bundleId: insights
    position: 800
    navItems:
      - id: overview
        title: "Overview"
        href: /insights/my-app/overview
        product: "Red Hat Insights"
      - id: reports
        title: "Reports"
        href: /insights/my-app/reports
        product: "Red Hat Insights"
```
