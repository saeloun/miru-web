# frozen_string_literal: true

class CreateCompanyService
  attr_reader :params, :current_user
  attr_accessor :company

  def initialize(params, current_user)
    @params = params
    @current_user = current_user
    @company = nil
  end

  def process
    @company = Company.new(params)
    company.save!
    update_current_user
  end

  private

    def update_current_user
      current_user.companies << company
      current_user.current_workspace_id = company.id
      current_user.add_role(:owner, company)
      current_user.save!
    end
end
