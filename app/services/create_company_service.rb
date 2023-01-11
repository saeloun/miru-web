# frozen_string_literal: true

class CreateCompanyService
  attr_reader :params, :current_user
  attr_accessor :company

  def initialize(current_user, params: nil, company: nil)
    @params = params
    @current_user = current_user
    @company = company || Company.new(params)
  end

  def process
    company.save!
    add_current_user_to_company
  end

  private

    def add_current_user_to_company
      current_user.companies << company
      current_user.current_workspace_id = company.id
      current_user.add_role(:owner, company)
      current_user.save!
    end
end
