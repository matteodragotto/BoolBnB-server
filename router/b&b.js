const express = require('express')
const router = express.Router()
const bnbController = require('../controllers/b&bController')


//index
router.get('/', bnbController.index)

router.get('/search', bnbController.indexSearch)

//show
router.get('/:id', bnbController.show)

//store
router.post('/', bnbController.store)
router.post('/immagini', bnbController.storeImages)

router.post('/:id', bnbController.storeReviews);

//modify
router.patch('/:id', bnbController.modify)

module.exports = router

