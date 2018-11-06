/* eslint-env browser */
function standardTextDensity(domElement) {
  const charCount = parseInt(domElement.dataset.character_count, 10) || 0;
  const tagCount = parseInt(domElement.dataset.tag_count, 10) || 1;
  return charCount / tagCount;
}

function compositeTextDensity(domElement, bodyCharCount, bodyLinkCharCount) {
  const charCount = parseInt(domElement.dataset.character_count, 10) || 0;
  const linkChars = parseInt(domElement.dataset.link_character_count, 10) || 1;
  const nonLinkChars = charCount - linkChars || 1;
  const tagCount = parseInt(domElement.dataset.tag_count, 10) || 0;
  const linkTags = parseInt(domElement.dataset.link_tag_count, 10) || 1;
  const blcc = bodyLinkCharCount || 0;
  const textDensity = charCount / tagCount;
  const logArg = Math.log((charCount * tagCount) / (linkChars * linkTags));
  const logBase = Math.log((charCount * linkChars) / nonLinkChars +
    (blcc * charCount) / (bodyCharCount || 1) +
    Math.E,
  );
  return (textDensity * logArg) / logBase || 0;
}

function hybridTextDensity(domElement, bodyCharCount, bodyLinkCharCount) {
  const charCount = parseInt(domElement.dataset.character_count, 10) || 1;
  const blcc = bodyLinkCharCount || 1;
  let textDensity = 0;
  const hybridCharCount = parseFloat(domElement.dataset.hybrid_char_number, 10);
  const linkChars = parseInt(domElement.dataset.link_character_count, 10) || 1;
  const nonLinkChars = charCount - linkChars || 1;
  const tagCount = parseInt(domElement.dataset.tag_count, 10)
    || hybridCharCount / charCount || 1;
  const linkTags = parseInt(domElement.dataset.link_tag_count, 10) || 1;
  if (hybridCharCount > 0) {
    const logArg = Math.log((hybridCharCount * tagCount) / (linkChars * linkTags));
    const logBase = Math.log((hybridCharCount * linkChars) / nonLinkChars +
      (blcc * charCount) / bodyCharCount +
      Math.E,
    );
    textDensity =
      ((hybridCharCount / tagCount) * logArg) / logBase
      || hybridCharCount / charCount || 0;
    if (textDensity < 0) {
      return hybridCharCount / charCount || 0;
    }
  }
  return textDensity;
}

export { standardTextDensity, compositeTextDensity, hybridTextDensity };
