import { response } from 'express';
import { _runSideEffect } from '../index';

const EFFECT_RETURNED_VALUE = { result: true }; 
const dummyOrdinaryFunction = () => EFFECT_RETURNED_VALUE;
const dummyAsyncFunction = async () => EFFECT_RETURNED_VALUE;
const serializeableParams = { featureId: '1234567890' };
const nonSerializeableParams = { response };

describe('Run Side Effect', ()=>{
  it('should throw error on effect is not an async function', async ()=>{
    try {
      // @ts-ignore
      await _runSideEffect(dummyOrdinaryFunction, nonSerializeableParams);
    } catch (error) {
      expect(error).toStrictEqual(new Error('params effect should be an async function'));
    }
  });
  it('should throw error on non serializeable object passed to it\'s params', async ()=>{
    try {
      await _runSideEffect(dummyAsyncFunction, nonSerializeableParams);
    } catch (error) {
      expect(error).toStrictEqual(new Error('can only passed serializable params to run kratos side effect'));
    }
  });
  it('should return value from effect', async ()=>{
      const effectResult = await _runSideEffect(dummyAsyncFunction, serializeableParams);
      expect(effectResult).toStrictEqual(EFFECT_RETURNED_VALUE);
  });
});
