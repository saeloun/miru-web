# frozen_string_literal: true

class ProjectsController < ApplicationController
  skip_after_action :verify_authorized

  def index
    @query = Project.ransack(params[:q])
    @projects = @query.result(distinct: true)
  end
end
