# Migration from Chrome Service Backend to FEO

Consolidate static config into your app repo.

## Before: Split Across Multiple Files

**fed-modules.json** (chrome-service-backend):
```javascript
{
  "vulnerability": {
    "manifestLocation": "/apps/vulnerability/fed-mods.json",
    "modules": [{
      "id": "vulnerability",
      "module": "./RootApp",
      "routes": [{"pathname": "/insights/vulnerability"}]
    }]
  }
}
```

**main.yml** (chrome-service-backend):
```yaml
insights:
  navItems:
    - id: vulnerability
      title: Vulnerability
      href: /insights/vulnerability
```

**services.json** (chrome-service-backend):
```javascript
{
  "vulnerability": {
    "title": "Vulnerability",
    "description": "Identify and remediate vulnerabilities"
  }
}
```

## After: Single frontend.yaml

```yaml
apiVersion: v1
kind: Template
metadata:
  name: vulnerability
objects:
  - apiVersion: cloud.redhat.com/v1alpha1
    kind: Frontend
    metadata:
      name: vulnerability
    spec:
      feoConfigEnabled: true

      module:
        manifestLocation: "/apps/vulnerability/fed-mods.json"
        defaultDocumentTitle: "Vulnerability | Console"
        modules:
          - id: vulnerability
            module: "./RootApp"
            routes:
              - pathname: /insights/vulnerability
                props: {bundle: insights}
        analytics:
          APIKey: "PROD-KEY"
          APIKeyDev: "DEV-KEY"

      bundleSegments:
        - segmentId: vulnerability-insights
          bundleId: insights
          position: 500
          navItems:
            - id: vulnerability
              title: "Vulnerability"
              href: /insights/vulnerability
              product: "Red Hat Insights"

      serviceTiles:
        - id: vulnerability
          section: insights
          group: security
          title: "Vulnerability"
          href: /insights/vulnerability
          description: "Identify and remediate security vulnerabilities"
          icon: "Security"

      searchEntries:
        - id: vulnerability
          title: "Vulnerability"
          href: /insights/vulnerability
          description: "Identify and remediate security vulnerabilities"
          alt_title:
            - "vuln"
            - "CVE"
            - "security"
```

## Migration Steps

1. Create `deploy/frontend.yaml` in your app repo
2. Set `feoConfigEnabled: true`
3. Copy module config, add `defaultDocumentTitle` and `analytics`
4. Copy navigation, add `segmentId`, `position`, `product`
5. Copy service tiles, add `section`, `group`, `icon`, expand description
6. Add search entries (new feature)
7. Mark old config with `feoReplacement: "app-name"` in chrome-service-backend

## Checklist

- [ ] Created `deploy/frontend.yaml`
- [ ] Set `feoConfigEnabled: true`
- [ ] Migrated module config
- [ ] Migrated navigation
- [ ] Migrated service tiles
- [ ] Added search entries
- [ ] Added `feoReplacement` markers
- [ ] Tested all features work
