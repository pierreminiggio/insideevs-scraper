export default class Headline {

    /** @type {string} */
    title;

    /** @type {string} */
    description;

    /** @type {string} */
    link;

    /** @type {string} */
    thumbnail;

    /** @type {string} */
    pubDate;

    /**
     * @param {string} title
     * @param {string} description
     * @param {string} link
     * @param {string} thumbnail
     * @param {string} pubDate
     */
    constructor(title, description, link, thumbnail, pubDate) {
        this.title = title;
        this.description = description;
        this.link = link;
        this.thumbnail = thumbnail;
        this.pubDate = pubDate;
    }
}
