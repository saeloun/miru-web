# frozen_string_literal: true

class InternalApi::V1::Reports::AccountsAgingController < InternalApi::V1::ApplicationController
  include Timesheet

  def index
    authorize :report
    render :index, locals: { reports: }, status: :ok
  end
end
