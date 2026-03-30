# frozen_string_literal: true

class Agent < ApplicationRecord
  PROVIDERS = %w[custom claude codex openclaw].freeze

  belongs_to :company
  belongs_to :user
  belongs_to :default_project, class_name: "Project", optional: true

  has_many :agent_keys, dependent: :destroy
  has_many :timesheet_entries, dependent: :nullify

  validates :name, presence: true, length: { maximum: 80 }, uniqueness: { scope: :company_id, case_sensitive: false }
  validates :provider, presence: true, length: { maximum: 50 }
  validate :default_project_belongs_to_company
  validate :user_belongs_to_company

  scope :active, -> { where(active: true) }

  def provider_label
    provider.to_s.split(/[_-]/).reject(&:blank?).map(&:capitalize).join(" ")
  end

  def backing_user_active_for_company?
    return false if user.blank? || company.blank?
    return false unless user.active_for_authentication?

    user.current_workspace_id == company_id || user.employed_at?(company_id)
  end

  private

    def default_project_belongs_to_company
      return if default_project.blank? || default_project.client.company_id == company_id

      errors.add(:default_project, "must belong to the same company")
    end

    def user_belongs_to_company
      return if user.blank? || company.blank?
      return if user.current_workspace_id == company_id
      return if user.employed_at?(company_id)

      errors.add(:user, "must belong to the same company")
    end
end
