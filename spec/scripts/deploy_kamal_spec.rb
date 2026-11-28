# frozen_string_literal: true

require "open3"
require "rails_helper"
require "tmpdir"

RSpec.describe "deploy_kamal.sh" do
  def production_start(status: 0, command: nil)
    dockerfile = Rails.root.join("Dockerfile.production").read
    entrypoint = dockerfile.lines.grep(/^ENTRYPOINT /).last
    expect(entrypoint).to be_present
    expect(JSON.parse(entrypoint.delete_prefix("ENTRYPOINT "))).to eq(["/app/bin/docker-entrypoint"])
    command ||= JSON.parse(dockerfile.lines.grep(/^CMD /).last.delete_prefix("CMD "))
    Dir.mktmpdir do |directory|
      bin = File.join(directory, "bin")
      Dir.mkdir(bin)
      File.write(File.join(bin, "rails"), "#!/bin/sh\nprintf 'prepare:%s\\n' \"$*\"\nexit #{status}\n")
      File.write(File.join(bin, "bundle"), "#!/bin/sh\nprintf 'server:%s\\n' \"$*\"\n")
      File.chmod(0o755, File.join(bin, "rails"), File.join(bin, "bundle"))
      Open3.capture2e({ "PATH" => "#{bin}:#{ENV.fetch('PATH')}", "LD_PRELOAD" => "" },
        Rails.root.join("bin/docker-entrypoint").to_s, *command, chdir: directory)
    end
  end

  it "prepares the database before starting the actual production server command" do
    output, status = production_start
    expect(status).to be_success
    expect(output.lines.map(&:strip)).to eq(["prepare:db:prepare", "server:exec falcon host"])
  end

  it "does not start the production server when database preparation fails" do
    output, status = production_start(status: 17)
    expect(status.exitstatus).to eq(17)
    expect(output.lines.map(&:strip)).to eq(["prepare:db:prepare"])
  end

  it "preserves the worker command without independently migrating from the worker" do
    output, status = production_start(command: ["bundle", "exec", "rake", "solid_queue:start"])
    expect(status).to be_success
    expect(output.lines.map(&:strip)).to eq(["server:exec rake solid_queue:start"])
  end

  it "rejects the documented signing-secret placeholder" do
    Dir.mktmpdir do |directory|
      File.write(
        File.join(directory, ".env.kamal"),
        <<~ENV_FILE
          GITHUB_TOKEN=test
          RAILS_MASTER_KEY=test
          DATABASE_URL=postgres://example
          SECRET_KEY_BASE=your_secret_key_base_here
          POSTGRES_PASSWORD=test
        ENV_FILE
      )

      output, status = Open3.capture2e("bash", Rails.root.join("deploy_kamal.sh").to_s, chdir: directory)

      expect(status).not_to be_success
      expect(output).to include("SECRET_KEY_BASE must be replaced with a unique secret")
    end
  end
end
