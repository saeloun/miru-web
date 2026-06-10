# frozen_string_literal: true

module QuickBooks
  class Error < StandardError
    attr_reader :response

    def initialize(message, response: nil)
      @response = response
      super(message)
    end
  end
end
