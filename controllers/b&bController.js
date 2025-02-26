const connection = require('../data/db');
const { searchSchema, storeImmobiliSchema } = require('../validationSchemas')

const index = (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const sql = `SELECT apartments.*, ROUND(AVG(R.voto)) AS media_voti,
  GROUP_CONCAT(images.url ORDER BY images.id) AS image_urls
  FROM apartments
  LEFT JOIN reviews R ON apartments.id = R.apartments_id
  LEFT JOIN images ON images.apartments_id = apartments.id
  GROUP BY apartments.id
  ORDER BY mi_piace DESC
  LIMIT ? OFFSET ?;`

  connection.query(sql, [limit, offset], (err, results) => {
    if (err) return res.status(500).json({ error: err })

    const immobili = results.map(result => {

      const newImages = result.image_urls ? result.image_urls.split(',') : []

      // const newImagesPath = newImages.map(image => (
      //   `${req.imagePath}/${image}`
      // ))

      return { ...result, image_urls: newImages }
    });

    connection.query(`SELECT COUNT(*) AS total FROM apartments`, (err, totalResults) => {
      if (err) return res.status(500).json({ error: err });

      const total = totalResults[0].total;
      const totalPages = Math.ceil(total / limit);

      res.json({
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        data: immobili
      });

    })
  })
}

const indexSearch = (req, res) => {
  // Validiamo i parametri ricevuti
  const parsed = searchSchema.safeParse(req.query);

  // Se ci sono errori, restituiamo un errore 400 con i dettagli
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.format() });
  }

  const { price_min, price_max, city, rooms_min, rooms_max } = parsed.data;

  // Creiamo la parte della query dinamica in base ai parametri passati
  let whereClauses = [];
  let params = [];

  // Aggiungiamo il filtro sul prezzo minimo
  if (price_min) {
    whereClauses.push('apartments.prezzo_notte >= ?');
    params.push(price_min);
  }

  // Aggiungiamo il filtro sul prezzo massimo
  if (price_max) {
    whereClauses.push('apartments.prezzo_notte <= ?');
    params.push(price_max);
  }

  // Aggiungiamo il filtro sulla città
  if (city) {
    whereClauses.push("SUBSTRING_INDEX(apartments.indirizzo_completo, ', ', -1) = ?");
    params.push(city);
  }

  // Aggiungiamo il filtro sul numero minimo di camere
  if (rooms_min) {
    whereClauses.push('apartments.numero_stanze >= ?');
    params.push(rooms_min);
  }

  // Aggiungiamo il filtro sul numero massimo di camere
  if (rooms_max) {
    whereClauses.push('apartments.numero_stanze <= ?');
    params.push(rooms_max);
  }

  // Se ci sono dei filtri, li aggiungiamo alla query
  let whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

  // Costruisci la query SQL finale
  const sql = `
    SELECT apartments.*, 
    SUBSTRING_INDEX(apartments.indirizzo_completo, ', ', -1) AS citta,
    GROUP_CONCAT(images.url ORDER BY images.id) AS image_urls
    FROM apartments
    LEFT JOIN images ON images.apartments_id = apartments.id
    ${whereSql}
    GROUP BY apartments.id;
  `;

  // Esegui la query con i parametri dinamici
  connection.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err });

    const immobili = results.map(result => {

      const newImages = result.image_urls ? result.image_urls.split(',') : [];

      // const newImagesPath = newImages.map(image => (
      //   `${req.imagePath}/${image}`
      // ));

      return { ...result, image_urls: newImages };
    });

    res.json(immobili);
  });
};


