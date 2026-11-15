# frozen_string_literal: true

Rails.application.config.to_prepare do
  [ActiveStorage::Blobs::RedirectController, ActiveStorage::Blobs::ProxyController,
   ActiveStorage::Representations::RedirectController, ActiveStorage::Representations::ProxyController,
   ActiveStorage::DiskController].each do |controller|
    controller.include(ConsultantInvoiceStorageProtection) unless controller < ConsultantInvoiceStorageProtection
  end
end
