import serializeableDeploy from "./deploy";
import mongoose from 'mongoose';

type SerializeableTaskType = ( {id}: {id: mongoose.Types.ObjectId} )=>Promise<{ id: mongoose.Types.ObjectId; result: string; }>;
const serializeableTask:Record<string, SerializeableTaskType> = {
  ...serializeableDeploy
}

export default serializeableTask;
