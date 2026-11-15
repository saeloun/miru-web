# frozen_string_literal: true

module ConsultantInvoiceStorageProtection
  extend ActiveSupport::Concern

  included do
    prepend_before_action :reject_private_consultant_invoice, only: :show
  end

  private

    # Invoice bytes must pass the workspace/subject checks in our authenticated
    # download actions, even when a storage bearer URL has escaped its owner.
    def reject_private_consultant_invoice
      blob = if is_a?(ActiveStorage::DiskController)
        key = decode_verified_key
        ActiveStorage::Blob.find_by(key: key[:key]) if key
      else
        signed_id = params[:signed_blob_id] || params[:signed_id]
        ActiveStorage::Blob.find_signed(signed_id) if signed_id.is_a?(String)
      end
      return unless blob

      private_invoice = PayrollInvoicePreparation.exists?(original_blob_id: blob.id) ||
        PayrollConsultantInvoice.where(pdf_blob_id: blob.id).or(PayrollConsultantInvoice.where(original_blob_id: blob.id)).exists?
      return unless private_invoice

      response.headers["Cache-Control"] = "private, no-store"
      head 404
    end
end
