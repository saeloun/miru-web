# frozen_string_literal: true

# Preview all emails at http://localhost:3000/rails/mailers/invoice_mailer
class InvoiceMailerPreview < ActionMailer::Preview
  def send_invoice
    invoice = Invoice.last || create_sample_invoice
    invoice.company.logo.attached? ?
      Rails.application.routes.url_helpers.polymorphic_url(invoice.company.logo) : ""

    # Generate sample PDF data
    pdf_data = "%PDF-1.4\n%Sample PDF Content\n%%EOF"

    InvoiceMailer.with(
      invoice: invoice,
      pdf_data: pdf_data,
      subject: "Invoice #{invoice.invoice_number} from #{invoice.company.name}",
      recipients: ["client@example.com"],
      message: "Please find attached the invoice for services rendered. Payment is due by #{invoice.due_date.strftime('%B %d, %Y')}.\n\nThank you for your business!"
    ).send_invoice
  end

  def invoice
    invoice = Invoice.last || create_sample_invoice

    InvoiceMailer.with(
      invoice_id: invoice.id,
      subject: "Invoice #{invoice.invoice_number}",
      recipients: ["client@example.com"],
      message: "Please review the attached invoice."
    ).invoice
  end

  private

    def create_sample_invoice
      # Create sample data for preview if no invoices exist
      company = Company.first || Company.create!(
        name: "Sample Company",
        business_phone: "123-456-7890",
        address: "123 Main St",
        city: "New York",
        state: "NY",
        country: "USA",
        zip: "10001"
      )

      client = company.clients.first || company.clients.create!(
        name: "Sample Client",
        email: "client@example.com",
        phone: "987-654-3210",
        address: "456 Client Ave",
        city: "Los Angeles",
        state: "CA",
        country: "USA",
        zip: "90001"
      )

      invoice = company.invoices.create!(
        client: client,
        invoice_number: "INV-2024-001",
        reference: "REF-001",
        issue_date: Date.current,
        due_date: 30.days.from_now,
        amount: 1500.00,
        tax: 150.00,
        discount: 50.00,
        amount_due: 1600.00,
        amount_paid: 0.00,
        status: "draft",
        currency: "USD"
      )

      # Add line items
      invoice.invoice_line_items.create!(
        name: "Web Development",
        description: "Frontend development services",
        date: Date.current,
        quantity: 600, # 10 hours in minutes
        rate: 150.00
      )

      invoice.invoice_line_items.create!(
        name: "Design Services",
        description: "UI/UX design work",
        date: Date.current,
        quantity: 300, # 5 hours in minutes
        rate: 100.00
      )

      invoice
    end
end
