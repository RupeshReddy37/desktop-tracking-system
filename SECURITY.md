# Security Policy

## Supported Versions

Security fixes are applied to the latest release. Older releases are supported on a best-effort basis.

| Version | Supported |
|---------|-----------|
| latest  | ✅ |
| older   | ⚠️ best effort |

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

To report a vulnerability, email the maintainers directly with the following details:

- A description of the vulnerability and its impact
- The affected component (`tracking-agent`, `tracking-server`, or `tracking-frontend`)
- Steps to reproduce, if available
- Any suggested mitigation

You will receive an acknowledgement within a reasonable time. Please allow time for the issue to be assessed and addressed before public disclosure.

## Security Considerations for This Product

This system collects work-activity metadata. Production deployments must follow the operational controls in [docs/DATA-COLLECTION-POLICY.md](docs/DATA-COLLECTION-POLICY.md), including:


- **HTTPS** for all client-to-server communication
- **JWT/Bearer** protection for dashboard and report APIs
- **Device token validation** for agent sync
- **Role-based visibility** for dashboard and report access
- **Restricted database access** and protected backups
- **Externalized secrets** via environment variables (never hardcode production credentials)

## Reporting Checklist

- [ ] Confirm the issue is a security vulnerability (not a general bug)
- [ ] Do not include live credentials or personal data in the report
- [ ] Provide enough detail to reproduce and assess impact
