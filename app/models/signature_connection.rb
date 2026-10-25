# frozen_string_literal: true

class SignatureConnection < ApplicationRecord
  class Conflict < StandardError; end

  belongs_to :company
  belongs_to :created_by, class_name: "User"
  encrypts :api_key
  self.filter_attributes += [:api_key]
  scope :active, -> { where(disabled_at: nil) }
  audited associated_with: :company, only: [:company_id, :created_by_id, :disabled_at]

  validates :api_key, presence: true, length: { maximum: 4096 }
  validates :provider_origin, presence: true, length: { maximum: 500 }
  validate :valid_provider, on: :create
  validate :immutable_credentials, on: :update

  def client
    result = Signatures::DocumensoClient.new(api_key:)
    unless result.origin == provider_origin
      raise Signatures::DocumensoClient::ConfigurationError, "The signing provider changed. Connect this company again."
    end
    result
  end

  def activate!(previous_id:)
    company.with_lock do
      previous = self.class.active.find_by(company_id:)
      raise Conflict, "The signing connection changed. Reload before connecting again." unless previous&.id == previous_id

      previous&.update!(disabled_at: Time.current)
      save!
    end
  end

  private

    def valid_provider
      client
    rescue Signatures::DocumensoClient::ConfigurationError => error
      errors.add(:base, error.message)
    end

    def immutable_credentials
      if %w[company_id created_by_id api_key provider_origin].any? { |attribute| will_save_change_to_attribute?(attribute) }
        errors.add(:base, "Create a new connection to change its credentials")
      end
    end
end
