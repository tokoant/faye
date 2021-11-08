import express from 'express';
import { runShellScript, checkShellScriptAvailability, streamLog } from './src/middlewares/shellScript';
import { prepareTask, getAllRunningTask, getTaskById, deleteTaskById } from './src/middlewares/task';
import { responseWithPayload, handleError } from './src/middlewares/generic';
import fayeState from './src/state';

const bodyParser = require('body-parser');
const app = express();
const port = 3000;

const initFaye = async () => {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(await fayeState.initialize());

  app.post('/script/run/:taskId', 
    checkShellScriptAvailability,
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

  app.delete('/script/kill/:taskId', (_req, res)=>{

    res.json({ok: 'kill ok'});
  });

  app.listen(port, () => {
    console.log(`Faye listening at http://localhost:${port}`);
  });
}

initFaye();
