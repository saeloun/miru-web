# frozen_string_literal: true

class InvoiceMailer < ApplicationMailer
  include InvoicesHelper

  after_action -> { @invoice.sent! }

  def invoice
    @invoice = params[:invoice]
    recipients = params[:recipients]
    subject = params[:subject]
    @message = params[:message]

    controller = ActionController::Base.new
    html = controller.render_to_string(
      template: "invoices/pdf",
      layout: "layouts/pdf",
      locals: {
        invoice: @invoice,
        company_logo: @invoice.client.company.logo.attached? ?
                        polymorphic_url(@invoice.client.company.logo) :
                        "",
        client: @invoice.client,
        invoice_line_items: serializer(@invoice.invoice_line_items)[:invoice_line_items],
        sub_total: serializer(@invoice.invoice_line_items)[:sub_total],
        total: serializer(@invoice.invoice_line_items)[:total]
      }
      )

    pdf = Grover.new(html).to_pdf
    attachments["invoice_#{@invoice.invoice_number}.pdf"] = pdf

    mail(to: recipients, subject:, reply_to: "no-reply@miru.com")
  end
end
