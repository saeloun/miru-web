# frozen_string_literal: true

class InternalApi::V1::Invoices::WaviedController < InternalApi::V1::ApplicationController
  def update
    authorize :update, policy_class: Invoices::WaviedPolicy
    invoice.wavied!
  end

  private

    def invoice
      @_invoice ||= Invoice.includes(:client, :invoice_line_items).find(params[:id])
    end
end
