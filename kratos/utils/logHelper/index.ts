import { EventEmitter } from 'events';
import mongoose from 'mongoose';
import { Stream } from 'stream';
// import streamResponse from '../../stores/states/streamResponseNew';

interface KratosLogHelperParams {
  taskId: mongoose.Types.ObjectId;
  eventEmitter?: EventEmitter;
  eventSource?: EventSource;
  stream?: Stream;
}
export const kratosLogHelper = (_params: KratosLogHelperParams) => {

  // const { taskId, eventEmitter, eventSource, stream } = params;
  
  // const logStream = new Stream();

  // streamResponse[taskId.toString()] = logStream;

  // if (eventEmitter){
  //   eventEmitter.on('data', (event)=>{
      
  //   });
  //   eventEmitter.on('end', ()=>{
  //     logStream.end();
  //   });
  // }

  // if (eventSource){
    // eventSource.addEventListener('shell-log', (event)=>{
    //     if (streamResponse[taskId.toString()]) {
    //         streamResponse[taskId.toString()].write('event:kratos-shell-log\n');
    //         streamResponse[taskId.toString()].write(`data:${event.data}\n\n`);
    //     }
    // });
    // eventSource.addEventListener('shell-exec-end', ()=>{
    //     if (streamResponse[taskId.toString()]){
    //         streamResponse[taskId.toString()].end();
    //     }
    // });
  // }

  // SSEhandler.addEventListener('shell-exec-end', ()=>{
  //     if (streamResponse[taskId.toString()]){
  //         streamResponse[taskId.toString()].end();
  //     }
  // });
}