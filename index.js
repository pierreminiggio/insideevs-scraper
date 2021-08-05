import fetch from 'node-fetch'
import cheerio from 'cheerio'

const rssResponse = await fetch('https://insideevs.com/rss/category/elon-musk/')
const rssResponseText = await rssResponse.text()

const $ = cheerio.load(rssResponseText, {xmlMode: true})
const items = $('item')

const articles = []

items.each((itemKey, item) => {

    let title
    let description
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

        if (itemChild.name === 'link') {
            link = itemChild.children[0].data.split('?')[0]
            return
        }

        if (itemChild.name === 'enclosure') {
            thumbnail = itemChild.attribs.url.replace('/s6/', '/s1/')
            return
        }

    })

    articles.push({title, description, link, thumbnail})
})

console.log(articles)