# frozen_string_literal: true

json.partial! "invitation", locals: { invitation: }
json.notice I18n.t("invitation.update.success.message")
