# frozen_string_literal: true

require "rails_helper"

RSpec.describe DatabaseBackupService do
  let(:time) { Time.zone.parse("2026-03-29 02:30:00 UTC") }
  let(:client) { instance_double(Aws::S3::Client, put_object: true) }
  let(:status) { instance_double(Process::Status, success?: true) }

  subject(:service) do
    described_class.new(
      database_url: "postgres://postgres:postgres@db:5432/miru_production",
      bucket_name: "miru-backups",
      endpoint: "https://example.r2.cloudflarestorage.com",
      region: "auto",
      access_key_id: "key",
      secret_access_key: "secret",
      prefix: "miru/database-backups",
      backup_name: "miru-production",
      time: time
    )
  end

  before do
    allow(Aws::S3::Client).to receive(:new).and_return(client)
    allow(Open3).to receive(:capture3) do |*args|
      target_path = args[args.index("--file") + 1]
      File.binwrite(target_path, "backup")
      ["", "", status]
    end
  end

  it "runs pg_dump and uploads archive and latest objects" do
    key = service.process

    expect(key).to eq("miru/database-backups/2026/03/29/miru-production-20260329-023000.dump")
    expect(Open3).to have_received(:capture3).with(
      "pg_dump",
      "-Fc",
      "--no-owner",
      "--no-privileges",
      "--dbname",
      "postgres://postgres:postgres@db:5432/miru_production",
      "--file",
      kind_of(String)
    )
    expect(client).to have_received(:put_object).with(
      hash_including(
        bucket: "miru-backups",
        key: "miru/database-backups/2026/03/29/miru-production-20260329-023000.dump"
      )
    )
    expect(client).to have_received(:put_object).with(
      hash_including(
        bucket: "miru-backups",
        key: "miru/database-backups/latest.dump"
      )
    )
  end

  it "raises when pg_dump fails" do
    failing_status = instance_double(Process::Status, success?: false)
    allow(Open3).to receive(:capture3).and_return(["", "boom", failing_status])

    expect { service.process }.to raise_error(RuntimeError, /pg_dump failed/)
  end
end
