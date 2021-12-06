import getCloudRunConfig from "./getCloudRunConfig";
import getCloudRunConfigRejected from './getCloudRunConfigRejected';
import updateExpiresDate from "./updateExpiresDate";
import checkCloudRunManifest from './checkCloudRunManifest';

const serializeableDeploy = {
  getCloudRunConfig,
  getCloudRunConfigRejected,
  updateExpiresDate,
  checkCloudRunManifest,
}

export default serializeableDeploy;
