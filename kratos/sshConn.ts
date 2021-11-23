import axios from 'axios';
import EventSource from 'eventsource';
import mongoose from 'mongoose';

const baseURL = 'http://localhost:6788/script';

const axiosInstance = axios.create({
    baseURL,
    timeout: 1000,
    headers: {},
});

interface RunParamsType {
    taskId: mongoose.Types.ObjectId;
    target: string;
    script?: string;
}
export const runShellScript = ({ taskId, target, script }: RunParamsType) => {
    return axiosInstance({
        url: `/run/${taskId}`,
        method: 'post',
        data: {
            target,
            script,
        },
    });
};

export const listRunningScript = async () => {
    return await axiosInstance({
        url: '/list',
    });
};

interface GetParamsType {
    taskId: mongoose.Types.ObjectId;
}
export const getRunnningScript = async ({ taskId }: GetParamsType) => {
    return await axiosInstance({
        url: `/get/${taskId}`,
    });
};

interface LogParamsType {
    taskId: mongoose.Types.ObjectId;
}

export const getRunningScriptLiveLog = async ({ taskId }: LogParamsType) => {
    const resourceURL = new URL(`${baseURL}/log/${taskId}`).toString();

    const SSE = new EventSource(resourceURL);

    SSE.onerror = (err:MessageEvent) => {
        if (err.data === '') console.log(`connection stream for ${taskId} have been closed`);
        SSE.close();
    };

    return SSE;
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
