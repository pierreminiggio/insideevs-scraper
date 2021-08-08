import Content from './Content.js';

export default class CaptionedImageContent extends Content {

    /** @type {string} */
    image;

    /** @type {string} */
    caption;

    /**
     * @param {string} image 
     * @param {string} caption 
     */
    constructor(image, caption) {
        super('text')
        this.image = image;
        this.caption = caption;
    }
}
