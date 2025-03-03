const connection = require('../data/db');
const { searchSchema, storeImmobiliSchema } = require('../validationSchemas')

const index = (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const sql = `SELECT apartments.*, CAST(ROUND(AVG(R.voto)) AS SIGNED) AS media_voti,
  GROUP_CONCAT(DISTINCT images.url ORDER BY images.id) AS image_urls
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

      const newImagesPath = newImages.map(image => (
        `${req.imagePath}/${image}`
      ))

      return { ...result, image_urls: newImagesPath }
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

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const parsed = searchSchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.format() });
  }

  const { price_min, price_max, city, rooms_min, rooms_max, beds_min, type } = parsed.data;


  let whereClauses = [];
  let params = [];

  if (price_min) {
    whereClauses.push('apartments.prezzo_notte >= ?');
    params.push(price_min);
  }


  if (price_max) {
    whereClauses.push('apartments.prezzo_notte <= ?');
    params.push(price_max);
  }


  if (city) {
    whereClauses.push("SUBSTRING_INDEX(apartments.indirizzo_completo, ', ', -1) = ?");
    params.push(city);
  }


  if (rooms_min) {
    whereClauses.push('apartments.numero_stanze >= ?');
    params.push(rooms_min);
  }


  if (rooms_max) {
    whereClauses.push('apartments.numero_stanze <= ?');
    params.push(rooms_max);
  }

  if (beds_min) {
    whereClauses.push('apartments.numero_letti >= ?');
    params.push(beds_min);
  }

  if (type) {
    whereClauses.push('apartments.tipologia = ?');
    params.push(type);
  }

  let whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

  const sql = `
    SELECT apartments.*, ROUND(AVG(R.voto)) AS media_voti,
    SUBSTRING_INDEX(apartments.indirizzo_completo, ', ', -1) AS citta,
    GROUP_CONCAT(DISTINCT images.url ORDER BY images.id) AS image_urls
    FROM apartments
    LEFT JOIN reviews R ON apartments.id = R.apartments_id
    LEFT JOIN images ON images.apartments_id = apartments.id
    ${whereSql}
    GROUP BY apartments.id
    LIMIT ? OFFSET ?;
  `;

  const countSql = `
    SELECT COUNT(*) AS total FROM apartments 
    ${whereSql};
  `;


  connection.query(sql, [...params, limit, offset], (err, results) => {
    if (err) return res.status(500).json({ error: err });

    const immobili = results.map(result => {

      const newImages = result.image_urls ? result.image_urls.split(',') : [];

      const newImagesPath = newImages.map(image => (
        `${req.imagePath}/${image}`
      ));

      return { ...result, image_urls: newImagesPath };
    });


    connection.query(countSql, params, (err, totalResults) => {
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
  });
};


const show = (req, res) => {
  const id = req.params.id;

  const sql = `SELECT A.*, users.*, languages.*, ROUND(AVG(R.voto)) AS media_voti, GROUP_CONCAT(DISTINCT services.nome_servizio ORDER BY services.id) AS services_list
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

      const correctedImage = allImages.map(image => {
        return { url: `${req.imagePath}/${image.url}` }
      });



      connection.query(sqlReviews, [id], (err, resultsReviews) => {
        if (err) return res.status(500).json({ error: err.message })
        apartments.reviews = resultsReviews.length > 0 ? resultsReviews : [];
        res.json({
          ...apartments,
          image_urls: correctedImage,
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

  const { titolo, descrizione, numero_stanze, numero_letti, numero_bagni, metri_quadri, indirizzo_completo, email, tipologia, prezzo_notte, nome, cognome, numero_telefono } = parsed.data;

  if (!titolo || !descrizione || !numero_stanze || !numero_letti || !numero_bagni || !metri_quadri || !indirizzo_completo || !email || !tipologia || !prezzo_notte || !nome || !cognome || !numero_telefono) {
    return res.status(400).send('Campi obbligatori');
  }

  const insertUserSql = `
    INSERT INTO users (nome, cognome, numero_telefono)
    VALUES (?, ?, ?)
  `;

  connection.query(insertUserSql, [nome, cognome, numero_telefono], (err, userInsertResults) => {
    if (err) return res.status(500).send({ error: err.message });

    const userId = userInsertResults.insertId;


    const sql = `
    INSERT INTO apartments 
    (titolo, descrizione, numero_stanze, numero_letti, numero_bagni, metri_quadri, indirizzo_completo, email, tipologia, prezzo_notte, users_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    connection.query(sql, [titolo, descrizione, numero_stanze, numero_letti, numero_bagni, metri_quadri, indirizzo_completo, email, tipologia, prezzo_notte, userId], (err, results) => {
      if (err) return res.status(500).send({ error: err.message });

      const apartments_id = results.insertId;
      res.json({ message: 'Immobile creato', apartments_id });

    })
  })
}

const storeImages = (req, res) => {
  const { apartments_id } = req.body;

  if (!req.files || req.files.length === 0 || !apartments_id) {
    return res.status(400).json({ error: 'Immagini o apartments_id mancanti' });
  }

  const imagePaths = req.files.map(file => file.filename);

  console.log('Immagini caricate:', imagePaths);
  console.log('ID appartamento:', apartments_id);

  const sql = 'INSERT INTO images (url, apartments_id) VALUES (?, ?)';
  const insertImagePromises = imagePaths.map(imageName => {
    return new Promise((resolve, reject) => {
      connection.query(sql, [imageName, apartments_id], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  });

  Promise.all(insertImagePromises)
    .then(() => {
      res.json({ message: 'Immagini caricate con successo nel database' });
    })
    .catch(err => {
      console.error('Errore nel database:', err);
      res.status(500).json({ error: 'Errore nel salvataggio delle immagini nel database' });
    });
}


const storeReviews = (req, res) => {
  const id = req.params.id

  const { voto, descrizione, nome, cognome } = req.body;

  if (!voto || !descrizione || !nome || !cognome) {
    return res.status(400).json({ error: 'Tutti i campi sono necessari' });
  }

  const sql = 'INSERT INTO reviews (voto, descrizione, nome, cognome, apartments_id) VALUES (?, ?, ?, ?, ?)'

  connection.query(sql, [voto, descrizione, nome, cognome, id], (err, results) => {
    if (err) return res.status(500).json({ error: err })

    res.json({
      message: 'Recensione aggiunta con successo'
    });
  })

}

const getServices = (req, res) => {
  const sql = 'SELECT * FROM services WHERE disponibilità = true';

  connection.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
};

const addServicesToApartment = (req, res) => {
  const apartmentId = req.params.id;
  const { service_ids } = req.body;

  if (!service_ids || !Array.isArray(service_ids)) {
    return res.status(400).json({ error: 'Devi fornire un array di service_ids' });
  }

  const sql = 'INSERT INTO service_apartment (apartments_id, services_id) VALUES (?, ?)';
  const insertPromises = service_ids.map(serviceId => {
    return new Promise((resolve, reject) => {
      connection.query(sql, [apartmentId, serviceId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  });

  Promise.all(insertPromises)
    .then(() => {
      res.json({ message: 'Servizi aggiunti con successo' });
    })
    .catch(err => {
      console.error('Errore nel database:', err);
      res.status(500).json({ error: 'Errore nell\'associazione dei servizi' });
    });
};




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
  getServices,
  addServicesToApartment,
  modify
}