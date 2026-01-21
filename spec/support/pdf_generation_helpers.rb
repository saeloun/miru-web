# frozen_string_literal: true

# PDF Generation Test Helpers
#
# This module provides helpers for stubbing PDF generation in tests.
# Since PDF generation uses Ferrum (headless Chrome) which can be slow
# and unreliable in test environments, we stub it to return a simple
# PDF string instead of actually generating PDFs.

RSpec.configure do |config|
  config.before do |example|
    # Stub PDF generation for all tests except those explicitly tagged
    # with :generate_real_pdfs
    unless example.metadata[:generate_real_pdfs]
      allow(FerrumPdf).to receive(:render_pdf).and_return("%PDF-1.4 fake pdf content")
    end
  end
end
