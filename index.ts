import express from 'express';
import { runShellScript } from './src/middlewares/shellScript';
import { prepareTask, getAllRunningTask } from './src/middlewares/task';
import { responseWithPayload, handleError } from './src/middlewares/generic';
import fayeState from './src/state';

const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fayeState.initialize());

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

app.get('/script/get/:taskId', (_req, res)=>{

  res.json({ok: 'get ok'});
});

app.delete('/script/delete/:taskId', (_req, res)=>{

  res.json({ok: 'delete ok'});
});

app.get('/script/log/:taskId', (_req, res)=>{

  res.json({ok: 'log ok'});
});

app.delete('/script/kill/:taskId', (_req, res)=>{

  res.json({ok: 'kill ok'});
});

app.listen(port, () => {
  console.log(`Faye listening at http://localhost:${port}`);
});
