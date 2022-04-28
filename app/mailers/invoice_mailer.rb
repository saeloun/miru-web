# frozen_string_literal: true

class InvoiceMailer < ApplicationMailer
  include InvoicesHelper
  include ActionController::MimeResponds

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
        company_logo: @invoice.client.company.logo.attached? ? polymorphic_url(@invoice.client.company.logo) : ""
      })

    style_tag_options = [
      { content: "h1{background-color: red}" }
    ]
    pdf = Grover.new(html, style_tag_options:).to_pdf
    attachments["invoice_#{@invoice.id}.pdf"] = pdf

    mail(to: recipients, subject:)
  end
end
