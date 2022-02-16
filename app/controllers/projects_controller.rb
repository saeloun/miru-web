# frozen_string_literal: true

class ProjectsController < ApplicationController
  after_action :verify_authorized, except: :index

  def index
    @query = Project.ransack(params[:q])
    @projects = @query.result(distinct: true)
  end
end
