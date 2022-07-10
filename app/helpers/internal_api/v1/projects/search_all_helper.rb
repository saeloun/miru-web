# frozen_string_literal: true

module InternalApi::V1::Projects::SearchAllHelper
  def search_all_projects(search_term)
    search_term = search_term.downcase.strip
    search_term = search_term.gsub(/\s+/, "%")
    search_term = "#{search_term}%"
    projects = User.joins(
      "JOIN project_members ON users.id = project_members.user_id
      JOIN projects ON projects.id = project_members.project_id
      JOIN clients ON projects.client_id = clients.id"
    ).where(
      "projects.discarded_at IS NULL
      AND clients.company_id = ?
      AND (
      lower(projects.name) LIKE ?
      OR lower(clients.name) LIKE ?
      OR lower(concat(users.first_name, ' ', users.last_name)) LIKE ?
      )", current_company.id, search_term, search_term, search_term
    ).select("DISTINCT projects.id, projects.name, clients.name AS client_name")
  end
end
