# frozen_string_literal: true

# Stub for Ferrum-based PDF generation services
# This stub prevents actual browser launches during tests

RSpec.configure do |config|
  config.before(:each) do |example|
    next if example.metadata[:type] == :system
    next if example.file_path&.include?("spec/services/pdf_generation/")
    next if example.file_path&.include?("spec/services/invoice_payment/pdf")
    next if example.file_path&.include?("spec/services/reports/generate_pdf")

    if defined?(Ferrum) && defined?(Ferrum::Browser)
      allow(Ferrum::Browser).to receive(:new).and_return(double("browser",
        quit: nil,
        go_to: nil,
        network: double("network", wait_for_idle: nil),
        pdf: "%PDF-1.4\nMocked PDF content"
      ))
    end
  end
end
