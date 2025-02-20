const express = require('express')
const router = express.Router()
const bnbController = require('../controllers/b&bController')


//index
router.get('/', bnbController.index)

//show
router.get('/:id', bnbController.show)

//store
router.post('/', bnbController.store)

router.post('/:id', bnbController.storeReviews);

router.post('/UI/registrazione', bnbController.storeInterestedUser)
router.post('/UP/registrazione', bnbController.storeProprietaryUser)



//update
router.put('/:id', bnbController.update)

//modify
router.patch('/:id', bnbController.modify)

//destroy
router.delete('/:id', bnbController.destroy)

module.exports = router

