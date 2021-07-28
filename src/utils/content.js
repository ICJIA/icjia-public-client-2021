const getUnifiedTags = function (content) {
  content.forEach((item) => {
    if (item.tags && item.tags.length > 0) {
      let tagArray = [];
      const tagValues = Object.values(item.tags);
      tagValues.forEach((t) => {
        tagArray.push(t.title);
      });
      // console.log(tagArray);
      item.tagsAlt = item.tags;
      item.tags = tagArray;
    }
  });
  //console.log(content);
  return content;
};

const isRelatedContent = function (content) {
  if (
    (content.events && content.events.length) ||
    (content.posts && content.posts.length) ||
    (content.meetings && content.meetings.length)
  )
    return true;
  return false;
};

export { getUnifiedTags, isRelatedContent };
