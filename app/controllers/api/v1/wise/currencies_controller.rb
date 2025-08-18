# frozen_string_literal: true

module Api::V1::Wise
  class CurrenciesController < Api::V1::ApplicationController
    before_action :authenticate_user!
    after_action :verify_authorized

    def index
      authorize :wise, :index?

      currencies = [
        { code: "USD", name: "US Dollar", symbol: "$" },
        { code: "EUR", name: "Euro", symbol: "€" },
        { code: "GBP", name: "British Pound", symbol: "£" },
        { code: "INR", name: "Indian Rupee", symbol: "₹" },
        { code: "JPY", name: "Japanese Yen", symbol: "¥" },
        { code: "CAD", name: "Canadian Dollar", symbol: "$" },
        { code: "AUD", name: "Australian Dollar", symbol: "$" }
      ]

      render json: { currencies: currencies }
    end
  end
end
