# frozen_string_literal: true

require "spec_helper"
require "open3"
require "tmpdir"
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

  it "loads the auto-required policy matchers after the application preload" do
    prefix, errors, status = Open3.capture3("python3", "-I", "-B", "-c", <<~PYTHON, chdir: root)
      import ast, pathlib
      tree = ast.parse(pathlib.Path("scripts/ci/documenso_functional_qa.py").read_text())
      preload = next(ast.literal_eval(node.value) for node in tree.body if isinstance(node, ast.Assign)
                     and any(isinstance(target, ast.Name) and target.id == "PRELOAD" for target in node.targets))
      print(preload.split("cfg = JSON.parse", 1)[0])
    PYTHON
    expect(status).to be_success, errors

    Dir.mktmpdir("signing-loader") do |directory|
      File.write(File.join(directory, "empty.env"), "")
      Dir.mkdir(File.join(directory, "tmp"))
      preload = File.join(directory, "preload.rb")
      File.write(preload, prefix + <<~RUBY)
        qa_env = File.join(__dir__, "empty.env")
        Dotenv::Railtie.prepend(Module.new do
          define_method(:dotenv_files) { [qa_env] }
          private :dotenv_files
        end)
        Dotenv.singleton_class.prepend(Module.new do
          %i[load overload].each do |method|
            define_method(method) do |*files, **options|
              raise "Unowned dotenv refused" unless files.any? && files.all? { |file| File.expand_path(file) == qa_env }
              super(*files, **options)
            end
          end
        end)
        require File.join(ENV.fetch("DOCUMENSO_LIVE_APP"), "config/application")
      RUBY
      fixture = File.join(directory, "loader_spec.rb")
      File.write(fixture, <<~RUBY)
        RSpec.describe "isolated public helper loader" do
          it("loads before Rails initialization") { expect(Rails.application.initialized?).to be(false) }
        end
      RUBY
      output, errors, status = Open3.capture3(
        { "PATH" => "#{File.dirname(RbConfig.ruby)}:/usr/bin:/bin", "HOME" => directory, "RAILS_ENV" => "test", "CI" => "true",
          "BUNDLE_GEMFILE" => File.join(root, "Gemfile"), "DOCUMENSO_LIVE_APP" => root, "RUBYOPT" => "-r#{preload}" },
        RbConfig.ruby, Gem.bin_path("bundler", "bundle"), "exec", "rspec", "--options", File.join(root, ".rspec"),
        "-I", File.join(root, "spec"), fixture, "--no-color", chdir: directory, unsetenv_others: true)

      expect(status).to be_success, output + errors
      expect(output).to include("1 example, 0 failures")
    end
  end
end
