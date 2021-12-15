import express from 'express';
import dotenv from 'dotenv';
import { runShellScript, streamLog } from './src/middlewares/shellScript';
import { prepareTask, getAllRunningTask, getTaskById, deleteTaskById, killTaskById } from './src/middlewares/task';
import { responseWithPayload, handleError } from './src/middlewares/generic';

dotenv.config();

const bodyParser = require('body-parser');
const app = express();
const port = 6788;

const initFaye = async () => {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.post('/script/run/:taskId', 
    // checkShellScriptAvailability,
    prepareTask,
    runShellScript,
    responseWithPayload,
    handleError
  );

  app.get('/script/list',
    getAllRunningTask,
    responseWithPayload,
    handleError
  );

  app.get('/script/get/:taskId',
    getTaskById,
    responseWithPayload,
    handleError
  );

  app.delete('/script/delete/:taskId',
    deleteTaskById,
    responseWithPayload,
    handleError
  );

  app.get('/script/log/:taskId',
    streamLog,
  );
  
  app.delete('/script/kill/:taskId',
    killTaskById,
    responseWithPayload,
    handleError
  );

  app.listen(port, () => {
    console.log(`Faye listening at http://localhost:${port}`);
  });
}

initFaye();
