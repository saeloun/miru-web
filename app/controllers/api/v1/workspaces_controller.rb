# frozen_string_literal: true

class Api::V1::WorkspacesController < Api::V1::BaseController
  before_action :set_workspace, only: [:show, :update, :destroy, :switch]
  after_action :verify_authorized, except: [:index]

  def index
    workspaces = current_user.companies.includes(:logo_attachment).order(:name)
    render json: {
      workspaces: workspaces.map { |w| serialize_workspace(w) },
      current_workspace_id: current_user.current_workspace_id
    }, status: 200
  end

  def show
    authorize @workspace
    render json: { workspace: serialize_workspace(@workspace) }, status: 200
  end

  def create
    @workspace = Company.new(workspace_params)
    @workspace.users << current_user
    authorize @workspace

    if @workspace.save
      current_user.update(current_workspace_id: @workspace.id)
      render json: {
        workspace: serialize_workspace(@workspace),
        notice: "Workspace created successfully"
      }, status: 201
    else
      render json: { errors: @workspace.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize @workspace

    if @workspace.update(workspace_params)
      render json: {
        workspace: serialize_workspace(@workspace),
        notice: "Workspace updated successfully"
      }, status: 200
    else
      render json: { errors: @workspace.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @workspace

    if @workspace.destroy
      render json: { notice: "Workspace deleted successfully" }, status: 200
    else
      render json: { errors: ["Failed to delete workspace"] }, status: :unprocessable_entity
    end
  end

  def switch
    authorize @workspace, :show?
    current_user.update(current_workspace_id: @workspace.id)
    render json: {
      workspace: serialize_workspace(@workspace),
      notice: "Switched to #{@workspace.name}"
    }, status: 200
  end

  private

    def set_workspace
      @workspace = current_user.companies.find(params[:id])
    end

    def workspace_params
      params.require(:workspace).permit(:name, :business_phone, :base_currency, :standard_price,
                                        :fiscal_year_end, :date_format, :timezone)
    end

    def serialize_workspace(workspace)
      {
        id: workspace.id,
        name: workspace.name,
        logo_url: workspace.logo.attached? ? rails_blob_url(workspace.logo) : nil,
        business_phone: workspace.business_phone,
        base_currency: workspace.base_currency,
        standard_price: workspace.standard_price,
        fiscal_year_end: workspace.fiscal_year_end,
        date_format: workspace.date_format,
        timezone: workspace.timezone,
        is_current: workspace.id == current_user.current_workspace_id
      }
    end
end
