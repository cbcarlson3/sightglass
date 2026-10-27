// Sample scan, shaped like what the Worker will return in step 3. Used until real scans work.
// The serial is the example from Rheem bulletin 1207, not a real unit. Error codes and parts are
// placeholders on purpose, so nobody mistakes them for real advice.

export const SAMPLE_SCAN = {
  equipment: 'tank_water_heater',
  plate: {
    brand: { value: 'Rheem', status: 'read' },
    model: { value: 'XG50T06EC36U1', status: 'read' },
    serial: { value: '0912D01234', status: 'read' },
    fuel: { value: 'Natural gas', status: 'read' },
    btuInput: { value: '36,000 BTU/hr', status: 'read' },
    gallons: { value: '50 gal', status: 'read' },
    voltage: { value: null, status: 'unreadable' },
    recovery: { value: '40 gal/hr at 90°F rise', status: 'read' },
  },
  errorCodes: [
    { code: 'Sample code 1', meaning: 'Real codes for this model show here.', fix: 'Real fixes come from the AI in step 4.' },
    { code: 'Sample code 2', meaning: 'Second sample entry.', fix: 'Always check the manual before replacing parts.' },
  ],
  parts: [
    { name: 'Sample part (gas control)', partNumber: 'SAMPLE-0001' },
    { name: 'Sample part (anode rod)', partNumber: 'SAMPLE-0002' },
  ],
};
