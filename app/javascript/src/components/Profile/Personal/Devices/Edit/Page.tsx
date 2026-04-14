import React, { useState } from "react";
import {
  Laptop,
  DeviceMobile as Smartphone,
  HardDrives as HardDrive,
  Cpu,
  Plus,
  Trash as Trash2,
  FloppyDisk as Save,
  X,
} from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../../../ui/card";
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
import { Badge } from "../../../../ui/badge";
import { i18n } from "../../../../../i18n";

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

interface DeviceEditPageProps {
  devices: Device[];
  onSave: (devices: Device[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const deviceTypes = [
  { value: "laptop", label: "Laptop", icon: Laptop },
  { value: "mobile", label: "Mobile", icon: Smartphone },
];

const getDeviceIcon = (type: string) => {
  const device = deviceTypes.find(d => d.value === type);
  const Icon = device?.icon || HardDrive;

  return <Icon className="h-5 w-5" />;
};

const DeviceEditPage: React.FC<DeviceEditPageProps> = ({
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
      const confirmed = window.confirm(i18n.t("devices.unsavedChangesPrompt"));
      if (!confirmed) return;
    }
    onCancel();
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-end items-center space-x-3">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            {i18n.t("cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-2" />
            {i18n.t("preferencesSettings.saveChanges")}
          </Button>
        </div>
        <div className="space-y-6">
          {/* Devices List */}
          {devices.map((device, index) => (
            <Card key={index} className="border-border shadow-sm">
              <CardHeader className="bg-muted/40 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card border border-border">
                      {device.device_type ? (
                        getDeviceIcon(device.device_type)
                      ) : (
                        <HardDrive className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {device.name || i18n.t("devices.newDevice")}
                      </CardTitle>
                      {device.serial_number && (
                        <CardDescription className="text-sm">
                          {i18n.t("devices.serial")} {device.serial_number}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDevice(index)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Device Type */}
                  <div className="space-y-2">
                    <Label htmlFor={`device-type-${index}`}>
                      {i18n.t("devices.deviceType")}
                    </Label>
                    <Select
                      value={device.device_type}
                      onValueChange={value =>
                        handleDeviceChange(index, "device_type", value)
                      }
                    >
                      <SelectTrigger id={`device-type-${index}`}>
                        <SelectValue
                          placeholder={i18n.t("devices.selectDeviceType")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {deviceTypes.map(type => (
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
                    <Label htmlFor={`model-${index}`}>
                      {i18n.t("devices.modelName")}
                    </Label>
                    <Input
                      id={`model-${index}`}
                      type="text"
                      value={device.name}
                      onChange={e =>
                        handleDeviceChange(index, "name", e.target.value)
                      }
                      placeholder={i18n.t("devices.modelNamePlaceholder")}
                    />
                  </div>

                  {/* Serial Number */}
                  <div className="space-y-2">
                    <Label htmlFor={`serial-${index}`}>
                      {i18n.t("devices.serialNumber")}
                    </Label>
                    <Input
                      id={`serial-${index}`}
                      type="text"
                      value={device.serial_number}
                      onChange={e =>
                        handleDeviceChange(
                          index,
                          "serial_number",
                          e.target.value
                        )
                      }
                      placeholder={i18n.t("devices.serialNumberPlaceholder")}
                    />
                  </div>

                  {/* RAM/Memory */}
                  <div className="space-y-2">
                    <Label htmlFor={`ram-${index}`}>
                      <HardDrive className="inline h-4 w-4 mr-1" />
                      {i18n.t("devices.memory")}
                    </Label>
                    <Input
                      id={`ram-${index}`}
                      type="text"
                      value={device.specifications.ram || ""}
                      onChange={e =>
                        handleDeviceChange(
                          index,
                          "specifications.ram",
                          e.target.value
                        )
                      }
                      placeholder={i18n.t("devices.memoryPlaceholder")}
                    />
                  </div>

                  {/* Processor */}
                  <div className="space-y-2">
                    <Label htmlFor={`processor-${index}`}>
                      <Cpu className="inline h-4 w-4 mr-1" />
                      {i18n.t("devices.processor")}
                    </Label>
                    <Input
                      id={`processor-${index}`}
                      type="text"
                      value={device.specifications.processor || ""}
                      onChange={e =>
                        handleDeviceChange(
                          index,
                          "specifications.processor",
                          e.target.value
                        )
                      }
                      placeholder={i18n.t("devices.processorPlaceholder")}
                    />
                  </div>

                  {/* Graphics */}
                  <div className="space-y-2">
                    <Label htmlFor={`graphics-${index}`}>
                      {i18n.t("devices.graphicsCard")}
                    </Label>
                    <Input
                      id={`graphics-${index}`}
                      type="text"
                      value={device.specifications.graphics || ""}
                      onChange={e =>
                        handleDeviceChange(
                          index,
                          "specifications.graphics",
                          e.target.value
                        )
                      }
                      placeholder={i18n.t("devices.graphicsPlaceholder")}
                    />
                  </div>

                  {/* Storage */}
                  <div className="space-y-2">
                    <Label htmlFor={`storage-${index}`}>
                      {i18n.t("devices.storage")}
                    </Label>
                    <Input
                      id={`storage-${index}`}
                      type="text"
                      value={device.specifications.storage || ""}
                      onChange={e =>
                        handleDeviceChange(
                          index,
                          "specifications.storage",
                          e.target.value
                        )
                      }
                      placeholder={i18n.t("devices.storagePlaceholder")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add Device Button */}
          <Card
            className="border-dashed border-2 border-border bg-muted/40 hover:bg-muted transition-colors cursor-pointer"
            onClick={addDevice}
          >
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-accent">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-foreground">
                  {i18n.t("devices.addAnotherDevice")}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {i18n.t("devices.addAnotherDeviceDescription")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {devices.length > 0 && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">
                  {i18n.t("devices.deviceSummary")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {i18n.t("devices.totalDevices")}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {devices.length}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {deviceTypes.map(type => {
                      const count = devices.filter(
                        d => d.device_type === type.value
                      ).length;
                      if (count === 0) return null;

                      return (
                        <Badge
                          key={type.value}
                          variant="secondary"
                          className="py-1 px-3"
                        >
                          <type.icon className="h-3 w-3 mr-1" />
                          {count} {type.label}
                          {count > 1 ? "s" : ""}
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

export default DeviceEditPage;
