import mongoose from 'mongoose';
import { runShellScript, getRunningScriptLiveLog } from './sshConn';
import sshLogEmitter from '../../local/sshLogEmitter';

interface RunSshScriptWithLogStreamParams {
  parentId: mongoose.Types.ObjectId | undefined;
  taskId: mongoose.Types.ObjectId;
  target: string, 
  script: string,
}

export const runSshScriptWithLogStream = (params:RunSshScriptWithLogStreamParams) => {
    
  const { parentId } = params;

  if (!parentId) throw new Error("parent effect id must be provided to stream the log");
  
  const sshId = new mongoose.Types.ObjectId();

  getRunningScriptLiveLog({ sshId, parentId });
  
  runShellScript({ ...params, sshId });

  return sshLogEmitter[parentId.toString()];
}
