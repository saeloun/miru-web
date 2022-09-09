# frozen_string_literal: true

class InternalApi::V1::GenerateInvoiceController < InternalApi::V1::ApplicationController
  def index
    authorize :index, policy_class: GenerateInvoicePolicy
    render :index, locals: { current_company: }, status: :ok
  end

  def show
    authorize :show, policy_class: GenerateInvoicePolicy
    pagy, new_line_item_entries = pagy(client.new_line_item_entries(params[:selected_entries]), items: 10)
    render json: { new_line_item_entries:, pagy: pagy_metadata(pagy) }, status: :ok
  end

  def fetch_new_line_item_entries
    authorize :show, policy_class: GenerateInvoicePolicy
    new_line_item_entries = TimesheetEntry.search(
      params[:search_term],
      fields: [:note, :user_name],
      match: :text_middle,
      where: {
        user_id: params[:user_id],
        work_date: params[:start_date]..params[:end_date],
        id: { not: params[:selected_entries] }
      },
      page: params[:page], per_page: 10)
    render json: { new_line_item_entries:, filter_options: }, status: :ok
  end

  private

    def filter_options
      @_filter_options ||= {
        team_members: User.find(Project.find_by(client_id: 3).timesheet_entries.pluck(:user_id).uniq())
      }
    end

    def client
      @_client ||= Client.find(params[:id])
    end
end
