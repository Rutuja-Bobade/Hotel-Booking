use hotelbooking2;
CREATE TABLE user (userid int auto_increment ,username varchar(50), password varchar(50), email varchar(50), primary key(userid));

CREATE TABLE hotel (
id int auto_increment, 
hotelid int, 
name varchar(20), 
location varchar(255), 
description varchar(255), 
ACroomprice float, 
NONACroomprice float, 
couple float,primary key(id));

CREATE TABLE book_hotel (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    userid INT,
    hotelid INT,
    name VARCHAR(255),
    checkin DATE,
    checkout DATE,
    num_of_people int,
    ac_rooms INT,
    nonac_rooms INT,
    couple_rooms INT,
    total_price DECIMAL(10,2)
);


Select * from user;
Select * from book_hotel;
Select * from hotel;