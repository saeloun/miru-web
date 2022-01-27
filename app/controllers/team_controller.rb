# frozen_string_literal: true

class TeamController < ApplicationController
  def index
    @teams = current_company.users
  end

  def update
    @team =  User.find(params[:id])
    @team.state = 1
    @team.save!
    redirect_to "/team"
  end

  private
end
