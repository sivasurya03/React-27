/** Resolves `produce()` after a short delay to imitate network latency; thrown errors become rejections. */
export function mockRequest<T>(produce: () => T, delay = 350): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(produce());
      } catch (error) {
        reject(error);
      }
    }, delay);
  });
}
