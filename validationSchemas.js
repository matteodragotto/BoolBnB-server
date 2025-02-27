// validazione searchIndex
const z = require('zod');

const searchSchema = z.object({
    price_min: z.coerce.number()
        .optional()
        .refine(val => val === undefined || (Number(val) >= 1), {
            message: "Il numero massimo di stanze deve essere almeno 1",
        }),

    price_max: z.coerce.number()
        .optional()
        .refine(val => val === undefined || (Number(val) >= 1), {
            message: "Il numero massimo di stanze deve essere almeno 1",
        }),

    city: z.string()
        .min(2, "Il nome della città è troppo corto")
        .max(100, "Il nome della città è troppo lungo")
        .optional(),

    rooms_min: z.coerce.number()
        .optional()
        .refine(val => val === undefined || (Number(val) >= 1), {
            message: "Il numero minimo di stanze deve essere almeno 1",
        }),

    rooms_max: z.coerce.number()
        .optional()
        .refine(val => val === undefined || (Number(val) >= 1), {
            message: "Il numero massimo di stanze deve essere almeno 1",
        }),

    beds_min: z.coerce.number()
        .optional()
        .refine(val => val === undefined || (Number(val) >= 1), {
            message: "Il numero minimo di letti deve essere almeno 1",
        }),
    type: z.string()
        .min(2, "Tipologia troppo corta")
        .max(100, "Tipologia troppo lunga")
        .optional()
});

// validazione rotta store per immobili
const storeImmobiliSchema = z.object({
    id: z.number().positive(),
    titolo: z.string()
        .min(2, "Titolo troppo corto")
        .max(100, "Il titolo è troppo lungo")
        .optional(),

    descrizione: z.string()
        .min(2, "Descrizione troppo corta")
        .max(300, "Descrizione troppo lunga")
        .optional(),

    numero_stanze: z.number()
        .optional()
        .refine(val => val === undefined || (Number(val) >= 1), {
            message: "Il numero minimo di stanze deve essere almeno 1",
        })
        .nullable()
        .default(),

    numero_letti: z.number()
        .optional()
        .refine(val => val === undefined || (Number(val) >= 1), {
            message: "Il numero minimo di stanze deve essere almeno 1",
        })
        .nullable()
        .default(),

    numero_bagni: z.number()
        .optional()
        .refine(val => val === undefined || (Number(val) >= 1), {
            message: "Il numero minimo di stanze deve essere almeno 1",
        })
        .nullable()
        .default(),

    metri_quadri: z.number()
        .optional()
        .refine(val => val === undefined || (Number(val) >= 1), {
            message: "Il numero minimo di stanze deve essere almeno 1",
        })
        .nullable()
        .default(),

    indirizzo_completo: z.string()
        .min(2, "Indirizzo troppo corto")
        .max(200, "Indirizzo troppo lungo")
        .optional(),

    email: z.string()
        .email()
        .optional(),

    tipologia: z.string()
        .min(2, "Tipologia troppo corta")
        .max(100, "Tipologia troppo lunga")
        .optional(),

    prezzo_notte: z.number()
        .optional()
        .refine(val => val === undefined || (Number(val) >= 1), {
            message: "Il numero minimo di stanze deve essere almeno 1",
        })
        .nullable()
        .default(),

    image_urls: z.array(z.string()).optional(),

    mi_piace: z.number()
        .optional()
        .refine(val => val === undefined || (Number(val) >= 0), {
            message: "Il numero minimo di stanze deve essere almeno 0",
        })
        .nullable()
        .default(),
});

module.exports = {
    searchSchema,
    storeImmobiliSchema
}