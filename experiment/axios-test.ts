import axios from 'axios';
import { Readable } from 'stream';

const testingAxiosStream = () => {

  const resourceURL = new URL('https://google.com').toString();

  return axios.request<Readable>({
      method: 'get',
      url: resourceURL,
      responseType: 'stream'
  }).then(({ data: logStream }) => {
    
      // console.log(Object.keys(logStream), 'stream form AXIOS');

      // sshLogStreams[parentId.toString()] = logStream

      logStream.on('readable', () => {
          const data: Buffer = logStream.read();
          if (data){
            console.log(data.toString('utf8'));
          }
          // store.dispatch({ type: 'SSH_RUNNER_RUNNING', payload: { id: sshId, log: data } });
      })
      logStream.on('error', (error)=>{
        console.log(error)
          //TODO is it a correct way to handle error in redux?
          // store.dispatch({ type: 'SSH_RUNNER_ENDED', payload: { id: sshId } });
      });
      logStream.on('end', () => {
        console.log('END')
          // store.dispatch({ type: 'SSH_RUNNER_ENDED', payload: { id: sshId } });
      })
      return logStream;
  });
}

testingAxiosStream();