# frozen_string_literal: true

class Api::V1::Hiring::SettingsController < Api::V1::Hiring::BaseController
  def show
    render_settings(current_company.hiring_setting)
  end

  def update
    attributes = mutation_attributes(:hiring_setting, %w[company_id details lock_version])
    setting = configuration.save_draft!(details: attributes["details"], lock_version: attributes["lock_version"])
    render_settings(setting)
  end

  def approve
    attributes = mutation_attributes(:hiring_setting, %w[company_id lock_version])
    render_settings(configuration.approve!(lock_version: attributes["lock_version"]))
  end

  private

    def configuration = ::Hiring::Configure.new(company: current_company, actor: current_user)

    def render_settings(setting)
      fields = HiringSetting::TEXT_FIELDS + ["client_count"]
      complete = setting&.complete? || false
      render json: { company_id: current_company.id, settings: {
        details: setting&.details || fields.index_with(nil), lock_version: setting&.lock_version,
        approved: setting&.approved? || false, approved_at: setting&.approved_at, complete:,
        preview: complete ? { subject: setting.details.fetch("acknowledgement_subject"), body: setting.acknowledgement_text } : nil } }
    end
end
