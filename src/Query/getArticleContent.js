import puppeteer from 'puppeteer';
import Content from '../Entity/Content.js';
import TextContent from '../Entity/TextContent.js';

/**
 * @param {string} articleUrl
 * @param {boolean} show
 * @return {Promise<Array<Content>>}
 */

export default async function getArticleContent(articleUrl, show) {
    /** @type {Array<Content>} contents */
    const contents = []
    const browser = await puppeteer.launch({
        headless: ! show,
        args: ['--no-sandbox']
    })
    const page = await browser.newPage()
    await page.goto(articleUrl)

    const cookiesButtonSelector = '#onetrust-accept-btn-handler'
    await page.waitForSelector(cookiesButtonSelector)
    await page.click(cookiesButtonSelector)

    const contentsSelector = '.content-wrapper>.postBody>*'
    const scrapedContents = await page.$$(contentsSelector)

    for (const scrapedContentKey in scrapedContents) {
        const scrapedContent = scrapedContents[scrapedContentKey]
        const tagName = await scrapedContent.evaluate(element => element.tagName)

        if (tagName === 'P') {
            const content = await scrapedContent.evaluate(element => element.innerText)
            contents.push(new TextContent(content))
            continue
        }

        if (tagName === 'SECTION') {
            const classNames = Object.values(await scrapedContent.evaluate(element => element.classList))

            if (classNames.includes('embed-item')) {
                const isTwitter = await scrapedContent.evaluate(
                    element => element.querySelector('.twitter-tweet') !== null
                )

                if (isTwitter) {
                    const iframeSelector = 'iframe'

                    let twitterSrc = null
                    do {
                       twitterSrc = await scrapedContent.evaluate(
                            (element, iframeSelector) => element.querySelector('iframe')?.src,
                            iframeSelector
                        )
                    } while (! twitterSrc)


                    if (! twitterSrc) {
                        continue
                    }

                    const twitterPage = await browser.newPage()
                    await twitterPage.goto(twitterSrc)

                    const articleSelector = 'article'
                    await twitterPage.waitForSelector(articleSelector)

                    const mainTweetSelectorIfReply = articleSelector + '>article'
                    const hasReply = await twitterPage.evaluate(mainTweetSelectorIfReply => {
                        return document.querySelector(mainTweetSelectorIfReply) !== null
                    }, mainTweetSelectorIfReply)

                    const mainTweetSelector = hasReply ? mainTweetSelectorIfReply : articleSelector

                    const mainTweetContainerSelector = hasReply ? (mainTweetSelector + '>a+div>div+div') : articleSelector
                    const mainTweetAuthorLinkSelector = mainTweetContainerSelector + hasReply ? ' a' : '>a+div>a+div>a'
                    const mainTweetAuthorDisplayNameSelector = mainTweetAuthorLinkSelector + '>div>div'
                    const mainTweetAuthorDisplayName = await twitterPage.evaluate(mainTweetAuthorDisplayNameSelector => {
                        return document.querySelector(mainTweetAuthorDisplayNameSelector).innerText
                    }, mainTweetAuthorDisplayNameSelector)

                    const mainTweetAuthorHandleSelector = mainTweetAuthorLinkSelector + '>div>div+div'
                    const mainTweetAuthorHandle = await twitterPage.evaluate(mainTweetAuthorHandleSelector => {
                        return document.querySelector(mainTweetAuthorHandleSelector).innerText
                    }, mainTweetAuthorHandleSelector)

                    const mainTweetContentSelector = mainTweetContainerSelector + '>div+div'
                    const mainTweetContent = await twitterPage.evaluate(getInnerTweetText, mainTweetContentSelector)

                    console.log(mainTweetAuthorDisplayName)
                    console.log(mainTweetAuthorHandle)
                    console.log(mainTweetContent)

                    if (hasReply) {
                        // TODO GET REPLY INFOS
                    }

                    await twitterPage.waitForTimeout(3000)
                    // await twitterPage.waitForTimeout(90000)
                    // await twitterPage.waitForTimeout(90000)
                    // await twitterPage.waitForTimeout(90000)
                    await twitterPage.close()
                    continue
                }
            }
        }
    }
    // console.log(contents)


    // await page.waitForTimeout(90000)
    // await page.waitForTimeout(90000)
    // await page.waitForTimeout(90000)
    await browser.close()

    return contents
}

/**
 * @param {string} tweetSelector
 * @return {string}
 */
const getInnerTweetText = tweetSelector => {
    return new DOMParser().parseFromString(document.querySelector(tweetSelector).innerHTML.split('<img alt="').map((imgSplit, imgSplitIndex) => {
        if (imgSplitIndex % 2 === 0) {
            return imgSplit
        }

        const splitOnQuotes = imgSplit.split('"')

        const altEnd = splitOnQuotes.shift()

        const splitOnClose = splitOnQuotes.join('"').split('>')
        splitOnClose.shift()

        return altEnd + splitOnClose.join('>')
    }).join(''), "text/html") . documentElement . textContent
}