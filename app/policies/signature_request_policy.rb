# frozen_string_literal: true

class SignatureRequestPolicy < AgreementTemplatePolicy
  alias_method :sources?, :update?
  alias_method :revision?, :show?
  alias_method :original?, :download?
end
