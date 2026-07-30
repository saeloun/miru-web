# frozen_string_literal: true

require "open3"
require "rails_helper"
require "tmpdir"

RSpec.describe "deploy_kamal.sh" do
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
