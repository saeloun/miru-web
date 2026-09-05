# frozen_string_literal: true

class DataImportJob < ApplicationJob
  queue_as :default
  discard_on ActiveRecord::RecordNotFound

  def perform(data_import_id)
    data_import = DataImport.find(data_import_id)
    Imports::HarvestTimeEntriesImporter.new(data_import).process
  end
end
