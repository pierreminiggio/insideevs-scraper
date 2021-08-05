export default class Headline {

    /** @type {string} */
    title;

    /** @type {string} */
    description;

    /** @type {string} */
    link;

    /** @type {string} */
    thumbnail;

    /**
     * @param {string} title
     * @param {string} description
     * @param {string} link
     * @param {string} thumbnail
     */
    constructor(title, description, link, thumbnail) {
        this.title = title;
        this.description = description;
        this.link = link;
        this.thumbnail = thumbnail;
    }
}
