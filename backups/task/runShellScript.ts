import { Client as SSHClient } from 'ssh2';
import { RunShellScriptReturn, RunShellScriptArgs } from '../../types/global';
import sshDataStreamNormalizer from './sshDataStreamNormalizer';

type RunShellScriptType = (params: RunShellScriptArgs) => RunShellScriptReturn;

const runScriptInCurrentConnection =
  (connectedClient: any, onUpdate: (str: string) => void): ((command: string) => Promise<void>) =>
  (command: string): Promise<void> =>
    new Promise((resolve, reject): void => {
      connectedClient.exec(command, (err: any, stream: any): void => {
        if (err) {
          reject(err);

          return;
        }

        stream
          .on('close', (code: number): void => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`runShellScript errored with return code: ${code}`));
            }
          })
          .on('data', onUpdate)
          .on('error', reject)
          .stderr.on('data', onUpdate);
      });
    });

const runShellScript: RunShellScriptType = async (params) => {
  const _conn: SSHClient = new SSHClient();
  const _logLine: () => void = () => {};
  let runScript: (shCommand: string) => Promise<void>;

  const _establishSSHConnection = async (): Promise<boolean | Error> => {
    _conn
      .on('error', (errLocal): void => {
        reject(errLocal);
      })
      .on('end', () => {
        // this.disconnected = true;
      });

    runScript = runScriptInCurrentConnection(_conn, sshDataStreamNormalizer(_logLine));

    try {
      await this._connectToTarget();
    } catch (error) {
      return Promise.reject(error);
    }
    return true;
  };

  try {
    await this._establishSSHConnection();
    this._logLine(`Running ssh command ${filename} on ${target}...\n`);
    // the task we want to do
    const sh: string = _.template(fs.readFileSync(`./scripts/${filename}`).toString('utf8'), {
      interpolate: undefined,
    })(params);
    // const sh = 'touch jacky-was-here';
    let error = false;

    try {
      await this.runScript(sh);
    } catch (errRunSh) {
      error = true;
      throw errRunSh;
    } finally {
      // we should unlock whether the runScript(sh) fail or succeed.
      // Because either way, the task is finished and it's safe to unlock

      if (!error) {
        this.emit('resolve');
      }
    }
  } catch (errStart) {
    if (errStart) {
      self.emit('reject', errStart);
    }
  }
};
