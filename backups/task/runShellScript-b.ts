import { Client as SSHClient } from 'ssh2';

import fs from 'fs';
import _ from 'lodash';

import Task from './task';
import sshDataStreamNormalizer from './sshDataStreamNormalizer/index';

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

const connect = ({ client, config: configLocal }: { client: any; config: any }): Promise<void> =>
  new Promise((resolve, reject): void => {
    client.on('ready', resolve).on('error', reject).connect(configLocal);
  });

interface ConstructorArgs {
  params?: object;
  target: string;
  filename: string;
}

class RunShellScript {
  private _conn: SSHClient;

  private target: string;

  private filename: string;

  private disconnected: boolean;

  private _logLine: (line: string) => void;

  private runScript: (shCommand: string) => Promise<void>;

  public toJson(): {} {
    return { _conn: !!this._conn };
  }

  async _connectToTarget() {
    this._logLine(`Establishing connection to ${this.target}...`);
    try {
      await connect({
        client: this._conn,
        config: {
          host: this.target,
          port: 22,
          username: 'antoni.xu',
          privateKey: require('fs').readFileSync('/Users/antoni.xu/.ssh/id_ed25519'),
        },
      });

      this.disconnected = false;

      this._logLine('SSH connection established!');
      return true;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async _establishSSHConnection(): Promise<boolean | Error> {
    this._conn = new SSHClient();
    this._conn
      .on('error', (errLocal): void => {
        this.emit('reject', errLocal);
      })
      .on('end', () => {
        this.disconnected = true;
      });

    this.runScript = runScriptInCurrentConnection(this._conn, sshDataStreamNormalizer(this._logLine));

    try {
      await this._connectToTarget();
    } catch (error) {
      return Promise.reject(error);
    }

    return true;
  }

  public constructor({ params = {}, target, filename }: ConstructorArgs) {
    this.disconnected = false;
    this.target = target;
    this.filename = filename;
    this._logLine = (line) => {
      // this.emit('update', line);
    };
    this.runScript = async (): Promise<void> => {};

    this.once('finally', async (): Promise<void> => {
      console.log('finally runShellScript', filename);

      if (!this.started) {
        console.log(`Ssh was killed before it even connected because "${this.reason}" called`, this.props);
      } else if (this._conn) {
        if (this.cancelled) {
          // if this task is cancelled
          // need to unlock the server first before closing connection
          console.log('cancelled');
        }

        // then we close the connection
        console.log('Killing ssh connections because resolve called', this.props);
        this._conn.end();
      }
    });

    this.once('start', async (): Promise<void> => {
      const self = this;

      try {
        if (this.reason) {
          return;
        }

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
    });

    Task.afterConstructor(this);
  }
}

export default RunShellScript;
