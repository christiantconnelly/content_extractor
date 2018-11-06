/* eslint-env browser */
import {
  isVisibleElement,
  setVisualImportance,
  countChar,
  countLinkChar,
  countTag,
  countLinkTag,
  cleanUp,
} from './helpers';
import { standardTextDensity, compositeTextDensity, hybridTextDensity } from './density_functions';

// Finds node in subtree with maximum density sum, marks it as content and
// marks its ancestors as ancestors
function markSubTree(maxDensity, domElement) {
  let parent;
  const maxChildNode = domElement.querySelector(`[data-density_sum="${maxDensity}"]`);
  if (maxChildNode) {
    if (maxChildNode.dataset.content !== '1') {
      maxChildNode.setAttribute('data-content', 1);
      parent = maxChildNode.parentNode;
      while (parent && parent.tagName !== 'HTML') {
        if (parent.dataset.content === '0') {
          parent.setAttribute('data-content', 2);
        }
        parent = parent.parentNode;
      }
      parent.setAttribute('data-content', 2);
    }
  } else if (domElement.dataset.density_sum === maxDensity) {
    domElement.setAttribute('data-content', 1);
  }
}

// Calculates text density of nodes using the density funciton passed.
// Also calculates density sum and sets max density sum
// for each node. Returns the max density node
function calculateDensityAndDensitySum(
  densityFunction,
  bodyCharCount,
  bodyLinkCharCount,
  domElement,
) {
  const obj = domElement || document.body;
  let child = obj.firstChild;
  let density = 0;
  let maxDensityNode;
  let currentChildDensity;
  if (obj.hasChildNodes()) {
    while (child) {
      if (isVisibleElement(child)) {
        currentChildDensity = calculateDensityAndDensitySum(
          densityFunction,
          bodyCharCount,
          bodyLinkCharCount,
          child,
        );
        if (maxDensityNode) {
          if (
            parseFloat(currentChildDensity.dataset.density_sum) >
            parseFloat(maxDensityNode.dataset.density_sum)
          ) {
            maxDensityNode = currentChildDensity;
          }
        } else {
          maxDensityNode = currentChildDensity;
        }
      }
      child = child.nextSibling;
    }
  }
  const textDensity = densityFunction(obj, bodyCharCount, bodyLinkCharCount);
  obj.setAttribute('data-text_density', textDensity);
  if (obj.childElementCount === 0 && isVisibleElement(obj)) {
    obj.setAttribute('data-density_sum', textDensity);
    maxDensityNode = obj;
  } else {
    child = obj.firstChild;
    while (child) {
      if (isVisibleElement(child)) {
        if (
          parseFloat(child.dataset.density_sum) > parseFloat(maxDensityNode.dataset.density_sum)
        ) {
          maxDensityNode = child;
        }
        density += parseFloat(child.dataset.text_density);
      }
      child = child.nextSibling;
    }
    obj.setAttribute('data-density_sum', density);
  }
  if (!maxDensityNode) {
    maxDensityNode = obj;
  }
  obj.setAttribute('data-max_density_sum', maxDensityNode.dataset.density_sum);
  return maxDensityNode;
}

// Sets the charCount, tagCount, linkChars, and linkTags values for
// each node and finds the largest node for calculating the mean and
// sd for the hybrid method
function setNodeValuesAndRetrieveLargestElement(domElement) {
  const obj = domElement || document.body;
  let largestDOMElement = obj.getBoundingClientRect();
  if (obj.hasChildNodes()) {
    let child = obj.firstChild;
    while (child) {
      if (isVisibleElement(child)) {
        const rectangle = setNodeValuesAndRetrieveLargestElement(child);
        if (largestDOMElement) {
          if (
            rectangle.right - rectangle.left >=
            largestDOMElement.right - largestDOMElement.left
          ) {
            largestDOMElement = rectangle;
          }
        } else {
          largestDOMElement = rectangle;
        }
      }
      child = child.nextSibling;
    }
  }
  obj.setAttribute('data-content', 0);
  countChar(obj);
  countTag(obj);
  countLinkTag(obj);
  countLinkChar(obj);
  return largestDOMElement;
}

// Determines textDensity threshold to use for determining content
function findThreshold(domElement) {
  let threshold = domElement.dataset.text_density;
  let parent = domElement.parentNode;
  let parentDensity;
  domElement.setAttribute('data-content', 1);
  while (true) {
    parent.setAttribute('data-content', 2);
    if (parent.tagName === 'HTML') {
      break;
    } else {
      parentDensity = parent.dataset.text_density;
      if (threshold - parentDensity > -1 * Number.EPSILON) {
        threshold = parentDensity;
      }
    }
    parent = parent.parentNode;
  }
  return threshold;
}

// Marks the content of the page by looking at the threshold and density sum
// and then calling mark subtree to find the content in the subtree
function markContent(threshold, domElement) {
  const obj = domElement || document.body;
  const textDensity = parseFloat(obj.dataset.text_density);
  const content = parseInt(obj.dataset.content, 10);
  if (content !== 1 && textDensity - threshold > -1 * Number.EPSILON) {
    markSubTree(obj.dataset.max_density_sum, obj);
    let child = obj.firstChild;
    while (child) {
      if (isVisibleElement(child)) {
        markContent(threshold, child);
      }
      child = child.nextSibling;
    }
  }
}

// Removes all nodes that arent content or parents of content
function removeNonContent(domElement) {
  const obj = domElement || document.body;
  if (isVisibleElement(obj)) {
    if (obj.dataset.content === '0') {
      obj.remove();
    }
    let child = obj.firstChild;
    while (child) {
      if (!isVisibleElement(child) || child.dataset.content === '0') {
        const tmp = child.nextSibling;
        child.remove();
        child = tmp;
      } else if (isVisibleElement(child) && child.dataset.content === '1') {
        child = child.nextSibling;
      } else {
        removeNonContent(child);
        child = child.nextSibling;
      }
    }
  } else {
    const tmp = obj.nextSibling;
    obj.remove();
    if (tmp) {
      removeNonContent(tmp);
    }
  }
}

// Clean the DOM using the "standard", "composite", or "hybrid" methods
function cleanDom(method) {
  const largestElement = setNodeValuesAndRetrieveLargestElement();
  let maxDensity;
  let x = new Date().getTime();
  if (method === 'hybrid') {
    const mean = (largestElement.right + largestElement.left) / 2;
    const sd = (largestElement.right - largestElement.left) / 2;
    setVisualImportance(mean, sd);
    maxDensity = calculateDensityAndDensitySum(
      hybridTextDensity,
      document.body.dataset.hybrid_char_number,
      document.body.dataset.link_character_count,
    );
  } else if (method === 'composite') {
    maxDensity = calculateDensityAndDensitySum(
      compositeTextDensity,
      document.body.dataset.character_count,
      document.body.dataset.link_character_count,
    );
  } else if (method === 'standard') {
    maxDensity = calculateDensityAndDensitySum(
      standardTextDensity,
      document.body.dataset.character_count,
      document.body.dataset.link_character_count,
    );
  }
  const threshold = findThreshold(maxDensity);
  markContent(threshold);
  x = new Date().getTime() - x;
  removeNonContent();
  cleanUp();
  return x;
}

export default cleanDom;
