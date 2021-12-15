import mongoose from 'mongoose'

export interface KratosTaskPayload {
    taskId: mongoose.Types.ObjectId;
    ctx: {},
    parentId: mongoose.Types.ObjectId;
}