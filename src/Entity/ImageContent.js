import Content from './Content.js';

export default class ImageContent extends Content {

    /** @type {string} */
    image;

    /**
     * @param {string} image 
     */
    constructor(image) {
        super('image')
        this.image = image;
    }
}
