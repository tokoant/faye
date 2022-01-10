import { response } from 'express';
import { _contextifyRunSideEffect } from '../index';
import { KratosTaskEffect } from './../types';
import mongoose from 'mongoose';

const EFFECT_RETURNED_VALUE = { result: true }; 
const dummyOrdinaryFunction = () => EFFECT_RETURNED_VALUE;
const dummyAsyncFunction:KratosTaskEffect = async () => EFFECT_RETURNED_VALUE;
const serializeableParams = { featureId: '1234567890' };
const nonSerializeableParams = { response };

const taskId = new mongoose.Types.ObjectId();

describe('Run Side Effect', ()=>{
  it('should throw error on effect is not an async function', async ()=>{
    try {
      const _runSideEffect = _contextifyRunSideEffect(taskId);
      // @ts-ignore
      await _runSideEffect(dummyOrdinaryFunction, serializeableParams);
    } catch (error) {
      expect(error).toStrictEqual(new Error('params effect should be an async function'));
    }
  });
  it('should throw error on non serializeable object passed to it\'s params', async ()=>{
    try {
      const _runSideEffect = _contextifyRunSideEffect(taskId);
      await _runSideEffect(dummyAsyncFunction, nonSerializeableParams);
    } catch (error) {
      expect(error).toStrictEqual(new Error('can only passed serializable params to run kratos side effect'));
    }
  });
  it('should return value from effect', async ()=>{
      const _runSideEffect = _contextifyRunSideEffect(taskId);
      const effectResult = await _runSideEffect(dummyAsyncFunction, serializeableParams);
      expect(effectResult).toStrictEqual(EFFECT_RETURNED_VALUE);
  });
});
