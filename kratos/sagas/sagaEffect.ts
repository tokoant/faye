import { KratosSagaEffect } from './types';

type CreateKratosSagaEffectParams = { 
  effect: KratosSagaEffect, 
  partOf?: string,
  useSsh?: boolean
};
export const createKratosSagaEffect = ({ effect, partOf= 'unknownSaga', useSsh = false }: CreateKratosSagaEffectParams) => {
  return {
    effect,
    partOf,
    useSsh,
  }
}
