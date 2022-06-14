# frozen_string_literal: true

json.extract! lead, :id, :name, :budget_amount, :budget_status_code,
                    :industry_code, :quality_code,
                    :state_code, :status_code, :budget_status_code_name,
                    :industry_code_name, :quality_code_name,
                    :state_code_name, :status_code_name
