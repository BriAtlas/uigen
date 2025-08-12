# GitHub Check Command

## Description
Quickly check GitHub repository status, workflows, security, and overall health.

## Usage
```
/github-check
```

## What it does
Launches the GitHub Checker agent to:
- Verify repository connection and status
- Check GitHub Actions workflows
- Review security alerts and vulnerabilities  
- Analyze recent activity and issues
- Provide actionable health report

## Options
- `/github-check` - Full repository health check
- `/github-check --quick` - Quick status overview only
- `/github-check --security` - Focus on security issues
- `/github-check --workflows` - Focus on GitHub Actions status

## Example Output
```
✅ Repository: BriAtlas/uigen
✅ Authentication: Connected as BriAtlas
✅ Workflows: 2 passing, 0 failed
⚠️  Security: 1 dependabot alert (low severity)
✅ Recent Activity: 3 commits in last 24h
📊 Overall Health: Good
```

## Related Commands
- `/commit` - Commit and push changes
- `/pr` - Create pull request
- `/deploy` - Check deployment status