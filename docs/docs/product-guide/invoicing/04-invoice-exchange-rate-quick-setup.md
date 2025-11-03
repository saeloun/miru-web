# Exchange Rates - Quick Start

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
