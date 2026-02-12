# Search Entries Configuration

Make your app discoverable via global search.

## Basic Example

```yaml
spec:
  feoConfigEnabled: true
  searchEntries:
    - id: my-app
      title: "My Application"
      href: /insights/my-app
      description: "Manage and monitor application infrastructure"
      alt_title:
        - "my app"
        - "app management"
```

## Good alt_title Keywords

Include abbreviations, variations, and related terms:

```yaml
searchEntries:
  - id: vulnerability
    title: "Vulnerability Management"
    href: /insights/vulnerability
    description: "Identify and remediate security vulnerabilities"
    alt_title:
      - "vuln"
      - "vulnerability"
      - "vulnerabilities"
      - "security scan"
      - "CVE"
      - "patch management"
```

## Multiple Entries

```yaml
searchEntries:
  - id: my-app-main
    title: "My Application"
    href: /insights/my-app
    description: "Central hub for managing application infrastructure"
    alt_title:
      - "my app"
      - "app dashboard"

  - id: my-app-reports
    title: "My Application Reports"
    href: /insights/my-app/reports
    description: "Access detailed reports and analytics"
    alt_title:
      - "app reports"
      - "analytics"
```
