# frozen_string_literal: true

class InternalApi::V1::Reports::ClientRevenuesController < InternalApi::V1::ApplicationController
  def index
    authorize :report
    render :index,
      locals: Reports::ClientRevenues::IndexService.new(params, current_company).process,
      status: :ok
  end
end
