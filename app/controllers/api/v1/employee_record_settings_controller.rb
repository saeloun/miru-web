# frozen_string_literal: true

class Api::V1::EmployeeRecordSettingsController < Api::V1::EmployeeRecordAdminController
  def show
    render_setting
  end

  def update
    attributes = mutation_params(:employee_record_setting, %w[company_id occasion_reminders_enabled])
    return if performed?

    enabled = attributes[:occasion_reminders_enabled]
    unless [true, false].include?(enabled)
      return render json: { errors: "occasion_reminders_enabled must be true or false" }, status: 422
    end
    current_company.with_lock do
      setting = EmployeeRecordSetting.find_or_initialize_by(company: current_company)
      setting.update!(occasion_reminders_enabled: enabled)
    end
    render_setting
  end

  private

    def render_setting
      setting = EmployeeRecordSetting.find_or_initialize_by(company: current_company)
      render json: { employee_record_setting: { company_id: current_company.id,
        occasion_reminders_enabled: setting.occasion_reminders_enabled } }
    end
end
