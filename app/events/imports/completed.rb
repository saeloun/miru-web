# frozen_string_literal: true

module Imports
  class Completed < ApplicationEvent
    def initialize(data_import)
      super(data_import, actor: data_import.user)
    end

    private

      def event_data
        record.slice(:id, :company_id, :dry_run, :total_rows, :imported_rows, :failed_rows, :skipped_rows).symbolize_keys
      end
  end
end
