import { Response } from 'express';

export interface TaskExpressResponse {
  [key: string]: Response
}

//  task state will be saved in memory
const taskExpressResponse:TaskExpressResponse = {};

export default taskExpressResponse;



