# Module Configuration

Federated module loading and routing. Replaces legacy fed-modules.json.

## Basic Setup

```yaml
spec:
  feoConfigEnabled: true
  frontend:
    paths:
      - "/apps/my-app"

  module:
    manifestLocation: "/apps/my-app/fed-mods.json"
    defaultDocumentTitle: "My App | Console"
    modules:
      - id: my-app
        module: "./RootApp"
        routes:
          - pathname: /insights/my-app
            props:
              bundle: insights

    analytics:
      APIKey: "PROD-KEY"
      APIKeyDev: "DEV-KEY"
```

## Multiple Routes

```yaml
module:
  manifestLocation: "/apps/my-app/fed-mods.json"
  defaultDocumentTitle: "My App | Console"
  modules:
    - id: my-app
      module: "./RootApp"
      routes:
        - pathname: /insights/my-app
          props:
            bundle: insights
        - pathname: /insights/my-app/:id
          props:
            bundle: insights
            view: detail
```

## Multi-Bundle

```yaml
routes:
  - pathname: /insights/my-app
    props:
      bundle: insights
  - pathname: /openshift/my-app
    props:
      bundle: openshift
```
