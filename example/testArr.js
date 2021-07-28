let handler = {
  get(target, key, receiver) {
    console.log("get操作", target, key);
    return Reflect.get(target, key);
  },
  set(target, key, value, receiver) {
    console.log("set操作", target, key, value);
    return Reflect.set(target, key, value);
  },
};
let proxyArray = new Proxy([1, 2, 3], handler);
let data = proxyArray.includes(1);
