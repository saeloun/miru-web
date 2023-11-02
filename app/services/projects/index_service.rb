# frozen_string_literal: true

module Projects
  class IndexService < ApplicationService
    attr_reader :current_company, :search_term

    def initialize(current_company, search_term)
      @current_company = current_company
      @search_term = search_term
    end

    def process
      {
        projects: fetch_projects,
        clients: client_list
      }
    end

    def fetch_projects
      @_fetch_projects ||= Project.search(
        search_query,
        fields: [:client_name, :name],
        match: :text_middle,
        where: { client_id: client_ids, discarded_at: nil },
        includes: [:client, :timesheet_entries]
      )
    end

    def search_query
      @_search_query ||= search_term.present? ? search_term : "*"
    end

    def client_list
      @_client_list ||= current_company.clients
    end

    def client_ids
      client_list.pluck(:id).uniq
    end
  end
end
