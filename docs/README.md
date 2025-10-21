# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Installation

```bash
yarn
```

## Local Development

```bash
yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

Using SSH:

```bash
USE_SSH=true yarn deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

## 📚 Documentation for Reviewers

MedNexus has comprehensive real-world usability documentation to help reviewers validate the platform in 30 minutes:

### Quick Links

- 🎯 **[Executive Summary](REVIEWER_EXECUTIVE_SUMMARY.md)** - Start here! 10-minute overview of problem, solution, and what's built
- ✅ **[Quick Reference](REVIEWER_QUICK_REFERENCE.md)** - 30-minute hands-on testing checklist (5 demos)
- 🎬 **[Demo Script](DEMO_SCRIPT.md)** - Live presentation script with Q&A preparation
- 📘 **[Complete Demo Guide](docs/overview/real-world-usability-demo.md)** - Detailed technical walkthrough
- 📊 **[Visual Demo Flow](VISUAL_DEMO_FLOW.md)** - Printable diagrams and architecture
- 📋 **[Documentation Index](DOCUMENTATION_INDEX.md)** - How to use all these documents

### What Reviewers Can Validate

✅ Real blockchain transactions (0G testnet)  
✅ Real decentralized storage (0G Storage)  
✅ Real database operations (Supabase, no mocks)  
✅ Real smart contracts (deployed, open-source)  
✅ Real multi-institutional architecture

**Total demo time: 30 minutes** | **Verified transactions: Public block explorer**
