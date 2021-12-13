import axios from 'axios';
import { EventEmitter } from 'events';
import EventSource from 'eventsource';
import mongoose from 'mongoose';
import sshLogEmitter from '../../local/sshLogEmitter';
import store from '../../stores';

const baseURL = 'http://localhost:6788/script';

const axiosInstance = axios.create({
    baseURL,
    timeout: 1000,
    headers: {},
});

interface RunParamsType {
    sshId: mongoose.Types.ObjectId;
    taskId: mongoose.Types.ObjectId;
    target: string;
    script?: string;
}
export const runShellScript = ({ sshId, taskId, target, script }: RunParamsType) => {

    const sshData = {
        target,
        script,
    };

    store.dispatch({ type: 'SSH_RUNNER_CREATED', payload: { id: sshId, taskId, ...sshData }});
    store.dispatch({ type: 'SAGA_PROMISE_ADD_SSH_RUNNER_ID', payload: { id: taskId, sshId }});

    return axiosInstance({
        url: `/run/${sshId}`,
        method: 'post',
        data: sshData,
    });
};

export const listRunningScript = async () => {
    return await axiosInstance({
        url: '/list',
    });
};

interface GetParamsType {
    taskId: string;
}
export const getRunnningScript = ({ taskId }: GetParamsType) => {
    return axiosInstance({
        url: `/get/${taskId}`,
    });
};

interface LogParamsType {
    parentId: mongoose.Types.ObjectId;
    sshId: mongoose.Types.ObjectId;
}

export const getRunningScriptLiveLog = ({ sshId, parentId }: LogParamsType) => {
    const resourceURL = new URL(`${baseURL}/log/${sshId}`).toString();
    const SSE = new EventSource(resourceURL);

    let localEmitter:EventEmitter = sshLogEmitter[parentId.toString()];

    if (localEmitter === undefined){
        localEmitter = new EventEmitter();
        sshLogEmitter[parentId.toString()] = localEmitter;
    } 

    SSE.addEventListener('shell-log', (event)=>{
        const eventData = JSON.parse(event.data);
        localEmitter.emit('data', eventData);
        store.dispatch({ type: 'SSH_RUNNER_RUNNING', payload: { id: sshId, log: eventData }});
    });

    SSE.addEventListener('shell-exec-end', ()=>{
        localEmitter.emit('end');
        store.dispatch({ type: 'SSH_RUNNER_ENDED', payload: { id: sshId }});
    });

    SSE.onerror = (err:MessageEvent) => {
        if (!err.data) {
            console.log(`connection stream for ${sshId} have been closed`);
        }else{
            localEmitter.emit('error', err);
        }
        SSE.close();
    };

    return localEmitter;
};

interface DeleteParamsType {
    taskId: mongoose.Types.ObjectId;
}
export const deleteDoneScript = async ({ taskId }: DeleteParamsType) => {
    return await axiosInstance({
        url: `/log/${taskId}`,
        method: 'delete',
    });
};
