# frozen_string_literal: true

require "rails_helper"

RSpec.describe DataImportJob, type: :job do
  let(:company) { create(:company) }
  let(:actor) { create(:user, current_workspace_id: company.id) }
  let(:data_import) { create(:data_import, company:, user: actor, dry_run: true, options: { "assign_unmatched_to" => actor.email }) }

  before do
    create(:employment, company:, user: actor)
    File.open(Rails.root.join("spec/fixtures/files/harvest_detailed_time.csv")) do |file|
      data_import.file.attach(io: file, filename: "harvest.csv", content_type: "text/csv")
    end
  end

  it "runs the importer" do
    described_class.perform_now(data_import.id)

    expect(data_import.reload).to have_attributes(status: "completed", total_rows: 12)
  end

  it "marks the import failed and re-raises an error" do
    importer = Imports::HarvestTimeEntriesImporter.new(data_import)
    allow(Imports::HarvestTimeEntriesImporter).to receive(:new).with(data_import).and_return(importer)
    allow(importer).to receive(:load_rows).and_raise("database credentials exposed")

    expect do
      described_class.perform_now(data_import.id)
    end.to raise_error(RuntimeError, "database credentials exposed")

    expect(data_import.reload).to have_attributes(
      status: "failed",
      error_message: "Import failed. Support has been notified."
    )
  end
end
