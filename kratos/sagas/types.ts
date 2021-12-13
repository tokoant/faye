import mongoose from 'mongoose';

export interface KratosSagaEffectReturn {
  id: mongoose.Types.ObjectId;
  params?: Record<string, any>;
  result: Record<string, any> | string;
}

export interface KratosSagaEffectParams {
  parentId?: mongoose.Types.ObjectId;
  id: mongoose.Types.ObjectId;
  params?: Record<string, any>;
  prevTask: KratosSagaEffectReturn;
}

export type KratosSagaEffect = (params: KratosSagaEffectParams) => Promise<KratosSagaEffectReturn>;

export interface KratosSagaAction {
  name: string;
  params?: Record<string, any>;
}

export interface KratosSagaMeta {
  parentId: mongoose.Types.ObjectId;
}

export interface KratosActionCreatorParams {
  type: 'KratosAction',
  payload: any,
  actions: {
    name: string,
    params?: Record<string, any>
  }[],
  meta: Record<string, any>,
}

export interface KratosRecoveryAction {
  name: string;
  id: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
}
