/**
 * @license
 * Copyright (C) 2019–2024 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const _ = require('lodash');

/**
 * Applies "iterator" function to all elements of the array and its children
 *
 * copied from service-core
 * @param {Array<Stream>} array
 * @param {(a: Stream) => Stream} iterator
 * @returns {Array<Stream>}
 */
exports.cloneAndApply = function (array, iterator) {
  const result = [];
  array.forEach((item) => {
    const clone = _.clone(item);
    result.push(applyRecursive(iterator(clone), iterator));
  });
  return result;

  function applyRecursive (item, iterator) {
    if (!Array.isArray(item.children) || item.children.length === 0) return item;
    const result = [];
    item.children.forEach((child) => {
      const clone = _.clone(child);
      result.push(applyRecursive(iterator(clone), iterator));
    });
    item.children = result;
    return item;
  }
};

/**
 * @typedef {{
 *   children: Array<Stream>
 * }} Stream
 */
