---
sidebar_position: 1
slug: /
title: Introduction to Miru - Open Source Time Tracking & Invoice Management
description: Miru is an open-source time tracking, invoice management, and accounting platform designed for small businesses worldwide. Get started with our comprehensive documentation.
keywords: [time tracking, invoice management, accounting, open source, small business, project management, billing, payments, reporting, ruby on rails, react]
image: https://miru.so/static/media/miru-blue-logo-with-text.5ba2b3fe09b9f038473f0a131f8a8bec.svg
---

# Introduction

Welcome to **Miru** — a modern, open-source time tracking and invoicing platform built for the way teams work today. Whether you're a freelancer managing multiple clients, an agency tracking billable hours, or a distributed team coordinating across time zones, Miru provides the tools you need to manage time, projects, and payments efficiently.

## Why Miru?

In today's fast-paced business environment, effective time management isn't just about tracking hours — it's about understanding productivity, optimizing workflows, and ensuring accurate billing. Miru addresses these needs with a comprehensive yet intuitive platform that scales with your business.

### 🎯 Core Principles

#### **Simplicity First**
We believe powerful tools shouldn't require extensive training. Miru's clean interface ensures your entire team can start tracking time productively from day one.

```ruby
# Example: Track time with a simple API call
TimeEntry.create!(
  user: current_user,
  project: project,
  duration: 2.hours,
  description: "Implemented user authentication"
)
```

#### **Built for Collaboration**
Modern work is collaborative. Miru facilitates seamless communication between team members, project managers, and clients through shared dashboards, real-time updates, and transparent reporting.

#### **Developer-Friendly**
As an open-source Rails application, Miru is built by developers, for developers. Extend it, customize it, or contribute back to the community.

## Key Features

### 📊 **Comprehensive Time Tracking**
- **Multiple tracking methods**: Timer, manual entry, or bulk import
- **Project-based organization**: Organize work by clients and projects
- **Detailed timesheets**: Track billable vs. non-billable hours
- **Mobile-friendly**: Track time from anywhere

**Example workflow:**
```javascript
// Start tracking time
const timer = new Timer({
  project: "Website Redesign",
  task: "Homepage Layout",
  billable: true
});
timer.start();

// Stop and save
timer.stop();
await timer.save();
```

### 💰 **Smart Invoicing**
- **Automated invoice generation**: Convert tracked time into professional invoices
- **Multiple payment gateways**: Integrated with Stripe and PayPal
- **Recurring invoices**: Set up automatic billing for retainer clients
- **Multi-currency support**: Bill clients in their preferred currency

### 📈 **Powerful Analytics**
- **Real-time dashboards**: Monitor project progress and team productivity
- **Custom reports**: Generate detailed reports for stakeholders
- **Profitability analysis**: Understand which projects and clients drive revenue
- **Time estimates vs. actuals**: Improve project planning accuracy

### 👥 **Team Management**
- **Role-based permissions**: Control access with Owner, Admin, Employee, and Client roles
- **Leave management**: Track PTO, sick days, and holidays
- **Expense tracking**: Manage project expenses alongside time entries
- **Client portals**: Give clients visibility into project progress

## Technology Stack

Miru leverages modern, battle-tested technologies to ensure reliability, performance, and developer happiness:

### Backend
- **Ruby on Rails 8.0.2**: Latest Rails with Hotwire for reactive UIs
- **PostgreSQL 15+**: Robust relational database with advanced features
- **Solid Queue**: Built-in Rails job processing (no external dependencies)

### Frontend
- **React 18.3**: Modern component-based UI
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS 3.4**: Utility-first styling
- **Shakapacker 8**: Webpack 5 integration for Rails

### Infrastructure
- **Docker**: Containerized deployment
- **GitHub Actions**: Automated CI/CD pipeline
- **AWS S3**: Secure file storage
- **Sentry**: Error tracking and monitoring

## Getting Started

Ready to dive in? Here's how to get Miru running in minutes:

### Quick Start (Docker)
```bash
# Clone the repository
git clone https://github.com/saeloun/miru-web.git
cd miru-web

# Start with Docker Compose
docker-compose up

# Setup the database
docker-compose exec app bundle exec rails db:setup

# Visit http://localhost:3000 to access the application
```

### Local Development (macOS/Linux)
```bash
# Install dependencies with mise (recommended)
mise install ruby@3.4.5
mise install node@22.11.0
mise use ruby@3.4.5
mise use node@22.11.0

# Install gems and packages
bundle install
npm install

# Setup database
bin/rails db:setup

# Start the server
foreman start -f Procfile.dev
```

## Use Cases

### For Freelancers
Track time across multiple clients, generate professional invoices, and get paid faster with integrated payment processing.

### For Agencies
Manage team workloads, track project profitability, and provide clients with transparent progress reports.

### For Remote Teams
Coordinate across time zones, track distributed work, and maintain visibility into team productivity.

### For Consultants
Accurately bill for your expertise, manage retainer agreements, and demonstrate value through detailed time reports.

## Community & Support

### 🌟 Open Source
Miru is proudly open source. We believe in transparency, community-driven development, and giving back to the ecosystem that makes our work possible.

### 💬 Get Involved
- **GitHub**: [github.com/saeloun/miru-web](https://github.com/saeloun/miru-web)
- **Discord**: [Join our community](https://discord.gg/UABXyQQ82c)
- **Contributing**: See our [contribution guidelines](contributing-guide/guidelines)

### 📚 Resources
- **Documentation**: You're reading it!
- **API Reference**: Coming soon
- **Video Tutorials**: [YouTube channel](https://youtube.com/@saeloun)

## Frequently Asked Questions

### Is Miru really free?
Yes! Miru is open source and free to use. You can self-host it on your own infrastructure at no cost. We also offer hosted solutions for teams that prefer managed services.

### Can I customize Miru for my business?
Absolutely! Miru is built with customization in mind. You can modify the source code, add custom features, or hire developers to tailor it to your specific needs.

### How secure is my data?
We take security seriously. Miru includes:
- Encrypted data transmission (HTTPS)
- Secure authentication with OAuth2
- Regular security audits
- GDPR-compliant data handling
- Role-based access control

### What payment methods are supported?
Currently, Miru integrates with:
- Stripe (credit cards, ACH, international payments)
- PayPal
- Wise (formerly TransferWise)
- Manual payment tracking

### Can I migrate from other time tracking tools?
Yes! We provide import tools for common formats (CSV, JSON) and are continually adding integrations with popular time tracking platforms.

### How does Miru compare to [Tool X]?
Unlike proprietary solutions, Miru gives you:
- Complete control over your data
- No vendor lock-in
- Unlimited users (self-hosted)
- Full customization capabilities
- Active open-source community

## Next Steps

Ready to transform how your team tracks time and manages projects?

1. **[Set up your development environment](contributing-guide/setup/macos)** - Get Miru running locally
2. **[Explore the codebase](contributing-guide/guidelines)** - Understand the architecture
3. **[Join our Discord](https://discord.gg/UABXyQQ82c)** - Connect with the community
4. **[Report issues or suggest features](https://github.com/saeloun/miru-web/issues)** - Help us improve

---

*Built with ❤️ by [Saeloun](https://saeloun.com) and contributors worldwide.*