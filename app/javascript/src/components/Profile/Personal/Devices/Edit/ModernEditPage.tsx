import React, { useState } from "react";
import { Laptop, Smartphone, Tablet, Monitor, HardDrive, Cpu, Plus, Trash2, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../ui/card";
import { Button } from "../../../../ui/button";
import { Input } from "../../../../ui/input";
import { Label } from "../../../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../ui/select";
import { Separator } from "../../../../ui/separator";
import { Badge } from "../../../../ui/badge";
import { cn } from "../../../../../lib/utils";

interface DeviceSpec {
  ram?: string;
  graphics?: string;
  processor?: string;
  storage?: string;
}

interface Device {
  id?: number;
  device_type: string;
  name: string;
  serial_number: string;
  specifications: DeviceSpec;
}

interface ModernEditPageProps {
  devices: Device[];
  onSave: (devices: Device[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const deviceTypes = [
  { value: "laptop", label: "Laptop", icon: Laptop },
  { value: "desktop", label: "Desktop", icon: Monitor },
  { value: "mobile", label: "Mobile", icon: Smartphone },
  { value: "tablet", label: "Tablet", icon: Tablet },
  { value: "other", label: "Other", icon: HardDrive },
];

const getDeviceIcon = (type: string) => {
  const device = deviceTypes.find(d => d.value === type);
  const Icon = device?.icon || HardDrive;
  return <Icon className="h-5 w-5" />;
};

const ModernEditPage: React.FC<ModernEditPageProps> = ({
  devices: initialDevices,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [hasChanges, setHasChanges] = useState(false);

  const handleDeviceChange = (index: number, field: string, value: string) => {
    const updatedDevices = [...devices];
    if (field.startsWith("specifications.")) {
      const specField = field.replace("specifications.", "");
      updatedDevices[index].specifications = {
        ...updatedDevices[index].specifications,
        [specField]: value,
      };
    } else {
      updatedDevices[index] = {
        ...updatedDevices[index],
        [field]: value,
      };
    }
    setDevices(updatedDevices);
    setHasChanges(true);
  };

  const addDevice = () => {
    const newDevice: Device = {
      device_type: "",
      name: "",
      serial_number: "",
      specifications: {
        ram: "",
        graphics: "",
        processor: "",
        storage: "",
      },
    };
    setDevices([...devices, newDevice]);
    setHasChanges(true);
  };

  const removeDevice = (index: number) => {
    const updatedDevices = devices.filter((_, i) => i !== index);
    setDevices(updatedDevices);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(devices);
    setHasChanges(false);
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to cancel?");
      if (!confirmed) return;
    }
    onCancel();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Allocated Devices</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your company-allocated devices and equipment
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || !hasChanges}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Devices List */}
          {devices.map((device, index) => (
            <Card key={index} className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200">
                      {device.device_type ? getDeviceIcon(device.device_type) : <HardDrive className="h-5 w-5 text-gray-400" />}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {device.name || "New Device"}
                      </CardTitle>
                      {device.serial_number && (
                        <CardDescription className="text-sm">
                          Serial: {device.serial_number}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDevice(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Device Type */}
                  <div className="space-y-2">
                    <Label htmlFor={`device-type-${index}`}>Device Type</Label>
                    <Select
                      value={device.device_type}
                      onValueChange={(value) => handleDeviceChange(index, "device_type", value)}
                    >
                      <SelectTrigger id={`device-type-${index}`}>
                        <SelectValue placeholder="Select device type" />
                      </SelectTrigger>
                      <SelectContent>
                        {deviceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center space-x-2">
                              <type.icon className="h-4 w-4" />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Model/Name */}
                  <div className="space-y-2">
                    <Label htmlFor={`model-${index}`}>Model/Name</Label>
                    <Input
                      id={`model-${index}`}
                      type="text"
                      value={device.name}
                      onChange={(e) => handleDeviceChange(index, "name", e.target.value)}
                      placeholder="e.g., MacBook Pro 16-inch"
                    />
                  </div>

                  {/* Serial Number */}
                  <div className="space-y-2">
                    <Label htmlFor={`serial-${index}`}>Serial Number</Label>
                    <Input
                      id={`serial-${index}`}
                      type="text"
                      value={device.serial_number}
                      onChange={(e) => handleDeviceChange(index, "serial_number", e.target.value)}
                      placeholder="e.g., C02XX1234567"
                    />
                  </div>

                  {/* RAM/Memory */}
                  <div className="space-y-2">
                    <Label htmlFor={`ram-${index}`}>
                      <HardDrive className="inline h-4 w-4 mr-1" />
                      Memory (RAM)
                    </Label>
                    <Input
                      id={`ram-${index}`}
                      type="text"
                      value={device.specifications.ram || ""}
                      onChange={(e) => handleDeviceChange(index, "specifications.ram", e.target.value)}
                      placeholder="e.g., 16GB DDR4"
                    />
                  </div>

                  {/* Processor */}
                  <div className="space-y-2">
                    <Label htmlFor={`processor-${index}`}>
                      <Cpu className="inline h-4 w-4 mr-1" />
                      Processor
                    </Label>
                    <Input
                      id={`processor-${index}`}
                      type="text"
                      value={device.specifications.processor || ""}
                      onChange={(e) => handleDeviceChange(index, "specifications.processor", e.target.value)}
                      placeholder="e.g., Intel Core i7-10750H"
                    />
                  </div>

                  {/* Graphics */}
                  <div className="space-y-2">
                    <Label htmlFor={`graphics-${index}`}>Graphics Card</Label>
                    <Input
                      id={`graphics-${index}`}
                      type="text"
                      value={device.specifications.graphics || ""}
                      onChange={(e) => handleDeviceChange(index, "specifications.graphics", e.target.value)}
                      placeholder="e.g., NVIDIA GeForce RTX 3060"
                    />
                  </div>

                  {/* Storage */}
                  <div className="space-y-2">
                    <Label htmlFor={`storage-${index}`}>Storage</Label>
                    <Input
                      id={`storage-${index}`}
                      type="text"
                      value={device.specifications.storage || ""}
                      onChange={(e) => handleDeviceChange(index, "specifications.storage", e.target.value)}
                      placeholder="e.g., 512GB SSD"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add Device Button */}
          <Card className="border-dashed border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={addDevice}>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                    <Plus className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-900">Add Another Device</h3>
                <p className="text-sm text-gray-500 mt-1">Click to add a new device to your inventory</p>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {devices.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">Device Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Total Devices</p>
                    <p className="text-2xl font-bold text-gray-900">{devices.length}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {deviceTypes.map((type) => {
                      const count = devices.filter(d => d.device_type === type.value).length;
                      if (count === 0) return null;
                      return (
                        <Badge key={type.value} variant="secondary" className="py-1 px-3">
                          <type.icon className="h-3 w-3 mr-1" />
                          {count} {type.label}{count > 1 ? 's' : ''}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernEditPage;