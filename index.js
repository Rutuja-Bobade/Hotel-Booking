const express = require("express");
const app = express();
const path = require("path");
const mysql = require('mysql2');


app.use(express.urlencoded({extended:true}));
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"/views"));
app.use(express.static('public'));

const connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    database : 'hotelbooking2',
    password : 'Rutuja@1315'
});

connection.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL');
});

const PORT = 3010;

app.listen(PORT,()=>{
    console.log("Server is listening");
});

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/",(req,res)=>{
    res.redirect(`/login`);
});

app.get("/login",(req,res)=>{
    res.render("login",{message : null});
});

app.post("/login",(req,res)=>{
    const {username, password} = req.body;
    let q=`SELECT * FROM user WHERE username = ?`;
    connection.query(q,[username] , (err, result)=>{
        if (err) throw err;
        if (result.length > 0) {
            const user = result[0];
            if(password == user.password){
                res.redirect(`/user/${user.userid}`);
            }
            else{
                res.render("login", {message : "Invalid username or Password"});
            }
        } else {
            res.render("login", {message : "Invalid username"});
        }
    })
});

app.get("/signup",(req,res)=>{
    res.render("signup",{message:null});
});

app.post("/signup",(req,res)=>{
    let {username, email, password} = req.body;
    let get_user = `SELECT email from user WHERE email = ?`;
    let q = `INSERT INTO user(username,password,email) VALUE(?,?,?)`
    connection.query(get_user,[email],(err,result)=>{
        if (result.length==0){
            connection.query(q, [username,password,email],(err,result_inserted)=>{
                if (err) throw err;
                res.redirect(`/login`);
            })
        }
        else {
            res.render("signup",{message : "Duplicate entry"});
        }
    })
});

app.get("/user/:userid",(req,res)=>{
    const {userid} = req.params;
    let q = `SELECT * FROM user WHERE userid = ?`;
    connection.query(q,[userid],(err,result_user)=>{
        if (err) throw err;
        user = result_user[0];
        res.render("home",{user});
    })
});

app.get("/user/:userid/addhotel",(req,res)=>{
    let {userid}= req.params;
    res.render("addhotel",{userid});
});

app.post("/user/:userid/addhoteldetails",(req,res)=>{
    let {userid} = req.params;
    const {hotelid, name, location, description, ACroomprice, NONACroomprice, couple} = req.body;
    let q = `INSERT INTO hotel(hotelid, name, location, description, ACroomprice, NONACroomprice, couple) VALUE(?,?,?,?,?,?,?)`
    connection.query(q,[hotelid,name,location,description,ACroomprice, NONACroomprice, couple],(err,result_added)=>{
        if (err) throw err;
        res.redirect(`/user/${userid}`);
    })
});

app.get("/user/:userid/viewhotel",(req,res)=>{
    let {userid}= req.params;
    let q = `SELECT * FROM  hotel`;
    connection.query(q,(err,result_hotels)=>{
        if (err) throw err;
        hotels = result_hotels;
        res.render("viewhotel",{userid, hotels});
    })
});


app.post("/user/:userid/hotel/:hotelid",(req,res)=>{
    let {userid, hotelid} = req.params;
    let q = `SELECT * FROM user WHERE userid = ?`;
    let get_hotel = `SELECT * FROM hotel WHERE hotelid = ?`;
    connection.query(q,[userid],(err,result_user)=>{
        if (err) throw err;
        user = result_user[0];
        connection.query(get_hotel,[hotelid],(err, result_hotel)=>{
            if (err) throw err;
            hotel = result_hotel[0];
            res.render("bookhotel",{user,hotel,message : null});
        })
    })
});

app.post("/user/:userid/hotel/:hotelid/book", async (req, res) => {
    const { userid, hotelid } = req.params;
    const { name, checkin, checkout,num_of_people ,ac_rooms, nonac_rooms, couple_rooms } = req.body;
    const acRooms = parseInt(ac_rooms) || 0;
    const nonAcRooms = parseInt(nonac_rooms) || 0;
    const coupleRooms = parseInt(couple_rooms) || 0;
    try {
        let priceQuery = `SELECT ACroomprice, NONACroomprice, couple FROM hotel WHERE hotelid = ?`;
        connection.query(priceQuery, [hotelid], (err, results) => {
            if (err) throw err;
            let ac_price = results[0].ACroomprice;
            let nonac_price = results[0].NONACroomprice;
            let couple_price = results[0].couple;
            ac_price = parseFloat(ac_price) || 0;
            nonac_price = parseFloat(nonac_price) || 0;
            couple_price = parseFloat(couple_price) || 0;
            let total_price = (acRooms * ac_price) + (nonAcRooms * nonac_price) + (coupleRooms * couple_price);
            let insertQuery = `
                INSERT INTO book_hotel (userid, hotelid, name, checkin, checkout, num_of_people,ac_rooms, nonac_rooms, couple_rooms, total_price) 
                VALUES (?, ?, ?, ?, ?,?, ?, ?, ?, ?)
            `;
            connection.query(insertQuery, [userid, hotelid, name, checkin, checkout, num_of_people,acRooms, nonAcRooms, coupleRooms, total_price], (err, result) => {
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).send("Error inserting booking.");
                }
                res.redirect(`/user/${userid}/display`);
                // res.render("bookhotel",{message : "Booking Successful"});
            });
        });
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).send("Server error.");
    }
});


app.get("/calculate-price", (req, res) => {
    let { hotelid, ac_rooms, nonac_rooms, couple_rooms } = req.query;
    let qGetPrice = `SELECT ACroomprice, NONACroomprice, couple FROM hotel WHERE hotelid = ?`;
    connection.query(qGetPrice, [hotelid], (err, result) => {
        if (err) return res.json({ error: err });
        if (result.length === 0) {
            return res.json({ total: 0 });
        }
        let { ACroomprice, NONACroomprice, couple } = result[0];
        let total = (ac_rooms * ACroomprice) + (nonac_rooms * NONACroomprice) + (couple_rooms * couple);
        res.json({ total });
    });
});

app.get("/user/:userid/display", (req, res) => {
    const { userid } = req.params;

    const q = `
        SELECT bh.*, h.name AS hotel_name, h.location 
        FROM book_hotel bh 
        JOIN hotel h ON bh.hotelid = h.hotelid 
        WHERE bh.userid = ?
    `;

    connection.query(q, [userid], (err, results) => {
        if (err) {
            console.error(err);
            return res.send("Error retrieving bookings.");
        }

        res.render("display", { bookings: results });
    });
});

app.get("/user/:userid/display", (req, res) => {
    const { userid } = req.params;

    const q = `
        SELECT bh.*, h.name AS hotel_name, h.location 
        FROM book_hotel bh 
        JOIN hotel h ON bh.hotelid = h.hotelid 
        WHERE bh.userid = ?
    `;

    connection.query(q, [userid], (err, results) => {
        if (err) {
            console.error(err);
            return res.send("Error retrieving bookings.");
        }

        res.render("display", { bookings: results });
    });
});
