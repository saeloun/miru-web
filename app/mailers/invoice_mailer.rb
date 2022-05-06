# frozen_string_literal: true

class InvoiceMailer < ApplicationMailer
  include InvoicesHelper

  after_action -> { @invoice.sent! }

  def invoice
    @invoice = params[:invoice]
    recipients = params[:recipients]
    subject = params[:subject]
    @message = params[:message]

    formatted_invoice = format_invoice(@invoice.invoice_line_items)

    controller = ActionController::Base.new
    html = controller.render_to_string(
      template: "invoices/pdf",
      layout: "layouts/pdf",
      locals: {
        invoice: @invoice,
        company_logo:,
        client: @invoice.client,
        invoice_line_items: formatted_invoice[:invoice_line_items],
        sub_total: formatted_invoice[:sub_total],
        total: formatted_invoice[:total]
      }
      )

    pdf = Grover.new(html).to_pdf
    attachments["invoice_#{@invoice.invoice_number}.pdf"] = pdf

    mail(to: recipients, subject:, reply_to: "no-reply@miru.com")
  end

  private

    def company_logo
      @invoice.company.logo.attached? ?
        polymorphic_url(@invoice.company.logo) :
        ""
    end
end
