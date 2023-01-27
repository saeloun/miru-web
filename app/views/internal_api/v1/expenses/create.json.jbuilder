# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.partial! "expense", locals: { expense: }
