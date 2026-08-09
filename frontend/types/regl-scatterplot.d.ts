declare module "regl-scatterplot" {
  export interface Scatterplot {
    draw(points: unknown[]): Promise<void> | void;
    set(options: Record<string, unknown>): void;
    subscribe(eventName: string, handler: (...args: unknown[]) => void): void;
  }

  export default function createScatterplot(
    options?: Record<string, unknown>,
  ): Scatterplot;
}
