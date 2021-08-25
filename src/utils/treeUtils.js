// @flow

const _ = require('lodash');

type Stream = {
  children: Array<Stream>,
}

/**
 * Applies "iterator" function to all elements of the array and its children
 * 
 * copied from service-core
 */
exports.cloneAndApply = function (array: Array<Stream>, iterator: Stream => Stream): Array<Stream> {
  const result: Array<Stream> = [];
  array.forEach(item => {
    const clone = _.clone(item);
    result.push(applyRecursive(iterator(clone), iterator));
  });
  return result;

  function applyRecursive(item: Stream, iterator: Stream => Stream) {
    if (! Array.isArray(item.children) || item.children.length === 0) return item;
    const result: Array<Stream> = [];
    item.children.forEach(child => {
      const clone = _.clone(child);
      result.push(applyRecursive(iterator(clone), iterator));
    });
    item.children = result;
    return item;
  }
};