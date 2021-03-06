const express = require("express");
const Book = require("../models/book");
const jsonSchema = require("jsonschema");
const newBookSchema = require("../schemas/newBookSchema");
const updateBookSchema = require("../schemas/updateBookSchema");

const router = new express.Router();


/* GET / => {books: [book, ...]}  */
router.get("/", async (req, res, next) => {
  try {
    const books = await Book.findAll(req.query);
    return res.json({ books });
  } catch (err) {
    return next(err);
  }
});

/* GET /[id]  => {book: book} */
router.get("/:id", async (req, res, next) => {
  try {
    const book = await Book.findOne(req.params.id);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
});

/* POST /   bookData => {book: newBook}  */
router.post("/", async (req, res, next) => {
  try {
    const result = jsonSchema.validate(req.body, newBookSchema);

    if (!result.valid){
      return next({
        status: 400,
        error: result.errors.map(e => e.stack) 
      });
    }
    const book = await Book.create(req.body);
    
    return res.status(201).json({ book: book });
  } catch (err) {
    return next(err);
  }
});

/* PUT /[isbn]   bookData => {book: updatedBook}  */
router.put("/:isbn", async (req, res, next) => {
  try {
    if (req.body.isbn){
      return next({
        status: 400,
        error: "isbn already exists" 
      }); 
    }
    const result = jsonSchema.validate(req.body, updateBookSchema);
    if (!result.valid){
      return next({
        status: 400,
        error: result.errors.map(e => e.stack) 
      });
    }
    const book = await Book.update(req.params.isbn, req.body);
    return res.json({ book: book });
  } catch (err) {
    return next(err);
  }
});

/* DELETE /[isbn]   => {message: "Book deleted"} */
router.delete("/:isbn", async (req, res, next) => {
  try {
    await Book.remove(req.params.isbn);
    return res.json({ message: "Book deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
