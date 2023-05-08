const express = require('express')
const router = express.Router()
const controller = require('../controller')

router.get('/top-stories', controller.fetchTopStories)

router.get('/past-stories', controller.fetchPastStories)

router.get('/comments/:id', controller.fetchComments)

module.exports = router


