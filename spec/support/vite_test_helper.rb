# frozen_string_literal: true

# Helper to ensure Vite assets are available in test environment
module ViteTestHelper
  def self.ensure_vite_assets_built
    # Check if assets are built
    manifest_path = Rails.root.join("public", "vite-test", ".vite", "manifest.json")

    unless File.exist?(manifest_path)
      puts "Building Vite assets for test environment..."
      system("RAILS_ENV=test bundle exec rails vite:clobber vite:build", exception: true)
    end

    # Verify manifest was created
    unless File.exist?(manifest_path)
      raise "Failed to build Vite assets for test environment"
    end
  end

  def self.precompile_assets_if_needed
    # Only build if files have changed or manifest doesn't exist
    manifest_path = Rails.root.join("public", "vite-test", ".vite", "manifest.json")

    if !File.exist?(manifest_path) || assets_outdated?
      puts "Precompiling assets for test environment..."
      system("RAILS_ENV=test bundle exec rails vite:build", exception: true)
    end
  end

  private

    def self.assets_outdated?
      # Check if source files are newer than manifest
      manifest_path = Rails.root.join("public", "vite-test", ".vite", "manifest.json")
      return true unless File.exist?(manifest_path)

      manifest_time = File.mtime(manifest_path)
      source_dirs = [
        Rails.root.join("app", "javascript"),
        Rails.root.join("app", "assets", "stylesheets")
      ]

      source_dirs.any? do |dir|
        Dir.glob(File.join(dir, "**", "*")).any? do |file|
          File.file?(file) && File.mtime(file) > manifest_time
        end
      end
    end
end

# Ensure assets are built before running tests
RSpec.configure do |config|
  config.before(:suite) do
    ViteTestHelper.ensure_vite_assets_built if ENV["RAILS_ENV"] == "test"
  end
end
