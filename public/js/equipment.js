// Equipment types, stored as data. HVAC types (furnace, AC, heat pump) get added here later
// with category 'hvac'; serial rules can then limit a format to them with `equipment: [...]`.

export const EQUIPMENT_TYPES = [
  { id: 'tank_water_heater', label: 'Tank water heater', category: 'water_heating' },
  { id: 'tankless_water_heater', label: 'Tankless water heater', category: 'water_heating' },
  { id: 'combi', label: 'Combi boiler', category: 'water_heating' },
  { id: 'boiler', label: 'Boiler', category: 'water_heating' },
];
