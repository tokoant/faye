import getCloudRunConfig from "./deploy/getCloudRunConfig";
import getCloudRunConfigRejected from './deploy/getCloudRunConfigRejected';
import getCloudRunConfigWithLog from './deploy/getCloudRunConfigWithLog';
import updateExpiresDate from "./deploy/updateExpiresDate";
import checkCloudRunManifest from './deploy/checkCloudRunManifest';

const serializeableDeploy:Record<string, any> = {
  getCloudRunConfig,
  getCloudRunConfigRejected,
  getCloudRunConfigWithLog,
  updateExpiresDate,
  checkCloudRunManifest,
}

export default serializeableDeploy;
