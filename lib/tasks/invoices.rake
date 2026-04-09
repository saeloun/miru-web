namespace :invoices do
  desc "Sync stale invoice totals from line items"
  task sync_stale_totals: :environment do
    updated = 0

    Invoice.includes(:invoice_line_items).find_each do |invoice|
      line_items = invoice.invoice_line_items.to_a
      next unless invoice.totals_stale?(line_items)

      invoice.sync_totals_from_line_items!(line_items)
      updated += 1
      puts "synced invoice #{invoice.id}"
    end

    puts "synced #{updated} invoices"
  end
end
