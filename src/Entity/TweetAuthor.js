export default class TweetAuthor {
    /** @type {string} */
    displayName;

    /** @type {string} */
    handle;

    /**
     * @param {string} displayName
     * @param {string} handle
     */
     constructor(displayName, handle) {
        this.displayName = displayName;
        this.handle = handle;
    }
}
