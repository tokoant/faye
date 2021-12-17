import { KratosTaskPayload } from '../../interfaces'

interface RunShellScriptParams {
    target: string;
    script: string;
}

export const runShellScript = (params: RunShellScriptParams) => async (payload: KratosTaskPayload) => {
    console.log(`PROMISE OF SLEEP FOR ${params.ms}ms in ${payload.taskId}`);
    sshClient.on('STDOUT', payload.ctx.logHelper);
    const result = new Promise((resolve, _reject) => {
        setTimeout(() => resolve(params), params.ms);
    });
    return result //{test:{time: 12,lintOk:true}}
};

export default runShellScript;
