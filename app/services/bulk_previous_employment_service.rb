# frozen_string_literal: true

class BulkPreviousEmploymentService
  attr_reader :user, :employment, :employments

  def initialize(employments, user, employment)
    @employments = employments
    @user = user
    @employment = employment
  end

  def process
    ActiveRecord::Base.transaction do
      add_new_employments
      update_existing_employments
      remove_employments
      update_current_employment
    end
  end

  private

    def add_new_employments
      return if employments[:added_employments].blank?

      employments[:added_employments].each do |employment_params|
        user.previous_employments.create!(
          company_name: employment_params[:company_name],
          role: employment_params[:role]
        )
      end
    end

    def update_existing_employments
      return if employments[:updated_employments].blank?

      employments[:updated_employments].each do |employment_params|
        previous_employment = user.previous_employments.find_by(id: employment_params[:id])
        next unless previous_employment

        previous_employment.update!(
          company_name: employment_params[:company_name],
          role: employment_params[:role]
        )
      end
    end

    def remove_employments
      return if employments[:removed_employment_ids].blank?

      user.previous_employments.where(id: employments[:removed_employment_ids]).destroy_all
    end

    def update_current_employment
      return if employments[:current_employment].blank?

      employment.update!(employments[:current_employment])
    end
end
