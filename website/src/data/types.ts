import type { PartialDate } from '../lib/dates';

export type Person = {
  id: string;
  slug: string;
  name: string;
  knownAs: string;
  birth: PartialDate | null;
  death: PartialDate | null;
  /** Two-letter code for the NPH countries, otherwise as written. */
  country: string;
  home: string;
  story: string;
  portraitId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Album = {
  id: string;
  personId: string;
  title: string;
  description: string;
  order: number;
  createdAt: string;
};

export type Photo = {
  id: string;
  personId: string;
  albumId: string | null;
  imageId: string;
  caption: string;
  contributedBy: string;
  order: number;
  createdAt: string;
};

export type Tribute = {
  id: string;
  personId: string;
  author: string;
  relation: string;
  message: string;
  imageId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Candle = {
  id: string;
  personId: string;
  name: string;
  message: string;
  createdAt: string;
};

export type StoredImage = {
  id: string;
  full: Blob;
  thumb: Blob;
  width: number;
  height: number;
  createdAt: string;
};

export type PersonDetails = Pick<Person, 'name' | 'knownAs' | 'birth' | 'death' | 'country' | 'home' | 'story'>;
