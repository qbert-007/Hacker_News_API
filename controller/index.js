const axios = require('axios')
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 15 * 60 });

module.exports = {
    fetchTopStories: async function (req, res) {
        try {
            const resp = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty')
            if (Array.isArray(resp.data) && resp.data.length > 0) {
                const stories = []
                for (storyId of resp.data.slice(0, 10)) {
                    const story = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${storyId}.json`)
                    stories.push(story.data)
                }
                stories.sort((obj1, obj2) => {
                    return obj1.score - obj2.score
                })
                const result = []
                stories.forEach((obj) => {
                    result.push({
                        title: obj.title,
                        URL: obj.url,
                        score: obj.score,
                        "time of submission": obj.time,
                        user: obj.by
                    })
                })
                myCache.set('top-stories', stories);
                res.json(result)
            } else {
                res.json({})
            }
        } catch (err) {
            res.json({ msg: 'Something went wrong!!' })
        }
    },
    fetchPastStories: function (req, res) {
        const stories = myCache.get('top-stories');
        if (stories) {
            res.json(stories);
        } else {
            res.status(404).send('Stories not found');
        }
    },
    fetchComments: async function (req, res) {
        const storyId = req.params.id;
        try {
            const cachedComments = myCache.get(`comments-${storyId}`);
            if (cachedComments) {
                console.log('Serving comments from cache');
                return res.json(cachedComments);
            }

            const commentsResponse = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${storyId}.json?print=pretty`);
            const comments = commentsResponse.data.kids || [];

            const commentDetails = await Promise.all(comments.map(async (commentId) => {
                const commentResponse = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${commentId}.json`);
                return commentResponse.data;
            }));

            const sortedComments = commentDetails
                .filter((comment) => comment && comment.text && comment.by)
                .sort((a, b) => (b.kids ? b.kids.length : 0) - (a.kids ? a.kids.length : 0))
                .slice(0, 10)
                .map((comment) => ({
                    text: comment.text,
                    user: comment.by
                }));

            myCache.set(`comments-${storyId}`, sortedComments);
            res.json(sortedComments);
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    }
}



