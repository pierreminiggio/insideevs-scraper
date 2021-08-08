import Content from './Content.js';

export default class BlockQuoteContent extends Content {

    /** @type {string} */
    content;

    /**
     * @param {string} content 
     */
    constructor(content) {
        super('block-quote')
        this.content = content;
    }
}
