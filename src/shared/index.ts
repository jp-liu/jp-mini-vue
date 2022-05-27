export * from './toDisplayString'

export const extend = Object.assign

export const isObject = value => value !== null && typeof value === 'object'

export const isString = value => typeof value === 'string'

export const isSymbol = value => typeof value === 'symbol'

export const hasChanged = (value, newValue) => !Object.is(value, newValue)

export const hasOwn = (val, key) =>
  Object.prototype.hasOwnProperty.call(val, key)

export const keys = obj => Object.keys(obj)

export const isOn = (str: string): boolean => /^on[A-Z]/.test(str)

export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (_, e) => {
    return e ? e.toUpperCase() : e
  })
}
export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const toHandlerKey = (str: string) => {
  return str ? `on${capitalize(str)}` : ''
}
