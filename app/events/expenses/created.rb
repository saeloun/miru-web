# frozen_string_literal: true

module Expenses
  class Created < ApplicationEvent
    private

      def event_data
        { expense_id: record.id, company_id: record.company_id, user_id: record.user_id }
      end
  end
end
