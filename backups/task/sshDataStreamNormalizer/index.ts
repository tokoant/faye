// import fs from 'fs';

const splitBy = '\n';
const uploadS3Test = new RegExp(/^Completed (.+) with (\d+) file\(s\) remaining$/);

// line never should equal to this but may contain this
const lineBlacklist = ['\u001b[1A\u001b[2K', '\u001b[1B'];
const containBlacklist = ['\b\b'];

type logConsumer = (str: string) => void;
type sshStreamNormalizer = (data: Buffer | string) => void;
export default (consumer: logConsumer): sshStreamNormalizer => {
  // we need to have state for each stream to be able to tell when we are in the midddle of something.
  // i.e. webpack build
  let webpackCompiling = false;

  return (data): void => {
    // data is a buffer of a few lines.
    // these few lines may have terminal control characters,
    // like `\u001b[1A`, or `\u001b[2K` or color terminal.
    // Below is a poor attempt to strip them
    // webpack is a heavy user of those, docker-compose as well.

    // Snippet to log data for tests
    // require('fs').appendFileSync('./log.log', `${JSON.stringify({ hex: data.toString('hex'), text: data.toString() })},\n`);
    let str = data.toString();

    if (!webpackCompiling && str.includes('Webpack: Starting ...')) {
      webpackCompiling = true;

      str = 'Webpack: Starting ...';
    } else if (webpackCompiling) {
      if (
        str.includes(`Finished 'build' after`) ||
        str.includes('Webpack: Finished after') ||
        str.includes('build:success:warning') ||
        str.includes('build:success:error') ||
        str.includes('build:error')
      ) {
        // we are out of compile mode
        webpackCompiling = false;
      } else {
        return;
      }
    }

    const logs = str.trim().replace(/\r/g, '\n').split(splitBy);

    logs
      .filter((line: string): boolean => !lineBlacklist.includes(line))
      .filter((line: string): boolean => !containBlacklist.some((c: string): boolean => line.includes(c)))
      .filter((line: string): boolean => !uploadS3Test.test(line))
      .filter((line: string): boolean => !line.includes('Webpack: '))
      .filter((line: string): boolean => !line.includes('✔ '))
      .filter((line: string): boolean => line !== '+ set +x')
      .map((line: string): string => line.replace('\u001b[2K\u001b[1A\u001b[2K\u001b[G', ''))
      .filter((line: string): boolean => !!line)
      .forEach(consumer);
  };
};
