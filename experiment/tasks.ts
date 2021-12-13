// Promise(async () => { })().then((result) => { })
// Callback(() => { })()
// NodeJs stream
//     File write stream(fs) fs.createWriteStream()
// axios.get({ returnType: 'stream' }).then((stream))
// stream.on('end', () => { })
// Event emitter:
//     Shell script(ssh2)
// Async Iterator


// Promise => Callback => NodeJs stream => Event emitter => Async Iterator(retuns a value or an error)

import EventEmitter from "events"
import { Stream } from "stream"


export const runPromise = async(params)=>{
    if (params.amount > 10) {
        throw new Error("Amount more than 10")
    } 
    return  "Amount ok"
}

export const runCallback =  (params, cb) => {
    setTimeout(()=>{
        if (params.amount > 10) {
            cb(new Error("Amount more than 10"))
        } else {
            cb(null,"Amount ok")
        }
    },1000)
}

export const runEventEmitter = (params) => {
    const ee = new EventEmitter.EventEmitter()
    setTimeout(() => {
        if (params.amount > 10) {
            ee.emit('error', new Error("Amount more than 10"))
        } else {
            ee.emit('data', "Amount ok")
        }
        ee.emit('end')
    },1000)
    return ee
}

export const runStream = (params) => {
    const stream = new Stream.Duplex()
        if (params.amount > 10) {
            stream.emit('error', new Error("Amount more than 10"))
        } else {
            stream.write('data', "Amount ok")
        }
    stream.end();
    return stream
}



// Example on how to plug one into another

const wrapStreamInPromise = async(params)=>{
    const stream = runStream(params)
    return new Promise((resolve,reject)=>{
        let data=''
        stream.on('readable',()=>{
            data += stream.read();
        })
        stream.on('error', reject)
        stream.on('end',()=>{
            resolve(data)
        })
    })
}