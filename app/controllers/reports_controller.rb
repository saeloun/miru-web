# frozen_string_literal: true

class ReportsController < ApplicationController
  def index
    authorize :report
  end
end
