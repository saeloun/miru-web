---
sidebar_position: 2
---

# Exchange Rates - Quick Start

## Overview

The Open Exchange Rates integration enables automatic currency conversion for invoices in your system. It automatically discovers needed currency pairs from your data and fetches exchange rates daily, ensuring accurate multi-currency invoice handling.

## What is Open Exchange Rates?

[Open Exchange Rates](https://openexchangerates.org/) is a reliable API service that provides real-time and historical exchange rate data for 200+ currencies. It's used by thousands of businesses worldwide for accurate currency conversion.

### Why We Use Open Exchange Rates

**Automatic Currency Conversion:**
- Converts invoice amounts to base currency automatically
- Supports 200+ currencies worldwide
- Daily rate updates at 1:00 AM ET (DST-aware)
- Historical rate data available

**Smart Resource Management:**
- Only fetches rates for currency pairs you actually use
- Monitors API usage and warns at 70% (700/1000 requests)
- Emails admins when approaching limit
- Adapts to new clients/currencies automatically

**Cost Effective:**
- Free tier: 1,000 requests/month
- Paid plans available for higher volume
- Only requests needed currency pairs

### Getting Started with Open Exchange Rates

**1. Create an Account:**
- Visit [openexchangerates.org/signup/free](https://openexchangerates.org/signup/free)
- Sign up for a free account (no credit card required)
- Free tier includes 1,000 requests/month

**2. Get Your API Key:**
- Log in to your [Open Exchange Rates Dashboard](https://openexchangerates.org/account/app-ids)
- Copy your **App ID** from the dashboard
- Keep this key secure - treat it like a password

**3. Useful Links:**
- [Open Exchange Rates Homepage](https://openexchangerates.org/)
- [API Documentation](https://docs.openexchangerates.org/)
- [Pricing Plans](https://openexchangerates.org/signup)
- [Service Status](https://status.openexchangerates.org/)
- [Support](https://openexchangerates.org/support)

**4. Pricing Overview:**
- Free: 1,000 requests/month
- Unlimited: $12/month for unlimited requests
- Enterprise plans available for advanced features

## 🚀 Setup (5 minutes)

### 1. Get API Key
Sign up at: [openexchangerates.org/signup/free](https://openexchangerates.org/signup/free)

### 2. Add to .env
```bash
OPEN_EXCHANGE_RATES_APP_ID=your_app_id_here
```

### 3. Run Setup
```bash
# Run migrations
rails db:migrate

# Discover needed currency pairs (automatic)
rails exchange_rates:discover

# Fetch initial rates
rails exchange_rates:fetch

# Restart your application
```

## ✅ That's it!

Your system will now:
- ✅ **Automatically discover** needed currency pairs from your data
- ✅ Fetch exchange rates daily at 1:00 AM ET (DST-aware, only for needed pairs)
- ✅ Convert invoice amounts to base currency automatically
- ✅ Monitor API usage and warn at 70% (700/1000 requests)
- ✅ Email admins when approaching limit
- ✅ Adapt to new clients/currencies automatically

## 📊 Useful Commands

```bash
# Discover needed currency pairs (automatic)
rails exchange_rates:discover

# Analyze currency usage in your system
rails exchange_rates:analyze

# View configured currency pairs
rails exchange_rates:list

# Check API usage
rails exchange_rates:usage

# Fetch rates manually
rails exchange_rates:fetch

# Add new currency pair manually (rarely needed)
rails exchange_rates:add[USD,MXN]

# Test conversion
rails exchange_rates:convert[100,EUR,USD]
```

## 🔧 Configuration

**Add/Remove Currency Pairs:**
```ruby
# Rails console
CurrencyPair.create!(from_currency: 'USD', to_currency: 'MXN', active: true)
```

**Change Schedule:**
Edit `config/solid_queue.yml`:
```yaml
update_exchange_rates:
  schedule: "0 1 * * * America/New_York" # Runs every day at 1:00 AM ET (6:00 AM UTC)
```

## 🆘 Troubleshooting

**Rates not updating?**
```bash
rails exchange_rates:fetch
```

**Check what's wrong?**
```bash
rails exchange_rates:usage
tail -f log/development.log | grep "Exchange"
```

## Key Features

- ✅ **Automatic discovery** - Finds needed currency pairs from your data
- ✅ **Daily updates** - Fetches rates at 1:00 AM ET (DST-aware)
- ✅ **Smart monitoring** - Warns at 70% API usage
- ✅ **Admin alerts** - Email notifications for usage limits
- ✅ **Flexible scheduling** - Configurable via Solid Queue

## Implementation Details

### Core Components

**Currency Pair Model** (`app/models/currency_pair.rb`)
- Stores active currency pairs
- Tracks which conversions are needed

**Exchange Rate Service** (`app/services/exchange_rates/fetch_service.rb`)
- Fetches rates from Open Exchange Rates API
- Handles API errors gracefully
- Monitors usage limits

**Scheduled Jobs** (`config/solid_queue.yml`)
- Daily rate updates at 1:00 AM ET
- Automatic discovery of new currency pairs

**Rake Tasks** (`lib/tasks/exchange_rates.rake`)
- Admin commands for managing rates
- Manual fetch and discovery tools

---

**Status:** ✅ Production Ready
**Last Updated:** January 2025
