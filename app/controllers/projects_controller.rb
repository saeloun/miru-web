# frozen_string_literal: true

class ProjectsController < ApplicationController
  def index
    if params["query"]
      @projects = Project.where("name LIKE ?", "%#{params['query']}%")
    else
      @projects = Project.all
    end
  end
end
