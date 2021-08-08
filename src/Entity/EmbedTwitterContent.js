import Content from './Content.js';
import Tweet from './Tweet.js';

export default class EmbedTwitterContent extends Content {

    /** @type {Tweet} */
    main;

    /** @type {Tweet|null} */
    reply;

    /**
     * @param {Tweet} main 
     * @param {Tweet|null} reply 
     */
    constructor(main, reply) {
        super('twitter')
        this.main = main;
        this.reply = reply;
    }
}
