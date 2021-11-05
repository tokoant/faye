const getAllTask = () => {
  const Task = global.faye?.Task;

  return Task.queue;
}

export default getAllTask;
