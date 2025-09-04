# frozen_string_literal: true

# Stub for PDF generation services
# This stub handles both legacy Grover and new Ferrum-based PDF generation

RSpec.configure do |config|
  config.before(:each) do
    # Stub Ferrum-based PDF generation - stub the public process method
    if defined?(PdfGeneration::BaseService)
      allow_any_instance_of(PdfGeneration::BaseService).to receive(:process).and_return("PDF content stub")
    end
    
    if defined?(PdfGeneration::InvoiceService)
      allow_any_instance_of(PdfGeneration::InvoiceService).to receive(:process).and_return("PDF content stub")
    end
    
    # Stub InvoicePayment::PdfGeneration service
    if defined?(InvoicePayment::PdfGeneration)
      allow_any_instance_of(InvoicePayment::PdfGeneration).to receive(:process).and_return("PDF content stub")
    end
    
    # Stub Reports::GeneratePdf service  
    if defined?(Reports::GeneratePdf)
      allow_any_instance_of(Reports::GeneratePdf).to receive(:process).and_return("PDF content stub")
    end
    
    # If Grover is still defined (for backward compatibility), stub it
    if defined?(Grover)
      allow_any_instance_of(Grover).to receive(:to_pdf).and_return("PDF content stub")
    end
    
    # Also stub Ferrum browser creation to avoid actual browser launches
    if defined?(Ferrum) && defined?(Ferrum::Browser)
      allow(Ferrum::Browser).to receive(:new).and_return(double("browser", 
        quit: nil, 
        go_to: nil, 
        network: double("network", wait_for_idle: nil),
        pdf: "PDF content stub"
      ))
    end
  end
end