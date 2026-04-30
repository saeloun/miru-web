# frozen_string_literal: true

module Analytics
  class ScopeResolver < ApplicationService
    def initialize(user:, company:)
      @user = user
      @company = company
    end

    def process
      {
        role: effective_role,
        user_ids: scoped_user_ids,
        client_ids: scoped_client_ids,
        project_ids: scoped_project_ids
      }
    end

    private

      attr_reader :user, :company

      def effective_role
        return "owner" if user.has_cached_role?(:owner, company)
        return "admin" if user.has_cached_role?(:admin, company)
        return "book_keeper" if user.has_cached_role?(:book_keeper, company)
        return "manager" if user.has_cached_role?(:manager, company)
        return "employee" if user.has_cached_role?(:employee, company)
        return "client" if user.has_cached_role?(:client, company)

        nil
      end

      def scoped_project_ids
        @scoped_project_ids ||= begin
          return [] unless effective_role == "manager"

          user.project_members.kept.joins(:project).where(projects: { client_id: company.clients.select(:id) }).distinct.pluck(:project_id)
        end
      end

      def scoped_client_ids
        @scoped_client_ids ||= begin
          return [] unless effective_role == "manager"

          direct_client_ids = user.client_members.kept.where(company: company).pluck(:client_id)
          project_client_ids = Project.joins(:project_members)
            .where(project_members: { user_id: user.id, discarded_at: nil })
            .where(client_id: company.clients.select(:id))
            .distinct
            .pluck(:client_id)

          (direct_client_ids + project_client_ids).uniq
        end
      end

      def scoped_user_ids
        @scoped_user_ids ||= begin
          return [user.id] if effective_role == "employee"
          return [] unless effective_role == "manager"

          member_ids = User.joins(:project_members)
            .where(project_members: { project_id: scoped_project_ids, discarded_at: nil })
            .distinct
            .pluck(:id)

          (member_ids + [user.id]).uniq
        end
      end
  end
end
