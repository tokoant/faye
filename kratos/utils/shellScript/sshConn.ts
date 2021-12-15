

import axios from 'axios';
import mongoose from 'mongoose';
import { Readable } from 'stream';
import sshLogStreams from '../../local/sshLogStreams';
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

    store.dispatch({ type: 'SSH_RUNNER_CREATED', payload: { id: sshId, taskId, ...sshData } });
    store.dispatch({ type: 'SAGA_PROMISE_ADD_SSH_RUNNER_ID', payload: { id: taskId, sshId } });

    return axiosInstance({
        url: `${baseURL}/run/${sshId}`,
        method: 'post',
        data: sshData,
    });
};

export const listRunningScript = async () => {
    return await axiosInstance({
        url: `${baseURL}/list`,
    });
};

interface GetParamsType {
    taskId: string;
}
export const getRunnningScript = ({ taskId }: GetParamsType) => {
    return axiosInstance({
        url: `${baseURL}/get/${taskId}`,
    });
};

interface LogParamsType {
    parentId: mongoose.Types.ObjectId;
    sshId: mongoose.Types.ObjectId;
}

export const createRunningScriptLogStream = async ({ sshId, parentId }: LogParamsType) => {
    const resourceURL = new URL(`${baseURL}/log/${sshId}`).toString();

    return axios.request<Readable>({
        method: 'get',
        url: resourceURL,
        responseType: 'stream'
    }).then(({ data: logStream }) => {
        sshLogStreams[parentId.toString()] = logStream;

        store.dispatch({ type: 'SSH_RUNNER_RUNNING', payload: { id: sshId } });
    
        logStream.on('data', () => {});
    
        logStream.on('end', () => {
            store.dispatch({ type: 'SSH_RUNNER_ENDED', payload: { id: sshId } });
        })
        return logStream;
    });
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

interface KillParamsType {
    taskId: mongoose.Types.ObjectId;
}
export const killSshConnection = async ({ taskId }: KillParamsType) => {
    return await axiosInstance({
        url: `${baseURL}/kill/${taskId}`,
        method: 'delete',
    });
};
