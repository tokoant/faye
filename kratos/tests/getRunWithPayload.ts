import { KratosTaskPayload } from './interfaces'
import mongoose from 'mongoose'

export default ()=>{
    let kids=[]
    const parentId = new mongoose.Types.ObjectId();
    const ctx = {};
    return (jobFunction: any)=>{
        const taskId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId();
        const payload: KratosTaskPayload = { taskId, parentId, ctx }
        kids.push(taskId)
        return jobFunction(payload)
    }
}