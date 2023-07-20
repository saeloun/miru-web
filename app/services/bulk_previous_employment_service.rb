# frozen_string_literal: true

class BulkPreviousEmploymentService
  attr_reader :employments

  def initialize(employments)
    @employments = employments
  end

  def process
    ActiveRecord::Base.transaction do
      add_new_employments(employments[:added_employments])
      update_existing_employments(employments[:updated_employments])
      remove_employments(employments[:removed_employment_ids])
    end
  end

  def add_new_employments(added_employments)
    return if added_employments.blank?

    added_employments.each do |employment_params|
      user.previous_employments.create!(
        company_name: employment_params["company_name"],
        role: employment_params["role"],
      )
    end
  end

  def update_existing_employments(updated_employments)
    return if updated_employments.blank?

    updated_employments.each do |employment_params|
      previous_employment = user.previous_employments.find_by(id: employment_params["id"])
      next unless previous_employment

      previous_employment.update!(
        company_name: employment_params["company_name"],
        role: employment_params["role"],
      )
    end
  end

  def remove_employments(removed_employment_ids)
    return if removed_employment_ids.blank?

    user.previous_employments.where(id: removed_employment_ids).destroy_all
  end

  private

    def user
      @user ||= employments[:user]
    end
end
