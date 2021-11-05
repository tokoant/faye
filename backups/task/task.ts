import { User } from '../../types/user';
import { EventEmitter } from 'events';

interface TaskProps {
  tagString: string;
  user: User;
  session: string;
  params?: Record<string, any>;
  target?: string;
  filename?: string;
  /**
   * Prevent this task from being blocked by kratos when kratos is scheduled to restart.
   */
  unblockable?: boolean;
}

export default class Task extends EventEmitter {
  public static afterConstructor = (task:any): void => {

    task.on('update', (data: string): void => {
      task.log.push(data);
    });
    task.once('start', (): void => {
      task.started = new Date(); // eslint-disable-line no-param-reassign

      // if task was cancelled before started, emit cancel
      if (task.cancelled) {
        task.emit('cancel', task.reason);
      }
    });
    task.once('reject', (reason:string): void => {
      task.reason = reason; // eslint-disable-line no-param-reassign
      task.emit('finally');
    });
    task.once('resolve', (): void => {
      task.emit('finally');
    });
    task.once('cancel', (reason:string): void => {
      task.cancelled = true; // eslint-disable-line no-param-reassign
      task.emit('reject', reason);
    });
    task.once('finally', (): void => {
      console.log('finally');
    });
  };

  public id: string;

  public created: object;

  public started?: object;

  public ended?: object;

  public props: TaskProps;

  public reason?: string;

  public cancelled: boolean = false;

  public type: string;

  public log: string[];

  public resolvedOrRejected: boolean = false;

  public toJson(): {} {
    return {
      id: this.id,
      type: this.type,
      reason: this.reason,
      props: this.props,
      created: this.created,
      started: this.started,
      ended: this.ended,
      log: this.log,
    };
  }

  public constructor({ props, type }: { props: TaskProps; type: string }) {
    super();
    this.created = new Date();
    this.log = [];
    this.id = String(Math.random());
    this.props = props;
    this.type = type;

    this.once('resolve', (): void => {
      this.resolvedOrRejected = true;
    });
    this.once('reject', (): void => {
      this.resolvedOrRejected = true;
    });
    this.once('cancel', (reason: string): void => {
      this.cancelled = true;
      this.reason = reason;
    });
  }
}
