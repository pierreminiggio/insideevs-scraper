import fetch from 'node-fetch'
import cheerio from 'cheerio'
import Headline from '../Entity/Headline.js'

/**
 * @return {Promise<Array<Headline>>}
 */
export default async function getLatestHeadlines() {

    const rssResponse = await fetch('https://insideevs.com/rss/category/elon-musk/')
    const rssResponseText = await rssResponse.text()

    const $ = cheerio.load(rssResponseText, {xmlMode: true})
    const items = $('item')

    /** @type {Array<Headline>} articles */
    const articles = []

    items.each((itemKey, item) => {

        let title
        let description
        let pubDate
        let link
        let thumbnail

        item.children.forEach(itemChild => {
            if (itemChild.name === 'title') {
                title = itemChild.children[0].data
                return
            }

            if (itemChild.name === 'description') {
                description = itemChild.children[0].children[0].data
                return
            }

            if (itemChild.name === 'pubDate') {
                pubDate = itemChild.children[0].data
                return
            }

            if (itemChild.name === 'link') {
                link = itemChild.children[0].data.split('?')[0]
                return
            }

            if (itemChild.name === 'enclosure') {
                thumbnail = itemChild.attribs.url.replace('/s6/', '/s1/')
            }

        })

        articles.push(new Headline(title, description, link, thumbnail, pubDate))
    })

    return articles.reverse();
}