import puppeteer from 'puppeteer';
import ArticleContentQuery from './src/Query/ArticleContentQuery.js';
import getLatestHeadlines from './src/Query/getLatestHeadlines.js';
import fs from 'fs'

const articleHeadlines = await getLatestHeadlines()

const show = true
const browser = await puppeteer.launch({
    headless: ! show,
    args: ['--no-sandbox']
})
const page = await browser.newPage()

for (const articleHeadlineKey in articleHeadlines) {

    /** @type {Headline} articleHeadline */
    const articleHeadline = articleHeadlines[articleHeadlineKey]

    const articleContentQuery = new ArticleContentQuery(page)

    const articleContent = await articleContentQuery.getArticleContent(articleHeadline.link)
}

await browser.close()