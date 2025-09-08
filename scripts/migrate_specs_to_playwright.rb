#!/usr/bin/env ruby
# frozen_string_literal: true

require "fileutils"
require "pathname"

class SpecMigrator
  SPEC_DIR = "spec/system"
  PLAYWRIGHT_DIR = "playwright/tests"

  MAPPING = {
    "fill_in" => "page.fill",
    "click_on" => "page.click",
    "click_button" => "page.click",
    "click_link" => "page.click",
    "have_content" => "page.locator",
    "have_text" => "page.locator",
    "have_current_path" => "page.url()",
    "find" => "page.locator",
    "select" => "page.selectOption",
    "check" => "page.check",
    "uncheck" => "page.uncheck",
    "visit" => "page.goto",
    "within" => "page.locator"
  }

  def initialize
    @converted_count = 0
    @failed_conversions = []
  end

  def migrate_all
    puts "Starting migration of Capybara specs to Playwright..."

    Dir.glob("#{SPEC_DIR}/**/*.rb").each do |spec_file|
      next if spec_file.include?("shared_examples")

      begin
        migrate_spec(spec_file)
        @converted_count += 1
      rescue => e
        @failed_conversions << spec_file
        puts "Failed to migrate #{spec_file}: #{e.message}"
      end
    end

    puts "\n=== Migration Summary ==="
    puts "Successfully converted: #{@converted_count} specs"
    puts "Failed conversions: #{@failed_conversions.count}"
    @failed_conversions.each { |f| puts "  - #{f}" }
  end

  def migrate_spec(spec_file)
    content = File.read(spec_file)
    relative_path = Pathname.new(spec_file).relative_path_from(Pathname.new(SPEC_DIR))

    # Determine output path
    output_path = File.join(PLAYWRIGHT_DIR, relative_path.to_s.gsub("_spec.rb", ".spec.ts"))
    output_dir = File.dirname(output_path)

    # Create directory if needed
    FileUtils.mkdir_p(output_dir)

    # Convert the spec
    converted = convert_spec_content(content, spec_file)

    # Write the converted spec
    File.write(output_path, converted)
    puts "✓ Migrated: #{spec_file} → #{output_path}"
  end

  def convert_spec_content(content, filename)
    # Extract test descriptions and examples
    describe_match = content.match(/RSpec\.describe\s+"([^"]+)"/)
    test_name = describe_match ? describe_match[1] : File.basename(filename, "_spec.rb")

    typescript_content = <<~TS
      import { test, expect } from '@playwright/test';
      import { login } from '../../helpers/auth';

      test.describe('#{test_name}', () => {
        // Default test user - update as needed
        const testUser = {
          email: 'vipul@saeloun.com',
          password: 'password'
        };
      #{'  '}
        test.beforeEach(async ({ page }) => {
          await login(page, testUser.email, testUser.password);
        });
      #{'  '}
    TS

    # Convert each 'it' block
    content.scan(/it\s+"([^"]+)".*?do(.*?)end/m).each do |match|
      test_description = match[0]
      test_body = match[1]

      converted_body = convert_test_body(test_body)

      typescript_content += <<~TS
        test('#{test_description}', async ({ page }) => {
      #{converted_body}
        });
      #{'  '}
      TS
    end

    typescript_content += "});\n"
    typescript_content
  end

  def convert_test_body(body)
    converted = body

    # Convert visit statements
    converted.gsub!(/visit\s+"([^"]+)"/, 'await page.goto("\1")')
    converted.gsub!(/visit\s+'([^']+)'/, "await page.goto('\\1')")

    # Convert fill_in statements
    converted.gsub!(/fill_in\s+"([^"]+)",\s*with:\s*(.+)$/) do
      "await page.fill('input[placeholder=\"#{$1}\"]', #{$2})"
    end

    # Convert click statements
    converted.gsub!(/click_on\s+"([^"]+)"/, 'await page.click(\'text=\1\')')
    converted.gsub!(/click_button\s+"([^"]+)"/, 'await page.click(\'button:has-text("\1")\')')

    # Convert expectations
    converted.gsub!(/expect\(page\)\.to\s+have_content\("([^"]+)"\)/) do
      "await expect(page.locator('text=#{$1}')).toBeVisible()"
    end

    converted.gsub!(/expect\(page\)\.to\s+have_current_path\("([^"]+)"\)/) do
      "await expect(page).toHaveURL('#{$1}')"
    end

    # Convert select statements
    converted.gsub!(/select\s+"([^"]+)",\s*from:\s*"([^"]+)"/) do
      "await page.selectOption('select[name=\"#{$2}\"]', '#{$1}')"
    end

    # Add await to page operations that don't have it
    converted.gsub!(/^(\s+)(page\.(click|fill|goto|selectOption|check|uncheck))/, '\1await \2')

    # Indent properly
    converted.split("\n").map { |line| "    #{line}" }.join("\n")
  end
end

# Run the migration
if __FILE__ == $0
  migrator = SpecMigrator.new
  migrator.migrate_all
end
