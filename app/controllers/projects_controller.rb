# frozen_string_literal: true

class ProjectsController < ApplicationController
  def index
    @q = Project.ransack(params[:q])
    @projects = @q.result(distinct: true)
  end
end
