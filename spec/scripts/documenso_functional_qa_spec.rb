# frozen_string_literal: true

require "spec_helper"
require "open3"
require "yaml"

RSpec.describe "Documenso functional QA isolation" do
  let(:root) { File.expand_path("../..", __dir__) }

  it "passes the offline lifecycle and private evidence regression checks" do
    output, errors, status = Open3.capture3({ "PATH" => ENV.fetch("PATH") },
      "python3", "-I", "-B", File.join(root, "scripts/ci/documenso_functional_qa.py"), "--self-check",
      chdir: root, unsetenv_others: true)

    expect(status).to be_success, output + errors
    expect(output).to include("Offline lifecycle checks passed")
  end

  it "always cleans up the runtime and publishes only the sanitized evidence directory" do
    workflow = YAML.safe_load_file(File.join(root, ".github/workflows/documenso-build.yml"))
    steps = workflow.fetch("jobs").fetch("functional-qa").fetch("steps")
    cleanup = steps.select { |step| step.fetch("run", "").include?("--cleanup --work") }
    artifacts = steps.select { |step| step.fetch("uses", "").start_with?("actions/upload-artifact@") }

    expect(cleanup.size).to eq(1)
    expect(cleanup.first.fetch("if")).to eq("always()")
    expect(artifacts.size).to eq(1)
    expect(artifacts.first.fetch("if")).to eq("always()")
    expect(artifacts.first.fetch("with").fetch("path")).to eq("${{ env.MIRU_QA_WORK }}/evidence/")
  end
end
