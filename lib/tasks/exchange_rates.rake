namespace :exchange_rates do
  desc "Update exchange rates for all active currencies"
  task update: :environment do
    puts "Updating exchange rates..."
    
    # Get all unique currencies from invoices and clients
    currencies = (Invoice.distinct.pluck(:currency) + Client.distinct.pluck(:currency)).compact.uniq
    
    # Get all base currencies from companies
    base_currencies = Company.distinct.pluck(:base_currency).compact.uniq
    
    updated_count = 0
    failed_count = 0
    
    base_currencies.each do |base_currency|
      currencies.each do |currency|
        next if currency == base_currency
        
        begin
          rate = CurrencyConversionService.fetch_and_store_rate(currency, base_currency, Date.current)
          if rate
            puts "✓ Updated rate: #{currency} → #{base_currency} = #{rate}"
            updated_count += 1
          else
            puts "✗ Failed to fetch rate: #{currency} → #{base_currency}"
            failed_count += 1
          end
        rescue => e
          puts "✗ Error updating #{currency} → #{base_currency}: #{e.message}"
          failed_count += 1
        end
      end
    end
    
    puts "\nSummary:"
    puts "  Updated: #{updated_count} rates"
    puts "  Failed: #{failed_count} rates"
  end
  
  desc "Update exchange rates for specific date"
  task :update_for_date, [:date] => :environment do |t, args|
    date = Date.parse(args[:date])
    puts "Updating exchange rates for #{date}..."
    
    # Get all unique currencies
    currencies = (Invoice.distinct.pluck(:currency) + Client.distinct.pluck(:currency)).compact.uniq
    base_currencies = Company.distinct.pluck(:base_currency).compact.uniq
    
    updated_count = 0
    
    base_currencies.each do |base_currency|
      currencies.each do |currency|
        next if currency == base_currency
        
        rate = CurrencyConversionService.fetch_and_store_rate(currency, base_currency, date)
        if rate
          puts "✓ Updated rate for #{date}: #{currency} → #{base_currency} = #{rate}"
          updated_count += 1
        end
      end
    end
    
    puts "Updated #{updated_count} rates for #{date}"
  end
  
  desc "Recalculate base_currency_amount for all invoices"
  task recalculate_invoices: :environment do
    puts "Recalculating base_currency_amount for all invoices..."
    
    updated_count = 0
    failed_count = 0
    
    Invoice.find_each do |invoice|
      next if invoice.same_currency?
      
      begin
        # Trigger recalculation
        invoice.calculate_base_currency_amount
        if invoice.save
          puts "✓ Updated invoice ##{invoice.invoice_number}: #{invoice.currency} #{invoice.amount} → #{invoice.company.base_currency} #{invoice.base_currency_amount}"
          updated_count += 1
        else
          puts "✗ Failed to update invoice ##{invoice.invoice_number}: #{invoice.errors.full_messages.join(', ')}"
          failed_count += 1
        end
      rescue => e
        puts "✗ Error updating invoice ##{invoice.invoice_number}: #{e.message}"
        failed_count += 1
      end
    end
    
    puts "\nSummary:"
    puts "  Updated: #{updated_count} invoices"
    puts "  Failed: #{failed_count} invoices"
  end
  
  desc "Recalculate base_currency_amount for all payments"
  task recalculate_payments: :environment do
    puts "Recalculating base_currency_amount for all payments..."
    
    updated_count = 0
    failed_count = 0
    
    Payment.find_each do |payment|
      begin
        # Trigger recalculation
        payment.calculate_base_currency_amount
        if payment.save
          puts "✓ Updated payment ##{payment.id}: #{payment.payment_currency} #{payment.amount} → #{payment.company.base_currency} #{payment.base_currency_amount}"
          updated_count += 1
        else
          puts "✗ Failed to update payment ##{payment.id}: #{payment.errors.full_messages.join(', ')}"
          failed_count += 1
        end
      rescue => e
        puts "✗ Error updating payment ##{payment.id}: #{e.message}"
        failed_count += 1
      end
    end
    
    puts "\nSummary:"
    puts "  Updated: #{updated_count} payments"
    puts "  Failed: #{failed_count} payments"
  end
end