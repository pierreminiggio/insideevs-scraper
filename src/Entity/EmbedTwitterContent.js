import Content from './Content.js';
import Tweet from './Tweet.js';

export default class EmbedTwitterContent extends Content {

    /** @type {Tweet} */
    main;

    /** @type {Tweet|null} */
    reply;

    /** @type {string} */
    screenshot;

    /**
     * @param {Tweet} main 
     * @param {Tweet|null} reply 
     * @param {string} screenshot 
     */
    constructor(main, reply, screenshot) {
        super('twitter')
        this.main = main;
        this.reply = reply;
        this.screenshot = screenshot;
    }
}
