# frozen_string_literal: true

class Api::V1::Invoices::WaivedController < Api::V1::ApplicationController
  def update
    authorize :update, policy_class: Invoices::WaivedPolicy
    invoice.waived!
  end

  private

    def invoice
      @_invoice ||= current_company.invoices.includes(:client, :invoice_line_items).find(params[:id])
    end
end
