// Serial-number date rules, stored as data. decode.js reads these; it has no brand-specific code.
//
// Every format cites the manufacturer document it came from. To add a brand (or HVAC later),
// add a family here plus test cases in test/serial-cases.js. Nothing else should need to change.
//
// Field specs:
//   { group: n, as: 'number' }                 the regex group is a plain number (month, week, day)
//   { group: n, as: 'yy', century: 2000 }      two-digit year, always in that century
//   { group: n, as: 'yy', pivot: 90 }          two-digit year: >= pivot means 19xx, else 20xx
//   { group: n, as: 'letter', table: {...} }   a letter looked up in a table
// validFrom / validTo ('YYYY-MM') reject dates outside the era the source says the format covers.
// equipment limits a format to the listed equipment types (see equipment.js). When the
// equipment type is not known, those formats are skipped, so the answer is "unknown", not a guess.

// Lochinvar warranty sheet, WARR / MM# 100161789 Rev 18 (printed 06/15), page 2.
// https://assets.lochinvar.com/damroot/Original/10013/WARR%20(100161789)%20Rev%2018.pdf
const LOCHINVAR_TANK_YEARS = {
  K: 1993, L: 1994, M: 1995, N: 1996, P: 1997, S: 1998, T: 1999, W: 2000, X: 2001, Y: 2002,
  Z: 2003, A: 2004, B: 2005, C: 2006, D: 2007, E: 2008, F: 2009, G: 2010, H: 2011, J: 2012,
};

// Month letters A-M skipping I. Used by Lochinvar page 2 and by Rinnai (see below).
const MONTHS_A_TO_M_NO_I = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 9, K: 10, L: 11, M: 12,
};

// Lochinvar sheet page 3: month letters A-L, which do use I. The sheet prints this table twice and
// they disagree on E and F (one says E = May, F = June; the other says F = May, E = June, and its
// example E07H00123456 is "June, 2007"). So E and F are left out on purpose: those serials decode
// to the year only.
const LOCHINVAR_BOILER_MONTHS = {
  A: 1, B: 2, C: 3, D: 4, G: 7, H: 8, I: 9, J: 10, K: 11, L: 12,
};

// Rinnai service manual (RHFE-551FA), page 111, "Serial Number Format". Year letters skip
// I, O, Q, U and V. https://www.manualslib.com/manual/828544/Rinnai-Rhfe-551fa.html?page=111
const RINNAI_YEARS = {
  A: 2009, B: 2010, C: 2011, D: 2012, E: 2013, F: 2014, G: 2015, H: 2016, J: 2017, K: 2018,
  L: 2019, M: 2020, N: 2021, P: 2022, R: 2023, S: 2024, T: 2025, W: 2026, X: 2027, Y: 2028,
  Z: 2029,
};

// Navien month digits. CPSC recall 19-057 confirms 1-9 and X = October. building-center.org
// says Y and Z are November and December, but no Navien source confirms that yet, so they are
// left out on purpose: those serials decode to the year only.
const NAVIEN_MONTHS = {
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, X: 10,
};

