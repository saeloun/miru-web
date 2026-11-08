# frozen_string_literal: true

module HiringDownloadHelpers
  def hiring_head(path, company_id)
    page.evaluate_async_script(<<~JS, path, company_id)
      const done = arguments[2];
      fetch(arguments[0] + '?company_id=' + arguments[1], {method: 'HEAD'})
        .then(async response => done({status: response.status, body: await response.text()}))
        .catch(error => done({error: error.message}));
    JS
  end

  def check_hiring_rows_available(*records, lock: "FOR UPDATE")
    Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do |connection|
        connection.transaction do
          records.each do |record|
            table = connection.quote_table_name(record.class.table_name)
            connection.execute("SELECT id FROM #{table} WHERE id = #{connection.quote(record.id)} #{lock} NOWAIT")
          end
        end
      end
    end.value
  end
end

RSpec.configure { |config| config.include HiringDownloadHelpers, type: :system }
