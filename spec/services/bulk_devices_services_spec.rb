# frozen_string_literal: true

require "rails_helper"

RSpec.describe BulkDevicesService do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:device1) { Device.create(
    issued_to: user, issued_by: company, device_type: "laptop",
    name: "Device 1", serial_number: "123456", specifications: { processor: "i5", ram: "8GB", graphics: "Intel" },
    is_insured: true, insurance_bought_date: "2020-01-01", insurance_expiry_date: "2023-01-01")
}
  let!(:device2) { Device.create(
    issued_to: user, issued_by: company, device_type: "mobile",
    name: "Device 2", serial_number: "654321", specifications: { processor: "i3", ram: "4GB", graphics: "AMD" },
    is_insured: false)
}

  describe "#process" do
    context "when adding new devices" do
      let(:new_device_params) do
        {
          add_devices: [
            {
              device_type: "laptop",
              name: "New Laptop",
              serial_number: "123ABC",
              is_insured: true,
              insurance_bought_date: "2023-01-01",
              insurance_expiry_date: "2024-01-01",
              specifications: { processor: "i7", ram: "16GB", graphics: "NVIDIA" }
            }
          ]
        }
      end

      it "adds new devices to the user" do
        expect {
          described_class.new(new_device_params, user).process
        }.to change { user.devices.count }.by(1)
      end

      it "sets the correct attributes for the new devices" do
        described_class.new(new_device_params, user).process
        new_device = user.devices.last

        expect(new_device.device_type).to eq("laptop")
        expect(new_device.name).to eq("New Laptop")
        expect(new_device.serial_number).to eq("123ABC")
        expect(new_device.is_insured).to be true
        expect(new_device.insurance_bought_date).to eq(Date.parse("2023-01-01"))
        expect(new_device.insurance_expiry_date).to eq(Date.parse("2024-01-01"))
        expect(new_device.specifications).to eq({ "processor" => "i7", "ram" => "16GB", "graphics" => "NVIDIA" })
      end
    end

    context "when updating existing devices" do
      let(:update_device_params) do
        {
          update_devices: [
            {
              id: device1.id,
              device_type: "mobile",
              name: "Updated mobile",
              serial_number: "456DEF",
              is_insured: false,
              specifications: { processor: "i5", ram: "8GB", graphics: "Integrated" }
            }
          ]
        }
      end

      it "updates the specified devices" do
        described_class.new(update_device_params, user).process
        device1.reload

        expect(device1.device_type).to eq("mobile")
        expect(device1.name).to eq("Updated mobile")
        expect(device1.serial_number).to eq("456DEF")
        expect(device1.is_insured).to be false
        expect(device1.specifications).to eq({ "processor" => "i5", "ram" => "8GB", "graphics" => "Integrated" })
      end
    end

    context "when removing devices" do
      let(:remove_device_params) do
        {
          remove_devices: [device2.id]
        }
      end

      it "removes the specified devices" do
        expect {
          described_class.new(remove_device_params, user).process
        }.to change { user.devices.count }.by(-1)
      end
    end

    context "when performing multiple actions" do
      let(:multiple_actions_params) do
        {
          add_devices: [
            {
              device_type: "laptop",
              name: "New Laptop",
              serial_number: "123ABC",
              is_insured: true,
              insurance_bought_date: "2023-01-01",
              insurance_expiry_date: "2024-01-01",
              specifications: { processor: "i7", ram: "16GB", graphics: "NVIDIA" }
            }
          ],
          update_devices: [
            {
              id: device1.id,
              device_type: "mobile",
              name: "Updated mobile",
              serial_number: "456DEF",
              is_insured: false,
              specifications: { processor: "i5", ram: "8GB", graphics: "Integrated" }
            }
          ],
          remove_devices: [device2.id]
        }
      end

      it "adds new devices" do
        expect {
          described_class.new(multiple_actions_params, user).process
        }.to change { user.devices.count }.by(0)

        new_device = user.devices.find_by(serial_number: "123ABC")
        expect(new_device).not_to be_nil
      end

      it "updates existing devices" do
        described_class.new(multiple_actions_params, user).process
        device1.reload

        expect(device1.device_type).to eq("mobile")
        expect(device1.name).to eq("Updated mobile")
        expect(device1.serial_number).to eq("456DEF")
        expect(device1.is_insured).to be false
        expect(device1.specifications).to eq({ "processor" => "i5", "ram" => "8GB", "graphics" => "Integrated" })
      end

      it "removes specified devices" do
        described_class.new(multiple_actions_params, user).process

        expect(user.devices.exists?(id: device2.id)).to be false
      end
    end
  end
end
