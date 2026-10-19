/*
 * The NPH homes to choose from when adding someone. A home is saved as written here
 * ("Casa San Salvador, Miacatlán"); anything else can still be written in by hand.
 *
 * Sources (October 2026): NPH USA "Our Homes" pages and country fact sheets (nphusa.org),
 * NPH International country pages (nph.org), the NPH Haiti special-needs story about
 * Kay Christine, and NPH's history pages. Homes that closed long ago and whose names
 * could not be confirmed are left out; use "Another home" for them.
 */

export type NphHome = { country: string; value: string };

export const NPH_HOMES: NphHome[] = [
  // Mexico: the main home since 1970; technical high school students in Cuernavaca; university students in Monterrey
  { country: 'MX', value: 'Casa San Salvador, Miacatlán' },
  { country: 'MX', value: 'Casa Buen Señor, Cuernavaca' },
  { country: 'MX', value: 'Casa San Luis, Monterrey' },
  // Honduras: the main home since 1985; children with severe disabilities; older adults on the Rancho
  { country: 'HN', value: 'Rancho Santa Fe' },
  { country: 'HN', value: 'Casa de los Ángeles, Tegucigalpa' },
  { country: 'HN', value: 'Casa Eva, Rancho Santa Fe' },
  // Haiti: the main home since 1987; the special-needs home; the home and school in Tabarre
  { country: 'HT', value: 'St. Hélène, Kenscoff' },
  { country: 'HT', value: 'Kay Christine' },
  { country: 'HT', value: 'Father Wasson Angels of Light, Tabarre' },
  // Nicaragua: the home since 2011; before that the family lived on Ometepe Island (from 1994)
  { country: 'NI', value: 'Casa Padre Wasson, Jinotepe' },
  { country: 'NI', value: 'Isla de Ometepe' },
  // Guatemala: since 2003
  { country: 'GT', value: 'Casa San Andrés, Parramos' },
  // El Salvador: since 1999
  { country: 'SV', value: 'Casa Sagrada Familia, Texistepeque' },
  // Dominican Republic: since 2003
  { country: 'DO', value: 'Casa Santa Ana, San Pedro de Macorís' },
  // Bolivia: the home since 2008; houses for young adults in Portachuelo
  { country: 'BO', value: 'Casa Padre Wasson, San Ignacio de Sara' },
  { country: 'BO', value: 'Portachuelo' },
  // Peru: since 2004, at its own site since 2011
  { country: 'PE', value: 'Casa Santa Rosa, Cañete' },
];

export function findHome(value: string): NphHome | undefined {
  return NPH_HOMES.find((h) => h.value === value);
}
