/* eslint-env browser */

function isVisibleElement(domElement) {
  return domElement.offsetWidth > 0 && domElement.offsetHeight > 0;
}

// Checks if an element is a hyperlink
function isHyperLink(domElement) {
  return (
    domElement.tagName === 'A' || domElement.tagName === 'BUTTON' || domElement.tagName === 'SELECT'
  );
}

function updateSubTreeLinkChars(domElement) {
  domElement.childNodes.forEach(child => {
    if (isVisibleElement(child)) {
      child.setAttribute('data-link_character_count', child.dataset.character_count);
      updateSubTreeLinkChars(child);
    }
  })
}

// Updates subtree link tags to reflect their position within a hyperlink
function updateSubTreeLinkTags(domElement) {
  domElement.childNodes.forEach(child => {
    if (isVisibleElement(child)) {
      child.setAttribute('data-link_tag_count', child.dataset.tag_count);
      updateSubTreeLinkTags(child);
    }
  })
}

function countChar(domElement) {
  let characterNumber = 0;
  domElement.childNodes.forEach(child => {
    if (isVisibleElement(child)) {
      characterNumber += parseInt(child.dataset.character_count, 10);
    } else if (child.nodeType === 3) {
      characterNumber += child.length;
    }
  })
  domElement.setAttribute('data-character_count', characterNumber);
}

// Counts characters belonging to hyperlink under node
function countLinkChar(domElement) {
  let linkCharacterNumber = 0;
  if (isHyperLink(domElement)) {
    linkCharacterNumber = parseInt(domElement.dataset.character_count, 10);
    domElement.setAttribute('data-link_character_count', linkCharacterNumber);
    updateSubTreeLinkChars(domElement);
    return;
  }
  domElement.childNodes.forEach(child => {
    if (isVisibleElement(child)) {
      linkCharacterNumber += parseInt(child.dataset.link_character_count, 10);
    }
  })
  domElement.setAttribute('data-link_character_count', linkCharacterNumber);
}

// Counts Tags under node
function countTag(domElement) {
  let tagNumber = 0;
  domElement.childNodes.forEach(child = {
    if (isVisibleElement(child)) {
      tagNumber += parseInt(child.dataset.tag_count, 10) + 1;
    }
  })
  domElement.setAttribute('data-tag_count', tagNumber);
}

// Counts tags that are hyperlinks under node
function countLinkTag(domElement) {
  let linkTagNumber = 0;
  if (isHyperLink(domElement)) {
    linkTagNumber = parseInt(domElement.dataset.tag_count, 10);
    domElement.setAttribute('data-link_tag_count', linkTagNumber);
    updateSubTreeLinkTags(domElement);
    return;
  }
  let child = domElement.firstChild;
  while (child) {
    if (isVisibleElement(child)) {
      linkTagNumber += parseInt(child.dataset.link_tag_count, 10);
      if (isHyperLink(domElement)) {
        linkTagNumber += 1;
      }
    }
    child = child.nextSibling;
  }
  domElement.setAttribute('data-link_tag_count', linkTagNumber);
}

// Calculates probability for a z-score. borrowed from
// http://onlinestatbook.com/2/calculators/normal.html
function zScoreProb(z) {
  let flag = false;
  if (z < 0.0) {
    flag = true;
  }
  const z2 = Math.abs(z);
  let b = 0.0;
  const s = (Math.sqrt(2) / 3) * z2;
  let HH = 0.5;
  for (let i = 0; i < 12; i++) {
    const a = (Math.exp((-HH * HH) / 9) * Math.sin(HH * s)) / HH;
    b += a;
    HH += 1.0;
  }
  let p = 0.5 - b / Math.PI;
  if (!flag) {
    p = 1.0 - p;
  }
  return p;
}

// Calculates visual importance of a node
function visualImportance(mean, sd, domElement) {
  const { left: ll, right: ul } = domElement.getBoundingClientRect();
  const z1 = (ll - mean) / sd;
  const z2 = (ul - mean) / sd;
  const zp = zScoreProb(z2) - zScoreProb(z1);
  return Math.round(zp * 10000) / 10000;
}

function cleanUp(domElement) {
  const obj = domElement || document.body;
  delete obj.dataset.character_count;
  delete obj.dataset.tag_count;
  delete obj.dataset.link_tag_count;
  delete obj.dataset.link_character_count;
  delete obj.dataset.hybrid_char_number;
  delete obj.dataset.content;
  delete obj.dataset.text_density;
  delete obj.dataset.density_sum;
  delete obj.dataset.max_density_sum;
  let child = obj.firstChild;
  while (child) {
    if (isVisibleElement(child)) {
      cleanUp(child);
    }
    child = child.nextSibling;
  }
}

function setVisualImportance(mean, sd, domElement) {
  const obj = domElement || document.body;
  let child;
  if (obj.hasChildNodes()) {
    child = obj.firstChild;
    while (child) {
      if (isVisibleElement(child)) {
        setVisualImportance(mean, sd, child);
      }
      child = child.nextSibling;
    }
  }
  if (obj.childElementCount === 0 && isVisibleElement(obj)) {
    obj.setAttribute(
      'data-hybrid_char_number',
      parseInt(obj.dataset.character_count, 10) * visualImportance(mean, sd, obj),
    );
  } else {
    let hybridCharNumber = 0;
    child = obj.firstChild;
    while (child) {
      if (isVisibleElement(child)) {
        hybridCharNumber += parseFloat(child.dataset.hybrid_char_number, 10);
      }
      child = child.nextSibling;
    }
    obj.setAttribute('data-hybrid_char_number', hybridCharNumber);
  }
}

export {
  isVisibleElement,
  setVisualImportance,
  countChar,
  countLinkChar,
  countTag,
  countLinkTag,
  cleanUp,
};
