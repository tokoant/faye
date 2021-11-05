import { Stream } from 'stream';

export interface User {
  type: string;
  id: string;
  name: string;
  email: string;
  slackId: string;
  pic?: string;
}

export interface RunShellScriptReturn {
  options: object;
  logStream: Stream;
  started: Date;
  result: Promise<{
    ended: Date;
    stdout: string[];
    stderr: string[];
    combinedStd: string[];
    isError: boolean;
    error: Error;
    isCancelled: boolean;
    isOk: boolean;
  }>;
}

export interface RunShellScriptArgs {
  params: object;
  target: string;
  filename: string;
}
