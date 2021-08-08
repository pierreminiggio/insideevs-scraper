import Content from '../Entity/Content.js';
import EmbedTwitterContent from '../Entity/EmbedTwitterContent.js';
import TextContent from '../Entity/TextContent.js';
import Tweet from '../Entity/Tweet.js';
import TweetAuthor from '../Entity/TweetAuthor.js';

export default class ArticleContentQuery {

    /** @type {import('puppeteer').Page} */
    page;

    /**
     * @param {import('puppeteer').Page} page 
     */
    constructor(page) {
        this.page = page
    }

    /**
     * @param {string} articleUrl
     * @return {Promise<Array<Content>>}
     */
    async getArticleContent(articleUrl) {
        /** @type {Array<Content>} contents */
        const contents = []
        const page = this.page
        const browser = page.browser()
        
        await page.goto(articleUrl)

        const bodySelector = 'body'
        await page.waitForSelector(bodySelector)

        const cookiesButtonSelector = '#onetrust-accept-btn-handler'
        const hasAcceptCookiesButton = await page.evaluate(cookiesButtonSelector => {
            return document.querySelector(cookiesButtonSelector) !== null
        }, cookiesButtonSelector)

        if (hasAcceptCookiesButton) {
            await page.click(cookiesButtonSelector)
        }

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
                                (element, iframeSelector) => element.querySelector(iframeSelector)?.src,
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

                        const screenshotBuffer = await twitterPage.screenshot({
                            fullPage: true,
                            captureBeyondViewport: true
                        })
                        const binaryBuffer = screenshotBuffer.toString('base64')

                        const mainTweetSelectorIfReply = articleSelector + '>article'
                        const hasReply = await twitterPage.evaluate(mainTweetSelectorIfReply => {
                            return document.querySelector(mainTweetSelectorIfReply) !== null
                        }, mainTweetSelectorIfReply)

                        const mainTweetSelector = hasReply ? mainTweetSelectorIfReply : articleSelector

                        const mainTweetContainerSelector = hasReply ? (mainTweetSelector + '>a+div>div+div') : articleSelector
                        const mainTweetAuthorLinkSelector = mainTweetContainerSelector + (hasReply ? ' a' : '>a+div>a+div>a')
                        const mainTweetAuthor = await getAuthorDisplayNameAndHandle(twitterPage, mainTweetAuthorLinkSelector)

                        const mainTweetContentSelector = mainTweetContainerSelector + '>div+div>div'
                        const mainTweetContent = await twitterPage.evaluate(getInnerTweetText, mainTweetContentSelector)

                        const mainTweet = new Tweet(mainTweetAuthor, mainTweetContent)

                        let replyTweet = null

                        if (hasReply) {
                            const replyTweetSelector = mainTweetSelector + '+div>div>a'
                            const replyTweetAuthor = await getAuthorDisplayNameAndHandle(twitterPage, replyTweetSelector)
                            const replyTweetContentSelector = mainTweetSelector + '+div+div>div'
                            const replyTweetContent = await twitterPage.evaluate(getInnerTweetText, replyTweetContentSelector)

                            replyTweet = new Tweet(replyTweetAuthor, replyTweetContent)
                        }

                        contents.push(new EmbedTwitterContent(mainTweet, replyTweet, binaryBuffer))

                        await twitterPage.close()
                        continue
                    }
                }
            }
        }

        return contents
    }
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

/**
 * @param {import('puppeteer').Page} twitterPage 
 * @param {string} authorLinkSelector 
 * 
 * @returns {Promise<TweetAuthor>}
 */
const getAuthorDisplayNameAndHandle = async (twitterPage, authorLinkSelector) => {
    const displayNameSelector = authorLinkSelector + '>div>div'
    const displayName = await twitterPage.evaluate(displayNameSelector => {
        return document.querySelector(displayNameSelector).innerText
    }, displayNameSelector)

    const authorHandleSelector = authorLinkSelector + '>div>div+div'
    const authorHandle = await twitterPage.evaluate(authorHandleSelector => {
        return document.querySelector(authorHandleSelector).innerText
    }, authorHandleSelector)

    return new TweetAuthor(displayName, authorHandle)
}
