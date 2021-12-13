import mongoose from 'mongoose';
import { runShellScript, createRunningScriptLogStream } from './sshConn';

interface RunSshScriptWithLogStreamParams {
  parentId: mongoose.Types.ObjectId | undefined;
  taskId: mongoose.Types.ObjectId;
  target: string, 
  script: string,
}

export const runSshScriptWithLogStream = async (params:RunSshScriptWithLogStreamParams) => {
    
  const { parentId } = params;

  if (!parentId) throw new Error("parent effect id must be provided to stream the log");
  
  const sshId = new mongoose.Types.ObjectId();

  await createRunningScriptLogStream({ sshId, parentId });
  
  return runShellScript({ ...params, sshId });
}
