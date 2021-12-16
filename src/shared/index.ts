export const extend = Object.assign

export const isObject = value => value !== null && typeof value === 'object'

export const hasChanged = (value, newValue) => !Object.is(value, newValue)

export const hasOwn = (val, key) =>
  Object.prototype.hasOwnProperty.call(val, key)

export const isOn = (str: string): boolean => /^on[A-Z]/.test(str)
