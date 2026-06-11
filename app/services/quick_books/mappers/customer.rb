# frozen_string_literal: true

module QuickBooks
  module Mappers
    class Customer < Base
      def payload(client)
        compact_payload(
          "DisplayName" => truncate(client.name, 500),
          "PrimaryEmailAddr" => email(client),
          "PrimaryPhone" => phone(client),
          "BillAddr" => billing_address(client),
          "CurrencyRef" => currency(client)
        )
      end

      def update_payload(client, reference)
        payload(client).merge(
          "Id" => reference.quickbooks_entity_id,
          "SyncToken" => reference.quickbooks_sync_token,
          "sparse" => true
        )
      end

      private

        def email(client)
          return if client.email.blank?

          { "Address" => truncate(client.email, 100) }
        end

        def phone(client)
          return if client.phone.blank?

          { "FreeFormNumber" => truncate(client.phone, 30) }
        end

        def currency(client)
          return if client.currency.blank?

          { "value" => client.currency }
        end

        def billing_address(client)
          address = client.current_address
          return if address.blank?

          compact_payload(
            "Line1" => truncate(address.address_line_1, 500),
            "Line2" => truncate(address.address_line_2, 500),
            "City" => truncate(address.city, 255),
            "CountrySubDivisionCode" => truncate(address.state, 255),
            "PostalCode" => truncate(address.pin, 30),
            "Country" => truncate(address.country, 255)
          )
        end
    end
  end
end
