import React, { useEffect, useState } from "react";
import { taxConfigurationsApi } from "apis/api";
import { Button } from "../../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";
import { Toastr } from "StyledComponents";

type CalculationMethod = "percentage" | "flat";

type TaxConfiguration = {
  id: string;
  name: string;
  calculationMethod: CalculationMethod;
  value: number;
};

const emptyForm = {
  name: "",
  calculationMethod: "percentage" as CalculationMethod,
  value: 0,
};

const TaxConfigurationSettings = () => {
  const [taxConfigurations, setTaxConfigurations] = useState<
    TaxConfiguration[]
  >([]);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadTaxConfigurations = async () => {
    setIsLoading(true);

    try {
      const response = await taxConfigurationsApi.get();
      setTaxConfigurations(
        (
          response.data.taxConfigurations ||
          response.data.tax_configurations ||
          []
        ).map(taxConfiguration => ({
          id: String(taxConfiguration.id),
          name: taxConfiguration.name,
          calculationMethod:
            taxConfiguration.calculationMethod ||
            taxConfiguration.calculation_method,
          value: Number(taxConfiguration.value || 0),
        }))
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTaxConfigurations();
  }, []);

  const saveTaxConfiguration = async event => {
    event.preventDefault();
    setIsSaving(true);

    try {
      await taxConfigurationsApi.create({
        name: form.name,
        calculation_method: form.calculationMethod,
        value: form.value,
      });
      setForm(emptyForm);
      await loadTaxConfigurations();
    } catch {
      Toastr.error("Unable to save tax configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTaxConfiguration = async (id: string) => {
    await taxConfigurationsApi.destroy(id);
    await loadTaxConfigurations();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Tax Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            className="grid grid-cols-1 items-end gap-4 md:grid-cols-[1fr_180px_160px_auto]"
            onSubmit={saveTaxConfiguration}
          >
            <div>
              <Label htmlFor="tax-name">Name</Label>
              <Input
                id="tax-name"
                required
                value={form.name}
                onChange={event =>
                  setForm(current => ({ ...current, name: event.target.value }))
                }
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={form.calculationMethod}
                onValueChange={(value: CalculationMethod) =>
                  setForm(current => ({
                    ...current,
                    calculationMethod: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="flat">Flat amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tax-value">
                {form.calculationMethod === "percentage" ? "Percent" : "Amount"}
              </Label>
              <Input
                id="tax-value"
                min={0}
                required
                step="0.01"
                type="number"
                value={form.value}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    value: Number(event.target.value || 0),
                  }))
                }
              />
            </div>
            <Button disabled={isSaving} type="submit">
              Save
            </Button>
          </form>

          <div className="divide-y rounded-md border border-border">
            {isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : taxConfigurations.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No tax configurations yet.
              </div>
            ) : (
              taxConfigurations.map(taxConfiguration => (
                <div
                  key={taxConfiguration.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {taxConfiguration.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {taxConfiguration.calculationMethod === "percentage"
                        ? `${taxConfiguration.value}%`
                        : `Flat ${taxConfiguration.value}`}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => deleteTaxConfiguration(taxConfiguration.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxConfigurationSettings;
