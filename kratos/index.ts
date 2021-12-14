import express from 'express';
import { runDeploySaga, getRunDeploySagaLog } from './middlewares/promise-saga';
import { getStoreState } from './middlewares/general';

const bodyParser = require('body-parser');
const app = express();
const port = 5003;

const initFaye = async () => {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.post('/run-deploy', runDeploySaga);
    app.get('/run-deploy/log/:deployId', getRunDeploySagaLog);

    app.get('/get-store-state', getStoreState);
    app.delete('/kratos/crash', () => {
        process.exit();
    });
    
    app.listen(port, () => {
        console.log(`Kratos Server listening at http://localhost:${port}`);
    });
}

initFaye();
