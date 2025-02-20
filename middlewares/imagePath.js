const setimagePath = (req, res, next) => {
  req.imagePath = `${req.protocol}://${req.get('host')}/img/immobili`

  next()
}

module.exports = setimagePath