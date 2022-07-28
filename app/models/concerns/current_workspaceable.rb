# frozen_string_literal: true

# frozen_style_literal: true

module CurrentWorkspaceable
  extend ActiveSupport::Concern

  included do
    after_save :create_employment_from_current_workspace
  end

  def current_workspace(load_associations: [:logo_attachment])
    @_current_workspace ||= Company.includes(load_associations).find_by(id: current_workspace_id)
  end

  def current_workspace=(workspace)
    raise ArgumentError, "Workspace must be a Company" unless workspace.is_a?(Company)
    raise ArgumentError, "Workspace must exist" unless workspace.persisted?

    write_attribute(:current_workspace_id, workspace.id)
  end

  private

    def create_employment_from_current_workspace
      return unless saved_change_to_attribute?(:current_workspace_id)

      employment = employments.find_by(company_id: current_workspace_id)
      employment ||= employments.create!(company_id: current_workspace_id)
    end
end
