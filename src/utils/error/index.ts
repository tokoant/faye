export const buildValidationErrorParams = (reason: string) => {
  return {
    type: 'validation',
    error: {
      reason,
    }
  }
}
