# frozen_string_literal: true

class SignatureRequestPolicy < AgreementTemplatePolicy
  class Scope
    def initialize(user, scope)
      @user, @scope = user, scope
    end

    def resolve
      workspace_id = @user.current_workspace_id
      records = @scope.where(company_id: workspace_id)
      return records.none unless @user.kept?
      return records if SignatureRequestPolicy.new(@user, SignatureRequest).administrator_of?(workspace_id)

      employments = Employment.kept.where(company_id: workspace_id, user_id: @user.id).select(:id)
      clients = ClientMember.kept.joins(:client).merge(Client.kept).where(user_id: @user.id,
        company_id: workspace_id, clients: { company_id: workspace_id }).select("client_members.client_id")
      records.where(employment_id: employments).or(records.where(client_id: clients))
    end
  end

  def archives? = user.kept?

  def archive?
    Scope.new(user, SignatureRequest.where(id: record.id)).resolve.exists?
  end

  alias_method :sources?, :update?
  alias_method :revision?, :show?
  alias_method :original?, :download?
end
