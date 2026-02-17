# frozen_string_literal: true

# Stub for Ferrum-based PDF generation services
# This stub prevents actual browser launches during tests

RSpec.configure do |config|
  config.before(:each) do |example|
    # Skip stubbing for PDF generation specs themselves
    # These specs need to test the actual PDF generation logic
    next if example.file_path&.include?("spec/services/pdf_generation/")
    next if example.file_path&.include?("spec/services/invoice_payment/pdf")
    next if example.file_path&.include?("spec/services/reports/generate_pdf")

    # Stub Ferrum browser creation to avoid actual browser launches
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
