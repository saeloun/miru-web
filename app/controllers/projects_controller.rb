# Delete_file
# frozen_string_literal: true

class ProjectsController < ApplicationController
  def index
    authorize Project
  end
end
