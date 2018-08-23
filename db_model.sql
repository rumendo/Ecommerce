CREATE DATABASE ecommerce;

CREATE TABLE users(
    id          SERIAL PRIMARY KEY,
    email       VARCHAR (100) NOT NULL,
    password    VARCHAR(100) NOT NULL,
    first_name  VARCHAR(50) NOT NULL,
    last_name   VARCHAR(50) NOT NULL,
    address     VARCHAR(100) NOT NULL,
    phone       VARCHAR(50) NOT NULL,
    is_admin    BOOLEAN NOT NULL DEFAULT FALSE,
    createdAt   TIMESTAMP WITH TIME ZONE,
    updatedAt   TIMESTAMP WITH TIME ZONE
);

CREATE TABLE product(
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    price           NUMERIC NOT NULL,
    discount        NUMERIC NOT NULL,
    short_desc      VARCHAR(500) NOT NULL,
    long_desc       TEXT NOT NULL,
    img_path        VARCHAR(200) NOT NULL,
    available_quantity  INT NOT NULL,
    type            VARCHAR(50) NOT NULL,
    manufacturer    VARCHAR(50) NOT NULL,
    is_hidden       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE user_entries(
    id                  SERIAL PRIMARY KEY,
    user_id             INT NOT NULL REFERENCES users(id),
    entry_date_time     TIMESTAMP WITH TIME ZONE,
    entry_ip            VARCHAR(15) NOT NULL
);

CREATE TABLE cart(
    row                 SERIAL PRIMARY KEY,
    user_id             INT NOT NULL REFERENCES users(id),
    product_id          INT NOT NULL REFERENCES product(id),
    product_quantity    INT NOT NULL
);

CREATE TABLE orders(
    row                 SERIAL PRIMARY KEY,
    id                  INT NOT NULL,
    user_id             INT NOT NULL REFERENCES users(id),
    product_id          INT NOT NULL REFERENCES product(id),
    product_quantity    INT NOT NULL,
    address             VARCHAR(100) NOT NULL,
    phone               VARCHAR(50) NOT NULL, 
    status_code         SMALLINT NOT NULL
);

CREATE TABLE category(
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    type        VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL,
    img_path    VARCHAR(200) NOT NULL
);














INSERT INTO product VALUES (3, 'Deemax', 1000, 0, 'Very good wheels.', 'Indestructible wheels!', './public/images/deemax.jpg', 21, 'wheels', 'Mavic', FLASE);
INSERT INTO cart (user_id, product_id, product_quantity) VALUES (2,2,2);
