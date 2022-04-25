# frozen_string_literal: true

class ProjectsController < ApplicationController
  skip_after_action :verify_authorized

  def index
    authorize Project
  end
end
