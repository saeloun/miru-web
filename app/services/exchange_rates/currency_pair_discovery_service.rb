# frozen_string_literal: true

module ExchangeRates
  class CurrencyPairDiscoveryService
    def initialize
      @discovered_pairs = Set.new
    end

    def process
      discover_from_companies_and_clients
      discover_from_recent_invoices
      sync_to_database

      {
        discovered_pairs: @discovered_pairs.to_a,
        total_pairs: @discovered_pairs.size,
        activated: @activated_count,
        deactivated: @deactivated_count
      }
    end

    private

      def discover_from_companies_and_clients
        # Get all active companies with their base currencies
        Company.find_each do |company|
          base_currency = company.base_currency&.upcase
          next if base_currency.blank?

          # Get all client currencies for this company
          client_currencies = company.clients.kept
            .where.not(currency: [nil, ""])
            .distinct
            .pluck(:currency)
            .filter_map(&:upcase)

          # Create pairs: client_currency -> company_base_currency
          client_currencies.each do |client_currency|
            next if client_currency == base_currency

            add_pair(client_currency, base_currency)
          end

          # Also add reverse pairs for flexibility
          client_currencies.each do |client_currency|
            next if client_currency == base_currency

            add_pair(base_currency, client_currency)
          end
        end
      end

      def discover_from_recent_invoices
        # Look at invoices from the last 6 months to find active currency pairs
        recent_date = 6.months.ago

        Invoice.kept
          .where("created_at >= ?", recent_date)
          .where.not(currency: [nil, ""])
          .includes(:company)
          .find_each do |invoice|
            company_currency = invoice.company.base_currency&.upcase
            invoice_currency = invoice.currency&.upcase

            next if company_currency.blank? || invoice_currency.blank?
            next if company_currency == invoice_currency

            add_pair(invoice_currency, company_currency)
          end
      end

      def add_pair(from_currency, to_currency)
        return if from_currency.blank? || to_currency.blank?
        return if from_currency == to_currency

        @discovered_pairs.add([from_currency, to_currency])
      end

      def sync_to_database
        @activated_count = 0
        @deactivated_count = 0

        # Activate discovered pairs
        @discovered_pairs.each do |(from_currency, to_currency)|
          pair = CurrencyPair.find_or_initialize_by(
            from_currency:,
            to_currency:
          )

          # Check if it's a new record or was inactive
          is_new_or_inactive = pair.new_record? || !pair.active?

          if is_new_or_inactive
            pair.active = true
            pair.save!
            @activated_count += 1
          end
        end

        # Deactivate pairs that are no longer needed
        # Keep pairs that were updated in the last 30 days (might still be in use)
        cutoff_date = 30.days.ago

        CurrencyPair.active.each do |pair|
          pair_tuple = [pair.from_currency, pair.to_currency]

          # Don't deactivate if:
          # 1. It's in our discovered pairs
          # 2. It was recently updated (might be manually added)
          next if @discovered_pairs.include?(pair_tuple)
          next if pair.last_updated_at && pair.last_updated_at > cutoff_date

          pair.update(active: false)
          @deactivated_count += 1
        end
      end
  end
end
