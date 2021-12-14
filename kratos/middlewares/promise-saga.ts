//* @ts-nocheck

import { Request, Response } from 'express';
import { KratosActionCreatorParams } from '../sagas/types';


import stores from '../stores';
import mongoose from 'mongoose';
import sshLogStreams from '../local/sshLogStreams';

// Needed Features:
// - in synchronize with permanent redux [DONE]
// - serializable tasks [DONE]
// - can stream the output log [DONE]
// - can be recovered after crash [DONE]

export const runDeploySaga = (_req:Request, res:Response) => {

  const deployId = new mongoose.Types.ObjectId();

  stores.dispatch<KratosActionCreatorParams>({ 
    type: 'KratosAction', 
    payload: 'PromiseActionCreator',
    actions: [
      // { name: 'checkCloudRunManifest', params: { gitHash: 123 } },
      { name: 'getCloudRunConfigWithLog'},
      // { name: 'updateExpiresDate', params: { featureNum: 1234 } },
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

  const logStream = sshLogStreams[currentDeployId];
  if (!logStream) {
    res.write(`no readable stream for id: ${currentDeployId}`);
    res.end();
  }else{
    logStream.on('readable', () => {
        const data = logStream.read();
        if (data) res.write(`${data.toString('utf8')}\n`);
    });
    logStream.on('error', ()=>{
      delete sshLogStreams[currentDeployId];
      res.end();
    });
    logStream.on('end', () => {
      delete sshLogStreams[currentDeployId];
      res.end();
    });
  } 
};
