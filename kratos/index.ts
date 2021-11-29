import express from 'express';
import { runScript, getScriptLog } from './middlewares/runScript';
import { getCurrentTasks, getTask } from './middlewares/task';
import { responseWithPayload, handleError } from '../src/middlewares/generic';

const bodyParser = require('body-parser');
const app = express();
const port = 5003;

const initFaye = async () => {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.post('/ssh-script/run', runScript, responseWithPayload, handleError);
    app.get('/ssh-script/list', getCurrentTasks, responseWithPayload, handleError);
    app.get('/ssh-script/get/:taskId', getTask, responseWithPayload, handleError);
    app.get('/ssh-script/log/:taskId', getScriptLog);

    app.delete('/kratos/crash', () => {
        process.exit();
    });
    
    app.listen(port, () => {
        console.log(`Kratos Server listening at http://localhost:${port}`);
    });
}

initFaye();
