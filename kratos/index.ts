import express from 'express';
import { runScript } from './middlewares/runScript';
import { getCurrentRunningTasks } from './middlewares/runningTask';
import { responseWithPayload, handleError } from '../src/middlewares/generic';

const bodyParser = require('body-parser');
const app = express();
const port = 5003;

const initFaye = async () => {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.post('/ssh-script/run', runScript, responseWithPayload, handleError);
    app.get('/ssh-script/running-tasks-state', getCurrentRunningTasks, responseWithPayload, handleError);

    app.listen(port, () => {
        console.log(`Kratos listening at http://localhost:${port}`);
    });
}

initFaye();
