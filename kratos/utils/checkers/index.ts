import _ from 'lodash';

export const isAsyncFunc = (func:any) => {
  return func[Symbol.toStringTag] === 'AsyncFunction';
}

export const isSerializable = (obj:any) => {
  if (_.isUndefined(obj) ||
      _.isNull(obj) ||
      _.isBoolean(obj) ||
      _.isNumber(obj) ||
      _.isString(obj)) {
    return true;
  }

  if (!_.isPlainObject(obj) &&
      !_.isArray(obj)) {
    return false;
  }

  for (var key in obj) {
    if (!exports.isSerializable(obj[key])) {
      return false;
    }
  }

  return true;
};

export const isObject = (object:any) => {
  return object != null && typeof object === 'object';
}

export const deepEqual = (object1:any, object2:any) => {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (const key of keys1) {
    const val1 = object1[key];
    const val2 = object2[key];
    const areObjects = isObject(val1) && isObject(val2);
    if (
      areObjects && !deepEqual(val1, val2) ||
      !areObjects && val1 !== val2
    ) {
      return false;
    }
  }
  return true;
}
