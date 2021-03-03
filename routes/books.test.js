process.env.NODE_ENV = "test"

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let book_isbn;
let testBook;


beforeEach( async () => {
  let result = await db.query(`
    INSERT INTO 
      books (isbn, amazon_url, author, language, pages, publisher, title, year)   
      VALUES(
        '0486661105', 
        'https://amazon.com/blahblah', 
        'Rutherford Aris', 
        'English', 
        286,  
        'Dover Publications, inc.', 
        'Vectors, Tensors, and the Basic Equations of Fluid Mechanics', 1962) 
      RETURNING isbn, amazon_url, author, language, pages, publisher, title, year`);
  
  testBook = result.rows[0];    
});

afterEach(async function () {
  await db.query("DELETE FROM BOOKS");
});


describe("POST /books", () => {
  test("Successfully creates a new book when all required JSON variables are provided", async () => {
    const response = await request(app)
      .post(`/books`)
      .send({
        isbn: '9780805390216',
        amazon_url: "https://wwww.amazon.com/Calculus-Manifolds",
        author: "Michael Spivak",
        language: "english",
        pages: 114,
        publisher: "W.A Benjamin, inc.",
        title: "Calculus On Manifolds",
        year: 1965
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.book).toEqual({
      isbn: '9780805390216',
      amazon_url: 'https://wwww.amazon.com/Calculus-Manifolds',
      author: 'Michael Spivak',
      language: 'english',
      pages: 114,
      publisher: 'W.A Benjamin, inc.',
      title: 'Calculus On Manifolds',
      year: 1965
    })
  });

  test("Fails to create a new book and responds with a 400 error when JSON data is missing", async () => {
    const response = await request(app)
      .post(`/books`)
      .send({year: 2000});
    expect(response.statusCode).toBe(400);
    expect(response.body.error.error).toEqual([
      "instance requires property \"isbn\"", 
      "instance requires property \"author\"", 
      "instance requires property \"language\"", 
      "instance requires property \"pages\"", 
      "instance requires property \"title\""
    ]);
  });
});


describe("GET /books", () => {
  test("Retrieves a list of books containing 1 book when ", async () => {
    const response = await request(app).get(`/books`);

    expect(response.body.books).toHaveLength(1);

    expect(response.body.books[0].isbn).toEqual(testBook.isbn);
    expect(response.body.books[0].amazon_url).toEqual(testBook.amazon_url);
    expect(response.body.books[0].author).toEqual(testBook.author);
    expect(response.body.books[0].language).toEqual(testBook.language);
    expect(response.body.books[0].pages).toEqual(testBook.pages);
    expect(response.body.books[0].publisher).toEqual(testBook.publisher);
    expect(response.body.books[0].title).toEqual(testBook.title);
    expect(response.body.books[0].year).toEqual(testBook.year);
  });
});


describe("GET /books/:isbn", () => {
  test("Retrieves abook by the specified isbn when the isbn is valid and in the database", async () => {
    const response = await request(app)
      .get(`/books/${testBook.isbn}`)
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.isbn).toBe(testBook.isbn);
  });

  test("Responds with 404 error message when the isbn is not contained in the database", async () => {
    const response = await request(app)
      .get(`/books/0`)
    expect(response.statusCode).toBe(404);
    expect(response.body.error.message).toEqual("There is no book with an isbn 0");
  });
});


describe("PUT /books/:id", () => {
  test("Updates a single book", async function () {
    const response = await request(app)
      .put(`/books/${testBook.isbn}`)
      .send({
        amazon_url: 'https://amazon.com/blahblahNEW',
        author: 'Rutherford Aris',
        language: "english",
        pages: 143,
        publisher: 'Dover Publications, inc.',
        title: 'Vectors, Tensors, and the Basic Equations of Fluid Mechanics, NEW',
        year: 1967
      });

    expect(response.body.book).toEqual({
      isbn: '0486661105',
      amazon_url: 'https://amazon.com/blahblahNEW',
      author: 'Rutherford Aris',
      language: 'english',
      pages: 143,
      publisher: 'Dover Publications, inc.',
      title: 'Vectors, Tensors, and the Basic Equations of Fluid Mechanics, NEW',
      year: 1967
    });
  });

  test("Fails to update a preexisting book and returns a 400 error when the isbn is passed as JSON", async () => {
    const response = await request(app)
      .put(`/books/${testBook.isbn}`)
      .send({
        isbn: '0486661105',
        amazon_url: 'https://amazon.com/blahblahNEW',
        author: 'Rutherford Aris',
        language: 'english',
        pages: 143,
        publisher: 'Dover Publications, inc.',
        title: 'Vectors, Tensors, and the Basic Equations of Fluid Mechanics, NEW',
        year: 1967
      });
 
    expect(response.statusCode).toEqual(400);
    expect(response.body.error.error).toEqual('isbn already exists');
  });
  test("Fails to update a preexisting book and returns a 400 error when there is missing JSON", async () => {
    const response = await request(app)
      .put(`/books/${testBook.isbn}`)
      .send({
        author: 'Rutherford Aris',
        language: 'english',
        pages: 143,
        publisher: 'Dover Publications, inc.',
        year: 1967
    });
 
    expect(response.statusCode).toEqual(400);
    expect(response.body.error.error[0]).toEqual('instance requires property \"title\"');
  });
});


describe("DELETE /books/:isbn", () => {
  test("Successfully Deletes a book when a valid book isbn is passed as a parameter", async () => {
    const response = await request(app)
      .delete(`/books/${testBook.isbn}`)
    expect(response.body).toEqual({message: "Book deleted"});
  });
});


afterAll(async function () {
  await db.end()
});
