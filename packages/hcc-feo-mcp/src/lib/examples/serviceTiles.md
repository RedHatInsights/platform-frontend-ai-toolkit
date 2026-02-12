# Service Tiles Configuration

Tiles in the Services dropdown menu.

## Basic Example

```yaml
spec:
  feoConfigEnabled: true
  serviceTiles:
    - id: my-app
      section: insights
      group: platform
      title: "My Application"
      href: /insights/my-app
      description: "Manage and monitor application infrastructure"
      icon: "Application"
```

## Sections and Groups

**Insights**: platform, observability, security, automation
**OpenShift**: cluster, workloads, networking, storage
**Ansible**: automation

## Common Icons

Application, Server, Database, Security, Monitor, Automation, Settings, Storage, Network, Container, Cube, Chart

## Multiple Tiles

```yaml
serviceTiles:
  - id: my-app-main
    section: insights
    group: platform
    title: "My Application"
    href: /insights/my-app
    description: "Primary interface for managing your application"
    icon: "Application"

  - id: my-app-settings
    section: settings
    group: configuration
    title: "My Application Settings"
    href: /settings/my-app
    description: "Configure settings and preferences"
    icon: "Settings"
```
