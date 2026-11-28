# frozen_string_literal: true

class Payroll::ConsultantInvoicePdf
  def initialize(snapshot:, kind:)
    @snapshot, @kind = snapshot, kind
  end

  def render
    raise ArgumentError, "Unknown consultant document" unless %w[invoice paid_settlement].include?(@kind)

    PdfGeneration::HtmlTemplateService.new("payroll_consultant_invoices/#{@kind}", locals: { snapshot: @snapshot, kind: @kind }).process
  end
end