const show = (req, res) => {
  const id = req.params.id;

  const sql = `SELECT A.*, users.*, languages.*, ROUND(AVG(R.voto)) AS media_voti, GROUP_CONCAT(services.nome_servizio ORDER BY services.id) AS services_list
  FROM apartments A
  LEFT JOIN reviews R ON A.id = R.apartments_id
  LEFT JOIN users ON users.id = A.users_id
  LEFT JOIN language_user ON language_user.users_id = users.id
  LEFT JOIN languages ON languages.id = language_user.languages_id
  LEFT JOIN service_apartment ON service_apartment.apartments_id = A.id
  LEFT JOIN services ON services.id = service_apartment.services_id
  WHERE A.id = ?
  GROUP BY A.id, users.id, languages.id;`

  const sqlImage = `SELECT images.url FROM images WHERE apartments_id = ?`

  const sqlReviews = `SELECT * FROM reviews WHERE apartments_id = ?`

  connection.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    if (results.length === 0) return res.status(404).json({ error: 'Immobile non trovato' })

    const apartments = results[0];

    const services = apartments.services_list ? apartments.services_list.split(',') : []

    connection.query(sqlImage, [id], (err, resultsImg) => {
      if (err) return res.status(500).json({ error: err.message })

      const allImages = resultsImg;

      // const correctedImage = allImages.map(image => {
      //   return { url: `${req.imagePath}/${image.url}` }
      // });



      connection.query(sqlReviews, [id], (err, resultsReviews) => {
        if (err) return res.status(500).json({ error: err.message })
        apartments.reviews = resultsReviews.length > 0 ? resultsReviews : [];
        res.json({
          ...apartments,
          image_urls: allImages,
          services_list: services
        })
      })
    })

  })
}

const store = (req, res) => {

  const parsed = storeImmobiliSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.format() });
  }

  const { titolo, descrizione, numero_stanze, numero_letti, numero_bagni, metri_quadri, indirizzo_completo, email, tipologia, prezzo_notte, users_id } = parsed.data;

  if (!titolo || !descrizione || !numero_stanze || !numero_letti || !numero_bagni || !metri_quadri || !indirizzo_completo || !email || !tipologia || !prezzo_notte || !users_id) {
    return res.status(400).send('Campi obbligatori');
  }

  const sql = `
    INSERT INTO apartments 
    (titolo, descrizione, numero_stanze, numero_letti, numero_bagni, metri_quadri, indirizzo_completo, email, tipologia, prezzo_notte, users_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  connection.query(sql, [titolo, descrizione, numero_stanze, numero_letti, numero_bagni, metri_quadri, indirizzo_completo, email, tipologia, prezzo_notte, users_id], (err, results) => {
    if (err) return res.status(500).send({ error: err.message });

    const apartments_id = results.insertId;
    res.status(201).send({ message: 'Immobile creato', apartments_id });
  })
}

const storeImages = (req, res) => {

  const { tipologia, apartments_id } = req.body
  const imageName = req.file.filename;

  if (!imageName || !apartments_id) {
    return res.status(400).json({ error: 'Immagine o apartments_id mancanti' });
  }

  const sql = 'INSERT INTO images (url, tipologia, apartments_id) VALUES (?, ?, ?)'

  connection.query(sql, [imageName, tipologia, apartments_id], (err, results) => {
    if (err) return res.status(500).json({ error: err })

    res.json({
      message: 'Immagini caricate con successo'
    });
  })
}



const storeReviews = (req, res) => {
  const id = req.params.id

  const { voto, descrizione, users_id } = req.body;

  if (!voto || !descrizione || !users_id) {
    return res.status(400).json({ error: 'Tutti i campi sono necessari' });
  }

  const sql = 'INSERT INTO reviews (voto, descrizione, apartments_id, users_id) VALUES (?, ?, ?, ?)'

  connection.query(sql, [voto, descrizione, id, users_id], (err, results) => {
    if (err) return res.status(500).json({ error: err })

    res.json({
      message: 'Recensione aggiunta con successo'
    });
  })

}



const modify = (req, res) => {
  const id = req.body.apartmentsId

  const sql = `UPDATE apartments SET mi_piace = mi_piace + 1 WHERE apartments.id = ?`

  connection.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err })

    res.json({ message: 'Il numero dei like è aumentato di 1' })
  })
}




module.exports = {
  index,
  indexSearch,
  show,
  store,
  storeImages,
  storeReviews,
  modify
}