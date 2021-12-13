import { EventEmitter } from "events";

const sshLogEmitter:Record<string, EventEmitter> = {};

export default sshLogEmitter;
