//* @ts-nocheck

import { Request, Response } from 'express';
// import { SagaPromiseState } from '../stores/reducers/saga-promise';
import { KratosActionCreatorParams } from '../sagas/types';


import stores from '../stores';
import mongoose from 'mongoose';
// import streamResponse from '../stores/states/streamResponse';
import sshLogStreams from '../local/sshLogStreams';

// Needed Features:
// - in synchronize with permanent redux [DONE]
// - serializable tasks [DONE]
// - can stream the output log [DONE]
// - can be recovered after crash 

export const runDeploySaga = (_req:Request, res:Response) => {

  const deployId = new mongoose.Types.ObjectId();

  stores.dispatch<KratosActionCreatorParams>({ 
    type: 'KratosAction', 
    payload: 'PromiseActionCreator',
    actions: [
      { name: 'checkCloudRunManifest', params: { gitHash: 123 } },
      { name: 'getCloudRunConfigWithLog'},
      { name: 'updateExpiresDate', params: { featureNum: 1234 } },
    ],
    meta: {
      parentId: deployId, 
    },
  });

  res.json({ states: 'running deployment saga' });
}

export const getRunDeploySagaLog = (req:Request, res:Response) => {
  const { deployId: currentDeployId } = req.params;
    
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  sshLogStreams[currentDeployId].pipe(res)
};
