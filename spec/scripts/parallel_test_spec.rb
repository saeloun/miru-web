# frozen_string_literal: true

require "spec_helper"
require "fileutils"
require "open3"
require "rbconfig"
require "tmpdir"

RSpec.describe "Parallel test launcher" do
  let(:root) { File.expand_path("../..", __dir__) }

  # Isolate app configuration while exercising the real parallel-tests process.
  def run_specs(runtime_entries:, failing: false)
    Dir.mktmpdir("miru-parallel-") do |directory|
      FileUtils.mkdir_p(File.join(directory, "spec"))
      3.times do |index|
        File.write(File.join(directory, "spec/example_#{index}_spec.rb"), <<~RUBY)
          RSpec.describe "Example #{index}" do
            it "runs" do
              File.open("executed.txt", "a") { |file| file.puts(#{index}) }
              expect(#{!failing || index != 1}).to be(true)
            end
          end
        RUBY
      end
      if runtime_entries
        File.write(File.join(directory, "runtime.log"), runtime_entries.map { |index|
          "spec/example_#{index}_spec.rb:1.0\n"
        }.join)
      end

      output, errors, status = Open3.capture3(
        RbConfig.ruby, File.join(root, "bin/parallel_test"), "-n", "2",
        "--runtime-log", "runtime.log", "--failures-log", "failures.log", chdir: directory
      )
      executed = File.exist?(File.join(directory, "executed.txt")) ?
        File.readlines(File.join(directory, "executed.txt"), chomp: true).sort : []
      [output, errors, status, executed]
    end
  end

  it "runs every spec once with an incomplete runtime log" do
    output, errors, status, executed = run_specs(runtime_entries: [0])

    expect(status).to be_success, "#{output}\n#{errors}"
    expect(executed).to eq(%w[0 1 2])
    expect(output).to include("3 examples, 0 failures")
  end

  it "uses recorded runtimes when all selected specs have timings" do
    output, errors, status, executed = run_specs(runtime_entries: [0, 1, 2])

    expect(status).to be_success, "#{output}\n#{errors}"
    expect(executed).to eq(%w[0 1 2])
    expect(output).to include("Using recorded test runtime", "3 examples, 0 failures")
  end

  it "runs every spec when no runtime log exists" do
    output, errors, status, executed = run_specs(runtime_entries: nil)

    expect(status).to be_success, "#{output}\n#{errors}"
    expect(executed).to eq(%w[0 1 2])
  end

  it "preserves test failures when the runtime log is incomplete" do
    output, _errors, status, executed = run_specs(runtime_entries: [0], failing: true)

    expect(status).not_to be_success
    expect(executed).to eq(%w[0 1 2])
    expect(output).to include("3 examples, 1 failure")
  end
end
