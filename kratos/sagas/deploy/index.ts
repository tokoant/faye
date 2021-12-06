import getCloudRunConfig from "./getCloudRunConfig";
import getCloudRunConfigRejected from './getCloudRunConfigRejected';
import getCloudRunConfigWithLog from './getCloudRunConfigWithLog';
import updateExpiresDate from "./updateExpiresDate";
import checkCloudRunManifest from './checkCloudRunManifest';

const serializeableDeploy = {
  getCloudRunConfig,
  getCloudRunConfigRejected,
  getCloudRunConfigWithLog,
  updateExpiresDate,
  checkCloudRunManifest,
}

export default serializeableDeploy;
