export function patchEvent(
  el: Element & { _vei?: Record<string, any> },
  rawName: string,
  preValue,
  nextValue
) {
  // 缓存绑定的事件
  const invokers = el._vei || (el._vei = {});
  const existingInvoker = invokers[rawName];
  const name = rawName.slice(2).toLocaleLowerCase();
  if (nextValue && existingInvoker) {
    // 之前已经绑定过了，也传了新的绑定事件，替换   eg. onClick: fn1 => onClick = fn2
    // 这里使用nextValue直接替换createInvoker创建出来的invoker
    // 原因是： addEventListener
    // 事件监听认为是不同的，所以，同一个事件会被监听多次，('click', fn1) 是无法直接替换成 addEventListener('click', fn2)
    // patch
    existingInvoker.value = nextValue;
  } else {
    if (nextValue) {
      // 创建一个调用器
      // 使用 createInvoker创建的事件调用器是会生成一个固定的函数地址，addEventListener永远都是监听这一个地址
      // 好处就是，以后我只要改变nextValue就可以了
      const invoker = (invokers[rawName] = createInvoker(nextValue));
      // 之前没有，现在添加事件
      el.addEventListener(name, invoker);
    } else if (existingInvoker) {
      // 用户移除掉事件
      el.removeEventListener(name, existingInvoker);
      // 从事件缓存中移除
      invokers[rawName] = undefined;
    }
  }
}
function createInvoker(initialValue) {
  const invoker = (e: Event) => initialValue(e);
  invoker.value = initialValue;
  return invoker;
}
