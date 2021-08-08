import Content from './Content.js';

export default class TitleContent extends Content {

    /** @type {string} */
    content;

    /**
     * @param {string} content 
     */
    constructor(content) {
        super('title')
        this.content = content;
    }
}
