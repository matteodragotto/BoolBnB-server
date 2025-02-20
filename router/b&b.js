const express = require('express')
const router = express.Router()
const bnbController = require('../controllers/b&bController')

router.get('/', bnbController.index)

router.get('/:id', bnbController.show)

router.post('/', bnbController.store)

router.put('/:id', bnbController.update)

router.patch('/:id', bnbController.modify)

router.delete('/:id', bnbController.destroy)

module.exports = router

