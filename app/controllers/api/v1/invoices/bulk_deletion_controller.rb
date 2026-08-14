# frozen_string_literal: true

class Api::V1::Invoices::BulkDeletionController < Api::V1::ApplicationController
  def create
    authorize :create, policy_class: Invoices::BulkDeletionPolicy

    invoices = current_company.invoices.where(id: params[:invoices_ids])
    undeletable_invoice_ids = invoices.reject(&:destroy).map(&:id)

    if undeletable_invoice_ids.any?
      render json: {
        error: "Some invoices could not be deleted because they have recorded payments.",
        undeletable_invoice_ids:
      }, status: 422
    else
      head 204
    end
  end
end
