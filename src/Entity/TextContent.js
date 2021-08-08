import Content from './Content.js';

export default class TextContent extends Content {

    /** @type {string} */
    content;

    /**
     * @param {string} content 
     */
    constructor(content) {
        super('text')
        this.content = content;
    }
}
