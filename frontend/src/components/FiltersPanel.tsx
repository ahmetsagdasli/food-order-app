import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Slider from "@mui/material/Slider";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";

export type Filters = {
  search: string;
  categories: string[];
  price: [number, number];
  isAvailable?: boolean;
};

export default function FiltersPanel({
  allCategories,
  priceMinMax,
  value,
  onChange,
  onApply,
  onReset,
  disabled,
  title = "Filters",
}: {
  allCategories: string[];
  priceMinMax: { min: number; max: number };
  value: Filters;
  onChange: (next: Filters) => void;
  onApply?: () => void;
  onReset?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  const [local, setLocal] = useState<Filters>(value);

  useEffect(() => setLocal(value), [value]);

  const catSet = useMemo(() => new Set(local.categories), [local.categories]);

  const toggleCat = (c: string) => {
    const next = new Set(local.categories);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    setLocal({ ...local, categories: Array.from(next) });
  };

  const priceMarks = useMemo(() => {
    const { min, max } = priceMinMax;
    return [
      { value: min, label: `${min}` },
      { value: max, label: `${max}` },
    ];
  }, [priceMinMax]);

  const apply = () => {
    onChange(local);
    onApply?.();
  };
  const reset = () => {
    const def: Filters = {
      search: "",
      categories: [],
      price: [priceMinMax.min, priceMinMax.max],
      isAvailable: undefined,
    };
    setLocal(def);
    onChange(def);
    onReset?.();
  };

  return (
    <Box sx={{ p: 2, display: "grid", gap: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>

      <TextField
        label="Search"
        size="small"
        value={local.search}
        onChange={(e) => setLocal({ ...local, search: e.target.value })}
      />

      <Divider />

      <Typography variant="subtitle2" sx={{ mt: 1 }}>Categories</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {allCategories.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No categories</Typography>
        ) : (
          allCategories.map((c) => (
            <Chip
              key={c}
              label={c}
              variant={catSet.has(c) ? "filled" : "outlined"}
              color={catSet.has(c) ? "primary" : "default"}
              onClick={() => toggleCat(c)}
              size="small"
            />
          ))
        )}
      </Box>

      <Divider />

      <Typography variant="subtitle2">Price</Typography>
      <Slider
        value={local.price}
        min={priceMinMax.min}
        max={priceMinMax.max}
        onChange={(_, v) => setLocal({ ...local, price: v as [number, number] })}
        valueLabelDisplay="auto"
        disabled={priceMinMax.min === priceMinMax.max}
      />

      <Divider />

      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              checked={!!local.isAvailable}
              indeterminate={local.isAvailable === undefined}
              onChange={(e) =>
                setLocal({ ...local, isAvailable: e.target.indeterminate ? undefined : e.target.checked })
              }
              indeterminateIcon={undefined}
            />
          }
          label="Only available"
        />
      </FormGroup>

      <Box sx={{ display: "flex", gap: 1, pt: 1 }}>
        <Button onClick={reset} disabled={disabled}>Reset</Button>
        <Button variant="contained" onClick={apply} disabled={disabled}>Apply</Button>
      </Box>
    </Box>
  );
}
