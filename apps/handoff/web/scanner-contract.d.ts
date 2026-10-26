/** Consumed interface of the existing public scanner module. */
export interface Scanner {
  stop(announce?: boolean): void;
  refresh(): void;
  results(): string[];
}
export function createScanner(options: { t: (key: string) => string }): Scanner;
