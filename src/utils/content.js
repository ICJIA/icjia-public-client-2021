import _ from "lodash";

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
    (content.meetings && content.meetings.length) ||
    (content.grants && content.grants.length)
  )
    return true;
  return false;
};

const getPublicationDate = function (posts) {
  let updated = posts.map((e) => ({
    ...e,
    publicationDate:
      e.dateOverride && e.dateOverride.length ? e.dateOverride : e.published_at,
  }));
  return updated;
};

const getProperCategory = function (categoryMap, category) {
  //let categoryMap = this.$myApp.config.maps.meetings;
  let obj = categoryMap.find((o) => o.category === category);
  if (_.isEmpty(obj)) {
    return "Undefined";
  } else {
    return obj.label;
  }
};

export {
  getUnifiedTags,
  isRelatedContent,
  getPublicationDate,
  getProperCategory,
};
