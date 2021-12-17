import Axios from 'axios';
import { KratosTaskPayload } from '../../interfaces'

interface RunDeployParams {
    ms: number,
}

jestMagic() {
    [runDeploy,{featuer:2}]
}

// slow detection
// different 

const runDeploy = (params: RunDeployParams) => async (payload: KratosTaskPayload)=> {
    const { magic } = payload
    let dockerManifest
    try {
        dockerManifest = await magic(getDockerManifest, { ms: 5 })
    } catch {
        // const slowInfo = await axios.get('/')
        const badRandom = Math.random()
        if (badRandom>0.5) {
            await magic(runShellScript, { script: 'build.sh', target: '' });
        } else {
            await magic(getDockerManifest, { script: 'build.sh', target: '' });
        }
        const buildResult = await magic(runShellScript,{ script: 'build.sh', target: '' });
        // kratos restart
        dockerManifest = await magic(getDockerManifest(buildResult));
        return
    }
    const random = await magic(getRandom())
    await magic(deployToCloudRun(dockerManifest, random)
    };

export default runDeploy;