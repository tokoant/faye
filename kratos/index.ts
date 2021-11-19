


import express from 'express';
import { runSlowScript } from './runSlowScript';
import { responseWithPayload, handleError } from '../src/middlewares/generic';

const bodyParser = require('body-parser');
const app = express();
const port = 5003;

const initFaye = async () => {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.get('/ssh-script/run', runSlowScript, responseWithPayload, handleError);

    app.listen(port, () => {
        console.log(`Kratos listening at http://localhost:${port}`);
    });
}

initFaye();
