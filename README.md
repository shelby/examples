# Shelby Protocol Examples

<div align="center">
  <img src="https://avatars.githubusercontent.com/u/219037914?s=96&v=4" alt="Shelby Protocol Logo" width="96" height="96">
</div>

A collection of examples demonstrating various features and capabilities of the Shelby Protocol ecosystem. This repository is modeled after [Vercel's examples repository](https://github.com/vercel/examples) and serves as a comprehensive resource for developers building with Shelby Protocol.

## About Shelby Protocol

Shelby Protocol is a decentralized infrastructure platform designed to simplify the development and deployment of distributed applications. Learn more about us:

- 🌐 **Website**: [shelby.xyz](https://shelby.xyz/)
- 📚 **Documentation**: [docs.shelby.xyz](https://docs.shelby.xyz/)
- 🐙 **GitHub**: [github.com/shelby](https://github.com/shelby)
- 🐦 **Twitter**: [@shelbyserves](https://x.com/shelbyserves)

## What's Inside

This Turborepo includes the following packages and applications:

### Apps and Packages

- `@shelby-protocol/web`: A [Next.js](https://nextjs.org/) application showcasing Shelby Protocol integrations
- `@shelby-protocol/ui`: A React component library shared across applications

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/) and follows Shelby Protocol's development standards.

### Development Tools

This repository comes pre-configured with:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [Biome](https://biomejs.dev/) for code formatting and linting
- [Turborepo](https://turborepo.com/) for efficient monorepo management
- [pnpm](https://pnpm.io/) for fast, efficient package management

## Getting Started

### Prerequisites

- Node.js >= 22.15.0
- pnpm >= 10.10.0

### Installation

1. Clone the repository:
```bash
git clone https://github.com/shelby/examples.git
cd examples
```

2. Install dependencies:
```bash
pnpm install
```

### Development

To develop all apps and packages:

```bash
pnpm dev
```

To develop a specific package:

```bash
# Develop the web application
pnpm dev --filter=@shelby-protocol/web
```

### Building

To build all apps and packages:

```bash
pnpm build
```

To build a specific package:

```bash
# Build the web application
pnpm build --filter=@shelby-protocol/web
```

### Code Quality

Format code:
```bash
pnpm fmt
```

Lint code:
```bash
pnpm lint
```

Run tests:
```bash
pnpm test:once
```

## Contributing

We welcome contributions to the Shelby Protocol examples repository! Please read our contributing guidelines and feel free to submit issues and pull requests.

## License

This repository is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ by the [Shelby Protocol team](https://github.com/shelby)