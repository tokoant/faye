import { Request, Response, NextFunction } from 'express';
import SSH2Promise from 'ssh2-promise';

const sshconfig = {
  host: '127.0.0.1',
  username: 'antoni.xu',
  identity: '/Users/antoni.xu/.ssh/id_ed25519',
}

const buildShellParams = (scriptParams:{ [key: string]: string }):string => {
  const paramsArr:string[] = [];
  const keys = Object.keys(scriptParams);

  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    paramsArr.push(`${key}=${scriptParams[key]}`);
  }

  return paramsArr.join(' ');
};

export const runShellScript = async ( req:Request, _res:Response, next:NextFunction ) => {

  const { filename, scriptParams } = req.body;

  const ssh = new SSH2Promise(sshconfig);

  await ssh.connect();

  try {
    const socket = await ssh.shell();
    socket.write(buildShellParams(scriptParams));
    socket.write(` sh /Users/antoni.xu/faye/scripts/${filename}`);
    socket.write('\n');
    socket.on('data', (data:Buffer) => {
      console.log(data.toString());
    });
  }catch(e){
    console.log(e);
  }

  next();
};
