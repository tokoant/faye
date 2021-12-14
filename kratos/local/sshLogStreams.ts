import { Readable } from "stream";

const sshLogStreams:Record<string, Readable> = {};

export default sshLogStreams;
