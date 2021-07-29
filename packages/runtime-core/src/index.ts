export function createRender(renderOptions) {
  const createApp = (...args) => {
    console.log("args", args);
    console.log("renderOptions", renderOptions);
    const app = {
      mount: (container) => {
        container.innerHTML = "666";
        return {};
      },
    };
    return app;
  };
  return {
    createApp,
  };
}
