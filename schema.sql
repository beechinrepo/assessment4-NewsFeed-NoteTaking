drop database if exists myApp;

create database myApp;

use myApp;

create table users (
    username varchar(128) not null,
    password varchar(128) not null,
    email varchar(128) not null,
    avatar varchar(128) default 'man1.png',
    created timestamp default current_timestamp,  -- YYYY-MM-DD HH:MM:SS
    
    primary key(username)
);

create table categories (
    catId varchar(128) not null,
    category varchar(128) not null,
    colorCode varchar(128) not null,
    photo varchar(128),

    primary key(catId)
);

create table entries (
    entryId int auto_increment,
    photo varchar(128),
    title varchar(128) not null,
    catId varchar(128) not null,
    username varchar(128) not null,
    created timestamp default current_timestamp,
    primary key(entryId),
    constraint catId
        foreign key(catId) references categories(catId),
    constraint fk_username
        foreign key(username) references users(username)
);

create table deleted_entries (
    entryId int auto_increment,
    photo varchar(128),
    title varchar(128) not null,
    catId varchar(128) not null,
    username varchar(128) not null,
    created timestamp default current_timestamp,
    primary key(entryId),
    constraint catId1
        foreign key(catId) references categories(catId),
    constraint fk_username1
        foreign key(username) references users(username)
);

-- database : myApp
-- collection : entryDescription

-- db.entryDescription.insert({
--     entryId: <entryId>,
--     entryDescription: <entryDescription>
-- })

-- db.entryDescription.createIndex({  
--     entryDescription: “text”
-- })


