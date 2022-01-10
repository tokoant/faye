import express from 'express';
import { getRunDeploySagaLog } from './middlewares/promise-saga';
import { runDeploy } from './middlewares/deployment';
import { getStoreState, resetStoreState } from './middlewares/general';
import { recoverKratosTaskOnStart } from './utils/kratosTask';

const bodyParser = require('body-parser');
const app = express();
const port = 5003;

// TODOs:
// - mapping runDeploy (DONE)
// - rewrite runDeploy in recoverable-kratos (can be mock, as in async func)
// -- create utils (runKratosTask, _runSideEffect); 
// -- writing tests for runKratosTaskInstruction validations
// -- using the utils for runDeploy rewrite
// - change to tokopedia repository? + tidy up (faye & kratos-recoverable)

const initFaye = async () => {

    recoverKratosTaskOnStart();

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.post('/run-deploy', runDeploy);
    app.get('/run-deploy/log/:deployId', getRunDeploySagaLog);

    app.get('/get-store-state', getStoreState);
    app.put('/reset-store-state', resetStoreState);
    app.delete('/kratos/crash', () => {
        process.exit();
    });
    
    app.listen(port, () => {
        console.log(`Kratos Server listening at http://localhost:${port}`);
    });
}

initFaye();
