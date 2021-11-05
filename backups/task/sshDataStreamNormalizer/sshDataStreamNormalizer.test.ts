// import fs from 'fs';
import sshDataStreamNormalizer from '.';

// the ssh data events are buffers. They are stored as is in this example file
import * as testData from './testData';

const testDataToOutput = (testDataLocal): string[] => {
  const output: string[] = [];
  const log = (line: string): void => {
    output.push(line);
  };
  const sshDataEventListener = sshDataStreamNormalizer(log);

  testDataLocal.map(({ hex }): Buffer => Buffer.from(hex, 'hex')).forEach(sshDataEventListener);
  // fs.writeFileSync('./server/util/sshDataStreamNormalizer/result.json', JSON.stringify(output, null, '\t'));

  return output;
};

test('SSH data stream: simple', (): void => {
  expect(testDataToOutput(testData.small)).toStrictEqual(['<GroupedLog>', 'Initial setups (...)']);
});

test('SSH data stream: backspace', (): void => {
  expect(testDataToOutput(testData.backSpace)).toStrictEqual([]);
});

test('SSH data stream: full1', (): void => {
  expect(testDataToOutput(testData.full)).toStrictEqual(testData.fullResult);
});

test('SSH data stream: full2', (): void => {
  expect(testDataToOutput(testData.full2)).toStrictEqual(testData.fullResult2);
});

test('SSH data stream: webpack progress', (): void => {
  expect(testDataToOutput(testData.webpack)).toStrictEqual(['Compilation  starting…', 'Compilation  finished']);
});

test('SSH data stream: webpack progress2', (): void => {
  expect(testDataToOutput(testData.webpack2)).toStrictEqual(['Compilation  starting…', 'Compilation  finished']);
});

test('SSH data stream: webpack error', (): void => {
  expect(testDataToOutput(testData.webpackError)).toStrictEqual([
    'Compilation  starting…',
    'build:error "some reason why it errored"', // eslint-disable-line
    'Compilation  finished',
  ]);
});

test('SSH data stream: s3Upload', (): void => {
  expect(testDataToOutput(testData.s3Upload)).toStrictEqual([]);
});

test('SSH data stream: docker', (): void => {
  expect(testDataToOutput(testData.docker)).toStrictEqual([
    'Stopping 10_ares_1 ...',
    'Stopping 10_ares_1 ... \u001b[32mdone\u001b[0m',
    'Removing 10_ares_1 ...',
  ]);
});
