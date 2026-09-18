-- Build filter for the Word versions of the briefings in this folder.
--   pandoc docs/PAGE-PROMOTION-STRATEGY.md -o docs/PAGE-PROMOTION-STRATEGY.docx \
--     --resource-path=docs --lua-filter=docs/pandoc-docx.lua
-- Sizes every image to fit a cell of a two-column table. Never add --toc:
-- it inserts a Word field code that prompts readers to "update links".
function Image(img)
  img.attributes.width = "2.9in"
  img.attributes.height = nil
  return img
end
