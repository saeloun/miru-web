# frozen_string_literal: true

# delete this
class ReportsController < ApplicationController
  def index
    authorize :report
  end
end
