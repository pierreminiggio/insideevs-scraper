import Content from './Content.js';

export default class EmbedContent extends Content {

    /** @type {string} */
    url;

    /**
     * @param {string} url 
     */
    constructor(url) {
        super('embed')
        this.url = url;
    }
}
