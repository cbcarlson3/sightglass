// The fields read off a data plate, in display order. `equipment` limits a field to some
// equipment types (see equipment.js); fields without it apply to all. HVAC fields go here later.

export const PLATE_FIELDS = [
  { id: 'brand', label: 'Brand' },
  { id: 'model', label: 'Model' },
  { id: 'serial', label: 'Serial' },
  { id: 'fuel', label: 'Fuel' },
  { id: 'btuInput', label: 'BTU input' },
  { id: 'gallons', label: 'Tank size', equipment: ['tank_water_heater'] },
  { id: 'voltage', label: 'Voltage' },
  { id: 'recovery', label: 'Recovery', equipment: ['tank_water_heater'] },
];

export function fieldsFor(equipment) {
  return PLATE_FIELDS.filter((field) => !field.equipment || field.equipment.includes(equipment));
}
