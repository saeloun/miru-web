# frozen_string_literal: true

require "rails_helper"

RSpec.describe DatabaseBackupJob do
  around do |example|
    original = ENV["DATABASE_BACKUP_ENABLED"]
    example.run
  ensure
    ENV["DATABASE_BACKUP_ENABLED"] = original
  end

  it "runs the backup service when enabled" do
    ENV["DATABASE_BACKUP_ENABLED"] = "true"
    service = instance_double(DatabaseBackupService, process: { archive_key: "archive.dump", latest_key: "latest.dump" })
    allow(DatabaseBackupService).to receive(:new).and_return(service)

    described_class.perform_now

    expect(DatabaseBackupService).to have_received(:new)
    expect(service).to have_received(:process)
  end

  it "skips the backup service when disabled" do
    ENV["DATABASE_BACKUP_ENABLED"] = "false"
    allow(DatabaseBackupService).to receive(:new)

    described_class.perform_now

    expect(DatabaseBackupService).not_to have_received(:new)
  end
end
