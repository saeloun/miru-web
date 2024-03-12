class AddInsuranceDetailsToDevices < ActiveRecord::Migration[7.0]
  def change
    add_column :devices, :is_insured, :boolean, default: false
    add_column :devices, :insurance_bought_date, :date
    add_column :devices, :insurance_expiry_date, :date
  end
end
