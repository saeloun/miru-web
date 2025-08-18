# frozen_string_literal: true

module Api::V1
  module Reports
    class TimeEntriesController < Api::V1::ApplicationController
      before_action :authenticate_user!
      after_action :verify_authorized

      def index
        authorize :report, :index?

        reports_data = ::Reports::TimeEntries::ReportService.new(params, current_company, get_filters: true).process

        # Format reports with user and project details
        formatted_reports = reports_data[:reports].map do |report|
          {
            label: report[:label],
            id: report[:id],
            entries: report[:entries].map do |entry|
              entry_hash = entry.as_json
              entry_hash["user_name"] = entry.user&.full_name
              entry_hash["project_name"] = entry.project&.name
              entry_hash["client_name"] = entry.project&.client&.name
              entry_hash
            end
          }
        end

        render json: {
          reports: formatted_reports,
          pagy: reports_data[:pagination_details],
          filterOptions: {
            clients: format_filter_options(reports_data[:filter_options][:clients]),
            teamMembers: format_team_members(reports_data[:filter_options][:team_members]),
            projects: reports_data[:filter_options][:projects]
          },
          groupByTotalDuration: reports_data[:group_by_total_duration] || {
            groupBy: params[:group_by] || "client",
            groupedDurations: {}
          }
        }
      end

      def download
        authorize :report, :index?

        send_data ::Reports::TimeEntries::DownloadService.new(params, current_company).process,
                  filename: "time_entries_#{Date.current}.#{params[:format]}",
                  type: params[:format] == "pdf" ? "application/pdf" : "text/csv"
      end

      private

        def format_filter_options(clients)
          return [] unless clients

          clients.map do |client|
            {
              id: client.id,
              name: client.name,
              logo: client.logo_url
            }
          end
        end

        def format_team_members(team_members)
          return [] unless team_members

          team_members.map do |member|
            {
              id: member.id,
              name: member.full_name
            }
          end
        end

        def current_company
          @_current_company ||= current_user.current_workspace
        end
    end
  end
end
