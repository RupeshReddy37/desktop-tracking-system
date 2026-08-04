# GitHub Labels

This document defines the standard labels used across the repository. Labels use GitHub's standard color palette and are applied to issues and pull requests.

## Issue / PR Labels

| Label | Color | Description |
|-------|-------|-------------|
| `bug` | `d73a4a` | Something isn't working as expected |
| `enhancement` | `a2eeef` | New feature or improvement request |
| `documentation` | `0075ca` | Improvements or additions to documentation |
| `good first issue` | `7057ff` | Good for newcomers |
| `help wanted` | `008672` | Extra attention is needed; maintainers are looking for help |
| `security` | `b60205` | Security-related issue or vulnerability |
| `performance` | `fbca04` | Performance improvement or regression |
| `testing` | `1d76db` | Related to tests or test infrastructure |
| `question` | `d876e3` | Further information is requested |
| `duplicate` | `cfd3d7` | This issue or PR already exists |
| `invalid` | `e4e669` | This doesn't seem right or is not applicable |
| `wontfix` | `ffffff` | This will not be worked on |

## Applying Labels

- **Bug reports** are auto-labeled `bug` via the issue template.
- **Feature requests** are auto-labeled `enhancement` via the issue template.
- **Documentation issues** are auto-labeled `documentation` via the issue template.
- Maintainers add `good first issue`, `help wanted`, `security`, `performance`, `testing`, `question`, `duplicate`, `invalid`, and `wontfix` as appropriate during triage.

## Creating Labels

To create these labels in a new repository, run the following commands (requires `gh` CLI and appropriate permissions):

```bash
gh label create bug --color d73a4a --description "Something isn't working as expected"
gh label create enhancement --color a2eeef --description "New feature or improvement request"
gh label create documentation --color 0075ca --description "Improvements or additions to documentation"
gh label create "good first issue" --color 7057ff --description "Good for newcomers"
gh label create "help wanted" --color 008672 --description "Extra attention is needed"
gh label create security --color b60205 --description "Security-related issue or vulnerability"
gh label create performance --color fbca04 --description "Performance improvement or regression"
gh label create testing --color 1d76db --description "Related to tests or test infrastructure"
gh label create question --color d876e3 --description "Further information is requested"
gh label create duplicate --color cfd3d7 --description "This issue or PR already exists"
gh label create invalid --color e4e669 --description "This doesn't seem right or is not applicable"
gh label create wontfix --color ffffff --description "This will not be worked on"
```
