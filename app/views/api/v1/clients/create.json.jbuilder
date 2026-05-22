# frozen_string_literal: true

json.notice I18n.t("client.create.success")
json.partial! "client", locals: { client:, address: }
