export {};

declare global {
    namespace NodeJS {
        interface Global {
          faye?: {
            Task?: any
          }
        }
    }
}