export const BRAND_FAMILIES = [
  {
    id: 'rheem',
    name: 'Rheem / Ruud / Richmond',
    aliases: ['rheem', 'ruud', 'richmond', 'rheemmanufacturing', 'rheemmanufacturingcompany'],
    verified: true,
    formats: [
      {
        // Rheem Technical Service Bulletin 1207, "How to Locate and Read Rheem/Ruud/Richmond
        // Serial Numbers", page 1: ten characters, month, year, plant line code, then a
        // consecutive number. Example: 09 12 D 01234 (September 2012).
        // https://cdn.globalimageserver.com/FetchDocument.aspx?ID=67e23d33-c085-48fa-8aa8-eab53d38296b
        // Also https://www.rheem.com/how-to-locate-and-read-your-rheem-water-heating-serial-numbers/
        id: 'rheem-mmyy',
        pattern: '^(\\d{2})(\\d{2})([A-Z])(\\d{5})$',
        month: { group: 1, as: 'number' },
        year: { group: 2, as: 'yy', century: 2000 },
        source: 'Rheem Technical Service Bulletin 1207, page 1',
      },
      {
        // Bulletin 1207, page 2: from April 2, 2012 (Mexicali) and June 2012 (Nuevo Laredo), and
        // other plants as they move over: plant letter, week, year, then five digits. A letter
        // after that means the heater was converted (e.g. to LP).
        // Plants: A Montgomery, W Water Heater Innovations, Q Nuevo Laredo, M Mexicali, C Canada.
        // Examples: M141209135 (week 14, 2012), Q231299996 (week 23, 2012).
        id: 'rheem-pwwyy',
        pattern: '^([AWQMC])(\\d{2})(\\d{2})(\\d{5})([A-Z])?$',
        week: { group: 2, as: 'number' },
        year: { group: 3, as: 'yy', century: 2000 },
        validFrom: '2012-04',
        source: 'Rheem Technical Service Bulletin 1207, page 2',
      },
    ],
  },
  {
    id: 'aosmith',
    name: 'A.O. Smith / State / American / Reliance',
    aliases: [
      'aosmith', 'aosmithcorporation', 'state', 'statewaterheater', 'statewaterheaters',
      'american', 'americanwaterheater', 'americanwaterheaters', 'americanwaterheatercompany',
      'reliance', 'reliancewaterheater', 'reliancewaterheaters',
    ],
    verified: true,
    formats: [
      {
        // A.O. Smith "Service and Warranty Guide for Contracted Service Providers", July 2024,
        // page 9, "How to Read the Serial Number": first two digits are the year, the next two
        // are the week (up to 53 weeks). Example: 1719106145074 (week 19 of 2017). The guide
        // covers all A.O. Smith residential and commercial water heaters and boilers; State,
        // American and Reliance are A.O. Smith brands (page 10).
        // https://university.hotwater.com/wp-content/uploads/sites/2/2025/01/ServiceWarrantyGuide_2024.pdf
        id: 'aosmith-yyww-13',
        pattern: '^(\\d{2})(\\d{2})(\\d{9})$',
        year: { group: 1, as: 'yy', century: 2000 },
        week: { group: 2, as: 'number' },
        source: 'A.O. Smith Service and Warranty Guide (July 2024), page 9',
      },
      {
        // Same year-then-week rule in the eleven-character form with a plant letter, as printed
        // on the Lochinvar sheet below (A.O. Smith owns Lochinvar). Example: 1142N012345.
        id: 'aosmith-yyww-11',
        pattern: '^(\\d{2})(\\d{2})([A-Z])(\\d{6})$',
        year: { group: 1, as: 'yy', century: 2000 },
        week: { group: 2, as: 'number' },
        source: 'A.O. Smith Service and Warranty Guide (July 2024), page 9; layout from Lochinvar warranty sheet Rev 18, page 2',
      },
    ],
  },
  {
    id: 'lochinvar',
    name: 'Lochinvar',
    aliases: ['lochinvar', 'lochinvarcorporation', 'lochinvarllc'],
    verified: true,
    formats: [
      {
        // Lochinvar warranty sheet Rev 18, page 2: tank water heaters and Hi-Powers, 2011 to
        // present. Eleven characters: year, week, plant letter, six production digits.
        // Example: 1142N012345 (42nd week of 2011).
        id: 'lochinvar-tank-yyww',
        pattern: '^(\\d{2})(\\d{2})([A-Z])(\\d{6})$',
        year: { group: 1, as: 'yy', century: 2000 },
        week: { group: 2, as: 'number' },
        validFrom: '2011-01',
        source: 'Lochinvar warranty sheet Rev 18, page 2 (2011 to present)',
      },
      {
        // Same sheet, page 2: tank water heaters and Hi-Powers, 1979 to 2011. Two letters (year,
        // month), then six or seven numbers. Example: KJ-1000130 (September 1993). The sheet's
        // year table only covers 1993 to 2012; older heaters reuse the letters, so a heater from
        // before 1993 would read 20 years too new.
        id: 'lochinvar-tank-letters',
        pattern: '^([A-Z])([A-Z])-?(\\d{6,7})$',
        year: { group: 1, as: 'letter', table: LOCHINVAR_TANK_YEARS },
        month: { group: 2, as: 'letter', table: MONTHS_A_TO_M_NO_I },
        validTo: '2012-12',
        note: 'Lochinvar letter years repeat every 20 years. If the heater looks older, it may be 20 years older.',
        source: 'Lochinvar warranty sheet Rev 18, page 2 (1979 to 2011)',
      },
      {
        // Same sheet, page 3: Knight, Armor, Crest, FTXL, Shield, Copper-Fin, Power-Fin and other
        // boiler and volume water heater lines, "system before May 2015". Month letter, two-digit
        // year, then production codes; 7 or 12 characters. Examples: J930012 (the sheet says
        // September 1993, but its own tables say J = October), A07H00123456 (January 2007).
        id: 'lochinvar-line-myy',
        pattern: '^([A-L])-?(\\d{2})([A-Z0-9]{4}|[A-Z0-9]{9})$',
        month: { group: 1, as: 'letter', table: LOCHINVAR_BOILER_MONTHS },
        year: { group: 2, as: 'yy', pivot: 90 },
        validTo: '2015-05',
        unmappedMonthNote: 'Lochinvar\'s own sheet gives two different months for this letter, so only the year is shown.',
        source: 'Lochinvar warranty sheet Rev 18, page 3 (before May 2015)',
      },
      {
        // Same sheet, page 3, "system after May 2015": 13 characters, the first two are the
        // week and the next two the year. (Its example 1615001213456 says "week 19, 2015"; by
        // the stated rule it is week 16, so we follow the rule.) A.O. Smith uses year-first for
        // its own 13-digit serials, so this format is only used when the equipment is known to
        // be a boiler. validFrom is January, not May: the sheet's own example is from April 2015.
        id: 'lochinvar-line-wwyy',
        pattern: '^(\\d{2})(\\d{2})(\\d{9})$',
        week: { group: 1, as: 'number' },
        year: { group: 2, as: 'yy', century: 2000 },
        validFrom: '2015-01',
        equipment: ['boiler'],
        source: 'Lochinvar warranty sheet Rev 18, page 3 (after May 2015)',
      },
    ],
  },
  {
    id: 'rinnai',
    name: 'Rinnai',
    aliases: ['rinnai', 'rinnaiamerica', 'rinnaiamericacorporation', 'rinnaicorporation'],
    verified: true,
    formats: [
      {
        // Rinnai service manual, page 111: before June 1, 2010 the serial is four numbers, a
        // dash, six numbers. First two digits are the year, next two the month.
        // Example: 03.06-001000 (June 2003).
        id: 'rinnai-yymm',
        pattern: '^(\\d{2})\\.?(\\d{2})-?(\\d{6})$',
        year: { group: 1, as: 'yy', century: 2000 },
        month: { group: 2, as: 'number' },
        validTo: '2010-06',
        source: 'Rinnai service manual (RHFE-551FA), page 111 (before June 2010)',
      },
      {
        // Same page: from June 1, 2010, four letters, a dash, six digits. Letter 1 is the year,
        // letter 2 the month, letters 3-4 are plant and product type.
        // Example: BH.AB-000123 (August 2010).
        id: 'rinnai-letters',
        pattern: '^([A-Z])([A-Z])\\.?([A-Z]{2})-?(\\d{6})$',
        year: { group: 1, as: 'letter', table: RINNAI_YEARS },
        month: { group: 2, as: 'letter', table: MONTHS_A_TO_M_NO_I },
        source: 'Rinnai service manual (RHFE-551FA), page 111 (June 2010 on)',
      },
    ],
  },
  {
    id: 'navien',
    name: 'Navien',
    aliases: ['navien', 'navieninc', 'navienamerica', 'navienamericainc'],
    verified: true,
    formats: [
      {
        // CPSC recall 19-057 (Navien, December 2018): "The first two digits identify the year,
        // the next single digit identifies the month, and the last two digits identify the day.
        // For example, 18709 stands for July 9, 2018 ... X stands for October." The recalled
        // serials are laid out as product code, a letter, then that date: 7410x18709xxxx
        // (NPE-180A), 7410x18X14xxxx. building-center.org/navien-water-heater-age gives the same
        // positions (year in the 6th and 7th characters, month in the 8th, then the day).
        // https://www.cpsc.gov/Recalls/2019/Navien-Recalls-Tankless-Water-Heaters-and-Boilers-Due-to-Risk-of-Carbon-Monoxide-Poisoning
        id: 'navien-yymdd',
        pattern: '^(\\d{4})([A-Z])(\\d{2})([1-9XYZ])(\\d{2})([A-Z0-9]{4,6})$',
        year: { group: 3, as: 'yy', century: 2000 },
        month: { group: 4, as: 'letter', table: NAVIEN_MONTHS },
        day: { group: 5, as: 'number' },
        unmappedMonthNote: 'Navien\'s recall notice only confirms months 1-9 and X (October), so only the year is shown.',
        source: 'CPSC recall 19-057 (Navien, December 2018)',
      },
      {
        // building-center.org/navien-water-heater-age, styles 3 and 4: older serials with dashes,
        // example 9262-20081208-1027, where characters 5-8 are the year. The 8 digits are a full
        // date (year, month, day); a real NCB-240 tag reads 7966-20131017-2070.
        id: 'navien-dashed-yyyymmdd',
        pattern: '^(\\d{4})-?(\\d{4})(\\d{2})(\\d{2})-?(\\d{4})$',
        year: { group: 2, as: 'number' },
        month: { group: 3, as: 'number' },
        day: { group: 4, as: 'number' },
        validFrom: '2006-01',
        source: 'building-center.org Navien age guide (dashed serials), checked against a real NCB-240 tag',
      },
    ],
  },
];
