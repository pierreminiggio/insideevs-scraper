import getLatestHeadlines from './src/Query/getLatestHeadlines.js';
import getArticleContent from './src/Query/getArticleContent.js';

const articleHeadlines = await getLatestHeadlines()

for (const articleHeadlineKey in articleHeadlines) {

    /** @type {Headline} articleHeadline */
    const articleHeadline = articleHeadlines[articleHeadlineKey]
    const articleContent = await getArticleContent(articleHeadline.link, true)

    //break
}