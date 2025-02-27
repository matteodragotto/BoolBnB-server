const express = require('express')
const router = express.Router()
const bnbController = require('../controllers/b&bController')
const upload = require('../middlewares/multer')


//index
router.get('/', bnbController.index)

router.get('/search', bnbController.indexSearch)

//show
router.get('/:id', bnbController.show)

//store
router.post('/', bnbController.store)

router.post('/immagini', upload.array('url', 10), bnbController.storeImages)

router.post('/:id', bnbController.storeReviews);

//modify
router.patch('/:id', bnbController.modify)

module.exports = router

