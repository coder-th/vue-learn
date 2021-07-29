declare interface App {
  mount(
    rootContainer: HTMLElement | string,
    isHydrate?: boolean,
    isSVG?: boolean
  ): Record<string, string> | void;
}
