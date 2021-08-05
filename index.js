import getLatestHeadlines from './src/Service/getLatestHeadlines.js';

const articles = await getLatestHeadlines()
console.log(articles)