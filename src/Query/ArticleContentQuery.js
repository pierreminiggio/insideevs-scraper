import BlockQuoteContent from '../Entity/BlockQuoteContent.js';
import CaptionedImageContent from '../Entity/CaptionedImageContent.js';
import Content from '../Entity/Content.js';
import EmbedContent from '../Entity/EmbedContent.js';
import EmbedTwitterContent from '../Entity/EmbedTwitterContent.js';
import ImageContent from '../Entity/ImageContent.js';
import TextContent from '../Entity/TextContent.js';
import TitleContent from '../Entity/TitleContent.js';
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
     * @param {boolean} debugMode
     * @return {Promise<Array<Content>>}
     */
    async getArticleContent(articleUrl, debugMode) {
        /** @type {Array<Content>} contents */
        const contents = []
        const page = this.page
        const browser = page.browser()
        
        await page.goto(articleUrl)

        const bodySelector = 'body'
        await page.waitForSelector(bodySelector)

        await page.waitForTimeout(1000)

        const cookiesButtonSelector = '#onetrust-accept-btn-handler'
        const hasAcceptCookiesButton = await page.evaluate(cookiesButtonSelector => {
            return document.querySelector(cookiesButtonSelector) !== null
        }, cookiesButtonSelector)

        if (hasAcceptCookiesButton) {
            await page.click(cookiesButtonSelector)
            await page.waitForTimeout(3000)
        }

        const contentsSelector = '.content-wrapper>.postBody>*'
        const scrapedContents = await page.$$(contentsSelector)

        const doneString = 'done'

        /**
         * @param {import('puppeteer').ElementHandle<Element>} scrapedContent 
         * 
         * @returns {string|undefined}
         */
        const handleScrapedContent = async (scrapedContent) => {
            const tagName = await scrapedContent.evaluate(element => element.tagName)

            if (tagName === 'P') {
                const content = await scrapedContent.evaluate(element => element.innerText)

                if (! content) {
                    return
                }
                
                if (! /\d/.test(content) && ! /[a-zA-Z]/.test(content)) {
                    return
                }

                const classNames = Object.values(await scrapedContent.evaluate(element => element.classList))

                if (classNames.includes('trending-content_header')) {
                    // link to another article, I won't use that
                    return
                }

                if (classNames.includes('meta')) {
                    // Looks like it's an ad, it featured EVANNEX in the meta p's from https://insideevs.com/news/519686/tesla-elon-musk-ai-day/
                    return
                }
                contents.push(new TextContent(content))
                return
            }

            if (tagName === 'SECTION') {
                const classNames = Object.values(await scrapedContent.evaluate(element => element.classList))

                if (classNames.includes('widget_pdf')) { // PDF Title
                    const content = await scrapedContent.evaluate(element => element.innerText)

                    if (! content) {
                        return
                    }

                    if (! /\d/.test(content) && ! /[a-zA-Z]/.test(content)) {
                        return
                    }

                    contents.push(new TextContent(content))
                    return
                }

                if (classNames.includes('embed-item')) {
                    const isTwitter = await scrapedContent.evaluate(
                        element => element.querySelector('.twitter-tweet') !== null
                    )

                    if (isTwitter) {
                        await pushNewTwitterContent(scrapedContent, browser, contents)
                        return
                    }
                }

                if (classNames.includes('relatedContent-new')) {
                    return doneString
                }

                const iframeSelector = 'iframe'
                const iframeSrc = await scrapedContent.evaluate(
                    (element, iframeSelector) => element.querySelector(iframeSelector)?.dataset?.src,
                    iframeSelector
                )

                if (iframeSrc) {
                    contents.push(new EmbedContent(iframeSrc))
                    return
                }

                const attributeNames = Object.values(await scrapedContent.evaluate(element => element.getAttributeNames()))

                if (attributeNames.includes('data-widget')) {

                    const dataWiget = await scrapedContent.evaluate(element => element.getAttribute('data-widget'))

                    if (dataWiget === 'image') {
                        const jpgSourceSelector = 'source[type="image/jpeg"]'

                        const srcSet = await scrapedContent.evaluate(
                            (element, jpgSourceSelector) => element.querySelector(jpgSourceSelector)?.getAttribute('srcset'),
                            jpgSourceSelector
                        )

                        const caption = await scrapedContent.evaluate(element => element.innerText)

                        if (srcSet && caption) {
                            contents.push(new CaptionedImageContent(srcSet, caption))

                            return
                        }
                    }
                    
                    if (dataWiget === 'mosaic') {
                        const mosaicChildren = await scrapedContent.$$(':scope>*')

                        for (const mosaicChildrenKey in mosaicChildren) {
                            const mosaicChild = mosaicChildren[mosaicChildrenKey]

                            const handleMosaicChildResult = handleScrapedContent(mosaicChild)

                            if (handleMosaicChildResult === doneString) {
                                return doneString
                            }
                        }

                        return
                    }
                }
            }

            if (tagName === 'BLOCKQUOTE') {
                const content = await scrapedContent.evaluate(element => element.innerText)

                if (! content) {
                    return
                }

                contents.push(new BlockQuoteContent(content))
                return
            }

            if (tagName === 'H3' || tagName === 'H4') {
                const content = await scrapedContent.evaluate(element => element.innerText)

                if (! content) {
                    return
                }

                contents.push(new TitleContent(content))
                return
            }

            if (tagName === 'DIV') {
                const classNames = Object.values(await scrapedContent.evaluate(element => element.classList))

                if (
                    classNames.includes('adgrid-ad-target')
                    || classNames.includes('adgrid-ad-container')
                ) {
                    return; // Ads
                }

                if (classNames.includes('table-wrapper')) {
                    const imgSelector = 'img'
                    const hasImg = await scrapedContent.evaluate((element, imgSelector) => element.querySelector(imgSelector) !== null, imgSelector)

                    const caption = await scrapedContent.evaluate(element => element.innerText)

                    if (hasImg) {
                        const imgSrc = await scrapedContent.evaluate((element, imgSelector) => element.querySelector(imgSelector).src, imgSelector)
                        contents.push(new CaptionedImageContent(imgSrc, caption))

                        return
                    }

                    const content = caption

                    if (! content) {
                        return
                    }

                    if (! /\d/.test(content) && ! /[a-zA-Z]/.test(content)) {
                        return
                    }

                    contents.push(new TextContent(content))

                    return
                }

                if (classNames.includes('content-header')) {
                    const content = await scrapedContent.evaluate(element => element.innerText)

                    if (! content) {
                        return
                    }

                    contents.push(new TitleContent(content))
                    return
                }

                if (classNames.includes('msnt-photo-thumb-gallery')) {
                    const imageSrc = await scrapedContent.evaluate(element => {
                        const source = element.querySelector('source')

                        if (source) {
                            return
                        }

                        return source.dataset?.srcset || source.getAttribute('srcset')
                    })

                    if (! imageSrc) {
                        return
                    }

                    contents.push(new ImageContent(imageSrc))
                    return
                }

                if (classNames.includes('wrapper-related-item')) {
                    // link to another article, I won't use that
                    return
                }

                
                const divInnerHTML = (await scrapedContent.evaluate(element => element.innerHTML)).replace('&nbsp;', ' ').trim()

                if (! divInnerHTML) {
                    // Empty div, whatever
                    return
                }

                const isTwitter = await scrapedContent.evaluate(
                    element => element.querySelector('.twitter-tweet') !== null
                )

                if (isTwitter) {
                    await pushNewTwitterContent(scrapedContent, browser, contents)
                    return
                }

                if (classNames.includes('twitter-tweet') && classNames.includes('twitter-tweet-rendered')) { // WTF is that weird paragraph class name ?
                    const content = await scrapedContent.evaluate(element => element.innerText)

                    if (! content) {
                        return
                    }

                    if (! /\d/.test(content) && ! /[a-zA-Z]/.test(content)) {
                        return
                    }

                    contents.push(new TextContent(content))
                    return
                }

                if (debugMode) {
                    console.log('unknown div')
                    console.log(classNames)
                    console.log(divInnerHTML)
                    await page.waitForTimeout(90000)
                } else {
                    throw new Error('unknown div with classes ' + (classNames.join()) + ', inner HTML : ' + divInnerHTML)
                }
            }

            if (tagName === 'UL' || tagName === 'OL') {
                const lis = await scrapedContent.$$('li')
                
                for (const liIndex in lis) {
                    const li = lis[liIndex]

                    const liContent = await li.evaluate(element => element.innerText)

                    if (! liContent) {
                        return
                    }

                    contents.push(new TextContent('- ' + liContent))
                }

                return
            }

            if (debugMode) {
                console.log('unknown tag')
                console.log(tagName)
                console.log(await scrapedContent.evaluate(element => element.outerHTML))
                await page.waitForTimeout(90000)
            } else {
                throw new Error('unknown tag ' + tagName + ', outer HTML : ' + await scrapedContent.evaluate(element => element.outerHTML))
            }
        }

        for (const scrapedContentKey in scrapedContents) {
            const scrapedContent = scrapedContents[scrapedContentKey]
            const handleResult = await handleScrapedContent(scrapedContent)

            if (handleResult === 'break') {
                break;
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

/**
 * @param {import('puppeteer').ElementHandle<Element>} scrapedContent
 * @param {import('puppeteer').Browser} browser
 * @param {Array<Content>} contents
 * 
 * @returns {void} 
 */
const pushNewTwitterContent = async (scrapedContent, browser, contents) => {
    const iframeSelector = 'iframe'

    let twitterSrc = null
    do {
        twitterSrc = await scrapedContent.evaluate(
            (element, iframeSelector) => element.querySelector(iframeSelector)?.src,
            iframeSelector
        )
    } while (! twitterSrc)

    if (! twitterSrc) {
        return
    }

    const twitterPage = await browser.newPage()
    await twitterPage.goto(twitterSrc)

    const articleSelector = 'article'
    await twitterPage.waitForSelector(articleSelector)
    await twitterPage.waitForTimeout(3000)

    const {width, height} = await twitterPage.evaluate(() => {
        const container = document.querySelector('#app>div>div>div:not(:empty)')

        return {width: container.offsetWidth, height: container.offsetHeight}
    })

    const screenshotBuffer = await twitterPage.screenshot({
        captureBeyondViewport: true,
        clip: {x: 0, y: 0, width, height}
    })

    const binaryBuffer = screenshotBuffer.toString('base64')
    
    if (binaryBuffer === 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAAtJREFUGJVj+A8EAAn7A\/1Xn9bZAAAAAElFTkSuQmCC') {
        console.log(twitterSrc)
        console.error(await twitterPage.evaluate(() => document.head.outerHTML + document.body.outerHTML))
        throw new Error('Twitter screenshot is blank')
    }

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
}
