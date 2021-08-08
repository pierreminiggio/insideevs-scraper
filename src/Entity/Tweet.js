import TweetAuthor from './TweetAuthor.js';

export default class Tweet {

    /** @type {TweetAuthor} */
    author;

    /** @type {string} */
    content;

    /**
     * @param {TweetAuthor} author
     * @param {string} content
     */
     constructor(author, content) {
        this.author = author;
        this.content = content;
    }
}
