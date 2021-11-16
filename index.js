import puppeteer from 'puppeteer';
import ArticleContentQuery from './src/Query/ArticleContentQuery.js';
import getLatestHeadlines from './src/Query/getLatestHeadlines.js';
import Headline from './src/Entity/Headline.js'
import fs from 'fs'
import path from 'path'
import { base64encode } from 'nodejs-base64'
import fetch, { Headers } from 'node-fetch'
import sanitize from 'sanitize-filename'

const args = process.argv

if (args.length !== 4 && args.length !== 5) {
    console.log('Use like this : npm start -- <saver_api_url> <saver_api_token> [debug_mode]')
    process.exit()
}

const apiUrl = args[2]
const apiToken = args[3]
const hasApi = apiUrl !== "''" && apiToken !== "''"

/** @type {Headers} */
let headers

if (hasApi) {
    headers = new Headers({
        Authorization: 'Bearer ' + apiToken,
        'Content-Type': 'application/json'
    })
}

const debugMode = args.length === 5 && args[4] === 'true'

const articleHeadlines = await getLatestHeadlines()

if (debugMode) {
    console.log(articleHeadlines.length + ' headlines found');
}

const show = debugMode
const browser = await puppeteer.launch({
    headless: ! show,
    args: ['--no-sandbox']
})
const page = await browser.newPage()

for (const articleHeadlineKey in articleHeadlines) {

    /** @type {Headline} articleHeadline */
    const articleHeadline = articleHeadlines[articleHeadlineKey]
    const articleId = sanitize(base64encode(articleHeadline.pubDate))

    if (debugMode) {
        console.log('Headline ' + articleHeadline.title)
        console.log(articleHeadline.link)
    }

    if (hasApi) {
        const headlineSaveResponse = await fetch(apiUrl + '/headline', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                uuid: articleId,
                ...articleHeadline
            })
        })

        if ([409, 500].includes(headlineSaveResponse.status)) {
            if (debugMode) {
                console.log('Headline save response : ' + headlineSaveResponse.status)
            }
            continue
        }
    }

    const articleContentQuery = new ArticleContentQuery(page)

    const articleContent = await articleContentQuery.getArticleContent(articleHeadline.link, debugMode)

    if (debugMode) {
        console.log('Contents ' + articleContent.length)
    }

    if (hasApi) {
        await fetch(apiUrl + '/content', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                uuid: articleId,
                content: articleContent
            })
        })
    }

    if (debugMode) {
        const loggedInFileContent = []
        const cacheFolder = '.' + path.sep + 'cache'
        const articleFilePrefix = cacheFolder + path.sep + articleId

        for (const contentKey in articleContent) {
            const content = articleContent[contentKey]

            if (content.type === 'twitter') {
                const screenshotFileName = articleFilePrefix + '_twitter_' + contentKey + '.png'

                fs.writeFileSync(
                    screenshotFileName,
                    content.screenshot,
                    'base64'
                )

                content.screenshot = screenshotFileName
            }

            loggedInFileContent.push(content)
        }

        const contentJsonStorage = articleFilePrefix + '.json'

        fs.writeFileSync(
            contentJsonStorage,
            JSON.stringify({
                headline: articleHeadline,
                content: loggedInFileContent
            })
        )

        console.log(articleHeadline.link + ' saved !')
    }
}

await browser.close()