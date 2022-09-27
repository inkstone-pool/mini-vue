const queue: any[] = [];
let isFlushPending = false;
const p = Promise.resolve();
//单独调用时再快也是改变值后才调用的nextTick，这时微任务第一个并不是传入的fn，而是更新的nextTick(flushJobs)中的flushJobs函数为第一个执行的微任务
export function nextTick(fn) {
  return fn ? p.then(fn) : p;
}
export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  queueFlush();

  function queueFlush() {
    if (isFlushPending) return;
    isFlushPending = true;
    nextTick(flushJobs);
  }
}
function flushJobs() {
  isFlushPending = false;
  let job;
  while ((job = queue.shift())) {
    job && job();
  }
}
